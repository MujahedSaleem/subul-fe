import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IconButton from '../../components/IconButton';
import { useCustomers } from '../../hooks/useCustomers';
import { useAppDispatch } from '../../store/hooks';
import { showSuccess, showError } from '../../store/slices/notificationSlice';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';
import Loader from '../../components/admin/shared/Loader';
import CustomerFilters from '../../components/CustomerFilters';
import Pagination from '../../components/Pagination';


const Customers: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { 
    loading, 
    deleteCustomer, 
    filteredCustomers,
    totalCount,
    totalPages,
    filterCustomers
  } = useCustomers();
  
  // Filter state similar to Orders page
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    name: '',
    isActive: null as boolean | null,
    createdAfter: '',
    createdBefore: '',
    page: 1,
    pageSize: 10
  });
  
  // Memoize filter parameters to prevent unnecessary re-renders
  const filterParams = useMemo(() => ({
    name: filters.name || undefined,
    isActive: filters.isActive !== null ? filters.isActive : undefined,
    createdAfter: filters.createdAfter || undefined,
    createdBefore: filters.createdBefore || undefined,
    page: filters.page,
    pageSize: filters.pageSize
  }), [filters.name, filters.isActive, filters.createdAfter, filters.createdBefore, filters.page, filters.pageSize]);

  // Fetch customers when filter parameters change (like Orders page)
  useEffect(() => {
    filterCustomers(filterParams);
  }, [filterParams, filterCustomers]);

  // Refresh data when returning to this page from edit
  useEffect(() => {
    if (location.pathname === '/admin/customers' && location.state?.shouldRefresh) {
      filterCustomers(filterParams);
      // Clear the state to prevent unnecessary refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location, filterParams, filterCustomers]);

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await deleteCustomer(id).unwrap();
        // The Redux reducer will automatically remove the customer from state
        dispatch(showSuccess({ message: 'تم حذف العميل بنجاح' }));
        
        // Refresh the current view after deletion
        filterCustomers(filterParams);
      } catch (error: any) {
        console.error("Error deleting customer:", error);
        dispatch(showError({ 
          message: error.message || 'فشل في حذف العميل',
          title: 'خطأ في الحذف'
        }));
      }
    }
  };

  const resetFilters = useCallback(() => {
    setFilters({
      name: '',
      isActive: null,
      createdAfter: '',
      createdBefore: '',
      page: 1,
      pageSize: 10
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 })); // Reset to first page when changing page size
  }, []);

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
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
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
            
            {/* Add Button Section */}
            <div className="flex justify-end">
              <button 
                onClick={() => navigate('/admin/customers/add')} 
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span className="hidden sm:inline">إضافة عميل</span>
                <span className="sm:hidden">إضافة</span>
              </button>
            </div>
            
            {/* Filter Component */}
            <CustomerFilters
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              customerName={filters.name}
              setCustomerName={(value) => setFilters(prev => ({ ...prev, name: value, page: 1 }))}
              isActive={filters.isActive}
              setIsActive={(value) => setFilters(prev => ({ ...prev, isActive: value, page: 1 }))}
              createdAfter={filters.createdAfter}
              setCreatedAfter={(value) => setFilters(prev => ({ ...prev, createdAfter: value, page: 1 }))}
              createdBefore={filters.createdBefore}
              setCreatedBefore={(value) => setFilters(prev => ({ ...prev, createdBefore: value, page: 1 }))}
              resetFilters={resetFilters}
            />
          </div>
        </CardHeader>
        
        {loading ? (
          <CardBody 
            className="text-center py-12"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <Loader />
          </CardBody>
        ) : (
          <CardBody 
            className="overflow-auto px-6"
            placeholder=""
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Typography 
                  variant="h6" 
                  color="blue-gray"
                  className="font-medium"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  لا يوجد عملاء
                </Typography>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="mt-2"
                  placeholder={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                >
                  لا توجد عملاء مطابقين للفلترة
                </Typography>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCustomers.map((customer) => (
                  <Card
                    key={customer.id}
                    className="hover:shadow-lg transition-shadow duration-300"
                    placeholder=""
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                  >
                    <CardHeader
                      floated={false}
                      shadow={false}
                      className="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4"
                      placeholder=""
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    >
                      <Typography
                        variant="h5"
                        color="white"
                        className="font-bold"
                        placeholder={undefined}
                        onPointerEnterCapture={undefined}
                        onPointerLeaveCapture={undefined}
                      >
                        {customer.name}
                      </Typography>
                    </CardHeader>
                    <CardBody
                      className="p-4"
                      placeholder={undefined}
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faPhone} className="text-slate-400" />
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium"
                            placeholder={undefined}
                            onPointerEnterCapture={undefined}
                            onPointerLeaveCapture={undefined}
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
                              placeholder={undefined}
                              onPointerEnterCapture={undefined}
                              onPointerLeaveCapture={undefined}
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
                                  placeholder={undefined}
                                  onPointerEnterCapture={undefined}
                                  onPointerLeaveCapture={undefined}
                                >
                                  {location.name}
                                </Typography>
                                <Typography
                                  variant="small"
                                  color="blue-gray"
                                  className="text-xs mt-1"
                                  placeholder={undefined}
                                  onPointerEnterCapture={undefined}
                                  onPointerLeaveCapture={undefined}
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
                
                {/* Pagination */}
                { (
                  <Pagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                    pageSize={filters.pageSize}
                    totalItems={totalCount}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
              </>
            )}
          </CardBody>
        )}
      </Card>
    </Layout>
  );
};

export default Customers;
