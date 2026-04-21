import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', color: '#ff7a59', sortOrder: 1 },
  { id: 'transport', name: '交通', color: '#2c9cff', sortOrder: 2 },
  { id: 'shopping', name: '购物', color: '#ffb84d', sortOrder: 3 },
  { id: 'housing', name: '住房', color: '#ff8a80', sortOrder: 4 },
  { id: 'entertainment', name: '娱乐', color: '#ffd166', sortOrder: 5 },
  { id: 'medical', name: '医疗', color: '#7cc6ff', sortOrder: 6 },
  { id: 'study', name: '学习', color: '#f9d98c', sortOrder: 7 },
  { id: 'other', name: '其他', color: '#f4b7a8', sortOrder: 8 },
];

const defaultCategoryMap = new Map(DEFAULT_CATEGORIES.map((category) => [category.id, category] as const));

function cloneCategories(categories: Category[]): Category[] {
  return categories.map((category) => ({ ...category }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function extractCategoryItems(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of ['data', 'categories', 'items', 'results']) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return null;
}

function normalizeCategory(value: unknown, index: number): Category | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const nameSource =
    typeof value.name === 'string'
      ? value.name
      : typeof value.label === 'string'
        ? value.label
        : '';
  const name = nameSource.trim();

  if (!id || !name) {
    return null;
  }

  const fallback = defaultCategoryMap.get(id);
  const colorSource =
    typeof value.color === 'string'
      ? value.color
      : typeof value.colour === 'string'
        ? value.colour
        : fallback?.color;
  const sortOrderSource = 'sortOrder' in value ? value.sortOrder : value.sort_order;

  return {
    id,
    name,
    color: colorSource && colorSource.trim() ? colorSource : fallback?.color ?? '#f3c27a',
    sortOrder: toNumber(sortOrderSource) ?? fallback?.sortOrder ?? index + 1,
  };
}

export function resolveCategories(value: unknown): Category[] {
  const items = extractCategoryItems(value);

  if (!items || items.length === 0) {
    return cloneCategories(DEFAULT_CATEGORIES);
  }

  const normalized = items
    .map((item, index) => normalizeCategory(item, index))
    .filter((item): item is Category => item !== null);

  if (normalized.length === 0) {
    return cloneCategories(DEFAULT_CATEGORIES);
  }

  return Array.from(new Map(normalized.map((category) => [category.id, category] as const)).values()).sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'zh-CN'),
  );
}
