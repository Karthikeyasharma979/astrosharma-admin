import axios from 'axios';
import useAuthStore from '../store/authStore';

const instance = axios.create({
    baseURL: 'http://localhost:5000/api', // Backend base URL
});

// Request interceptor to attach JWT token
instance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401s globally
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default instance;
