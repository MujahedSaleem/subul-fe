import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useError } from '../context/ErrorContext';
import { useCustomers } from './useCustomers';
import { Customer, Location } from '../types/customer';
import { OrderList, OrderRequest } from '../types/order';
import { addOrder, updateOrder, confirmOrder } from '../store/slices/orderSlice';
import type { AppDispatch } from '../store/store';
import { 
  areAllRequiredFieldsFilled, 
  getOrderButtonTitle, 
  getTargetOrderStatus, 
  findMatchingLocation, 
  getFallbackLocation 
} from '../utils/distributorUtils';

interface UseAdminOrderManagementProps {
  initialOrder: OrderList;
  isEdit?: boolean;
}

export const useAdminOrderManagement = ({ initialOrder, isEdit = false }: UseAdminOrderManagementProps) => {
  const navigate = useNavigate();
  const reduxDispatch = useDispatch<AppDispatch>();
  const { dispatch } = useError();
  
  const [order, setOrder] = useState<OrderList>(initialOrder);
  const [originalOrder, setOriginalOrder] = useState<OrderList | null>(isEdit ? initialOrder : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);

  const { addCustomer, updateCustomer } = useCustomers();

  /**
   * Check if admin order has all required fields (including distributor)
   */
  const areAllAdminFieldsFilled = useCallback((orderData: OrderList): boolean => {
    const baseFieldsFilled = areAllRequiredFieldsFilled(orderData);
    const hasDistributor = orderData.distributor?.id;
    return baseFieldsFilled && !!hasDistributor;
  }, []);

  /**
   * Process customer and location updates for admin
   */
  const processCustomerAndLocation = useCallback(async (orderData: OrderList): Promise<{
    customerId: string;
    locationId?: number;
  }> => {
    // Deduplicate locations to prevent duplicate entries
    const deduplicateLocations = (locations: Location[]): Location[] => {
      if (!locations || locations.length === 0) return [];
      
      const seen = new Set<string>();
      return locations.filter(location => {
        // Normalize values for comparison
        const name = (location.name || '').trim().toLowerCase();
        const coordinates = (location.coordinates || '').trim();
        const address = (location.address || '').trim();
        
        // Create a unique key - if name is the same and coordinates/address are both empty or same, consider it duplicate
        const key = `${name}-${coordinates}-${address}`;
        
        if (seen.has(key)) {
          console.log('Duplicate location detected and removed:', location);
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    // Clean customer data before sending
    const cleanCustomerData = {
      ...orderData.customer,
      locations: deduplicateLocations(orderData.customer.locations || [])
    };

    // Handle customer creation/update
    let newCustomer: Customer;
    const customerId = orderData.customer?.id;
    const shouldCreateNewCustomer = !customerId || 
                                   customerId === '' || 
                                   customerId === 'undefined' || 
                                   customerId === 'null' ||
                                   customerId === null ||
                                   customerId === undefined ||
                                   String(customerId) === '0';
    
    if (shouldCreateNewCustomer) {
      // Remove any invalid ID before creating
      const customerDataForCreation = {
        ...cleanCustomerData,
        id: undefined
      };
      const result = await addCustomer(customerDataForCreation);
      newCustomer = result.payload as Customer;
    } else {
      const result = await updateCustomer(cleanCustomerData);
      newCustomer = result.payload as Customer;
    }

    if (!newCustomer) {
      throw new Error('Failed to process customer data');
    }

    // Find the correct location from the updated customer
    let selectedLocation: Location | undefined;
    if (orderData.location) {
      selectedLocation = findMatchingLocation(newCustomer.locations, orderData.location);
      
      // Fallback to last location if no match found
      if (!selectedLocation) {
        selectedLocation = getFallbackLocation(newCustomer.locations);
      }
    }

    return {
      customerId: newCustomer.id,
      locationId: selectedLocation?.id
    };
  }, [addCustomer, updateCustomer]);

  /**
   * Handle form submission (create or update order)
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);
    let errorMessage: string | null = null;

    try {
      // Admin validation - require all fields including distributor
      if (!order.customer || !order.customer.phone?.trim()) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'يرجى إدخال رقم الهاتف على الأقل.',
        });
        return;
      }

  

      // For edit mode, check if order is already confirmed
      if (isEdit && order.status === 'Confirmed') {
        navigate('/admin/orders');
        return;
      }

      const { customerId, locationId } = await processCustomerAndLocation(order);

      // Determine the appropriate status and action
      const targetStatus = areAllAdminFieldsFilled(order) ? 'New' : 'Draft';
      const shouldConfirm = areAllAdminFieldsFilled(order) && order.status !== 'Confirmed';

      const orderRequest: OrderRequest = {
        ...(isEdit && order.id > 0 && { id: order.id }), // Only include ID for actual updates
        orderNumber: order.orderNumber,
        customerId: parseInt(customerId),
        locationId,
        cost: order.cost,
        distributorId: order?.distributor?.id,
        statusString: targetStatus
      };

      if (isEdit) {
        // Update existing order
        await reduxDispatch(updateOrder(orderRequest)).unwrap();
        
        // Confirm if all fields are filled
        if (shouldConfirm) {
          await reduxDispatch(confirmOrder(order.id)).unwrap();
        }
      } else {
        // Create new order
        const orderResult = await reduxDispatch(addOrder(orderRequest)).unwrap();
        
        // Only confirm if all required fields are filled
        if (orderResult && shouldConfirm) {
          await reduxDispatch(confirmOrder(orderResult.id)).unwrap();
        }
      }

      // Navigate to the orders page after successful submission
      navigate('/admin/orders');
    } catch (exception: any) {
      // Handle errors from the backend
      if (exception.response?.status === 400) {
        const { error } = exception.response.data;
        errorMessage = error || "حدث خطأ غير متوقع، الرجاء المحاولة لاحقًا.";
      } else {
        errorMessage = "فشل الاتصال بالخادم، الرجاء التحقق من الإنترنت.";
      }

      // Dispatch the error globally
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage || 'حدث خطأ أثناء العملية.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [order, isEdit, processCustomerAndLocation, reduxDispatch, navigate, dispatch, areAllAdminFieldsFilled]);

  /**
   * Handle back navigation with draft saving
   */
  const handleBack = useCallback(async (customer?: Customer) => {
    if (!customer && !isEdit) {
      navigate('/admin/orders');
      return;
    }

    setIsBackLoading(true);
    try {
      if (isEdit && originalOrder) {
        // Handle edit mode back navigation
        const hasCustomerChanges = JSON.stringify({
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        }) !== JSON.stringify({
          name: originalOrder.customer.name,
          phone: originalOrder.customer.phone,
          locations: originalOrder.customer.locations
        });

        const hasOrderChanges = JSON.stringify({
          cost: order.cost,
          status: order.status,
          distributor: order.distributor,
          locationId: order.location?.id
        }) !== JSON.stringify({
          cost: originalOrder.cost,
          status: originalOrder.status,
          distributor: originalOrder.distributor,
          locationId: originalOrder.location?.id
        });

        let finalLocationId = order.location?.id;
        
        // Update customer first if there are changes
        if (hasCustomerChanges) {
          try {
            // Deduplicate locations before updating
            const deduplicateLocations = (locations: Location[]): Location[] => {
              if (!locations || locations.length === 0) return [];
              
              const seen = new Set<string>();
              return locations.filter(location => {
                // Normalize values for comparison
                const name = (location.name || '').trim().toLowerCase();
                const coordinates = (location.coordinates || '').trim();
                const address = (location.address || '').trim();
                
                // Create a unique key - if name is the same and coordinates/address are both empty or same, consider it duplicate
                const key = `${name}-${coordinates}-${address}`;
                
                if (seen.has(key)) {
                  console.log('Duplicate location detected and removed in handleBack:', location);
                  return false;
                }
                seen.add(key);
                return true;
              });
            };

            const result = await updateCustomer({
              id: order.customer.id,
              name: order.customer.name,
              phone: order.customer.phone,
              locations: deduplicateLocations(order.customer.locations || [])
            });
            const updatedCustomer = result.payload as Customer;
            
            if (updatedCustomer && order.location) {
              const selectedLocation = findMatchingLocation(updatedCustomer.locations, order.location);
              if (selectedLocation) {
                finalLocationId = selectedLocation.id;
              }
            }
          } catch (error) {
            console.error('Error updating customer:', error);
          }
        }

        // Update order if there are changes
        if (hasOrderChanges || finalLocationId !== order.location?.id) {
          const orderRequest: OrderRequest = {
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: parseInt(order.customer.id),
            locationId: finalLocationId,
            cost: order.cost,
            distributorId: order.distributor?.id,
            statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
          };
          await reduxDispatch(updateOrder(orderRequest)).unwrap();
        }
      } else if (!isEdit && customer) {
        // Handle add mode back navigation (save as draft)
        const { customerId, locationId } = await processCustomerAndLocation(order);

        const orderRequest: OrderRequest = {
          orderNumber: order.orderNumber,
          customerId: parseInt(customerId),
          locationId,
          cost: order.cost,
          distributorId: order.distributor?.id,
          statusString: 'Draft' as const
        };

        await reduxDispatch(addOrder(orderRequest)).unwrap();
      }
    } catch (error) {
      console.error('Failed to save order as draft:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'فشل حفظ الطلب كمسودة، الرجاء المحاولة لاحقًا.',
      });
    } finally {
      setIsBackLoading(false);
      navigate('/admin/orders');
    }
  }, [order, originalOrder, isEdit, processCustomerAndLocation, reduxDispatch, updateCustomer, navigate, dispatch]);

  /**
   * Calculate dynamic button title based on required fields (including distributor)
   */
  const buttonTitle = useMemo(() => {
    if (!order) return isEdit ? 'حفظ التغييرات' : 'تأكيد الطلبية';
    
    if (isEdit && order.status === 'Confirmed') {
      return 'حفظ التغييرات';
    }
    
    const allFieldsFilled = areAllAdminFieldsFilled(order);
    return allFieldsFilled ? 'تأكيد الطلب' : 'حفظ كمسودة';
  }, [order, isEdit, areAllAdminFieldsFilled]);

  return {
    order,
    setOrder: useCallback((newOrder: React.SetStateAction<OrderList>) => {
      setOrder(newOrder);
    }, []),
    originalOrder,
    setOriginalOrder: useCallback((newOriginalOrder: React.SetStateAction<OrderList | null>) => {
      setOriginalOrder(newOriginalOrder);
    }, []),
    isSubmitting,
    isBackLoading,
    handleSubmit,
    handleBack,
    buttonTitle,
    areAllAdminFieldsFilled
  };
}; 