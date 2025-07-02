import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash, faSearch, faSpinner, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { useCustomers } from '../../hooks/useCustomers';
import { Card, CardHeader, CardBody, Typography, Input } from '@material-tailwind/react';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, loading, fetchCustomers, deleteCustomer, refreshCustomers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  useEffect(() => {
    fetchCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Refresh data when returning to this page from edit
  useEffect(() => {
    // If we're on the customers page and there's state indicating we should refresh
    if (location.pathname === '/admin/customers' && location.state?.shouldRefresh) {
      refreshCustomers();
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location, refreshCustomers]);

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await deleteCustomer(id);
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <Layout title="العملاء">
      <Card 
        className="h-full w-full shadow-lg"
        placeholder=""
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
      >
        <CardHeader 
          floated={false} 
          shadow={false} 
          className="rounded-none bg-white p-6"
          placeholder=""
          
          
        >
          <div className="flex flex-col gap-4">
            {/* Title Section */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                العملاء
              </h1>
              <p className="text-sm text-gray-600">
                إدارة العملاء وإضافة عملاء جدد
              </p>
            </div>
            
            {/* Search and Add Button Section */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="بحث عن عميل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                  />
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                </div>
              </div>
              <button 
                onClick={() => navigate('/admin/customers/add')} 
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden sm:inline">إضافة عميل</span>
                <span className="sm:hidden">إضافة</span>
              </button>
            </div>
          </div>
        </CardHeader>
        
        {loading ? (
          <CardBody 
            className="text-center py-12"
            placeholder=""
            
            
          >
            <div className="flex flex-col items-center gap-4">
              <FontAwesomeIcon 
                icon={faSpinner} 
                className="h-8 w-8 text-blue-500 animate-spin" 
              />
              <Typography 
                variant="h6" 
                color="blue-gray"
                className="font-medium"
                placeholder=""
                
                
              >
                جاري تحميل البيانات...
              </Typography>
            </div>
          </CardBody>
        ) : (
          <CardBody 
            className="overflow-auto px-6"
            placeholder=""
            
            
          >
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Typography 
                  variant="h6" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder=""
                  
                  
                >
                  لا يوجد عملاء
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mt-2"
                  placeholder=""
                  
                  
                >
                  {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'قم بإضافة عميل جديد'}
                </Typography>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="hover:shadow-lg transition-shadow duration-300"
                    placeholder=""
                    
                    
                  >
                    <CardHeader
                      floated={false}
                      shadow={false}
                      className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4"
                      placeholder=""
                      
                      
                    >
                      <Typography
                        variant="h5"
                        color="white"
                        className="font-bold"
                        placeholder=""
                        
                        
                      >
                        {customer.name}
                      </Typography>
                    </CardHeader>
                    <CardBody
                      className="p-4"
                      placeholder=""
                      
                      
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-slate-400" />
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium"
                            placeholder=""
                            
                            
                          >
                            {customer.phone}
                          </Typography>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faLocationDot} className="text-slate-400" />
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-medium"
                              placeholder=""
                              
                              
                            >
                              المواقع
                            </Typography>
                          </div>
                          <div className="space-y-2">
                            {customer.locations.map((location, index) => (
                              <div
                                key={index}
                                className="bg-slate-50 rounded-lg p-3"
                              >
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="font-medium"
                                  placeholder=""
                                  
                                  
                                >
                                  {location.name}
                                </Typography>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="text-xs mt-1"
                                  placeholder=""
                                  
                                  
                                >
                                  {location.coordinates}
                                </Typography>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                          <IconButton 
                            onClick={() => navigate(`/admin/customers/edit/${customer.id}`)} 
                            icon={faPenToSquare} 
                            title="تعديل"
                            className="hover:bg-blue-50 text-blue-600"
                          />
                          <IconButton 
                            onClick={() => handleDelete(customer.id)} 
                            icon={faTrash} 
                            variant="danger" 
                            title="حذف"
                            className="hover:bg-red-50"
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        )}
      </Card>
    </Layout>
  );
};

export default Customers;
