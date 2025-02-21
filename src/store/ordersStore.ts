import { OrderRequest, OrderList } from '../types/order';
import axiosInstance from '../utils/axiosInstance';

class OrdersStore {
  private static instance: OrdersStore;
  private _orders: OrderList[] = [];
  private _isFetched: boolean = false;
  private _isLoading: boolean = false;
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

  get isFetched(): boolean {
    return this._isFetched;
  }

  get isLoadingData(): boolean {
    return this._isLoading;
  }

  async fetchOrders() {
    this._isLoading = true;
    try {
      const response = await axiosInstance.get<OrderList[]>('/orders');
      this._orders = response.data;
      this._isFetched = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      this._isLoading = false;
      this.notifyListeners();
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

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const ordersStore = OrdersStore.getInstance();