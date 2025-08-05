import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { OrderList } from '../../../types/order';
import { Customer, Location as CustomerLocation } from '../../../types/customer';
import PageLayout from '../../../components/admin/shared/PageLayout';
import OrderFilter from '../../../components/OrderFilters';
import OrderTable from '../../../components/OrderTable';
import Pagination from '../../../components/Pagination';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchOrders, deleteOrder, confirmOrder } from '../../../store/slices/orderSlice';
import { fetchActiveDistributors, selectActiveDistributors, selectIsLoading as selectDistributorsLoading } from '../../../store/slices/distributorSlice';
import { showSuccess, showError, showWarning } from '../../../store/slices/notificationSlice';
import { RootState } from '../../../store/store';
import { openGoogleMapsApp } from '../../../utils/geo_utils';

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Redux selectors
  const { orders, total, page: reduxPage, pageSize: reduxPageSize, totalPages, isLoading, error } = useAppSelector((state: RootState) => state.orders);
  const activeDistributors = useAppSelector(selectActiveDistributors);
  const distributorsLoading = useAppSelector(selectDistributorsLoading);

  // Sync local state with Redux state when Redux state changes
  useEffect(() => {
    
    
    if (reduxPage !== page) {
      setPage(reduxPage);
    }
    if (reduxPageSize !== pageSize) {
      setPageSize(reduxPageSize);
    }
  }, [reduxPage, reduxPageSize]);

  useEffect(() => {
    // Log the current pagination state for debugging
    console.log('OrdersList pagination state:', {
      localPage: page,
      reduxPage,
      totalPages,
      localPageSize: pageSize,
      reduxPageSize,
      totalItems: total,
    });

    // Create filters object from state
    const filters = {
      page,
      pageSize,
      distributorId: selectedDistributor,
      status: selectedStatus,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };

    // Fetch orders with filters
    dispatch(fetchOrders(filters));
  }, [dispatch, page, pageSize, selectedDistributor, selectedStatus, dateFrom, dateTo]);

  // Fetch distributors only once on component mount
  useEffect(() => {
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
        dispatch(fetchOrders({
          page,
          pageSize,
          distributorId: selectedDistributor,
          status: selectedStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        }));
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
      try {
        await dispatch(confirmOrder(order.id)).unwrap();
        // Refresh orders after confirmation
        dispatch(fetchOrders({
          page,
          pageSize,
          distributorId: selectedDistributor,
          status: selectedStatus,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        }));
        dispatch(showSuccess({ message: 'تم تأكيد الطلب بنجاح' }));
      } catch (error: any) {
        console.error('Failed to confirm order:', error);
        dispatch(showError({ 
          message: error.message || 'فشل في تأكيد الطلب',
          title: 'خطأ في التأكيد'
        }));
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
      openGoogleMapsApp(Number(latitude), Number(longitude));
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
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    
    setPageSize(newPageSize);
    setPage(1);
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
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            لا توجد طلبات متاحة
          </div>
        ) : (
          <>
            <OrderTable 
              orders={orders || []}
              handleDelete={handleDelete}
              handleConfirmOrder={handleConfirmOrder}
              handleCallCustomer={handleCallCustomer}
              handleOpenLocation={handleOpenLocation}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
            
            <div className="p-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                totalItems={total}
              />
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default OrdersList; 