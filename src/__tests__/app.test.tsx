import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import App from '../App';
import type { ApiClient } from '../api/client';
import { RootStore } from '../store/RootStore';
import { RootStoreProvider } from '../store/rootStoreContext';
import type { Category, ExpensePayload, ExpenseRecord } from '../types';

const categories: Category[] = [
  { id: 'food', name: '餐饮', color: '#ff7a59', sortOrder: 1 },
  { id: 'transport', name: '交通', color: '#2c9cff', sortOrder: 2 },
];

function createMemoryApi(seedRecords: ExpenseRecord[]): ApiClient {
  let records = [...seedRecords];

  function filterRecords(filter: any): ExpenseRecord[] {
    const categoryIds: string[] = filter.categoryIds ?? [];
    const filtered = categoryIds.length > 0 ? records.filter((item) => categoryIds.includes(item.categoryId)) : records;

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
  it('switches ranges, opens remark only from the title icon, and validates the create sheet', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: '添加消费' }));
    expect(await screen.findByText('添加消费')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '保存消费' }));
    expect(await screen.findByText('请选择消费分类')).toBeInTheDocument();
    expect(screen.getByText('请输入消费金额')).toBeInTheDocument();
    expect(screen.getByText('请输入消费标题')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    fireEvent.click(screen.getByText('午餐'));
    expect(screen.queryByText('公司附近的面馆')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '查看午餐备注' }));
    expect(await screen.findByText('公司附近的面馆')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    });
  });

  it('applies multi-select category filters with confirm and clear actions', async () => {
    const api = createMemoryApi([
      {
        id: 'food-record',
        categoryId: 'food',
        amount: '26.50',
        title: '午餐',
        remark: '',
        spentAt: '2026-04-15T04:00:00.000Z',
        createdAt: '2026-04-15T04:00:00.000Z',
        updatedAt: '2026-04-15T04:00:00.000Z',
      },
      {
        id: 'transport-record',
        categoryId: 'transport',
        amount: '30.00',
        title: '打车',
        remark: '',
        spentAt: '2026-04-15T05:00:00.000Z',
        createdAt: '2026-04-15T05:00:00.000Z',
        updatedAt: '2026-04-15T05:00:00.000Z',
      },
      {
        id: 'clothes-record',
        categoryId: 'clothes',
        amount: '120.00',
        title: '买衣服',
        remark: '',
        spentAt: '2026-04-15T06:00:00.000Z',
        createdAt: '2026-04-15T06:00:00.000Z',
        updatedAt: '2026-04-15T06:00:00.000Z',
      },
    ]);

    renderApp(api);

    expect(await screen.findByText('买衣服')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '分类筛选：全部分类' }));
    expect(await screen.findByText('筛选记录')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: '餐饮' }));
    fireEvent.click(screen.getByRole('button', { name: '交通' }));
    fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '分类筛选：已选 2 类' })).toBeInTheDocument();
    });
    expect(screen.getByText('午餐')).toBeInTheDocument();
    expect(screen.getByText('打车')).toBeInTheDocument();
    expect(screen.queryByText('买衣服')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '分类筛选：已选 2 类' }));
    fireEvent.click(await screen.findByRole('button', { name: '清空' }));
    fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '分类筛选：全部分类' })).toBeInTheDocument();
    });
    expect(screen.getByText('买衣服')).toBeInTheDocument();
  });

  it('creates a new record and refreshes the list', async () => {
    const api = createMemoryApi([]);
    renderApp(api);

    fireEvent.click(await screen.findByRole('button', { name: '添加消费' }));

    fireEvent.click(screen.getByRole('button', { name: /餐饮/ }));
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '48' } });
    fireEvent.change(screen.getByPlaceholderText('例如: 午餐'), { target: { value: '晚餐' } });
    fireEvent.change(screen.getByPlaceholderText('记录更多信息（可选）'), {
      target: { value: '和朋友一起吃饭' },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存消费' }));

    expect(await screen.findByText('晚餐')).toBeInTheDocument();
    expect(screen.getByText('¥48.00')).toBeInTheDocument();
  });

  it('falls back to built-in categories when the API returns none', async () => {
    const api = createMemoryApi([]);
    api.getCategories = async () => [];

    renderApp(api);

    fireEvent.click(await screen.findByRole('button', { name: '添加消费' }));

    expect(await screen.findByRole('button', { name: /餐饮/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /交通/ })).toBeInTheDocument();
  });
});
