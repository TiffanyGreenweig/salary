import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import App from '../App';
import type { ApiClient } from '../api/client';
import { RootStore } from '../store/RootStore';
import { RootStoreProvider } from '../store/rootStoreContext';
import type { Category, ExpensePayload, ExpenseRecord, RecordFilter } from '../types';

const categories: Category[] = [
  { id: 'food', name: '餐饮', color: '#ff7a59', sortOrder: 1 },
  { id: 'transport', name: '交通', color: '#2c9cff', sortOrder: 2 },
];

function createMemoryApi(seedRecords: ExpenseRecord[]): ApiClient {
  let records = [...seedRecords];

  function filterRecords(filter: RecordFilter): ExpenseRecord[] {
    const categoryId = filter.categoryId;
    const filtered = categoryId ? records.filter((item) => item.categoryId === categoryId) : records;

    if (filter.range === 'week') {
      return filtered.filter((item) => item.id !== 'month-only');
    }

    if (filter.range === 'month') {
      return filtered.filter((item) => item.id !== 'year-only');
    }

    return filtered;
  }

  return {
    async getCategories() {
      return categories;
    },
    async getRecords(filter) {
      return filterRecords(filter);
    },
    async createRecord(payload: ExpensePayload) {
      const nextRecord: ExpenseRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date('2026-04-17T10:00:00.000Z').toISOString(),
        updatedAt: new Date('2026-04-17T10:00:00.000Z').toISOString(),
        ...payload,
      };
      records = [nextRecord, ...records];
      return nextRecord;
    },
    async updateRecord(recordId, payload) {
      records = records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              ...payload,
              updatedAt: new Date('2026-04-17T10:00:00.000Z').toISOString(),
            }
          : record,
      );
      return records.find((record) => record.id === recordId)!;
    },
    async deleteRecord(recordId) {
      records = records.filter((record) => record.id !== recordId);
    },
  };
}

function renderApp(api: ApiClient) {
  const store = new RootStore(api);

  return render(
    <RootStoreProvider store={store}>
      <App />
    </RootStoreProvider>,
  );
}

describe('expense app', () => {
  it('switches ranges, opens remark dialog, and validates the create sheet', async () => {
    const api = createMemoryApi([
      {
        id: 'week-record',
        categoryId: 'food',
        amount: '26.50',
        title: '午餐',
        remark: '公司附近的面馆',
        spentAt: '2026-04-15T04:00:00.000Z',
        createdAt: '2026-04-15T04:00:00.000Z',
        updatedAt: '2026-04-15T04:00:00.000Z',
      },
      {
        id: 'month-only',
        categoryId: 'transport',
        amount: '30.00',
        title: '打车',
        remark: '',
        spentAt: '2026-04-02T01:00:00.000Z',
        createdAt: '2026-04-02T01:00:00.000Z',
        updatedAt: '2026-04-02T01:00:00.000Z',
      },
      {
        id: 'year-only',
        categoryId: 'food',
        amount: '88.00',
        title: '聚餐',
        remark: '上月结算',
        spentAt: '2026-03-10T10:30:00.000Z',
        createdAt: '2026-03-10T10:30:00.000Z',
        updatedAt: '2026-03-10T10:30:00.000Z',
      },
    ]);

    renderApp(api);

    expect(await screen.findByText('打车')).toBeInTheDocument();

    fireEvent.click(screen.getByText('当周'));
    await waitFor(() => {
      expect(screen.queryByText('打车')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '+ 添加消费' }));
    expect(await screen.findByText('添加消费')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '保存消费' }));
    expect(await screen.findByText('请选择消费分类')).toBeInTheDocument();
    expect(screen.getByText('请输入消费金额')).toBeInTheDocument();
    expect(screen.getByText('请输入消费标题')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByRole('button', { name: /午餐/ }));
    expect(await screen.findByText('公司附近的面馆')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    });
  });

  it('creates a new record and refreshes the list', async () => {
    const api = createMemoryApi([]);
    renderApp(api);

    fireEvent.click(await screen.findByRole('button', { name: '+ 添加消费' }));

    const foodSelector = screen.getByText('餐饮').closest('.adm-selector-item') as HTMLElement;
    fireEvent.click(foodSelector);
    fireEvent.change(screen.getByPlaceholderText('请输入金额'), { target: { value: '48' } });
    fireEvent.change(screen.getByPlaceholderText('例如：午餐、打车、房租'), { target: { value: '晚餐' } });
    fireEvent.change(screen.getByPlaceholderText('补充这笔消费的细节'), {
      target: { value: '和朋友一起吃饭' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存消费' }));

    expect(await screen.findByText('晚餐')).toBeInTheDocument();
    expect(screen.getByText('¥48.00')).toBeInTheDocument();
  });
});
