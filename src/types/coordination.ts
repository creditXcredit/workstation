/**
 * Enhanced Type Definitions for Coordination System
 *
 * Multi-agent communication with full type safety.
 */

/**
 * Agent status
 */
export type AgentStatus = 'active' | 'idle' | 'busy' | 'offline' | 'error';

/**
 * Agent capability
 */
export interface AgentCapability {
  name: string;
  version: string;
  parameters?: Record<string, unknown>;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  name: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
  load: number; // 0-100
  registeredAt: Date;
  lastHeartbeat: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Message priority
 */
export type MessagePriority = 'urgent' | 'high' | 'normal' | 'low';

/**
 * Generic message payload
 */
export type MessagePayload = Record<string, unknown>;

/**
 * Strongly typed message
 */
export interface Message<TPayload extends MessagePayload = MessagePayload> {
  id: string;
  from: string;
  to: string | string[]; // single recipient or broadcast
  type: string;
  payload: TPayload;
  priority: MessagePriority;
  correlationId?: string;
  replyTo?: string;
  timestamp: Date;
  expiresAt?: Date;
}

/**
 * Message handler
 */
export type MessageHandler<TPayload extends MessagePayload = MessagePayload> = (
  message: Message<TPayload>
) => void | Promise<void>;

/**
 * Task handoff status
 */
export type HandoffStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'failed';

/**
 * Task handoff
 */
export interface TaskHandoff<TState = unknown> {
  id: string;
  taskId: string;
  fromAgent: string;
  toAgent: string;
  state: TState;
  status: HandoffStatus;
  reason?: string;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

/**
 * Shared memory access level
 */
export type AccessLevel = 'public' | 'protected' | 'private';

/**
 * Shared memory entry
 */
export interface SharedMemoryEntry<T = unknown> {
  key: string;
  value: T;
  owner: string;
  accessLevel: AccessLevel;
  authorizedAgents?: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  locked: boolean;
  lockedBy?: string;
  lockExpires?: Date;
}

/**
 * Lock options
 */
export interface LockOptions {
  timeout: number; // milliseconds
  autoRelease: boolean;
}

/**
 * Load balancing strategy
 */
export type LoadBalancingStrategy = 'round-robin' | 'least-load' | 'random' | 'priority';

/**
 * Agent selection criteria
 */
export interface AgentSelectionCriteria {
  capabilities?: string[];
  maxLoad?: number;
  status?: AgentStatus[];
  excludeAgents?: string[];
  strategy: LoadBalancingStrategy;
}

/**
 * Coordination event types
 */
export type CoordinationEventType =
  | 'agent_registered'
  | 'agent_updated'
  | 'agent_removed'
  | 'message_sent'
  | 'message_received'
  | 'handoff_created'
  | 'handoff_accepted'
  | 'handoff_completed'
  | 'memory_created'
  | 'memory_updated'
  | 'memory_deleted'
  | 'lock_acquired'
  | 'lock_released';

/**
 * Coordination event
 */
export interface CoordinationEvent<TData = unknown> {
  type: CoordinationEventType;
  agentId?: string;
  data: TData;
  timestamp: Date;
}

/**
 * Event listener
 */
export type CoordinationEventListener<TData = unknown> = (
  event: CoordinationEvent<TData>
) => void | Promise<void>;
