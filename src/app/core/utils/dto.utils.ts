type UnknownRecord = Record<string, any> | null | undefined;

export function readField<T>(source: UnknownRecord, keys: string[], fallback: T): T {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return fallback;
}

export function toStringValue(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}
