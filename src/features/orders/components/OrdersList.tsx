import React from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { OrderList } from '../../../types/order';
import { Customer, Location as CustomerLocation } from '../../../types/customer';
import { Distributor } from '../../../types/distributor';
import PageLayout from '../../../components/admin/shared/PageLayout';
import OrderFilter from '../../../components/OrderFilters';
import OrderTable from '../../../components/OrderTable';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchOrders, deleteOrder, confirmOrder } from '../../../store/slices/orderSlice';
import { fetchActiveDistributors, selectActiveDistributors, selectIsLoading as selectDistributorsLoading } from '../../../store/slices/distributorSlice';
import { showSuccess, showError, showWarning } from '../../../store/slices/notificationSlice';
import { RootState } from '../../../store/store';

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedDistributor, setSelectedDistributor] = React.useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  // Redux selectors
  const orders = useAppSelector((state: RootState) => state.orders.orders);
  const isLoading = useAppSelector((state: RootState) => state.orders.isLoading);
  const error = useAppSelector((state: RootState) => state.orders.error);
  const activeDistributors = useAppSelector(selectActiveDistributors);
  const distributorsLoading = useAppSelector(selectDistributorsLoading);

  React.useEffect(() => {
    // Fetch orders and active distributors
    dispatch(fetchOrders({}));
    dispatch(fetchActiveDistributors());
  }, [dispatch]);

  const handleAddOrder = () => {
    navigate('/admin/orders/add');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        await dispatch(deleteOrder(id.toString())).unwrap();
        // Refresh orders after deletion
        dispatch(fetchOrders({}));
        dispatch(showSuccess({ message: 'تم حذف الطلب بنجاح' }));
      } catch (error: any) {
        console.error('Failed to delete order:', error);
        dispatch(showError({ 
          message: error.message || 'فشل في حذف الطلب',
          title: 'خطأ في الحذف'
        }));
      }
    }
  };

  const handleConfirmOrder = async (order: OrderList) => {
    if (order.status === 'Confirmed') return;
    if (!order?.customer?.id || order.cost === undefined || order.cost === null) {
      dispatch(showWarning({ 
        message: 'لا يمكن تأكيد الطلب. بيانات العميل أو التكلفة غير مكتملة.',
        title: 'تحذير'
      }));
      return;
    }
    if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
      try {
        await dispatch(confirmOrder(order.id)).unwrap();
        // Refresh orders after confirmation
        dispatch(fetchOrders({}));
        dispatch(showSuccess({ message: 'تم تأكيد الطلب بنجاح' }));
      } catch (error: any) {
        console.error('Failed to confirm order:', error);
        dispatch(showError({ 
          message: error.message || 'فشل في تأكيد الطلب',
          title: 'خطأ في التأكيد'
        }));
      }
    }
  };

  const handleCallCustomer = (customer: Customer) => {
    if (customer?.phone) {
      // Implement call customer logic
    } else {
      dispatch(showWarning({ message: 'رقم الهاتف غير متوفر لهذا العميل' }));
    }
  };

  const handleOpenLocation = (location: CustomerLocation) => {
    if (location?.coordinates) {
      const [latitude, longitude] = location.coordinates.split(',').map(coord => coord.trim());
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const googleMapsUrl = `geo:0,0?q=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`;
        window.location.href = googleMapsUrl;
      } else {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`;
        window.open(url, '_blank');
      }
    } else {
      dispatch(showWarning({ message: 'لا توجد إحداثيات متوفرة لهذا الموقع' }));
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS' }).format(amount);
  };

  const resetFilters = () => {
    setSelectedDistributor(null);
    setSelectedStatus(null);
    setDateFrom('');
    setDateTo('');
  };

  const actions = [
    {
      label: 'إضافة طلب',
      icon: faPlus,
      onClick: handleAddOrder,
      variant: 'primary' as const,
    },
  ];

  return (
    <PageLayout title="الطلبات" actions={actions}>
      <div className="space-y-6">
        <OrderFilter
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          selectedDistributor={selectedDistributor}
          setSelectedDistributor={setSelectedDistributor}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          resetFilters={resetFilters}
          activeDistributors={activeDistributors}
        />
        
        {isLoading || distributorsLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            حدث خطأ أثناء تحميل البيانات: {error}
          </div>
        ) : (
          <OrderTable 
            orders={orders || []}
            handleDelete={handleDelete}
            handleConfirmOrder={handleConfirmOrder}
            handleCallCustomer={handleCallCustomer}
            handleOpenLocation={handleOpenLocation}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default OrdersList; 