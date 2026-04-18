import { Button, Popup } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';

import type { ExpenseRecord } from '../types';

interface RemarkDialogProps {
  record: ExpenseRecord | null;
  onClose: () => void;
}

export function RemarkDialog({ record, onClose }: RemarkDialogProps) {
  return (
    <Popup
      className="remark-sheet-popup"
      visible={Boolean(record)}
      position="bottom"
      bodyStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      destroyOnClose
      onMaskClick={onClose}
      onClose={onClose}
    >
      <div className="remark-sheet">
        <div className="remark-sheet__handle" aria-hidden="true" />
        <div className="remark-sheet__header">
          <h3>{record?.title ?? '消费备注'}</h3>
          <button aria-label="关闭备注" className="remark-sheet__close" type="button" onClick={onClose}>
            <CloseOutline />
          </button>
        </div>

        <div className="remark-sheet__body">
          <div className="remark-sheet__content">{record?.remark || '暂无备注'}</div>
        </div>

        <div className="remark-sheet__footer">
          <Button block className="remark-sheet__button" color="primary" onClick={onClose}>
            知道了
          </Button>
        </div>
      </div>
    </Popup>
  );
}
