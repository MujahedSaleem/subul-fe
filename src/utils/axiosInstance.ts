import axios from "axios";

// Read API base URL from Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log("API Base URL:", API_BASE_URL);

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent if needed
});

// ✅ Prevent multiple redirects by using a flag
let isRedirecting = false;

// ✅ Request Interceptor - Add Authorization Header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.url !== "/auth/login") {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response Interceptor - Handle Unauthorized & Redirects
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, request } = error.response;
      const redirectUrl = request?.responseURL;

      // Check if already on the login page to prevent infinite loop
      if (window.location.pathname === "/login") {
        return Promise.reject(error);
      }

      // Detect backend redirecting to `/Account/Login`
      if ((status === 302 || status === 404) && redirectUrl?.includes("/Account/Login")) {
        console.warn("Unauthorized - Redirecting to /login");

        if (!isRedirecting) {
          isRedirecting = true;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userType");
          window.location.href = "/login";
        }
      }

      // Handle standard 401 Unauthorized
      if (status === 401) {
        console.warn("401 Unauthorized - Redirecting to login");

        if (!isRedirecting) {
          isRedirecting = true;
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userType");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
