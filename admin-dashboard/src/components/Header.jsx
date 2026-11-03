import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import { Bell, Menu, Search, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Header = ({ pageTitle, onOpenSidebar, isCollapsed, onToggleCollapse }) => {
    const admin = useAuthStore(state => state.admin);
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchTerm.trim();
        if (query) navigate(`/bookings?search=${encodeURIComponent(query)}`);
    };

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
            // Reviews waiting for approval stay counted until they are moderated
            await fetchStats();
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-700/30 bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                <div className="flex min-w-0 items-center gap-3">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={onOpenSidebar}
                        className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-2 text-slate-300 transition-all duration-300 hover:bg-slate-700/80 hover:text-cyan-400 hover:border-cyan-500/30 lg:hidden active:scale-95 cursor-pointer"
                        aria-label="Open sidebar"
                    >
                        <Menu size={18} />
                    </button>

                    {/* Desktop Sidebar Minimize Toggle */}
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 p-2 text-slate-300 transition-all duration-300 hover:bg-slate-700/80 hover:text-cyan-400 hover:border-cyan-500/30 active:scale-95 cursor-pointer"
                        title={isCollapsed ? "Expand sidebar (Ctrl + B)" : "Minimize sidebar (Ctrl + B)"}
                        aria-label={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>

                    <div className="min-w-0">
                        <p className="truncate text-lg font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">{pageTitle}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-400/80 font-medium">{today}</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} role="search" className="relative hidden w-80 max-w-full xl:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={17} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search bookings, users, emails"
                        aria-label="Search bookings"
                        className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 transition-all duration-300 focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:bg-slate-900/80 hover:border-slate-600/50"
                    />
                </form>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={handleClearNotifications}
                        className="relative rounded-full p-2.5 text-slate-400 transition-all duration-300 hover:bg-slate-800/60 hover:text-cyan-400 hover:rounded-2xl group"
                        title={unreadCount > 0 ? `${unreadCount} unread items` : 'No new notifications'}
                    >
                        <Bell size={20} className="group-hover:scale-110 transition-transform" />
                        {unreadCount > 0 && (
                            <>
                                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 ring-2 ring-slate-950 shadow-lg shadow-cyan-500/50 animate-pulse"></span>
                                <span className="absolute -right-1 -top-1 rounded-full border border-slate-900 bg-gradient-to-r from-cyan-500 to-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-cyan-500/30">
                                    {unreadCount}
                                </span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-3 border-l border-slate-700/50 pl-3 sm:pl-4">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-200">Admin User</p>
                            <p className="max-w-48 truncate text-xs text-slate-400/80">{admin?.email || 'admin@astrosharma.com'}</p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-sm font-bold text-[#fff8e7] ring-2 ring-slate-800 shadow-lg shadow-amber-900/50 hover:ring-amber-400/50 transition-all duration-300" aria-hidden="true">
                            {(admin?.email || 'A').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
