import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import OrderForm from '../../components/OrderForm';
import type { OrderList } from '../../types/order';
import { useAdminOrderManagement } from '../../hooks/useAdminOrderManagement';
import { getOrderById, clearCurrentOrder } from '../../store/slices/orderSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { useCustomers } from '../../hooks/useCustomers';

// Separate component that uses the hook
const EditOrderForm: React.FC<{ initialOrder: OrderList }> = ({ initialOrder }) => {
  // Use the admin order management hook
  const {
    order,
    setOrder,
    isSubmitting,
    handleSubmit,
    buttonTitle
  } = useAdminOrderManagement({ 
    initialOrder, 
    isEdit: true 
  });

  return (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 00-2-2V7a2 2 0 002 2z" />
                  </svg>
                  {new Date(order.createdAt).toLocaleDateString('en-US')}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Section */}
        <div className="p-6 sm:p-8">
          <OrderForm
            order={order}
            setOrder={setOrder}
            onSubmit={handleSubmit}
            title={buttonTitle}
            isEdit={true}
            isSubmitLoading={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};

const EditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { findCustomerByPhone } = useCustomers();
  
  const { isLoading: reduxLoading } = useSelector((state: RootState) => state.orders);
  const [initialOrder, setInitialOrder] = useState<OrderList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load order data once
  useEffect(() => {
    const loadOrder = async () => {
      if (!id || dataLoaded) {
        return;
      }

      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        navigate('/admin/orders');
        return;
      }

      try {
        setIsLoading(true);
        // Clear previous order data to ensure fresh fetch
        dispatch(clearCurrentOrder());
        
        // Fetch order via Redux - this will always fetch fresh data from API
        const result = await dispatch(getOrderById(orderId.toString())).unwrap();
        
        if (result) {
          // Fetch complete customer data with locations using phone number
          let fullOrderData = result;
          if (result.customer?.phone) {
            try {
              const customerResult = await findCustomerByPhone(result.customer.phone);
              const customerData = customerResult.payload as any;
              if (customerData && customerData.length > 0) {
                
                
                fullOrderData = {
                  ...result,
                  customer: customerData[0]
                };
              }
            } catch (customerError) {
              console.warn('Could not fetch customer details:', customerError);
            }
          }
          
          setInitialOrder(fullOrderData);
          setDataLoaded(true);
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
  }, [id, navigate, dispatch, findCustomerByPhone, dataLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch]);

  if (isLoading || reduxLoading || !initialOrder) {
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

  return (
    <Layout title="تعديل الطلبية">
      <EditOrderForm initialOrder={initialOrder} />
    </Layout>
  );
};

export default EditOrder;