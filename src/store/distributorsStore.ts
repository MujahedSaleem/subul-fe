import { Distributor } from "../types/distributor";
import axiosInstance from "../utils/axiosInstance";

class DistributorsStore {
  private static instance: DistributorsStore;
  private _distributors: Distributor[] = [];
  private isLoading: boolean = false;
  private _isFetched: boolean = false; // New flag to track if data has been fetched

  private constructor() {}

  static getInstance(): DistributorsStore {
    if (!DistributorsStore.instance) {
      DistributorsStore.instance = new DistributorsStore();
    }
    return DistributorsStore.instance;
  }

  get distributors(): Distributor[] {
    return this._distributors;
  }

  get isLoadingData(): boolean {
    return this.isLoading;
  }
  get isFetched(): boolean {
    return this._isFetched;
  }

  async fetchDistributors() {
    this.isLoading = true;
    try {
      const response = await axiosInstance.get<Distributor[]>('/distributors');
      this._distributors = response.data; // Includes orderCount
      this._isFetched = true; // Mark data as fetched

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async addDistributor(distributor: Omit<Distributor, 'id' | 'createdAt'>): Promise<string> {
    try {
      const response = await axiosInstance.post<Distributor>('/distributors', distributor);
      this._distributors = [...this._distributors, response.data];
      this.notifyListeners();
      return response.data.id; // Return the ID of the newly created distributor
    } catch (error) {
      console.error('Failed to add distributor:', error);
      throw error;
    }
  }

  async updateDistributor(distributor: Distributor): Promise<boolean> {
      // Call the API to update the distributor
      await axiosInstance.put(`/distributors/${distributor.id}`, distributor);
  
      // Update the internal state
      this._distributors = this._distributors.map((d) =>
        d.id === distributor.id ? distributor : d
      );
  
      // Notify all subscribers about the update
      this.notifyListeners();
  
      return true;
  }

  async deleteDistributor(id: string) {
    try {
      await axiosInstance.delete(`/distributors/${id}`);
      this._distributors = this._distributors.filter((d) => d.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to delete distributor:', error);
    }
  }

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const distributorsStore = DistributorsStore.getInstance()