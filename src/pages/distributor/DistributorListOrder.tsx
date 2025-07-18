import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { faPlus, faCheckDouble, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
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
import { showError, showSuccess } from '../../store/slices/notificationSlice';
import { AppDispatch } from '../../store/store';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import StandaloneOrderCard from '../../components/distributor/shared/StandaloneOrderCard';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { logout } = useAuth();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
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

  // Fetch orders only once when the component mounts
  useEffect(() => {
    if (!hasInitiallyFetched.current && !initialized) {
      console.log('Initial fetch of orders...');
      fetchOrders();
      hasInitiallyFetched.current = true;
    }
  }, [fetchOrders, initialized]);

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
            <div>
              <Typography 
                variant="h5" 
                color="blue-gray"
                placeholder=""
                onPointerEnterCapture={null}
                onPointerLeaveCapture={null}
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
          onPointerEnterCapture={null}
          onPointerLeaveCapture={null}
        >
          <div className="space-y-6">
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