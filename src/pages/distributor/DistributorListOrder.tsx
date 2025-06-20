import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faCircleCheck, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faHourglassHalf, faPencil } from '@fortawesome/free-solid-svg-icons';
import CallModal from '../../components/admin/shared/CallModal';
import { useError } from '../../context/ErrorContext';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { OrderList } from '../../types/order';
import { Customer, Location } from '../../types/customer';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError();
  const { logout } = useAuth();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  const handleOpenLocation = (location: Location) => {
    if (location.coordinates) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${location.coordinates}`, '_blank');
      }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return {
          icon: faCheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'تم التأكيد'
        };
      case 'Pending':
        return {
          icon: faHourglassHalf,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          label: 'قيد الانتظار'
        };
      case 'New':
        return {
          icon: faCircleCheck,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'جديد'
        };
      case 'Draft':
        return {
          icon: faPencil,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: 'مسودة'
        };
      default:
        return {
          icon: faCircleCheck,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: status
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'ILS' });
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
            <div className="flex w-full shrink-0 gap-2 md:w-max">
              <Button
                className="flex items-center gap-3"
                size="sm"
                onClick={() => navigate('/distributor/orders/add')}
              >
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" /> إضافة طلب
              </Button>
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
                    const statusConfig = getStatusConfig(order.status);
                    
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
                                onClick={() => handleCallCustomer(order.customer)}
                              >
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                                اتصال
                              </Button>
                              <Button
                                className="flex-1 flex items-center justify-center gap-2"
                                color="green"
                                size="sm"
                                onClick={() => handleConfirmOrder(order)}
                                disabled={order.status === 'Confirmed'}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4" />
                                تأكيد
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
      </Layout>
  );
};

export default DistributorListOrder;