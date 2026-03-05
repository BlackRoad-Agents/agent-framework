/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Agent Framework — Tool System
 */

import type { ToolDefinition, ToolHandler, ParameterSchema } from "./types";

/**
 * Decorator-style tool definition for use with Agent
 */
export function Tool(
  target: ToolHandler,
  context?: { name?: string },
): ToolDefinition {
  return {
    name: context?.name || target.name,
    description: "",
    parameters: {},
    handler: target,
  };
}

/**
 * Define a tool with full configuration
 */
export function defineTool(config: {
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  handler: ToolHandler;
}): ToolDefinition {
  return {
    name: config.name,
    description: config.description,
    parameters: config.parameters,
    handler: config.handler,
  };
}
