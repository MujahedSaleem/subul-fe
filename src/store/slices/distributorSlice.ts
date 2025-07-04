import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
import { Distributor } from '../../types/distributor';
import { extractApiData, handleApiError } from '../../utils/apiResponseHandler';
import { RootState } from '../store';

interface DistributorState {
  distributors: Distributor[];
  activeDistributors: Distributor[];
  currentDistributor: Distributor | null;
  loading: boolean;
  error: string | null;
}

const initialState: DistributorState = {
  distributors: [],
  activeDistributors: [],
  currentDistributor: null,
  loading: false,
  error: null,
};

// Track pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<Distributor[]>>();

export const fetchDistributors = createAsyncThunk<Distributor[], void, { state: RootState }>(
  'distributors/fetchDistributors',
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    
    // If distributors are already loaded and not loading, return cached data
    if (state.distributors.distributors.length > 0 && !state.distributors.loading) {
      return state.distributors.distributors;
    }
    
    // Check if there's already a pending request
    const requestKey = 'fetchDistributors';
    if (pendingRequests.has(requestKey)) {
      return await pendingRequests.get(requestKey)!;
    }
    
    try {
      const requestPromise = axiosInstance.get('/distributors').then(response => {
        const data = extractApiData<Distributor[]>(response.data);
        pendingRequests.delete(requestKey);
        return data;
      });
      
      pendingRequests.set(requestKey, requestPromise);
      return await requestPromise;
    } catch (error: any) {
      pendingRequests.delete(requestKey);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchActiveDistributors = createAsyncThunk<Distributor[]>(
  'distributors/fetchActiveDistributors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/distributors/active');
      return extractApiData<Distributor[]>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const getDistributorById = createAsyncThunk<Distributor, string>(
  'distributors/getDistributorById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/distributors/${id}`);
      return extractApiData<Distributor>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const addDistributor = createAsyncThunk<Distributor, Omit<Distributor, 'id'>>(
  'distributors/addDistributor',
  async (distributor: Omit<Distributor, 'id'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/distributors', distributor);
      return extractApiData<Distributor>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const updateDistributor = createAsyncThunk<Distributor, Distributor>(
  'distributors/updateDistributor',
  async (distributor: Distributor, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/distributors/${distributor.id}`, distributor);
      return extractApiData<Distributor>(response.data);
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const deleteDistributor = createAsyncThunk<string, string>(
  'distributors/deleteDistributor',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/distributors/${id}`);
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

export const changeDistributorPassword = createAsyncThunk<
  { message: string },
  { distributorId: string; oldPassword: string; newPassword: string; confirmPassword: string }
>(
  'distributors/changeDistributorPassword',
  async ({ distributorId, oldPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      // Prepare the request payload to match the original API structure
      const passwordUpdateRequest = {
        userId: distributorId,
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      };

      // Send the request to the backend API using the original endpoint
      const response = await axiosInstance.post(
        "/auth/updatePassword",
        passwordUpdateRequest
      );

      // Use unified response handling
      const result = extractApiData<{ message?: string }>(response.data);
      return { message: result.message || 'تم تغيير كلمة المرور بنجاح' };
    } catch (error: any) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

const distributorSlice = createSlice({
  name: 'distributors',
  initialState,
  reducers: {
    setCurrentDistributor: (state, action: PayloadAction<string>) => {
      state.currentDistributor = state.distributors.find(d => d.id === action.payload) || null;
    },
    clearCurrentDistributor: (state) => {
      state.currentDistributor = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch distributors
      .addCase(fetchDistributors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        state.loading = false;
        state.distributors = action.payload;
        // If there's a current distributor, update it with fresh data
        if (state.currentDistributor) {
          state.currentDistributor = action.payload.find(d => d.id === state.currentDistributor?.id) || null;
        }
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch active distributors
      .addCase(fetchActiveDistributors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDistributors.fulfilled, (state, action) => {
        state.loading = false;
        state.activeDistributors = action.payload;
      })
      .addCase(fetchActiveDistributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get distributor by ID
      .addCase(getDistributorById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDistributorById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDistributor = action.payload;
      })
      .addCase(getDistributorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add distributor
      .addCase(addDistributor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDistributor.fulfilled, (state, action) => {
        state.loading = false;
        state.distributors.push(action.payload);
      })
      .addCase(addDistributor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update distributor
      .addCase(updateDistributor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDistributor.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.distributors.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.distributors[index] = action.payload;
        }
      })
      .addCase(updateDistributor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete distributor
      .addCase(deleteDistributor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDistributor.fulfilled, (state, action) => {
        state.loading = false;
        state.distributors = state.distributors.filter(d => d.id !== action.payload);
      })
      .addCase(deleteDistributor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Change password
      .addCase(changeDistributorPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeDistributorPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeDistributorPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentDistributor, clearCurrentDistributor, clearError } = distributorSlice.actions;
export default distributorSlice.reducer;

// Selectors
export const selectDistributors = (state: RootState) => state.distributors.distributors;
export const selectActiveDistributors = (state: RootState) => state.distributors.activeDistributors;
export const selectCurrentDistributor = (state: RootState) => state.distributors.currentDistributor;
export const selectIsLoading = (state: RootState) => state.distributors.loading;
export const selectError = (state: RootState) => state.distributors.error; 