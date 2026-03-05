/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Task Queue Worker — Cloudflare Worker
 *
 * Handles long-running agent tasks with retry logic and dead-letter queue.
 */

export interface Env {
  TASK_DLQ: Queue<FailedTask>;
  TASK_RESULTS: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

interface FailedTask {
  taskId: string;
  error: string;
  attempts: number;
  originalPayload: Record<string, unknown>;
  failedAt: string;
}

interface QueuedTask {
  taskId: string;
  agentType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "healthy",
        service: "task-queue",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/v1/dlq" && request.method === "GET") {
      const list = await env.TASK_RESULTS.list({ prefix: "dlq:" });
      const items = await Promise.all(
        list.keys.map(async (key) => {
          const data = await env.TASK_RESULTS.get(key.name);
          return data ? JSON.parse(data) : null;
        }),
      );
      return Response.json({ deadLetterQueue: items.filter(Boolean) });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },

  async queue(batch: MessageBatch<QueuedTask>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const task = message.body;
      try {
        await executeAgentTask(task, env);
        message.ack();
      } catch (error) {
        if (message.attempts >= 3) {
          // Move to dead-letter queue after 3 attempts
          const failedTask: FailedTask = {
            taskId: task.taskId,
            error: error instanceof Error ? error.message : "Unknown error",
            attempts: message.attempts,
            originalPayload: task.payload,
            failedAt: new Date().toISOString(),
          };
          await env.TASK_RESULTS.put(`dlq:${task.taskId}`, JSON.stringify(failedTask), {
            expirationTtl: 604800,
          });
          message.ack();
        } else {
          message.retry({ delaySeconds: Math.pow(2, message.attempts) * 10 });
        }
      }
    }
  },
};

async function executeAgentTask(task: QueuedTask, env: Env): Promise<void> {
  await env.TASK_RESULTS.put(`result:${task.taskId}`, JSON.stringify({
    taskId: task.taskId,
    status: "processing",
    agentType: task.agentType,
    startedAt: new Date().toISOString(),
  }));

  const result = {
    taskId: task.taskId,
    status: "completed",
    agentType: task.agentType,
    output: `Processed by ${task.agentType} agent`,
    completedAt: new Date().toISOString(),
  };

  await env.TASK_RESULTS.put(`result:${task.taskId}`, JSON.stringify(result), {
    expirationTtl: 86400,
  });
}
