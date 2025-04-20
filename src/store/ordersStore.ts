import { OrderRequest, OrderList, PaginatedOrders } from '../types/order';
import axiosInstance from '../utils/axiosInstance';

class OrdersStore {
  private static instance: OrdersStore;
  private _orders: OrderList[] = [];
  private _isLoading: boolean = false;
  private _isInitialized: boolean = false;
  private _total: number = 0;
  private _page: number = 1;
  private _pageSize: number = 10;
  private _totalPages: number = 0;
  private listeners: (() => void)[] = [];
  private pendingGetOrderById: Map<number, Promise<OrderList | null>> = new Map();

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

  get total(): number {
    return this._total;
  }

  get page(): number {
    return this._page;
  }

  get pageSize(): number {
    return this._pageSize;
  }

  get totalPages(): number {
    return this._totalPages;
  }

  get isLoading(): boolean {
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

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  async fetchOrders(
    pageNumber: number = 1,
    pageSize: number = 10,
    filters: {
      distributorId?: string | null;
      status?: string | null;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ) {
    if (this._isLoading) return;
    
    this._isLoading = true;
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      if (filters.distributorId) {
        params.append('distributorId', filters.distributorId);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.dateFrom) {
        params.append('fromDate', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('toDate', filters.dateTo);
      }

      const response = await axiosInstance.get<PaginatedOrders>(`/orders?${params.toString()}`);
      this._orders = response.data.items;
      this._total = response.data.totalCount;
      this._page = response.data.pageNumber;
      this._pageSize = response.data.pageSize;
      this._totalPages = response.data.totalPages;
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
    // Check if we already have the order in the store
    const existingOrder = this.orders.find(order => order.id === id);
    if (existingOrder) {
      return existingOrder;
    }

    // Check if there's already a pending request for this order
    const pendingRequest = this.pendingGetOrderById.get(id);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create a new request
    const request = (async () => {
      try {
        const response = await axiosInstance.get<OrderList>(`/orders/${id}`);
        const order = response.data;
        
        // Add the order to the store
        this._orders = [...this._orders, order];
        
        // Remove the pending request
        this.pendingGetOrderById.delete(id);
        
        return order;
      } catch (error) {
        console.error('Error fetching order:', error);
        // Remove the pending request on error
        this.pendingGetOrderById.delete(id);
        return null;
      }
    })();

    // Store the pending request
    this.pendingGetOrderById.set(id, request);

    return request;
  }

  async addOrder(order: Partial<OrderRequest>): Promise<OrderList> {
    try {
      const response = await axiosInstance.post<OrderList>('/orders', order);
      const newOrder = response.data;
      this._orders = [...this._orders, newOrder];
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
      this._orders = this._orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
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