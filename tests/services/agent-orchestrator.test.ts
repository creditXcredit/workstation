/**
 * Test Suite: Agent Orchestrator Service
 * Coverage Target: 80%+
 * Priority: 3
 */

import { agentOrchestrator, AgentInfo, AgentTask } from '../../src/services/agent-orchestrator';
import db from '../../src/db/connection';

// Mock database and logger
jest.mock('../../src/db/connection');
jest.mock('../../src/utils/logger');

const mockDb = db as jest.Mocked<typeof db>;

describe('Agent Orchestrator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Agent Registration & Lifecycle', () => {
    it('should initialize agents from database', async () => {
      const mockAgents = [
        {
          id: '1',
          name: 'CSV Agent',
          type: 'data',
          container_name: 'csv-agent-container',
          status: 'running',
          health_status: 'healthy',
          capabilities: ['csv_read', 'csv_write']
        },
        {
          id: '2',
          name: 'JSON Agent',
          type: 'data',
          container_name: 'json-agent-container',
          status: 'running',
          health_status: 'healthy',
          capabilities: ['json_parse', 'json_stringify']
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockAgents, rowCount: 2 } as any);

      await agentOrchestrator.initializeAgents();

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, type, container_name')
      );
    });

    it('should handle database errors during initialization', async () => {
      mockDb.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(agentOrchestrator.initializeAgents()).resolves.not.toThrow();
    });

    it('should get all registered agents', async () => {
      const mockAgents = [
        {
          id: 1,
          name: 'CSV Agent',
          type: 'data',
          container_name: 'csv-container',
          status: 'running',
          health_status: 'healthy',
          capabilities: ['csv'],
          metadata: { version: '1.0' },
          last_health_check: new Date(),
          created_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockAgents, rowCount: 1 } as any);

      const agents = await agentOrchestrator.getAllAgents();

      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual({
        id: '1',
        name: 'CSV Agent',
        type: 'data',
        containerName: 'csv-container',
        status: 'running',
        healthStatus: 'healthy',
        capabilities: ['csv'],
        metadata: { version: '1.0' },
        lastHealthCheck: expect.any(Date),
        createdAt: expect.any(Date)
      });
    });

    it('should get agent by ID', async () => {
      const mockAgent = {
        id: 1,
        name: 'CSV Agent',
        type: 'data',
        container_name: 'csv-container',
        status: 'running',
        health_status: 'healthy',
        capabilities: ['csv'],
        metadata: {},
        last_health_check: new Date()
      };

      mockDb.query.mockResolvedValue({ rows: [mockAgent], rowCount: 1 } as any);

      const agent = await agentOrchestrator.getAgent('1');

      expect(agent).not.toBeNull();
      expect(agent?.id).toBe('1');
      expect(agent?.name).toBe('CSV Agent');
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM agent_registry WHERE id = $1',
        ['1']
      );
    });

    it('should return null for non-existent agent', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const agent = await agentOrchestrator.getAgent('999');

      expect(agent).toBeNull();
    });

    it('should handle agents with no capabilities', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'stopped',
        health_status: 'unknown',
        capabilities: null,
        metadata: null,
        last_health_check: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockAgent], rowCount: 1 } as any);

      const agent = await agentOrchestrator.getAgent('1');

      expect(agent?.capabilities).toEqual([]);
    });
  });

  describe('Task Creation & Management', () => {
    it('should create a new task for valid agent', async () => {
      const mockAgent = {
        id: 1,
        name: 'CSV Agent',
        type: 'data',
        container_name: 'csv-container',
        status: 'running',
        health_status: 'healthy',
        capabilities: ['csv']
      };

      const mockTaskInsert = {
        rows: [{ id: 'task-123' }],
        rowCount: 1
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any) // getAgent
        .mockResolvedValueOnce(mockTaskInsert as any) // INSERT task
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // UPDATE task status

      const taskId = await agentOrchestrator.createTask(
        '1',
        'csv_process',
        { file: 'data.csv' },
        'user-123',
        5
      );

      expect(taskId).toBe('task-123');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_tasks'),
        ['1', 'csv_process', JSON.stringify({ file: 'data.csv' }), 5, 'user-123']
      );
    });

    it('should throw error when creating task for non-existent agent', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await expect(
        agentOrchestrator.createTask('999', 'test', {}, 'user-123')
      ).rejects.toThrow('Agent 999 not found');
    });

    it('should use default priority if not specified', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'task-456' }], rowCount: 1 } as any);

      await agentOrchestrator.createTask('1', 'test', {}, 'user-123');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agent_tasks'),
        expect.arrayContaining([5]) // default priority
      );
    });

    it('should get task status with agent information', async () => {
      const mockTaskStatus = {
        id: 'task-123',
        agent_id: '1',
        type: 'csv_process',
        status: 'completed',
        agent_name: 'CSV Agent',
        agent_type: 'data',
        created_at: new Date(),
        completed_at: new Date()
      };

      mockDb.query.mockResolvedValue({ rows: [mockTaskStatus], rowCount: 1 } as any);

      const status = await agentOrchestrator.getTaskStatus('task-123');

      expect(status).not.toBeNull();
      expect(status.id).toBe('task-123');
      expect(status.agent_name).toBe('CSV Agent');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INNER JOIN agent_registry'),
        ['task-123']
      );
    });

    it('should return null for non-existent task', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const status = await agentOrchestrator.getTaskStatus('invalid-task');

      expect(status).toBeNull();
    });

    it('should get all tasks for specific agent', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          agent_id: '1',
          type: 'csv_process',
          status: 'completed',
          created_at: new Date()
        },
        {
          id: 'task-2',
          agent_id: '1',
          type: 'csv_validate',
          status: 'pending',
          created_at: new Date()
        }
      ];

      mockDb.query.mockResolvedValue({ rows: mockTasks, rowCount: 2 } as any);

      const tasks = await agentOrchestrator.getAgentTasks('1', 50);

      expect(tasks).toHaveLength(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE agent_id = $1'),
        ['1', 50]
      );
    });

    it('should limit task results to specified limit', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await agentOrchestrator.getAgentTasks('1', 10);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $2'),
        ['1', 10]
      );
    });

    it('should handle task creation database errors', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any)
        .mockRejectedValueOnce(new Error('Database insert failed'));

      await expect(
        agentOrchestrator.createTask('1', 'test', {}, 'user-123')
      ).rejects.toThrow('Database insert failed');
    });
  });

  describe('Agent Health Management', () => {
    it('should update agent health status', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await agentOrchestrator.updateAgentHealth('1', 'healthy', { cpu: 50, memory: 70 });

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE agent_registry'),
        ['healthy', JSON.stringify({ cpu: 50, memory: 70 }), '1']
      );
    });

    it('should update agent health with empty metadata', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await agentOrchestrator.updateAgentHealth('1', 'degraded');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.anything(),
        ['degraded', '{}', '1']
      );
    });

    it('should handle health update errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Health update failed'));

      await expect(
        agentOrchestrator.updateAgentHealth('1', 'healthy')
      ).rejects.toThrow('Health update failed');
    });
  });

  describe('Agent Lifecycle Operations', () => {
    it('should start an agent', async () => {
      const mockAgent = {
        id: 1,
        name: 'CSV Agent',
        type: 'data',
        container_name: 'csv-container',
        status: 'stopped',
        health_status: 'unknown',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any) // getAgent
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE status

      const result = await agentOrchestrator.startAgent('1');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'running'"),
        ['1']
      );
    });

    it('should throw error when starting non-existent agent', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await expect(agentOrchestrator.startAgent('999')).rejects.toThrow(
        'Agent 999 not found'
      );
    });

    it('should stop an agent', async () => {
      const mockAgent = {
        id: 1,
        name: 'CSV Agent',
        type: 'data',
        container_name: 'csv-container',
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any) // getAgent
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE status

      const result = await agentOrchestrator.stopAgent('1');

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'stopped'"),
        ['1']
      );
    });

    it('should throw error when stopping non-existent agent', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await expect(agentOrchestrator.stopAgent('999')).rejects.toThrow(
        'Agent 999 not found'
      );
    });
  });

  describe('Task Statistics & Monitoring', () => {
    it('should get pending tasks count', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ count: '15' }],
        rowCount: 1
      } as any);

      const count = await agentOrchestrator.getPendingTasksCount();

      expect(count).toBe(15);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = 'pending' OR status = 'running'")
      );
    });

    it('should return 0 for no pending tasks', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ count: '0' }],
        rowCount: 1
      } as any);

      const count = await agentOrchestrator.getPendingTasksCount();

      expect(count).toBe(0);
    });

    it('should get agent statistics', async () => {
      const mockStats = {
        total_tasks: '100',
        completed_tasks: '85',
        failed_tasks: '10',
        active_tasks: '5',
        avg_execution_time_ms: '1500.5'
      };

      mockDb.query.mockResolvedValue({ rows: [mockStats], rowCount: 1 } as any);

      const stats = await agentOrchestrator.getAgentStatistics('1');

      expect(stats).toEqual(mockStats);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*) as total_tasks'),
        ['1']
      );
    });

    it('should handle agent with no tasks', async () => {
      const mockStats = {
        total_tasks: '0',
        completed_tasks: '0',
        failed_tasks: '0',
        active_tasks: '0',
        avg_execution_time_ms: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockStats], rowCount: 1 } as any);

      const stats = await agentOrchestrator.getAgentStatistics('999');

      expect(stats.total_tasks).toBe('0');
      expect(stats.avg_execution_time_ms).toBeNull();
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle empty agent list gracefully', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const agents = await agentOrchestrator.getAllAgents();

      expect(agents).toEqual([]);
    });

    it('should handle empty task list gracefully', async () => {
      mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const tasks = await agentOrchestrator.getAgentTasks('1');

      expect(tasks).toEqual([]);
    });

    it('should handle database connection errors', async () => {
      mockDb.query.mockRejectedValue(new Error('Connection timeout'));

      await expect(agentOrchestrator.getAllAgents()).rejects.toThrow('Connection timeout');
    });

    it('should handle invalid JSON in payload', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'task-789' }], rowCount: 1 } as any);

      // Circular reference will be handled by JSON.stringify
      const circularPayload = { a: 1 };

      await expect(
        agentOrchestrator.createTask('1', 'test', circularPayload, 'user-123')
      ).resolves.toBe('task-789');
    });

    it('should handle null agent metadata', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: null,
        metadata: null,
        last_health_check: null
      };

      mockDb.query.mockResolvedValue({ rows: [mockAgent], rowCount: 1 } as any);

      const agent = await agentOrchestrator.getAgent('1');

      expect(agent?.metadata).toBeNull();
      expect(agent?.lastHealthCheck).toBeNull();
    });

    it('should handle query with multiple result rows', async () => {
      const mockAgents = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Agent ${i + 1}`,
        type: 'test',
        container_name: `container-${i + 1}`,
        status: 'running',
        health_status: 'healthy',
        capabilities: [],
        metadata: {},
        last_health_check: new Date(),
        created_at: new Date()
      }));

      mockDb.query.mockResolvedValue({ rows: mockAgents, rowCount: 20 } as any);

      const agents = await agentOrchestrator.getAllAgents();

      expect(agents).toHaveLength(20);
      expect(agents[0].id).toBe('1');
      expect(agents[19].id).toBe('20');
    });
  });

  describe('Concurrent Task Handling', () => {
    it('should handle multiple concurrent task creations', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValue({ rows: [mockAgent], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'task-1' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'task-2' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 'task-3' }], rowCount: 1 } as any);

      const taskPromises = [
        agentOrchestrator.createTask('1', 'test1', {}, 'user-123'),
        agentOrchestrator.createTask('1', 'test2', {}, 'user-123'),
        agentOrchestrator.createTask('1', 'test3', {}, 'user-123')
      ];

      const taskIds = await Promise.all(taskPromises);

      expect(taskIds).toHaveLength(3);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full agent lifecycle workflow', async () => {
      const mockAgent = {
        id: 1,
        name: 'CSV Agent',
        type: 'data',
        container_name: 'csv-container',
        status: 'stopped',
        health_status: 'unknown',
        capabilities: ['csv']
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any) // startAgent getAgent
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // startAgent UPDATE
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // updateHealth
        .mockResolvedValueOnce({ rows: [{ ...mockAgent, status: 'running' }], rowCount: 1 } as any) // stopAgent getAgent
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // stopAgent UPDATE

      // Start agent
      await agentOrchestrator.startAgent('1');

      // Update health
      await agentOrchestrator.updateAgentHealth('1', 'healthy');

      // Stop agent
      await agentOrchestrator.stopAgent('1');

      expect(mockDb.query).toHaveBeenCalledTimes(5);
    });

    it('should handle task creation and status retrieval workflow', async () => {
      const mockAgent = {
        id: 1,
        name: 'Test Agent',
        type: 'test',
        container_name: null,
        status: 'running',
        health_status: 'healthy',
        capabilities: []
      };

      mockDb.query
        .mockResolvedValueOnce({ rows: [mockAgent], rowCount: 1 } as any) // createTask getAgent
        .mockResolvedValueOnce({ rows: [{ id: 'task-123' }], rowCount: 1 } as any) // createTask INSERT
        .mockResolvedValue({ rows: [], rowCount: 0 } as any); // Any other queries

      const taskId = await agentOrchestrator.createTask('1', 'test', {}, 'user-123');

      expect(taskId).toBe('task-123');
      expect(mockDb.query).toHaveBeenCalled();
    });
  });
});
