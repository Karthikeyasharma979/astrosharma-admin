import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { ArrowLeft, Phone, Mail, Calendar, Clock, CreditCard, HelpCircle, Heart, Loader2, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const { data } = await axios.get(`/admin/bookings/${id}`);
                setBooking(data);
                setSelectedStatus(data.status || 'Pending');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch booking details');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [id]);

    const handleStatusUpdate = async () => {
        setActionLoading(true);
        try {
            const { data } = await axios.put(`/admin/bookings/${id}/status`, { status: selectedStatus });
            setBooking(data);
            setSelectedStatus(data.status || 'Pending');
            showToast(`Status updated to ${selectedStatus}`, 'success');
        } catch (err) {
            showToast('Failed to update status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSendEmail = async () => {
        setActionLoading(true);
        try {
            const { data } = await axios.post(`/admin/bookings/${id}/confirm`);
            showToast(data.message, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send email', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBooking = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this booking?');
        if (!confirmed) return;

        setDeleteLoading(true);
        try {
            await axios.delete(`/admin/bookings/${id}`);
            showToast('Booking deleted successfully', 'success');
            navigate('/bookings');
        } catch (err) {
            showToast('Failed to delete booking', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => navigate('/bookings')} className="btn-primary flex items-center gap-2 mx-auto">
                <ArrowLeft size={18} /> Back to Bookings
            </button>
        </div>
    );

    if (!booking) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <header className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/bookings')}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 italic">Booking Details</h1>
                    <p className="text-slate-400">Order ID: {booking.razorpay_order_id}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* User Profile Card */}
                    <div className="glass-panel p-8">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 border-b border-slate-700/50 pb-6">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/20">
                                {booking.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-100 mb-1">{booking.fullName}</h2>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-1.5"><Phone size={14} className="text-purple-400" /> {booking.phone}</div>
                                    <div className="flex items-center gap-1.5"><Mail size={14} className="text-purple-400" /> {booking.email}</div>
                                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-purple-400" /> Member since {new Date(booking.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-2">
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/20">
                                    {booking.consultationType}
                                </span>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                    booking.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                    booking.status === 'Failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                    {booking.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={16} className="text-slate-500" /> Birth Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/30">
                                        <span className="text-slate-400">Date of Birth</span>
                                        <span className="text-slate-200">{booking.dob || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/30">
                                        <span className="text-slate-400">Time of Birth</span>
                                        <span className="text-slate-200">{booking.birthTime || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/30">
                                        <span className="text-slate-400">Place of Birth</span>
                                        <span className="text-slate-200">{booking.birthPlace || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-slate-700/30">
                                        <span className="text-slate-400">Pincode</span>
                                        <span className="text-slate-200">{booking.pincode || 'N/A'}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <HelpCircle size={16} className="text-slate-500" /> Specific Concern
                                </h3>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-slate-300 text-sm leading-relaxed italic">
                                    "{booking.question || 'No question provided.'}"
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Marriage Matching Section (if applicable) */}
                    {(booking.girlName || booking.boyName) && (
                        <div className="glass-panel p-8">
                            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                                <Heart size={20} className="text-pink-500" /> Marriage Matching Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-700/30 space-y-4">
                                    <h4 className="text-slate-400 font-semibold mb-2">Partner 1 (Girl)</h4>
                                    <div className="space-y-2 text-sm italic">
                                        <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-slate-200">{booking.girlName || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">DOB</span><span className="text-slate-200">{booking.girlDob || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="text-slate-200">{booking.girlTime || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Place</span><span className="text-slate-200">{booking.girlPlace || 'N/A'}</span></div>
                                    </div>
                                </div>
                                <div className="p-6 bg-slate-900/30 rounded-2xl border border-slate-700/30 space-y-4">
                                    <h4 className="text-slate-400 font-semibold mb-2">Partner 2 (Boy)</h4>
                                    <div className="space-y-2 text-sm italic">
                                        <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="text-slate-200">{booking.boyName || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">DOB</span><span className="text-slate-200">{booking.boyDob || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="text-slate-200">{booking.boyTime || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Place</span><span className="text-slate-200">{booking.boyPlace || 'N/A'}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-8">
                    {/* Payment Info Card */}
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CreditCard size={16} className="text-slate-500" /> Payment Information
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <div className="text-xs text-slate-500 mb-1">Amount Paid</div>
                                <div className="text-2xl font-bold text-emerald-400">Rs {booking.price || '501'}</div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs py-1">
                                    <span className="text-slate-500">Transaction ID</span>
                                    <span className="text-slate-300 font-mono italic">{booking.razorpay_payment_id?.slice(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between text-xs py-1">
                                    <span className="text-slate-500">Gateway Status</span>
                                    <span className="text-emerald-400">Verified</span>
                                </div>
                                <div className="flex justify-between text-xs py-1">
                                    <span className="text-slate-500">Completed At</span>
                                    <span className="text-slate-300">
                                        {booking.status === 'Completed'
                                            ? new Date(booking.completedAt || booking.createdAt).toLocaleString()
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="glass-panel p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500/20 shadow-purple-500/5">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 italic">Management Actions</h3>
                        <div className="space-y-3">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                disabled={actionLoading || deleteLoading}
                                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Failed">Failed</option>
                            </select>
                            <button 
                                onClick={handleStatusUpdate}
                                disabled={actionLoading || deleteLoading}
                                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Status'}
                            </button>
                            <button 
                                onClick={handleSendEmail}
                                disabled={actionLoading || deleteLoading}
                                className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium rounded-lg transition-colors border border-purple-500/30 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send Confirmation Email'}
                            </button>
                            <button
                                onClick={handleDeleteBooking}
                                disabled={actionLoading || deleteLoading}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm font-medium rounded-lg transition-colors border border-red-500/30 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                {deleteLoading ? 'Deleting Booking...' : 'Delete Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetail;
