import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList, OrderRequest, DistributorInfo } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { Customer, Location } from '../../types/customer';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';

const generateOrderNumber = () => {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  return `ORD${timestamp}`;
};

const DistributorAddOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);

  const {
    addCustomer,
    updateCustomer
  } = useDistributorCustomers();

  const {
    addOrder,
    confirmOrder
  } = useDistributorOrders();

  const [order, setOrder] = useState<OrderList>({
    id: 0,
    orderNumber: generateOrderNumber(),
    customer: null as unknown as Customer,
    location: null as unknown as Location,
    cost: 0,
    status: 'New',
    distributor: null as unknown as DistributorInfo,
    createdAt: new Date().toISOString(),
    confirmedAt: null as unknown as string
  });

  const handleBack = async (customer?: Customer) => {
    if (!customer) {
      navigate('/distributor/orders');
      return;
    }

    setIsBackLoading(true);
    try {
      let newCustomer = null;
      if (!customer.id) {
        const result = await addCustomer(customer);
        newCustomer = result.payload as Customer;
      } else {
        const result = await updateCustomer(customer);
        newCustomer = result.payload as Customer;
      }
      
      if (newCustomer) {
        const selectedLocation = newCustomer?.locations?.find(l => l.coordinates === customer.locations[0].coordinates);
        await addOrder({ 
          ...order, 
          customerId: newCustomer?.id,
          locationId: selectedLocation?.id,
          statusString: 'Draft' as const
        });
      }
    } catch (error) {
      console.error('Failed to save order as draft:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'فشل حفظ الطلب كمسودة، الرجاء المحاولة لاحقًا.',
      });
    } finally {
      setIsBackLoading(false);
      navigate('/distributor/orders');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);
    let errorMessage = null;

    try {
      // Validate the order before submission
      if (!order.customer || !order.location || !order.cost) {
        dispatch({
          type: 'SET_ERROR',
          payload: errorMessage || 'يرجى تعبئة جميع الحقول المطلوبة.',
        });
        return;
      }

      let newCustomer = null;
      if (!order.customer?.id) {
        const result = await addCustomer(order.customer);
        newCustomer = result.payload as Customer;
      } else {
        const result = await updateCustomer(order.customer);
        newCustomer = result.payload as Customer;
      }

      if (newCustomer) {
        const selectedLocation = newCustomer?.locations?.find(l => l.coordinates === order.customer.locations[0].coordinates);
        
        const confirmedOrder: OrderRequest = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: newCustomer.id,
          locationId: selectedLocation?.id,
          cost: order.cost,
          distributorId: undefined,
          statusString: 'New'
        };

        const orderResult = await addOrder(confirmedOrder);
        const newOrder = orderResult.payload as OrderList;
        if (newOrder) {
          await confirmOrder(newOrder.id);
        }
      }

      // Navigate to the orders page after successful submission
      navigate('/distributor/orders');
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="إضافة طلبية">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">إضافة طلبية جديدة</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 rtl:space-x-reverse">
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    مسودة جديدة
                  </span>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                    {new Date().toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">رقم الطلبية</div>
                  <div className="text-xs text-gray-500">{order.orderNumber}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <DistributorOrderForm
              order={order}
              setOrder={setOrder}
              onSubmit={handleSubmit}
              onBack={handleBack}
              title="تأكيد الطلبية"
              isEdit={false}
              isSubmitting={isSubmitting}
              isBackLoading={isBackLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DistributorAddOrder;