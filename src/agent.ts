/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Agent Framework — Agent Core
 */

import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig, TaskResult, ToolDefinition, ToolCall, AgentMessage } from "./types";

export class Agent {
  readonly name: string;
  private model: string;
  private tools: ToolDefinition[];
  private memory: "ephemeral" | "persistent";
  private maxIterations: number;
  private temperature: number;
  private messages: AgentMessage[] = [];
  private client: Anthropic;

  constructor(config: AgentConfig | string, options?: Partial<AgentConfig>) {
    if (typeof config === "string") {
      this.name = config;
      this.model = options?.model || "claude-sonnet-4-20250514";
      this.tools = options?.tools || [];
      this.memory = options?.memory || "ephemeral";
      this.maxIterations = options?.maxIterations || 10;
      this.temperature = options?.temperature || 0.7;
    } else {
      this.name = config.name;
      this.model = config.model;
      this.tools = config.tools || [];
      this.memory = config.memory || "ephemeral";
      this.maxIterations = config.maxIterations || 10;
      this.temperature = config.temperature || 0.7;
    }
    this.client = new Anthropic();
  }

  async run(task: string): Promise<TaskResult> {
    const startTime = Date.now();
    const toolCalls: ToolCall[] = [];
    let iterations = 0;
    let output = "";

    this.messages.push({ role: "user", content: task });

    const anthropicTools = this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: "object" as const,
        properties: tool.parameters,
      },
    }));

    while (iterations < this.maxIterations) {
      iterations++;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        temperature: this.temperature,
        system: `You are ${this.name}, an autonomous AI agent. Use available tools to complete tasks.`,
        messages: this.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find((b) => b.type === "text");
        output = textBlock && "text" in textBlock ? textBlock.text : "";
        this.messages.push({ role: "assistant", content: output });
        break;
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
        for (const block of toolUseBlocks) {
          if (block.type === "tool_use") {
            const tool = this.tools.find((t) => t.name === block.name);
            if (tool) {
              const result = await tool.handler(block.input as Record<string, unknown>);
              toolCalls.push({
                tool: block.name,
                input: block.input as Record<string, unknown>,
                output: result,
                timestamp: new Date().toISOString(),
              });
              this.messages.push({ role: "user", content: `Tool result (${block.name}): ${result}` });
            }
          }
        }
      }
    }

    return {
      output,
      agentName: this.name,
      toolCalls,
      iterations,
      duration: Date.now() - startTime,
    };
  }
}
