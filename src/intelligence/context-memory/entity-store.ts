/**
 * Entity Store - Global entity tracking system with deduplication
 * Part of Context Memory Module - Intelligence Layer
 * Version: v0.1.0-context-memory
 * Created: 2025-11-21
 */

import { randomUUID } from 'crypto';

// ========== Type Definitions ==========

export type EntityType = 'person' | 'company' | 'email' | 'url' | 'document' | 'form_data';

export interface EntityRelationship {
  entityId: string;
  type: 'works_at' | 'contacted' | 'visited' | 'extracted_from' | 'related_to';
  metadata?: Record<string, any>;
}

export interface Entity {
  id: string;
  type: EntityType;
  attributes: Record<string, any>;
  relationships: EntityRelationship[];
  source_workflows: string[];
  confidence_score: number; // 0.0 - 1.0
  first_seen: Date;
  last_updated: Date;
  access_count: number;
  tags: string[];
}

export interface EntityQuery {
  type?: EntityType;
  attributes?: Partial<Record<string, any>>;
  tags?: string[];
  minConfidence?: number;
  limit?: number;
}

export interface EntityStats {
  total: number;
  byType: Record<EntityType, number>;
  avgConfidence: number;
  recentlyUpdated: number;
}

// ========== Entity Store Class ==========

export class EntityStore {
  private entities: Map<string, Entity>;
  private indexByType: Map<EntityType, Set<string>>;
  private indexByWorkflow: Map<string, Set<string>>;
  private deduplicationThreshold: number;

  constructor(deduplicationThreshold: number = 0.85) {
    this.entities = new Map();
    this.indexByType = new Map();
    this.indexByWorkflow = new Map();
    this.deduplicationThreshold = deduplicationThreshold;
  }

  /**
   * Add or update an entity with automatic deduplication
   */
  async add(entityData: Omit<Entity, 'id' | 'first_seen' | 'last_updated' | 'access_count'>): Promise<string> {
    // Check for duplicates
    const duplicate = await this.findDuplicate(entityData);
    
    if (duplicate) {
      return await this.merge(duplicate.id, entityData);
    }

    // Create new entity
    const entity: Entity = {
      id: randomUUID(),
      ...entityData,
      first_seen: new Date(),
      last_updated: new Date(),
      access_count: 0,
    };

    this.entities.set(entity.id, entity);
    this.updateIndexes(entity);

    return entity.id;
  }

  /**
   * Get entity by ID
   */
  get(id: string): Entity | undefined {
    const entity = this.entities.get(id);
    if (entity) {
      entity.access_count++;
      entity.last_updated = new Date();
    }
    return entity;
  }

  /**
   * Query entities with filters
   */
  query(params: EntityQuery): Entity[] {
    let results: Entity[] = [];

    // Filter by type if specified
    if (params.type) {
      const ids = this.indexByType.get(params.type) || new Set();
      results = Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
    } else {
      results = Array.from(this.entities.values());
    }

    // Filter by attributes
    if (params.attributes) {
      results = results.filter(entity => 
        Object.entries(params.attributes!).every(([key, value]) => 
          entity.attributes[key] === value
        )
      );
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      results = results.filter(entity =>
        params.tags!.some(tag => entity.tags.includes(tag))
      );
    }

    // Filter by confidence
    if (params.minConfidence !== undefined) {
      results = results.filter(entity => entity.confidence_score >= params.minConfidence!);
    }

    // Apply limit
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * Find potential duplicate using similarity scoring
   */
  private async findDuplicate(entityData: Partial<Entity>): Promise<Entity | null> {
    const candidates = this.query({ type: entityData.type });

    for (const candidate of candidates) {
      const similarity = this.calculateSimilarity(candidate, entityData);
      if (similarity >= this.deduplicationThreshold) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Calculate similarity score between two entities (0.0 - 1.0)
   */
  private calculateSimilarity(entity1: Entity, entity2: Partial<Entity>): number {
    if (entity1.type !== entity2.type) return 0;

    const attrs1 = entity1.attributes;
    const attrs2 = entity2.attributes || {};
    const keys = new Set([...Object.keys(attrs1), ...Object.keys(attrs2)]);

    let matches = 0;
    let total = 0;

    for (const key of keys) {
      total++;
      if (attrs1[key] && attrs2[key]) {
        // Exact match
        if (attrs1[key] === attrs2[key]) {
          matches++;
        }
        // Fuzzy string match
        else if (typeof attrs1[key] === 'string' && typeof attrs2[key] === 'string') {
          const fuzzyScore = this.fuzzyMatch(attrs1[key], attrs2[key]);
          matches += fuzzyScore;
        }
      }
    }

    return total > 0 ? matches / total : 0;
  }

  /**
   * Simple fuzzy string matching (Levenshtein-based)
   */
  private fuzzyMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Simple character overlap ratio
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Merge duplicate entity data
   */
  private async merge(targetId: string, newData: Partial<Entity>): Promise<string> {
    const target = this.entities.get(targetId);
    if (!target) throw new Error(`Entity ${targetId} not found`);

    // Merge attributes
    target.attributes = { ...target.attributes, ...(newData.attributes || {}) };

    // Merge relationships
    if (newData.relationships) {
      const existingRelIds = new Set(target.relationships.map(r => r.entityId));
      for (const rel of newData.relationships) {
        if (!existingRelIds.has(rel.entityId)) {
          target.relationships.push(rel);
        }
      }
    }

    // Merge source workflows
    if (newData.source_workflows) {
      target.source_workflows = [...new Set([...target.source_workflows, ...newData.source_workflows])];
    }

    // Update confidence (weighted average)
    if (newData.confidence_score !== undefined) {
      target.confidence_score = (target.confidence_score + newData.confidence_score) / 2;
    }

    // Merge tags
    if (newData.tags) {
      target.tags = [...new Set([...target.tags, ...newData.tags])];
    }

    target.last_updated = new Date();
    this.updateIndexes(target);

    return targetId;
  }

  /**
   * Update search indexes
   */
  private updateIndexes(entity: Entity): void {
    // Type index
    if (!this.indexByType.has(entity.type)) {
      this.indexByType.set(entity.type, new Set());
    }
    this.indexByType.get(entity.type)!.add(entity.id);

    // Workflow index
    for (const workflow of entity.source_workflows) {
      if (!this.indexByWorkflow.has(workflow)) {
        this.indexByWorkflow.set(workflow, new Set());
      }
      this.indexByWorkflow.get(workflow)!.add(entity.id);
    }
  }

  /**
   * Get statistics about the entity store
   */
  getStats(): EntityStats {
    const byType: Record<EntityType, number> = {
      person: 0,
      company: 0,
      email: 0,
      url: 0,
      document: 0,
      form_data: 0,
    };

    let totalConfidence = 0;
    let recentlyUpdated = 0;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const entity of this.entities.values()) {
      byType[entity.type]++;
      totalConfidence += entity.confidence_score;
      if (entity.last_updated > oneHourAgo) {
        recentlyUpdated++;
      }
    }

    return {
      total: this.entities.size,
      byType,
      avgConfidence: this.entities.size > 0 ? totalConfidence / this.entities.size : 0,
      recentlyUpdated,
    };
  }

  /**
   * Get total entity count
   */
  count(): number {
    return this.entities.size;
  }

  /**
   * Clear all entities (for testing/cleanup)
   */
  clear(): void {
    this.entities.clear();
    this.indexByType.clear();
    this.indexByWorkflow.clear();
  }

  /**
   * Delete old entities (90-day retention policy)
   */
  cleanup(retentionDays: number = 90): number {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    let deleted = 0;

    for (const [id, entity] of this.entities.entries()) {
      if (entity.last_updated < cutoffDate && entity.access_count === 0) {
        this.entities.delete(id);
        deleted++;
      }
    }

    return deleted;
  }
}

// ========== Singleton Instance ==========

export const globalEntityStore = new EntityStore();
