import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Customer, DistributorCreateCustomerRequest, Location } from '../types/customer';
import {
  findCustomerByPhone,
  fetchDistributorCustomers,
  addDistributorCustomer,
  updateDistributorCustomer,
  updateDistributorCustomerLocation,
  getDistributorCustomerById,
  setCurrentCustomer,
  clearCurrentCustomer,
  clearCustomersError
} from '../store/slices/distributorCustomersSlice';

export const useDistributorCustomers = () => {
  const dispatch = useAppDispatch();
  const {
    customers,
    currentCustomer,
    isLoading,
    error
  } = useAppSelector(state => state.distributorCustomers);

  const findByPhone = useCallback((phone: string) => {
    return dispatch(findCustomerByPhone(phone));
  }, [dispatch]);

  const fetchCustomers = useCallback(() => {
    return dispatch(fetchDistributorCustomers());
  }, [dispatch]);

  const addCustomer = useCallback((customer: Partial<DistributorCreateCustomerRequest>) => {
    return dispatch(addDistributorCustomer(customer));
  }, [dispatch]);

  const updateCustomer = useCallback((customer: Customer) => {
    return dispatch(updateDistributorCustomer(customer));
  }, [dispatch]);

  const updateCustomerLocation = useCallback((customerId: string, location: Location) => {
    return dispatch(updateDistributorCustomerLocation({ customerId, location }));
  }, [dispatch]);

  const getCustomerById = useCallback((customerId: string) => {
    return dispatch(getDistributorCustomerById(customerId));
  }, [dispatch]);

  const setSelected = useCallback((customerId: string) => {
    dispatch(setCurrentCustomer(customerId));
  }, [dispatch]);

  const clearSelected = useCallback(() => {
    dispatch(clearCurrentCustomer());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearCustomersError());
  }, [dispatch]);

  return {
    // State
    customers,
    currentCustomer,
    isLoading,
    error,
    
    // Actions
    findByPhone,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    updateCustomerLocation,
    getCustomerById,
    setSelected,
    clearSelected,
    clearError
  };
}; 