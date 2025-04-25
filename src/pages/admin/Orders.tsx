import React, { useEffect, useState, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeDistributors, setActiveDistributors] = useState<Distributor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const unsubscribeOrders = ordersStore.subscribe(() => {
      setIsLoading(false);
    });
    const unsubscribeDistributors = distributorsStore.subscribe(() => {
      setActiveDistributors(distributorsStore.distributors.filter(d => d.isActive));
    });
  
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (!distributorsStore.distributors.length) {
          await distributorsStore.fetchDistributors();
        }
        await ordersStore.fetchOrders(currentPage, pageSize, {
          distributorId: selectedDistributor,
          status: selectedStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  
    return () => {
      unsubscribeOrders(); 
      unsubscribeDistributors(); 
    };
  }, [currentPage, pageSize, selectedDistributor, selectedStatus, dateFrom, dateTo]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      setIsLoading(true);
      try {
      await ordersStore.deleteOrder(id);
        await ordersStore.fetchOrders(currentPage, pageSize, {
          distributorId: selectedDistributor,
          status: selectedStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        });
      } catch (error) {
        console.error("Error deleting order:", error);
      } finally {
      setIsLoading(false);
      }
    }
  };

  const handleConfirmOrder = async (order: OrderList) => {
    if (window.confirm('Are you sure you want to confirm this order?')) {
      setIsLoading(true);
      try {
        await ordersStore.confirmOrder(order.id);
        await ordersStore.fetchOrders(currentPage, pageSize, {
          distributorId: selectedDistributor,
          status: selectedStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        });
      } catch (error) {
        console.error("Error confirming order:", error);
      } finally {
      setIsLoading(false);
      }
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

  const handleDistributorChange = (value: SetStateAction<string | null>) => {
    setSelectedDistributor(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: SetStateAction<string | null>) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleDateFromChange = (value: SetStateAction<string>) => {
    setDateFrom(value);
    setCurrentPage(1);
  };

  const handleDateToChange = (value: SetStateAction<string>) => {
    setDateTo(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedDistributor(null);
    setSelectedStatus(null);
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <Layout title="الطلبات">
      <div className="min-h-screen bg-gray-50">
        <Card 
          className="h-full w-full shadow-lg"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
          <CardHeader 
            floated={false} 
            shadow={false} 
            className="rounded-none bg-white p-6"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Typography 
                variant="h4" 
                color="blue-gray"
                className="font-bold"
                placeholder={undefined}
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
              >
                الطلبات
              </Typography>
              <Button 
                variant="gradient" 
                onClick={() => navigate('/admin/orders/add')} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
          إضافة طلب
          </Button>
            </div>
        </CardHeader>

          <CardBody 
            className="p-6"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            <div className="space-y-6">
            <OrderFilter
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedDistributor={selectedDistributor}
                setSelectedDistributor={handleDistributorChange}
                selectedStatus={selectedStatus}
                setSelectedStatus={handleStatusChange}
        dateFrom={dateFrom}
                setDateFrom={handleDateFromChange}
        dateTo={dateTo}
                setDateTo={handleDateToChange}
        resetFilters={resetFilters}
        activeDistributors={activeDistributors}
      />

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Typography 
                    variant="h6" 
                    color="blue-gray"
                    className="text-center"
                    placeholder={undefined}
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                  >
                    جاري التحميل...
                  </Typography>
                </div>
              ) : (
                <>
          <OrderTable
                    orders={ordersStore.orders}
          handleDelete={handleDelete}
          handleConfirmOrder={handleConfirmOrder}
          handleCallCustomer={handleCallCustomer}
          handleOpenLocation={handleOpenLocation}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
        />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <Typography 
                        variant="small"
                        placeholder={undefined}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                      >
                        عدد العناصر في الصفحة:
                      </Typography>
                      <select 
                        value={pageSize} 
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border rounded p-1"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                      <Typography 
                        variant="small"
                        placeholder={undefined}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                      >
                        الصفحة {currentPage} من {ordersStore.totalPages}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === ordersStore.totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
        </CardBody>
        </Card>

        {isCallModalOpen && customerPhone && (
          <CallModal
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
            phone={customerPhone}
          />
        )}      
      </div>
    </Layout>
  );
};

export default Orders;