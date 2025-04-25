import React, { useState, useEffect } from 'react';
import type { OrderList } from '../types/order';
import { customersStore } from '../store/customersStore';
import Button from './Button';
import { faArrowRight, faMapLocation, faSave } from '@fortawesome/free-solid-svg-icons';
import CustomerPhoneInput from './CustomerPhoneInput';
import CustomerNameInput from './CustomerNameInput';
import LocationSelector from './LocationSelector';
import DistributorSelector from './DistributorSelector';
import CostInput from './CostInput';
import { Customer } from '../types/customer';
import { useNavigate } from 'react-router-dom';
import { isValidPhoneNumber } from '../utils/formatters';
import IconButton from './IconButton';
import { getCurrentLocation } from '../services/locationService';

interface OrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  onBack: (customer?: Customer) => void;
  title: string;
  isEdit?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  order,
  setOrder,
  onSubmit,
  onBack,
  title,
  isEdit = false,
}) => {
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
    if (!order?.customer?.id && order?.customer?.phone && isValidPhoneNumber(order?.customer?.phone)) {
      const existingCustomer = await customersStore.findCustomerByPhone(order?.customer?.phone);
      if (existingCustomer !== undefined && existingCustomer !== null) {
        setIsNewCustomer(false);
        setOrder((prev) => ({
          ...prev,
          customer: existingCustomer
        }));
      } else {
        setIsNewCustomer(true);
      }
    } else {
      setIsNewCustomer(false);
    }
    setIsSearching(false);
   }
   findCustomer()
  }, [order?.customer?.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if we need to save a new location
      if (order?.location && !order.location.id && order.customer) {
        // Create a new location for the customer
        const newLocation = {
          ...order.location,
          customerId: order.customer.id
        };
        
        const updatedCustomer = await customersStore.updateCustomer({
          ...order.customer,
          locations: [...(order.customer.locations || []), newLocation]
        });
        
        if (updatedCustomer) {
          // Find the newly created location
          const savedLocation = updatedCustomer.locations?.find(
            loc => loc.coordinates === order.location?.coordinates
          );
          
          if (savedLocation) {
            setOrder(prev => ({
              ...prev,
              location: savedLocation,
              customer: updatedCustomer
            }));
          }
        }
      }
      
      onSubmit(e);
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGetttingGpsLocation(true);
    try {
      const gpsLocation = await getCurrentLocation();
      if (gpsLocation?.coordinates && order.customer) {
        // Update the selected location's coordinates
        const updatedLocations = order.customer.locations.map(loc => 
          loc.id === order.location?.id 
            ? { ...loc, coordinates: gpsLocation.coordinates }
            : loc
        );

        // Update the customer with new locations
        const updatedCustomer = {
          ...order.customer,
          locations: updatedLocations
        };

        // Update the order with new location and customer
        setOrder(prev => ({
          ...prev,
          location: updatedLocations.find(loc => loc.id === order.location?.id),
          customer: updatedCustomer
        }));
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setGetttingGpsLocation(false);
    }
  };

  const handleLocationChange = async (location: Location) => {
    if (!order?.customer) return;

    setOrder(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        location: location,
        locationId: location.id
      };
    });
  };

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
          setOrder={setOrder}
          isNewCustomer={isNewCustomer}
          disabled={(isEdit && order.status === 'Confirmed') || !order?.customer?.name}
          customer={order?.customer}
          ref={locationRef}
        />
      )}

      {order?.location && !order.location.coordinates && (
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
        order={order}
        setOrder={setOrder}
        disabled={isEdit && order.status === 'Confirmed'}
      />

      <CostInput
        cost={order.cost}
        setOrder={setOrder}
        disabled={isEdit && order.status === 'Confirmed'}
      />

      <div className="flex justify-between items-center mt-6">
        <Button
          type="button"
          onClick={() => {
            if (order?.customer && (order?.customer?.locations?.length || order?.customer?.name || order?.customer?.phone)) {
              onBack(order?.customer);
            } else {
              navigate(-1);
            }
          }}
          variant="secondary"
          icon={faArrowRight}
        >
          {isEdit ? 'رجوع للطلبات' : 'إلغاء'}
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={faSave}
          disabled={isEdit && order.status === 'Confirmed'}
          loading={loading}
        >
          {title}
        </Button>
      </div>
    </form>
  );
};

export default OrderForm;