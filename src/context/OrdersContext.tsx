import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { OrderList, OrderRequest } from '../types/order';
import { useDistributorOrders } from '../hooks/useDistributorOrders';
import { useDistributorCustomers } from '../hooks/useDistributorCustomers';
import { getCurrentLocation } from '../services/locationService';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/notificationSlice';

interface OrdersContextType {
  orders: OrderList[];
  isLoading: boolean;
  error: string | null;
  locationLoadingStates: { [key: number]: boolean };
  fetchOrders: () => Promise<void>;
  updateOrderCost: (orderId: number, cost: number | null) => Promise<boolean>;
  updateOrderLocation: (order: OrderList) => Promise<boolean>;
  confirmOrder: (order: OrderList) => Promise<boolean>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const useOrdersContext = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrdersContext must be used within an OrdersProvider');
  }
  return context;
};

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  
  
  const {
    orders: reduxOrders,
    isLoading,
    error,
    fetchOrders: fetchReduxOrders,
    updateOrder: updateReduxOrder,
    confirmOrder: confirmReduxOrder,
  } = useDistributorOrders();
  
  const { updateCustomerLocation } = useDistributorCustomers();
  const dispatch = useAppDispatch();
  
  // Use useRef to prevent unnecessary re-renders
  const ordersRef = useRef<OrderList[]>([]);
  const [, forceUpdate] = useState({});
  
  // Local state for loading states only
  const [locationLoadingStates, setLocationLoadingStates] = useState<{ [key: number]: boolean }>({});

  // Sync local state with Redux state, but only when meaningful changes occur
  React.useEffect(() => {
    const hasChanged = JSON.stringify(ordersRef.current) !== JSON.stringify(reduxOrders);
    if (hasChanged) {
      
      ordersRef.current = [...reduxOrders];
      forceUpdate({});
    }
  }, [reduxOrders]);

  // Fetch orders from the API
  const fetchOrders = useCallback(async () => {
    
    await fetchReduxOrders();
  }, [fetchReduxOrders]);

  // Update order cost locally without triggering a full re-render
  const updateOrderCost = useCallback(async (orderId: number, cost: number | null): Promise<boolean> => {
    try {
      
      
      // Find the order to update
      const orderToUpdate = ordersRef.current.find(order => order.id === orderId);
      if (!orderToUpdate) return false;

      // Create the update request
      const updateRequest: OrderRequest = {
        id: orderId,
        orderNumber: orderToUpdate.orderNumber,
        customerId: parseInt(orderToUpdate.customer.id),
        locationId: orderToUpdate.location?.id,
        cost: cost,
        statusString: orderToUpdate.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: orderToUpdate.distributor.id
      };

      // Update the order in the API
      await updateReduxOrder(updateRequest);
      
      // Update the order locally without causing a full re-render
      ordersRef.current = ordersRef.current.map(order => 
        order.id === orderId ? { ...order, cost } : order
      );
      
      // Force a re-render only for this component
      forceUpdate({});
      
      return true;
    } catch (error) {
      console.error('Error updating order cost:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
      return false;
    }
  }, [updateReduxOrder, dispatch]);

  // Update order location
  const updateOrderLocation = useCallback(async (order: OrderList): Promise<boolean> => {
    if (!order.id) return false;
    
    setLocationLoadingStates(prev => ({ ...prev, [order.id!]: true }));
    
    try {
      
      
      // Get current GPS location
      const gpsLocation = await getCurrentLocation();
      
      if (!gpsLocation?.coordinates) {
        throw new Error('Could not get current location');
      }

      // Update customer location if customer and location exist
      if (order.customer?.id && order.location?.id) {
        const updatedLocation = {
          ...order.location,
          coordinates: gpsLocation.coordinates
        };
        
        await updateCustomerLocation(order.customer.id, updatedLocation);
      }

      // Update order location
      const updatedOrderRequest: OrderRequest = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: order.cost,
        statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: order.distributor.id
      };

      await updateReduxOrder(updatedOrderRequest);
      
      // Update the order locally with new coordinates
      ordersRef.current = ordersRef.current.map(o => {
        if (o.id === order.id && o.location) {
          return {
            ...o,
            location: {
              ...o.location,
              coordinates: gpsLocation.coordinates
            }
          };
        }
        return o;
      });
      
      // Force a re-render only for this component
      forceUpdate({});
      
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث الموقع. يرجى المحاولة مرة أخرى.' }));
      return false;
    } finally {
      setLocationLoadingStates(prev => ({ ...prev, [order.id!]: false }));
    }
  }, [updateCustomerLocation, updateReduxOrder, dispatch]);

  // Confirm an order
  const confirmOrder = useCallback(async (order: OrderList): Promise<boolean> => {
    try {
      if (!order.id) return false;
      
      
      
      await confirmReduxOrder(order.id);
      
      // Update the order locally
      ordersRef.current = ordersRef.current.map(o => 
        o.id === order.id ? { ...o, status: 'Confirmed' } : o
      );
      
      // Force a re-render only for this component
      forceUpdate({});
      
      return true;
    } catch (error) {
      console.error('Error confirming order:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.' }));
      return false;
    }
  }, [confirmReduxOrder, dispatch]);

  const value = {
    orders: ordersRef.current,
    isLoading,
    error,
    locationLoadingStates,
    fetchOrders,
    updateOrderCost,
    updateOrderLocation,
    confirmOrder
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}; 