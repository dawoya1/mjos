# MJOS API Documentation

## Overview

MJOS provides multiple interfaces for interaction:

1. **Programmatic API** - Direct TypeScript/JavaScript usage
2. **REST API** - HTTP endpoints for web integration
3. **CLI API** - Command-line interface
4. **SDK API** - Multi-language software development kits

## Core Modules

### Memory System
- `store(content, tags, importance)` - Store memory
- `retrieve(id)` - Retrieve memory by ID
- `query(query)` - Query memories
- `getStats()` - Get memory statistics

### Knowledge Graph
- `add(knowledge)` - Add knowledge item
- `query(query)` - Search knowledge
- `getStats()` - Get knowledge statistics

### Team Management
- `createTask(title, description)` - Create new task
- `assignTask(taskId, memberId)` - Assign task
- `getTeamStats()` - Get team statistics

### Agent Management
- `createAgent(definition)` - Create new agent
- `assignTaskToAgent(taskId, agentId)` - Assign task to agent
- `getAgent(agentId)` - Get agent information

## REST API Endpoints

### System
- `GET /api/v1/status` - System status
- `GET /api/v1/health` - Health check

### Memory
- `POST /api/v1/memory/store` - Store memory
- `GET /api/v1/memory/:id` - Get memory
- `POST /api/v1/memory/query` - Query memories

### Tasks
- `POST /api/v1/team/tasks` - Create task
- `GET /api/v1/team/tasks` - List tasks
- `GET /api/v1/team/members` - List team members

### Agents
- `POST /api/v1/agents` - Create agent
- `GET /api/v1/agents/:id` - Get agent
- `POST /api/v1/agents/assign` - Assign task to agent

## CLI Commands

### System
- `mjos status` - Show system status
- `mjos start` - Start MJOS system
- `mjos stop` - Stop MJOS system

### Memory
- `mjos memory store <content>` - Store memory
- `mjos memory query` - Query memories
- `mjos memory stats` - Memory statistics

### Team
- `mjos team members` - List team members
- `mjos team tasks` - List tasks
- `mjos team create-task` - Create new task

## SDK Usage

### TypeScript/JavaScript
```typescript
import { MJOS } from 'mjos';
const mjos = new MJOS();
await mjos.start();
```

### Python
```python
from mjos_sdk import MJOSSDK
sdk = MJOSSDK()
```

### Java
```java
import com.mjos.MJOSSDK;
MJOSSDK sdk = new MJOSSDK();
```

For detailed API reference, see the generated TypeDoc documentation.