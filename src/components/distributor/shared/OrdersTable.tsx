import React from 'react';
import { faPhone, faLocationDot, faPenToSquare, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../../IconButton';
import type { OrderList } from '../../../types/order';

interface OrdersTableProps {
  orders: OrderList[];
  onEdit: (order: number) => void;
  onConfirm: (order:OrderList) => void;
  onDelete?: (orderId: number) => void;
  onCall: (customerName: string) => void;
  onLocation: (customerName: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onEdit,
  onConfirm,
  onDelete,
  onCall,
  onLocation,
}) => {
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="w-32">الإجراءات</th>
              <th>العميل</th>
              <th>رقم الهاتف</th>
              <th>التكلفة</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => {
              const customer = order?.customer;
              const hasLocation = order?.location?.coordinates;
              
              return (
                <tr key={order.id}>
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <IconButton 
                          onClick={() => onCall(customer?.phone)}
                          icon={faPhone}
                          variant="info"
                          size="md"
                          title="اتصال بالعميل"
                        />
                        {hasLocation && (
                          <IconButton 
                            onClick={() => onLocation(order?.location?.coordinates)}
                            icon={faLocationDot}
                            variant="primary"
                            size="md"
                            title="فتح الموقع"
                          />
                        )}
                        <IconButton 
                          onClick={() => onEdit(order?.id)}
                          icon={faPenToSquare}
                          variant="primary"
                          size="md"
                          title="تعديل"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton 
                          onClick={() => onConfirm(order)}
                          icon={faCircleCheck}
                          variant="success"
                          size="md"
                          title="تأكيد الطلب"
                        />
                     
                      </div>
                    </div>
                  </td>
                  <td>{customer?.name}</td>
                  <td>{customer?.phone || '-'}</td>
                  <td>${order.cost}</td>
                </tr>
              );
            })}
            {(!orders ||orders?.length === 0 )&& (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  لا توجد طلبات حالية
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;