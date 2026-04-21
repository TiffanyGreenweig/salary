import { Button } from 'antd-mobile';
import { AddOutline } from 'antd-mobile-icons';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { ExpenseFormSheet } from './components/ExpenseFormSheet';
import { ExpenseList } from './components/ExpenseList';
import { RemarkDialog } from './components/RemarkDialog';
import { StickyFilters } from './components/StickyFilters';
import { useRootStore } from './store/rootStoreContext';

const App = observer(function App() {
  const store = useRootStore();
  const categories = store.records.availableCategories;

  useEffect(() => {
    void store.initialize();
  }, [store]);

  return (
    <div className="app-shell">
      <div className="app-shell__gradient" />

      <main className="app-shell__content">
        <header className="page-header">
          <h1>消费记账</h1>
          <p>按周、月、年快速回看你的日常支出</p>
        </header>

        <StickyFilters
          categories={categories}
          range={store.filters.range}
          selectedCategoryIds={store.filters.categoryIds}
          selectedCategoryLabel={store.records.selectedCategoryLabel}
          onRangeChange={(range) => store.filters.setRange(range)}
          onCategoryChange={(categoryIds) => store.filters.setCategoryIds(categoryIds)}
        />

        <ExpenseList
          categories={categories}
          records={store.records.records}
          loading={store.records.loadingInitial || store.records.loading}
          error={store.records.error}
          onRemark={(record) => store.records.openRemark(record)}
          onEdit={(record) => store.records.openEditSheet(record)}
          onDelete={(record) => store.records.deleteRecord(record)}
          onRetry={() => void store.records.bootstrap()}
        />
      </main>

      <Button
        aria-label="添加消费"
        className="fab-button"
        color="primary"
        onClick={() => store.records.openCreateSheet()}
      >
        <AddOutline />
      </Button>

      <ExpenseFormSheet
        visible={store.records.sheetVisible}
        mode={store.records.sheetMode}
        categories={categories}
        initialRecord={store.records.editingRecord}
        submitting={store.records.submitting}
        onClose={() => store.records.closeSheet()}
        onSubmit={(payload) => store.records.submitRecord(payload)}
      />

      <RemarkDialog record={store.records.remarkRecord} onClose={() => store.records.closeRemark()} />
    </div>
  );
});

export default App;
