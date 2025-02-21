import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket, faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import  {jwtDecode} from 'jwt-decode';
import Button from '../components/Button';
import axiosInstance from '../utils/axiosInstance';
import { Input } from '@material-tailwind/react';

interface DecodedToken {
  sub: string;
  jti: string;
  role: string;
  exp: number;
  iss: string;
  aud: string;
  unique_name: string;
  nbf: number;
  iat: number;
  
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      });
  
      const data = response.data;
  
      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
  
      // Decode JWT to get userType
      const decodedToken: DecodedToken = jwtDecode<DecodedToken>(data.accessToken);
      console.log(decodedToken)
      const userType = decodedToken.role;
  
      localStorage.setItem("userType", userType.toString());
  
      // Redirect based on user type
      if (userType === 'Admin') {
        navigate("/admin");
      } else if (userType === 'Distributor') {
        navigate("/distributor");
      } 
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
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
                loading={loading}
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
