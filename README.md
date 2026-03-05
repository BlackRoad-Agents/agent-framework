# BlackRoad Agent Framework

**Build autonomous AI agents with tools, memory, and reasoning**

> **Proprietary Software** — BlackRoad OS, Inc. See [LICENSE](LICENSE) for terms.

[![CI](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/ci.yml)
[![Deploy](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/deploy.yml/badge.svg)](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/deploy.yml)
[![Security](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/security.yml/badge.svg)](https://github.com/BlackRoad-OS/agent-framework/actions/workflows/security.yml)

## Features

- **Tool Use** — Connect agents to external APIs and systems
- **Memory** — Long-term and short-term memory management
- **Reasoning** — Chain-of-thought and ReAct patterns
- **Multi-Agent** — Coordinate teams of specialized agents
- **Cloudflare Workers** — Long-running tasks via edge compute
- **Stripe Billing** — Usage-based billing for agent execution

## Quick Start

```bash
npm install
npm run build
```

### Create an Agent

```typescript
import { Agent, defineTool } from "@blackroad-os/agent-framework";

// Define tools
const searchWeb = defineTool({
  name: "search_web",
  description: "Search the web for information",
  parameters: {
    query: { type: "string", description: "Search query", required: true },
  },
  handler: async (params) => {
    const response = await fetch(`https://api.search.example/q=${params.query}`);
    return await response.text();
  },
});

const executeCode = defineTool({
  name: "execute_code",
  description: "Execute Python code safely in a sandbox",
  parameters: {
    code: { type: "string", description: "Python code to execute", required: true },
  },
  handler: async (params) => {
    return `Executed: ${params.code}`;
  },
});

// Create agent
const agent = new Agent({
  name: "research-assistant",
  model: "claude-sonnet-4-20250514",
  tools: [searchWeb, executeCode],
  memory: "persistent",
});

// Run task
const result = await agent.run("Research the latest AI papers on agents");
console.log(result.output);
```

### Multi-Agent Teams

```typescript
import { Agent, Team } from "@blackroad-os/agent-framework";

const team = new Team([
  new Agent({ name: "researcher", model: "claude-sonnet-4-20250514", tools: [searchWeb] }),
  new Agent({ name: "coder", model: "claude-sonnet-4-20250514", tools: [executeCode] }),
  new Agent({ name: "reviewer", model: "claude-sonnet-4-20250514" }),
]);

const results = await team.collaborate("Build a web scraper for news articles");
```

## Agent Types

| Type | Use Case | Tools |
|------|----------|-------|
| Research | Information gathering | search, read, summarize |
| Coding | Code generation & execution | execute, test, deploy |
| Data | Analysis & visualization | query, visualize, export |
| DevOps | Infrastructure management | ssh, kubectl, terraform |

## Memory Systems

| System | Persistence | Use Case |
|--------|------------|----------|
| Ephemeral | Session only | Short conversations |
| Persistent | Long-term | Knowledge accumulation |
| Episodic | Task history | Learning from past tasks |

## API — Cloudflare Workers

The framework deploys as Cloudflare Workers for async agent execution.

### Run an Agent Task

```bash
curl -X POST https://agent-router.blackroad.ai/api/v1/agents/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "agent": "research",
    "task": "Analyze competitive landscape for AI agent frameworks",
    "tools": ["search_web", "summarize"],
    "memory": "persistent",
    "webhook": "https://your-app.com/webhook/agent-complete"
  }'
```

### Check Task Status

```bash
curl https://agent-router.blackroad.ai/api/v1/tasks/{taskId} \
  -H "X-API-Key: $API_KEY"
```

## Architecture

```
┌──────────────────────────────────────────────────┐
│                 Agent Framework                   │
├──────────────┬───────────────┬───────────────────┤
│   Agent Core │  Tool System  │  Team Coordinator │
├──────────────┴───────────────┴───────────────────┤
│              Cloudflare Workers                   │
│  ┌─────────────┐  ┌───────────┐  ┌────────────┐ │
│  │ Agent Router │  │ Task Queue│  │ Scheduler  │ │
│  └─────────────┘  └───────────┘  └────────────┘ │
├──────────────────────────────────────────────────┤
│  Stripe Billing │ KV Storage │ Durable Objects   │
└──────────────────────────────────────────────────┘
```

## Deployment

### Platforms

| Platform | Purpose | Config |
|----------|---------|--------|
| Cloudflare Workers | Agent execution, task queues | `wrangler.toml` |
| Vercel | Dashboard, API gateway | `vercel.json` |
| Railway | Background services | `railway.json` |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `VERCEL_TOKEN` | Deploy | Vercel deployment token |
| `RAILWAY_TOKEN` | Deploy | Railway deployment token |

### Deploy Commands

```bash
# Cloudflare Workers
npm run deploy:production

# Staging
npm run deploy:staging

# Local development
npm run dev
```

## CI/CD Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| **CI** | Push/PR to main | Lint, Type Check, Test, Build |
| **Deploy** | Push to main | Build, Cloudflare, Vercel, Railway, Verify |
| **Security** | Push/PR + Weekly | Audit, CodeQL, Secrets Scan, License Check |
| **Cloudflare Workers** | Changes to workers/ | Test Workers, Deploy Router, Deploy Queue |
| **Automerge** | Dependabot PRs | Auto-approve & merge patch/minor updates |

## Security

- All GitHub Actions pinned to specific commit hashes (supply-chain security)
- CodeQL static analysis on every push
- TruffleHog secrets scanning
- Dependency auditing with `npm audit`
- License compliance checking
- CODEOWNERS enforced reviews

See [SECURITY.md](.github/SECURITY.md) for vulnerability reporting.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Local worker dev
npm run dev
```

## License

**Proprietary** — BlackRoad OS, Inc. All Rights Reserved.

This software is not open source. See [LICENSE](LICENSE) for the full proprietary license terms.

Copyright (c) 2024-2026 BlackRoad OS, Inc.

---

*BlackRoad OS — 30,000 Agents Ready*
