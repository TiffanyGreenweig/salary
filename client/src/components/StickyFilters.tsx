import { Button, CapsuleTabs, Popover } from 'antd-mobile';

import type { Category, RecordRange } from '../types';

interface StickyFiltersProps {
  categories: Category[];
  range: RecordRange;
  selectedCategoryId?: string;
  selectedCategoryLabel: string;
  onRangeChange: (range: RecordRange) => void;
  onCategoryChange: (categoryId?: string) => void;
}

export function StickyFilters({
  categories,
  range,
  selectedCategoryId,
  selectedCategoryLabel,
  onRangeChange,
  onCategoryChange,
}: StickyFiltersProps) {
  const actions = [
    {
      key: 'all',
      text: selectedCategoryId ? '全部分类' : '✓ 全部分类',
    },
    ...categories.map((category) => ({
      key: category.id,
      text: selectedCategoryId === category.id ? `✓ ${category.name}` : category.name,
    })),
  ];

  return (
    <section className="sticky-filters">
      <CapsuleTabs activeKey={range} onChange={(key) => onRangeChange(key as RecordRange)}>
        <CapsuleTabs.Tab title="当周" key="week" />
        <CapsuleTabs.Tab title="当月" key="month" />
        <CapsuleTabs.Tab title="当年" key="year" />
      </CapsuleTabs>

      <Popover.Menu
        actions={actions}
        placement="bottom-end"
        onAction={(action) => onCategoryChange(action.key === 'all' ? undefined : String(action.key))}
      >
        <Button color="primary" fill="outline" size="small">
          {selectedCategoryLabel}
        </Button>
      </Popover.Menu>
    </section>
  );
}
