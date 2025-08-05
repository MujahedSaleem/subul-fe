import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { showError } from '../store/slices/notificationSlice';
import { useDistributorCustomers } from './useDistributorCustomers';
import { useDistributorOrders } from './useDistributorOrders';
import { Customer, Location } from '../types/customer';
import { OrderList, OrderRequest } from '../types/order';
import { 
  areBasicOrderFieldsFilled,
  getOrderButtonTitle, 
  getTargetOrderStatus, 
  findMatchingLocation, 
  getFallbackLocation 
} from '../utils/distributorUtils';

interface UseOrderManagementProps {
  initialOrder: OrderList;
  isEdit?: boolean;
}

export const useOrderManagement = ({ initialOrder, isEdit = false }: UseOrderManagementProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [order, setOrder] = useState<OrderList>(initialOrder);
  const [originalOrder, setOriginalOrder] = useState<OrderList | null>(isEdit ? initialOrder : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);

  const { addCustomer, updateCustomer } = useDistributorCustomers();
  const { addOrder, updateOrder } = useDistributorOrders();

  /**
   * Process customer and location updates
   */
  const processCustomerAndLocation = useCallback(async (orderData: OrderList): Promise<{
    customerId: number;
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
                                   customerId === undefined;
    
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
      customerId: parseInt(newCustomer.id),
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
      // Basic validation - require at least basic order fields
      if (!areBasicOrderFieldsFilled(order)) {
        dispatch(showError({
          message: 'يرجى إدخال اسم العميل ورقم الهاتف والموقع على الأقل.'
        }));
        return;
      }

      // For edit mode, check if order is already confirmed
      if (isEdit && order.status === 'Confirmed') {
        navigate('/distributor/orders');
        return;
      }

      const { customerId, locationId } = await processCustomerAndLocation(order);

      // Always save as draft - confirmation happens from order list page
      const targetStatus = getTargetOrderStatus(order);

      const orderRequest: OrderRequest = {
        ...(isEdit && { id: order.id }), // Include ID for updates
        customerId,
        locationId,
        cost: order.cost ?? null, // Convert undefined to null for API
        statusString: targetStatus
      };

      if (isEdit) {
        // Update existing order (save as draft only)
        await updateOrder(orderRequest);
      } else {
        // Create new order (save as draft only)
        await addOrder(orderRequest);
      }

      // Navigate to the orders page after successful submission and force refresh
      navigate('/distributor/orders', { replace: true, state: { forceRefresh: true } });
    } catch (exception: any) {
      // Handle errors from the backend
      if (exception.response?.status === 400) {
        const { error } = exception.response.data;
        errorMessage = error || "حدث خطأ غير متوقع، الرجاء المحاولة لاحقًا.";
      } else {
        errorMessage = "فشل الاتصال بالخادم، الرجاء التحقق من الإنترنت.";
      }

      // Dispatch the error globally
      dispatch(showError({
        message: errorMessage || 'حدث خطأ أثناء العملية.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [order, isEdit, processCustomerAndLocation, addOrder, updateOrder, navigate, dispatch]);

  /**
   * Handle back navigation with draft saving
   */
  const handleBack = useCallback(async (customer?: Customer) => {
    if (!customer && !isEdit) {
      navigate('/distributor/orders');
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
          locationId: order.location?.id
        }) !== JSON.stringify({
          cost: originalOrder.cost,
          status: originalOrder.status,
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
            customerId: parseInt(order.customer.id),
            locationId: finalLocationId,
            cost: order.cost ?? null, // Convert undefined to null for API
            statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
          };
          await updateOrder(orderRequest);
        }
      } else if (!isEdit && customer) {
        // Handle add mode back navigation (save as draft)
        const { customerId, locationId } = await processCustomerAndLocation(order);

        await addOrder({ 
          customerId,
          locationId,
          cost: order.cost ?? null, // Convert undefined to null for API
          statusString: 'Draft' as const
        });
      }
    } catch (error) {
      console.error('Failed to save order as draft:', error);
      dispatch(showError({
        message: 'فشل حفظ الطلب كمسودة، الرجاء المحاولة لاحقًا.'
      }));
    } finally {
      setIsBackLoading(false);
      navigate('/distributor/orders');
    }
  }, [order, originalOrder, isEdit, processCustomerAndLocation, addOrder, updateOrder, updateCustomer, navigate, dispatch]);

  /**
   * Calculate dynamic button title based on required fields
   */
  const buttonTitle = useMemo(() => {
    return getOrderButtonTitle(order, isEdit);
  }, [order, isEdit]);

  return {
    order,
    setOrder: useCallback((newOrder: React.SetStateAction<OrderList>) => {
      setOrder(newOrder);
    }, []),
    originalOrder,
    setOriginalOrder,
    isSubmitting,
    handleSubmit,
    buttonTitle
  };
}; 