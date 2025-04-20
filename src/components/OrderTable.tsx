import React from 'react';
import { faPhone, faLocationDot, faCircleCheck, faTrash, faPenToSquare, faEye, faUser, faCalendar, faMoneyBill, faCheckCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { Card, CardBody, Typography as MuiTypography } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { OrderList } from '../types/order';
import { Customer, Location } from '../types/customer';
import IconButton from './IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

  // Add detailed logging
  console.log('Orders in OrderTable:', JSON.stringify(orders, null, 2));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {orders.map((order) => {
        // Log each order's distributor details
        console.log('Order ID:', order.id);
        console.log('Distributor details:', {
          id: order.distributor?.id,
          userName: order.distributor?.userName,
          firstName: order.distributor?.firstName,
          lastName: order.distributor?.lastName,
          phone: order.distributor?.phone
        });
        
        return (
          <div key={order.id} className="flex flex-col gap-2">
            <div className="flex gap-2 justify-end">
              <Button
                variant="outlined"
                color="blue"
                onClick={() => handleOpenLocation(order.location)}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4" />
                View Location
              </Button>
              <Button
                variant="outlined"
                color="blue"
                onClick={() => handleCallCustomer(order.customer)}
                className="flex items-center gap-2 text-sm"
                size="sm"
              >
                <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                Call Customer
              </Button>
            </div>

            <Card 
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
                      size="sm"
                      title="View Order"
                    />
                    {order.status !== 'Confirmed' && (
                      <>
                        <IconButton
                          icon={faPenToSquare}
                          onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                          color="blue"
                          className="hover:bg-blue-100"
                          size="sm"
                          title="Edit Order"
                        />
                        <IconButton
                          icon={faTrash}
                          onClick={() => handleDelete(order.id)}
                          color="red"
                          className="hover:bg-red-100"
                          size="sm"
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
                    <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-blue-600" />
                    <div>
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
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 text-indigo-600" />
                    <div>
                      <Typography 
                        variant="small"
                        className="font-medium"
                      >
                        {order.distributor ? (
                          <span>
                            {order.distributor.firstName} {order.distributor.lastName}
                          </span>
                        ) : (
                          'No distributor assigned'
                        )}
                      </Typography>
                      {order.distributor?.phone && (
                        <Typography 
                          variant="small"
                          className="text-gray-600"
                        >
                          {order.distributor.phone}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-green-600" />
                    <Typography 
                      variant="small"
                      className="font-medium"
                    >
                      {order.location?.name}
                    </Typography>
                  </div>

                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faMoneyBill} className="w-4 h-4 text-purple-600" />
                    <Typography 
                      variant="small"
                      className="font-medium"
                    >
                      {formatCurrency(order.cost)}
                    </Typography>
                  </div>

                  {order.confirmedAt && (
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-green-600" />
                      <div>
                        <Typography 
                          variant="small"
                          className="font-medium"
                        >
                          Confirmed
                        </Typography>
                        <Typography 
                          variant="small"
                          className="text-gray-600"
                        >
                          {formatDate(order.confirmedAt)}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>

                {order.status === 'New' && (
                  <div className="mt-4">
                    <Button
                      variant="gradient"
                      color="green"
                      onClick={() => handleConfirmOrder(order)}
                      className="flex items-center gap-2 w-full justify-center"
                    >
                      <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                      Confirm Order
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTable;