import { useEffect, useMemo, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../store/authStore';

const Layout = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith('/bookings/')) return 'Booking Details';

        const titleMap = {
            '/': 'Dashboard Overview',
            '/bookings': 'Bookings',
            '/contacts': 'Customer Inquiries',
        };

        return titleMap[location.pathname] || 'Admin Panel';
    }, [location.pathname]);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]"></div>
                <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-blue-500/10 blur-[110px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.1),rgba(2,6,23,0.8))]"></div>
            </div>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
                <Header
                    pageTitle={pageTitle}
                    onOpenSidebar={() => setSidebarOpen(true)}
                />

                <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-4 sm:px-6 lg:px-10 lg:pt-6">
                    <div className="mx-auto w-full max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
