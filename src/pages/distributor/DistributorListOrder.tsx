import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus, faCheckDouble, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faHourglassHalf, faCircleCheck, faPencil } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import CallModal from '../../components/admin/shared/CallModal';
import { useError } from '../../context/ErrorContext';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { OrderList } from '../../types/order';
import { Customer, Location } from '../../types/customer';
import axiosInstance from '../../utils/axiosInstance';
import { getOrderStatusConfig, formatCurrency, handleDirectCall, handleOpenLocation } from '../../utils/distributorUtils';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError();
  const { logout } = useAuth();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    confirmOrder,
    deleteOrder
  } = useDistributorOrders();

  useEffect(() => {
    console.log('Fetching orders...');
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    console.log('Orders updated:', orders);
  }, [orders]);

  const handleConfirmOrder = async (order: OrderList) => {
    try {
      // Validate order before confirming
      if (order.status === 'Confirmed') {
        return;
      }
      if (!order?.customer?.id || !order.cost) {
        alert('Cannot confirm order. Customer data or cost is incomplete.');
      return;
    }
      if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
        await confirmOrder(order.id);
      }
      } catch (error) {
      console.error('Failed to confirm order:', error);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      await deleteOrder(orderId);
    } catch (error) {
      console.error('Failed to delete order:', error);
    }
  };

  const handleCallCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCallModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCloseShift = () => {
    const pendingOrders = orders.filter(order => order.status !== 'Confirmed');
    
    if (pendingOrders.length > 0) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `لا يمكن إنهاء الوردية. يوجد ${pendingOrders.length} طلب غير مؤكد. يرجى تأكيد جميع الطلبات أولاً.` 
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmCloseShift = async () => {
    setIsClosingShift(true);
    setShowConfirmDialog(false);
    
    try {
      await axiosInstance.post('/distributors/deactivate');
      
      // Clear any existing errors and logout
      dispatch({ type: 'CLEAR_ERROR' });
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deactivating account:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'حدث خطأ أثناء إنهاء الوردية. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.' 
      });
      setIsClosingShift(false);
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
                                  <IconButton
                                    icon={faTrash}
                                    onClick={() => handleDeleteOrder(order.id)}
                                    color="red"
                                    className="hover:bg-red-100"
                                    size="md"
                                    title="حذف الطلب"
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
                                {new Date(order.createdAt).toLocaleDateString('ar-SA', {
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

                            {/* Location Info */}
                            <div 
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleOpenLocation(order.location)}
                            >
                              <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-blue-600" />
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

                            {/* Cost */}
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faMoneyBill} className="w-4 h-4 text-green-600" />
                                <Typography 
                                  variant="small" 
                                  color="blue-gray"
                                  className="font-medium"
                                  placeholder=""
                                  onPointerEnterCapture={() => {}}
                                  onPointerLeaveCapture={() => {}}
                                >
                                  التكلفة
                                </Typography>
                              </div>
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
                                color="amber"
                                size="sm"
                                onClick={() => handleConfirmOrder(order)}
                                disabled={order.status === 'Confirmed'}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                                {order.status === 'Confirmed' ? 'تم التأكيد' : 'تأكيد الطلب'}
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