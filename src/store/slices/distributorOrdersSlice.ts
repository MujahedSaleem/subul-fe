import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OrderList, OrderRequest } from '../../types/order';
import axiosInstance from '../../utils/axiosInstance';
import { extractApiData, handleApiError } from '../../utils/apiResponseHandler';

interface DistributorOrdersState {
  orders: OrderList[];
  isLoading: boolean;
  error: string | null;
  currentOrder: OrderList | null;
  initialized: boolean;
  currentDistributorId: string | null;
  loading: boolean;
}

const initialState: DistributorOrdersState = {
  orders: [],
  isLoading: false,
  error: null,
  currentOrder: null,
  initialized: false,
  currentDistributorId: null,
  loading: false
};

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Fetch all orders for the distributor
export const fetchDistributorOrders = createAsyncThunk<OrderList[], boolean | undefined>(
  'distributorOrders/fetchDistributorOrders',
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    const state = getState() as { distributorOrders: DistributorOrdersState };
    
    // Return existing data if already initialized and not forcing refresh
    if (state.distributorOrders.initialized && 
        !state.distributorOrders.loading && 
        !forceRefresh) {
      return state.distributorOrders.orders;
    }
    
    // If there's already a pending request, wait for it
    const requestKey = `fetchDistributorOrders`;
    if (pendingRequests.has(requestKey)) {
      return await pendingRequests.get(requestKey);
    }
    
    try {
      // Create and store the pending request
      const promise = axiosInstance.get(`/distributors/orders`)
        .then(response => {
          pendingRequests.delete(requestKey); // Clear when done
          return extractApiData<OrderList[]>(response.data);
        })
        .catch(error => {
          pendingRequests.delete(requestKey); // Clear on error too
          throw error;
        });
      
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Get a specific order by ID
export const getDistributorOrderById = createAsyncThunk<OrderList, number>(
  'distributorOrders/getDistributorOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      // Always fetch fresh data from API, don't use cached data
      // Check if there's already a pending request for this order
      const requestKey = `getDistributorOrderById-${orderId}`;
      if (pendingRequests.has(requestKey)) {
        return await pendingRequests.get(requestKey);
      }

      // Create and store the pending request
      const requestPromise = axiosInstance.get(`/distributors/orders/${orderId}`)
        .then(response => {
          pendingRequests.delete(requestKey); // Clear when done
          return extractApiData<OrderList>(response.data);
        })
        .catch(error => {
          pendingRequests.delete(requestKey); // Clear on error too
          throw error;
        });

      pendingRequests.set(requestKey, requestPromise);
      return await requestPromise;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Add a new order
export const addDistributorOrder = createAsyncThunk<OrderList, OrderRequest>(
  'distributorOrders/addDistributorOrder',
  async (order, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/distributors/orders`, order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update an existing order
export const updateDistributorOrder = createAsyncThunk<OrderList, OrderRequest>(
  'distributorOrders/updateDistributorOrder',
  async (order, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/distributors/orders/${order.id}`, order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Confirm an order
export const confirmDistributorOrder = createAsyncThunk<OrderList, number>(
  'distributorOrders/confirmDistributorOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/distributors/orders/${orderId}/confirm`);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const distributorOrdersSlice = createSlice({
  name: 'distributorOrders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearErrors: (state) => {
      state.error = null;
    },
    forceRefresh: (state) => {
      state.initialized = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchDistributorOrders.pending, (state) => {
        // Remove console.log
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDistributorOrders.fulfilled, (state, action) => {
        // Remove console.log
        state.isLoading = false;
        state.orders = action.payload;
        state.initialized = true;
      })
      .addCase(fetchDistributorOrders.rejected, (state, action) => {
        console.error('Fetching orders rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get order by ID
      .addCase(getDistributorOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDistributorOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        
        // Update the order in the orders array if it exists
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
      })
      .addCase(getDistributorOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add order
      .addCase(addDistributorOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDistributorOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new order to the orders array
        state.orders.unshift(action.payload);
      })
      .addCase(addDistributorOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update order
      .addCase(updateDistributorOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDistributorOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the order in the orders array
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
      })
      .addCase(updateDistributorOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Confirm order
      .addCase(confirmDistributorOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmDistributorOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the confirmed order in the orders array
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        // Also update currentOrder if it matches
        if (state.currentOrder && state.currentOrder.id === action.payload.id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(confirmDistributorOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
  }
});

export const { clearCurrentOrder, clearErrors, forceRefresh } = distributorOrdersSlice.actions;
export default distributorOrdersSlice.reducer; 