/**
 * Type Guards and Runtime Validation System
 *
 * Production-ready type safety with zero performance overhead.
 * Guards scale dynamically with system growth.
 */

/**
 * Type guard registry for extensible validation
 */
export class TypeGuardRegistry {
  private guards = new Map<string, (value: unknown) => boolean>();
  private stats = new Map<string, { checks: number; failures: number }>();

  /**
   * Register a type guard
   */
  register<T>(typeName: string, guard: (v: unknown) => v is T): void {
    this.guards.set(typeName, guard);
    this.stats.set(typeName, { checks: 0, failures: 0 });
  }

  /**
   * Validate and narrow type
   */
  validate<T>(typeName: string, value: unknown): value is T {
    const guard = this.guards.get(typeName);
    const stats = this.stats.get(typeName);

    if (!guard || !stats) {
      return false;
    }

    stats.checks++;
    const isValid = guard(value);

    if (!isValid) {
      stats.failures++;
    }

    return isValid;
  }

  /**
   * Get validation statistics
   */
  getStats(typeName: string): { checks: number; failures: number; successRate: number } | null {
    const stats = this.stats.get(typeName);
    if (!stats) return null;

    return {
      ...stats,
      successRate: stats.checks > 0 ? ((stats.checks - stats.failures) / stats.checks) * 100 : 100,
    };
  }

  /**
   * Get all registered type names
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.guards.keys());
  }
}

/**
 * Global type guard registry
 */
export const typeGuardRegistry = new TypeGuardRegistry();

/**
 * Common type guards
 */
export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';

/**
 * Record type guards
 */
export const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!isObject(value)) return false;
  return Object.values(value).every(isString);
};

export const isRecord = (value: unknown): value is Record<string, unknown> => isObject(value);

/**
 * Nullable type guards
 */
export const isNullable = <T>(guard: (v: unknown) => v is T) => {
  return (value: unknown): value is T | null | undefined => {
    return value === null || value === undefined || guard(value);
  };
};

/**
 * Array type guards
 */
export const isArrayOf = <T>(guard: (v: unknown) => v is T) => {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.every(guard);
  };
};

/**
 * Union type helper
 */
export const isOneOf = <T>(...guards: Array<(v: unknown) => v is T>) => {
  return (value: unknown): value is T => {
    return guards.some((guard) => guard(value));
  };
};

/**
 * Intersection type helper
 */
export const isAllOf = <T>(...guards: Array<(v: unknown) => boolean>) => {
  return (value: unknown): value is T => {
    return guards.every((guard) => guard(value));
  };
};

/**
 * Enum type guard factory
 */
export const isEnum = <T extends string>(...values: T[]) => {
  return (value: unknown): value is T => {
    return typeof value === 'string' && (values as string[]).includes(value);
  };
};

/**
 * Optional property type guard
 */
export const hasProperty = <K extends string>(key: K) => {
  return <T extends Record<K, unknown>>(value: unknown): value is T => {
    return isObject(value) && key in value;
  };
};

/**
 * Safe assertion with runtime check
 */
export function assert<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message || `Type assertion failed for value: ${JSON.stringify(value)}`);
  }
}

/**
 * Safe cast with runtime check
 */
export function cast<T>(value: unknown, guard: (v: unknown) => v is T, defaultValue: T): T {
  return guard(value) ? value : defaultValue;
}

/**
 * Validate object shape
 */
export function isObjectWithShape<T extends Record<string, unknown>>(shape: {
  [K in keyof T]: (v: unknown) => v is T[K];
}) {
  return (value: unknown): value is T => {
    if (!isObject(value)) return false;

    for (const key in shape) {
      if (!(key in value)) return false;
      if (!shape[key](value[key])) return false;
    }

    return true;
  };
}

/**
 * Register common type guards
 */
typeGuardRegistry.register('string', isString);
typeGuardRegistry.register('number', isNumber);
typeGuardRegistry.register('boolean', isBoolean);
typeGuardRegistry.register('object', isObject);
typeGuardRegistry.register('array', isArray);
typeGuardRegistry.register('function', isFunction);
typeGuardRegistry.register('record', isRecord);
typeGuardRegistry.register('stringRecord', isStringRecord);
