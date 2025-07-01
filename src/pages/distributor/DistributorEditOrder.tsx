import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList, OrderRequest } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { Customer, Location } from '../../types/customer';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@material-tailwind/react';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';

const DistributorEditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch: errorDispatch } = useError();
  const shouldSaveOnUnmount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);
  const [orderLoaded, setOrderLoaded] = useState(false);
  
  const {
    orders,
    currentOrder,
    getOrderById,
    updateOrder,
    confirmOrder
  } = useDistributorOrders();

  const {
    updateCustomer,
    updateCustomerLocation
  } = useDistributorCustomers();

  const [order, setOrder] = useState<OrderList>({
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
    cost: 0,
    status: 'New',
    distributor: {
      id: '',
      name: '',
      phone: ''
    },
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString()
  });
  const [originalOrder, setOriginalOrder] = useState<OrderList | null>(null);

  // Memoize the order loading function to prevent infinite loops
  const loadOrder = useCallback(async (orderId: number) => {
    if (orderLoaded) return; // Prevent multiple loads

    try {
      setIsLoading(true);
      await getOrderById(orderId);
      setOrderLoaded(true);
    } catch (error) {
      console.error('Error loading order:', error);
      navigate('/distributor/orders');
    } finally {
      setIsLoading(false);
    }
  }, [getOrderById, navigate, orderLoaded]);

  useEffect(() => {
    if (!id) {
      navigate('/distributor/orders');
      return;
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      navigate('/distributor/orders');
      return;
    }

    // Only load if not already loaded
    if (!orderLoaded) {
      loadOrder(orderId);
    }
  }, [id, navigate, loadOrder, orderLoaded]);

  // Update order state when currentOrder changes
  useEffect(() => {
    if (currentOrder && orderLoaded) {
      const fullOrderData = {
        ...currentOrder,
        customer: {
          ...currentOrder.customer,
          locations: currentOrder.customer.locations || []
        },
        location: currentOrder.location || {
          id: 0,
          name: '',
          address: '',
          coordinates: '',
          isActive: true,
          customerId: currentOrder.customer.id
        }
      };

      setOrder(fullOrderData);
      setOriginalOrder(fullOrderData);
      setIsLoading(false);
    }
  }, [currentOrder, orderLoaded]);

  const handleBack = useCallback(async () => {
    if (!order || !originalOrder) return;

    setIsBackLoading(true);
    try {
      // Check if there are any changes to the order
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
      const hasCustomerChanges = JSON.stringify({
        name: order.customer.name,
        phone: order.customer.phone,
        locations: order.customer.locations
      }) !== JSON.stringify({
        name: originalOrder.customer.name,
        phone: originalOrder.customer.phone,
        locations: originalOrder.customer.locations
      });

      let finalLocationId = order.location?.id;
      
      // Update customer first if there are changes
      if (hasCustomerChanges) {
        const result = await updateCustomer({
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        });
        const updatedCustomer = result.payload as Customer;
        
        if (updatedCustomer) {
          // Find the correct location from the updated customer
          // This handles the case where new locations get assigned real IDs by the backend
          const selectedLocation = updatedCustomer.locations.find(
            (l) => {
              // For new locations (originally ID 0), match by coordinates and name
              if (order.location?.id === 0) {
                return l.coordinates === order.location.coordinates && l.name === order.location.name;
              }
              // For existing locations, match by ID or coordinates
              return l.id === order.location?.id || l.coordinates === order.location?.coordinates;
            }
          );
          
          if (selectedLocation) {
            finalLocationId = selectedLocation.id;
          }
        }
      }

      // Update order if there are changes OR if the location ID was updated from customer changes
      if (hasOrderChanges || finalLocationId !== order.location?.id) {
        const orderRequest: OrderRequest = {
          customerId: parseInt(order.customer.id),
          locationId: finalLocationId,
          cost: order.cost,
          statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
        };
        await updateOrder(orderRequest);
      }

      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error handling back navigation:', error);
      errorDispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء حفظ التغييرات' });
    } finally {
      setIsBackLoading(false);
    }
  }, [order, originalOrder, updateCustomer, updateOrder, navigate, errorDispatch]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || order.status === 'Confirmed') {
      navigate('/distributor/orders');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update customer if needed using distributor store
      if (order.customer) {
        const customerUpdate = {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        };
        await updateCustomer(customerUpdate);
      }

      // Update location if needed using distributor store
      if (order.location) {
        const locationUpdate = {
          id: order.location.id,
          name: order.location.name,
          coordinates: order.location.coordinates || '',
          address: order.location.address,
          isActive: true,
          customerId: order.customer.id
        };
        await updateCustomerLocation(order.customer.id, locationUpdate);
      }

      const confirmedOrder: OrderRequest = {
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: order.cost,
        statusString: 'New'
      };

      await updateOrder(confirmedOrder);
      await confirmOrder(order.id);
      shouldSaveOnUnmount.current = false;
      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error confirming order:', error);
      errorDispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تأكيد الطلب' });
    } finally {
      setIsSubmitting(false);
    }
  }, [order, updateCustomer, updateCustomerLocation, updateOrder, confirmOrder, navigate, errorDispatch]);

  const handleSetOrder = useCallback((newOrder: React.SetStateAction<OrderList>) => {
    setOrder(newOrder);
  }, []);

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
                    <FontAwesomeIcon 
                      icon={order.status === 'Confirmed' ? faCheckCircle : faClock} 
                      className="w-4 h-4 ml-1" 
                    />
                    {order.status === 'Confirmed' ? 'تم التأكيد' : 'قيد الانتظار'}
                  </span>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <DistributorOrderForm
              order={order}
              setOrder={handleSetOrder}
              onSubmit={handleSubmit}
              onBack={handleBack}
              title="حفظ التغييرات"
              isEdit={true}
              isSubmitting={isSubmitting}
              isBackLoading={isBackLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DistributorEditOrder;