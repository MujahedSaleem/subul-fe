import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import CallModal from '../../components/admin/shared/CallModal';
import { distributorsStore } from '../../store/distributorsStore';
import { ordersStore } from '../../store/ordersStore';
import { OrderList } from '../../types/order';
import Layout from '../../components/Layout';
import { Customer, Location } from '../../types/customer';
import { Distributor } from '../../types/distributor';
import OrderFilter from '../../components/OrderFilters';
import OrderTable from '../../components/OrderTable';
import Button from '../../components/Button';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDistributors, setActiveDistributors] = useState<Distributor[]>([]);

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      setIsLoading(true);
      if (!distributorsStore.isLoadingData) {
        await distributorsStore.fetchDistributors();
        setActiveDistributors(distributorsStore.distributors.filter(d => d.isActive));
      }
      if (!ordersStore.isLoadingData) {
        await ordersStore.fetchOrders();
      }

    

      const unsubscribe = ordersStore.subscribe(() => {
        setIsLoading(false);
      });

      return unsubscribe;
    };

    fetchAndSubscribe();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      setIsLoading(true);
      await ordersStore.deleteOrder(id);
      setIsLoading(false);
    }
  };

  const handleConfirmOrder = async (order: OrderList) => {
    if (order.status === 'Confirmed') return;

    if (!order?.customer?.id || !order.cost) {
      alert('لا يمكن تأكيد الطلب. بيانات العميل أو التكلفة غير مكتملة.');
      return;
    }

    if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
      setIsLoading(true);
      await ordersStore.confirmOrder(order.id, order?.location?.id, order?.location?.coordinates || '');
      setIsLoading(false);
    }
  };

  const handleCallCustomer = (customer: Customer) => {
    if (customer?.phone) {
      setCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
    } else {
      alert('رقم الهاتف غير متوفر لهذا العميل');
    }
  };

  const handleOpenLocation = (location: Location) => {
    if (location?.coordinates) {
      const [latitude, longitude] = location.coordinates.split(',').map(coord => coord.trim());

      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = `geo:${latitude},${longitude}`;
      } else {
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
      }
    } else {
      alert('لا توجد إحداثيات متوفرة لهذا الموقع');
    }
  };

  const filteredOrders = ordersStore.orders.filter(order => {
    let matches = true;

    if (selectedDistributor) {
      matches = matches && order.distributor.id === selectedDistributor;
    }

    if (order.status === 'Confirmed' && order.confirmedAt) {
      const confirmedDate = new Date(order.confirmedAt);

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matches = matches && confirmedDate >= fromDate;
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matches = matches && confirmedDate <= toDate;
      }
    }

    return matches;
  });

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

  return (
    <Layout>
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center">
          <Typography variant="h6" color="blue-gray">الطلبات</Typography>
          <Button variant="gradient" onClick={() => navigate('/admin/orders/add')} className="flex items-center gap-2">
          إضافة طلب
          </Button>
        </CardHeader>

     

      {/* Filters */}
    
 {isLoading ? (
          <CardBody className="text-center py-8">
            <Typography variant="h6" color="blue-gray">جاري التحميل...</Typography>
          </CardBody>
        ) : (
      <CardBody >
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
          <OrderTable
          orders={filteredOrders}
          handleDelete={handleDelete}
          handleConfirmOrder={handleConfirmOrder}
          handleCallCustomer={handleCallCustomer}
          handleOpenLocation={handleOpenLocation}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
        </CardBody>
        )}

        {isCallModalOpen && customerPhone && (
          <CallModal
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
            phone={customerPhone}
          />
        )}      
        </Card>
    </Layout>  );
};

export default Orders;