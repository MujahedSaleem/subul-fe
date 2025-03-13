import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRightFromBracket, 
  faBars, 
  faXmark, 
  faGauge, 
  faUsers, 
  faBox, 
  faUserCheck, 
  faTriangleExclamation 
} from '@fortawesome/free-solid-svg-icons';
import Button from './Button';
import IconButton from './IconButton';
import { useError } from "../context/ErrorContext";
import { useAuth } from "../context/AuthContext"; // ✅ Import AuthContext

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { state, dispatch } = useError(); // ✅ Get global error state
  const { logout } = useAuth(); // ✅ Get logoutUser function from AuthContext

  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle logout by calling logoutUser function from AuthContext
  const handleLogout = () => {
    logout(); // Call logoutUser from AuthContext to handle logout logic
    navigate('/login'); // Redirect to login page after logging out
  };

  const menuItems = isAdmin ? [
    { path: '/admin', label: 'لوحة التحكم', icon: faGauge },
    { path: '/admin/customers', label: 'العملاء', icon: faUsers },
    { path: '/admin/orders', label: 'الطلبات', icon: faBox },
    { path: '/admin/distributors', label: 'الموزعون', icon: faUserCheck },
  ] : [
    { path: '/distributor/orders', label: 'الطلبات', icon: faBox },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-64 bg-white shadow-lg z-30 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-100">
            <span className="text-2xl font-bold text-primary-500">سُبل</span>
            <IconButton 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
              icon={faXmark}
              variant="tertiary"
            />
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                  location.pathname === item.path ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className={`h-5 w-5 ${location.pathname === item.path ? 'text-primary-500' : 'text-slate-400'}`} 
                />
                <span className="mr-3 font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <Button
              onClick={handleLogout} // Use handleLogout to logout
              variant="danger"
              icon={faRightFromBracket}
              block
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:mr-64' : 'mr-0 lg:mr-64'}`}>
        <header className="bg-white shadow-sm h-16 fixed left-0 right-0 top-0 z-20 lg:right-64">
          <div className="px-4 lg:px-8 h-full flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-semibold text-slate-800">{title}</h1>
            <IconButton 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
              icon={faBars}
              variant="tertiary"
            />
          </div>
        </header>
        
        <main className="pt-20 px-4 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            {state.message && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-red-500" />
                  <span>{state.message}</span>
                </div>
                <IconButton icon={faXmark} onClick={() => dispatch({ type: "CLEAR_ERROR" })}  variant="danger" rounded />
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
