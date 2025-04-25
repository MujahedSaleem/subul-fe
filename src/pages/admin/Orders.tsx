import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import CallModal from '../../components/admin/shared/CallModal';
import { distributorsStore } from '../../store/distributorsStore';
import { OrderList } from '../../types/order';
import Layout from '../../components/Layout';
import { Customer, Location } from '../../types/customer';
import { Distributor } from '../../types/distributor';
import OrderFilter from '../../components/OrderFilters';
import OrderTable from '../../components/OrderTable';
import Button from '../../components/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, deleteOrder, confirmOrder } from '../../store/slices/orderSlice';
import { RootState } from '../../store/store';

interface FilterState {
  distributorId: string | null;
  status: string | null;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { orders, isLoading, error } = useAppSelector((state: RootState) => state.orders);
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDistributors, setActiveDistributors] = useState<Distributor[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    distributorId: null,
    status: null,
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10
  });

  // Fetch distributors only once on mount
  useEffect(() => {
    if (!distributorsStore.distributors.length) {
      distributorsStore.fetchDistributors();
    }

    const unsubscribeDistributors = distributorsStore.subscribe(() => {
      setActiveDistributors(distributorsStore.distributors.filter(d => d.isActive));
    });

    return () => {
      unsubscribeDistributors();
    };
  }, []);

  // Single effect for fetching orders
  useEffect(() => {
    dispatch(fetchOrders({
      pageNumber: filters.page,
      pageSize: filters.pageSize,
      filters: {
        distributorId: filters.distributorId,
        status: filters.status,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      }
    }));
  }, [dispatch, filters]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await dispatch(deleteOrder(id)).unwrap();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const handleConfirmOrder = async (order: OrderList) => {
    if (order.status === 'Confirmed') return;
    if (!order?.customer?.id || !order.cost) {
      alert('Cannot confirm order. Customer data or cost is incomplete.');
      return;
    }
    if (window.confirm('Are you sure you want to confirm this order?')) {
      try {
        await dispatch(confirmOrder(order.id)).unwrap();
      } catch (error) {
        console.error("Error confirming order:", error);
      }
    }
  };

  const handleDistributorChange = (value: string | null) => {
    setFilters(prev => ({
      ...prev,
      distributorId: value,
      page: 1
    }));
  };

  const handleStatusChange = (value: string | null) => {
    setFilters(prev => ({
      ...prev,
      status: value,
      page: 1
    }));
  };

  const handleDateFromChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: value,
      page: 1
    }));
  };

  const handleDateToChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      dateTo: value,
      page: 1
    }));
  };

  const resetFilters = () => {
    setFilters({
      distributorId: null,
      status: null,
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
  };

  const handleCallCustomer = (customer: Customer) => {
    if (customer?.phone) {
      setCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
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
      alert('No coordinates available for this location');
    }
  };

  return (
    <Layout title="Orders">
      <Card 
        className="h-full w-full"
        placeholder={undefined}
        
        
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none"
          placeholder={undefined}
          
          
        >
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Typography variant="h5" color="blue-gray" placeholder={undefined} >
                Orders
              </Typography>
            </div>
            <div className="flex w-full shrink-0 gap-2 md:w-max">
              <Button
                className="flex items-center gap-3"
                size="sm"
                onClick={() => navigate('/admin/orders/add')}
              >
                Add Order
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6" placeholder={undefined} >
          <div className="space-y-6">
            <OrderFilter
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              selectedDistributor={filters.distributorId}
              setSelectedDistributor={handleDistributorChange}
              selectedStatus={filters.status}
              setSelectedStatus={handleStatusChange}
              dateFrom={filters.dateFrom}
              setDateFrom={handleDateFromChange}
              dateTo={filters.dateTo}
              setDateTo={handleDateToChange}
              resetFilters={resetFilters}
              activeDistributors={activeDistributors}
              currentPage={filters.page}
              pageSize={filters.pageSize}
            />

            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                {error}
              </div>
            ) : (
              <OrderTable 
                orders={orders}
                handleDelete={handleDelete}
                handleConfirmOrder={handleConfirmOrder}
                handleCallCustomer={handleCallCustomer}
                handleOpenLocation={handleOpenLocation}
                formatDate={(date) => new Date(date).toLocaleDateString()}
                formatCurrency={(amount) => amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              />
            )}
          </div>
        </CardBody>
      </Card>

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        phone={customerPhone}
      />
    </Layout>
  );
};

export default Orders;