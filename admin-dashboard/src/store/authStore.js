import { create } from 'zustand';

// Try to retrieve existing token from localStorage
const storedToken = localStorage.getItem('token');
const storedAdmin = JSON.parse(localStorage.getItem('admin'));

const useAuthStore = create((set) => ({
    admin: storedAdmin || null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,

    login: (adminData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('admin', JSON.stringify(adminData));
        set({ admin: adminData, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        set({ admin: null, token: null, isAuthenticated: false });
    }
}));

export default useAuthStore;
