import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../store/authStore';

const Layout = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
                {/* Background decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-10 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
