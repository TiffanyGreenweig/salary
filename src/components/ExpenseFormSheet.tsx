import { Button, DatePicker, Input, Popup, TextArea } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { useEffect, useMemo, useState } from 'react';

import type { Category, ExpenseDraft, ExpenseFormMode, ExpenseRecord } from '../types';
import { getCategoryVisual } from '../utils/categoryVisuals';
import { createDraftFromRecord, createEmptyDraft, normalizeDraft, validateExpenseDraft, type DraftErrors } from '../utils/expenseForm';
import { formatDateTime } from '../utils/format';

interface ExpenseFormSheetProps {
  visible: boolean;
  mode: ExpenseFormMode;
  categories: Category[];
  initialRecord: ExpenseRecord | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ExpenseDraft) => Promise<void>;
}

function getInitialDraft(mode: ExpenseFormMode, initialRecord: ExpenseRecord | null): ExpenseDraft {
  if (mode === 'edit' && initialRecord) {
    return createDraftFromRecord(initialRecord);
  }

  return createEmptyDraft();
}

export function ExpenseFormSheet({
  visible,
  mode,
  categories,
  initialRecord,
  submitting,
  onClose,
  onSubmit,
}: ExpenseFormSheetProps) {
  const [draft, setDraft] = useState<ExpenseDraft>(() => getInitialDraft(mode, initialRecord));
  const [errors, setErrors] = useState<DraftErrors>({});

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDraft(getInitialDraft(mode, initialRecord));
    setErrors({});
  }, [visible, mode, initialRecord]);

  const orderedCategories = useMemo(() => categories, [categories]);

  function updateField<K extends keyof ExpenseDraft>(field: K, value: ExpenseDraft[K]): void {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit(): Promise<void> {
    const nextErrors = validateExpenseDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit(normalizeDraft(draft));
  }

  return (
    <Popup
      className="expense-sheet-popup"
      visible={visible}
      position="bottom"
      bodyStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '72vh' }}
      onMaskClick={onClose}
      destroyOnClose
    >
      <div className="form-sheet">
        <div className="form-sheet__handle" aria-hidden="true" />
        <div className="form-sheet__header">
          <h2>{mode === 'create' ? '添加消费' : '编辑消费'}</h2>
          <button aria-label="关闭" className="form-sheet__close" type="button" onClick={onClose}>
            <CloseOutline />
          </button>
        </div>

        <div className="form-sheet__body">
          <div className="form-field">
            <label className="form-field__label">消费分类</label>
            <div className="category-picker" role="group" aria-label="消费分类">
              {orderedCategories.map((category) => {
                const { Icon, tone } = getCategoryVisual(category.id);
                const selected = draft.categoryId === category.id;

                return (
                  <button
                    key={category.id}
                    aria-pressed={selected}
                    className={`category-option ${selected ? 'category-option--selected' : ''}`}
                    type="button"
                    onClick={() => updateField('categoryId', category.id)}
                  >
                    <span className={`category-option__icon category-option__icon--${selected ? 'selected' : tone}`}>
                      <Icon />
                    </span>
                    <span className="category-option__label">{category.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId ? <div className="field-error">{errors.categoryId}</div> : null}
          </div>

          <div className="form-field">
            <label className="form-field__label">消费金额</label>
            <div className="form-input-shell form-input-shell--currency">
              <span className="form-input-shell__prefix">¥</span>
              <Input
                clearable
                inputMode="decimal"
                placeholder="0.00"
                value={draft.amount}
                onChange={(value) => updateField('amount', value)}
              />
            </div>
            {errors.amount ? <div className="field-error">{errors.amount}</div> : null}
          </div>

          <div className="form-field">
            <label className="form-field__label">消费时间</label>
            <DatePicker
              precision="minute"
              title="消费时间"
              value={draft.spentAt ? new Date(draft.spentAt) : undefined}
              onConfirm={(value) => {
                updateField('spentAt', value.toISOString());
              }}
            >
              {(value, actions) => (
                <button className="form-picker" type="button" onClick={actions.open}>
                  {value ? formatDateTime(value.toISOString()) : '例如: 14:30'}
                </button>
              )}
            </DatePicker>
            {errors.spentAt ? <div className="field-error">{errors.spentAt}</div> : null}
          </div>

          <div className="form-field">
            <label className="form-field__label">消费标题</label>
            <div className="form-input-shell">
                <Input
                  clearable
                  maxLength={30}
                  placeholder="例如: 午餐"
                  value={draft.title}
                  onChange={(value) => updateField('title', value)}
                />
            </div>
            {errors.title ? <div className="field-error">{errors.title}</div> : null}
          </div>

          <div className="form-field">
            <label className="form-field__label">消费备注</label>
            <div className="form-textarea-shell">
              <TextArea
                autoSize={{ minRows: 4, maxRows: 6 }}
                maxLength={200}
                placeholder="记录更多信息（可选）"
                value={draft.remark}
                onChange={(value) => updateField('remark', value)}
              />
            </div>
            {errors.remark ? <div className="field-error">{errors.remark}</div> : null}
          </div>
        </div>

        <div className="form-sheet__footer">
          <Button
            block
            className="form-sheet__submit"
            color="primary"
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            {mode === 'create' ? '保存消费' : '更新消费'}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
