import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/orderSlice';
import distributorOrdersReducer from './slices/distributorOrdersSlice';
import distributorCustomersReducer from './slices/distributorCustomersSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    distributorOrders: distributorOrdersReducer,
    distributorCustomers: distributorCustomersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 