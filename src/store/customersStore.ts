import axiosInstance from "../utils/axiosInstance";
import { Customer } from "../types/customer";

class CustomersStore {
  private static instance: CustomersStore;
  private _customers: Customer[] = [];
  private listeners: (() => void)[] = [];
  private _isLoading: boolean = false;
  private _isInitialized: boolean = false;
  private ongoingRequests: Map<string, Promise<Customer>> = new Map();

  private constructor() {}

  static getInstance(): CustomersStore {
    if (!CustomersStore.instance) {
      CustomersStore.instance = new CustomersStore();
    }
    return CustomersStore.instance;
  }

  get customers(): Customer[] {
    return this._customers;
  }

  get isLoadingData(): boolean {
    return this._isLoading;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async findCustomerByPhone(phone: string) {
    if (this._isLoading ) return; // ✅ Prevent multiple fetch calls
    this._isLoading = true;

    try {
      const response = await axiosInstance.get<Customer[]>("/customers/filter", {params:{phone:phone}});
      this._customers = [...this._customers, ...response.data];
      this.notifyListeners();
      return response.data[0]
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      this._isLoading = false;
    }  }

  async fetchCustomers() {
    if (this._isLoading || this._isInitialized) return;
    this._isLoading = true;

    try {
      const response = await axiosInstance.get<Customer[]>("/customers");
      this._customers = response.data;
      this._isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
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

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      // Check if there's already an ongoing request for this ID
      const existingRequest = this.ongoingRequests.get(id);
      if (existingRequest) {
        return existingRequest;
      }

      // Check if the customer exists in the store
      const existingCustomer = this._customers.find(customer => customer.id === id);
      if (existingCustomer) {
        return existingCustomer;
      }

      // Create a new request promise
      const requestPromise = (async () => {
        try {
          const response = await axiosInstance.get<Customer>(`/customers/${id}`);
          const customer = response.data;
          
          // Add the customer to the store without triggering a full refresh
          this._customers = [...this._customers, customer];
          
          return customer;
        } finally {
          // Clean up the request from the map when done
          this.ongoingRequests.delete(id);
        }
      })();

      // Store the promise in the map
      this.ongoingRequests.set(id, requestPromise);

      return requestPromise;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
  }

  async findOrCreateCustomer(customerName: string, locationData: { name: string; coordinates: string; phone: string; }) {
    let customer = this._customers.find(c => c.name === customerName);
    
    if (customer) {
      return customer;
    }
  
    customer = await this.addCustomer({ 
      name: customerName, 
      locations: [{ 
        id: 0, // Temporary ID, will be replaced by server
        name: locationData.name, 
        coordinates: locationData.coordinates, 
        description: "" 
      }], 
      phone: locationData.phone 
    });
    
    return customer;
  }
}

export const customersStore = CustomersStore.getInstance();
