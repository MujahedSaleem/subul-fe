import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faPlus, faCheckDouble, faRightFromBracket, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import CallModal from '../../components/admin/shared/CallModal';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Customer } from '../../types/customer';
import axiosInstance from '../../utils/axiosInstance';
import { useDispatch } from 'react-redux';
import { showError, showSuccess, showInfo } from '../../store/slices/notificationSlice';
import { AppDispatch } from '../../store/store';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import StandaloneOrderCard from '../../components/distributor/shared/StandaloneOrderCard';
import { OrderList } from '../../types/order';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { logout } = useAuth();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStartY, setRefreshStartY] = useState(0);
  const [refreshDistance, setRefreshDistance] = useState(0);
  const refreshThreshold = 100; // pixels to pull down before triggering refresh
  const contentRef = useRef<HTMLDivElement>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousOrdersRef = useRef<OrderList[]>([]);
  
  // Flag to track if orders have been fetched
  const hasInitiallyFetched = useRef(false);

  // Use Redux directly, but the StandaloneOrderCard will handle its own state
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    initialized
  } = useDistributorOrders();

  // Store previous orders for comparison
  useEffect(() => {
    if (orders && orders.length > 0) {
      previousOrdersRef.current = orders;
    }
  }, [orders]);

  // Fetch orders only once when the component mounts
  useEffect(() => {
    if (!hasInitiallyFetched.current && !initialized) {
      console.log('Initial fetch of orders...');
      fetchOrders();
      hasInitiallyFetched.current = true;
    }
  }, [fetchOrders, initialized]);

  // Check if orders have changed
  const haveOrdersChanged = (newOrders: OrderList[], oldOrders: OrderList[]): boolean => {
    if (newOrders.length !== oldOrders.length) return true;
    
    // Create a map of old orders by ID for quick lookup
    const oldOrdersMap = new Map(oldOrders.map(order => [order.id, order]));
    
    // Check if any order has changed
    for (const newOrder of newOrders) {
      const oldOrder = oldOrdersMap.get(newOrder.id);
      if (!oldOrder) return true;
      
      // Compare relevant fields that would require a re-render
      if (
        newOrder.status !== oldOrder.status ||
        newOrder.cost !== oldOrder.cost ||
        JSON.stringify(newOrder.location) !== JSON.stringify(oldOrder.location) ||
        JSON.stringify(newOrder.customer) !== JSON.stringify(oldOrder.customer)
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Custom fetch function that only updates state if data has changed
  const fetchOrdersIfChanged = useCallback(async (forceRefresh = false) => {
    try {
      // Direct API call to check for changes without updating state
      const response = await axiosInstance.get('/distributors/orders');
      const newOrders = response.data.data;
      
      // Compare with previous orders
      if (forceRefresh || haveOrdersChanged(newOrders, previousOrdersRef.current)) {
        console.log('Orders have changed, updating state...');
        // Use the Redux action to update state
        await fetchOrders(true);
        return true; // Data changed
      } else {
        console.log('No changes in orders, skipping re-render');
        return false; // No changes
      }
    } catch (error) {
      console.error('Error checking for order changes:', error);
      return false;
    }
  }, [fetchOrders]);

  // Setup auto-refresh interval (every 5 seconds)
  useEffect(() => {
    // Start the auto-refresh interval
    autoRefreshIntervalRef.current = setInterval(async () => {
      console.log('Auto-refreshing orders...');
      await fetchOrdersIfChanged();
    }, 5000);
    
    // Clean up interval on component unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [fetchOrdersIfChanged]);

  // Handle force refresh when navigating from order creation
  useEffect(() => {
    if (location.state?.forceRefresh) {
      console.log('Force refreshing orders after creation...');
      fetchOrders(true); // Force refresh
      // Clear the state to prevent repeated refreshes
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, fetchOrders, navigate]);

  const handleCallCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCallModalOpen(true);
  };

  const handleOrderChanged = (orderId: number) => {
    // This is just a notification that an order was changed
    // We don't need to do anything as each card manages its own state
    console.log(`Order ${orderId} was updated`);
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

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    try {
      const hasChanged = await fetchOrdersIfChanged(true);
      
      if (hasChanged) {
        dispatch(showSuccess({ message: 'تم تحديث الطلبات', duration: 2000 }));
      } else {
        dispatch(showInfo({ message: 'الطلبات محدثة بالفعل', duration: 2000 }));
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
      dispatch(showError({ message: 'حدث خطأ أثناء تحديث الطلبات' }));
    } finally {
      setIsRefreshing(false);
      setRefreshDistance(0);
    }
  }, [fetchOrdersIfChanged, dispatch, isRefreshing, isLoading]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY === 0) {
      setRefreshStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (refreshStartY === 0 || isRefreshing || isLoading) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - refreshStartY;
    
    // Only allow pulling down
    if (distance > 0) {
      // Apply resistance to make the pull feel natural
      const resistance = 0.4;
      setRefreshDistance(distance * resistance);
    }
  };

  const handleTouchEnd = () => {
    if (refreshDistance > refreshThreshold && !isRefreshing && !isLoading) {
      handleRefresh();
    } else {
      setRefreshDistance(0);
    }
    setRefreshStartY(0);
  };

  return (
    <Layout title='قائمة الطلبيات'>
      <Card 
        className="h-full w-full"
        placeholder=""
        onPointerEnterCapture={null}
        onPointerLeaveCapture={null}
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none"
          placeholder=""
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Typography 
                variant="h5" 
                color="blue-gray"
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
              >
                الطلبات
              </Typography>
              <Button
                className="flex items-center justify-center gap-2 font-medium"
                size="sm"
                color="blue"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
              >
                <FontAwesomeIcon 
                  icon={faSyncAlt} 
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
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
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          {/* Pull-to-refresh indicator */}
          {refreshDistance > 0 && (
            <div 
              className="flex justify-center items-center"
              style={{ 
                height: `${refreshDistance}px`, 
                marginTop: `-${refreshDistance}px`, 
                marginBottom: '10px',
                transition: refreshDistance > refreshThreshold || isRefreshing ? 'none' : 'height 0.2s ease'
              }}
            >
              <FontAwesomeIcon 
                icon={faSyncAlt} 
                className={`text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} 
                style={{ 
                  transform: `rotate(${refreshDistance * 2}deg)`,
                  opacity: Math.min(refreshDistance / refreshThreshold, 1)
                }} 
              />
              <span className="ml-2 text-sm text-blue-500">
                {refreshDistance > refreshThreshold ? 'حرر للتحديث' : 'اسحب للتحديث'}
              </span>
            </div>
          )}
          
          <div 
            className="space-y-6"
            ref={contentRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">حدث خطأ أثناء تحميل الطلبات</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <StandaloneOrderCard
                      key={order.id}
                      initialOrder={order}
                      onCallCustomer={handleCallCustomer}
                      onOrderChanged={handleOrderChanged}
                    />
                  ))
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
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
              >
                إنهاء الوردية
              </Typography>
              
              <Typography 
                variant="paragraph" 
                color="blue-gray" 
                className="mb-6 text-gray-600"
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
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

// Use memo to prevent unnecessary re-renders
export default memo(DistributorListOrder);