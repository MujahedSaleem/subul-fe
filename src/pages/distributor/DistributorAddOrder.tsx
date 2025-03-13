import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { Customer } from '../../types/customer';
import { distributorCustomersStore } from '../../store/distributorCustomersStore';

const DistributorAddOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError();

  const [order, setOrder] = useState<OrderList>({
    id: 0,
    orderNumber: distributorCustomersStore.generateOrderNumber(),
    customer: null,
    location: null,
    cost: 0,
    status: 'New',
  });

  const handleBack = async (customer?: Customer) => {
    try {
      if (customer) {
        // Save customer if new
        if ((!customer.id|| customer.id=='' )&& customer?.phone) {
          const newCustomer = await distributorCustomersStore.addCustomer({
            ...customer,
            locationName: customer.locations[0].name,
            coordinates: customer.locations[0].coordinates,
          });
          if (newCustomer) {
            const selectedLocation = newCustomer.locations?.find(l => l.coordinates === customer.locations[0].coordinates);
            await distributorCustomersStore.addOrder({
              ...order,
              location:selectedLocation,
              customerId: newCustomer.id,
              locationId: selectedLocation?.id,
              statusString: 'Draft'
            });
          }
        } else if (customer?.phone) {
          // Update existing customer
          const updatedCustomer = await distributorCustomersStore.updateCustomer(customer);
          if (updatedCustomer) {
            const selectedLocation = updatedCustomer.locations?.find(l => l.coordinates === customer.locations[0].coordinates);
            await distributorCustomersStore.addOrder({
              ...order,
              location:selectedLocation,
              customerId: updatedCustomer.id,
              locationId: selectedLocation?.id,
              statusString: 'Draft'
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to save order as draft:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'فشل حفظ الطلب كمسودة، الرجاء المحاولة لاحقًا.',
      });
    } finally {
      navigate('/distributor/orders');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      if (!order.customer || !order.location || !order.cost) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'يرجى تعبئة جميع الحقول المطلوبة.',
        });
        return;
      }

      let customer = order.customer;
      if (!customer.id) {
        customer = await distributorCustomersStore.addCustomer(customer);
      } else {
        customer = await distributorCustomersStore.updateCustomer(customer);
      }

      if (customer) {
        const selectedLocation = customer.locations?.find(l => l.coordinates === order.location.coordinates);
        const newOrder = await distributorCustomersStore.addOrder({
          ...order,
          customerId: customer.id,
          LocationId: selectedLocation?.id,
          statusString: 'New'
        });

        if (newOrder) {
          await distributorCustomersStore.confirmOrder(newOrder.id);
        }
      }

      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error submitting order:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'حدث خطأ أثناء حفظ الطلب.',
      });
    }
  };

  return (
    <Layout title="إضافة طلبية">
      <DistributorOrderForm
        order={order}
        setOrder={setOrder}
        onSubmit={handleSubmit}
        onBack={handleBack}
        title="تأكيد الطلبية"
        isEdit={false}
      />
    </Layout>
  );
};

export default DistributorAddOrder;