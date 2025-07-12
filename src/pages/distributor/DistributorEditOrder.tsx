import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList } from '../../types/order';
import { Customer, Location } from '../../types/customer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';
import { useOrderManagement } from '../../hooks/useOrderManagement';

const DistributorEditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [initialOrder, setInitialOrder] = useState<OrderList | null>(null);
  
  const {
    currentOrder,
    getOrderById,
    resetCurrentOrder
  } = useDistributorOrders();

  const { findByPhone } = useDistributorCustomers();

  // Default order state for initialization
  const defaultOrder: OrderList = {
    id: 0,
    orderNumber: '',
    customer: {
      id: '',
      name: '',
      phone: '',
      locations: []
    },
    location: {
      id: 0,
      name: '',
      address: '',
      coordinates: '',
      isActive: true,
      customerId: ''
    },
    cost: undefined,
    status: 'New',
    distributor: {
      id: '',
      name: '',
      phone: ''
    },
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString()
  };

  // Use the order management hook with stable initial order
  const {
    order,
    setOrder,
    setOriginalOrder,
    isSubmitting,
    handleSubmit,
    buttonTitle
  } = useOrderManagement({ 
    initialOrder: initialOrder || defaultOrder, 
    isEdit: true 
  });

  // Load order data once
  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        navigate('/distributor/orders');
        return;
      }

      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        navigate('/distributor/orders');
        return;
      }

      try {
        setIsLoading(true);
        // Clear previous order data to ensure fresh fetch
        resetCurrentOrder();
        
        // Fetch order via API - this will always fetch fresh data
        await getOrderById(orderId);
      } catch (error) {
        console.error('Error loading order:', error);
        navigate('/distributor/orders');
      }
    };

    loadOrder();
  }, [id, navigate, getOrderById, resetCurrentOrder]);

  // Update order state when currentOrder is loaded
  useEffect(() => {
    const loadCustomerData = async () => {
      if (currentOrder && !initialOrder) {
        console.log('Current order received:', currentOrder);
        console.log('Customer data:', currentOrder.customer);
        console.log('Customer locations:', currentOrder.customer?.locations);
        
        // Fetch complete customer data with locations
        let fullOrderData = currentOrder;
        if (currentOrder.customer?.phone) {
          try {
            const customerResult = await findByPhone(currentOrder.customer.phone);
            const customerData = customerResult.payload as Customer | null;
            if (customerData && customerData.id) {
              console.log('Found complete customer data:', customerData);
              console.log('Customer locations from API:', customerData.locations);
              fullOrderData = {
                ...currentOrder,
                customer: customerData
              };
            }
          } catch (customerError) {
            console.warn('Could not fetch customer details:', customerError);
          }
        }
        
        // Set location data
        const orderWithLocation = {
          ...fullOrderData,
          location: currentOrder.location || {
            id: 0,
            name: '',
            address: '',
            coordinates: '',
            isActive: true,
            customerId: fullOrderData.customer.id
          }
        };

        console.log('Final order data:', orderWithLocation);
        console.log('Final customer locations:', orderWithLocation.customer.locations);

        setInitialOrder(orderWithLocation);
        setOrder(orderWithLocation);
        setOriginalOrder(orderWithLocation);
        setIsLoading(false);
      }
    };

    loadCustomerData();
  }, [currentOrder, initialOrder, setOrder, setOriginalOrder, findByPhone]);

  if (isLoading || !initialOrder) {
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
                    <FontAwesomeIcon 
                      icon={order.status === 'Confirmed' ? faCheckCircle : faClock} 
                      className="w-4 h-4 ml-1" 
                    />
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
            <DistributorOrderForm
              order={order}
              setOrder={setOrder}
              onSubmit={handleSubmit}
              title={buttonTitle}
              isEdit={true}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DistributorEditOrder;