import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocationSelector from '../components/LocationSelector';
import { Customer, Location } from '../types/customer';
import { OrderList } from '../types/order';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from '../store/slices/notificationSlice';

// Create a mock store for testing
const mockStore = configureStore({
  reducer: {
    notifications: notificationReducer
  }
});

// Mock customer data
const mockCustomer: Customer = {
  id: '1',
  name: 'Test Customer',
  phone: '0599123456',
  locations: [
    {
      id: 1,
      name: 'Home',
      coordinates: '31.5,34.5',
      address: 'Test Address',
      isActive: true,
      customerId: '1'
    },
    {
      id: 2,
      name: 'Work',
      coordinates: '31.6,34.6',
      address: 'Work Address',
      isActive: true,
      customerId: '1'
    }
  ]
};

// Mock order data
const mockOrder: OrderList = {
  id: 1,
  orderNumber: 'ORD-001',
  customer: mockCustomer,
  location: mockCustomer.locations[0],
  distributor: { id: '1', name: 'Test Distributor', phone: '0599111222' },
  cost: 100,
  status: 'New',
  createdAt: new Date().toISOString(),
  confirmedAt: ''
};

describe('LocationSelector component', () => {
  it('renders correctly with customer locations', () => {
    const setOrderMock = vi.fn();
    
    render(
      <Provider store={mockStore}>
        <LocationSelector
          order={mockOrder}
          setOrder={setOrderMock}
          disabled={false}
          customer={mockCustomer}
          isNewCustomer={false}
        />
      </Provider>
    );
    
    expect(screen.getByText('الموقع')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Home')).toBeInTheDocument();
  });

  it('renders disabled when disabled prop is true', () => {
    const setOrderMock = vi.fn();
    
    render(
      <Provider store={mockStore}>
        <LocationSelector
          order={mockOrder}
          setOrder={setOrderMock}
          disabled={true}
          customer={mockCustomer}
          isNewCustomer={false}
        />
      </Provider>
    );
    
    expect(screen.getByText('الموقع')).toBeInTheDocument();
    const input = screen.getByDisplayValue('Home');
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
  });
}); 