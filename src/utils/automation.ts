/**
 * Intrinsic Automation Layer for stackBrowserAgent
 * Provides automated task management, resource allocation, and self-scheduling
 */

import { logger } from './logger';
import { EventEmitter } from 'events';

// ========================
// TYPES
// ========================

export interface Task {
  id: string;
  type: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload: any;
  dependencies: string[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retries: number;
  maxRetries: number;
  error?: string;
  result?: any;
}

export interface AutomationRule {
  name: string;
  trigger: 'state_change' | 'schedule' | 'event' | 'threshold';
  condition: (context: any) => boolean;
  action: (context: any) => Promise<void>;
  enabled: boolean;
}

export interface ResourceAllocation {
  taskId: string;
  resources: {
    memory: number;
    cpu: number;
    priority: number;
  };
  allocatedAt: Date;
}

// ========================
// TASK QUEUE MANAGER
// ========================

export class TaskQueueManager extends EventEmitter {
  private queue: Task[] = [];
  private running: Map<string, Task> = new Map();
  private completed: Map<string, Task> = new Map();
  private maxConcurrent: number;
  private taskHandlers: Map<string, (task: Task) => Promise<any>> = new Map();

  constructor(maxConcurrent: number = 5) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add task to queue
   */
  addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'retries'>): string {
    const fullTask: Task = {
      ...task,
      id: this.generateTaskId(),
      status: 'pending',
      createdAt: new Date(),
      retries: 0,
      maxRetries: task.maxRetries || 3,
    };

    this.queue.push(fullTask);
    this.sortQueue();

    logger.info(`Task added to queue: ${fullTask.id} (${fullTask.type})`);
    this.emit('task:added', fullTask);

    // Try to process immediately
    this.processQueue();

    return fullTask.id;
  }

  /**
   * Register task handler
   */
  registerHandler(taskType: string, handler: (task: Task) => Promise<any>): void {
    this.taskHandlers.set(taskType, handler);
    logger.info(`Task handler registered: ${taskType}`);
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can run more tasks
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.getNextTask();
      if (!task) break;

      // Check dependencies
      if (!this.areDependenciesMet(task)) {
        continue;
      }

      // Remove from queue and start
      const index = this.queue.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }

      this.runTask(task);
    }
  }

  /**
   * Get next task based on priority
   */
  private getNextTask(): Task | null {
    // Find highest priority task with met dependencies
    for (const task of this.queue) {
      if (this.areDependenciesMet(task)) {
        return task;
      }
    }
    return null;
  }

  /**
   * Check if task dependencies are met
   */
  private areDependenciesMet(task: Task): boolean {
    for (const depId of task.dependencies) {
      const dep = this.completed.get(depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  /**
   * Run task
   */
  private async runTask(task: Task): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    this.running.set(task.id, task);

    logger.info(`Task started: ${task.id} (${task.type})`);
    this.emit('task:started', task);

    try {
      const handler = this.taskHandlers.get(task.type);
      if (!handler) {
        throw new Error(`No handler registered for task type: ${task.type}`);
      }

      const result = await handler(task);

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;

      logger.info(`Task completed: ${task.id} (${task.type})`);
      this.emit('task:completed', task);
    } catch (error: any) {
      logger.error(`Task failed: ${task.id}`, error);

      task.retries++;
      if (task.retries < task.maxRetries) {
        // Retry
        logger.info(`Retrying task: ${task.id} (attempt ${task.retries + 1})`);
        task.status = 'pending';
        this.queue.unshift(task); // Add to front for retry
        this.emit('task:retry', task);
      } else {
        // Failed permanently
        task.status = 'failed';
        task.completedAt = new Date();
        task.error = error.message;
        this.emit('task:failed', task);
      }
    } finally {
      this.running.delete(task.id);
      this.completed.set(task.id, task);

      // Process next tasks
      this.processQueue();
    }
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    // Check if in queue
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue[queueIndex];
      task.status = 'cancelled';
      this.queue.splice(queueIndex, 1);
      this.completed.set(taskId, task);
      logger.info(`Task cancelled: ${taskId}`);
      this.emit('task:cancelled', task);
      return true;
    }

    // Cannot cancel running tasks
    return false;
  }

  /**
   * Get task status
   */
  getTask(taskId: string): Task | null {
    return (
      this.queue.find((t) => t.id === taskId) ||
      this.running.get(taskId) ||
      this.completed.get(taskId) ||
      null
    );
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      tasks: {
        queue: this.queue.map((t) => ({ id: t.id, type: t.type, priority: t.priority })),
        running: Array.from(this.running.values()).map((t) => ({
          id: t.id,
          type: t.type,
          priority: t.priority,
        })),
      },
    };
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    this.queue.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// ========================
// AUTO-DETECTION & STATE MONITORING
// ========================

export class StateMonitor extends EventEmitter {
  private state: Map<string, any> = new Map();
  private watchers: Map<string, ((oldValue: any, newValue: any) => void)[]> = new Map();

  /**
   * Set state value
   */
  setState(key: string, value: any): void {
    const oldValue = this.state.get(key);

    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      this.state.set(key, value);

      logger.debug(`State changed: ${key}`);
      this.emit('state:change', { key, oldValue, newValue: value });

      // Trigger watchers
      const watchers = this.watchers.get(key);
      if (watchers) {
        watchers.forEach((watcher) => watcher(oldValue, value));
      }
    }
  }

  /**
   * Get state value
   */
  getState(key: string): any {
    return this.state.get(key);
  }

  /**
   * Watch state changes
   */
  watch(key: string, callback: (oldValue: any, newValue: any) => void): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }
    this.watchers.get(key)!.push(callback);
  }

  /**
   * Get all state
   */
  getAllState(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.state.entries()) {
      result[key] = value;
    }
    return result;
  }
}

// ========================
// AUTOMATION RULES ENGINE
// ========================

export class AutomationEngine extends EventEmitter {
  private rules: Map<string, AutomationRule> = new Map();
  // Reserved for future schedule-based automation
  // private schedules: Map<string, NodeJS.Timeout> = new Map();
  private stateMonitor: StateMonitor;

  constructor(stateMonitor: StateMonitor) {
    super();
    this.stateMonitor = stateMonitor;

    // Listen to state changes
    this.stateMonitor.on('state:change', (change) => {
      this.evaluateStateChangeRules(change);
    });
  }

  /**
   * Register automation rule
   */
  registerRule(rule: AutomationRule): void {
    this.rules.set(rule.name, rule);
    logger.info(`Automation rule registered: ${rule.name}`);

    // Set up schedule if needed
    if (rule.trigger === 'schedule' && rule.enabled) {
      // TODO: Implement cron-like scheduling
    }
  }

  /**
   * Enable rule
   */
  enableRule(ruleName: string): void {
    const rule = this.rules.get(ruleName);
    if (rule) {
      rule.enabled = true;
      logger.info(`Rule enabled: ${ruleName}`);
    }
  }

  /**
   * Disable rule
   */
  disableRule(ruleName: string): void {
    const rule = this.rules.get(ruleName);
    if (rule) {
      rule.enabled = false;
      logger.info(`Rule disabled: ${ruleName}`);
    }
  }

  /**
   * Evaluate state change rules
   */
  private evaluateStateChangeRules(change: any): void {
    for (const [name, rule] of this.rules.entries()) {
      if (!rule.enabled || rule.trigger !== 'state_change') {
        continue;
      }

      try {
        if (rule.condition(change)) {
          logger.info(`Automation rule triggered: ${name}`);
          this.executeRule(rule, change);
        }
      } catch (error: any) {
        logger.error(`Error evaluating rule ${name}:`, error);
      }
    }
  }

  /**
   * Execute automation rule
   */
  private async executeRule(rule: AutomationRule, context: any): Promise<void> {
    try {
      await rule.action(context);
      this.emit('rule:executed', { rule: rule.name, context });
    } catch (error: any) {
      logger.error(`Error executing rule ${rule.name}:`, error);
      this.emit('rule:error', { rule: rule.name, error: error.message });
    }
  }

  /**
   * Trigger event-based rules
   */
  triggerEvent(eventName: string, context: any): void {
    for (const [name, rule] of this.rules.entries()) {
      if (!rule.enabled || rule.trigger !== 'event') {
        continue;
      }

      try {
        if (rule.condition({ event: eventName, ...context })) {
          logger.info(`Event rule triggered: ${name} (event: ${eventName})`);
          this.executeRule(rule, context);
        }
      } catch (error: any) {
        logger.error(`Error evaluating event rule ${name}:`, error);
      }
    }
  }
}

// ========================
// RESOURCE MANAGER
// ========================

export class ResourceManager {
  private allocations: Map<string, ResourceAllocation> = new Map();
  private totalResources = {
    memory: 1024, // MB
    cpu: 100, // percentage
  };
  private availableResources = { ...this.totalResources };

  /**
   * Allocate resources for task
   */
  allocate(taskId: string, priority: number): boolean {
    // Calculate required resources based on priority
    const required = {
      memory: Math.min(256, this.totalResources.memory * 0.2),
      cpu: Math.min(25, this.totalResources.cpu * 0.25),
      priority,
    };

    // Check availability
    if (
      this.availableResources.memory >= required.memory &&
      this.availableResources.cpu >= required.cpu
    ) {
      // Allocate
      this.availableResources.memory -= required.memory;
      this.availableResources.cpu -= required.cpu;

      this.allocations.set(taskId, {
        taskId,
        resources: required,
        allocatedAt: new Date(),
      });

      logger.debug(`Resources allocated for task ${taskId}:`, required);
      return true;
    }

    logger.warn(`Insufficient resources for task ${taskId}`);
    return false;
  }

  /**
   * Release resources
   */
  release(taskId: string): void {
    const allocation = this.allocations.get(taskId);
    if (allocation) {
      this.availableResources.memory += allocation.resources.memory;
      this.availableResources.cpu += allocation.resources.cpu;
      this.allocations.delete(taskId);

      logger.debug(`Resources released for task ${taskId}`);
    }
  }

  /**
   * Get resource status
   */
  getStatus() {
    return {
      total: this.totalResources,
      available: this.availableResources,
      allocated: {
        memory: this.totalResources.memory - this.availableResources.memory,
        cpu: this.totalResources.cpu - this.availableResources.cpu,
      },
      allocations: Array.from(this.allocations.values()),
    };
  }
}

// ========================
// AUTOMATION MANAGER (Main Interface)
// ========================

export class AutomationManager {
  public taskQueue: TaskQueueManager;
  public stateMonitor: StateMonitor;
  public automationEngine: AutomationEngine;
  public resourceManager: ResourceManager;

  constructor(maxConcurrentTasks: number = 5) {
    this.taskQueue = new TaskQueueManager(maxConcurrentTasks);
    this.stateMonitor = new StateMonitor();
    this.automationEngine = new AutomationEngine(this.stateMonitor);
    this.resourceManager = new ResourceManager();

    this.setupDefaultAutomation();
  }

  /**
   * Set up default automation rules
   */
  private setupDefaultAutomation(): void {
    // Auto-cleanup completed tasks
    this.automationEngine.registerRule({
      name: 'cleanup-old-tasks',
      trigger: 'schedule',
      condition: () => true,
      action: async () => {
        // Cleanup logic would go here
        logger.info('Running scheduled cleanup');
      },
      enabled: true,
    });

    // Auto-resource cleanup
    this.automationEngine.registerRule({
      name: 'resource-cleanup',
      trigger: 'state_change',
      condition: (change) => change.key === 'task:completed',
      action: async (change) => {
        this.resourceManager.release(change.newValue.id);
      },
      enabled: true,
    });
  }

  /**
   * Submit automated task
   */
  async submitTask(
    type: string,
    payload: any,
    options: {
      priority?: 'critical' | 'high' | 'normal' | 'low';
      dependencies?: string[];
    } = {}
  ): Promise<string> {
    const taskId = this.taskQueue.addTask({
      type,
      payload,
      priority: options.priority || 'normal',
      dependencies: options.dependencies || [],
      maxRetries: 3,
    });

    // Update state
    this.stateMonitor.setState('last_task_submitted', {
      id: taskId,
      type,
      timestamp: new Date(),
    });

    return taskId;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      tasks: this.taskQueue.getStatus(),
      resources: this.resourceManager.getStatus(),
      state: this.stateMonitor.getAllState(),
    };
  }
}
