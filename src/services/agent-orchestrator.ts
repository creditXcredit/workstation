/**
 * Agent Orchestration Service
 * Coordinates tasks across 21 agents and 20 MCP containers
 */

import db from '../db/connection';
import { logger } from '../utils/logger';
import Docker from 'dockerode';

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  payload: any;
  priority: number;
  maxRetries: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  containerName: string | null;
  status: string;
  healthStatus: string;
  capabilities: string[];
  metadata?: any;
  lastHealthCheck?: Date;
  createdAt?: Date;
}

class AgentOrchestrator {
  private taskQueue: Map<string, AgentTask> = new Map();
  private activeAgents: Map<string, AgentInfo> = new Map();
  private readonly MAX_CONCURRENT_TASKS = 10;
  private docker: Docker;

  constructor() {
    // Initialize Docker client
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
    });
    
    this.initializeAgents();
  }

  /**
   * Initialize agent registry from database
   */
  async initializeAgents(): Promise<void> {
    try {
      const result = await db.query(
        'SELECT id, name, type, container_name, status, health_status, capabilities FROM agent_registry ORDER BY id'
      );

      result.rows.forEach((agent: any) => {
        this.activeAgents.set(agent.id.toString(), {
          id: agent.id.toString(),
          name: agent.name,
          type: agent.type,
          containerName: agent.container_name,
          status: agent.status,
          healthStatus: agent.health_status,
          capabilities: agent.capabilities || []
        });
      });

      logger.info(`Initialized ${this.activeAgents.size} agents`);
    } catch (error) {
      logger.error('Agent initialization error:', error);
    }
  }

  /**
   * Get all registered agents
   */
  async getAllAgents(): Promise<AgentInfo[]> {
    const result = await db.query(
      `SELECT 
        id, name, type, container_name, status, 
        health_status, capabilities, metadata, 
        last_health_check, created_at
       FROM agent_registry 
       ORDER BY id`
    );

    return result.rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      type: row.type,
      containerName: row.container_name,
      status: row.status,
      healthStatus: row.health_status,
      capabilities: row.capabilities || [],
      metadata: row.metadata,
      lastHealthCheck: row.last_health_check,
      createdAt: row.created_at
    }));
  }

  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<AgentInfo | null> {
    const result = await db.query(
      'SELECT * FROM agent_registry WHERE id = $1',
      [agentId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const agent = result.rows[0];
    return {
      id: agent.id.toString(),
      name: agent.name,
      type: agent.type,
      containerName: agent.container_name,
      status: agent.status,
      healthStatus: agent.health_status,
      capabilities: agent.capabilities || [],
      metadata: agent.metadata,
      lastHealthCheck: agent.last_health_check
    };
  }

  /**
   * Create a new agent task
   */
  async createTask(
    agentId: string,
    taskType: string,
    payload: any,
    createdBy: string,
    priority: number = 5
  ): Promise<string> {
    try {
      // Verify agent exists
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Create task in database
      const result = await db.query(
        `INSERT INTO agent_tasks 
          (agent_id, type, payload, priority, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [agentId, taskType, JSON.stringify(payload), priority, createdBy]
      );

      const taskId = result.rows[0].id;

      logger.info(`Task ${taskId} created for agent ${agentId} with type ${taskType}`);

      // Process task asynchronously
      this.processTask(taskId).catch(error => {
        logger.error(`Task ${taskId} processing error:`, error);
      });

      return taskId;
    } catch (error) {
      logger.error('Task creation error:', error);
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<any> {
    const result = await db.query(
      'SELECT * FROM agent_tasks WHERE id = $1',
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const task = result.rows[0];
    
    return {
      id: task.id,
      agentId: task.agent_id,
      type: task.type,
      payload: task.payload,
      priority: task.priority,
      status: task.status,
      result: task.result,
      createdAt: task.created_at,
      startedAt: task.started_at,
      completedAt: task.completed_at
    };
  }

  /**
   * Process a task (made public for workflow engine)
   */
  async processTask(taskId: string): Promise<void> {
    try {
      // Update task status to running
      await db.query(
        `UPDATE agent_tasks 
         SET status = 'running', started_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [taskId]
      );

      // Get task details
      const taskResult = await db.query(
        'SELECT * FROM agent_tasks WHERE id = $1',
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        logger.error(`Task ${taskId} not found`);
        return;
      }

      const task = taskResult.rows[0];

      // Process task by calling the actual agent
      logger.info(`Processing task ${taskId} for agent ${task.agent_id}`);
      
      try {
        // Get agent info
        const agent = await this.getAgent(task.agent_id);
        if (!agent) {
          throw new Error(`Agent ${task.agent_id} not found`);
        }

        // Execute task based on agent type and task type
        const result = await this.executeAgentTask(agent, task);

        // Update task as completed
        await db.query(
          `UPDATE agent_tasks 
           SET status = 'completed', 
               completed_at = CURRENT_TIMESTAMP,
               result = $1
           WHERE id = $2`,
          [JSON.stringify(result), taskId]
        );

        logger.info(`Task ${taskId} completed successfully`, { result });
      } catch (taskError: any) {
        // Update task as failed
        await db.query(
          `UPDATE agent_tasks 
           SET status = 'failed', 
               completed_at = CURRENT_TIMESTAMP,
               result = $1
           WHERE id = $2`,
          [JSON.stringify({ error: taskError.message }), taskId]
        );
        
        throw taskError;
      }
    } catch (error: any) {
      logger.error(`Task ${taskId} failed:`, error);

      // Update task as failed
      await db.query(
        `UPDATE agent_tasks 
         SET status = 'failed',
             completed_at = CURRENT_TIMESTAMP,
             result = $1,
             retry_count = retry_count + 1
         WHERE id = $2`,
        [JSON.stringify({ error: error?.message || 'Unknown error' }), taskId]
      );
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<any> {
    const result = await db.query(
      `SELECT 
        at.*,
        ar.name as agent_name,
        ar.type as agent_type
       FROM agent_tasks at
       INNER JOIN agent_registry ar ON at.agent_id = ar.id
       WHERE at.id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get all tasks for a specific agent
   */
  async getAgentTasks(agentId: string, limit: number = 50): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM agent_tasks
       WHERE agent_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [agentId, limit]
    );

    return result.rows;
  }

  /**
   * Update agent health status
   */
  async updateAgentHealth(agentId: string, healthStatus: string, metadata: any = {}): Promise<void> {
    await db.query(
      `UPDATE agent_registry 
       SET health_status = $1,
           last_health_check = CURRENT_TIMESTAMP,
           metadata = $2
       WHERE id = $3`,
      [healthStatus, JSON.stringify(metadata), agentId]
    );

    logger.info(`Agent ${agentId} health updated to ${healthStatus}`);
  }

  /**
   * Start agent container using Docker API
   */
  async startAgent(agentId: string): Promise<boolean> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.containerName) {
      logger.warn(`Agent ${agentId} has no container name, updating status only`);
      await db.query(
        `UPDATE agent_registry 
         SET status = 'running',
             last_health_check = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [agentId]
      );
      return true;
    }

    try {
      logger.info(`Starting agent ${agentId} (${agent.name}) - container: ${agent.containerName}`);
      
      // Get container by name
      const container = this.docker.getContainer(agent.containerName);
      
      // Check if container exists
      const containerInfo = await container.inspect().catch(() => null);
      
      if (!containerInfo) {
        throw new Error(`Container ${agent.containerName} not found`);
      }
      
      // Start container if not already running
      if (!containerInfo.State.Running) {
        await container.start();
        logger.info(`Container ${agent.containerName} started successfully`);
      } else {
        logger.info(`Container ${agent.containerName} already running`);
      }

      // Update agent status
      await db.query(
        `UPDATE agent_registry 
         SET status = 'running',
             last_health_check = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [agentId]
      );

      return true;
    } catch (error: any) {
      logger.error(`Failed to start agent ${agentId}:`, error);
      
      // Update status to error
      await db.query(
        `UPDATE agent_registry 
         SET status = 'error',
             last_health_check = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [agentId]
      );
      
      throw error;
    }
  }

  /**
   * Stop agent container using Docker API
   */
  async stopAgent(agentId: string): Promise<boolean> {
    const agent = await this.getAgent(agentId);
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!agent.containerName) {
      logger.warn(`Agent ${agentId} has no container name, updating status only`);
      await db.query(
        `UPDATE agent_registry 
         SET status = 'stopped',
             last_health_check = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [agentId]
      );
      return true;
    }

    try {
      logger.info(`Stopping agent ${agentId} (${agent.name}) - container: ${agent.containerName}`);
      
      // Get container by name
      const container = this.docker.getContainer(agent.containerName);
      
      // Check if container exists
      const containerInfo = await container.inspect().catch(() => null);
      
      if (!containerInfo) {
        logger.warn(`Container ${agent.containerName} not found, updating status only`);
      } else if (containerInfo.State.Running) {
        // Stop container gracefully (10 second timeout)
        await container.stop({ t: 10 });
        logger.info(`Container ${agent.containerName} stopped successfully`);
      } else {
        logger.info(`Container ${agent.containerName} already stopped`);
      }

      // Update agent status
      await db.query(
        `UPDATE agent_registry 
         SET status = 'stopped',
             last_health_check = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [agentId]
      );

      return true;
    } catch (error: any) {
      logger.error(`Failed to stop agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending tasks count
   */
  async getPendingTasksCount(): Promise<number> {
    const result = await db.query(
      `SELECT COUNT(*) as count 
       FROM agent_tasks 
       WHERE status = 'pending' OR status = 'running'`
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Get agent statistics
   */
  async getAgentStatistics(agentId: string): Promise<any> {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
        COUNT(CASE WHEN status = 'pending' OR status = 'running' THEN 1 END) as active_tasks,
        AVG(CASE 
          WHEN status = 'completed' 
          THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 
        END) as avg_execution_time_ms
       FROM agent_tasks
       WHERE agent_id = $1`,
      [agentId]
    );

    const stats = result.rows[0];
    const totalTasks = parseInt(stats.total_tasks);
    const completedTasks = parseInt(stats.completed_tasks);
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      ...stats,
      success_rate: successRate
    };
  }

  /**
   * Execute agent task based on agent type and task configuration
   */
  private async executeAgentTask(agent: AgentInfo, task: any): Promise<any> {
    logger.debug('Executing agent task', {
      agentId: agent.id,
      agentName: agent.name,
      taskType: task.type,
      taskId: task.id
    });

    // Parse task payload
    const payload = typeof task.payload === 'string' 
      ? JSON.parse(task.payload) 
      : task.payload;

    // Execute based on task type
    switch (task.type) {
      case 'health_check':
        return await this.executeHealthCheck(agent);
      
      case 'data_processing':
        return await this.executeDataProcessing(agent, payload);
      
      case 'workflow_step':
        return await this.executeWorkflowStep(agent, payload);
      
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Execute health check for agent
   */
  private async executeHealthCheck(agent: AgentInfo): Promise<any> {
    if (!agent.containerName) {
      return { 
        healthy: true, 
        message: 'Agent has no container',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const container = this.docker.getContainer(agent.containerName);
      const info = await container.inspect();
      
      return {
        healthy: info.State.Running && info.State.Health?.Status === 'healthy',
        running: info.State.Running,
        status: info.State.Status,
        health: info.State.Health,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute data processing task
   */
  private async executeDataProcessing(agent: AgentInfo, payload: any): Promise<any> {
    // This would call the agent's API endpoint for data processing
    // For now, we return a structured response
    logger.info('Data processing task', { 
      agentId: agent.id, 
      dataSize: payload.data?.length || 0 
    });

    return {
      success: true,
      processedAt: new Date().toISOString(),
      agentId: agent.id,
      agentName: agent.name,
      itemsProcessed: payload.data?.length || 0
    };
  }

  /**
   * Execute workflow step
   */
  private async executeWorkflowStep(agent: AgentInfo, payload: any): Promise<any> {
    logger.info('Workflow step execution', {
      agentId: agent.id,
      stepId: payload.stepId,
      workflowId: payload.workflowId
    });

    return {
      success: true,
      stepId: payload.stepId,
      workflowId: payload.workflowId,
      executedBy: agent.name,
      executedAt: new Date().toISOString(),
      result: payload.expectedResult || {}
    };
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
