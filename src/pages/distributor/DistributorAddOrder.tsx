import React from 'react';
import Layout from '../../components/Layout';
import DistributorOrderForm from '../../components/distributor/DistributorOrderForm';
import type { OrderList, DistributorInfo } from '../../types/order';
import { Customer, Location } from '../../types/customer';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { generateOrderNumber } from '../../utils/distributorUtils';

const DistributorAddOrder: React.FC = () => {
  // Create initial order state
  const initialOrder: OrderList = {
    id: 0,
    orderNumber: generateOrderNumber(),
    customer: null as unknown as Customer,
    location: null as unknown as Location,
    cost: undefined,
    status: 'New',
    distributor: null as unknown as DistributorInfo,
    createdAt: new Date().toISOString(),
    confirmedAt: null as unknown as string
  };

  // Use the common order management hook
  const {
    order,
    setOrder,
    isSubmitting,
    handleSubmit,
    buttonTitle
  } = useOrderManagement({ initialOrder, isEdit: false });

  return (
    <Layout title="إضافة طلبية">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">إضافة طلبية جديدة</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 rtl:space-x-reverse">
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    مسودة جديدة
                  </span>
                  <div className="flex items-center text-gray-500 text-sm">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                    </svg>
                    {new Date().toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">رقم الطلبية</div>
                  <div className="text-xs text-gray-500">{order.orderNumber}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <DistributorOrderForm
              order={order}
              setOrder={setOrder}
              onSubmit={handleSubmit}
              title={buttonTitle}
              isEdit={false}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DistributorAddOrder;