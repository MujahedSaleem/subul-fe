import React, { useState, memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faMapMarkerAlt, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { OrderList, OrderRequest } from '../../../types/order';
import { Customer } from '../../../types/customer';
import Button from '../../../components/Button';
import IconButton from '../../../components/IconButton';
import { getOrderStatusConfig, formatCurrency, handleDirectCall, areAllRequiredFieldsFilled } from '../../../utils/distributorUtils';
import { useAppDispatch } from '../../../store/hooks';
import { showError, showWarning, showSuccess, showInfo } from '../../../store/slices/notificationSlice';
import axiosInstance from '../../../utils/axiosInstance';
import { getCurrentLocation } from '../../../services/locationService';
import { updateDistributorCustomerLocation } from '../../../store/slices/distributorCustomersSlice';
import { openGoogleMapsApp } from '../../../utils/geo_utils';

interface StandaloneOrderCardProps {
  initialOrder: OrderList;
  onCallCustomer: (customer: Customer) => void;
  onOrderChanged?: (orderId: number) => void;
}

/**
 * StandaloneOrderCard - A component for displaying and managing individual orders
 * 
 * This component uses Redux actions from distributorCustomersSlice for customer data management
 * and makes direct API calls for order-specific operations.
 */
const StandaloneOrderCard = ({ initialOrder, onCallCustomer, onOrderChanged }: StandaloneOrderCardProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Local state for this specific order
  const [order, setOrder] = useState<OrderList>(initialOrder);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [costInputValue, setCostInputValue] = useState(initialOrder.cost?.toString() || '');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  
  // Add state to track if the order meets requirements for confirmation
  const [canConfirmOrder, setCanConfirmOrder] = useState<boolean>(areAllRequiredFieldsFilled(initialOrder));
  
  // Update local state if initialOrder changes (rarely happens)
  useEffect(() => {
    if (JSON.stringify(initialOrder) !== JSON.stringify(order)) {
      setOrder(initialOrder);
      setCanConfirmOrder(areAllRequiredFieldsFilled(initialOrder));
    }
  }, [initialOrder]);

  const statusConfig = getOrderStatusConfig(order.status);

  // Helper function to compare orders and check if there are changes
  const hasOrderChanged = (newOrder: OrderList, oldOrder: OrderList): boolean => {
    // Compare relevant fields that would require a re-render
    return (
      newOrder.status !== oldOrder.status ||
      newOrder.cost !== oldOrder.cost ||
      JSON.stringify(newOrder.location) !== JSON.stringify(oldOrder.location) ||
      JSON.stringify(newOrder.customer) !== JSON.stringify(oldOrder.customer)
    );
  };

  // Refresh order data
  const handleRefreshOrder = useCallback(async () => {
    if (!order.id) return;
    
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    // Throttle refreshes to prevent too many API calls (minimum 2 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshTime < 2000) {
      dispatch(showInfo({ message: 'تم التحديث مؤخراً، يرجى الانتظار', duration: 1000 }));
      return;
    }
    
    setIsRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      // Fetch the latest order data
      const response = await axiosInstance.get(`/distributors/orders/${order.id}`);
      const updatedOrder = response.data.data;
      
      // Check if there are actual changes
      if (hasOrderChanged(updatedOrder, order)) {
        // Update local state
        setOrder(updatedOrder);
        
        // Update canConfirmOrder based on the new order data
        setCanConfirmOrder(areAllRequiredFieldsFilled(updatedOrder));
        
        // Notify parent component
        if (onOrderChanged) {
          onOrderChanged(order.id);
        }
        
        dispatch(showSuccess({ message: 'تم تحديث الطلب', duration: 2000 }));
      } else {
        dispatch(showInfo({ message: 'الطلب محدث بالفعل', duration: 1000 }));
      }
    } catch (error) {
      console.error('Error refreshing order:', error);
      dispatch(showError({ message: 'فشل في تحديث الطلب' }));
    } finally {
      setIsRefreshing(false);
    }
  }, [order.id, dispatch, onOrderChanged, isRefreshing, lastRefreshTime, order]);

  const handleOpenLocation = (e: React.MouseEvent, coordinates: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!coordinates) {
      dispatch(showWarning({ message: 'لا توجد إحداثيات متوفرة لهذا الموقع' }));
      return;
    }

    const [latitude, longitude] = coordinates.split(',').map(Number);
    openGoogleMapsApp(Number(latitude), Number(longitude));
  };

  const handleStartCostEdit = () => {
    setIsEditingCost(true);
    setCostInputValue(order.cost?.toString() || '');
  };

  const handleCostInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCostInputValue(newValue);
    
    // Check in real-time if the order can be confirmed
    const parsedCost = parseFloat(newValue);
    const validCost = !isNaN(parsedCost) && parsedCost >= 0;
    
    // Create a temporary order object with the new cost to check if it can be confirmed
    const tempOrder = {
      ...order,
      cost: validCost ? parsedCost : null
    };
    
    // Update the canConfirmOrder state
    setCanConfirmOrder(areAllRequiredFieldsFilled(tempOrder));
  };

  const handleSaveCost = async () => {
    try {
      let newCost: number | null = null;
      
      // If input is empty, set cost to null
      if (costInputValue.trim() === '') {
        newCost = null;
      } else {
        const parsedCost = parseFloat(costInputValue);
        
        if (isNaN(parsedCost) || parsedCost < 0) {
          dispatch(showError({ message: 'يرجى إدخال تكلفة صحيحة أو اتركها فارغة' }));
          return;
        }
        
        newCost = parsedCost;
      }

      // If the cost hasn't changed, just exit edit mode
      if (newCost === order.cost) {
        setIsEditingCost(false);
        return;
      }

      // Optimistically update the local state first
      const updatedOrder = {
        ...order,
        cost: newCost
      };
      
      setOrder(updatedOrder);
      
      // Update canConfirmOrder based on the new order state
      setCanConfirmOrder(areAllRequiredFieldsFilled(updatedOrder));
      
      // Exit edit mode immediately to show the updated cost
      setIsEditingCost(false);
      
      // Create updated order request
      const updatedOrderRequest: OrderRequest = {
        id: order.id!,
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: newCost,
        statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: order.distributor.id
      };
      
      // Make the API call in the background
      try {
        await axiosInstance.put(`/distributors/orders/${order.id}`, updatedOrderRequest);
        if (onOrderChanged) onOrderChanged(order.id!);
      } catch (error) {
        // If the API call fails, revert back to editing mode
        setIsEditingCost(true);
        setCostInputValue(initialOrder.cost?.toString() || '');
        // Also revert the local state
        setOrder(initialOrder);
        
        dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
      }
      
    } catch (error) {
      console.error('Error updating cost:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
    }
  };

  const handleCostKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveCost();
    } else if (e.key === 'Escape') {
      setIsEditingCost(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!order.id) return;
    
    setIsLocationLoading(true);
    
    try {
      // Get current GPS location
      const gpsLocation = await getCurrentLocation();
      
      if (!gpsLocation?.coordinates) {
        throw new Error('Could not get current location');
      }

      // Update customer location if customer and location exist
      if (order.customer?.id && order.location?.id) {
        const updatedLocation = {
          ...order.location,
          coordinates: gpsLocation.coordinates
        };
        
        // Update the location using Redux action instead of direct API call
        await dispatch(updateDistributorCustomerLocation({
          customerId: order.customer.id,
          locationId: order.location.id,
          location: {
            name: order.location.name,
            coordinates: gpsLocation.coordinates,
            address: order.location.address || ''
          }
        })).unwrap();
      }

      // Update order with new location
      const updatedOrderRequest: OrderRequest = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: order.cost,
        statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: order.distributor.id
      };

      await axiosInstance.put(`/distributors/orders/${order.id}`, updatedOrderRequest);
      
      // Update local state with new coordinates - ensure we maintain the correct types
      if (order.location) {
        const updatedOrder: OrderList = {
          ...order,
          location: {
            ...order.location,
            coordinates: gpsLocation.coordinates
          }
        };
        
        setOrder(updatedOrder);
        
        // Update canConfirmOrder based on the updated order
        setCanConfirmOrder(areAllRequiredFieldsFilled(updatedOrder));
      }
      
      if (onOrderChanged) onOrderChanged(order.id);
      
      // Show success message
      dispatch(showSuccess({ message: 'تم تحديث الموقع بنجاح' }));
      
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث الموقع. يرجى المحاولة مرة أخرى.' }));
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      // Validate order before confirming
      if (order.status === 'Confirmed') {
        return;
      }

      // Use the canConfirmOrder state for validation
      if (!canConfirmOrder) {
        let missingFields = [];
        if (!order.customer?.name?.trim()) missingFields.push('اسم العميل');
        if (!order.customer?.phone?.trim()) missingFields.push('رقم الهاتف');
        if (!order.location?.name?.trim()) missingFields.push('الموقع');
        if (order.cost === undefined || order.cost === null) missingFields.push('التكلفة');

        dispatch(showError({ message: `لا يمكن تأكيد الطلب. الحقول المطلوبة: ${missingFields.join(', ')}` }));
        return;
      }

      if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
        await axiosInstance.post(`/distributors/orders/${order.id}/confirm`);
        
        // Update local state
        const confirmedOrder = {
          ...order,
          status: 'Confirmed'
        };
        
        setOrder(confirmedOrder);
        setCanConfirmOrder(false); // Can't confirm an already confirmed order
        
        if (onOrderChanged) onOrderChanged(order.id!);
      }
    } catch (error) {
      console.error('Failed to confirm order:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.' }));
    }
  };

  return (
    <Card
      key={`order-${order.id}`}
      className={`w-full ${statusConfig.bgColor} hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-gray-100`}
      placeholder=""
      onPointerEnterCapture={null}
      onPointerLeaveCapture={null}
    >
      <CardBody 
        className="p-6"
        placeholder=""
        onPointerEnterCapture={null}
        onPointerLeaveCapture={null}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <IconButton
              icon={faEye}
              onClick={() => navigate(`/distributor/orders/view/${order.id}`)}
              color="blue"
              className="hover:bg-blue-100"
              size="md"
              title="عرض الطلب"
            />
            {order.status !== 'Confirmed' && (
              <IconButton
                icon={faPenToSquare}
                onClick={() => navigate(`/distributor/orders/edit/${order.id}`)}
                color="blue"
                className="hover:bg-blue-100"
                size="md"
                title="تعديل الطلب"
              />
            )}
            <IconButton
              icon={faSyncAlt}
              onClick={handleRefreshOrder}
              color="blue"
              className={`hover:bg-blue-100 ${isRefreshing ? 'animate-spin' : ''}`}
              size="md"
              title="تحديث الطلب"
              disabled={isRefreshing}
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm">
            <FontAwesomeIcon 
              icon={statusConfig.icon}
              className={`w-4 h-4 ${statusConfig.color}`}
            />
            <Typography 
              variant="small"
              className={`font-medium ${statusConfig.color}`}
              placeholder=""
              onPointerEnterCapture={null}
              onPointerLeaveCapture={null}
            >
              {statusConfig.label}
            </Typography>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {/* Order Number and Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-blue-gray-500" />
              <Typography 
                variant="small" 
                color="blue-gray"
                className="font-medium"
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
              >
                {order.orderNumber}
              </Typography>
            </div>
            <Typography 
              variant="small" 
              color="blue-gray"
              className="text-gray-500 font-bold"
              placeholder=""
              onPointerEnterCapture={null}
              onPointerLeaveCapture={null}
            >
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Typography>
          </div>

          {/* Customer Info */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-600" />
            <Typography 
              variant="small" 
              color="blue-gray"
              className="font-medium"
              placeholder=""
              onPointerEnterCapture={null}
              onPointerLeaveCapture={null}
            >
              {order.customer?.name}
            </Typography>
          </div>

          {/* Location Button */}
          <div className={`flex items-center gap-2 p-2 rounded-lg ${
            order.location?.coordinates 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <FontAwesomeIcon 
              icon={faLocationDot} 
              className={`w-4 h-4 ${
                order.location?.coordinates ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <div className="flex-1">
              <div
                className={`${
                  order.location?.coordinates 
                    ? 'cursor-pointer hover:underline' 
                    : ''
                }`}
                onClick={(e) => handleOpenLocation(e, order.location?.coordinates || '')}
              >
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder=""
                  onPointerEnterCapture={null}
                  onPointerLeaveCapture={null}
                >
                  {order.location?.name || 'الموقع'}
                </Typography>
              </div>
              <Typography 
                variant="small" 
                color="blue-gray"
                className={`text-xs ${
                  order.location?.coordinates ? 'text-green-600' : 'text-red-600'
                }`}
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
              >
                {order.location?.coordinates ? 'محدد (اضغط للخريطة)' : 'غير محدد'}
              </Typography>
            </div>
            <Button
              size="sm"
              color={order.location?.coordinates ? "green" : "red"}
              variant="outlined"
              onClick={handleUpdateLocation}
              disabled={isLocationLoading || order.status === 'Confirmed'}
              className={`flex items-center gap-1 ${order.location?.coordinates ? 'hidden' : ''}`}
            >
              {isLocationLoading ? (
                <div className={`animate-spin w-3 h-3 border ${
                  order.location?.coordinates 
                    ? 'border-green-500 border-t-transparent' 
                    : 'border-red-500 border-t-transparent'
                } rounded-full`}></div>
              ) : (
                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-3 h-3" />
              )}
              <span className="text-xs">تحديث</span>
            </Button>
          </div>

          {/* Cost Input */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faMoneyBill} className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <Typography 
                variant="small" 
                color="blue-gray"
                className="font-medium text-xs"
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
              >
                التكلفة
              </Typography>
              {isEditingCost ? (
                <div className="mt-1">
                  <input
                    type="number"
                    value={costInputValue}
                    onChange={handleCostInputChange}
                    onKeyDown={handleCostKeyPress}
                    onBlur={handleSaveCost}
                    className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                  onClick={handleStartCostEdit}
                >
                  <Typography 
                    variant="small" 
                    color="green"
                    className="font-bold"
                    placeholder=""
                    onPointerEnterCapture={null}
                    onPointerLeaveCapture={null}
                  >
                    {formatCurrency(order.cost)}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              color="blue"
              size="sm"
              onClick={() => handleDirectCall(order.customer?.phone || '')}
            >
              <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
              اتصال
            </Button>
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              color="green"
              size="sm"
              onClick={() => onCallCustomer(order.customer)}
            >
              <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
              واتساب
            </Button>
          </div>

          {/* Confirm Button */}
          <div className="mt-2">
            <Button
              className="w-full flex items-center justify-center gap-2"
              color={canConfirmOrder && order.status !== 'Confirmed' ? "amber" : "gray"}
              size="sm"
              onClick={handleConfirmOrder}
              disabled={order.status === 'Confirmed' || !canConfirmOrder}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
              {order.status === 'Confirmed' ? 'تم التأكيد' : 
               canConfirmOrder ? 'تأكيد الطلب' : 'بيانات ناقصة'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Use React.memo with a custom comparison function to prevent unnecessary re-renders
export default memo(StandaloneOrderCard, (prevProps, nextProps) => {
  // Only re-render if the initialOrder has changed in relevant fields
  const prevOrder = prevProps.initialOrder;
  const nextOrder = nextProps.initialOrder;
  
  // Compare relevant fields that would require a re-render
  return (
    prevOrder.status === nextOrder.status &&
    prevOrder.cost === nextOrder.cost &&
    JSON.stringify(prevOrder.location) === JSON.stringify(nextOrder.location) &&
    JSON.stringify(prevOrder.customer) === JSON.stringify(nextOrder.customer)
  );
}); 