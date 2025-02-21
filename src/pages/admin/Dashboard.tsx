import React from 'react';
import Layout from '../../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBox, faUserCheck } from '@fortawesome/free-solid-svg-icons';

const AdminDashboard: React.FC = () => {
  const stats = [
    {
      title: 'إجمالي العملاء',
      value: '2,543',
      icon: faUsers,
      change: '+12.5%',
      changeType: 'increase'
    },
    {
      title: 'الطلبات النشطة',
      value: '185',
      icon: faBox,
      change: '+8.2%',
      changeType: 'increase'
    },
    {
      title: 'الموزعون',
      value: '48',
      icon: faUserCheck,
      change: '+2.3%',
      changeType: 'increase'
    }
  ];

  return (
    <Layout title="لوحة التحكم">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item, index) => (
          <div
            key={index}
            className="card p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FontAwesomeIcon icon={item.icon} className="h-6 w-6 text-slate-400" />
              </div>
              <div className="mr-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-500 truncate">
                    {item.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-slate-900">
                      {item.value}
                    </div>
                    <div className={`mr-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'increase' ? 'text-secondary-green' : 'text-red-600'
                    }`}>
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">
            النشاط الأخير
          </h3>
          <div className="mt-5">
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-slate-200">
                {[1, 2, 3].map((item) => (
                  <li key={item} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FontAwesomeIcon icon={faBox} className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          طلب جديد #{1000 + item}
                        </p>
                        <p className="text-sm text-slate-500">
                          تم إنشاؤه بواسطة الموزع #{item}
                        </p>
                      </div>
                      <div>
                        <span className="badge badge-success">
                          جديد
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;