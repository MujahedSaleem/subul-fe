import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { OrderList, PaginatedOrders, OrderFilters } from '../../types/order';
import axiosInstance from '../../utils/axiosInstance';
import { AxiosError } from 'axios';

interface OrdersState {
  orders: OrderList[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
};

interface FetchOrdersParams {
  pageNumber?: number;
  pageSize?: number;
  filters?: {
    distributorId?: string | null;
    status?: string | null;
    dateFrom?: string;
    dateTo?: string;
  };
}

// Helper function to generate cache key
const generateCacheKey = (params: FetchOrdersParams): string => {
  return JSON.stringify({
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 10,
    filters: {
      distributorId: params.filters?.distributorId || null,
      status: params.filters?.status || null,
      dateFrom: params.filters?.dateFrom || null,
      dateTo: params.filters?.dateTo || null
    }
  });
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Separate maps for different types of requests
const pendingFetchRequests = new Map<string, Promise<PaginatedOrders>>();
const pendingConfirmRequests = new Map<string, Promise<OrderList>>();
const pendingDeleteRequests = new Map<string, Promise<number>>();

export const fetchOrders = createAsyncThunk<PaginatedOrders, OrderFilters>(
  'orders/fetchOrders',
  async (filters, { rejectWithValue }) => {
    const requestKey = JSON.stringify(filters);
    const existingRequest = pendingFetchRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.get<PaginatedOrders>('/orders', { params: filters }).then(response => response.data);
      pendingFetchRequests.set(requestKey, promise);
      const result = await promise;
      pendingFetchRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingFetchRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
      }
      return rejectWithValue('Failed to fetch orders');
    }
  }
);

export const deleteOrder = createAsyncThunk<number, number>(
  'orders/deleteOrder',
  async (orderId, { rejectWithValue }) => {
    const requestKey = `delete-${orderId}`;
    const existingRequest = pendingDeleteRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.delete(`/orders/${orderId}`).then(() => orderId);
      pendingDeleteRequests.set(requestKey, promise);
      const result = await promise;
      pendingDeleteRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingDeleteRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete order');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  }
);

export const confirmOrder = createAsyncThunk<OrderList, number>(
  'orders/confirmOrder',
  async (orderId, { rejectWithValue }) => {
    const requestKey = `confirm-${orderId}`;
    const existingRequest = pendingConfirmRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.post<OrderList>(`/orders/${orderId}/confirm`).then(response => response.data);
      pendingConfirmRequests.set(requestKey, promise);
      const result = await promise;
      pendingConfirmRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingConfirmRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to confirm order');
      }
      return rejectWithValue('Failed to confirm order');
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.items;
        state.total = action.payload.totalCount;
        state.page = action.payload.pageNumber;
        state.pageSize = action.payload.pageSize;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = state.orders.filter(order => order.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(confirmOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(confirmOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const ordersReducer = ordersSlice.reducer;
export default ordersSlice.reducer;