import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import Button from '../components/Button';
import { Input } from '@material-tailwind/react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth(); // Destructure the login method and loading state from context
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Local loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true while logging in

    try {
      await login(username, password); // Call login method from AuthContext
      // After successful login, redirect user based on their role
      const userType = localStorage.getItem("userType");
      if (userType === 'Admin') {
        navigate("/admin");
      } else if (userType === 'Distributor') {
        navigate("/distributor");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false); // Set loading to false after the login attempt
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-6">
      <div className="w-[420px] mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-primary-500 rounded-lg">
            <FontAwesomeIcon icon={faRightToBracket} className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-slate-900">
            سُبل
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            نظام إدارة الطلبات
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl">
          <form className="p-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                  اسم المستخدم
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pr-10 pl-3 py-2.5 border border-slate-200 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    placeholder="أدخل كلمة المرور"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                icon={faRightToBracket}
                loading={isLoading}
                disabled={!username || !password}
              >
                دخول
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
