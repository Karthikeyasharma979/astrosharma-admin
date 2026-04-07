import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Search, Filter, Calendar as CalendarIcon, Phone, Mail } from 'lucide-react';

const Bookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await axios.get('/admin/bookings');
                setBookings(data);
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (b.fullName || '').toLowerCase().includes(query) || 
                              (b.email || '').toLowerCase().includes(query) ||
                              (b.phone || '').toLowerCase().includes(query) ||
                              (b.dob || '').toLowerCase().includes(query) ||
                              (b.consultationType || '').toLowerCase().includes(query) ||
                              (b.razorpay_order_id || '').toLowerCase().includes(query);
        const matchesType = filterType === 'All' ? true : b.consultationType === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Consultation Bookings</h1>
                    <p className="text-slate-400">Manage and view all client bookings.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field py-2 pl-9 rounded-xl text-sm"
                        />
                    </div>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="All">All Types</option>
                        <option value="General">General</option>
                        <option value="Marriage Matching">Marriage Matching</option>
                        <option value="Muhurtham">Muhurtham</option>
                    </select>
                </div>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                <th className="p-4 font-medium text-sm text-slate-400">Client</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Type</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Contact</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Order ID</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Status</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading bookings...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No bookings found</td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr 
                                        key={booking._id} 
                                        onClick={() => navigate(`/bookings/${booking._id}`)}
                                        className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200">{booking.fullName || 'N/A'}</div>
                                            {booking.dob && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><CalendarIcon size={12}/>{booking.dob}</div>}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                {booking.consultationType}
                                            </span>
                                        </td>
                                        <td className="p-4 space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Phone size={14} className="text-slate-500" />
                                                {booking.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Mail size={14} className="text-slate-500"/>
                                                {booking.email}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-400">
                                            {booking.razorpay_order_id?.slice(0, 14)}...
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                booking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                booking.status === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                            }`}>
                                                {booking.status || 'Completed'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 text-right">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Bookings;
