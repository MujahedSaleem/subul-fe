import React, { useState, useEffect } from 'react';
import type { OrderList } from '../types/order';
import { customersStore } from '../store/customersStore';
import Button from './Button';
import { faArrowRight, faSave } from '@fortawesome/free-solid-svg-icons';
import CustomerPhoneInput from './CustomerPhoneInput';
import CustomerNameInput from './CustomerNameInput';
import LocationSelector from './LocationSelector';
import DistributorSelector from './DistributorSelector';
import CostInput from './CostInput';
import { Customer } from '../types/customer';
import { useNavigate } from 'react-router-dom';
import { isValidPhoneNumber } from '../utils/formatters';

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
  const navigate = useNavigate();
  const locationRef = React.useRef(null);

  useEffect(() => {
   const findCustomer = async () => {
    setIsSearching(true);
    if (order?.customer?.phone && isValidPhoneNumber(order?.customer?.phone)) {
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
      setIsSearching(false);
    } else {
      setIsNewCustomer(true);
      setIsSearching(false);
    }
   }
   findCustomer()
  }, [order?.customer?.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (locationRef?.current?.getNewLocationName && order?.location?.id === undefined) {
      locationRef.current.setNewLocationName(locationRef?.current?.getNewLocationName);
      setLoading(false);
      return;
    }
    onSubmit(e);
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