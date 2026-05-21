import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

// Use this for Login (It has NO interceptor)
export const api = axios.create({
  baseURL: BASE_URL,
});

// Use this for everything else (It HAS the interceptor)
export const pApi = axios.create({
  baseURL: BASE_URL,
});

pApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

pApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data.detail?.includes('Access Denied')) {
       localStorage.clear();
       window.location.href = '/department/login';
    }
    return Promise.reject(error);
  }
);

export default api; // This allows "import api from './api'" to work