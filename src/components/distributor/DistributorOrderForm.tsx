import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { faArrowRight, faMapLocation, faSave } from '@fortawesome/free-solid-svg-icons';
import type { OrderList } from '../../types/order';
import type { Customer } from '../../types/customer';
import Button from '../Button';
import CustomerPhoneInput from '../CustomerPhoneInput';
import CustomerNameInput from '../CustomerNameInput';
import LocationSelector from '../LocationSelector';
import CostInput from '../CostInput';
import { isValidPhoneNumber } from '../../utils/formatters';
import IconButton from '../IconButton';
import { getCurrentLocation } from '../../services/locationService';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';

interface DistributorOrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  onBack: (customer?: Customer) => void;
  title: string;
  isEdit?: boolean;
  isSubmitting?: boolean;
  isBackLoading?: boolean;
}

const DistributorOrderForm: React.FC<DistributorOrderFormProps> = ({
  order,
  setOrder,
  onSubmit,
  onBack,
  title,
  isEdit = false,
  isSubmitting = false,
  isBackLoading = false,
}) => {
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [getttingGpsLocation, setGetttingGpsLocation] = useState(false);
  const navigate = useNavigate();
  
  const {
    findByPhone,
    updateCustomerLocation,
    isLoading: customersLoading
  } = useDistributorCustomers();

  // Determine if any operation is in progress
  const isAnyOperationInProgress = isSubmitting || isBackLoading || getttingGpsLocation || customersLoading;
  
  // Memoize the phone search to prevent infinite loops
  const searchCustomerByPhone = useCallback(async (phone: string) => {
    if (!phone || !isValidPhoneNumber(phone)) {
      setIsNewCustomer(true);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await findByPhone(phone);
      const existingCustomer = result.payload as Customer | null;

      if (existingCustomer) {
        setIsNewCustomer(false);
        setOrder((prev) => ({
          ...prev,
          customer: existingCustomer
        }));
      } else {
        setIsNewCustomer(true);
      }
    } catch (error) {
      console.error('Error finding customer:', error);
      setIsNewCustomer(true);
    } finally {
      setIsSearching(false);
    }
  }, [findByPhone, setOrder]);

  // Track phone to prevent unnecessary searches
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string>('');
  
  useEffect(() => {
    const currentPhone = order?.customer?.phone || '';
    
    // Only search if phone has changed and is different from last searched
    if (currentPhone !== lastSearchedPhone) {
      setLastSearchedPhone(currentPhone);
      searchCustomerByPhone(currentPhone);
    }
  }, [order?.customer?.phone, lastSearchedPhone, searchCustomerByPhone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const handleBackClick = () => {
    if (order?.customer && (order?.customer?.locations?.length || order?.customer?.name || order?.customer?.phone)) {
      onBack(order?.customer);
    } else {
      navigate(-1);
    }
  };

  const handleSetLocation = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    setGetttingGpsLocation(true)
    try {
      const gpsLocation = await getCurrentLocation();
      const updatedLocation = {...order?.location, coordinates: gpsLocation?.coordinates};
      
      // Always update the order state with new coordinates
      setOrder((prev) => {
        if (!prev) return prev;
        
        // Update the customer's location array as well
        const updatedCustomer = prev.customer ? {
          ...prev.customer,
          locations: prev.customer.locations.map(loc => 
            loc.id === prev.location?.id || (loc.id === 0 && loc.name === prev.location?.name)
              ? updatedLocation
              : loc
          )
        } : prev.customer;

        return {
          ...prev,
          location: updatedLocation,
          customer: updatedCustomer
        };
      });
      
      // If it's an existing customer and location, update via API
      if (order?.customer?.id && order?.location?.id && order?.location?.id !== 0) {
        try {
          await updateCustomerLocation(order.customer.id, updatedLocation);
        } catch (error) {
          console.error('Error updating location via API:', error);
          // Don't fail the whole operation if API update fails
        }
      }
    } catch (error) {
      console.error('Error getting GPS location:', error);
    } finally {
      setGetttingGpsLocation(false);
    }
  }, [order?.customer?.id, order?.location, updateCustomerLocation, setOrder]);

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
          disabled={(isEdit && order.status === 'Confirmed') || !!(order?.customer?.name?.trim())}
        />
      )}

      {!isSearching &&order?.customer?.phone && (
        <>
        <LocationSelector
          order={order}
          setOrder={setOrder as React.Dispatch<React.SetStateAction<OrderList | undefined>>}
          isNewCustomer={isNewCustomer}
          disabled={isEdit && order.status === 'Confirmed'}
          customer={order?.customer}
          isDistributor={true}
        />
              {!(order?.location?.coordinates)&&(
        <div className="flex items-center gap-1">
                <p className="text-red-500 text-xs">لا توجد إحداثيات متوفرة لهذا الموقع</p>
                <IconButton 
                  onClick={handleSetLocation}
                  icon={faMapLocation}
                  variant="danger"
                  size="lg"
                  loading={getttingGpsLocation}
                  disabled={isAnyOperationInProgress}
                  title=" استخدام الموقع الحالي"></IconButton>
      </div>

      )}
        </>
      )}


      <CostInput
        cost={order.cost}
        setOrder={setOrder}
        disabled={isEdit && order.status === 'Confirmed'}
      />

      <div className="flex justify-between items-center mt-6">
        <Button
          type="button"
          onClick={handleBackClick}
          variant="secondary"
          icon={faArrowRight}
          disabled={isAnyOperationInProgress}
          loading={isBackLoading}
        >
          {isEdit ? 'رجوع للطلبات' : 'إلغاء'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={faSave}
          disabled={(isEdit && order.status === 'Confirmed') || isAnyOperationInProgress}
          loading={isSubmitting}
        >
          {title}
        </Button>
      </div>
    </form>
  );
};

export default DistributorOrderForm;