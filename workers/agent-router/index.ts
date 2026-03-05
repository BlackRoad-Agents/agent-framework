/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Agent Router — Cloudflare Worker
 *
 * Routes incoming requests to the appropriate agent handler.
 * Supports long-running tasks via Durable Objects.
 */

export interface Env {
  AGENT_TASKS: DurableObjectNamespace;
  TASK_QUEUE: Queue<TaskMessage>;
  AGENT_KV: KVNamespace;
  STRIPE_SECRET_KEY: string;
  ANTHROPIC_API_KEY: string;
}

interface TaskMessage {
  taskId: string;
  agentType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface AgentRequest {
  agent: string;
  task: string;
  tools?: string[];
  memory?: "ephemeral" | "persistent";
  webhook?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        service: "agent-router",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    }

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // API routes
    if (url.pathname === "/api/v1/agents/run" && request.method === "POST") {
      return handleAgentRun(request, env, ctx);
    }

    if (url.pathname.startsWith("/api/v1/tasks/") && request.method === "GET") {
      const taskId = url.pathname.split("/").pop();
      return handleTaskStatus(taskId!, env);
    }

    if (url.pathname === "/api/v1/tasks" && request.method === "GET") {
      return handleListTasks(env);
    }

    if (url.pathname === "/api/v1/stripe/webhook" && request.method === "POST") {
      return handleStripeWebhook(request, env);
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },

  async queue(batch: MessageBatch<TaskMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const task = message.body;
      try {
        await processTask(task, env);
        message.ack();
      } catch (error) {
        message.retry({ delaySeconds: 30 });
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanupStaleTasks(env));
  },
};

async function handleAgentRun(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const apiKey = request.headers.get("X-API-Key") || request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!apiKey) {
    return Response.json({ error: "Unauthorized — API key required" }, { status: 401 });
  }

  let body: AgentRequest;
  try {
    body = await request.json() as AgentRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.agent || !body.task) {
    return Response.json({ error: "Missing required fields: agent, task" }, { status: 400 });
  }

  const taskId = crypto.randomUUID();
  const task: TaskMessage = {
    taskId,
    agentType: body.agent,
    payload: {
      task: body.task,
      tools: body.tools || [],
      memory: body.memory || "ephemeral",
      webhook: body.webhook,
    },
    createdAt: new Date().toISOString(),
  };

  // Store task metadata
  await env.AGENT_KV.put(`task:${taskId}`, JSON.stringify({
    ...task,
    status: "queued",
  }), { expirationTtl: 86400 });

  // Enqueue for async processing
  ctx.waitUntil(env.TASK_QUEUE.send(task));

  return Response.json({
    taskId,
    status: "queued",
    message: "Agent task has been queued for processing",
  }, { status: 202 });
}

async function handleTaskStatus(taskId: string, env: Env): Promise<Response> {
  const data = await env.AGENT_KV.get(`task:${taskId}`);
  if (!data) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
  return Response.json(JSON.parse(data));
}

async function handleListTasks(env: Env): Promise<Response> {
  const list = await env.AGENT_KV.list({ prefix: "task:" });
  const tasks = await Promise.all(
    list.keys.map(async (key) => {
      const data = await env.AGENT_KV.get(key.name);
      return data ? JSON.parse(data) : null;
    }),
  );
  return Response.json({ tasks: tasks.filter(Boolean) });
}

async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  // Process webhook — billing events for agent usage
  const body = await request.text();
  await env.AGENT_KV.put(`stripe:webhook:${Date.now()}`, body, {
    expirationTtl: 604800, // 7 days
  });

  return Response.json({ received: true });
}

async function processTask(task: TaskMessage, env: Env): Promise<void> {
  await env.AGENT_KV.put(`task:${task.taskId}`, JSON.stringify({
    ...task,
    status: "processing",
    startedAt: new Date().toISOString(),
  }));

  try {
    // Agent execution placeholder — connects to Claude API
    const result = { output: `Task ${task.taskId} processed by ${task.agentType} agent` };

    await env.AGENT_KV.put(`task:${task.taskId}`, JSON.stringify({
      ...task,
      status: "completed",
      result,
      completedAt: new Date().toISOString(),
    }));

    // Fire webhook if configured
    const webhook = task.payload.webhook as string | undefined;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.taskId, status: "completed", result }),
      });
    }
  } catch (error) {
    await env.AGENT_KV.put(`task:${task.taskId}`, JSON.stringify({
      ...task,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      failedAt: new Date().toISOString(),
    }));
  }
}

async function cleanupStaleTasks(env: Env): Promise<void> {
  const list = await env.AGENT_KV.list({ prefix: "task:" });
  const now = Date.now();
  for (const key of list.keys) {
    const data = await env.AGENT_KV.get(key.name);
    if (data) {
      const task = JSON.parse(data);
      const age = now - new Date(task.createdAt).getTime();
      if (age > 86400000 && task.status === "processing") {
        await env.AGENT_KV.put(key.name, JSON.stringify({
          ...task,
          status: "timed_out",
          timedOutAt: new Date().toISOString(),
        }));
      }
    }
  }
}
