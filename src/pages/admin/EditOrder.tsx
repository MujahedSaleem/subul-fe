import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import OrderForm from '../../components/OrderForm';
import { ordersStore } from '../../store/ordersStore';
import type { OrderList, OrderRequest } from '../../types/order';
import { customersStore } from '../../store/customersStore';

const EditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shouldSaveOnUnmount = useRef(true);
  const [order, setOrder] = useState<OrderList>({
    id: parseInt(id || '0'),
    orderNumber: '',
    customerId: '',
    LocationId: '',
    cost: '',
    status: 'New'
  });

  useEffect(() => {
    const existingOrder = ordersStore.orders.find(o => o.id === parseInt(id || '0'));
    console.log(existingOrder)
    if (existingOrder) {
      setOrder(existingOrder);
    }
  }, [id]);

  const handleBack = async () => {
    if (order.status === 'Confirmed') {
      navigate('/admin/orders');
      return;
    }
    const customer = await customersStore.updateCustomer(order.customer)
    ordersStore.updateOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customer.id,
      LocationId: customer?.locations?.filter(l => l.coordinates === order?.location?.coordinates)[0]?.id,
      cost: order.cost,
      statusString: 'Pending',
      distributorId: order?.distributor?.id,
    })
   
    shouldSaveOnUnmount.current = false;
    navigate('/admin/orders');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (order.status === 'Confirmed') {
      navigate('/admin/orders');
      return;
    }
    const customer = await customersStore.updateCustomer(order.customer)

    const confirmedOrder = {
      id:order.id,
      orderNumber:order.orderNumber,
      customerId:order.customer.id,
      LocationId:customer?.locations.find(l => l.coordinates === order.location.coordinates)?.id,
      cost:order.cost,
      distributorId:order.distributor.id,      
    } as OrderRequest;

   
    await ordersStore.updateOrder(confirmedOrder)
    await ordersStore.confirmOrder(confirmedOrder.id)
    shouldSaveOnUnmount.current = false;
    navigate('/admin/orders');
  };

  return (
    <Layout title="تعديل الطلبية">
      <OrderForm
        order={order}
        setOrder={setOrder}
        onSubmit={handleSubmit}
        onBack={handleBack}
        title="تأكيد الطلبية"
        isEdit={true}
      />
    </Layout>
  );
};

export default EditOrder;