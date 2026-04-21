import type { Category, ExpensePayload, ExpenseRecord, RecordFilter } from '../types';
import { resolveCategories } from '../utils/categories';

export interface ApiClient {
  getCategories: () => Promise<Category[]>;
  getRecords: (filter: RecordFilter) => Promise<ExpenseRecord[]>;
  createRecord: (payload: ExpensePayload) => Promise<ExpenseRecord>;
  updateRecord: (recordId: string, payload: ExpensePayload) => Promise<ExpenseRecord>;
  deleteRecord: (recordId: string) => Promise<void>;
}

class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function createApiUrl(path: string): string {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T | { message?: string };

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'message' in data ? data.message : '请求失败';
    throw new HttpError(message ?? '请求失败', response.status);
  }

  return data as T;
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  return readJson<T>(response);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return '发生了未知错误';
}

export const apiClient: ApiClient = {
  async getCategories() {
    const data = await fetchJson<unknown>(createApiUrl('/api/categories'));
    return resolveCategories(data);
  },
  getRecords(filter) {
    const body: RecordFilter = {
      range: filter.range,
    };

    if (filter.categoryIds?.length) {
      body.categoryIds = filter.categoryIds;
    }

    return fetchJson<ExpenseRecord[]>(createApiUrl('/api/records/search'), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  createRecord(payload) {
    return fetchJson<ExpenseRecord>(createApiUrl('/api/records'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateRecord(recordId, payload) {
    return fetchJson<ExpenseRecord>(createApiUrl(`/api/records/${recordId}`), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteRecord(recordId) {
    return fetchJson<void>(createApiUrl(`/api/records/${recordId}`), {
      method: 'DELETE',
    });
  },
};
