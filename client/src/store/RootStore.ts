import { makeAutoObservable, runInAction } from 'mobx';

import { apiClient, getErrorMessage, type ApiClient } from '../api/client';
import type { Category, ExpenseFormMode, ExpensePayload, ExpenseRecord, RecordRange } from '../types';

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
  categoryId?: string = undefined;

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

  setCategory(categoryId?: string): void {
    if (this.categoryId === categoryId) {
      return;
    }

    this.categoryId = categoryId;
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

  get selectedCategoryName(): string {
    if (!this.root.filters.categoryId) {
      return '全部分类';
    }

    return this.categories.find((category) => category.id === this.root.filters.categoryId)?.name ?? '全部分类';
  }

  getCategoryById(categoryId: string): Category | undefined {
    return this.categories.find((category) => category.id === categoryId);
  }

  async bootstrap(): Promise<void> {
    this.loadingInitial = true;
    this.error = '';

    try {
      const [categories, records] = await Promise.all([
        this.root.api.getCategories(),
        this.root.api.getRecords({
          range: this.root.filters.range,
          categoryId: this.root.filters.categoryId,
        }),
      ]);

      runInAction(() => {
        this.categories = categories;
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
        categoryId: this.root.filters.categoryId,
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

  async submitRecord(payload: ExpensePayload): Promise<void> {
    this.submitting = true;
    this.error = '';

    try {
      if (this.sheetMode === 'create') {
        await this.root.api.createRecord(payload);
      } else if (this.editingRecord) {
        await this.root.api.updateRecord(this.editingRecord.id, payload);
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
