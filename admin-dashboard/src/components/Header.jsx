import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import { Bell, Search } from 'lucide-react';

const Header = () => {
    const admin = useAuthStore(state => state.admin);
    const [unreadCount, setUnreadCount] = useState(0);

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
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
            {/* Search Bar */}
            <div className="relative w-96 max-w-full hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search bookings, users..." 
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
            </div>

            {/* Right Context */}
            <div className="flex items-center gap-6 ml-auto">
                <button 
                    onClick={handleClearNotifications}
                    className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800 group"
                    title={unreadCount > 0 ? `${unreadCount} unread items` : 'No new notifications'}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <>
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-500 rounded-full ring-2 ring-slate-900 shadow-sm shadow-purple-500/50 animate-pulse"></span>
                            <span className="absolute -top-1 -right-1 bg-purple-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full border border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                                {unreadCount}
                            </span>
                        </>
                    )}
                </button>
                
                <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-200">Admin User</p>
                        <p className="text-xs text-slate-500">{admin?.email || 'admin@astrosharma.com'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 ring-2 ring-slate-800 overflow-hidden shadow-md">
                        <img src={`https://ui-avatars.com/api/?name=${admin?.email || 'A'}&background=random&color=fff`} alt="Admin" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
