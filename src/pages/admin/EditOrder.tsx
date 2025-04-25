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
  const [order, setOrder] = useState<OrderList | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        navigate('/admin/orders');
        return;
      }

      try {
        setIsLoading(true);
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
          navigate('/admin/orders');
          return;
        }
        const orderData = await ordersStore.getOrderById(orderId);
        if (orderData) {
          // Fetch customer data including locations
          if (orderData.customer?.id) {
            const customerData = await customersStore.getCustomerById(orderData.customer.id.toString());
            if (customerData) {
              setOrder({
                ...orderData,
                customer: customerData
              });
            } else {
              setOrder(orderData);
            }
          } else {
            setOrder(orderData);
          }
        } else {
          navigate('/admin/orders');
        }
      } catch (error) {
        console.error('Error loading order:', error);
        navigate('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate]);

  const handleBack = async () => {
    if (!order) return;

    try {
      // Check if there are any changes to the order
      const originalOrder = await ordersStore.getOrderById(order.id);
      if (!originalOrder) {
        navigate('/admin/orders');
        return;
      }

      const hasOrderChanges = JSON.stringify({
        cost: order.cost,
        status: order.status,
        distributor: order.distributor,
        locationId: order.location?.id
      }) !== JSON.stringify({
        cost: originalOrder.cost,
        status: originalOrder.status,
        distributor: originalOrder.distributor,
        locationId: originalOrder.location?.id
      });

      // Check if there are any changes to the customer
      const originalCustomer = await customersStore.getCustomerById(order.customer.id);
      if (!originalCustomer) {
      navigate('/admin/orders');
      return;
    }

      const hasCustomerChanges = JSON.stringify({
        name: order.customer.name,
        phone: order.customer.phone,
        locations: order.customer.locations
      }) !== JSON.stringify({
        name: originalCustomer.name,
        phone: originalCustomer.phone,
        locations: originalCustomer.locations
      });

      // Only update if there are changes
      if (hasOrderChanges) {
        const orderRequest: OrderRequest = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customer.id,
          locationId: order.location?.id,
      cost: order.cost,
          distributorId: order.distributor?.id,
          statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
        };
        await ordersStore.updateOrder(orderRequest);
      }

      if (hasCustomerChanges) {
        await customersStore.updateCustomer(order.customer);
      }

      navigate('/admin/orders');
    } catch (error) {
      console.error('Error handling back navigation:', error);
    navigate('/admin/orders');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || order.status === 'Confirmed') {
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <div className="text-xl font-semibold text-gray-700">جاري تحميل بيانات الطلبية...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <Layout title="تعديل الطلبية">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">تعديل الطلبية #{order.orderNumber}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 rtl:space-x-reverse">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    order.status === 'Confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'Confirmed' ? 'تم التأكيد' : 'قيد الانتظار'}
                  </span>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
              {order.distributor && order.distributor.userName && (
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {order.distributor.userName || `${order.distributor.firstName} ${order.distributor.lastName}`}
                    </div>
                    {order.distributor.phone && (
                      <div className="text-xs text-gray-500">{order.distributor.phone}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-6 sm:p-8">
      <OrderForm
        order={order}
              setOrder={(newOrder) => {
                if (newOrder) {
                  setOrder(newOrder as OrderList);
                }
              }}
        onSubmit={handleSubmit}
        onBack={handleBack}
              title="حفظ التغييرات"
        isEdit={true}
      />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditOrder;