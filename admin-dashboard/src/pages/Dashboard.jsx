import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Activity, BookOpen, MessageCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Overview</h1>
                <p className="text-slate-400">Welcome back. Here's what's happening today.</p>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="glass-panel p-6 hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Bookings</p>
                            <h3 className="text-3xl font-bold text-slate-100">{stats?.totals?.bookings || 0}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <BookOpen size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Total Inquiries</p>
                            <h3 className="text-3xl font-bold text-slate-100">{stats?.totals?.contacts || 0}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <MessageCircle size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 hover:translate-y-[-2px] transition-transform duration-300 md:col-span-2 lg:col-span-1 xl:col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">Platform Activity</p>
                            <h3 className="text-xl font-medium text-slate-300 mt-2 flex items-center gap-2">
                                <TrendingUp size={20} className="text-emerald-400" />
                                Stable Growth
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-lg font-semibold text-slate-100">Recent Bookings</h2>
                    </div>
                    <div className="p-0">
                        {stats?.recentActivities?.bookings?.length > 0 ? (
                            <ul className="divide-y divide-slate-800">
                                {stats.recentActivities.bookings.map(book => (
                                    <li 
                                        key={book._id} 
                                        onClick={() => navigate(`/bookings/${book._id}`)}
                                        className="p-6 hover:bg-slate-800/30 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-200">{book.fullName || 'Anonymous'}</p>
                                                <p className="text-sm text-slate-500">{book.consultationType}</p>
                                            </div>
                                            <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                                                {book.status || 'Completed'}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-slate-500">No recent bookings</div>
                        )}
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-lg font-semibold text-slate-100">Recent Inquiries</h2>
                    </div>
                    <div className="p-0">
                        {stats?.recentActivities?.contacts?.length > 0 ? (
                            <ul className="divide-y divide-slate-800">
                                {stats.recentActivities.contacts.map(contact => (
                                    <li key={contact._id} className="p-6 hover:bg-slate-800/30 transition-colors flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                            <span className="text-slate-400 font-medium">
                                                {contact.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-200">{contact.name}</p>
                                            <p className="text-sm text-slate-400 truncate max-w-sm mt-1">{contact.message}</p>
                                            <p className="text-xs text-slate-500 mt-2">{new Date(contact.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-slate-500">No recent inquiries</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
