/**
 * Agentic Team Coordination Layer for stackBrowserAgent
 * Enables inter-agent communication, task handoff, and collaborative workflows
 */

import { EventEmitter } from 'events';
import { logger } from './logger';

// ========================
// TYPES
// ========================

export interface AgentCapability {
  name: string;
  description: string;
  version: string;
  inputs: string[];
  outputs: string[];
}

export interface AgentProfile {
  id: string;
  name: string;
  type: string;
  capabilities: AgentCapability[];
  status: 'idle' | 'busy' | 'offline';
  load: number; // 0-100
  lastSeen: Date;
  metadata?: any;
}

export interface Message {
  id: string;
  from: string;
  to: string | string[]; // Can be broadcast to multiple agents
  type: 'request' | 'response' | 'event' | 'handoff';
  payload: any;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
}

export interface TaskHandoff {
  taskId: string;
  fromAgent: string;
  toAgent: string;
  state: any;
  context: any;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface SharedMemory {
  key: string;
  value: any;
  owner: string;
  updatedAt: Date;
  ttl?: number; // Time to live in ms
  access: 'public' | 'protected' | 'private';
}

// ========================
// MESSAGE BUS
// ========================

export class MessageBus extends EventEmitter {
  private messages: Message[] = [];
  private subscribers: Map<string, Set<(message: Message) => void>> = new Map();
  private maxHistory = 1000;

  /**
   * Send message
   */
  send(message: Omit<Message, 'id' | 'timestamp'>): string {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    this.messages.push(fullMessage);

    // Maintain history size
    if (this.messages.length > this.maxHistory) {
      this.messages.shift();
    }

    logger.debug(`Message sent: ${fullMessage.from} -> ${fullMessage.to} (${fullMessage.type})`);

    // Deliver to recipients
    this.deliverMessage(fullMessage);

    return fullMessage.id;
  }

  /**
   * Deliver message to recipients
   */
  private deliverMessage(message: Message): void {
    const recipients = Array.isArray(message.to) ? message.to : [message.to];

    for (const recipient of recipients) {
      const handlers = this.subscribers.get(recipient);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error: any) {
            logger.error(`Error delivering message to ${recipient}:`, error);
          }
        });
      }

      // Also emit as event
      this.emit('message', message);
      this.emit(`message:${recipient}`, message);
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(agentId: string, handler: (message: Message) => void): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    this.subscribers.get(agentId)!.add(handler);
    logger.debug(`Agent subscribed: ${agentId}`);
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string, handler?: (message: Message) => void): void {
    if (!handler) {
      this.subscribers.delete(agentId);
    } else {
      const handlers = this.subscribers.get(agentId);
      if (handlers) {
        handlers.delete(handler);
      }
    }
    logger.debug(`Agent unsubscribed: ${agentId}`);
  }

  /**
   * Get message history
   */
  getHistory(agentId: string, limit: number = 100): Message[] {
    return this.messages
      .filter(
        (m) =>
          m.from === agentId || m.to === agentId || (Array.isArray(m.to) && m.to.includes(agentId))
      )
      .slice(-limit);
  }

  /**
   * Get messages by correlation ID
   */
  getCorrelated(correlationId: string): Message[] {
    return this.messages.filter((m) => m.correlationId === correlationId);
  }
}

// ========================
// AGENT REGISTRY
// ========================

export class AgentRegistry extends EventEmitter {
  private agents: Map<string, AgentProfile> = new Map();
  private capabilities: Map<string, Set<string>> = new Map(); // capability -> agent IDs

  /**
   * Register agent
   */
  register(profile: AgentProfile): void {
    this.agents.set(profile.id, profile);

    // Index capabilities
    for (const capability of profile.capabilities) {
      if (!this.capabilities.has(capability.name)) {
        this.capabilities.set(capability.name, new Set());
      }
      this.capabilities.get(capability.name)!.add(profile.id);
    }

    logger.info(`Agent registered: ${profile.name} (${profile.id})`);
    this.emit('agent:registered', profile);
  }

  /**
   * Unregister agent
   */
  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Remove from capability index
    for (const capability of agent.capabilities) {
      const agentSet = this.capabilities.get(capability.name);
      if (agentSet) {
        agentSet.delete(agentId);
      }
    }

    this.agents.delete(agentId);
    logger.info(`Agent unregistered: ${agent.name} (${agentId})`);
    this.emit('agent:unregistered', agent);
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: AgentProfile['status'], load?: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.lastSeen = new Date();
      if (load !== undefined) {
        agent.load = load;
      }
      this.emit('agent:updated', agent);
    }
  }

  /**
   * Find agents by capability
   */
  findByCapability(capabilityName: string): AgentProfile[] {
    const agentIds = this.capabilities.get(capabilityName);
    if (!agentIds) return [];

    return Array.from(agentIds)
      .map((id) => this.agents.get(id))
      .filter((a): a is AgentProfile => a !== undefined && a.status !== 'offline');
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): AgentProfile | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get best agent for capability (lowest load)
   */
  getBestAgent(capabilityName: string): AgentProfile | null {
    const candidates = this.findByCapability(capabilityName)
      .filter((a) => a.status === 'idle' || a.status === 'busy')
      .sort((a, b) => a.load - b.load);

    return candidates[0] || null;
  }
}

// ========================
// TASK HANDOFF MANAGER
// ========================

export class HandoffManager extends EventEmitter {
  private handoffs: Map<string, TaskHandoff> = new Map();
  private messageBus: MessageBus;

  constructor(messageBus: MessageBus) {
    super();
    this.messageBus = messageBus;
  }

  /**
   * Initiate task handoff
   */
  async initiateHandoff(
    taskId: string,
    fromAgent: string,
    toAgent: string,
    state: any,
    context: any
  ): Promise<string> {
    const handoff: TaskHandoff = {
      taskId,
      fromAgent,
      toAgent,
      state,
      context,
      timestamp: new Date(),
      status: 'pending',
    };

    this.handoffs.set(taskId, handoff);

    logger.info(`Task handoff initiated: ${taskId} (${fromAgent} -> ${toAgent})`);

    // Send handoff message
    this.messageBus.send({
      from: fromAgent,
      to: toAgent,
      type: 'handoff',
      payload: {
        taskId,
        state,
        context,
      },
    });

    this.emit('handoff:initiated', handoff);

    return taskId;
  }

  /**
   * Accept handoff
   */
  acceptHandoff(taskId: string, agentId: string): TaskHandoff | null {
    const handoff = this.handoffs.get(taskId);
    if (!handoff || handoff.toAgent !== agentId) {
      return null;
    }

    handoff.status = 'accepted';
    logger.info(`Task handoff accepted: ${taskId} by ${agentId}`);

    this.emit('handoff:accepted', handoff);

    return handoff;
  }

  /**
   * Reject handoff
   */
  rejectHandoff(taskId: string, agentId: string, reason?: string): void {
    const handoff = this.handoffs.get(taskId);
    if (!handoff || handoff.toAgent !== agentId) {
      return;
    }

    handoff.status = 'rejected';
    logger.warn(`Task handoff rejected: ${taskId} by ${agentId}. Reason: ${reason || 'none'}`);

    this.emit('handoff:rejected', { handoff, reason });
  }

  /**
   * Complete handoff
   */
  completeHandoff(taskId: string): void {
    const handoff = this.handoffs.get(taskId);
    if (!handoff) return;

    handoff.status = 'completed';
    logger.info(`Task handoff completed: ${taskId}`);

    this.emit('handoff:completed', handoff);
  }

  /**
   * Get handoff status
   */
  getHandoff(taskId: string): TaskHandoff | undefined {
    return this.handoffs.get(taskId);
  }
}

// ========================
// SHARED MEMORY
// ========================

export class SharedMemoryManager extends EventEmitter {
  private memory: Map<string, SharedMemory> = new Map();
  private locks: Map<string, string> = new Map(); // key -> owner

  /**
   * Store value in shared memory
   */
  set(
    key: string,
    value: any,
    owner: string,
    options?: {
      ttl?: number;
      access?: 'public' | 'protected' | 'private';
    }
  ): void {
    const entry: SharedMemory = {
      key,
      value,
      owner,
      updatedAt: new Date(),
      ttl: options?.ttl,
      access: options?.access || 'public',
    };

    this.memory.set(key, entry);
    logger.debug(`Shared memory set: ${key} by ${owner}`);

    this.emit('memory:set', entry);

    // Set TTL cleanup
    if (entry.ttl) {
      setTimeout(() => {
        this.delete(key, owner);
      }, entry.ttl);
    }
  }

  /**
   * Get value from shared memory
   */
  get(key: string, requestor: string): any | null {
    const entry = this.memory.get(key);
    if (!entry) return null;

    // Check access permissions
    if (entry.access === 'private' && entry.owner !== requestor) {
      logger.warn(`Access denied to private key ${key} for ${requestor}`);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete from shared memory
   */
  delete(key: string, requestor: string): boolean {
    const entry = this.memory.get(key);
    if (!entry) return false;

    // Only owner can delete private/protected entries
    if (entry.access !== 'public' && entry.owner !== requestor) {
      logger.warn(`Delete denied for key ${key} by ${requestor}`);
      return false;
    }

    this.memory.delete(key);
    this.locks.delete(key);
    logger.debug(`Shared memory deleted: ${key}`);

    this.emit('memory:deleted', { key, owner: entry.owner });

    return true;
  }

  /**
   * Acquire lock on key
   */
  lock(key: string, owner: string, timeout: number = 30000): boolean {
    if (this.locks.has(key) && this.locks.get(key) !== owner) {
      return false;
    }

    this.locks.set(key, owner);
    logger.debug(`Lock acquired: ${key} by ${owner}`);

    // Auto-release after timeout
    setTimeout(() => {
      if (this.locks.get(key) === owner) {
        this.unlock(key, owner);
      }
    }, timeout);

    return true;
  }

  /**
   * Release lock
   */
  unlock(key: string, owner: string): boolean {
    if (this.locks.get(key) !== owner) {
      return false;
    }

    this.locks.delete(key);
    logger.debug(`Lock released: ${key} by ${owner}`);

    return true;
  }

  /**
   * List keys
   */
  listKeys(requestor: string): string[] {
    return Array.from(this.memory.values())
      .filter((entry) => entry.access === 'public' || entry.owner === requestor)
      .map((entry) => entry.key);
  }

  /**
   * Get memory status
   */
  getStatus() {
    return {
      entries: this.memory.size,
      locks: this.locks.size,
      byAccess: {
        public: Array.from(this.memory.values()).filter((e) => e.access === 'public').length,
        protected: Array.from(this.memory.values()).filter((e) => e.access === 'protected').length,
        private: Array.from(this.memory.values()).filter((e) => e.access === 'private').length,
      },
    };
  }
}

// ========================
// LOAD BALANCER
// ========================

export class LoadBalancer {
  private registry: AgentRegistry;
  private strategy: 'round-robin' | 'least-load' | 'random';
  private roundRobinIndex: Map<string, number> = new Map();

  constructor(
    registry: AgentRegistry,
    strategy: 'round-robin' | 'least-load' | 'random' = 'least-load'
  ) {
    this.registry = registry;
    this.strategy = strategy;
  }

  /**
   * Select agent for capability
   */
  selectAgent(capabilityName: string): AgentProfile | null {
    const candidates = this.registry.findByCapability(capabilityName);
    if (candidates.length === 0) return null;

    switch (this.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(capabilityName, candidates);
      case 'least-load':
        return this.selectLeastLoad(candidates);
      case 'random':
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  /**
   * Round-robin selection
   */
  private selectRoundRobin(capability: string, candidates: AgentProfile[]): AgentProfile {
    const index = this.roundRobinIndex.get(capability) || 0;
    const selected = candidates[index % candidates.length];
    this.roundRobinIndex.set(capability, index + 1);
    return selected;
  }

  /**
   * Least-load selection
   */
  private selectLeastLoad(candidates: AgentProfile[]): AgentProfile {
    return candidates.reduce((best, current) => (current.load < best.load ? current : best));
  }

  /**
   * Change strategy
   */
  setStrategy(strategy: 'round-robin' | 'least-load' | 'random'): void {
    this.strategy = strategy;
    logger.info(`Load balancing strategy changed to: ${strategy}`);
  }
}

// ========================
// COORDINATION MANAGER (Main Interface)
// ========================

export class CoordinationManager extends EventEmitter {
  public messageBus: MessageBus;
  public registry: AgentRegistry;
  public handoffManager: HandoffManager;
  public sharedMemory: SharedMemoryManager;
  public loadBalancer: LoadBalancer;

  constructor() {
    super();
    this.messageBus = new MessageBus();
    this.registry = new AgentRegistry();
    this.handoffManager = new HandoffManager(this.messageBus);
    this.sharedMemory = new SharedMemoryManager();
    this.loadBalancer = new LoadBalancer(this.registry);

    this.setupEventForwarding();
  }

  /**
   * Forward important events
   */
  private setupEventForwarding(): void {
    this.registry.on('agent:registered', (agent) => this.emit('agent:registered', agent));
    this.registry.on('agent:unregistered', (agent) => this.emit('agent:unregistered', agent));
    this.handoffManager.on('handoff:initiated', (h) => this.emit('handoff:initiated', h));
    this.handoffManager.on('handoff:completed', (h) => this.emit('handoff:completed', h));
  }

  /**
   * Get coordination status
   */
  getStatus() {
    return {
      agents: this.registry.listAgents().length,
      messages: this.messageBus.getHistory('*', 100).length,
      sharedMemory: this.sharedMemory.getStatus(),
    };
  }
}
