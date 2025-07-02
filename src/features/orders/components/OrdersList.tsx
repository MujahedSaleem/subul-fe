import React from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { OrderList } from '../../../types/order';
import { Customer, Location as CustomerLocation } from '../../../types/customer';
import { Distributor } from '../../../types/distributor';
import PageLayout from '../../../components/admin/shared/PageLayout';
import OrderFilter from '../../../components/OrderFilters';
import OrderTable from '../../../components/OrderTable';
import { useDataFetching } from '../../../hooks/useDataFetching';
import { ordersStore } from '../../../store/ordersStore';
import { distributorsStore } from '../../../store/distributorsStore';

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedDistributor, setSelectedDistributor] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [activeDistributors, setActiveDistributors] = React.useState<Distributor[]>([]);

  const { data: orders, isLoading, error, fetchData } = useDataFetching<OrderList[]>(
    async () => {
      await ordersStore.fetchOrders();
      return ordersStore.orders;
    },
    {
      onError: (error) => console.error('Failed to fetch orders:', error),
    }
  );

  React.useEffect(() => {
    fetchData();
    const unsubscribeDistributors = distributorsStore.subscribe(() => {
      setActiveDistributors(distributorsStore.distributors.filter(d => d.isActive));
    });
    return () => unsubscribeDistributors();
  }, [fetchData]);

  const handleAddOrder = () => {
    navigate('/admin/orders/add');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      ordersStore.deleteOrder(id);
    }
  };

  const handleConfirmOrder = (order: OrderList) => {
    if (order.status === 'Confirmed') return;
    if (!order?.customer?.id || order.cost === undefined || order.cost === null) {
      alert('لا يمكن تأكيد الطلب. بيانات العميل أو التكلفة غير مكتملة.');
      return;
    }
    if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
      ordersStore.confirmOrder(order.id);
    }
  };

  const handleCallCustomer = (customer: Customer) => {
    if (customer?.phone) {
      // Implement call customer logic
    } else {
      alert('رقم الهاتف غير متوفر لهذا العميل');
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
      alert('لا توجد إحداثيات متوفرة لهذا الموقع');
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const resetFilters = () => {
    setSelectedDistributor('');
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
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          resetFilters={resetFilters}
          activeDistributors={activeDistributors}
        />
        
        {isLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            حدث خطأ أثناء تحميل البيانات
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