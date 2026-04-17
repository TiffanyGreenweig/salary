export type RecordRange = 'week' | 'month' | 'year';

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface ExpenseRecord {
  id: string;
  categoryId: string;
  amount: string;
  title: string;
  remark: string;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordFilter {
  range: RecordRange;
  categoryId?: string;
}

export type ExpenseFormMode = 'create' | 'edit';

export interface ExpensePayload {
  categoryId: string;
  amount: string;
  title: string;
  remark: string;
  spentAt: string;
}

export type ExpenseDraft = ExpensePayload;
