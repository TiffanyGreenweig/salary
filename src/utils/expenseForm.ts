import dayjs from 'dayjs';

import type { ExpenseDraft, ExpenseRecord } from '../types';

export type DraftErrors = Partial<Record<keyof ExpenseDraft, string>>;

export function createEmptyDraft(): ExpenseDraft {
  return {
    categoryId: '',
    amount: '',
    title: '',
    remark: '',
    spentAt: dayjs().toISOString(),
  };
}

export function createDraftFromRecord(record: ExpenseRecord): ExpenseDraft {
  return {
    categoryId: record.categoryId,
    amount: record.amount,
    title: record.title,
    remark: record.remark,
    spentAt: record.spentAt,
  };
}

export function validateExpenseDraft(draft: ExpenseDraft): DraftErrors {
  const errors: DraftErrors = {};
  const normalizedAmount = draft.amount.trim();

  if (!draft.categoryId) {
    errors.categoryId = '请选择消费分类';
  }

  if (!normalizedAmount) {
    errors.amount = '请输入消费金额';
  } else if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount) || Number(normalizedAmount) <= 0) {
    errors.amount = '金额需大于 0，且最多两位小数';
  }

  if (!draft.spentAt) {
    errors.spentAt = '请选择消费时间';
  }

  const title = draft.title.trim();
  if (!title) {
    errors.title = '请输入消费标题';
  } else if (title.length > 30) {
    errors.title = '标题最多 30 个字符';
  }

  if (draft.remark.trim().length > 200) {
    errors.remark = '备注最多 200 个字符';
  }

  return errors;
}

export function normalizeDraft(draft: ExpenseDraft): ExpenseDraft {
  return {
    categoryId: draft.categoryId,
    amount: Number(draft.amount).toFixed(2),
    title: draft.title.trim(),
    remark: draft.remark.trim(),
    spentAt: draft.spentAt,
  };
}
