import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { OrderRequest } from '../types/order';
import {
  fetchDistributorOrders,
  getDistributorOrderById,
  addDistributorOrder,
  updateDistributorOrder,
  confirmDistributorOrder,
  clearCurrentOrder,
  clearErrors
} from '../store/slices/distributorOrdersSlice';

export const useDistributorOrders = () => {
  const dispatch = useAppDispatch();
  const {
    orders,
    currentOrder,
    isLoading,
    error
  } = useAppSelector(state => state.distributorOrders);

  const fetchOrders = useCallback(() => {
    return dispatch(fetchDistributorOrders());
  }, [dispatch]);

  const getOrderById = useCallback((id: number) => {
    return dispatch(getDistributorOrderById(id));
  }, [dispatch]);

  const addOrder = useCallback((order: Partial<OrderRequest>) => {
    return dispatch(addDistributorOrder(order));
  }, [dispatch]);

  const updateOrder = useCallback((order: OrderRequest) => {
    return dispatch(updateDistributorOrder(order));
  }, [dispatch]);

  const confirmOrder = useCallback((id: number) => {
    return dispatch(confirmDistributorOrder(id));
  }, [dispatch]);



  const resetCurrentOrder = useCallback(() => {
    dispatch(clearCurrentOrder());
  }, [dispatch]);

  const resetErrors = useCallback(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,
    
    // Actions
    fetchOrders,
    getOrderById,
    addOrder,
    updateOrder,
    confirmOrder,
    deleteOrder,
    resetCurrentOrder,
    resetErrors
  };
}; 