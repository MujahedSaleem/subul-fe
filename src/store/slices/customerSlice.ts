import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import { Customer, UpdateCustomerRequest, CustomerFilters, PaginatedCustomers } from '../../types/customer';
import { handleApiResponse, handleApiError } from '../../utils/apiResponseHandler';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  // Filter state
  filteredCustomers: Customer[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  currentFilters: CustomerFilters | null;
}

// Request deduplication
let pendingFetchRequest: Promise<any> | null = null;
const pendingGetByIdRequests = new Map<string, Promise<any>>();

const initialState: CustomerState = {
  customers: [],
  loading: false,
  error: null,
  initialized: false,
  // Filter state
  filteredCustomers: [],
  totalCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 0,
  currentFilters: null,
};

// Async thunks with deduplication
export const fetchCustomers = createAsyncThunk<Customer[]>(
  'customers/fetchCustomers',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { customers: CustomerState };
    
    // Return existing data if already initialized and not forcing refresh
    if (state.customers.initialized && !state.customers.loading) {
      return state.customers.customers;
    }
    
    // If there's already a pending request, wait for it
    if (pendingFetchRequest) {
      return await pendingFetchRequest;
    }
    
    try {
      // Create and store the pending request
      pendingFetchRequest = axiosInstance.get('/customers')
        .then(response => {
          pendingFetchRequest = null; // Clear when done
          const { data, error } = handleApiResponse(response.data);
          if (error) throw new Error(error);
          return data;
        })
        .catch(error => {
          pendingFetchRequest = null; // Clear on error too
          throw error;
        });
      
      return await pendingFetchRequest;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const addCustomer = createAsyncThunk<Customer, Omit<Customer, 'id'>>(
  'customers/addCustomer',
  async (customer: Omit<Customer, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/customers', customer);
      const { data, error } = handleApiResponse<Customer>(response.data);
      if (error) return rejectWithValue(error);
      return data as Customer;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCustomer = createAsyncThunk<Customer, Customer>(
  'customers/updateCustomer',
  async (customer: Customer, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/customers/${customer.id}`, customer);
      const { data, error } = handleApiResponse<Customer>(response.data);
      if (error) return rejectWithValue(error);
      return data as Customer;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCustomerWithFormat = createAsyncThunk<Customer, { customerId: string; updateRequest: UpdateCustomerRequest }>(
  'customers/updateCustomerWithFormat',
  async ({ customerId, updateRequest }: { customerId: string; updateRequest: UpdateCustomerRequest }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/customers/${customerId}`, updateRequest);
      const { data, error } = handleApiResponse<Customer>(response.data);
      if (error) return rejectWithValue(error);
      return data as Customer;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCustomerLocation = createAsyncThunk<Customer, { customerId: string; locationId: number; location: { name: string; coordinates: string; address: string } }>(
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
      const response = await axiosInstance.put(`/customers/${customerId}/locations/${locationId}`, location);
      const { data, error } = handleApiResponse<Customer>(response.data);
      if (error) return rejectWithValue(error);
      return data as Customer;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteCustomer = createAsyncThunk<string, string>(
  'customers/deleteCustomer',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/customers/${id}`);
      // For delete operations, we only need to check if the response is successful
      // The API returns success without data for delete operations
      if (!response.data.success) {
        throw new Error('Delete operation failed');
      }
      return id; // Return the deleted ID for state management
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getCustomerById = createAsyncThunk<Customer, string>(
  'customers/getCustomerById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { customers: CustomerState };
      
      // Check if customer already exists in state
      const existingCustomer = state.customers.customers.find(c => c.id === id);
      if (existingCustomer) {
        return existingCustomer;
      }

      // Check if there's already a pending request for this customer
      const requestKey = `getCustomerById-${id}`;
      if (pendingGetByIdRequests.has(requestKey)) {
        return await pendingGetByIdRequests.get(requestKey);
      }

      // Create and store the pending request
      const requestPromise = axiosInstance.get(`/customers/${id}`)
        .then(response => {
          pendingGetByIdRequests.delete(requestKey); // Clear when done
          const { data, error } = handleApiResponse(response.data);
          if (error) throw new Error(error);
          return data;
        })
        .catch(error => {
          pendingGetByIdRequests.delete(requestKey); // Clear on error too
          throw error;
        });

      pendingGetByIdRequests.set(requestKey, requestPromise);
      return await requestPromise;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const findCustomerByPhone = createAsyncThunk<Customer[], string>(
  'customers/findCustomerByPhone',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/customers', { params: { phone } });
      const { data, error } = handleApiResponse<Customer[]>(response.data);
      if (error) return rejectWithValue(error);
      return data as Customer[];
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const findOrCreateCustomer = createAsyncThunk<Customer, { customerName: string; locationData: { name: string; coordinates: string; phone: string } }>(
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
      return rejectWithValue(handleApiError(error));
    }
  }
);

// Filter customers with pagination
export const filterCustomers = createAsyncThunk<PaginatedCustomers, CustomerFilters>(
  'customers/filterCustomers',
  async (filters: CustomerFilters, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
      if (filters.name) params.append('name', filters.name);
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters.createdAfter) params.append('createdAfter', filters.createdAfter);
      if (filters.createdBefore) params.append('createdBefore', filters.createdBefore);

      const response = await axiosInstance.get(`/customers/filter?${params.toString()}`);
      const { data, error } = handleApiResponse<PaginatedCustomers>(response.data);
      if (error) return rejectWithValue(error);
      return data as PaginatedCustomers;
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
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
      // Reset filter state
      state.filteredCustomers = [];
      state.totalCount = 0;
      state.pageNumber = 1;
      state.pageSize = 10;
      state.totalPages = 0;
      state.currentFilters = null;
    },
    invalidateCache: (state) => {
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
      })
      
      // Filter customers
      .addCase(filterCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(filterCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredCustomers = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.pageNumber = action.payload.pageNumber;
        state.pageSize = action.payload.pageSize;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(filterCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetState, invalidateCache } = customerSlice.actions;
export default customerSlice.reducer; 