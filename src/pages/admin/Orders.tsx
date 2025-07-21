import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { showSuccess, showError, showWarning, showInfo } from '../../store/slices/notificationSlice';
import { RootState } from '../../store/store';
import Loader from '../../components/admin/shared/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../utils/axiosInstance';

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
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // Orders state
  const { orders, total, page: reduxPage, pageSize: reduxPageSize, totalPages, isLoading, error } = useAppSelector((state: RootState) => state.orders);
  
  // Distributors state
  const distributors = useAppSelector(selectDistributors);
  const distributorsLoading = useAppSelector(selectDistributorsLoading);
  
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    distributorId: null,
    status: null,
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10
  });

  // Memoize filter parameters to prevent unnecessary re-renders
  const filterParams = useMemo(() => ({
    page: filters.page,
    pageSize: filters.pageSize,
    distributorId: filters.distributorId,
    status: filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined
  }), [filters.page, filters.pageSize, filters.distributorId, filters.status, filters.dateFrom, filters.dateTo]);

  // Create a stable reference to the filterParams
  const stableFilterParamsRef = useRef(filterParams);
  const lastRefreshTimeRef = useRef<number>(Date.now());
  const distributorsFetched = useRef(false);
  
  // Update refs when values change
  useEffect(() => {
    stableFilterParamsRef.current = filterParams;
  }, [filterParams]);
  
  // Debug current state
  useEffect(() => {
    console.log("Orders.tsx - Current pagination state:", {
      filterPage: filters.page,
      reduxPage,
      totalPages,
      filterPageSize: filters.pageSize,
      reduxPageSize,
      totalItems: total,
      canGoPrevious: filters.page > 1,
      canGoNext: filters.page < totalPages
    });
  }, [filters.page, reduxPage, totalPages, filters.pageSize, reduxPageSize, total]);

  // Handle force refresh when navigating from order creation
  useEffect(() => {
    if (location.state?.forceRefresh) {
      console.log('Force refreshing orders after creation...');
      dispatch(fetchOrders(filterParams));
      // Clear the state to prevent repeated refreshes
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, dispatch, filterParams, navigate]);

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

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (isLoading) {
      console.log('[MANUAL-REFRESH] Already loading data, skipping manual refresh');
      return;
    }
    
    if (isRefreshing) {
      console.log('[MANUAL-REFRESH] Already refreshing, skipping manual refresh');
      return;
    }
    
    // Throttle manual refreshes (minimum 2 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      console.log('[MANUAL-REFRESH] Manual refresh throttled (too soon)');
      dispatch(showInfo({ message: 'يرجى الانتظار قبل التحديث مرة أخرى', duration: 2000 }));
      return;
    }
    
    console.log(`[MANUAL-REFRESH] Manual refresh triggered at ${new Date().toLocaleTimeString()}`);
    lastRefreshTimeRef.current = now;
    setIsRefreshing(true);
    
    try {
      console.log('[MANUAL-REFRESH] Dispatching fetchOrders action...');
      await dispatch(fetchOrders(filterParams)).unwrap();
      console.log('[MANUAL-REFRESH] Fetch completed successfully');
      dispatch(showSuccess({ message: 'تم تحديث الطلبات', duration: 2000 }));
    } catch (error) {
      console.error('[MANUAL-REFRESH] Error during manual refresh:', error);
      dispatch(showError({ message: 'فشل في تحديث الطلبات', duration: 2000 }));
    } finally {
      console.log('[MANUAL-REFRESH] Manual refresh completed');
      setIsRefreshing(false);
    }
  }, [dispatch, filterParams, isLoading, isRefreshing]);

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
    console.log(`Changing page from ${filters.page} to ${newPage}`);
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  }, [filters.page]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log(`Changing page size from ${filters.pageSize} to ${newPageSize}`);
    setFilters(prev => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
  }, [filters.pageSize]);

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
  const formatCurrency = useCallback((amount: number | undefined | null) => {
    if (amount === null || amount === undefined) {
      return '-';
    }
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'ILS' });
  }, []);

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
          className="rounded-none bg-white p-6"
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                الطلبات
              </h1>
              <p className="text-gray-500">إدارة وعرض جميع الطلبات</p>
            </div>
            
            {/* Actions Section */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/admin/orders/add')}
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  إضافة طلب
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleManualRefresh}
                  disabled={isLoading || isRefreshing}
                >
                  <FontAwesomeIcon 
                    icon={faSyncAlt} 
                    className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} 
                  />
                  تحديث
                </Button>
              </div>
              <div>
                <Button
                  variant="tertiary"
                  size="md"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
                </Button>
              </div>
            </div>
            
            {/* Filters Section */}
            {showFilters && (
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
              />
            )}
          </div>
        </CardHeader>
        <CardBody 
          className="p-0 overflow-auto"
          placeholder={undefined}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="text-center p-6 text-red-500">
              <Typography 
                variant="h6" 
                color="red"
                placeholder={undefined}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                {error}
              </Typography>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center p-6">
              <Typography 
                variant="h6" 
                color="blue-gray"
                placeholder={undefined}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              >
                لا توجد طلبات متاحة
              </Typography>
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
              <div className="p-4">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  pageSize={filters.pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  totalItems={total}
                />
              </div>
            </>
          )}
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