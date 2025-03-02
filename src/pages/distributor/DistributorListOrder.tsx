import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { faPlus, faCheckDouble, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import type { Action } from '../../types/common';
import CallModal from '../../components/admin/shared/CallModal';
import MobileMenu from '../../components/distributor/shared/MobileMenu';
import OrdersTable from '../../components/distributor/shared/OrdersTable';
import MobileActions from '../../components/distributor/shared/MobileActions';
import { useError } from '../../context/ErrorContext';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { distributorCustomersStore } from '../../store/distributorCustomersStore';
import DistributorHeader from '../../components/distributor/shared/DistributorHeader';
import { isValidPhoneNumber } from '../../utils/formatters';
import Layout from '../../components/Layout';

const DistributorListOrder: React.FC = () => {
  const navigate = useNavigate();
  const { dispatch } = useError();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
  
        // Only fetch if data is not already loading
        if (!distributorCustomersStore.isLoadingData) {
          await distributorCustomersStore.fetchOrders();
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تحميل الطلبات' });
      }
    };
  
    fetchData(); // Ensure the function is called
  
    // Subscribe to store updates
    const unsubscribe = distributorCustomersStore.subscribe(() => {
      setIsLoading(false);
    });
  
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only on mount

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const handleCloseShift = async () => {
    const pendingOrders = distributorCustomersStore.orders.filter(order => order.status !== 'Confirmed');
    
    if (pendingOrders.length > 0) {
      dispatch({ type: 'SET_ERROR', payload: 'لا يمكن إنهاء الوردية. يوجد طلبات غير مؤكدة.' });
      return;
    }

    if (window.confirm('هل أنت متأكد من إنهاء الوردية؟ سيتم تسجيل خروجك من النظام.')) {
      try {
        await distributorCustomersStore.deactivateDistributor();
        handleLogout();
      } catch (error) {
        console.error('Error closing shift:', error);
        dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء إنهاء الوردية. حاول مرة أخرى.' });
      }
    }
  };

  const handleCallCustomer = (phoneNumber: string) => {
    if (isValidPhoneNumber(phoneNumber)) {
      setSelectedCustomerPhone(phoneNumber);
      setIsCallModalOpen(true);
    } else {
      dispatch({ type: 'SET_ERROR', payload: 'رقم الهاتف غير متوفر لهذا العميل' });
    }
  };

  const handleOpenLocation = (customerName: string) => {
    const customer = distributorCustomersStore.customers.find(c => c.name === customerName);
    const location = customer?.locations.find(loc => loc.coordinates);
    
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
      dispatch({ type: 'SET_ERROR', payload: 'لا توجد إحداثيات متوفرة لهذا الموقع' });
    }
  };


  const handleConfirmOrder = async (orderId: number) => {
    try {
      await distributorCustomersStore.confirmOrder(orderId);
      setIsLoading(true)
      await distributorCustomersStore.fetchOrders();
    } catch (error) {
      console.error('Error confirming order:', error);
      dispatch({ type: 'SET_ERROR', payload: 'حدث خطأ أثناء تأكيد الطلب' });
    }
  };

  const headerActions: Action[] = [
    {
      label: 'طلب جديد',
      icon: faPlus,
      onClick: () => navigate('/distributor/orders/add'),
      variant: 'primary'
    },
    {
      label: 'إنهاء الوردية',
      icon: faCheckDouble,
      onClick: handleCloseShift,
      variant: 'success'
    },
    {
      label: 'تسجيل الخروج',
      icon: faRightFromBracket,
      onClick: handleLogout,
      variant: 'danger'
    }
  ];

  const mobileActions: Action[] = [
    {
      label: 'طلب جديد',
      icon: faPlus,
      onClick: () => navigate('/distributor/orders/add'),
      variant: 'primary'
    },
    {
      label: 'إنهاء الوردية',
      icon: faCheckDouble,
      onClick: handleCloseShift,
      variant: 'success'
    }
  ];

  return (
    <Layout title='قائمة الطلبيات'>
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center">
        <DistributorHeader
      title="الطلبات"
      actions={headerActions}
      mobileActions={headerActions}
      onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
    />
      
        </CardHeader>

        <CardBody>
          <MobileActions actions={mobileActions} />

          {isLoading ? (
            <div className="text-center py-8">
              <Typography variant="h6" color="blue-gray">جاري التحميل...</Typography>
            </div>
          ) : (
            <OrdersTable
              orders={distributorCustomersStore.orders}
              onEdit={(orderId) => navigate(`/distributor/orders/edit/${orderId}`)}
              onConfirm={handleConfirmOrder}
              onCall={handleCallCustomer}
              onLocation={handleOpenLocation}
            />
          )}

          <CallModal
            phone={selectedCustomerPhone}
            isOpen={isCallModalOpen}
            onClose={() => setIsCallModalOpen(false)}
          />

          {isMenuOpen && (
            <MobileMenu
              isOpen={isMenuOpen}
              actions={headerActions}
              onClose={() => setIsMenuOpen(false)}
            />
          )}
        </CardBody>
      </Card>
      </Layout>
  );
};

export default DistributorListOrder;