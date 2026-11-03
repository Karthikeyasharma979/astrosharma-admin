import { useEffect, useMemo, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../store/authStore';

const Layout = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem('astro_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });
    const location = useLocation();

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const next = !prev;
            try {
                localStorage.setItem('astro_sidebar_collapsed', String(next));
            } catch (err) {
                console.error('Failed to save sidebar state', err);
            }
            return next;
        });
    };

    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith('/bookings/')) return 'Booking Details';

        const titleMap = {
            '/': 'Dashboard Overview',
            '/bookings': 'Bookings',
            '/contacts': 'Customer Inquiries',
            '/reviews': 'Reviews & Moderation',
            '/coupons': 'Coupons',
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
        <div className="relative flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* Gradient orbs */}
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/10 blur-[140px] animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-[#fff8e7]/15 to-amber-500/10 blur-[140px] animate-pulse" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-1/2 left-1/2 h-80 w-80 rounded-full bg-gradient-to-br from-amber-500/10 to-cyan-500/5 blur-[120px]"></div>
                
                {/* Grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(15,23,42,0.3)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                
                {/* Radial gradient overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.1),rgba(59,130,246,0.05),rgba(2,6,23,0.95))]"></div>
            </div>

            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            <div className="relative z-10 flex min-h-screen flex-1 flex-col overflow-hidden">
                <Header
                    pageTitle={pageTitle}
                    onOpenSidebar={() => setSidebarOpen(true)}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={toggleCollapse}
                />

                <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-10 lg:pt-8">
                    <div className="mx-auto w-full max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
