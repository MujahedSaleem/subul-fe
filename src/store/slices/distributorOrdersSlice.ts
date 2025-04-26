import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { OrderList, OrderRequest } from '../../types/order';
import axiosInstance from '../../utils/axiosInstance';
import { AxiosError } from 'axios';

interface DistributorOrdersState {
  orders: OrderList[];
  isLoading: boolean;
  error: string | null;
  currentOrder: OrderList | null;
}

const initialState: DistributorOrdersState = {
  orders: [],
  isLoading: false,
  error: null,
  currentOrder: null
};

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Fetch all orders for the distributor
export const fetchDistributorOrders = createAsyncThunk(
  'distributorOrders/fetchAll',
  async (_, { rejectWithValue }) => {
    const requestKey = 'fetchDistributorOrders';
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log('Using existing request for fetchDistributorOrders');
      return pendingRequests.get(requestKey);
    }

    try {
      console.log('Fetching distributor orders...');
      const promise = axiosInstance.get<OrderList[]>('/distributors/orders')
        .then(response => {
          console.log('Fetched orders:', response.data);
          return response.data;
        })
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      console.error('Error fetching distributor orders:', error);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
      }
      return rejectWithValue('Failed to fetch orders');
    }
  }
);

// Get a specific order by ID
export const getDistributorOrderById = createAsyncThunk(
  'distributorOrders/getById',
  async (id: number, { rejectWithValue }) => {
    const requestKey = `getDistributorOrderById-${id}`;
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log(`Using existing request for getDistributorOrderById-${id}`);
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.get<OrderList>(`/distributors/orders/${id}`)
        .then(response => response.data)
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
      }
      return rejectWithValue('Failed to fetch order');
    }
  }
);

// Add a new order
export const addDistributorOrder = createAsyncThunk(
  'distributorOrders/add',
  async (order: Partial<OrderRequest>, { dispatch, rejectWithValue }) => {
    const requestKey = 'addDistributorOrder';
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log('Using existing request for addDistributorOrder');
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.post<OrderList>('/distributors/orders', order)
        .then(response => {
          // Fetch fresh data after adding
          dispatch(fetchDistributorOrders());
          return response.data;
        })
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add order');
      }
      return rejectWithValue('Failed to add order');
    }
  }
);

// Update an existing order
export const updateDistributorOrder = createAsyncThunk(
  'distributorOrders/update',
  async (order: OrderRequest, { dispatch, rejectWithValue }) => {
    const requestKey = `updateDistributorOrder-${order.id}`;
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log(`Using existing request for updateDistributorOrder-${order.id}`);
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.put<OrderList>(`/distributors/orders/${order.id}`, order)
        .then(async response => {
          // Fetch fresh data after update
          dispatch(fetchDistributorOrders());
          return response.data;
        })
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update order');
      }
      return rejectWithValue('Failed to update order');
    }
  }
);

// Confirm an order
export const confirmDistributorOrder = createAsyncThunk(
  'distributorOrders/confirm',
  async (id: number, { dispatch, rejectWithValue }) => {
    const requestKey = `confirmDistributorOrder-${id}`;
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log(`Using existing request for confirmDistributorOrder-${id}`);
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.post(`/distributors/orders/${id}/confirm`)
        .then(async () => {
          // Fetch fresh data after confirmation
          dispatch(fetchDistributorOrders());
          return id;
        })
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to confirm order');
      }
      return rejectWithValue('Failed to confirm order');
    }
  }
);

// Delete an order
export const deleteDistributorOrder = createAsyncThunk(
  'distributorOrders/delete',
  async (id: number, { dispatch, rejectWithValue }) => {
    const requestKey = `deleteDistributorOrder-${id}`;
    
    // If there's already a pending request, return it
    if (pendingRequests.has(requestKey)) {
      console.log(`Using existing request for deleteDistributorOrder-${id}`);
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.delete(`/distributors/orders/${id}`)
        .then(async () => {
          // Fetch fresh data after deletion
          dispatch(fetchDistributorOrders());
          return id;
        })
        .finally(() => {
          // Clean up the pending request
          pendingRequests.delete(requestKey);
        });

      // Store the promise in the map
      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      // Clean up the pending request on error
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete order');
      }
      return rejectWithValue('Failed to delete order');
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