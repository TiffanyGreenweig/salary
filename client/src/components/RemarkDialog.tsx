import { Dialog } from 'antd-mobile';

import type { ExpenseRecord } from '../types';

interface RemarkDialogProps {
  record: ExpenseRecord | null;
  onClose: () => void;
}

export function RemarkDialog({ record, onClose }: RemarkDialogProps) {
  return (
    <Dialog
      visible={Boolean(record)}
      title={record?.title ?? '消费备注'}
      content={<div className="remark-dialog__content">{record?.remark || '暂无备注'}</div>}
      actions={[
        {
          key: 'confirm',
          text: '知道了',
        },
      ]}
      closeOnAction
      onAction={onClose}
      onClose={onClose}
    />
  );
}
