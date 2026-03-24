export type CollectionSortOrder = 'asc' | 'desc';

export interface CollectionQueryOptions {
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: CollectionSortOrder;
}

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | null | undefined;
type QueryMap = Record<string, QueryValue>;

export function buildCollectionQueryParams(
  options?: CollectionQueryOptions,
  extra?: QueryMap
): Record<string, QueryPrimitive> {
  const params: QueryMap = {
    ...extra,
    q: normalizeString(options?.q),
    page: normalizeInteger(options?.page, 1),
    limit: normalizeInteger(options?.limit, 200),
    sortBy: normalizeString(options?.sortBy),
    sortOrder: normalizeSortOrder(options?.sortOrder),
  };

  return compactQueryParams(params);
}

function compactQueryParams(params: QueryMap): Record<string, QueryPrimitive> {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '');
  return Object.fromEntries(entries) as Record<string, QueryPrimitive>;
}

function normalizeString(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
}

function normalizeInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
}

function normalizeSortOrder(value: CollectionSortOrder | undefined): CollectionSortOrder | undefined {
  if (!value) return undefined;
  return value === 'desc' ? 'desc' : 'asc';
}
