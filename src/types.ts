/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Agent Framework — Type Definitions
 */

export interface AgentConfig {
  name: string;
  model: string;
  tools?: ToolDefinition[];
  memory?: "ephemeral" | "persistent";
  maxIterations?: number;
  temperature?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  handler: ToolHandler;
}

export interface ParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
}

export type ToolHandler = (params: Record<string, unknown>) => Promise<string>;

export interface TeamConfig {
  agents: AgentConfig[];
  strategy?: "sequential" | "parallel" | "collaborative";
}

export interface TaskResult {
  output: string;
  agentName: string;
  toolCalls: ToolCall[];
  iterations: number;
  duration: number;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: string;
  timestamp: string;
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
