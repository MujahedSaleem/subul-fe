import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import OrderForm from '../../components/OrderForm';
import { ordersStore } from '../../store/ordersStore';
import type { OrderList, OrderRequest } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { Customer } from '../../types/customer';
import { customersStore } from '../../store/customersStore';

const generateOrderNumber = () => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `ORD${timestamp}`;
};

const AddOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError(); // Use inside a React component
  const [order, setOrder] = useState<OrderList>({
    id: 0, // ID will be assigned by the backend
    orderNumber: generateOrderNumber(),
    customer: null,
    location: null,
    cost: 0,
    status: 'New',
    distributor: null, // Ensure this field is initialized

  });


  const handleBack = async (customer:Customer) => {
    try {
      let newCustomer = null;
      if (!customer.id)
        newCustomer = await customersStore.addCustomer(customer);
      else
        newCustomer = await customersStore.updateCustomer(customer);
      if(newCustomer){
        const selectedLocation = newCustomer?.locations?.find(l => l.coordinates === customer.locations[0].coordinates) ;
        await ordersStore.addOrder({ ...order, customerId:newCustomer?.id, LocationId:selectedLocation?.id, statusString: 'Draft' });
    }
      // Save the order as a draft before navigating back

    } catch (error) {
      console.error('Failed to save order as draft:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'فشل حفظ الطلب كمسودة، الرجاء المحاولة لاحقًا.',
      });
    } finally {
      navigate('/admin/orders');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let errorMessage = null;

    try {
      // Validate the order before submission
      if (!order.customer || !order.location || !order.cost || !order.distributor) {
        dispatch({
          type: 'SET_ERROR',
          payload: errorMessage || 'يرجى تعبئة جميع الحقول المطلوبة.',
        });
        return 
      }
      let newCustomer = null;
      if (!order.customer?.id)
        newCustomer = await customersStore.addCustomer(order.customer);
      else
        newCustomer = await customersStore.updateCustomer(order.customer);
      if(newCustomer){
        const selectedLocation = newCustomer?.locations?.find(l => l.coordinates === order.customer.locations[0].coordinates) ;
        
            const confirmedOrder = {
              id:order.id,
              orderNumber:order.orderNumber,
              customerId:newCustomer.id,
              LocationId:selectedLocation?.id,
              cost:order.cost,
              distributorId:order.distributor.id,      
            } as OrderRequest;
        
           
            const newOrder = await ordersStore.addOrder(confirmedOrder);
            await ordersStore.confirmOrder(newOrder.id)
    }

      // Navigate to the orders page after successful submission
      navigate('/admin/orders');
    } catch (exception: any) {
      // Handle errors from the backend
      if (exception.response?.status === 400) {
        const { error } = exception.response.data;
        errorMessage = error || "حدث خطأ غير متوقع، الرجاء المحاولة لاحقًا.";
      } else {
        errorMessage = "فشل الاتصال بالخادم، الرجاء التحقق من الإنترنت.";
      }

      // Dispatch the error globally
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage || 'حدث خطأ أثناء العملية.',
      });
    }
  };

  return (
    <Layout title="إضافة طلبية">
      <OrderForm
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

export default AddOrder;