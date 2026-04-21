import { Button, Popup } from 'antd-mobile';
import { CheckOutline, CloseOutline, FilterOutline } from 'antd-mobile-icons';
import { useEffect, useMemo, useState } from 'react';

import type { Category, RecordRange } from '../types';

interface StickyFiltersProps {
  categories: Category[];
  range: RecordRange;
  selectedCategoryIds: string[];
  selectedCategoryLabel: string;
  onRangeChange: (range: RecordRange) => void;
  onCategoryChange: (categoryIds: string[]) => void;
}

export function StickyFilters({
  categories,
  range,
  selectedCategoryIds,
  selectedCategoryLabel,
  onRangeChange,
  onCategoryChange,
}: StickyFiltersProps) {
  const [visible, setVisible] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState<string[]>(selectedCategoryIds);

  useEffect(() => {
    if (!visible) {
      setDraftCategoryIds(selectedCategoryIds);
    }
  }, [selectedCategoryIds, visible]);

  const selectedCategoryIdSet = useMemo(() => new Set(draftCategoryIds), [draftCategoryIds]);
  const draftSelectionLabel = draftCategoryIds.length === 0 ? '全部分类' : `已选 ${draftCategoryIds.length} 类`;

  const toggleCategory = (categoryId: string) => {
    setDraftCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((item) => item !== categoryId) : [...current, categoryId],
    );
  };

  const closeSheet = () => {
    setVisible(false);
  };

  const confirmSelection = () => {
    onCategoryChange(draftCategoryIds);
    closeSheet();
  };

  const clearSelection = () => {
    setDraftCategoryIds([]);
  };

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

      <button
        aria-label={`分类筛选：${selectedCategoryLabel}`}
        className={`filter-button ${selectedCategoryIds.length > 0 ? 'filter-button--active' : ''}`}
        type="button"
        onClick={() => setVisible(true)}
      >
        <FilterOutline />
        {selectedCategoryIds.length > 0 ? <span className="filter-button__dot" /> : null}
      </button>

      <Popup
        className="filter-sheet-popup"
        visible={visible}
        position="bottom"
        bodyStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '52vh' }}
        destroyOnClose
        onMaskClick={closeSheet}
        onClose={closeSheet}
      >
        <div className="filter-sheet">
          <div className="filter-sheet__handle" aria-hidden="true" />
          <div className="filter-sheet__header">
            <div className="filter-sheet__header-copy">
              <p>列表筛选</p>
              <h3>筛选记录</h3>
              <span>{draftSelectionLabel}</span>
            </div>
            <button aria-label="关闭筛选" className="filter-sheet__close" type="button" onClick={closeSheet}>
              <CloseOutline />
            </button>
          </div>

          <div className="filter-sheet__body">
            <div className="filter-sheet__section">
              <div className="filter-sheet__section-heading">
                <span className="filter-sheet__section-title">消费分类</span>
                <span className="filter-sheet__section-meta">可多选，确定后生效</span>
              </div>

              <div className="filter-sheet__list">
                {categories.map((category) => {
                  const selected = selectedCategoryIdSet.has(category.id);

                  return (
                    <button
                      aria-pressed={selected}
                      className={`filter-sheet__item ${selected ? 'filter-sheet__item--selected' : ''}`}
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <span>{category.name}</span>
                      {selected ? <CheckOutline aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="filter-sheet__footer">
            <Button block fill="outline" className="filter-sheet__action filter-sheet__action--secondary" onClick={clearSelection}>
              清空
            </Button>
            <Button block color="primary" className="filter-sheet__action filter-sheet__action--primary" onClick={confirmSelection}>
              确定
            </Button>
          </div>
        </div>
      </Popup>
    </section>
  );
}
