import { makeAutoObservable, runInAction } from 'mobx';

import { apiClient, getErrorMessage, type ApiClient } from '../api/client';
import type { Category, ExpenseFormMode, ExpensePayload, ExpenseRecord, RecordRange } from '../types';
import { resolveCategories } from '../utils/categories';
import { matchesRecordFilter, sortRecords } from '../utils/recordFilters';

export class RootStore {
  readonly api: ApiClient;
  readonly filters: FilterStore;
  readonly records: RecordStore;
  private initializePromise?: Promise<void>;

  constructor(api: ApiClient = apiClient) {
    this.api = api;
    this.filters = new FilterStore(this);
    this.records = new RecordStore(this);

    makeAutoObservable(this, {
      api: false,
    });
  }

  async initialize(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        await this.records.bootstrap();
      })();
    }

    await this.initializePromise;
  }
}

export class FilterStore {
  readonly root: RootStore;
  range: RecordRange = 'month';
  categoryIds: string[] = [];

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, {
      root: false,
    });
  }

  setRange(range: RecordRange): void {
    if (this.range === range) {
      return;
    }

    this.range = range;
    void this.root.records.loadRecords();
  }

  setCategoryIds(categoryIds: string[]): void {
    if (this.categoryIds.length === categoryIds.length && this.categoryIds.every((categoryId, index) => categoryId === categoryIds[index])) {
      return;
    }

    this.categoryIds = categoryIds;
    void this.root.records.loadRecords();
  }
}

export class RecordStore {
  readonly root: RootStore;
  categories: Category[] = [];
  records: ExpenseRecord[] = [];
  loading = false;
  loadingInitial = true;
  submitting = false;
  error = '';
  sheetVisible = false;
  sheetMode: ExpenseFormMode = 'create';
  editingRecordId?: string = undefined;
  remarkRecord: ExpenseRecord | null = null;

  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, {
      root: false,
    });
  }

  get editingRecord(): ExpenseRecord | null {
    if (!this.editingRecordId) {
      return null;
    }

    return this.records.find((record) => record.id === this.editingRecordId) ?? null;
  }

  get selectedCategoryLabel(): string {
    if (this.root.filters.categoryIds.length === 0) {
      return '全部分类';
    }

    if (this.root.filters.categoryIds.length === 1) {
      return this.availableCategories.find((category) => category.id === this.root.filters.categoryIds[0])?.name ?? '全部分类';
    }

    return `已选 ${this.root.filters.categoryIds.length} 类`;
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.availableCategories.find((category) => category.id === categoryId);
  }

  get availableCategories(): Category[] {
    return resolveCategories(this.categories);
  }

  async bootstrap(): Promise<void> {
    this.loadingInitial = true;
    this.error = '';

    try {
      const [categories, records] = await Promise.all([
        this.root.api.getCategories(),
        this.root.api.getRecords({
          range: this.root.filters.range,
          categoryIds: this.root.filters.categoryIds,
        }),
      ]);

      runInAction(() => {
        this.categories = resolveCategories(categories);
        this.records = records;
      });
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.loadingInitial = false;
      });
    }
  }

  async loadRecords(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const records = await this.root.api.getRecords({
        range: this.root.filters.range,
        categoryIds: this.root.filters.categoryIds,
      });

      runInAction(() => {
        this.records = records;
      });
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.loadingInitial = false;
      });
    }
  }

  openCreateSheet(): void {
    this.sheetMode = 'create';
    this.editingRecordId = undefined;
    this.sheetVisible = true;
  }

  openEditSheet(record: ExpenseRecord): void {
    this.sheetMode = 'edit';
    this.editingRecordId = record.id;
    this.sheetVisible = true;
  }

  closeSheet(): void {
    if (this.submitting) {
      return;
    }

    this.sheetVisible = false;
    this.editingRecordId = undefined;
  }

  openRemark(record: ExpenseRecord): void {
    this.remarkRecord = record;
  }

  closeRemark(): void {
    this.remarkRecord = null;
  }

  private syncVisibleRecord(record: ExpenseRecord): void {
    const filter = {
      range: this.root.filters.range,
      categoryIds: this.root.filters.categoryIds,
    };

    if (!matchesRecordFilter(record, filter)) {
      this.records = this.records.filter((item) => item.id !== record.id);
      return;
    }

    const nextRecords = this.records.filter((item) => item.id !== record.id);
    nextRecords.unshift(record);
    this.records = sortRecords(nextRecords);
  }

  async submitRecord(payload: ExpensePayload): Promise<void> {
    this.submitting = true;
    this.error = '';

    try {
      let savedRecord: ExpenseRecord | null = null;

      if (this.sheetMode === 'create') {
        savedRecord = await this.root.api.createRecord(payload);
      } else if (this.editingRecord) {
        savedRecord = await this.root.api.updateRecord(this.editingRecord.id, payload);
      }

      if (savedRecord) {
        runInAction(() => {
          this.syncVisibleRecord(savedRecord);
        });
      }

      runInAction(() => {
        this.sheetVisible = false;
        this.editingRecordId = undefined;
      });

      await this.loadRecords();
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error);
      });
      throw error;
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async deleteRecord(record: ExpenseRecord): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      await this.root.api.deleteRecord(record.id);
      if (this.remarkRecord?.id === record.id) {
        this.remarkRecord = null;
      }
      await this.loadRecords();
    } catch (error) {
      runInAction(() => {
        this.error = getErrorMessage(error);
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }
}
