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
  clearErrors,
  forceRefresh
} from '../store/slices/distributorOrdersSlice';

export const useDistributorOrders = () => {
  const dispatch = useAppDispatch();
  const {
    orders,
    currentOrder,
    isLoading,
    error
  } = useAppSelector(state => state.distributorOrders);

  const fetchOrders = useCallback((forceRefresh = false) => {
    return dispatch(fetchDistributorOrders(forceRefresh));
  }, [dispatch]);

  const getOrderById = useCallback((id: number) => {
    return dispatch(getDistributorOrderById(id));
  }, [dispatch]);

  const addOrder = useCallback((order: Partial<OrderRequest>) => {
    return dispatch(addDistributorOrder(order as OrderRequest));
  }, [dispatch]);

  const updateOrder = useCallback((order: OrderRequest) => {
    return dispatch(updateDistributorOrder(order));
  }, [dispatch]);

  const confirmOrder = useCallback(async (id: number) => {
    const result = await dispatch(confirmDistributorOrder(id));
    // Force refresh the orders list after confirming
    await dispatch(fetchDistributorOrders(true));
    return result;
  }, [dispatch]);

  const refreshOrders = useCallback(() => {
    // Force a fresh fetch by clearing the cache first
    dispatch(forceRefresh());
    return dispatch(fetchDistributorOrders(true));
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
    refreshOrders,
    resetCurrentOrder,
    resetErrors
  };
}; 