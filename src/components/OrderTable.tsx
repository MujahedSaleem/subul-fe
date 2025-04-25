import React, { useState } from 'react';
import { faPhone, faLocationDot, faCircleCheck, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Card, CardBody, Typography as MuiTypography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { OrderList } from '../types/order';
import { Customer, Location } from '../types/customer';
import IconButton from './IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CallModal from './admin/shared/CallModal';

interface OrderTableProps {
  orders: OrderList[];
  handleDelete: (id: number) => void;
  handleConfirmOrder: (order: OrderList) => void;
  handleCallCustomer: (customer: Customer) => void;
  handleOpenLocation: (location: Location) => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

const Typography = ({ children, ...props }: any) => (
  <MuiTypography
    {...props}
    placeholder={undefined}
    onPointerEnterCapture={undefined}
    onPointerLeaveCapture={undefined}
  >
    {children}
  </MuiTypography>
);

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  handleDelete,
  handleConfirmOrder,
  handleCallCustomer,
  handleOpenLocation,
  formatDate,
  formatCurrency,
}) => {
  const navigate = useNavigate();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('');

  const handleDirectCall = (phone: string) => {
    const cleaned = phone?.replace(/\D/g, '');
    const withoutLeadingZeros = cleaned?.replace(/^0+/, '');
    window.location.href = `tel:${withoutLeadingZeros}`;
  };

  const handleWhatsAppCall = (customer: Customer) => {
    if (customer?.phone) {
      setSelectedCustomerPhone(customer.phone);
      setIsCallModalOpen(true);
    }
  };

  const formatShekel = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', { 
      style: 'currency', 
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {orders.map((order) => {
  
        
        return (
          <Card 
            key={order.id}
            className="w-full bg-green-50 hover:shadow-md transition-all duration-300"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            <CardBody 
              className="p-4"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <IconButton
                    icon={faEye}
                    onClick={() => navigate(`/admin/orders/view/${order.id}`)}
                    color="blue"
                    className="hover:bg-blue-100"
                    size="md"
                    title="View Order"
                  />
                  {order.status !== 'Confirmed' && (
                    <>
                      <IconButton
                        icon={faPenToSquare}
                        onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                        color="blue"
                        className="hover:bg-blue-100"
                        size="md"
                        title="Edit Order"
                      />
                      <IconButton
                        icon={faTrash}
                        onClick={() => handleDelete(order.id)}
                        color="red"
                        className="hover:bg-red-100"
                        size="md"
                        title="Delete Order"
                      />
                    </>
                  )}
                </div>
                <Typography 
                  variant="small"
                  className="text-gray-600"
                >
                  {formatDate(order.createdAt)}
                </Typography>
              </div>

              <Typography 
                variant="h6"
                className="font-bold mb-3"
              >
                #{order.orderNumber}
              </Typography>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <Typography 
                      variant="small"
                      className="font-medium"
                    >
                      {order.customer?.name}
                    </Typography>
                    <Typography 
                      variant="small"
                      className="text-gray-600"
                    >
                      {order.customer?.phone}
                    </Typography>
                  </div>
                  <div className="flex gap-1">
                    <IconButton
                      icon={faPhone}
                      onClick={() => handleDirectCall(order.customer?.phone || '')}
                      color="blue"
                      className="hover:bg-blue-100"
                      size="md"
                      title="Direct Call"
                    />
                    <IconButton
                      icon={faWhatsapp}
                      onClick={() => handleWhatsAppCall(order.customer)}
                      color="green"
                      className="hover:bg-green-100"
                      size="md"
                      title="WhatsApp Call"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserTie} className="w-5 h-5 text-indigo-600" />
                  <Typography 
                    variant="small"
                    className="font-medium"
                  >
                    {order.distributor ? (
                      <span>
                        {order.distributor.name}
                      </span>
                    ) : (
                      'No distributor assigned'
                    )}
                  </Typography>
                </div>

                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLocationDot} className="w-5 h-5 text-green-600" />
                  <Typography 
                    variant="small"
                    className="font-medium cursor-pointer hover:text-green-600 transition-colors"
                    onClick={() => handleOpenLocation(order.location)}
                  >
                    {order.location?.name}
                  </Typography>
                </div>

                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMoneyBill} className="w-5 h-5 text-purple-600" />
                  <Typography 
                    variant="small"
                    className="font-medium"
                  >
                    {formatShekel(order.cost)}
                  </Typography>
                </div>

                <div className="flex items-center gap-2">
                  <FontAwesomeIcon 
                    icon={order.status === 'Confirmed' ? faCheckCircle : faCircleCheck} 
                    className={`w-5 h-5 ${order.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'}`} 
                  />
                  <Typography 
                    variant="small"
                    className={`font-medium ${order.status === 'Confirmed' ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {order.status === 'Confirmed' ? 'Confirmed' : 'Pending'}
                  </Typography>
                </div>
              </div>

              {order.status === 'New' && (
                <div className="mt-4">
                  <Button
                    variant="gradient"
                    color="green"
                    onClick={() => handleConfirmOrder(order)}
                    className="flex items-center gap-2 w-full justify-center"
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="w-5 h-5" />
                    Confirm Order
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}

      {isCallModalOpen && selectedCustomerPhone && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          phone={selectedCustomerPhone}
        />
      )}
    </div>
  );
};

export default OrderTable;