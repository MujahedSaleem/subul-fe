import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { faPlus, faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import Button from '../../components/Button';
import IconButton from '../../components/IconButton';
import { distributorsStore } from '../../store/distributorsStore';
import { Card, CardHeader, CardBody, Typography } from '@material-tailwind/react';

const Distributors: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchAndSubscribe = async () => {
      setIsLoading(true);
      if (!distributorsStore.isLoadingData) {
        await distributorsStore.fetchDistributors();
      }
      const unsubscribe = distributorsStore.subscribe(() => setIsLoading(false));
      return unsubscribe;
    };
    fetchAndSubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموزع؟')) {
      setIsLoading(true);
      await distributorsStore.deleteDistributor(id);
    }
  };

  const columns = [
    { header: 'الاسم', accessor: (distributor) => `${distributor.firstName} ${distributor.lastName}` },
    { header: 'الهاتف', accessor: (distributor) => distributor.phone },
    { header: 'الطلبات', accessor: (distributor) => distributor.orderCount, className: 'hidden md:table-cell' },
    { 
      header: 'الحالة', 
      accessor: (distributor) => (
        <span className={`badge ${distributor.isActive ? 'badge-success' : 'badge-warning'}`}>
          {distributor.isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
      className: 'hidden md:table-cell' 
    },
    { 
      header: 'الإجراءات', 
      accessor: (distributor) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => navigate(`/admin/distributors/edit/${distributor.id}`)} icon={faPenToSquare} title="تعديل" />
          <IconButton onClick={() => handleDelete(distributor.id)} icon={faTrash} variant="danger" title="حذف" />
        </div>
      ),
      className: 'w-32' 
    }
  ];

  return (
    <Layout title="الموزعون">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none flex justify-between items-center">
          <Typography variant="h6" color="blue-gray">الموزعون</Typography>
          <Button variant="gradient" onClick={() => navigate('/admin/distributors/add')} className="flex items-center gap-2">
            إضافة موزع
          </Button>
        </CardHeader>
        
        {isLoading ? (
          <CardBody className="text-center py-8">
            <Typography variant="h6" color="blue-gray">جاري التحميل...</Typography>
          </CardBody>
        ) : (
          <CardBody className="overflow-scroll px-0">
            <table className="w-full min-w-max table-auto text-left">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.header} className={`${column.className} p-4 border-b border-blue-gray-100`}>
                      <Typography variant="small" color="blue-gray" className="font-normal leading-none opacity-70">
                        {column.header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributorsStore.distributors.map((distributor) => (
                  <tr key={distributor.id}>
                    {columns.map((column) => (
                      <td key={column.header} className={`${column.className} p-4`}>{column.accessor(distributor)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        )}
      </Card>
    </Layout>
  );
};

export default Distributors;
