import React, { useState, useEffect, useRef } from 'react';
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
import { distributorCustomersStore } from '../../store/distributorCustomersStore';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';

const DistributorEditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch: errorDispatch } = useError();
  const shouldSaveOnUnmount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    orders,
    currentOrder,
    getOrderById,
    updateOrder,
    confirmOrder
  } = useDistributorOrders();

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

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        navigate('/distributor/orders');
        return;
      }

      try {
        setIsLoading(true);
        const orderId = parseInt(id);
        if (isNaN(orderId)) {
          navigate('/distributor/orders');
          return;
        }

        // Fetch order data using the distributor orders hook
        await getOrderById(orderId);
      } catch (error) {
        console.error('Error loading order:', error);
        navigate('/distributor/orders');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, getOrderById]);

  // Update order state when currentOrder changes
  useEffect(() => {
    if (currentOrder) {
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
  }, [currentOrder]);

  const handleBack = async () => {
    if (!order || !originalOrder) return;

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
        phone: order.customer.phone
      }) !== JSON.stringify({
        name: originalOrder.customer.name,
        phone: originalOrder.customer.phone
      });

      // Check if there are any changes to the location
      const hasLocationChanges = order.location && originalOrder.location && 
        JSON.stringify({
          name: order.location.name,
          coordinates: order.location.coordinates,
          address: order.location.address
        }) !== JSON.stringify({
          name: originalOrder.location.name,
          coordinates: originalOrder.location.coordinates,
          address: originalOrder.location.address
        });

      // Check if the locations array has changed
      const haveLocationsChanged = JSON.stringify(order.customer.locations) !== JSON.stringify(originalOrder.customer.locations);

      // If locations changed, update the distributor customer (with all locations)
      if (haveLocationsChanged) {
        const updatedCustomer = await distributorCustomersStore.updateCustomer({
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        });

        if (updatedCustomer) {
          // Find the matching location in the updated customer data
          const updatedLocation = updatedCustomer.locations.find(
            (loc: Location) => loc.coordinates === order.location?.coordinates && 
                   loc.name === order.location?.name &&
                   loc.address === order.location?.address
          );

          if (updatedLocation) {
            // Update the order with the new location ID using distributor store
            const orderRequest: OrderRequest = {
              id: order.id,
              orderNumber: order.orderNumber,
              customerId: updatedCustomer.id,
              locationId: updatedLocation.id,
              cost: order.cost,
              distributorId: order.distributor?.id,
              statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
            };
            await updateOrder(orderRequest);
          }
        }
      }

      // Only update if there are changes
      if (hasOrderChanges && !haveLocationsChanged) {
        const orderRequest: OrderRequest = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customer.id,
          locationId: order.location?.id,
          cost: order.cost,
          distributorId: order.distributor?.id,
          statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
        };
        await updateOrder(orderRequest);
      }

      if (hasCustomerChanges) {
        // Update customer basic info using distributor endpoint
        const customerUpdate = {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        };
        await distributorCustomersStore.updateCustomer(customerUpdate);
      }

      // Update location using distributor endpoint
      if (hasLocationChanges && order.location) {
        const locationUpdate = {
          id: order.location.id,
          name: order.location.name,
          coordinates: order.location.coordinates || '',
          address: order.location.address,
          isActive: true,
          customerId: order.customer.id
        };
        const updatedCustomer = await distributorCustomersStore.updateCustomerLocation(
          order.customer.id,
          locationUpdate
        );

        // Update the order in the store with the new location
        if (updatedCustomer) {
          // Find the matching location in the updated customer data
          const updatedLocation = updatedCustomer.locations.find(
            (loc: Location) => loc.coordinates === locationUpdate.coordinates && 
                   loc.name === locationUpdate.name &&
                   loc.address === locationUpdate.address
          );

          if (updatedLocation) {
            const orderRequest: OrderRequest = {
              id: order.id,
              orderNumber: order.orderNumber,
              customerId: order.customer.id,
              locationId: updatedLocation.id,
              cost: order.cost,
              distributorId: order.distributor?.id,
              statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
            };
            await updateOrder(orderRequest);
          }
        }
      }

      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error handling back navigation:', error);
      navigate('/distributor/orders');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || order.status === 'Confirmed') {
      navigate('/distributor/orders');
      return;
    }

    try {
      // Update customer if needed using distributor store
      if (order.customer) {
        const customerUpdate = {
          id: order.customer.id,
          name: order.customer.name,
          phone: order.customer.phone,
          locations: order.customer.locations
        };
        const updatedCustomer = await distributorCustomersStore.updateCustomer(customerUpdate);

        // Update the order in the store with the new customer data
        if (updatedCustomer) {
          const orderRequest: OrderRequest = {
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: updatedCustomer.id,
            locationId: order.location?.id,
            cost: order.cost,
            distributorId: order.distributor?.id,
            statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
          };
          await updateOrder(orderRequest);
        }
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
        const updatedCustomer = await distributorCustomersStore.updateCustomerLocation(
          order.customer.id,
          locationUpdate
        );

        // Update the order in the store with the new location
        if (updatedCustomer) {
          const updatedLocation = updatedCustomer.locations.find(loc => loc.id === order.location?.id);
          if (updatedLocation) {
            const orderRequest: OrderRequest = {
              id: order.id,
              orderNumber: order.orderNumber,
              customerId: order.customer.id,
              locationId: updatedLocation.id,
              cost: order.cost,
              distributorId: order.distributor?.id,
              statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
            };
            await updateOrder(orderRequest);
          }
        }
      }

      const confirmedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customer.id,
        locationId: order.location?.id,
        cost: order.cost,
        distributorId: order.distributor.id,
        statusString: 'New'
      } as OrderRequest;

      await updateOrder(confirmedOrder);
      await confirmOrder(confirmedOrder.id);
      shouldSaveOnUnmount.current = false;
      navigate('/distributor/orders');
    } catch (error) {
      console.error('Error confirming order:', error);
      errorDispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تأكيد الطلب' });
    }
  };

  const handleSetOrder = (newOrder: React.SetStateAction<OrderList>) => {
    setOrder(newOrder);
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
                    <FontAwesomeIcon 
                      icon={order.status === 'Confirmed' ? faCheckCircle : faClock} 
                      className="w-4 h-4 ml-1" 
                    />
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
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DistributorEditOrder;