import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/orderSlice';
import distributorOrdersReducer from './slices/distributorOrdersSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    distributorOrders: distributorOrdersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 