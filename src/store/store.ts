import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from './slices/orderSlice';
import distributorOrdersReducer from './slices/distributorOrdersSlice';
import distributorCustomersReducer from './slices/distributorCustomersSlice';
import customersReducer from './slices/customerSlice';
import distributorsReducer from './slices/distributorSlice';
import notificationsReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    distributorOrders: distributorOrdersReducer,
    distributorCustomers: distributorCustomersReducer,
    customers: customersReducer,
    distributors: distributorsReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 