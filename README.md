# BlackRoad Agent Framework

**Build autonomous AI agents with tools, memory, and reasoning**

## Features

- **Tool Use**: Connect agents to external APIs and systems
- **Memory**: Long-term and short-term memory management
- **Reasoning**: Chain-of-thought and ReAct patterns
- **Multi-Agent**: Coordinate teams of specialized agents

## Quick Start

```python
from blackroad_agents import Agent, Tool

# Define tools
@Tool
def search_web(query: str) -> str:
    """Search the web for information."""
    return web_search(query)

@Tool  
def execute_code(code: str) -> str:
    """Execute Python code safely."""
    return sandbox_exec(code)

# Create agent
agent = Agent(
    name="research-assistant",
    model="claude-sonnet-4-20250514",
    tools=[search_web, execute_code],
    memory="persistent"
)

# Run task
result = await agent.run("Research the latest AI papers on agents")
```

## Agent Types

| Type | Use Case | Tools |
|------|----------|-------|
| Research | Information gathering | search, read, summarize |
| Coding | Code generation | execute, test, deploy |
| Data | Analysis tasks | query, visualize, export |
| DevOps | Infrastructure | ssh, kubectl, terraform |

## Memory Systems

- **Short-term**: Conversation context (last N messages)
- **Long-term**: Vector store (persistent knowledge)
- **Episodic**: Task history and learnings

## Multi-Agent Coordination

```python
from blackroad_agents import Team

team = Team([
    Agent("researcher", tools=[search]),
    Agent("coder", tools=[execute]),
    Agent("reviewer", tools=[analyze])
])

result = await team.collaborate("Build a web scraper")
```

---

*BlackRoad OS - 30,000 Agents Ready*
