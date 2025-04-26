import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import axiosInstance from '../../utils/axiosInstance';
import { Distributor } from '../../types/distributor';
import { RootState } from '../store';

interface DistributorState {
  distributors: Distributor[];
  activeDistributors: Distributor[];
  currentDistributor: Distributor | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DistributorState = {
  distributors: [],
  activeDistributors: [],
  currentDistributor: null,
  isLoading: false,
  error: null,
};

export const fetchDistributors = createAsyncThunk<Distributor[]>(
  'distributors/fetchDistributors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Distributor[]>('/distributors');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch distributors');
      }
      return rejectWithValue('Failed to fetch distributors');
    }
  }
);

export const fetchActiveDistributors = createAsyncThunk<Distributor[]>(
  'distributors/fetchActiveDistributors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Distributor[]>('/distributors/active');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch active distributors');
      }
      return rejectWithValue('Failed to fetch active distributors');
    }
  }
);

export const getDistributorById = createAsyncThunk<Distributor, string>(
  'distributors/getDistributorById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Distributor>(`/distributors/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch distributor');
      }
      return rejectWithValue('Failed to fetch distributor');
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchDistributors
      .addCase(fetchDistributors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDistributors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.distributors = action.payload;
        // If there's a current distributor, update it with fresh data
        if (state.currentDistributor) {
          state.currentDistributor = action.payload.find(d => d.id === state.currentDistributor?.id) || null;
        }
      })
      .addCase(fetchDistributors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle fetchActiveDistributors
      .addCase(fetchActiveDistributors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveDistributors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeDistributors = action.payload;
      })
      .addCase(fetchActiveDistributors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Handle getDistributorById
      .addCase(getDistributorById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDistributorById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDistributor = action.payload;
      })
      .addCase(getDistributorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentDistributor, clearCurrentDistributor } = distributorSlice.actions;
export default distributorSlice.reducer;

// Selectors
export const selectDistributors = (state: RootState) => state.distributors.distributors;
export const selectActiveDistributors = (state: RootState) => state.distributors.activeDistributors;
export const selectCurrentDistributor = (state: RootState) => state.distributors.currentDistributor;
export const selectIsLoading = (state: RootState) => state.distributors.isLoading;
export const selectError = (state: RootState) => state.distributors.error; 