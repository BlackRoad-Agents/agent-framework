/**
 * BlackRoad OS, Inc. — Proprietary and Confidential
 * Agent Framework — Multi-Agent Team Coordination
 */

import { Agent } from "./agent";
import type { AgentConfig, TaskResult } from "./types";

export class Team {
  private agents: Agent[];
  private strategy: "sequential" | "parallel" | "collaborative";

  constructor(agents: (Agent | AgentConfig)[], strategy?: "sequential" | "parallel" | "collaborative") {
    this.agents = agents.map((a) => (a instanceof Agent ? a : new Agent(a)));
    this.strategy = strategy || "collaborative";
  }

  async collaborate(task: string): Promise<TaskResult[]> {
    switch (this.strategy) {
      case "sequential":
        return this.runSequential(task);
      case "parallel":
        return this.runParallel(task);
      case "collaborative":
        return this.runCollaborative(task);
    }
  }

  private async runSequential(task: string): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    let currentTask = task;
    for (const agent of this.agents) {
      const result = await agent.run(currentTask);
      results.push(result);
      currentTask = `Previous agent (${result.agentName}) output: ${result.output}\n\nContinue the task: ${task}`;
    }
    return results;
  }

  private async runParallel(task: string): Promise<TaskResult[]> {
    return Promise.all(this.agents.map((agent) => agent.run(task)));
  }

  private async runCollaborative(task: string): Promise<TaskResult[]> {
    // Phase 1: All agents analyze in parallel
    const analyses = await Promise.all(
      this.agents.map((agent) => agent.run(`Analyze this task and provide your approach: ${task}`)),
    );

    // Phase 2: Synthesize with the first agent
    const synthesis = analyses.map((r) => `[${r.agentName}]: ${r.output}`).join("\n\n");
    const finalResult = await this.agents[0].run(
      `Based on team analysis:\n${synthesis}\n\nProvide the final consolidated result for: ${task}`,
    );

    return [...analyses, finalResult];
  }
}
