import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDistributorCustomers } from '../hooks/useDistributorCustomers';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import distributorCustomersReducer from '../store/slices/distributorCustomersSlice';

// Mock the dispatch and API calls
vi.mock('../store/hooks', () => ({
  useAppDispatch: () => vi.fn().mockImplementation((action) => {
    if (typeof action === 'function') {
      return action({ type: 'TEST_ACTION' });
    }
    return action;
  }),
  useAppSelector: vi.fn().mockImplementation((selector) => 
    selector({
      distributorCustomers: {
        customers: [],
        currentCustomer: null,
        isLoading: false,
        error: null
      }
    })
  )
}));

// Mock axios instance
vi.mock('../utils/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('useDistributorCustomers hook', () => {
  it('provides the correct methods', () => {
    const { result } = renderHook(() => useDistributorCustomers());
    
    // Check that all expected methods are defined
    expect(result.current.findByPhone).toBeDefined();
    expect(result.current.fetchCustomers).toBeDefined();
    expect(result.current.addCustomer).toBeDefined();
    expect(result.current.updateCustomer).toBeDefined();
    expect(result.current.updateCustomerLocation).toBeDefined();
    expect(result.current.getCustomerById).toBeDefined();
  });

  it('correctly formats parameters for updateCustomer', async () => {
    // Create a spy to track dispatch calls
    const dispatchSpy = vi.fn();
    vi.mock('../store/hooks', () => ({
      useAppDispatch: () => dispatchSpy,
      useAppSelector: vi.fn().mockImplementation((selector) => 
        selector({
          distributorCustomers: {
            customers: [],
            currentCustomer: null,
            isLoading: false,
            error: null
          }
        })
      )
    }));

    const { result } = renderHook(() => useDistributorCustomers());
    
    // Create a mock customer
    const mockCustomer = {
      id: '123',
      name: 'Test Customer',
      phone: '0599123456',
      locations: []
    };
    
    // Call updateCustomer
    await result.current.updateCustomer(mockCustomer);
    
    // Check that dispatch was called with the correct parameters
    expect(dispatchSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: expect.stringContaining('updateDistributorCustomer'),
      payload: { customer: mockCustomer }
    }));
  });
}); 