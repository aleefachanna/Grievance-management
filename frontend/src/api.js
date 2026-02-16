import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// This part catches "401 Unauthorized" errors and tries to get a new token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            try {
                const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken,
                });
                localStorage.setItem('access_token', res.data.access);
                return api(originalRequest);
            } catch (err) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;