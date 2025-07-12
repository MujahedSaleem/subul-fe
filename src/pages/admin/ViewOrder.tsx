import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../../components/Layout';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLocationDot, 
  faMoneyBill, 
  faCalendar, 
  faPhone,
  faArrowLeft,
  faCheckCircle,
  faBarcode,
  faUserTie,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/Button';
import { OrderList } from '../../types/order';
import { useError } from '../../context/ErrorContext';
import { getOrderById, clearCurrentOrder } from '../../store/slices/orderSlice';
import type { AppDispatch, RootState } from '../../store/store';

const ViewOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reduxDispatch = useDispatch<AppDispatch>();
  const { dispatch: errorDispatch } = useError();
  
  const { currentOrder, isLoading, error: reduxError } = useSelector((state: RootState) => state.orders);
  
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLocalError(null);
        
        if (!id) {
          const errorMsg = 'Order ID is missing';
          console.error(errorMsg);
          setLocalError(errorMsg);
          errorDispatch({ type: 'SET_ERROR', payload: errorMsg });
          return;
        }

        // Clear previous order data
        reduxDispatch(clearCurrentOrder());
        
        // Fetch the specific order
        await reduxDispatch(getOrderById(Number(id))).unwrap();
      } catch (error: any) {
        console.error('Error in fetchData:', error);
        const errorMsg = error.message || 'Failed to fetch order details';
        setLocalError(errorMsg);
        errorDispatch({ type: 'SET_ERROR', payload: errorMsg });
      }
    };

    fetchData();
  }, [id, reduxDispatch, errorDispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reduxDispatch(clearCurrentOrder());
    };
  }, [reduxDispatch]);

  // Debug render
  

  const formatDate = (date: string): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS' }).format(amount);
  };

  if (isLoading) {
    return (
      <Layout title="تفاصيل الطلب">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <Typography 
              variant="h6" 
              color="blue-gray"
              className="text-center"
              placeholder=""
              
              
            >
              جاري تحميل البيانات...
            </Typography>
          </div>
        </div>
      </Layout>
    );
  }

  const error = localError || reduxError;
  const order = currentOrder;

  if (error || !order) {
    return (
      <Layout title="تفاصيل الطلب">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Typography 
              variant="h6" 
              color="blue-gray"
              className="mb-2"
              placeholder=""
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              {error || 'لم يتم العثور على الطلب'}
            </Typography>
            <Button
              variant="text"
              color="blue"
              onClick={() => navigate('/admin/orders')}
              className="mt-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 ml-2" />
              العودة إلى قائمة الطلبات
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="تفاصيل الطلب">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="text"
            color="blue"
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
            العودة إلى قائمة الطلبات
          </Button>
        </div>

        <Card 
          className="w-full"
          placeholder=""
          
          
        >
          <CardHeader
            className={`p-4 ${
              order.status === 'Confirmed'
                ? 'bg-gradient-to-r from-green-50 to-green-100'
                : 'bg-gradient-to-r from-blue-50 to-blue-100'
            }`}
            placeholder=""
            
            
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Typography
                  variant="h5"
                  color="blue-gray"
                  className="font-bold"
                  placeholder=""
                  
                  
                >
                  تفاصيل الطلب #{order.orderNumber}
                </Typography>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'Confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <FontAwesomeIcon icon={order.status === 'Confirmed' ? faCheckCircle : faClock} className="w-4 h-4" />
                  {order.status === 'Confirmed' ? 'مؤكد' : 'جديد'}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody 
            className="p-6 space-y-6"
            placeholder=""
            
            
          >
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Typography
                  variant="h6"
                  color="blue-gray"
                  className="font-bold mb-3"
                  placeholder=""
                  
                  
                >
                  معلومات الطلب
                </Typography>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faBarcode} className="w-5 h-5 text-blue-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        رقم الطلب
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {order.orderNumber}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCalendar} className="w-5 h-5 text-blue-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        تاريخ الإنشاء
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {formatDate(order.createdAt)}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faMoneyBill} className="w-5 h-5 text-purple-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        التكلفة
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {formatCurrency(order.cost)}
                      </Typography>
                    </div>
                  </div>

                  {order.confirmedAt && (
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-5 h-5 text-green-600" />
                      <div>
                        <Typography
                          variant="small"
                          className="text-gray-600"
                        >
                          تاريخ التأكيد
                        </Typography>
                        <Typography
                          variant="paragraph"
                          className="font-medium"
                        >
                          {formatDate(order.confirmedAt)}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Typography
                  variant="h6"
                  color="blue-gray"
                  className="font-bold mb-3"
                >
                  معلومات العميل
                </Typography>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        اسم العميل
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {order.customer?.name}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faPhone} className="w-5 h-5 text-blue-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        رقم الهاتف
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {order.customer?.phone}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faLocationDot} className="w-5 h-5 text-green-600" />
                    <div>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        الموقع
                      </Typography>
                      <Typography
                        variant="paragraph"
                        className="font-medium"
                      >
                        {order.location?.name}
                      </Typography>
                      <Typography
                        variant="small"
                        className="text-gray-600"
                      >
                        {order.location?.coordinates}
                      </Typography>
                    </div>
                  </div>

                  {order.distributor && (
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faUserTie} className="w-5 h-5 text-blue-600" />
                      <div>
                        <Typography
                          variant="small"
                          className="text-gray-600"
                        >
                          الموزع
                        </Typography>
                        <Typography
                          variant="paragraph"
                          className="font-medium"
                          placeholder=""
                          
                          
                        >
                          {order.distributor.name}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};

export default ViewOrder; 