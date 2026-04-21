import type { Category } from '../types';
import { DEFAULT_CATEGORIES, resolveCategories } from '../utils/categories';

describe('resolveCategories', () => {
  it('reads category arrays from wrapped API payloads', () => {
    const result = resolveCategories({
      data: [
        {
          id: 'food',
          name: '餐饮',
          color: '#ff7a59',
          sort_order: 2,
        },
        {
          id: 'transport',
          name: '交通',
          color: '#2c9cff',
          sortOrder: 1,
        },
      ],
    });

    expect(result).toEqual<Category[]>([
      {
        id: 'transport',
        name: '交通',
        color: '#2c9cff',
        sortOrder: 1,
      },
      {
        id: 'food',
        name: '餐饮',
        color: '#ff7a59',
        sortOrder: 2,
      },
    ]);
  });

  it('falls back to built-in categories when the response is empty', () => {
    expect(resolveCategories([])).toEqual(DEFAULT_CATEGORIES);
    expect(resolveCategories({ data: [] })).toEqual(DEFAULT_CATEGORIES);
  });
});
