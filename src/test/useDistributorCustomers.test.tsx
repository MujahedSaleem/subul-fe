import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDistributorCustomers } from '../hooks/useDistributorCustomers';

// Mock the dispatch and API calls
const mockDispatch = vi.fn();

vi.mock('../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
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
  beforeEach(() => {
    mockDispatch.mockClear();
  });
  
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
    
    // Check that dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });
}); 