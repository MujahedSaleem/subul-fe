import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import { Customer, DistributorCreateCustomerRequest, Location } from '../../types/customer';
import { RootState } from '../store';

interface DistributorCustomersState {
  customers: Customer[];
  currentCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DistributorCustomersState = {
  customers: [],
  currentCustomer: null,
  isLoading: false,
  error: null,
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
      const promise = axiosInstance.get<Customer>(`/distributors/customers`, { params: { phone } })
        .then(response => response.data)
        .catch(() => null) // Return null if customer not found
        .finally(() => {
          pendingRequests.delete(requestKey);
        });

      pendingRequests.set(requestKey, promise);
      return await promise;
    } catch (error) {
      pendingRequests.delete(requestKey);
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to find customer');
      }
      return rejectWithValue('Failed to find customer');
    }
  }
);

// Fetch all customers
export const fetchDistributorCustomers = createAsyncThunk<Customer[]>(
  'distributorCustomers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Customer[]>('/distributors/customers');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
      }
      return rejectWithValue('Failed to fetch customers');
    }
  }
);

// Add customer
export const addDistributorCustomer = createAsyncThunk<Customer, Partial<DistributorCreateCustomerRequest>>(
  'distributorCustomers/add',
  async (customer, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<Customer>('/distributors/customers', customer);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add customer');
      }
      return rejectWithValue('Failed to add customer');
    }
  }
);

// Update customer
export const updateDistributorCustomer = createAsyncThunk<Customer, Customer>(
  'distributorCustomers/update',
  async (customer, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<Customer>(`/distributors/customers/${customer.id}`, customer);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
      }
      return rejectWithValue('Failed to update customer');
    }
  }
);

// Update customer location
export const updateDistributorCustomerLocation = createAsyncThunk<Customer, { customerId: string; location: Location }>(
  'distributorCustomers/updateLocation',
  async ({ customerId, location }, { rejectWithValue, dispatch }) => {
    try {
      await axiosInstance.put(`/distributors/customers/${customerId}/locations/${location.id}`, location);
      
      // Fetch the updated customer data to return
      const response = await axiosInstance.get<Customer>(`/distributors/customers/${customerId}`);
      
      // Clear current order cache when location is updated
      dispatch({ type: 'distributorOrders/clearCurrentOrder' });
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update customer location');
      }
      return rejectWithValue('Failed to update customer location');
    }
  }
);

// Get customer by ID
export const getDistributorCustomerById = createAsyncThunk<Customer, string>(
  'distributorCustomers/getById',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Customer>(`/distributors/customers/${customerId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
      }
      return rejectWithValue('Failed to fetch customer');
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