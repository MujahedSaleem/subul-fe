import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import { Customer, UpdateCustomerRequest } from '../../types/customer';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  error: null,
  initialized: false,
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Customer[]>('/customers');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customer: Omit<Customer, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<Customer>('/customers', customer);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (customer: Customer, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customer.id}`, customer);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

export const updateCustomerWithFormat = createAsyncThunk(
  'customers/updateCustomerWithFormat',
  async ({ customerId, updateRequest }: { customerId: string; updateRequest: UpdateCustomerRequest }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customerId}`, updateRequest);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

export const updateCustomerLocation = createAsyncThunk(
  'customers/updateCustomerLocation',
  async (
    { customerId, locationId, location }: { 
      customerId: string; 
      locationId: number; 
      location: { name: string; coordinates: string; address: string } 
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put<Customer>(`/customers/${customerId}/locations/${locationId}`, location);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer location');
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/customers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

export const getCustomerById = createAsyncThunk(
  'customers/getCustomerById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { customers: CustomerState };
      
      // Check if customer already exists in state
      const existingCustomer = state.customers.customers.find(c => c.id === id);
      if (existingCustomer) {
        return existingCustomer;
      }

      const response = await axiosInstance.get<Customer>(`/customers/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
    }
  }
);

export const findCustomerByPhone = createAsyncThunk(
  'customers/findCustomerByPhone',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Customer[]>('/customers/filter', { params: { phone } });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to find customer');
    }
  }
);

export const findOrCreateCustomer = createAsyncThunk(
  'customers/findOrCreateCustomer',
  async (
    { customerName, locationData }: {
      customerName: string;
      locationData: { name: string; coordinates: string; phone: string };
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as { customers: CustomerState };
      
      // Check if customer already exists
      let customer = state.customers.customers.find(c => c.name === customerName);
      
      if (customer) {
        return customer;
      }

      // Create new customer
      const newCustomerData = {
        name: customerName,
        locations: [{
          id: 0,
          name: locationData.name,
          coordinates: locationData.coordinates,
          address: locationData.name,
          isActive: true,
          customerId: '', // Will be set by the backend
        }],
        phone: locationData.phone,
      };

      const resultAction = await dispatch(addCustomer(newCustomerData));
      if (addCustomer.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        return rejectWithValue('Failed to create customer');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to find or create customer');
    }
  }
);

// Slice
const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      state.customers = [];
      state.loading = false;
      state.error = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
        state.initialized = true;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add customer
      .addCase(addCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers.push(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      
      // Update customer with format
      .addCase(updateCustomerWithFormat.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      
      // Update customer location
      .addCase(updateCustomerLocation.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      
      // Delete customer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = state.customers.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get customer by ID
      .addCase(getCustomerById.fulfilled, (state, action) => {
        const existingIndex = state.customers.findIndex(c => c.id === action.payload.id);
        if (existingIndex === -1) {
          state.customers.push(action.payload);
        }
      })
      
      // Find customer by phone
      .addCase(findCustomerByPhone.fulfilled, (state, action) => {
        // Add found customers to state if they don't exist
        action.payload.forEach(customer => {
          const existingIndex = state.customers.findIndex(c => c.id === customer.id);
          if (existingIndex === -1) {
            state.customers.push(customer);
          }
        });
      })
      
      // Find or create customer
      .addCase(findOrCreateCustomer.fulfilled, (state, action) => {
        const existingIndex = state.customers.findIndex(c => c.id === action.payload.id);
        if (existingIndex === -1) {
          state.customers.push(action.payload);
        }
      });
  },
});

export const { clearError, resetState } = customerSlice.actions;
export default customerSlice.reducer; 