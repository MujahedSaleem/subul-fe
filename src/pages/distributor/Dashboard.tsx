import React, { useEffect } from 'react';
import Layout from '../../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faCircleCheck, faTriangleExclamation, faEye, faPhone, faPlus, faBell } from '@fortawesome/free-solid-svg-icons';
import { useDistributorOrders } from '../../hooks/useDistributorOrders';
import { useNavigate } from 'react-router-dom';
import { handleDirectCall } from '../../utils/distributorUtils';

const DistributorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    isLoading,
    error,
    fetchOrders,
    confirmOrder
  } = useDistributorOrders();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate stats from actual orders data
  const activeOrders = orders.filter(order => order.status === 'New' || order.status === 'Pending');
  const completedOrders = orders.filter(order => order.status === 'Confirmed');
  const pendingOrders = orders.filter(order => order.status === 'Pending');

  const stats = [
    {
      title: 'النشطة',
      value: activeOrders.length.toString(),
      icon: faBox,
      change: '+2.5%',
      changeType: 'increase' as const,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'مكتملة',
      value: completedOrders.length.toString(),
      icon: faCircleCheck,
      change: '+18.2%',
      changeType: 'increase' as const,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500'
    },
    {
      title: 'معلقة',
      value: pendingOrders.length.toString(),
      icon: faTriangleExclamation,
      change: '-1.1%',
      changeType: 'decrease' as const,
      color: 'bg-yellow-50 text-yellow-600',
      bgColor: 'bg-yellow-500'
    }
  ];

  // Get the 3 most recent orders
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(order => ({
      id: order.id,
      customer: order.customer?.name || 'غير معروف',
      status: order.status === 'New' ? 'قيد الانتظار' : 
              order.status === 'Pending' ? 'قيد التوصيل' : 
              order.status === 'Confirmed' ? 'مكتمل' : order.status,
      phone: order.customer?.phone || '',
      priority: order.status === 'New' ? 'high' : 'normal'
    }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'قيد الانتظار':
        return 'bg-yellow-100 text-yellow-800';
      case 'قيد التوصيل':
        return 'bg-blue-100 text-blue-800';
      case 'مكتمل':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirmOrder = async (orderId: number) => {
    try {
      await confirmOrder(orderId);
    } catch (error) {
      console.error('Failed to confirm order:', error);
    }
  };

  if (isLoading) {
    return (
      <Layout title="لوحة التحكم">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="لوحة التحكم">
        <div className="text-center py-8 text-red-500">
          حدث خطأ أثناء تحميل البيانات: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="لوحة التحكم">
      {/* Header with notification - Thumb friendly top area */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">مرحباً بك</h1>
        <button className="relative p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 touch-manipulation active:scale-95">
          <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
          {activeOrders.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards - Simplified and Larger */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {stats.map((item, index) => (
          <div
            key={index}
            className="card p-3 text-center hover:shadow-lg transition-all duration-200 active:scale-95 touch-manipulation"
          >
            <div className={`w-8 h-8 mx-auto mb-2 rounded-full ${item.bgColor} flex items-center justify-center`}>
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 text-white" />
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">
              {item.value}
            </div>
            <div className="text-xs text-slate-500 mb-1">
              {item.title}
            </div>
            <div className={`text-xs font-medium ${
              item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {item.change}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Large thumb-friendly buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          onClick={() => navigate('/distributor/orders/add')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
        >
          <FontAwesomeIcon icon={faPlus} className="h-6 w-6 mb-2" />
          <div className="text-sm font-medium">طلب جديد</div>
        </button>
        
        <button 
          onClick={() => navigate('/distributor/orders')}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
        >
          <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6 mb-2" />
          <div className="text-sm font-medium">عرض الطلبات</div>
        </button>
      </div>

      {/* Recent Orders - Simplified cards */}
      <div className="card mb-6">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            آخر الطلبات
          </h3>
        </div>
        <div className="p-2">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              لا توجد طلبات بعد
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="mb-2 last:mb-0">
                <div className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {order.priority === 'high' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <span className="text-sm font-medium text-slate-900">
                        #{order.id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      {order.customer}
                    </div>
                    
                    {/* Action buttons - Bottom right for thumb access */}
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                        onClick={() => navigate(`/distributor/orders/view/${order.id}`)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-150 touch-manipulation active:scale-95"
                        aria-label="عرض"
                      >
                        <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                      </button>
                      {order.phone && (
                        <button
                          onClick={() => handleDirectCall(order.phone)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors duration-150 touch-manipulation active:scale-95"
                          aria-label="اتصال"
                        >
                          <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Action Bar - Thumb zone optimization */}
      <div className="fixed bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:shadow-none sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex items-center justify-around">
          <button 
            onClick={() => navigate('/distributor/orders')}
            className="flex flex-col items-center p-3 text-slate-600 hover:text-blue-600 transition-colors duration-150 touch-manipulation active:scale-95"
          >
            <FontAwesomeIcon icon={faBox} className="h-5 w-5 mb-1" />
            <span className="text-xs">الطلبات</span>
          </button>
          
          <button 
            onClick={() => navigate('/distributor/orders/add')}
            className="flex flex-col items-center p-3 bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-all duration-150 touch-manipulation active:scale-95"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5 mb-1" />
            <span className="text-xs">جديد</span>
          </button>
          
          <button 
            onClick={() => navigate('/distributor/orders')}
            className="flex flex-col items-center p-3 text-slate-600 hover:text-green-600 transition-colors duration-150 touch-manipulation active:scale-95"
          >
            <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 mb-1" />
            <span className="text-xs">مكتمل</span>
          </button>
        </div>
      </div>

      {/* Add bottom padding for mobile to account for fixed bottom bar */}
      <div className="h-20 sm:h-0"></div>
    </Layout>
  );
};

export default DistributorDashboard;