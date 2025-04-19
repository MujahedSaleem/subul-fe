import { OrderRequest, OrderList } from '../types/order';
import axiosInstance from '../utils/axiosInstance';

class OrdersStore {
  private static instance: OrdersStore;
  private _orders: OrderList[] = [];
  private _isLoading: boolean = false;
  private _isInitialized: boolean = false;
  private listeners: (() => void)[] = [];

  private constructor() {}

  static getInstance(): OrdersStore {
    if (!OrdersStore.instance) {
      OrdersStore.instance = new OrdersStore();
    }
    return OrdersStore.instance;
  }

  get orders(): OrderList[] {
    return this._orders;
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

  async fetchOrders() {
    if (this._isLoading) return;
    this._isLoading = true;
    try {
      const response = await axiosInstance.get<OrderList[]>('/orders');
      this._orders = response.data;
      this._isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    } finally {
      this._isLoading = false;
    }
  }

  async getOrderById(id: number): Promise<OrderList | null> {
    try {
      // First check if the order is in the store
      const existingOrder = this._orders.find(o => o.id === id);
      if (existingOrder) {
        return existingOrder;
      }

      // If not in store, try to fetch it directly
      const response = await axiosInstance.get<OrderList>(`/orders/${id}`);
      const order = response.data;
      
      // Add the order to the store
      this._orders = [...this._orders, order];
      this.notifyListeners();
      
      return order;
    } catch (error) {
      console.error('Failed to get order:', error);
      return null;
    }
  }

  async addOrder(order: Partial<OrderRequest>): Promise<OrderList> {
    try {
      const response = await axiosInstance.post<OrderList>('/orders', order);
      const newOrder = response.data;
      const existingOrderIndex = this._orders.findIndex(o => o.id === newOrder.id);
      if (existingOrderIndex !== -1) {
        this._orders[existingOrderIndex] = newOrder;
      } else {
        this._orders = [...this._orders, newOrder];
      }
      this.notifyListeners();
      return newOrder;
    } catch (error) {
      console.error('Failed to add order:', error);
      throw error;
    }
  }

  async updateOrder(order: OrderRequest): Promise<boolean> {
    try {
      const response = await axiosInstance.put<OrderList>(`/orders/${order.id}`, order);
      const updatedOrder = response.data;
      const existingOrderIndex = this._orders.findIndex(o => o.id === updatedOrder.id);
      if (existingOrderIndex !== -1) {
        this._orders[existingOrderIndex] = updatedOrder;
      } else {
        this._orders = [...this._orders, updatedOrder];
      }
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to update order:', error);
      return false;
    }
  }

  async confirmOrder(id: number): Promise<boolean> {
    try {
      await axiosInstance.post(`/orders/${id}/confirm`);
      this._orders = this._orders.map(o =>
        o.id === id ? { ...o, status: 'Confirmed', confirmedAt: new Date().toISOString() } : o
      );
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to confirm order:', error);
      return false;
    }
  }

  async deleteOrder(id: number): Promise<boolean> {
    try {
      await axiosInstance.delete(`/orders/${id}`);
      this._orders = this._orders.filter(o => o.id !== id);
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to delete order:', error);
      return false;
    }
  }

  setOrders(orders: OrderList[]) {
    this._orders = orders;
    this.notifyListeners();
  }
}

export const ordersStore = OrdersStore.getInstance();