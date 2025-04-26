import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/orderSlice';
import distributorsReducer from './slices/distributorSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    distributors: distributorsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 