import React, { useState, useEffect } from 'react';
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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { findCustomerByPhone, updateCustomer } from '../store/slices/customerSlice';

interface OrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  onBack: (customer?: Customer) => void;
  title: string;
  isEdit?: boolean;
  isBackLoading?: boolean;
  isSubmitLoading?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  order,
  setOrder,
  onSubmit,
  onBack,
  title,
  isEdit = false,
  isBackLoading = false,
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
  const navigate = useNavigate();
  const locationRef = React.useRef(null);

  useEffect(() => {
   const findCustomer = async () => {
    setIsSearching(true);
    // Only search for customer if this is a new order or if we don't have a customer yet
    if (!safeOrder?.customer?.id && safeOrder?.customer?.phone && isValidPhoneNumber(safeOrder?.customer?.phone)) {
      try {
        const customerResults = await dispatch(findCustomerByPhone(safeOrder.customer.phone)).unwrap();
        if (customerResults && customerResults.length > 0) {
          setIsNewCustomer(false);
          setOrder((prev) => ({
            ...prev,
            customer: customerResults[0] // Take the first matching customer
          }));
        } else {
          setIsNewCustomer(true);
        }
      } catch (error) {
        // Customer not found, treat as new customer
        setIsNewCustomer(true);
      }
    } else {
      setIsNewCustomer(false);
    }
    setIsSearching(false);
   }
   findCustomer()
  }, [safeOrder?.customer?.phone, dispatch, setOrder]);

 

  const handleSetLocation = async (e: React.MouseEvent) => {
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
  };

  const handleOrderUpdate = (updater: (prev: OrderList | undefined) => OrderList | undefined) => {
    setOrder(prev => {
      const result = updater(prev);
      return result || prev;
    });
  };

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
        />
      )}

      {safeOrder?.location && safeOrder.location.name && !safeOrder.location.coordinates && (
        <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
          <div className="flex-1">
            <p className="text-yellow-800 text-sm">لا توجد إحداثيات متوفرة لهذا الموقع</p>
            <p className="text-yellow-600 text-xs mt-1">يمكنك تحديد الموقع الحالي لتحديث الإحداثيات</p>
          </div>
                <IconButton 
                  onClick={handleSetLocation}
                  icon={faMapLocation}
            variant="warning"
                  size="lg"
                  loading={getttingGpsLocation}
            title="استخدام الموقع الحالي"
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

      <div className="flex justify-between items-center mt-6">
        <Button
          type="button"
          onClick={() => {
            if (safeOrder?.customer && (safeOrder?.customer?.locations?.length || safeOrder?.customer?.name || safeOrder?.customer?.phone)) {
              onBack(safeOrder?.customer);
            } else {
              navigate(-1);
            }
          }}
          variant="secondary"
          icon={faArrowRight}
          disabled={isBackLoading || isSubmitLoading}
        >
          رجوع
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={faSave}
          disabled={(isEdit && safeOrder?.status === 'Confirmed') || isSubmitLoading}
          loading={isSubmitLoading}
        >
          {title}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;