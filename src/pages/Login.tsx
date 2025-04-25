import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import Button from '../components/Button';
import { Input } from '@material-tailwind/react';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title Section */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
              <FontAwesomeIcon icon={faRightToBracket} className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-5xl font-extrabold text-slate-900 tracking-tight">
            سُبل
          </h1>
          <p className="mt-4 text-xl text-slate-600 tracking-wide">
            نظام إدارة الطلبات
          </p>
        </div>

        {/* Login Form Section */}
        <div className="mt-10 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" 
                />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                className="block w-full pr-12 border-slate-200 rounded-xl shadow-sm 
                  focus:ring-primary-500/20 focus:border-primary-500 
                  bg-white/50 backdrop-blur-sm transition-all duration-200"
                label="اسم المستخدم"
                    placeholder="أدخل اسم المستخدم"
                autoComplete="username"
                crossOrigin={undefined}
                  />
                </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <FontAwesomeIcon 
                  icon={faLock} 
                  className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200" 
                />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                className="block w-full pr-12 border-slate-200 rounded-xl shadow-sm 
                  focus:ring-primary-500/20 focus:border-primary-500 
                  bg-white/50 backdrop-blur-sm transition-all duration-200"
                label="كلمة المرور"
                    placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                crossOrigin={undefined}
                  />
              </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                icon={faRightToBracket}
                loading={isLoading}
                disabled={!username || !password}
                className="relative overflow-hidden group bg-gradient-to-br from-primary-500 to-primary-600 
                  hover:from-primary-600 hover:to-primary-700 transition-all duration-300 
                  rounded-xl py-3 shadow-lg hover:shadow-xl 
                  transform hover:-translate-y-0.5"
              >
                <span className="relative z-10 text-lg font-semibold tracking-wide">
                دخول
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                  transform translate-x-[-200%] group-hover:translate-x-[200%] 
                  transition-transform duration-1000">
                </div>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
