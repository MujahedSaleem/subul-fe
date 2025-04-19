import { customersStore } from './customersStore';
import { ordersStore } from './ordersStore';
import { distributorsStore } from './distributorsStore';

export const initializeStores = async () => {
  try {
    // Initialize all stores in parallel
    await Promise.all([
      customersStore.fetchCustomers(),
      ordersStore.fetchOrders(),
      distributorsStore.fetchDistributors()
    ]);
  } catch (error) {
    console.error('Error initializing stores:', error);
    throw error;
  }
}; 