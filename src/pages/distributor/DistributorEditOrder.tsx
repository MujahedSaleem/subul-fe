import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList, OrderRequest } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { Customer } from '../../types/customer';
import { distributorCustomersStore } from '../../store/distributorCustomersStore';

const DistributorEditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useError();
  const [order, setOrder] = useState<OrderList | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        try {
          const existingOrder = await distributorCustomersStore.getOrderById(parseInt(id));
          if (existingOrder) {
            setOrder(existingOrder);
          } else {
            dispatch({ type: 'SET_ERROR', payload: 'الطلب غير موجود' });
            navigate('/distributor/orders');
          }
        } catch (error) {
          console.error('Error loading order:', error);
          dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تحميل الطلب' });
          navigate('/distributor/orders');
        }
      }
    };

    loadOrder();
  }, [id, navigate, dispatch]);

  const handleBack = async (customer?: Customer) => {
    if (order?.status === 'Confirmed') {
      navigate('/distributor/orders');
      return;
    }

    try {
      if (customer) {
        const updatedCustomer = await distributorCustomersStore.updateCustomer(customer);
        if (updatedCustomer) {
          const selectedLocation = updatedCustomer.locations?.find(l => l.coordinates === order?.location?.coordinates || l.id == order?.location?.id);
          await distributorCustomersStore.updateOrder({
            ...order,
            customerId: updatedCustomer.id,
            LocationId: selectedLocation?.id,
            statusString: 'Pending'
          }as OrderRequest );
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء حفظ المسودة' });
    } finally {
      navigate('/distributor/orders');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (order.status === 'Confirmed') {
      navigate('/distributor/orders');
      return;
    }

    try {
      const customer = await distributorCustomersStore.updateCustomer(order.customer);
      if (customer) {
        const selectedLocation = customer.locations.find(l => l.coordinates === order.location.coordinates);
        await distributorCustomersStore.updateOrder({
          ...order,
          customerId: customer.id,
          LocationId: selectedLocation?.id,
          statusString: 'New'
        });
        await distributorCustomersStore.confirmOrder(order.id);
      }
      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error updating order:', error);
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تحديث الطلب' });
    }
  };

  return (
    <Layout title="تعديل الطلبية">
      {!order ? (
        <div>Loading...</div>
      ) : (
        <DistributorOrderForm
          order={order}
          setOrder={setOrder}
          onSubmit={handleSubmit}
          onBack={handleBack}
          title="تأكيد الطلبية"
          isEdit={true}
        />
      )}
    </Layout>
  );
  
};

export default DistributorEditOrder;