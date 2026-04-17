import { Button, DatePicker, Form, Input, Popup, Selector, TextArea } from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';

import type { Category, ExpenseDraft, ExpenseFormMode, ExpenseRecord } from '../types';
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

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
  );

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
      visible={visible}
      position="bottom"
      bodyStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '72vh' }}
      onMaskClick={onClose}
      destroyOnClose
    >
      <div className="form-sheet">
        <div className="form-sheet__header">
          <div>
            <p className="form-sheet__eyebrow">Expense Sheet</p>
            <h2>{mode === 'create' ? '添加消费' : '编辑消费'}</h2>
          </div>
          <Button fill="none" size="small" onClick={onClose}>
            关闭
          </Button>
        </div>

        <div className="form-sheet__body">
          <Form layout="horizontal" footer={null}>
            <div className="field-block">
              <Form.Item label="消费分类">
                <Selector
                  columns={4}
                  options={categoryOptions}
                  value={draft.categoryId ? [draft.categoryId] : []}
                  onChange={(value) => updateField('categoryId', value[0] ?? '')}
                />
              </Form.Item>
              {errors.categoryId ? <div className="field-error">{errors.categoryId}</div> : null}
            </div>

            <div className="field-block">
              <Form.Item label="消费金额">
                <Input
                  clearable
                  inputMode="decimal"
                  placeholder="请输入金额"
                  value={draft.amount}
                  onChange={(value) => updateField('amount', value)}
                />
              </Form.Item>
              {errors.amount ? <div className="field-error">{errors.amount}</div> : null}
            </div>

            <div className="field-block">
              <DatePicker
                precision="minute"
                title="消费时间"
                value={draft.spentAt ? new Date(draft.spentAt) : undefined}
                onConfirm={(value) => {
                  updateField('spentAt', value.toISOString());
                }}
              >
                {(value, actions) => (
                  <Form.Item label="消费时间" onClick={actions.open}>
                    <button className="picker-trigger" type="button" onClick={actions.open}>
                      {value ? formatDateTime(value.toISOString()) : '请选择时间'}
                    </button>
                  </Form.Item>
                )}
              </DatePicker>
              {errors.spentAt ? <div className="field-error">{errors.spentAt}</div> : null}
            </div>

            <div className="field-block">
              <Form.Item label="消费标题">
                <Input
                  clearable
                  maxLength={30}
                  placeholder="例如：午餐、打车、房租"
                  value={draft.title}
                  onChange={(value) => updateField('title', value)}
                />
              </Form.Item>
              {errors.title ? <div className="field-error">{errors.title}</div> : null}
            </div>

            <div className="field-block">
              <Form.Item label="消费备注">
                <TextArea
                  autoSize={{ minRows: 4, maxRows: 6 }}
                  maxLength={200}
                  placeholder="补充这笔消费的细节"
                  value={draft.remark}
                  onChange={(value) => updateField('remark', value)}
                />
              </Form.Item>
              {errors.remark ? <div className="field-error">{errors.remark}</div> : null}
            </div>
          </Form>
        </div>

        <div className="form-sheet__footer">
          <Button block color="primary" loading={submitting} onClick={() => void handleSubmit()}>
            {mode === 'create' ? '保存消费' : '更新消费'}
          </Button>
        </div>
      </div>
    </Popup>
  );
}
