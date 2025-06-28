/// <reference types="node" />
/// <reference lib="es2015" />

import axiosInstance from "../utils/axiosInstance";
import { Customer, DistributorCreateCustomerRequest, Location } from "../types/customer";
import { OrderList, OrderRequest } from "../types/order";
import { useAppDispatch } from "../store/hooks";
import { fetchDistributorOrders, confirmDistributorOrder, deleteDistributorOrder, updateDistributorOrder, clearCurrentOrder } from "../store/slices/distributorOrdersSlice";

export class DistributorCustomersStore {

  private static instance: DistributorCustomersStore;
  private _customers: Customer[] = [];
  private _orders: OrderList[] = [];
  private listeners: (() => void)[] = [];
  private _isLoading: boolean = false;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private pendingCustomerFetches: Map<string, Promise<Customer | null>> = new Map();
  private dispatch: any = null;

  private constructor() {}

  static getInstance(): DistributorCustomersStore {
    if (!DistributorCustomersStore.instance) {
      DistributorCustomersStore.instance = new DistributorCustomersStore();
    }
    return DistributorCustomersStore.instance;
  }

  // Method to set the Redux dispatch function from a component
  setDispatch(dispatch: any) {
    this.dispatch = dispatch;
  }

  get isLoadingData(): boolean {
    return this._isLoading;
  }
  get orders():OrderList[]{
    return this. _orders;
  }
  get customers(): Customer[] {
    return this._customers;
  }
   generateOrderNumber = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `ORD${timestamp}`;
  };
  async findCustomerByPhone(phone: string): Promise<any> {
    const existingRequest = this.pendingCustomerFetches.get(phone);
    if (existingRequest) {
      return existingRequest;
    }

    const promise = new Promise<Customer | null>(async (resolve) => {
      try {
      const response = await axiosInstance.get<Customer>(`/distributors/customers`, {params:{phone:phone}});
        resolve(response.data);
      } catch (error) {
        console.error("Error fetching customer by phone:", error);
        resolve(null);
      }
    });

    this.pendingCustomerFetches.set(phone, promise);
    return promise;
  }

  async addCustomer(customer: Partial<DistributorCreateCustomerRequest>) {
    try {
      const response = await axiosInstance.post<Customer>("/distributors/customers", customer);
      this._customers = [...this._customers, response.data];
      this.notifyListeners();
      return response.data;
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  }

  async updateCustomer(customer: Customer) {
    try {
      const response = await axiosInstance.put<Customer>(`/distributors/customers/${customer.id}`, customer);
      const newCustomer = response.data;
      this._customers = this._customers.map((c) => (c.id === customer.id ? newCustomer : c));
      
      // Clear the current order cache to ensure fresh data is fetched
      if (this.dispatch) {
        this.dispatch(clearCurrentOrder());
      }
      
      this.notifyListeners();
      return newCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  }
  async fetchOrders() {
    this._isLoading = true;
    try {
      const response = await axiosInstance.get<OrderList[]>(`/distributors/orders`);
      this._orders = response.data;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    } finally {
      this._isLoading = false;
    }
  }

  async getOrderById(id: number): Promise<OrderList | null> {
    const requestKey = `getOrderById-${id}`;
    
    // Check if there's already a pending request for this ID
    const existingRequest = this.pendingRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    // Create a new request
    const requestPromise = (async () => {
      try {
        const response = await axiosInstance.get<OrderList>(`/distributors/orders/${id}`);
        const order = response.data;
        if (order) {
          // Add the order to the store without triggering a full refresh
          this._orders = [...this._orders, order];
        }
        return order;
      } finally {
        // Clean up the request from the map when done
        this.pendingRequests.delete(requestKey);
      }
    })();

    // Store the promise in the map
    this.pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  async addOrder(order: Partial<OrderRequest>): Promise<OrderList> {
    try {
      const response = await axiosInstance.post<OrderList>('/distributors/orders', order);
      return response.data;
    } catch (error) {
      console.error('Failed to add order:', error);
      throw error;
    }
  }

  async updateOrder(order: OrderRequest): Promise<boolean> {
    try {
      const response = await axiosInstance.put<OrderList>(`/distributors/orders/${order.id}`, order);
      return true;
    } catch (error) {
      console.error('Failed to update order:', error);
      return false;
    }
  }

  async confirmOrder(id: number): Promise<boolean> {
    try {
      await axiosInstance.post(`/distributors/orders/${id}/confirm`);
      return true;
    } catch (error) {
      console.error('Failed to confirm order:', error);
      return false;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      await axiosInstance.delete(`/distributors/orders/${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete order:', error);
      return false;
    }
  }

  async deactivateDistributor(): Promise<boolean> {
    try {
      await axiosInstance.post(`/distributors/deactivate`);
      return true;
    } catch (error) {
      console.error('Failed to deactivate distributor:', error);
      return false;
    }
  }
  async updateCustomerLocation(customerId: string, location:Location): Promise<boolean> {
    try {
      await axiosInstance.put(`/distributors/customers/${customerId}/locations/${location.id}`, location);
      
      // Clear the current order cache to ensure fresh data is fetched when editing orders
      if (this.dispatch) {
        this.dispatch(clearCurrentOrder());
      }
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to update customer location:', error);
      return false;
    }  }

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

export const distributorCustomersStore = DistributorCustomersStore.getInstance();