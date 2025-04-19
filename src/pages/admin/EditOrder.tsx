import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import OrderForm from '../../components/OrderForm';
import { ordersStore } from '../../store/ordersStore';
import type { OrderList, OrderRequest } from '../../types/order';
import { customersStore } from '../../store/customersStore';
import { useError } from '../../context/ErrorContext';
import { Customer, Location } from '../../types/customer';
import { Distributor } from '../../types/distributor';

const EditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useError();
  const shouldSaveOnUnmount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderList>({
    id: parseInt(id || '0'),
    orderNumber: '',
    customer: null as unknown as Customer,
    location: null as unknown as Location,
    distributor: null as unknown as Distributor,
    cost: 0,
    status: 'New',
    createdAt: '',
    confirmedAt: ''
  });

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderId = parseInt(id || '0');
        const fetchedOrder = await ordersStore.getOrderById(orderId);
        
        if (fetchedOrder) {
          setOrder(fetchedOrder);
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'الطلب غير موجود' });
          navigate('/admin/orders');
        }
      } catch (error) {
        console.error('Error loading order:', error);
        dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تحميل الطلب' });
        navigate('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, dispatch]);

  const handleBack = async () => {
    if (order.status === 'Confirmed') {
      navigate('/admin/orders');
      return;
    }

    try {
      // Update customer first
      const updatedCustomer = await customersStore.updateCustomer(order.customer);
      
      if (updatedCustomer) {
        // Find the selected location
        const selectedLocation = updatedCustomer.locations?.find(
          l => l.coordinates === order?.location?.coordinates || l.id === order?.location?.id
        );

        // Update the order with the new location
        const updatedOrder = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: updatedCustomer.id,
          locationId: selectedLocation?.id,
          cost: order.cost,
          statusString: 'Pending',
          distributorId: order?.distributor?.id,
        } as OrderRequest;

        await ordersStore.updateOrder(updatedOrder);
        shouldSaveOnUnmount.current = false;
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء حفظ التغييرات' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (order.status === 'Confirmed') {
      navigate('/admin/orders');
      return;
    }

    try {
      const updatedCustomer = await customersStore.updateCustomer(order.customer);
      
      if (updatedCustomer) {
        const selectedLocation = updatedCustomer.locations.find(
          l => l.coordinates === order.location.coordinates || l.id === order.location.id
        );

        const confirmedOrder = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: updatedCustomer.id,
          locationId: selectedLocation?.id,
          cost: order.cost,
          distributorId: order.distributor.id,
          statusString: 'New'
        } as OrderRequest;

        await ordersStore.updateOrder(confirmedOrder);
        await ordersStore.confirmOrder(confirmedOrder.id);
        shouldSaveOnUnmount.current = false;
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تأكيد الطلب' });
    }
  };

  if (isLoading) {
    return (
      <Layout title="تعديل الطلبية">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-xl font-semibold">جاري التحميل...</div>
          </div>
        </div>
      </Layout>
    );
  }

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