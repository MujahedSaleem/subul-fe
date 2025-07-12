import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { OrderList } from '../types/order';
import Button from './Button';
import { faArrowRight, faMapLocation, faSave } from '@fortawesome/free-solid-svg-icons';
import CustomerPhoneInput from './CustomerPhoneInput';
import CustomerNameInput from './CustomerNameInput';
import LocationSelector from './LocationSelector';
import DistributorSelector from './DistributorSelector';
import CostInput from './CostInput';
import { Customer, Location } from '../types/customer';
import { useNavigate } from 'react-router-dom';
import { isValidPhoneNumber } from '../utils/formatters';
import IconButton from './IconButton';
import { getCurrentLocation } from '../services/locationService';
import { useAppDispatch } from '../store/hooks';
import { findCustomerByPhone } from '../store/slices/customerSlice';

interface OrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  title: string;
  isEdit?: boolean;
  isSubmitLoading?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  order,
  setOrder,
  onSubmit,
  title,
  isEdit = false,
  isSubmitLoading = false,
}) => {
  // Ensure order is defined with default values if needed
  const safeOrder: OrderList = order || {
    id: 0,
    orderNumber: '',
    customer: {} as Customer,
    location: {} as Location,
    distributor: { id: '', name: '', phone: '' },
    cost: undefined,
    status: 'New',
    createdAt: new Date().toISOString(),
    confirmedAt: ''
  };
  
  const dispatch = useAppDispatch();
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [getttingGpsLocation, setGetttingGpsLocation] = useState(false);
  const [shouldAutoOpenLocation, setShouldAutoOpenLocation] = useState(false);
  const [lastSearchedPhone, setLastSearchedPhone] = useState<string>('');
  const navigate = useNavigate();
  const locationRef = React.useRef(null);

  // Memoize the customer search function
  const findCustomer = useCallback(async (phone: string) => {
    if (!phone || !isValidPhoneNumber(phone) || phone === lastSearchedPhone) {
      return;
    }

    setIsSearching(true);
    setLastSearchedPhone(phone);
    
    try {
      const customerResults = await dispatch(findCustomerByPhone(phone)).unwrap();
      if (customerResults && customerResults.length > 0) {
        setIsNewCustomer(false);
        const foundCustomer = customerResults[0];
        setOrder((prev) => ({
          ...prev,
          customer: foundCustomer
        }));
        
        // Auto-open location dropdown if customer has locations - only in add mode, not edit mode
        if (!isEdit && foundCustomer.locations && foundCustomer.locations.length > 0) {
          setShouldAutoOpenLocation(true);
        }
      } else {
        setIsNewCustomer(true);
      }
    } catch (error) {
      // Customer not found, treat as new customer
      setIsNewCustomer(true);
    } finally {
      setIsSearching(false);
    }
  }, [dispatch, setOrder, isEdit, lastSearchedPhone]);

  // Search for customer when phone changes
  useEffect(() => {
    const currentPhone = safeOrder?.customer?.phone || '';
    
    // Only search if phone has changed and is different from last searched
    if (currentPhone !== lastSearchedPhone && (!safeOrder?.customer?.id || !isEdit)) {
      findCustomer(currentPhone);
    } else if (safeOrder?.customer?.id) {
      // If we already have a customer ID, mark as existing customer
      setIsNewCustomer(false);
    }
  }, [safeOrder?.customer?.phone, findCustomer, safeOrder?.customer?.id, isEdit, lastSearchedPhone]);

  // Reset auto-open flag after a short delay to allow the dropdown to open
  useEffect(() => {
    if (shouldAutoOpenLocation) {
      const timer = setTimeout(() => {
        setShouldAutoOpenLocation(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpenLocation]);

  const handleSetLocation = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    setGetttingGpsLocation(true);
    try {
      const gpsLocation = await getCurrentLocation();
      if (gpsLocation?.coordinates && safeOrder.customer) {
        // Update the selected location's coordinates
        const updatedLocations = safeOrder.customer.locations.map(loc => 
          loc.id === safeOrder.location?.id 
            ? { ...loc, coordinates: gpsLocation.coordinates }
            : loc
        );

        // Update the customer with new locations
        const updatedCustomer = {
          ...safeOrder.customer,
          locations: updatedLocations
        };

        // Update the order with new location and customer
        const foundLocation = updatedLocations.find(loc => loc.id === safeOrder.location?.id);
        setOrder(prev => ({
          ...prev,
          location: foundLocation || {
            id: 0,
            name: '',
            coordinates: '',
            address: '',
            isActive: true,
            customerId: safeOrder.customer?.id || ''
          },
          customer: updatedCustomer
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setGetttingGpsLocation(false);
    }
  }, [safeOrder.customer, safeOrder.location, setOrder]);

  const handleOrderUpdate = useCallback((updater: (prev: OrderList | undefined) => OrderList | undefined) => {
    setOrder(prev => {
      const result = updater(prev);
      return result || prev;
    });
  }, [setOrder]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">تفاصيل الطلب</h2>

      <CustomerPhoneInput
        customer={safeOrder?.customer}
        setOrder={setOrder}
        disabled={isEdit && safeOrder?.status === 'Confirmed'}
      />

      {!isSearching && (
        <CustomerNameInput
          customer={safeOrder?.customer}
          setOrder={setOrder}
          isNewCustomer={isNewCustomer}
          disabled={isEdit && safeOrder?.status === 'Confirmed'}
        />
      )}

      {!isSearching && (
        <LocationSelector
          order={safeOrder}
          setOrder={setOrder as React.Dispatch<React.SetStateAction<OrderList | undefined>>}
          isNewCustomer={isNewCustomer}
          disabled={(isEdit && safeOrder?.status === 'Confirmed') || !safeOrder?.customer?.name}
          customer={safeOrder?.customer}
          ref={locationRef}
          autoOpenDropdown={shouldAutoOpenLocation}
        />
      )}

      {safeOrder?.location && safeOrder.location.name && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className={`text-sm ${safeOrder.location.coordinates ? 'text-green-800' : 'text-red-800'}`}>
              {safeOrder.location.coordinates ? 'تم تحديد الإحداثيات بنجاح' : 'لا توجد إحداثيات متوفرة لهذا الموقع'}
            </p>
            {!safeOrder.location.coordinates && (
              <p className="text-red-600 text-xs mt-1">يمكنك تحديد الموقع الحالي لتحديث الإحداثيات</p>
            )}
          </div>
          <IconButton 
            onClick={handleSetLocation}
            icon={faMapLocation}
            variant={safeOrder.location.coordinates ? "success" : "danger"}
            size="lg"
            loading={getttingGpsLocation}
            title={safeOrder.location.coordinates ? "تحديث الموقع الحالي" : "استخدام الموقع الحالي"}
          />
        </div>
      )}

      <DistributorSelector
        selectedDistributorId={safeOrder?.distributor?.id || null}
        onDistributorChange={(distributorId: string | null) => {
          setOrder(prev => ({
            ...prev,
            distributor: distributorId ? { id: distributorId, name: '', phone: '' } : null as any
          }));
        }}
      />

      <CostInput
        cost={safeOrder?.cost}
        setOrder={setOrder}
        disabled={isEdit && safeOrder?.status === 'Confirmed'}
      />

      <div className="flex justify-center items-center mt-6">
        <Button
          type="submit"
          variant="primary"
          icon={faSave}
          disabled={(isEdit && safeOrder?.status === 'Confirmed') || isSubmitLoading}
          loading={isSubmitLoading}
          className="w-full max-w-xs"
        >
          {title}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;