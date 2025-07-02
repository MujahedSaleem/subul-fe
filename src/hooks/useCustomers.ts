import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCustomers,
  addCustomer,
  updateCustomer,
  updateCustomerWithFormat,
  updateCustomerLocation,
  deleteCustomer,
  getCustomerById,
  findCustomerByPhone,
  findOrCreateCustomer,
  clearError,
  resetState,
  invalidateCache,
} from '../store/slices/customerSlice';
import { Customer, UpdateCustomerRequest } from '../types/customer';

export const useCustomers = () => {
  const dispatch = useAppDispatch();
  const { customers, loading, error, initialized } = useAppSelector((state) => state.customers);

  const fetchCustomersData = useCallback((forceRefresh: boolean = false) => {
    if (forceRefresh || (!initialized && !loading)) {
      dispatch(fetchCustomers());
    }
  }, [dispatch, initialized, loading]);

  const addCustomerData = useCallback((customer: Omit<Customer, 'id'>) => {
    return dispatch(addCustomer(customer));
  }, [dispatch]);

  const updateCustomerData = useCallback((customer: Customer) => {
    return dispatch(updateCustomer(customer));
  }, [dispatch]);

  const updateCustomerWithFormatData = useCallback((customerId: string, updateRequest: UpdateCustomerRequest) => {
    return dispatch(updateCustomerWithFormat({ customerId, updateRequest }));
  }, [dispatch]);

  const updateCustomerLocationData = useCallback(
    (customerId: string, locationId: number, location: { name: string; coordinates: string; address: string }) => {
      return dispatch(updateCustomerLocation({ customerId, locationId, location }));
    },
    [dispatch]
  );

  const deleteCustomerData = useCallback((id: string) => {
    return dispatch(deleteCustomer(id));
  }, [dispatch]);

  const getCustomerByIdData = useCallback((id: string) => {
    return dispatch(getCustomerById(id));
  }, [dispatch]);

  const findCustomerByPhoneData = useCallback((phone: string) => {
    return dispatch(findCustomerByPhone(phone));
  }, [dispatch]);

  const findOrCreateCustomerData = useCallback(
    (customerName: string, locationData: { name: string; coordinates: string; phone: string }) => {
      return dispatch(findOrCreateCustomer({ customerName, locationData }));
    },
    [dispatch]
  );

  const clearErrorData = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetStateData = useCallback(() => {
    dispatch(resetState());
  }, [dispatch]);

  const refreshCustomers = useCallback(() => {
    dispatch(invalidateCache());
    dispatch(fetchCustomers());
  }, [dispatch]);

  return {
    customers,
    loading,
    error,
    initialized,
    fetchCustomers: fetchCustomersData,
    addCustomer: addCustomerData,
    updateCustomer: updateCustomerData,
    updateCustomerWithFormat: updateCustomerWithFormatData,
    updateCustomerLocation: updateCustomerLocationData,
    deleteCustomer: deleteCustomerData,
    getCustomerById: getCustomerByIdData,
    findCustomerByPhone: findCustomerByPhoneData,
    findOrCreateCustomer: findOrCreateCustomerData,
    clearError: clearErrorData,
    resetState: resetStateData,
    refreshCustomers,
  };
}; 