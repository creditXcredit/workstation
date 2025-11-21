/**
 * API Bridge for Workstation Backend
 * Connects Chrome Extension to all backend agents and services
 */

export class WorkstationAPIBridge {
  constructor(baseUrl = 'http://localhost:3000', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.wsConnection = null;
    this.eventListeners = new Map();
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set base URL
   */
  setBaseUrl(url) {
    this.baseUrl = url;
    // Reconnect WebSocket if active
    if (this.wsConnection) {
      this.disconnectWebSocket();
      this.connectWebSocket();
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // ============ AGENT MANAGEMENT ============

  /**
   * Get all agents
   */
  async getAllAgents() {
    return this.request('/api/agents');
  }

  /**
   * Get specific agent details
   */
  async getAgent(agentId) {
    return this.request(`/api/agents/${agentId}`);
  }

  /**
   * Start an agent
   */
  async startAgent(agentId) {
    return this.request(`/api/agents/${agentId}/start`, { method: 'POST' });
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId) {
    return this.request(`/api/agents/${agentId}/stop`, { method: 'POST' });
  }

  /**
   * Get agent statistics
   */
  async getAgentStatistics(agentId) {
    return this.request(`/api/agents/${agentId}/statistics`);
  }

  /**
   * Get system overview
   */
  async getSystemOverview() {
    return this.request('/api/agents/system/overview');
  }

  /**
   * Create agent task
   */
  async createAgentTask(agentId, type, payload, priority = 5) {
    return this.request('/api/agents/tasks', {
      method: 'POST',
      body: JSON.stringify({ agentId, type, payload, priority })
    });
  }

  /**
   * Get agent tasks
   */
  async getAgentTasks(agentId, limit = 50) {
    return this.request(`/api/agents/${agentId}/tasks?limit=${limit}`);
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId) {
    return this.request(`/api/agents/tasks/${taskId}`);
  }

  // ============ WORKFLOW MANAGEMENT ============

  /**
   * Get all workflows
   */
  async getWorkflows(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/workflows${query ? '?' + query : ''}`);
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId) {
    return this.request(`/api/workflows/${workflowId}`);
  }

  /**
   * Create new workflow
   */
  async createWorkflow(workflow) {
    return this.request('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow)
    });
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, updates) {
    return this.request(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(workflowId) {
    return this.request(`/api/workflows/${workflowId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, variables = {}) {
    return this.request(`/api/v2/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ variables })
    });
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/workflows/${workflowId}/executions${query ? '?' + query : ''}`);
  }

  // ============ EXECUTION MANAGEMENT ============

  /**
   * Get execution details
   */
  async getExecution(executionId) {
    return this.request(`/api/v2/executions/${executionId}`);
  }

  /**
   * Get execution tasks
   */
  async getExecutionTasks(executionId) {
    return this.request(`/api/v2/executions/${executionId}/tasks`);
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(executionId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v2/executions/${executionId}/logs${query ? '?' + query : ''}`);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId) {
    return this.request(`/api/v2/executions/${executionId}/cancel`, {
      method: 'POST'
    });
  }

  /**
   * Retry execution
   */
  async retryExecution(executionId) {
    return this.request(`/api/v2/executions/${executionId}/retry`, {
      method: 'POST'
    });
  }

  // ============ AUTOMATION AGENTS ============

  /**
   * Trigger mainpage agent
   */
  async triggerMainpageAgent(params) {
    return this.createAgentTask('mainpage', 'navigate', params);
  }

  /**
   * Trigger codepage agent
   */
  async triggerCodepageAgent(params) {
    return this.createAgentTask('codepage', 'edit', params);
  }

  /**
   * Trigger repo agent
   */
  async triggerRepoAgent(params) {
    return this.createAgentTask('repo-agent', 'manage', params);
  }

  /**
   * Trigger curriculum agent
   */
  async triggerCurriculumAgent(params) {
    return this.createAgentTask('curriculum', 'learn', params);
  }

  /**
   * Trigger designer agent
   */
  async triggerDesignerAgent(params) {
    return this.createAgentTask('designer', 'design', params);
  }

  // ============ WEBSOCKET CONNECTION ============

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket() {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
    
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log('✅ WebSocket connected');
      this.emit('ws:connected');

      // Authenticate WebSocket
      if (this.token) {
        this.wsConnection.send(JSON.stringify({
          type: 'auth',
          token: this.token
        }));
      }
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.wsConnection.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('ws:error', error);
    };

    this.wsConnection.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.emit('ws:disconnected');
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (this.wsConnection) {
          this.connectWebSocket();
        }
      }, 5000);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'execution:started':
        this.emit('execution:started', data);
        break;
      case 'execution:progress':
        this.emit('execution:progress', data);
        break;
      case 'execution:completed':
        this.emit('execution:completed', data);
        break;
      case 'execution:failed':
        this.emit('execution:failed', data);
        break;
      case 'task:created':
        this.emit('task:created', data);
        break;
      case 'task:updated':
        this.emit('task:updated', data);
        break;
      case 'agent:status':
        this.emit('agent:status', data);
        break;
      default:
        this.emit('message', message);
    }
  }

  /**
   * Subscribe to execution updates
   */
  subscribeToExecution(executionId) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'subscribe:execution',
        executionId
      }));
    }
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribeFromExecution(executionId) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'unsubscribe:execution',
        executionId
      }));
    }
  }

  // ============ EVENT SYSTEM ============

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.disconnectWebSocket();
    this.eventListeners.clear();
  }
}

// Singleton instance
let apiBridgeInstance = null;

export function getAPIBridge(baseUrl, token) {
  if (!apiBridgeInstance) {
    apiBridgeInstance = new WorkstationAPIBridge(baseUrl, token);
  } else if (baseUrl) {
    apiBridgeInstance.setBaseUrl(baseUrl);
  }
  if (token) {
    apiBridgeInstance.setToken(token);
  }
  return apiBridgeInstance;
}
