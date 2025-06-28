import axiosInstance from "../utils/axiosInstance";
import { Customer, Location, UpdateCustomerRequest } from "../types/customer";

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

  get isLoading(): boolean {
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

  async addCustomer(customer: Omit<Customer, 'id'>) {
    try {
      const response = await axiosInstance.post<Customer>("/customers", customer);
      const newCustomer = response.data;
      this._customers = [...this._customers, newCustomer];
      this.notifyListeners();
      return newCustomer;
    } catch (error) {
      console.error("Error adding customer:", error);
      throw error;
    }
  }

  async updateCustomer(customer: Customer) {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customer.id}`, customer);
      const updatedCustomer = response.data;
      const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
      if (index !== -1) {
        this._customers[index] = updatedCustomer;
      }
      this.notifyListeners();
      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  async updateCustomerWithFormat(customerId: string, updateRequest: UpdateCustomerRequest) {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customerId}`, updateRequest);
      const updatedCustomer = response.data;
      const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
      if (index !== -1) {
        this._customers[index] = updatedCustomer;
      }
      this.notifyListeners();
      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer with format:", error);
      throw error;
    }
  }

  async updateCustomerLocation(customerId: string, locationId: number, location: { name: string; coordinates: string; address: string }) {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customerId}/locations/${locationId}`, location);
      const updatedCustomer = response.data;
      const index = this._customers.findIndex(c => c.id === updatedCustomer.id);
      if (index !== -1) {
        this._customers[index] = updatedCustomer;
      }
      this.notifyListeners();
      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer location:", error);
      throw error;
    }
  }

  async deleteCustomer(id: string) {
    try {
      await axiosInstance.delete(`/customers/${id}`);
      this._customers = this._customers.filter(c => c.id !== id);
      this.notifyListeners();
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }

  subscribe(listener: () => void) {
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
      // Check if we already have the customer in our store
      const existingCustomer = this._customers.find(c => c.id === id);
      if (existingCustomer) {
        return existingCustomer;
      }

      // Check if there's an ongoing request for this customer
      const ongoingRequest = this.ongoingRequests.get(id);
      if (ongoingRequest) {
        return ongoingRequest;
      }

      // Create a new request
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
        address: "",
        isActive: true,
        customerId: ""
      }], 
      phone: locationData.phone 
    });
    
    return customer;
  }
}

export const customersStore = CustomersStore.getInstance();


