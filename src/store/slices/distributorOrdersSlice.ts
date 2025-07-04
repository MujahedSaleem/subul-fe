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
export const fetchDistributorOrders = createAsyncThunk<OrderList[], string>(
  'distributorOrders/fetchDistributorOrders',
  async (distributorId: string, { getState, rejectWithValue }) => {
    const state = getState() as { distributorOrders: DistributorOrdersState };
    
    // Return existing data if already initialized for this distributor
    if (state.distributorOrders.initialized && 
        state.distributorOrders.currentDistributorId === distributorId && 
        !state.distributorOrders.loading) {
      return state.distributorOrders.orders;
    }
    
    // If there's already a pending request for this distributor, wait for it
    const requestKey = `fetchDistributorOrders-${distributorId}`;
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
export const getDistributorOrderById = createAsyncThunk<OrderList, { distributorId: string; orderId: number }>(
  'distributorOrders/getDistributorOrderById',
  async ({ distributorId, orderId }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { distributorOrders: DistributorOrdersState };
      
      // Check if order already exists in state
      const existingOrder = state.distributorOrders.orders.find(o => o.id === orderId);
      if (existingOrder) {
        return existingOrder;
      }

      // Check if there's already a pending request for this order
      const requestKey = `getDistributorOrderById-${distributorId}-${orderId}`;
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
export const addDistributorOrder = createAsyncThunk<OrderList, { distributorId: string; order: OrderRequest }>(
  'distributorOrders/addDistributorOrder',
  async ({ distributorId, order }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/distributors/orders`, order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update an existing order
export const updateDistributorOrder = createAsyncThunk<OrderList, { distributorId: string; order: OrderRequest }>(
  'distributorOrders/updateDistributorOrder',
  async ({ distributorId, order }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/distributors/orders/${order.id}`, order);
      return extractApiData<OrderList>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Confirm an order
export const confirmDistributorOrder = createAsyncThunk<OrderList, { distributorId: string; orderId: number }>(
  'distributorOrders/confirmDistributorOrder',
  async ({ distributorId, orderId }, { rejectWithValue }) => {
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all orders
      .addCase(fetchDistributorOrders.pending, (state) => {
        console.log('Fetching orders pending...');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDistributorOrders.fulfilled, (state, action) => {
        console.log('Fetching orders fulfilled:', action.payload);
        state.isLoading = false;
        state.orders = action.payload;
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
      .addCase(addDistributorOrder.fulfilled, (state) => {
        state.isLoading = false;
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
      .addCase(updateDistributorOrder.fulfilled, (state) => {
        state.isLoading = false;
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
      .addCase(confirmDistributorOrder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(confirmDistributorOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete order
      .addCase(deleteDistributorOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteDistributorOrder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deleteDistributorOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentOrder, clearErrors } = distributorOrdersSlice.actions;
export default distributorOrdersSlice.reducer; 