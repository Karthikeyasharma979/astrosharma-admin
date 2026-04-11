import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Search, Filter, Calendar as CalendarIcon, Phone, Mail, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';

const Bookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
    // Date/Month filter states
    const [filterMonth, setFilterMonth] = useState(''); // format: 'YYYY-MM'
    const [filterStartDate, setFilterStartDate] = useState(''); // format: 'YYYY-MM-DD'
    const [filterEndDate, setFilterEndDate] = useState(''); // format: 'YYYY-MM-DD'

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

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
        const bookingStatus = b.status || 'Pending';
        const matchesStatus = filterStatus === 'All' ? true : bookingStatus === filterStatus;

        // Date filtering logic
        let matchesDate = true;
        if (filterMonth) {
            // booking.createdAt is ISO string, filterMonth is 'YYYY-MM'
            matchesDate = b.createdAt && b.createdAt.startsWith(filterMonth);
        }
        if (filterStartDate && filterEndDate) {
            const created = new Date(b.createdAt);
            const start = new Date(filterStartDate);
            const end = new Date(filterEndDate);
            // Set end to end of day
            end.setHours(23,59,59,999);
            matchesDate = created >= start && created <= end;
        }

        return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    const statusCounts = bookings.reduce(
        (acc, booking) => {
            const status = booking.status || 'Pending';
            if (status === 'Pending') acc.pending += 1;
            if (status === 'Completed') acc.completed += 1;
            if (status === 'Failed') acc.failed += 1;
            return acc;
        },
        { pending: 0, completed: 0, failed: 0 }
    );

    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString();
    };

    const handleStatusChange = async (bookingId, status) => {
        setUpdatingId(bookingId);
        try {
            const { data } = await axios.put(`/admin/bookings/${bookingId}/status`, { status });
            setBookings(prev => prev.map((booking) => (booking._id === bookingId ? data : booking)));
            showToast(`Status changed to ${status}`, 'success');
        } catch (error) {
            console.error('Failed to update booking status', error);
            showToast('Failed to update booking status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        const confirmed = window.confirm('Are you sure you want to delete this booking?');
        if (!confirmed) return;

        setDeletingId(bookingId);
        try {
            await axios.delete(`/admin/bookings/${bookingId}`);
            setBookings(prev => prev.filter((booking) => booking._id !== bookingId));
            showToast('Booking deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete booking', error);
            showToast('Failed to delete booking', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Consultation Bookings</h1>
                    <p className="text-slate-400">Manage and view all client bookings.</p>
                </div>
                
                                <div className="w-full">
                                    <div className="glass-panel flex flex-wrap items-center gap-4 p-4 rounded-2xl border border-purple-500/10 bg-gradient-to-br from-slate-900/60 to-slate-800/80 shadow-lg">
                                        {/* Search */}
                                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search by name, email, phone..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full py-2 pl-10 pr-3 rounded-xl text-sm bg-slate-800 border border-purple-500/20 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition"
                                            />
                                        </div>
                                        {/* Type */}
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="bg-slate-800 border border-purple-500/20 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500/40 min-w-[120px]"
                                        >
                                            <option value="All">All Types</option>
                                            <option value="General">General</option>
                                            <option value="Marriage Matching">Marriage Matching</option>
                                            <option value="Muhurtham">Muhurtham</option>
                                        </select>
                                        {/* Status */}
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="bg-slate-800 border border-purple-500/20 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500/40 min-w-[120px]"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Failed">Failed</option>
                                        </select>
                                        {/* Divider */}
                                        <span className="hidden sm:inline-block h-8 w-px bg-slate-700 mx-2"></span>
                                        {/* Month filter */}
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={18} className="text-purple-400" />
                                            <input
                                                type="month"
                                                value={filterMonth}
                                                onChange={e => {
                                                    setFilterMonth(e.target.value);
                                                    setFilterStartDate('');
                                                    setFilterEndDate('');
                                                }}
                                                className="bg-slate-800 border border-purple-500/20 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500/40 min-w-[120px]"
                                                title="Filter by month"
                                            />
                                        </div>
                                        {/* Date range filter */}
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={18} className="text-purple-400" />
                                            <input
                                                type="date"
                                                value={filterStartDate}
                                                onChange={e => {
                                                    setFilterStartDate(e.target.value);
                                                    setFilterMonth('');
                                                }}
                                                className="bg-slate-800 border border-purple-500/20 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500/40 min-w-[120px]"
                                                title="Start date"
                                            />
                                            <span className="text-slate-400 text-xs">to</span>
                                            <input
                                                type="date"
                                                value={filterEndDate}
                                                onChange={e => {
                                                    setFilterEndDate(e.target.value);
                                                    setFilterMonth('');
                                                }}
                                                className="bg-slate-800 border border-purple-500/20 text-slate-200 text-sm rounded-xl py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500/40 min-w-[120px]"
                                                title="End date"
                                            />
                                        </div>
                                        {/* Clear filters button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFilterMonth('');
                                                setFilterStartDate('');
                                                setFilterEndDate('');
                                            }}
                                            className="px-3 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-purple-600/30 border border-purple-500/20 transition"
                                        >Clear Dates</button>
                                    </div>
                                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="glass-panel p-4 border-yellow-500/20">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{statusCounts.pending}</p>
                </div>
                <div className="glass-panel p-4 border-emerald-500/20">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{statusCounts.completed}</p>
                </div>
                <div className="glass-panel p-4 border-red-500/20">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Failed</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{statusCounts.failed}</p>
                </div>
            </div>

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
                                <th className="p-4 font-medium text-sm text-slate-400">Completed At</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Created At</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-500">Loading bookings...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-slate-500">No bookings found</td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr
                                        key={booking._id}
                                        tabIndex={0}
                                        aria-label={`Booking for ${booking.fullName || 'N/A'}`}
                                        onClick={() => navigate(`/bookings/${booking._id}`)}
                                        onKeyDown={e => { if (e.key === 'Enter') navigate(`/bookings/${booking._id}`); }}
                                        className="group cursor-pointer transition-all duration-200 hover:bg-purple-950/30 focus-within:ring-2 focus-within:ring-purple-500/40"
                                        style={{ outline: 'none' }}
                                    >
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200 group-hover:text-purple-300 transition-colors duration-150">
                                                {booking.fullName || 'N/A'}
                                            </div>
                                            {booking.dob && (
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <CalendarIcon size={12} />{booking.dob}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 group-hover:shadow-lg transition-transform duration-150">
                                                {booking.consultationType}
                                            </span>
                                        </td>
                                        <td className="p-4 space-y-1 text-sm">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Phone size={14} className="text-slate-500" />
                                                {booking.phone}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Mail size={14} className="text-slate-500" />
                                                {booking.email}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-mono text-slate-400">
                                            {booking.razorpay_order_id?.slice(0, 14)}...
                                        </td>
                                        <td className="p-4">
                                            {/* Animated status badge with icon */}
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200
                                                        ${booking.status === 'Completed'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : booking.status === 'Failed'
                                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                                                        group-hover:scale-105 group-hover:shadow-lg animate-fadeIn`}
                                                    aria-label={`Status: ${booking.status}`}
                                                >
                                                    {booking.status === 'Completed' && <span aria-hidden="true">✔️</span>}
                                                    {booking.status === 'Pending' && <span aria-hidden="true">⏳</span>}
                                                    {booking.status === 'Failed' && <span aria-hidden="true">❌</span>}
                                                    {booking.status}
                                                </span>
                                                <select
                                                    value={booking.status || 'Pending'}
                                                    disabled={updatingId === booking._id}
                                                    onClick={e => e.stopPropagation()}
                                                    onChange={e => handleStatusChange(booking._id, e.target.value)}
                                                    aria-label="Change status"
                                                    className="ml-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg py-1.5 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-60"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Failed">Failed</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {booking.status === 'Completed'
                                                ? formatDateTime(booking.completedAt || booking.createdAt)
                                                : 'N/A'}
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 text-right">
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleDeleteBooking(booking._id)}
                                                disabled={deletingId === booking._id}
                                                aria-label="Delete booking"
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-all duration-150 hover:bg-red-500/20 focus:ring-2 focus:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                                            >
                                                <Trash2 size={14} />
                                                {deletingId === booking._id ? 'Deleting...' : 'Delete'}
                                            </button>
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
