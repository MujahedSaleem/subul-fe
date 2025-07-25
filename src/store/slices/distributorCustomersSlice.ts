import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import { Customer,  } from '../../types/customer';
import { RootState } from '../store';
import { extractApiData, handleApiError } from '../../utils/apiResponseHandler';

interface DistributorCustomersState {
  customers: Customer[];
  currentCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  currentDistributorId: string | null;
  loading: boolean;
}

const initialState: DistributorCustomersState = {
  customers: [],
  currentCustomer: null,
  isLoading: false,
  error: null,
  initialized: false,
  currentDistributorId: null,
  loading: false,
};

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

// Find customer by phone
export const findCustomerByPhone = createAsyncThunk<Customer | null, string>(
  'distributorCustomers/findByPhone',
  async (phone, { rejectWithValue }) => {
    const requestKey = `findByPhone-${phone}`;
    
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }

    try {
      const promise = axiosInstance.get(`/distributors/customers`, { params: { phone } })
        .then(response => {
          try {
            return extractApiData<Customer>(response.data);
          } catch (error) {
            // If extractApiData fails, it means no customer was found
            return null;
          }
        })
        .catch(() => null) // Return null if customer not found
        .finally(() => {
          pendingRequests.delete(requestKey);
        });

      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error: any) {
      pendingRequests.delete(requestKey);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Fetch all customers
export const fetchDistributorCustomers = createAsyncThunk<Customer[], string>(
  'distributorCustomers/fetchDistributorCustomers',
  async (distributorId: string, { getState, rejectWithValue }) => {
    const state = getState() as { distributorCustomers: DistributorCustomersState };
    
    // Return existing data if already initialized for this distributor
    if (state.distributorCustomers.initialized && 
        state.distributorCustomers.currentDistributorId === distributorId && 
        !state.distributorCustomers.loading) {
      return state.distributorCustomers.customers;
    }
    
    // If there's already a pending request for this distributor, wait for it
    const requestKey = `fetchDistributorCustomers-${distributorId}`;
    if (pendingRequests.has(requestKey)) {
      return await pendingRequests.get(requestKey);
    }
    
    try {
      // Create and store the pending request
      const promise = axiosInstance.get(`/distributors/customers`)
        .then(response => {
          pendingRequests.delete(requestKey); // Clear when done
          return extractApiData<Customer[]>(response.data);
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

// Add customer
export const addDistributorCustomer = createAsyncThunk<Customer, {  customer: Omit<Customer, 'id'> }>(
  'distributorCustomers/addDistributorCustomer',
  async ({  customer }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/distributors/customers`, customer);
      return extractApiData<Customer>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update customer
export const updateDistributorCustomer = createAsyncThunk<Customer, {customer: Customer }>(
  'distributorCustomers/updateDistributorCustomer',
  async ({  customer }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/distributors/customers/${customer.id}`, customer);
      return extractApiData<Customer>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Update customer location (disabled due to backend 405 error)
export const updateDistributorCustomerLocation = createAsyncThunk<Customer, {  customerId: string; locationId: number; location: { name: string; coordinates: string; address: string } }>(
  'distributorCustomers/updateDistributorCustomerLocation',
  async ({  customerId, locationId, location }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/distributors/customers/${customerId}/locations/${locationId}`, location);
      return extractApiData<Customer>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Get customer by ID
export const getDistributorCustomerById = createAsyncThunk<Customer, {  customerId: string }>(
  'distributorCustomers/getDistributorCustomerById',
  async ({  customerId }, { rejectWithValue }) => {
    try {
      // Always fetch fresh customer data to ensure we get complete location information
      // Check if there's already a pending request for this customer
      const requestKey = `getDistributorCustomerById-${customerId}`;
      if (pendingRequests.has(requestKey)) {
        return await pendingRequests.get(requestKey);
      }

      // Create and store the pending request
      const requestPromise = axiosInstance.get(`/distributors/customers/${customerId}`)
        .then(response => {
          pendingRequests.delete(requestKey); // Clear when done
          return extractApiData<Customer>(response.data);
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

const distributorCustomersSlice = createSlice({
  name: 'distributorCustomers',
  initialState,
  reducers: {
    setCurrentCustomer: (state, action: PayloadAction<string>) => {
      state.currentCustomer = state.customers.find(c => c.id === action.payload) || null;
    },
    clearCurrentCustomer: (state) => {
      state.currentCustomer = null;
    },
    clearCustomersError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle findCustomerByPhone
      .addCase(findCustomerByPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findCustomerByPhone.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // Update or add customer in the list
          const existingIndex = state.customers.findIndex(c => c.id === action.payload!.id);
          if (existingIndex >= 0) {
            state.customers[existingIndex] = action.payload;
          } else {
            state.customers.push(action.payload);
          }
        }
      })
      .addCase(findCustomerByPhone.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchDistributorCustomers
      .addCase(fetchDistributorCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDistributorCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchDistributorCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle addDistributorCustomer
      .addCase(addDistributorCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addDistributorCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers.push(action.payload);
      })
      .addCase(addDistributorCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle updateDistributorCustomer
      .addCase(updateDistributorCustomer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDistributorCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index >= 0) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer?.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateDistributorCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle updateDistributorCustomerLocation
      .addCase(updateDistributorCustomerLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateDistributorCustomerLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index >= 0) {
          state.customers[index] = action.payload;
        }
        if (state.currentCustomer?.id === action.payload.id) {
          state.currentCustomer = action.payload;
        }
      })
      .addCase(updateDistributorCustomerLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle getDistributorCustomerById
      .addCase(getDistributorCustomerById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDistributorCustomerById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCustomer = action.payload;
        // Update customer in the list if it exists
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index >= 0) {
          state.customers[index] = action.payload;
        } else {
          state.customers.push(action.payload);
        }
      })
      .addCase(getDistributorCustomerById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCustomer, clearCurrentCustomer, clearCustomersError } = distributorCustomersSlice.actions;
export default distributorCustomersSlice.reducer;

// Selectors
export const selectDistributorCustomers = (state: RootState) => state.distributorCustomers.customers;
export const selectCurrentDistributorCustomer = (state: RootState) => state.distributorCustomers.currentCustomer;
export const selectDistributorCustomersLoading = (state: RootState) => state.distributorCustomers.isLoading;
export const selectDistributorCustomersError = (state: RootState) => state.distributorCustomers.error; 