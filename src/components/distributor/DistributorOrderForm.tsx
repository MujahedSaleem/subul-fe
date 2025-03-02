import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faArrowRight, faSave } from '@fortawesome/free-solid-svg-icons';
import type { OrderList } from '../../types/order';
import type { Customer } from '../../types/customer';
import Button from '../Button';
import CustomerPhoneInput from '../CustomerPhoneInput';
import CustomerNameInput from '../CustomerNameInput';
import LocationSelector from '../LocationSelector';
import CostInput from '../CostInput';
import { isValidPhoneNumber } from '../../utils/formatters';
import { distributorCustomersStore } from '../../store/distributorCustomersStore';

interface DistributorOrderFormProps {
  order: OrderList;
  setOrder: React.Dispatch<React.SetStateAction<OrderList>>;
  onSubmit: (e?: React.FormEvent) => void;
  onBack: (customer?: Customer) => void;
  title: string;
  isEdit?: boolean;
}

const DistributorOrderForm: React.FC<DistributorOrderFormProps> = ({
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
    setIsSearching(true);
    if (order?.customer?.phone && isValidPhoneNumber(order?.customer?.phone)) {
      const findCustomer = async () => {
        try {
          const existingCustomer = await distributorCustomersStore.findCustomerByPhone(order?.customer?.phone);

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
      };
      findCustomer();
    } else {
      setIsNewCustomer(true);
      setIsSearching(false);
    }
  }, [order?.customer?.phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (locationRef?.current?.getNewLocationName && order?.location?.id === undefined) {
      locationRef.current.setNewLocationName(locationRef?.current?.getNewLocationName);
      setLoading(false);
      return;
    } else if (order?.location?.id === undefined) {
      locationRef?.current?.activateGpsLocation();
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
          disabled={(isEdit && order.status === 'Confirmed') || !isNewCustomer}
        />
      )}

      {!isSearching &&order?.customer?.phone && (
        <LocationSelector
          order={order}
          setOrder={setOrder}
          isNewCustomer={isNewCustomer}
          disabled={isEdit && order.status === 'Confirmed'}
          customer={order?.customer}
          ref={locationRef}
          isDistributor={true}
        />
      )}

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

export default DistributorOrderForm;