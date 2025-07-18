import React, { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faMapMarkerAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { OrderList, OrderRequest } from '../../../types/order';
import { Customer } from '../../../types/customer';
import Button from '../../../components/Button';
import IconButton from '../../../components/IconButton';
import { getOrderStatusConfig, formatCurrency, handleDirectCall, areAllRequiredFieldsFilled } from '../../../utils/distributorUtils';
import { useAppDispatch } from '../../../store/hooks';
import { showWarning, showError } from '../../../store/slices/notificationSlice';

interface OrderCardProps {
  order: OrderList;
  onCallCustomer: (customer: Customer) => void;
  onConfirmOrder: (order: OrderList) => Promise<boolean>;
  onUpdateLocation: (order: OrderList) => Promise<boolean>;
  onUpdateOrder: (order: OrderRequest) => Promise<boolean>;
  locationLoadingStates: { [key: number]: boolean };
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onCallCustomer,
  onConfirmOrder,
  onUpdateLocation,
  onUpdateOrder,
  locationLoadingStates
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [costInputValue, setCostInputValue] = useState(order.cost?.toString() || '');
  const [localOrder, setLocalOrder] = useState(order);
  
  // Use the merged order data (local state overrides props)
  const displayOrder = {
    ...order,
    ...localOrder
  };
  
  const statusConfig = getOrderStatusConfig(displayOrder.status);

  const handleOpenLocation = (e: React.MouseEvent, coordinates: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!coordinates) {
      dispatch(showWarning({ message: 'لا توجد إحداثيات متوفرة لهذا الموقع' }));
      return;
    }

    const [latitude, longitude] = coordinates.split(',').map(Number);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      // For mobile, use geo: protocol for better app integration
      const googleMapsUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      window.location.href = googleMapsUrl;
    } else {
      // For desktop, open in navigation/driving mode
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleStartCostEdit = () => {
    setIsEditingCost(true);
    setCostInputValue(order.cost?.toString() || '');
  };

  const handleCancelCostEdit = () => {
    setIsEditingCost(false);
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
      if (newCost === displayOrder.cost) {
        setIsEditingCost(false);
        return;
      }

      // Optimistically update the local state first
      setLocalOrder({
        ...localOrder,
        cost: newCost
      });
      
      // Exit edit mode immediately to show the updated cost
      setIsEditingCost(false);
      
      // Create updated order request
      const updatedOrderRequest: OrderRequest = {
        id: displayOrder.id!,
        orderNumber: displayOrder.orderNumber,
        customerId: parseInt(displayOrder.customer.id),
        locationId: displayOrder.location?.id,
        cost: newCost,
        statusString: displayOrder.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: displayOrder.distributor.id
      };
      
      // Make the API call in the background
      onUpdateOrder(updatedOrderRequest).catch(() => {
        // If the API call fails, revert back to editing mode
        setIsEditingCost(true);
        setCostInputValue(order.cost?.toString() || '');
        // Also revert the local state
        setLocalOrder({
          ...localOrder,
          cost: order.cost
        });
        
        dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
      });
      
    } catch (error) {
      console.error('Error updating cost:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
    }
  };

  const handleCostKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveCost();
    } else if (e.key === 'Escape') {
      handleCancelCostEdit();
    }
  };

  const handleUpdateLocationClick = useCallback(async () => {
    try {
      // Call the parent's update location function
      onUpdateLocation(displayOrder);
      
      // We don't know the new coordinates yet, but we can show a loading state
      // The parent component will handle the actual update and loading state
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [displayOrder, onUpdateLocation]);

  // Update local state when props change (but only for specific properties)
  React.useEffect(() => {
    // Only update if the location coordinates have changed
    if (order.location?.coordinates !== localOrder.location?.coordinates) {
      setLocalOrder(prev => ({
        ...prev,
        location: order.location
      }));
    }
    
    // Only update if the cost has changed
    if (order.cost !== localOrder.cost) {
      setLocalOrder(prev => ({
        ...prev,
        cost: order.cost
      }));
    }
  }, [order.location?.coordinates, order.cost]);

  return (
    <Card
      key={displayOrder.id}
      className={`w-full ${statusConfig.bgColor} hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-gray-100`}
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <CardBody 
        className="p-6"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
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
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
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
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                {order.orderNumber}
              </Typography>
            </div>
            <Typography 
              variant="small" 
              color="blue-gray"
              className="text-gray-500 font-bold"
              placeholder=""
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
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
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              {order.customer?.name}
            </Typography>
          </div>

          {/* Location Button */}
          <div className={`flex items-center gap-2 p-2 rounded-lg ${
            displayOrder.location?.coordinates 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <FontAwesomeIcon 
              icon={faLocationDot} 
              className={`w-4 h-4 ${
                displayOrder.location?.coordinates ? 'text-green-600' : 'text-red-600'
              }`} 
            />
            <div className="flex-1">
              <div
                className={`${
                  displayOrder.location?.coordinates 
                    ? 'cursor-pointer hover:underline' 
                    : ''
                }`}
                onClick={(e) => handleOpenLocation(e, displayOrder.location?.coordinates || '')}
              >
                <Typography 
                  variant="small" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder=""
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                >
                  {displayOrder.location?.name || 'الموقع'}
                </Typography>
              </div>
              <Typography 
                variant="small" 
                color="blue-gray"
                className={`text-xs ${
                  displayOrder.location?.coordinates ? 'text-green-600' : 'text-red-600'
                }`}
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                {displayOrder.location?.coordinates ? 'محدد (اضغط للخريطة)' : 'غير محدد'}
              </Typography>
            </div>
            <Button
              size="sm"
              color={displayOrder.location?.coordinates ? "green" : "red"}
              variant="outlined"
              onClick={handleUpdateLocationClick}
              disabled={locationLoadingStates[displayOrder.id!] || displayOrder.status === 'Confirmed'}
              className={`flex items-center gap-1 ${displayOrder.location?.coordinates ? 'hidden' : ''}`}
            >
              {locationLoadingStates[displayOrder.id!] ? (
                <div className={`animate-spin w-3 h-3 border ${
                  displayOrder.location?.coordinates 
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
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                التكلفة
              </Typography>
              {isEditingCost ? (
                <div className="mt-1">
                  <input
                    type="number"
                    value={costInputValue}
                    onChange={(e) => setCostInputValue(e.target.value)}
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
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                  >
                    {formatCurrency(displayOrder.cost)}
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
              color={areAllRequiredFieldsFilled(order) && order.status !== 'Confirmed' ? "amber" : "gray"}
              size="sm"
              onClick={() => onConfirmOrder(order)}
              disabled={order.status === 'Confirmed' || !areAllRequiredFieldsFilled(order)}
            >
              <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
              {order.status === 'Confirmed' ? 'تم التأكيد' : 
               areAllRequiredFieldsFilled(order) ? 'تأكيد الطلب' : 'بيانات ناقصة'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(OrderCard, (prevProps, nextProps) => {
  // Only re-render if these specific properties change
  const prevOrder = prevProps.order;
  const nextOrder = nextProps.order;
  
  // Always re-render if the loading state changes
  if (prevProps.locationLoadingStates[prevOrder.id!] !== nextProps.locationLoadingStates[nextOrder.id!]) {
    return false; // Different loading state, should re-render
  }
  
  // Compare only the properties we care about
  const isSameId = prevOrder.id === nextOrder.id;
  const isSameStatus = prevOrder.status === nextOrder.status;
  
  // These properties are handled by local state, so we don't need to re-render
  // when they change in props (our useEffect will handle the local state update)
  
  // Return true if everything is the same (no re-render needed)
  return isSameId && isSameStatus;
}); 