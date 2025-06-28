import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Layout from '../../components/Layout';
import OrderForm from '../../components/OrderForm';
import type { OrderList, OrderRequest } from '../../types/order';
import { customersStore } from '../../store/customersStore';
import { useError } from '../../context/ErrorContext';
import { Customer, Location, UpdateCustomerRequest, UpdateLocationRequest } from '../../types/customer';
import { updateOrder, confirmOrder } from '../../store/slices/orderSlice';
import { ordersStore } from '../../store/ordersStore';
import type { AppDispatch } from '../../store/store';

const EditOrder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { dispatch: errorDispatch } = useError();
  const shouldSaveOnUnmount = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackLoading, setIsBackLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [order, setOrder] = useState<OrderList | null>(null);
  const [originalOrder, setOriginalOrder] = useState<OrderList | null>(null);
  const [originalCustomer, setOriginalCustomer] = useState<Customer | null>(null);

  // Helper function to transform Customer to UpdateCustomerRequest format
  const transformCustomerForUpdate = (customer: Customer): UpdateCustomerRequest => {
    return {
      Name: customer.name,
      Phone: customer.phone,
      IsActive: true, // Assuming active customers
      Locations: customer.locations.map((location): UpdateLocationRequest => ({
        Id: location.id === 0 ? undefined : location.id, // Send undefined for new locations
        Name: location.name,
        Coordinates: location.coordinates || '',
        Description: location.address || '' // Use address as description
      }))
    };
  };

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
              const fullOrderData = {
                ...orderData,
                customer: customerData
              };
              setOrder(fullOrderData);
              setOriginalOrder(fullOrderData);
              setOriginalCustomer(customerData);
            } else {
              setOrder(orderData);
              setOriginalOrder(orderData);
            }
          } else {
            setOrder(orderData);
            setOriginalOrder(orderData);
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
    if (!order || !originalOrder || !originalCustomer) return;

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
        name: originalCustomer.name,
        phone: originalCustomer.phone,
        locations: originalCustomer.locations
      });
      let finalLocationId = order.location?.id;
      
      // Update customer first if there are changes
      if (hasCustomerChanges) {
        const updateRequest = transformCustomerForUpdate(order.customer);
        const updatedCustomer = await customersStore.updateCustomerWithFormat(order.customer.id, updateRequest);
        
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
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customer.id,
          locationId: finalLocationId,
          cost: order.cost,
          distributorId: order.distributor?.id,
          statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft'
        };
        await dispatch(updateOrder(orderRequest)).unwrap();
      }

   

      navigate('/admin/orders');
    } catch (error) {
      console.error('Error handling back navigation:', error);
      errorDispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء حفظ التغييرات' });
    } finally {
      setIsBackLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!order || order.status === 'Confirmed') {
      navigate('/admin/orders');
      return;
    }

    setIsSubmitLoading(true);
    try {
      const updateRequest = transformCustomerForUpdate(order.customer);
      const updatedCustomer = await customersStore.updateCustomerWithFormat(order.customer.id, updateRequest);
      
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

        const confirmedOrder = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: updatedCustomer.id,
          locationId: selectedLocation?.id,
          cost: order.cost,
          distributorId: order.distributor.id,
          statusString: 'New'
        } as OrderRequest;

        await dispatch(updateOrder(confirmedOrder)).unwrap();
        await dispatch(confirmOrder(confirmedOrder.id)).unwrap();
        shouldSaveOnUnmount.current = false;
        navigate('/admin/orders');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      errorDispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تأكيد الطلب' });
    } finally {
      setIsSubmitLoading(false);
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
              isBackLoading={isBackLoading}
              isSubmitLoading={isSubmitLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditOrder;