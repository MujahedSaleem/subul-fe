import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faLocationDot, faPenToSquare, faCircleCheck, faTrash } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../../IconButton';
import type { OrderRequest } from '../../../types/order';
import type { Customer } from '../../../types/customer';

interface OrdersTableProps {
  orders: OrderRequest[];
  onEdit: (order: OrderRequest) => void;
  onConfirm: (order: OrderRequest) => void;
  onDelete: (orderId: number) => void;
  onCall: (customerName: string) => void;
  onLocation: (customerName: string) => void;
  getCustomer: (name: string) => Customer | undefined;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onEdit,
  onConfirm,
  onDelete,
  onCall,
  onLocation,
  getCustomer
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
            {orders.map((order) => {
              const customer = getCustomer(order.customerId);
              const hasLocation = customer?.locations.some(loc => loc.coordinates);
              
              return (
                <tr key={order.id}>
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <IconButton 
                          onClick={() => onCall(order.customerId)}
                          icon={faPhone}
                          variant="info"
                          size="sm"
                          title="اتصال بالعميل"
                        />
                        {hasLocation && (
                          <IconButton 
                            onClick={() => onLocation(order.customerId)}
                            icon={faLocationDot}
                            variant="primary"
                            size="sm"
                            title="فتح الموقع"
                          />
                        )}
                        <IconButton 
                          onClick={() => onEdit(order)}
                          icon={faPenToSquare}
                          variant="primary"
                          size="sm"
                          title="تعديل"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton 
                          onClick={() => onConfirm(order)}
                          icon={faCircleCheck}
                          variant="success"
                          size="sm"
                          title="تأكيد الطلب"
                        />
                        <IconButton 
                          onClick={() => onDelete(order.id)}
                          icon={faTrash}
                          variant="danger"
                          size="sm"
                          title="حذف"
                        />
                      </div>
                    </div>
                  </td>
                  <td>{order.customerId}</td>
                  <td>{customer?.phone || '-'}</td>
                  <td>${order.cost}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
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