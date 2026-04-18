import { Popover } from 'antd-mobile';
import { FilterOutline } from 'antd-mobile-icons';

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
      <div className="range-tabs" role="tablist" aria-label="时间范围">
        {([
          ['week', '当周'],
          ['month', '当月'],
          ['year', '当年'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`range-tab ${range === key ? 'range-tab--active' : ''}`}
            role="tab"
            aria-selected={range === key}
            type="button"
            onClick={() => onRangeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <Popover.Menu
        actions={actions}
        placement="bottom-end"
        onAction={(action) => onCategoryChange(action.key === 'all' ? undefined : String(action.key))}
      >
        <button
          aria-label={`分类筛选：${selectedCategoryLabel}`}
          className={`filter-button ${selectedCategoryId ? 'filter-button--active' : ''}`}
          type="button"
        >
          <FilterOutline />
          {selectedCategoryId ? <span className="filter-button__dot" /> : null}
        </button>
      </Popover.Menu>
    </section>
  );
}
