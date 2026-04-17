import { Button, Dialog, SwipeAction } from 'antd-mobile';

import type { Category, ExpenseRecord } from '../types';
import { formatCurrency, formatRecordTime } from '../utils/format';

interface ExpenseListProps {
  records: ExpenseRecord[];
  categories: Category[];
  loading: boolean;
  error: string;
  onRemark: (record: ExpenseRecord) => void;
  onEdit: (record: ExpenseRecord) => void;
  onDelete: (record: ExpenseRecord) => Promise<void>;
  onRetry: () => void;
}

export function ExpenseList({
  records,
  categories,
  loading,
  error,
  onRemark,
  onEdit,
  onDelete,
  onRetry,
}: ExpenseListProps) {
  if (loading && records.length === 0) {
    return (
      <div className="state-card">
        <p className="state-card__title">正在加载消费记录...</p>
      </div>
    );
  }

  if (error && records.length === 0) {
    return (
      <div className="state-card">
        <p className="state-card__title">数据加载失败</p>
        <p className="state-card__description">{error}</p>
        <Button color="primary" size="small" onClick={onRetry}>
          重新加载
        </Button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="state-card">
        <p className="state-card__title">当前筛选条件下还没有消费记录</p>
        <p className="state-card__description">点击右下角按钮，先记下第一笔支出。</p>
      </div>
    );
  }

  return (
    <section className="expense-list" aria-label="消费列表">
      {records.map((record) => {
        const category = categories.find((item) => item.id === record.categoryId);
        const categoryName = category?.name ?? '未分类';
        const categoryColor = category?.color ?? '#5b6474';

        return (
          <SwipeAction
            key={record.id}
            rightActions={[
              {
                key: 'edit',
                text: '编辑',
                color: 'primary',
                onClick: () => onEdit(record),
              },
              {
                key: 'delete',
                text: '删除',
                color: 'danger',
                onClick: async () => {
                  const confirmed = await Dialog.confirm({
                    content: `确认删除“${record.title}”吗？`,
                    confirmText: '删除',
                    cancelText: '取消',
                  });

                  if (confirmed) {
                    await onDelete(record);
                  }
                },
              },
            ]}
          >
            <button className="expense-card" type="button" onClick={() => onRemark(record)}>
              <div className="expense-card__top">
                <span className="expense-card__category" style={{ backgroundColor: categoryColor }}>
                  {categoryName}
                </span>
                <span className="expense-card__amount">{formatCurrency(record.amount)}</span>
              </div>

              <div className="expense-card__bottom">
                <div>
                  <h3 className="expense-card__title">{record.title}</h3>
                  <p className="expense-card__time">{formatRecordTime(record.spentAt)}</p>
                </div>
                <span className="expense-card__hint">点击查看备注</span>
              </div>
            </button>
          </SwipeAction>
        );
      })}
    </section>
  );
}
