import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import { OrderList, PaginatedOrders, OrderFilters, OrderRequest } from '../../types/order';
import axiosInstance from '../../utils/axiosInstance';
import { AxiosError } from 'axios';

interface OrdersState {
  orders: OrderList[];
  currentOrder: OrderList | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
  isLoading: false,
  error: null,
};

interface CacheEntry {
  data: PaginatedOrders;
  etag: string;
  timestamp: number;
}

// Cache duration (60 seconds)
const CACHE_DURATION = 60 * 1000;

// Cache storage
const cache = new Map<string, CacheEntry>();

// Separate maps for different types of requests
const pendingFetchRequests = new Map<string, Promise<PaginatedOrders>>();
const pendingConfirmRequests = new Map<string, Promise<OrderList>>();
const pendingDeleteRequests = new Map<string, Promise<number>>();

// Add a flag to track if we need to bypass cache
let shouldBypassCache = false;

// Helper function to set bypass cache flag
const setBypassCache = () => {
  shouldBypassCache = true;
};

// Helper function to generate cache key
const generateCacheKey = (filters: OrderFilters): string => {
  return JSON.stringify({
    page: filters.page || 1,
    pageSize: filters.pageSize || 10,
    distributorId: filters.distributorId || null,
    status: filters.status || null,
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null
  });
};

// Helper function to check if cache entry is valid
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// Helper function to clear cache entries related to orders
const clearOrdersCache = () => {
  cache.clear();
  setBypassCache();
};

export const fetchOrders = createAsyncThunk<PaginatedOrders, OrderFilters>(
  'orders/fetchOrders',
  async (filters, { rejectWithValue }) => {
    const requestKey = generateCacheKey(filters);
    const existingRequest = pendingFetchRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const cachedEntry = cache.get(requestKey);
      const headers: Record<string, string> = {};
      
      if (shouldBypassCache) {
        headers['Cache-Control'] = 'no-cache';
        shouldBypassCache = false; // Reset flag after using it
      } else if (cachedEntry && isCacheValid(cachedEntry)) {
        headers['If-None-Match'] = cachedEntry.etag;
      }

      const promise = axiosInstance.get<PaginatedOrders>('/orders', {
        params: {
          pageNumber: filters.page || 1,
          pageSize: filters.pageSize || 10,
          distributorId: filters.distributorId,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        },
        headers,
        validateStatus: (status) => status === 200 || status === 304
      }).then(response => {
        if (response.status === 304 && cachedEntry) {
          return cachedEntry.data;
        }

        const etag = response.headers['etag'];
        if (etag) {
          cache.set(requestKey, {
            data: response.data,
            etag: etag,
            timestamp: Date.now()
          });
        }
        return response.data;
      });

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
      const promise = axiosInstance.delete(`/orders/${orderId}`).then(() => {
        clearOrdersCache(); // This will also set shouldBypassCache flag
        return orderId;
      });
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
      const promise = axiosInstance.post<OrderList>(`/orders/${orderId}/confirm`).then(response => {
        clearOrdersCache(); // This will also set shouldBypassCache flag
        return response.data;
      });
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

export const getOrderById = createAsyncThunk<OrderList, number>(
  'orders/getOrderById',
  async (orderId, { rejectWithValue }) => {
    const requestKey = `getById-${orderId}`;
    const existingRequest = pendingConfirmRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.get<OrderList>(`/orders/${orderId}`).then(response => {
        return response.data;
      });
      pendingConfirmRequests.set(requestKey, promise);
      const result = await promise;
      pendingConfirmRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingConfirmRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to get order');
      }
      return rejectWithValue('Failed to get order');
    }
  }
);

export const addOrder = createAsyncThunk<OrderList, Partial<OrderRequest>>(
  'orders/addOrder',
  async (order, { rejectWithValue }) => {
    const requestKey = 'addOrder';
    const existingRequest = pendingConfirmRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.post<OrderList>('/orders', order).then(response => {
        clearOrdersCache(); // This will also set shouldBypassCache flag
        return response.data;
      });
      pendingConfirmRequests.set(requestKey, promise);
      const result = await promise;
      pendingConfirmRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingConfirmRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add order');
      }
      return rejectWithValue('Failed to add order');
    }
  }
);

export const updateOrder = createAsyncThunk<OrderList, OrderRequest>(
  'orders/updateOrder',
  async (order, { rejectWithValue }) => {
    const requestKey = `update-${order.id}`;
    const existingRequest = pendingConfirmRequests.get(requestKey);
    
    if (existingRequest) {
      return existingRequest;
    }

    try {
      const promise = axiosInstance.put<OrderList>(`/orders/${order.id}`, order).then(response => {
        clearOrdersCache(); // This will also set shouldBypassCache flag
        return response.data;
      });
      pendingConfirmRequests.set(requestKey, promise);
      const result = await promise;
      pendingConfirmRequests.delete(requestKey);
      return result;
    } catch (error) {
      pendingConfirmRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update order');
      }
      return rejectWithValue('Failed to update order');
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<OrderList | null>) => {
      state.currentOrder = action.payload;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    }
  },
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
      .addCase(getOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        // Also add to orders array if not already present
        const existingIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (existingIndex === -1) {
          state.orders.push(action.payload);
        } else {
          state.orders[existingIndex] = action.payload;
        }
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.currentOrder = null;
      })
      .addCase(addOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload); // Add to beginning
        state.total += 1;
      })
      .addCase(addOrder.rejected, (state, action) => {
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
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(confirmOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;
export default ordersSlice.reducer;