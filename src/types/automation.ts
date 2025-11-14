/**
 * Enhanced Type Definitions for Automation System
 *
 * Production-ready types that scale dynamically.
 * Zero `any` types - full compile-time and runtime safety.
 */

/**
 * Task priority levels
 */
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Generic task payload
 * Use specific types for known payloads, unknown for dynamic
 */
export type TaskPayload = Record<string, unknown>;

/**
 * Strongly typed task
 */
export interface Task<TPayload extends TaskPayload = TaskPayload> {
  id: string;
  type: string;
  priority: TaskPriority;
  payload: TPayload;
  dependencies?: string[];
  retries?: number;
  timeout?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: TaskStatus;
  error?: Error;
  result?: unknown;
}

/**
 * Task queue configuration
 */
export interface TaskQueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Resource allocation
 */
export interface ResourceAllocation {
  memory: number; // bytes
  cpu: number; // percentage
  allocated: boolean;
  timestamp: Date;
}

/**
 * State change event
 */
export interface StateChangeEvent<T = unknown> {
  key: string;
  oldValue: T;
  newValue: T;
  timestamp: Date;
}

/**
 * Automation rule trigger types
 */
export type AutomationTriggerType = 'state_change' | 'schedule' | 'event' | 'threshold';

/**
 * Automation rule
 */
export interface AutomationRule<TCondition = unknown, TAction = unknown> {
  id: string;
  name: string;
  trigger: AutomationTriggerType;
  condition: TCondition;
  action: TAction;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

/**
 * State monitor callback
 */
export type StateMonitorCallback<T = unknown> = (
  event: StateChangeEvent<T>
) => void | Promise<void>;

/**
 * Task handler function
 */
export type TaskHandler<TPayload extends TaskPayload = TaskPayload, TResult = unknown> = (
  payload: TPayload
) => Promise<TResult> | TResult;

/**
 * Task execution result
 */
export interface TaskExecutionResult<TResult = unknown> {
  taskId: string;
  status: 'success' | 'failure';
  result?: TResult;
  error?: Error;
  duration: number;
  retries: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceMetrics {
  memoryUsed: number;
  memoryTotal: number;
  cpuUsage: number;
  activeTasks: number;
  queuedTasks: number;
  timestamp: Date;
}
