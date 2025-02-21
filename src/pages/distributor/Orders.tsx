import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  faPlus, 
  faCheckDouble,
  faRightFromBracket
} from '@fortawesome/free-solid-svg-icons';
import { ordersStore } from '../../store/ordersStore';
import { customersStore } from '../../store/customersStore';
import type { OrderRequest } from '../../types/order';
import type { Action } from '../../types/common';
import OrderForm from '../../components/OrderForm';
import CallModal from '../../components/admin/shared/CallModal';
import DistributorHeader from '../../components/distributor/shared/DistributorHeader';
import MobileMenu from '../../components/distributor/shared/MobileMenu';
import OrdersTable from '../../components/distributor/shared/OrdersTable';
import MobileActions from '../../components/distributor/shared/MobileActions';

const DistributorOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');

  useEffect(() => {
    const nonConfirmedOrders = ordersStore.orders.filter(order => order.status !== 'Confirmed');
    setOrders(nonConfirmedOrders);

    const unsubscribe = ordersStore.subscribe(() => {
      const updatedOrders = ordersStore.orders.filter(order => order.status !== 'Confirmed');
      setOrders(updatedOrders);
    });

    return unsubscribe;
  }, []);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleCloseShift = () => {
    const pendingOrders = orders.filter(order => order.statusString !== 'Confirmed');
    
    if (pendingOrders.length > 0) {
      alert('لا يمكن إنهاء الوردية. يوجد طلبات غير مكتدة.');
      return;
    }

    if (window.confirm('هل أنت متأكد من إنهاء الوردية؟ سيتم تسجيل خروجك من النظام.')) {
      navigate('/login');
    }
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    return `ORD${timestamp}`;
  };

  const handleAddOrder = () => {
    const newOrder: OrderRequest = {
      id: Math.max(0, ...ordersStore.orders.map(o => o.id)) + 1,
      orderNumber: generateOrderNumber(),
      customerId: '',
      LocationId: '',
      cost: '',
      statusString: 'New'
    };
    setSelectedOrder(newOrder);
    setIsAddingOrder(true);
  };

  const handleEditOrder = (order: OrderRequest) => {
    setSelectedOrder(order);
    setIsEditingOrder(true);
  };

  const handleCallCustomer = (customerName: string) => {
    const customer = customersStore.customers.find(c => c.name === customerName);
    if (customer?.phone) {
      setSelectedCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
    } else {
      alert('رقم الهاتف غير متوفر لهذا العميل');
    }
  };

  const handleOpenLocation = (customerName: string) => {
    const customer = customersStore.customers.find(c => c.name === customerName);
    const location = customer?.locations.find(loc => loc.coordinates);
    
    if (location?.coordinates) {
      const [longitude, latitude] = location.coordinates.split(',').map(coord => coord.trim());
      
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = `geo:${latitude},${longitude}`;
      } else {
        window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
      }
    } else {
      alert('لا توجد إحداثيات متوفرة لهذا الموقع');
    }
  };

  const handleDelete = (orderId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      const updatedOrders = ordersStore.orders.filter(order => order.id !== orderId);
      ordersStore.setOrders(updatedOrders);
    }
  };

  const handleConfirmOrder = async (order: OrderRequest) => {
    if (!order.customerId || !order.cost.trim()) {
      alert('لا يمكن تأكيد الطلب. بيانات العميل أو التكلفة غير مكتملة.');
      return;
    }

    if (window.confirm('هل أنت متأكد من تأكيد هذا الطلب؟')) {
      let locationName = order.LocationId;
      let locationCoords = '';

      if (!locationName) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          const { latitude, longitude } = position.coords;
          locationCoords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          locationName = 'الموقع الحالي';
        } catch (error) {
          if (error instanceof GeolocationPositionError) {
            let errorMessage = 'حدث خطأ أثناء تحديد الموقع';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'تم رفض إذن الوصول للموقع';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'معلومات الموقع غير متوفرة';
                break;
              case error.TIMEOUT:
                errorMessage = 'انتهت مهلة طلب الموقع';
                break;
            }
            alert(errorMessage);
            return;
          }
          alert('حدث خطأ غير متوقع');
          return;
        }
      }

      const confirmedOrder = {
        ...order,
        location: locationName,
        status: 'Confirmed' as const,
        confirmedAt: new Date().toISOString()
      };

      const updatedOrders = ordersStore.orders.map(o => 
        o.id === order.id ? confirmedOrder : o
      );
      ordersStore.setOrders(updatedOrders);

      if (locationName && locationCoords) {
        const customer = customersStore.customers.find(c => c.name === order.customerId);
        if (customer) {
          const locationExists = customer.locations.some(
            l => l.name === locationName || l.coordinates === locationCoords
          );
          
          if (!locationExists) {
            const updatedCustomer = {
              ...customer,
              locations: [...customer.locations, {
                id: Math.max(0, ...customer.locations.map(l => l.id)) + 1,
                name: locationName,
                coordinates: locationCoords,
                description: ''
              }]
            };
            customersStore.updateCustomer(updatedCustomer);
          }
        }
      }
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    if (isAddingOrder) {
      ordersStore.addOrder(selectedOrder);
    } else if (isEditingOrder) {
      const updatedOrders = ordersStore.orders.map(order => 
        order.id === selectedOrder.id ? selectedOrder : order
      );
      ordersStore.setOrders(updatedOrders);
    }

    setIsAddingOrder(false);
    setIsEditingOrder(false);
    setSelectedOrder(null);
  };

  const handleBack = () => {
    if (selectedOrder?.customerId) {
      if (isEditingOrder) {
        const updatedOrders = ordersStore.orders.map(order => 
          order.id === selectedOrder.id ? selectedOrder : order
        );
        ordersStore.setOrders(updatedOrders);
      } else if (isAddingOrder) {
        const pendingOrder = {
          ...selectedOrder,
          status: 'Pending' as const
        };
        ordersStore.addOrder(pendingOrder);
      }
    }
    setIsAddingOrder(false);
    setIsEditingOrder(false);
    setSelectedOrder(null);
  };

  const headerActions: Action[] = [
    {
      label: 'طلب جديد',
      icon: faPlus,
      onClick: handleAddOrder,
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
      onClick: handleAddOrder,
      variant: 'primary'
    },
    {
      label: 'إنهاء الوردية',
      icon: faCheckDouble,
      onClick: handleCloseShift,
      variant: 'success'
    }
  ];

  if (isAddingOrder || isEditingOrder) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DistributorHeader
          title={isAddingOrder ? 'طلب جديد' : 'تعديل الطلب'}
          actions={[]}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              setOrder={setSelectedOrder}
              onSubmit={handleOrderSubmit}
              onBack={handleBack}
              title={isAddingOrder ? 'إضافة طلب' : 'تحديث الطلب'}
              isEdit={isEditingOrder}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DistributorHeader
        title="الطلبات"
        actions={headerActions}
        mobileActions={headerActions}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MobileActions actions={mobileActions} />

        <OrdersTable
          orders={orders}
          onEdit={handleEditOrder}
          onConfirm={handleConfirmOrder}
          onDelete={handleDelete}
          onCall={handleCallCustomer}
          onLocation={handleOpenLocation}
          getCustomer={(name) => customersStore.customers.find(c => c.name === name)}
        />

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
      </main>
    </div>
  );
};

export default DistributorOrders;