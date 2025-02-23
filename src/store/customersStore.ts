import axiosInstance from "../utils/axiosInstance";
import { Customer } from "../types/customer";

class CustomersStore {

  private static instance: CustomersStore;
  private _customers: Customer[] = [];
  private listeners: (() => void)[] = [];
  private _isLoading: boolean = false; // ✅ Prevent duplicate API calls

  private constructor() {}

  static getInstance(): CustomersStore {
    if (!CustomersStore.instance) {
      CustomersStore.instance = new CustomersStore();
    }
    return CustomersStore.instance;
  }
  get isLoadingData(): boolean {
    return this._isLoading;
  }
  get customers(): Customer[] {
    return this._customers;
  }

  async fetchCustomers() {
    if (this._isLoading ) return; // ✅ Prevent multiple fetch calls
    this._isLoading = true;

    try {
      const response = await axiosInstance.get<Customer[]>("/customers");
      this._customers = response.data;
      this.notifyListeners();
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      this._isLoading = false;
    }
  }

  async addCustomer(customer: Partial<Customer>) {
    try {
      const response = await axiosInstance.post<Customer>("/customers", customer);
      this._customers = [...this._customers, response.data];
      this.notifyListeners();
      return response.data;
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  }

  async updateCustomer(customer: Customer) {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customer.id}`, customer);
      const newCustomer = response.data;
      this._customers = this._customers.map((c) => (c.id === customer.id ? newCustomer : c));
      this.notifyListeners();
      return newCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  }

  async deleteCustomer(id: number) {
    try {
      await axiosInstance.delete(`/customers/${id}`);
      this._customers = this._customers.filter((c) => c.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
  async findOrCreateCustomer(customerName: string, arg1: { name: string; coordinates: string; phone: string; }) {
    let customer = this._customers.find(c => c.name === customerName);
    
    if (customer) {
      return customer;
    }
  
    customer = await this.addCustomer({ name: customerName, locations: [{ id: 1, name: arg1.name, coordinates: arg1.coordinates, description: "" }], phone: arg1.phone });
    
    return customer;
  }
}

export const customersStore = CustomersStore.getInstance();
