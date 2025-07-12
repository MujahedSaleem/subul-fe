import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import type { OrderList } from '../../types/order';
import type { Customer } from '../../types/customer';
import Button from '../Button';
import CustomerPhoneInput from '../CustomerPhoneInput';
import CustomerNameInput from '../CustomerNameInput';
import LocationSelector from '../LocationSelector';
import { isValidPhoneNumber } from '../../utils/formatters';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';

interface DistributorOrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  title: string;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

const DistributorOrderForm: React.FC<DistributorOrderFormProps> = ({
  order,
  setOrder,
  onSubmit,
  title,
  isEdit = false,
  isSubmitting = false,
}) => {
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [originalCustomerName, setOriginalCustomerName] = useState<string>('');
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string>('');
  const [customerFound, setCustomerFound] = useState(false);
  const originalNameInitialized = useRef(false);
  const navigate = useNavigate();
  
  const {
    findByPhone,
    isLoading: customersLoading
  } = useDistributorCustomers();

  // Determine if any operation is in progress
  const isAnyOperationInProgress = isSubmitting || customersLoading;
  
  // Memoize the phone search to prevent infinite loops
  const searchCustomerByPhone = useCallback(async (phone: string) => {
    if (!phone || !isValidPhoneNumber(phone) || phone === lastSearchedPhone) {
      return;
    }

    setIsSearching(true);
    setLastSearchedPhone(phone);
    
    try {
      const result = await findByPhone(phone);
      const existingCustomer = result.payload as Customer | null;

      if (existingCustomer) {
        setIsNewCustomer(false);
        setCustomerFound(true);
        // Only set original name if not in edit mode (to preserve the original state)
        if (!isEdit) {
          setOriginalCustomerName(existingCustomer.name || '');
        }
        setOrder((prev) => ({
          ...prev,
          customer: existingCustomer
        }));
      } else {
        setIsNewCustomer(true);
        setCustomerFound(false);
        // Reset location data when no customer is found
        setOrder((prev) => ({
          ...prev,
          location: null as any,
          locationId: null as any
        }));
        // Only set empty original name if not in edit mode
        if (!isEdit) {
          setOriginalCustomerName('');
        }
      }
    } catch (error) {
      console.error('Error finding customer:', error);
      setIsNewCustomer(true);
      setCustomerFound(false);
      // Reset location data on error
      setOrder((prev) => ({
        ...prev,
        location: null as any,
        locationId: null as any
      }));
    } finally {
      setIsSearching(false);
    }
  }, [findByPhone, setOrder, isEdit, lastSearchedPhone]);

  // Set original customer name when in edit mode - only once on component mount
  useEffect(() => {
    if (isEdit && order?.customer && !originalNameInitialized.current) {
      setOriginalCustomerName(order.customer.name || '');
      setIsNewCustomer(!order.customer.id);
      setCustomerFound(!!order.customer.id);
      originalNameInitialized.current = true;
    }
  }, [isEdit, order?.customer?.id]);
  
  // Search for customer when phone changes
  useEffect(() => {
    const currentPhone = order?.customer?.phone || '';
    
    // Only search if phone has changed and is different from last searched
    if (currentPhone !== lastSearchedPhone && (!order?.customer?.id || !isEdit)) {
      // Reset location data when phone changes
      if (!isEdit) {
        setOrder((prev) => ({
          ...prev,
          location: null as any,
          locationId: null as any
        }));
      }
      searchCustomerByPhone(currentPhone);
    } else if (order?.customer?.id) {
      // If we already have a customer ID, mark as existing customer
      setIsNewCustomer(false);
      setCustomerFound(true);
    }
  }, [order?.customer?.phone, searchCustomerByPhone, order?.customer?.id, isEdit, lastSearchedPhone, setOrder]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  }, [onSubmit]);



  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">تفاصيل الطلب</h2>

      <CustomerPhoneInput
        customer={order?.customer}
        setOrder={setOrder}
        disabled={isEdit && order.status === 'Confirmed'}
      />

      {!isSearching && (
        <CustomerNameInput
          customer={order?.customer}
          setOrder={setOrder}
          isNewCustomer={isNewCustomer}
          disabled={isEdit && order.status === 'Confirmed'}
        />
      )}

      {!isSearching && (
        <LocationSelector
          order={order}
          setOrder={setOrder as React.Dispatch<React.SetStateAction<OrderList | undefined>>}
          isNewCustomer={isNewCustomer}
          disabled={order.status === 'Confirmed'}
          customer={order?.customer}
          autoOpenDropdown={order?.customer?.locations && order?.customer?.locations.length > 0 ? true : false}
        />
      )}

      <div className="flex justify-center items-center mt-6">
        <Button
          type="submit"
          variant="primary"
          icon={faSave}
          disabled={isAnyOperationInProgress}
          loading={isSubmitting}
          className="w-full max-w-xs"
        >
          {title}
        </Button>
      </div>
    </form>
  );
};

export default DistributorOrderForm;