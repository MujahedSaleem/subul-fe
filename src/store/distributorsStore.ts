import { AuthResult } from "../types/authResult";
import { Distributor } from "../types/distributor";
import axiosInstance from "../utils/axiosInstance";

class DistributorsStore {
 
  private static instance: DistributorsStore;
  private _distributors: Distributor[] = [];
  private _isLoading: boolean = false;
  private _isInitialized: boolean = false;
  private listeners: (() => void)[] = [];

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
    return this._isLoading;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async fetchDistributors() {
    if (this._isLoading || this._isInitialized) return;
    this._isLoading = true;
    try {
      const response = await axiosInstance.get<Distributor[]>('/distributors');
      this._distributors = response.data;
      this._isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch distributors:', error);
      throw error;
    } finally {
      this._isLoading = false;
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

  async changeDistributorPassword(
    selectedDistributorId: string,
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> {
    try {
      // Prepare the request payload
      const passwordUpdateRequest = {
        userId: selectedDistributorId,
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      // Send the request to the backend API
      const response = await axiosInstance.post<AuthResult>(
        "/auth/updatePassword",
        passwordUpdateRequest
      );

      // Check if the update was successful
      if (response.data.succeeded) {
        return true; // Password updated successfully
      } else {
        throw new Error(response.data.error || "Failed to update password");
      }
    } catch (error: any) {
      console.error("Failed to change distributor password:", error.message);
      throw new Error(error.response?.data?.error || "An error occurred while updating the password.");
    }
  }
}

export const distributorsStore = DistributorsStore.getInstance()