import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import { Bell, Menu, Search } from 'lucide-react';

const Header = ({ pageTitle, onOpenSidebar }) => {
    const admin = useAuthStore(state => state.admin);
    const [unreadCount, setUnreadCount] = useState(0);

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });

    const fetchStats = async () => {
        try {
            const { data } = await axios.get('/admin/stats');
            setUnreadCount(data.totals?.unreadTotal || 0);
        } catch (error) {
            console.error("Failed to fetch notification count", error);
        }
    };

    useEffect(() => {
        fetchStats();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClearNotifications = async () => {
        try {
            await axios.put('/admin/notifications/read');
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        onClick={onOpenSidebar}
                        className="rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
                        aria-label="Open sidebar"
                    >
                        <Menu size={18} />
                    </button>

                    <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-100">{pageTitle}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{today}</p>
                    </div>
                </div>

                <div className="relative hidden w-80 max-w-full xl:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                    <input
                        type="text"
                        placeholder="Search bookings, users, emails"
                        className="w-full rounded-full border border-slate-700/70 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 transition-all focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                    />
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={handleClearNotifications}
                        className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
                        title={unreadCount > 0 ? `${unreadCount} unread items` : 'No new notifications'}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <>
                                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950 shadow-sm shadow-cyan-500/50 animate-pulse"></span>
                                <span className="absolute -right-1 -top-1 rounded-full border border-slate-900 bg-cyan-500 px-1.5 py-0.5 text-[10px] font-semibold text-slate-950">
                                    {unreadCount}
                                </span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-2 border-l border-slate-700 pl-3 sm:pl-4">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-slate-200">Admin User</p>
                            <p className="max-w-48 truncate text-xs text-slate-500">{admin?.email || 'admin@astrosharma.com'}</p>
                        </div>
                        <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 ring-2 ring-slate-900 shadow-md shadow-cyan-900/40">
                            <img src={`https://ui-avatars.com/api/?name=${admin?.email || 'A'}&background=random&color=fff`} alt="Admin" className="h-full w-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
