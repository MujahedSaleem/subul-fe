import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OrderList, PaginatedOrders, OrderFilters, OrderRequest } from '../../types/order';
import axiosInstance from '../../utils/axiosInstance';
import { extractApiData, handleApiError } from '../../utils/apiResponseHandler';

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

// Track pending requests to prevent duplicates
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
  async (filters: OrderFilters, { rejectWithValue }) => {
    try {
      // Generate a unique key for this request
      const requestKey = generateCacheKey(filters);
      
      // Check if there's already a pending request with the same filters
      if (pendingFetchRequests.has(requestKey)) {
        console.log('Returning pending request for:', requestKey);
        return await pendingFetchRequests.get(requestKey)!;
      }

      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.distributorId) params.append('distributorId', filters.distributorId);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const requestPromise = axiosInstance.get(`/orders?${params.toString()}`).then(response => {
        const data = extractApiData<PaginatedOrders>(response.data);
        pendingFetchRequests.delete(requestKey);
        return data;
      });

      pendingFetchRequests.set(requestKey, requestPromise);
      console.log('Making new request for:', requestKey);
      return await requestPromise;
    } catch (error: any) {
      const requestKey = generateCacheKey(filters);
      pendingFetchRequests.delete(requestKey);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteOrder = createAsyncThunk<string, string>(
  'orders/deleteOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/orders/${id}`);
      // For delete operations, we only need to check if the response is successful
      // The API returns success without data for delete operations
      if (!response.data.success) {
        throw new Error('Delete operation failed');
      }
      return id;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
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
      const promise = axiosInstance.post(`/orders/${orderId}/confirm`).then(response => {
        clearOrdersCache(); // This will also set shouldBypassCache flag
        return extractApiData<OrderList>(response.data);
      });
      pendingConfirmRequests.set(requestKey, promise);
      const result = await promise;
      pendingConfirmRequests.delete(requestKey);
      return result;
    } catch (error: any) {
      pendingConfirmRequests.delete(requestKey);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getOrderById = createAsyncThunk<OrderList, string>(
  'orders/getOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const addOrder = createAsyncThunk<OrderList, OrderRequest>(
  'orders/addOrder',
  async (order: OrderRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/orders', order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateOrder = createAsyncThunk<OrderList, OrderRequest>(
  'orders/updateOrder',
  async (order: OrderRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${order.id}`, order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateOrderStatus = createAsyncThunk<
  OrderList,
  { orderId: string; status: string }
>(
  'orders/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/status`, { status });
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const assignOrderToDistributor = createAsyncThunk<
  OrderList,
  { orderId: string; distributorId: string }
>(
  'orders/assignOrderToDistributor',
  async ({ orderId, distributorId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/assign`, { distributorId });
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const unassignOrderFromDistributor = createAsyncThunk<
  OrderList,
  string
>(
  'orders/unassignOrderFromDistributor',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/unassign`);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const duplicateOrder = createAsyncThunk<OrderList, string>(
  'orders/duplicateOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/orders/${orderId}/duplicate`);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getOrdersByDistributor = createAsyncThunk<
  OrderList[],
  { distributorId: string; status?: string }
>(
  'orders/getOrdersByDistributor',
  async ({ distributorId, status }, { rejectWithValue }) => {
    try {
      const params = status ? { status } : {};
      const response = await axiosInstance.get(`/orders/distributor/${distributorId}`, { params });
      return extractApiData<OrderList[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getOrdersByCustomer = createAsyncThunk<OrderList[], string>(
  'orders/getOrdersByCustomer',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/customer/${customerId}`);
      return extractApiData<OrderList[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getOrdersByStatus = createAsyncThunk<OrderList[], string>(
  'orders/getOrdersByStatus',
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/orders/status/${status}`);
      return extractApiData<OrderList[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getOrdersByDateRange = createAsyncThunk<
  OrderList[],
  { startDate: string; endDate: string }
>(
  'orders/getOrdersByDateRange',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/orders/date-range', {
        params: { startDate, endDate }
      });
      return extractApiData<OrderList[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const searchOrders = createAsyncThunk<
  OrderList[],
  { query: string; filters?: Record<string, any> }
>(
  'orders/searchOrders',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/orders/search', {
        params: { query, ...filters }
      });
      return extractApiData<OrderList[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
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
        state.orders = state.orders.filter(order => order.id.toString() !== action.payload);
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
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(assignOrderToDistributor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(assignOrderToDistributor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(assignOrderToDistributor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(unassignOrderFromDistributor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unassignOrderFromDistributor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(unassignOrderFromDistributor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(duplicateOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(duplicateOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload); // Add to beginning
        state.total += 1;
      })
      .addCase(duplicateOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder } = ordersSlice.actions;

export default ordersSlice.reducer;