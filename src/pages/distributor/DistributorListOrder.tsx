import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faPlus, faCheckDouble, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faHourglassHalf, faCircleCheck, faPencil, faMapMarkerAlt, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import CallModal from '../../components/admin/shared/CallModal';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import { useDistributorCustomers } from '../../hooks/useDistributorCustomers';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { OrderList, OrderRequest } from '../../types/order';
import { Customer, Location } from '../../types/customer';
import axiosInstance from '../../utils/axiosInstance';
import { getOrderStatusConfig, formatCurrency, handleDirectCall, handleOpenLocation, areAllRequiredFieldsFilled } from '../../utils/distributorUtils';
import { getCurrentLocation } from '../../services/locationService';
import { useDispatch } from 'react-redux';
import { showError, showSuccess, showWarning } from '../../store/slices/notificationSlice';
import { AppDispatch } from '../../store/store';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { logout } = useAuth();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [locationLoadingStates, setLocationLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [costEditingStates, setCostEditingStates] = useState<{ [key: number]: boolean }>({});
  const [costInputValues, setCostInputValues] = useState<{ [key: number]: string }>({});

  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    confirmOrder,
    updateOrder,
  } = useDistributorOrders();

  const { updateCustomerLocation } = useDistributorCustomers();

  useEffect(() => {
    console.log('Fetching orders...');
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    console.log('Orders updated:', orders);
  }, [orders]);

  // Handle force refresh when navigating from order creation
  useEffect(() => {
    if (location.state?.forceRefresh) {
      console.log('Force refreshing orders after creation...');
      fetchOrders(true); // Force refresh
      // Clear the state to prevent repeated refreshes
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, fetchOrders, navigate]);

  const handleConfirmOrder = async (order: OrderList) => {
    try {
      // Validate order before confirming
      if (order.status === 'Confirmed') {
        return;
      }

      // Use comprehensive validation logic
      if (!areAllRequiredFieldsFilled(order)) {
        let missingFields = [];
        if (!order.customer?.name?.trim()) missingFields.push('اسم العميل');
        if (!order.customer?.phone?.trim()) missingFields.push('رقم الهاتف');
        if (!order.location?.name?.trim()) missingFields.push('الموقع');
        if (order.cost === undefined || order.cost === null) missingFields.push('التكلفة');

        dispatch(showError({ message: `لا يمكن تأكيد الطلب. الحقول المطلوبة: ${missingFields.join(', ')}` }));
        return;
      }

      if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
        await confirmOrder(order.id as number);
        // The hook automatically refreshes the orders list after confirmation
      }
    } catch (error) {
      console.error('Failed to confirm order:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.' }));
    }
  };

  const handleCallCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCallModalOpen(true);
  };

  const handleUpdateLocation = async (order: OrderList) => {
    if (!order.id) return;
    
    setLocationLoadingStates(prev => ({ ...prev, [order.id!]: true }));
    
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
        
        await updateCustomerLocation(order.customer.id, updatedLocation);
      }

      // Update order location
      const updatedOrderRequest: OrderRequest = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: order.cost,
        statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: order.distributor.id
      };

      await updateOrder(updatedOrderRequest);
      
      // Refresh orders to show updated location
      await fetchOrders();
      
    } catch (error) {
      console.error('Error updating location:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث الموقع. يرجى المحاولة مرة أخرى.' }));
    } finally {
      setLocationLoadingStates(prev => ({ ...prev, [order.id!]: false }));
    }
  };

  const handleStartCostEdit = (order: OrderList) => {
    if (!order.id) return;
    
    setCostEditingStates(prev => ({ ...prev, [order.id!]: true }));
    setCostInputValues(prev => ({ 
      ...prev, 
      [order.id!]: order.cost ? order.cost.toString() : '' 
    }));
  };

  const handleCancelCostEdit = (order: OrderList) => {
    if (!order.id) return;
    
    setCostEditingStates(prev => ({ ...prev, [order.id!]: false }));
    setCostInputValues(prev => ({ ...prev, [order.id!]: '' }));
  };

  const handleSaveCost = async (order: OrderList) => {
    if (!order.id) return;
    
    try {
      const inputValue = costInputValues[order.id] || '';
      let newCost: number | null = null;
      
      // If input is empty, set cost to null
      if (inputValue.trim() === '') {
        newCost = null;
      } else {
        const parsedCost = parseFloat(inputValue);
        
        if (isNaN(parsedCost) || parsedCost < 0) {
          dispatch(showError({ message: 'يرجى إدخال تكلفة صحيحة أو اتركها فارغة' }));
          return;
        }
        
        newCost = parsedCost;
      }

      const updatedOrderRequest: OrderRequest = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: parseInt(order.customer.id),
        locationId: order.location?.id,
        cost: newCost,
        statusString: order.status as 'New' | 'Pending' | 'Confirmed' | 'Draft',
        distributorId: order.distributor.id
      };

      await updateOrder(updatedOrderRequest);
      
      // Refresh orders to show updated cost
      await fetchOrders();
      
      // Exit edit mode
      setCostEditingStates(prev => ({ ...prev, [order.id!]: false }));
      setCostInputValues(prev => ({ ...prev, [order.id!]: '' }));
      
    } catch (error) {
      console.error('Error updating cost:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث التكلفة. يرجى المحاولة مرة أخرى.' }));
    }
  };

  const handleCostKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, order: OrderList) => {
    if (e.key === 'Enter') {
      handleSaveCost(order);
    } else if (e.key === 'Escape') {
      handleCancelCostEdit(order);
    }
  };

  // New handler for blur event (clicking outside the input)
  const handleCostBlur = (order: OrderList) => {
    handleSaveCost(order);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCloseShift = () => {
    const pendingOrders = orders.filter(order => order.status !== 'Confirmed');
    
    if (pendingOrders.length > 0) {
      dispatch(showError({ message: `لا يمكن إنهاء الوردية. يوجد ${pendingOrders.length} طلب غير مؤكد. يرجى تأكيد جميع الطلبات أولاً.` }));
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmCloseShift = async () => {
    setIsClosingShift(true);
    setShowConfirmDialog(false);
    
    try {
      await axiosInstance.post('/distributors/deactivate');
      
      // Show success message
      dispatch(showSuccess({ message: 'تم إنهاء الوردية بنجاح.' }));
      
      // Logout and redirect
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deactivating account:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء إنهاء الوردية. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.' }));
      setIsClosingShift(false);
    }
  };

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

  return (
    <Layout title='قائمة الطلبيات'>
      <Card 
        className="h-full w-full"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Typography 
                variant="h5" 
                color="blue-gray"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                الطلبات
              </Typography>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-max gap-2">
              {/* Primary Action */}
              <Button
                className="flex items-center justify-center gap-2 font-medium"
                size="sm"
                onClick={() => navigate('/distributor/orders/add')}
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                <span className="hidden sm:inline">إضافة طلب</span>
                <span className="sm:hidden">طلب جديد</span>
              </Button>
              
              {/* Secondary Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex items-center justify-center gap-2 font-medium"
                  size="sm"
                  color="green"
                  onClick={handleCloseShift}
                  disabled={isClosingShift || isLoading}
                >
                  {isClosingShift ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span className="hidden sm:inline">جاري الإنهاء...</span>
                      <span className="sm:hidden">إنهاء...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckDouble} className="h-4 w-4" />
                      <span className="hidden sm:inline">إنهاء الوردية</span>
                      <span className="sm:hidden">إنهاء</span>
                    </>
                  )}
                </Button>
                
                <Button
                  className="flex items-center justify-center gap-2 font-medium"
                  size="sm"
                  color="red"
                  onClick={handleLogout}
                  disabled={isClosingShift}
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
                  <span className="hidden sm:inline">خروج</span>
                  <span className="sm:hidden">خروج</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody 
          className="p-6"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="space-y-6">
          {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">حدث خطأ أثناء تحميل الطلبات</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders && orders.length > 0 ? (
                  orders.map((order) => {
                    const statusConfig = getOrderStatusConfig(order.status);
                    
                    return (
                      <Card
                        key={order.id}
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
                                <>
                                  <IconButton
                                    icon={faPenToSquare}
                                    onClick={() => navigate(`/distributor/orders/edit/${order.id}`)}
                                    color="blue"
                                    className="hover:bg-blue-100"
                                    size="md"
                                    title="تعديل الطلب"
                                  />
                                  
                                </>
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
                                    onPointerEnterCapture={() => {}}
                                    onPointerLeaveCapture={() => {}}
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
                                  onPointerEnterCapture={() => {}}
                                  onPointerLeaveCapture={() => {}}
                                >
                                  {order.location?.coordinates ? 'محدد (اضغط للخريطة)' : 'غير محدد'}
                                </Typography>
                              </div>
                              <Button
                                size="sm"
                                color={order.location?.coordinates ? "green" : "red"}
                                variant="outlined"
                                onClick={() => handleUpdateLocation(order)}
                                disabled={locationLoadingStates[order.id] || order.status === 'Confirmed'}
                                className={`flex items-center gap-1 ${order.location?.coordinates ? 'hidden' : ''}`}
                              >
                                {locationLoadingStates[order.id] ? (
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
                                  onPointerEnterCapture={() => {}}
                                  onPointerLeaveCapture={() => {}}
                                >
                                  التكلفة
                                </Typography>
                                {costEditingStates[order.id] ? (
                                  <div className="mt-1">
                                    <input
                                      type="number"
                                      value={costInputValues[order.id] || ''}
                                      onChange={(e) => setCostInputValues(prev => ({
                                        ...prev,
                                        [order.id]: e.target.value
                                      }))}
                                      onKeyDown={(e) => handleCostKeyPress(e, order)}
                                      onBlur={() => handleCostBlur(order)}
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
                                    onClick={() => handleStartCostEdit(order)}
                                  >
                                    <Typography 
                                      variant="small" 
                                      color="green"
                                      className="font-bold"
                                      placeholder=""
                                      onPointerEnterCapture={() => {}}
                                      onPointerLeaveCapture={() => {}}
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
                                onClick={() => handleCallCustomer(order.customer)}
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
                                onClick={() => handleConfirmOrder(order)}
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
                  })
                ) : (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    لا توجد طلبات حالية
                  </div>
          )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        phone={selectedCustomer?.phone || ''}
      />

      {/* Professional Close Shift Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <FontAwesomeIcon icon={faCheckDouble} className="w-6 h-6 text-orange-600" />
              </div>
              
              <Typography 
                variant="h5" 
                color="blue-gray" 
                className="mb-2 font-bold"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                إنهاء الوردية
              </Typography>
              
              <Typography 
                variant="paragraph" 
                color="blue-gray" 
                className="mb-6 text-gray-600"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                هل أنت متأكد من إنهاء الوردية؟ سيتم تسجيل خروجك من النظام تلقائياً وإنهاء جميع العمليات النشطة.
              </Typography>
              
              <div className="flex gap-3 justify-center">
                <Button
                  color="red"
                  onClick={confirmCloseShift}
                  disabled={isClosingShift}
                  className="flex items-center gap-2"
                >
                  {isClosingShift ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      جاري الإنهاء...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckDouble} className="w-4 h-4" />
                      تأكيد الإنهاء
                    </>
                  )}
                </Button>
                <Button
                  variant="outlined"
                  color="gray"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isClosingShift}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </Layout>
  );
};

export default DistributorListOrder;