# Visual Workflow Builder Integration

## Overview

This document describes the complete integration of the visual workflow builder with the Chrome extension, backend APIs, and agent orchestration system.

## Implementation Summary

### 1. Backend API Enhancements

#### New Endpoints

**GET `/api/v2/executions/:id/status`**
- Returns real-time execution status for polling
- Includes progress percentage based on completed tasks
- Provides duration and error information

**GET `/api/v2/executions/:id/logs`**
- Returns detailed execution logs
- Includes task-level logging with timestamps
- Provides error traces for debugging

**Existing Enhanced Endpoints**
- `POST /api/v2/workflows` - Create workflows
- `GET /api/v2/workflows` - List workflows  
- `POST /api/v2/execute` - Execute workflows directly
- `POST /api/v2/workflows/:id/execute` - Execute specific workflow
- `GET /api/v2/executions/:id` - Get execution details
- `GET /api/v2/executions/:id/tasks` - Get execution tasks

### 2. Visual Workflow Builder Enhancement

#### New Features

**Execute Button**
- Converts visual nodes to backend workflow format
- Creates workflow if not already saved
- Executes workflow via `/api/v2/workflows/:id/execute`
- Displays real-time execution status with progress bar

**JWT Authentication**
- Reads token from `localStorage.authToken`
- Includes token in all API requests
- Prompts user to login if token missing

**Real-time Status Polling**
- Polls `/api/v2/executions/:id/status` every second
- Updates progress bar and status message
- Automatically fetches logs on completion/failure

**Execution Results Display**
- Shows execution status (pending, running, completed, failed)
- Displays progress percentage
- Shows error messages if execution fails
- Expandable logs section with detailed task logs

**Execution History Panel**
- Slide-in panel showing past executions
- Displays workflow name, timestamp, and status
- Click to view execution details

**Node Connection Functionality**
- Visual connection between nodes (rendered with D3.js)
- Connection state management
- Automatic connection rendering

**JSON Import/Export**
- Export workflow as JSON file (includes nodes and connections)
- Import workflow from JSON file
- Backend-compatible format conversion

**Save to Backend**
- Saves workflow to backend via `/api/v2/workflows`
- Stores workflow ID for future executions
- Converts visual nodes to backend task format

#### Workflow Format Conversion

Visual Builder Nodes → Backend Workflow Format:

```javascript
// Visual Node
{
  id: 'node-1',
  type: 'navigate',
  params: { url: 'https://example.com' }
}

// Backend Task
{
  name: 'navigate',
  agent_type: 'browser',
  action: 'navigate',
  parameters: { url: 'https://example.com' }
}
```

Node Type Mappings:
- `navigate` → `navigate` action
- `click` → `click` action
- `fill` → `type` action
- `extract` → `getText` action
- `wait` → `wait` action
- `condition` → `evaluate` action

### 3. Chrome Extension Integration

#### New Builder Tab

**Features:**
- "Open Builder" button - Opens workflow builder in new tab
- "New Workflow" button - Opens blank workflow builder
- "Load Workflow" button - Loads first workflow from backend

**Updated Save Button:**
- Saves workflow to backend via `/api/v2/workflows`
- Creates proper workflow definition from text description
- Stores workflow ID in local history

**Execute Button Enhancement:**
- Uses backend API for execution
- Polls for execution status
- Updates history with execution results

**History Tab:**
- Shows workflows saved to backend
- Displays execution status
- Click to load workflow

### 4. Workflow Format Standardization

All workflow sources now produce compatible formats:

1. **Visual Builder** → Converts nodes to tasks
2. **Templates** → Already in task format
3. **Recording** → Converts recorded actions to tasks
4. **Manual JSON** → Direct task format

Common workflow structure:
```json
{
  "name": "Workflow Name",
  "description": "Description",
  "definition": {
    "tasks": [
      {
        "name": "task-name",
        "agent_type": "browser",
        "action": "navigate",
        "parameters": { "url": "https://example.com" }
      }
    ],
    "variables": {},
    "on_error": "stop"
  }
}
```

### 5. Testing

Created comprehensive test suite in `tests/workflow-builder.test.ts`:

- Backend API endpoint tests
- Workflow format conversion tests
- Execution flow tests
- Chrome extension integration tests
- Visual builder feature tests

All tests passing ✅

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Visual Workflow Builder                  │
│  (public/workflow-builder.html)                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Node Library │  │    Canvas    │  │  Properties  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Execute | Save | Export | Import | History          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
                     JWT Auth Token
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend API Routes                       │
│  (src/routes/automation.ts)                                 │
│                                                              │
│  POST   /api/v2/workflows          - Create workflow        │
│  GET    /api/v2/workflows          - List workflows         │
│  POST   /api/v2/execute            - Execute immediately    │
│  POST   /api/v2/workflows/:id/execute - Execute workflow    │
│  GET    /api/v2/executions/:id/status - Poll status         │
│  GET    /api/v2/executions/:id/logs   - Get logs            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Workflow & Orchestration Services               │
│                                                              │
│  WorkflowService            OrchestrationEngine             │
│  - createWorkflow()         - executeWorkflow()             │
│  - getWorkflow()            - getExecution()                │
│  - listWorkflows()          - getExecutionTasks()           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Agent Registry                          │
│                                                              │
│  Browser Agent | Storage Agent | Email Agent | RSS Agent    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Chrome Extension                           │
│  (chrome-extension/popup/)                                  │
│                                                              │
│  ┌─────────┬─────────┬──────────┬─────────┬──────────┐     │
│  │ Execute │ Builder │Templates │ History │ Settings │     │
│  └─────────┴─────────┴──────────┴─────────┴──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Usage Guide

### Creating a Workflow in Visual Builder

1. **Open the Builder**
   - Navigate to `http://localhost:3000/workflow-builder.html`
   - Or use Chrome extension → Builder tab → Open Builder

2. **Add Nodes**
   - Click node types from the library (left panel)
   - Nodes appear on canvas
   - Drag nodes to position them

3. **Configure Nodes**
   - Click a node to select it
   - Edit properties in right panel
   - Enter parameters (URL, selector, etc.)

4. **Connect Nodes (Optional)**
   - Visual connections are displayed
   - Execution order follows node sequence

5. **Save Workflow**
   - Click "Save" to store in backend
   - Workflow gets unique ID
   - Available for later execution

6. **Execute Workflow**
   - Click "Execute" button
   - Watch real-time progress
   - View logs on completion

### Executing from Chrome Extension

1. **Open Extension**
   - Click extension icon in browser

2. **Builder Tab**
   - Click "Open Builder" to create visual workflows
   - Or use "Load Workflow" to edit existing

3. **Execute Tab**
   - Enter workflow description
   - Click "Execute Workflow"
   - Watch status polling
   - View results

4. **History Tab**
   - See past executions
   - Click to view details

## API Examples

### Create and Execute Workflow

```javascript
// 1. Create workflow
const workflow = {
  name: "Google Search",
  description: "Search Google for Workstation",
  definition: {
    tasks: [
      {
        name: "navigate",
        agent_type: "browser",
        action: "navigate",
        parameters: { url: "https://google.com" }
      },
      {
        name: "search",
        agent_type: "browser",
        action: "type",
        parameters: { 
          selector: 'input[name="q"]',
          text: "Workstation"
        }
      }
    ],
    variables: {},
    on_error: "stop"
  }
};

const createRes = await fetch('/api/v2/workflows', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(workflow)
});

const { data: { id: workflowId } } = await createRes.json();

// 2. Execute workflow
const execRes = await fetch(`/api/v2/workflows/${workflowId}/execute`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ variables: {} })
});

const { data: { id: executionId } } = await execRes.json();

// 3. Poll status
const pollStatus = async () => {
  const statusRes = await fetch(`/api/v2/executions/${executionId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { data: { status, progress } } = await statusRes.json();
  console.log(`Status: ${status}, Progress: ${progress}%`);
  
  if (status === 'completed' || status === 'failed') {
    // Get logs
    const logsRes = await fetch(`/api/v2/executions/${executionId}/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data: { logs } } = await logsRes.json();
    console.log('Logs:', logs);
  } else {
    setTimeout(pollStatus, 1000);
  }
};

pollStatus();
```

## Security

- **JWT Authentication**: All API endpoints require valid JWT token
- **Token Storage**: Tokens stored in localStorage (client-side)
- **Rate Limiting**: Execution endpoints have rate limits
- **Input Validation**: All workflow inputs validated on backend

## Performance

- **Status Polling**: 1 second intervals (configurable)
- **Timeout**: Default 2 minute timeout for executions
- **Retry**: Automatic task retry on failure (configurable)
- **Caching**: Workflow definitions cached in memory

## Future Enhancements

1. **Real-time WebSocket Updates**: Replace polling with WebSocket
2. **Workflow Templates**: Pre-built workflow templates
3. **Workflow Versioning**: Save multiple versions
4. **Collaborative Editing**: Multi-user workflow editing
5. **Workflow Marketplace**: Share workflows with community
6. **Advanced Node Types**: Loop, conditional, parallel nodes
7. **Workflow Scheduling**: Cron-based execution
8. **Workflow Analytics**: Execution metrics and insights

## Troubleshooting

### "Token not found" Error
- Ensure you're logged in
- Check localStorage for `authToken` key
- Try refreshing the page

### Execution Stuck in "Running"
- Check execution logs for errors
- Verify agent is properly configured
- Check network connectivity

### Nodes Not Connecting
- Ensure D3.js is loaded
- Check browser console for errors
- Verify connections array is populated

### Workflow Not Saving
- Verify JWT token is valid
- Check network tab for API errors
- Ensure backend is running

## Files Modified

### Backend
- `src/routes/automation.ts` - Added status and logs endpoints
- `src/automation/orchestrator/engine.ts` - No changes needed
- `src/automation/workflow/service.ts` - No changes needed

### Frontend
- `public/workflow-builder.html` - Added execute, auth, history features
- `public/css/workflow-builder.css` - Added styles for new components

### Chrome Extension
- `chrome-extension/popup/index.html` - Added Builder tab
- `chrome-extension/popup/script.js` - Added Builder tab handlers
- `chrome-extension/background.js` - No changes needed (already had execute)

### Tests
- `tests/workflow-builder.test.ts` - New test suite

## Conclusion

The visual workflow builder is now fully integrated with:
✅ Backend API with real-time status and logging
✅ JWT authentication and security
✅ Chrome extension with Builder tab
✅ Workflow format standardization
✅ Comprehensive test coverage

Users can now:
✅ Create workflows visually
✅ Save workflows to backend
✅ Execute workflows with real-time feedback
✅ View execution history and logs
✅ Use workflows from builder, templates, or recording
✅ Access all features from Chrome extension
