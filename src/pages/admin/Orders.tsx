import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import CallModal from '../../components/admin/shared/CallModal';
import { OrderList } from '../../types/order';
import Layout from '../../components/Layout';
import { Customer, Location } from '../../types/customer';
import { Distributor } from '../../types/distributor';
import OrderFilter from '../../components/OrderFilters';
import OrderTable from '../../components/OrderTable';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, deleteOrder, confirmOrder } from '../../store/slices/orderSlice';
import { fetchDistributors, selectDistributors, selectIsLoading as selectDistributorsLoading } from '../../store/slices/distributorSlice';
import { showSuccess, showError, showWarning } from '../../store/slices/notificationSlice';
import { RootState } from '../../store/store';

interface FilterState {
  distributorId: string | null;
  status: string | null;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Orders state
  const { orders, total, page, pageSize, totalPages, isLoading, error } = useAppSelector((state: RootState) => state.orders);
  
  // Distributors state
  const distributors = useAppSelector(selectDistributors);
  const distributorsLoading = useAppSelector(selectDistributorsLoading);
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    distributorId: null,
    status: null,
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10
  });

  // Use ref to track if distributors have been fetched
  const distributorsFetched = useRef(false);
  
  // Memoize filter parameters to prevent unnecessary re-renders
  const filterParams = useMemo(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    distributorId: filters.distributorId,
    status: filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined
  }), [filters.page, filters.pageSize, filters.distributorId, filters.status, filters.dateFrom, filters.dateTo]);

  // Only fetch distributors once when component mounts
  useEffect(() => {
    if (!distributorsFetched.current && distributors.length === 0 && !distributorsLoading) {
      console.log('Fetching distributors...');
      distributorsFetched.current = true;
      dispatch(fetchDistributors());
    }
  }, [dispatch, distributors.length, distributorsLoading]);

  // Fetch orders when filter parameters change
  useEffect(() => {
    console.log('Fetching orders with filters:', filterParams);
    dispatch(fetchOrders(filterParams));
  }, [dispatch, filterParams]);

  const handleDelete = useCallback(async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await dispatch(deleteOrder(id.toString())).unwrap();
        dispatch(showSuccess({ message: 'تم حذف الطلب بنجاح' }));
      } catch (error: any) {
        console.error("Error deleting order:", error);
        dispatch(showError({ 
          message: error.message || 'فشل في حذف الطلب',
          title: 'خطأ في الحذف'
        }));
      }
    }
  }, [dispatch]);

  const handleConfirmOrder = useCallback(async (order: OrderList) => {
    if (order.status === 'Confirmed') return;
    if (!order?.customer?.id || order.cost === undefined || order.cost === null) {
      dispatch(showWarning({ 
        message: 'لا يمكن تأكيد الطلب. بيانات العميل أو التكلفة غير مكتملة.',
        title: 'تحذير'
      }));
      return;
    }
    if (window.confirm('Are you sure you want to confirm this order?')) {
      try {
        await dispatch(confirmOrder(order.id)).unwrap();
        dispatch(showSuccess({ message: 'تم تأكيد الطلب بنجاح' }));
      } catch (error: any) {
        console.error("Error confirming order:", error);
        dispatch(showError({ 
          message: error.message || 'فشل في تأكيد الطلب',
          title: 'خطأ في التأكيد'
        }));
      }
    }
  }, [dispatch]);

  const handleDistributorChange = useCallback((value: string | null) => {
    setFilters(prev => ({
      ...prev,
      distributorId: value,
      page: 1
    }));
  }, []);

  const handleStatusChange = useCallback((value: string | null) => {
    setFilters(prev => ({
      ...prev,
      status: value,
      page: 1
    }));
  }, []);

  const handleDateFromChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: value,
      page: 1
    }));
  }, []);

  const handleDateToChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      dateTo: value,
      page: 1
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      distributorId: null,
      status: null,
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setFilters(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
  }, []);

  const handleCallCustomer = useCallback((customer: Customer) => {
    if (customer?.phone) {
      setCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
    }
  }, []);

  const handleOpenLocation = useCallback((location: Location) => {
    if (!location) {
      dispatch(showWarning({ message: 'لا يوجد موقع محدد' }));
      return;
    }
    if (!location?.coordinates) {
      dispatch(showWarning({ message: 'لا توجد إحداثيات متوفرة لهذا الموقع' }));
      return;
    }
    const [latitude, longitude] = location.coordinates.split(',').map(Number);

    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      const googleMapsUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      window.location.href = googleMapsUrl;
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  }, [dispatch]);

  // Memoize active distributors to prevent unnecessary re-renders
  const activeDistributors = useMemo(() => distributors.filter(d => d.isActive), [distributors]);

  // Memoize format functions to prevent unnecessary re-renders
  const formatDate = useCallback((date: string) => new Date(date).toLocaleDateString(), []);
  const formatCurrency = useCallback((amount: number) => amount.toLocaleString('en-US', { style: 'currency', currency: 'ILS' }), []);

  return (
    <Layout title="Orders">
      <Card 
        className="h-full w-full"
        placeholder={undefined}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none"
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="mb-4 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <Typography 
                variant="h5" 
                color="blue-gray" 
                placeholder={undefined}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
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

        <CardBody 
          className="p-6" 
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
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
              <>
                <OrderTable 
                  orders={orders}
                  handleDelete={handleDelete}
                  handleConfirmOrder={handleConfirmOrder}
                  handleCallCustomer={handleCallCustomer}
                  handleOpenLocation={handleOpenLocation}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
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