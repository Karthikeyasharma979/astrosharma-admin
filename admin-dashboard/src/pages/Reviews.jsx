import { useState, useEffect, useCallback } from 'react';
import axios from '../utils/axios';
import {
    Star,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    Edit3,
    Search,
    Plus,
    Filter,
    RefreshCw,
    Check,
    Eye,
    EyeOff,
    Clock,
    User,
    Mail,
    Phone,
    Calendar,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import Toast from '../components/Toast';

const Reviews = () => {
    // State management
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        flagged: 0,
        rejected: 0,
        verified: 0,
        avgRating: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Filter, search & pagination states
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'approved', 'flagged', 'rejected', 'verified'
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMatching, setTotalMatching] = useState(0);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState([]);

    // Privacy mask toggle (record which review IDs have revealed details)
    const [revealedIds, setRevealedIds] = useState({});

    // Modals
    const [editModal, setEditModal] = useState({ open: false, review: null });
    const [createModal, setCreateModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, review: null, permanent: false });

    // Create review form state
    const [createForm, setCreateForm] = useState({
        authorName: '',
        userEmail: '',
        userPhone: '',
        rating: 5,
        comment: '',
        serviceName: 'Kundli & Horoscope Consultation',
        astrologerName: 'Astrologer Sharma',
        isVerifiedBooking: true,
        status: 'approved',
        adminNotes: 'Manually verified client testimonial',
    });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch reviews from backend
    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: 10,
                sortBy,
                order: sortOrder,
                search: debouncedSearch,
            };

            if (activeTab === 'verified') {
                params.verifiedOnly = 'true';
            } else if (activeTab !== 'all') {
                params.status = activeTab;
            }

            if (ratingFilter !== 'all') {
                params.rating = ratingFilter;
            }

            const { data } = await axios.get('/admin/reviews', { params });
            if (data.success) {
                setReviews(data.data || []);
                setStats(data.stats || stats);
                setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
                setTotalMatching(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            showToast(error.response?.data?.message || 'Failed to fetch reviews', 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, activeTab, ratingFilter, sortBy, sortOrder, debouncedSearch]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Bulk actions must only touch reviews the admin can see
    useEffect(() => {
        setSelectedIds([]);
    }, [currentPage, activeTab, ratingFilter, sortBy, sortOrder, debouncedSearch]);

    // Go back a page if the last review on this one was removed
    useEffect(() => {
        if (!loading && totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [loading, currentPage, totalPages]);

    // Quick single-status update (e.g. Quick Approve, Quick Flag)
    const handleQuickStatusChange = async (id, newStatus, e) => {
        e?.stopPropagation();
        try {
            const { data } = await axios.put(`/admin/reviews/${id}`, {
                status: newStatus,
                adminNotes: `Status changed to ${newStatus} via quick action button`,
            });
            if (data.success) {
                showToast(`Review status updated to ${newStatus.toUpperCase()}`, 'success');
                fetchReviews();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast(error.response?.data?.message || 'Failed to update status', 'error');
        }
    };

    // Save edited review
    const handleUpdateReviewSubmit = async (e) => {
        e.preventDefault();
        if (!editModal.review) return;

        setActionLoading(true);
        try {
            const { _id, authorName, comment, rating, status, adminNotes, isVerifiedBooking, astrologerName, serviceName } = editModal.review;
            const { data } = await axios.put(`/admin/reviews/${_id}`, {
                authorName,
                comment,
                rating,
                status,
                adminNotes,
                isVerifiedBooking,
                astrologerName,
                serviceName,
            });

            if (data.success) {
                showToast('Review updated successfully!', 'success');
                setEditModal({ open: false, review: null });
                fetchReviews();
            }
        } catch (error) {
            console.error('Failed to save review:', error);
            showToast(error.response?.data?.message || 'Failed to save review', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Create review submit
    const handleCreateReviewSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const { data } = await axios.post('/admin/reviews', createForm);
            if (data.success) {
                showToast('Verified review added successfully!', 'success');
                setCreateModal(false);
                setCreateForm({
                    authorName: '',
                    userEmail: '',
                    userPhone: '',
                    rating: 5,
                    comment: '',
                    serviceName: 'Kundli & Horoscope Consultation',
                    astrologerName: 'Astrologer Sharma',
                    isVerifiedBooking: true,
                    status: 'approved',
                    adminNotes: 'Manually verified client testimonial',
                });
                fetchReviews();
            }
        } catch (error) {
            console.error('Failed to create review:', error);
            showToast(error.response?.data?.message || 'Failed to create review', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Confirm deletion
    const handleDeleteConfirm = async () => {
        if (!deleteModal.review) return;
        setActionLoading(true);
        try {
            const { _id } = deleteModal.review;
            const { data } = await axios.delete(`/admin/reviews/${_id}?permanent=${deleteModal.permanent}`);
            if (data.success) {
                showToast(data.message, 'success');
                setDeleteModal({ open: false, review: null, permanent: false });
                setSelectedIds(prev => prev.filter(id => id !== _id));
                fetchReviews();
            }
        } catch (error) {
            console.error('Failed to delete review:', error);
            showToast(error.response?.data?.message || 'Failed to delete review', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Bulk actions
    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (action === 'delete' || action === 'permanent-delete') {
            if (!window.confirm(`Are you sure you want to perform '${action}' on ${selectedIds.length} review(s)?`)) {
                return;
            }
        }

        setActionLoading(true);
        try {
            const { data } = await axios.post('/admin/reviews/bulk-action', {
                ids: selectedIds,
                action,
                adminNotes: `Bulk ${action} executed by Admin`,
            });
            if (data.success) {
                showToast(data.message, 'success');
                setSelectedIds([]);
                fetchReviews();
            }
        } catch (error) {
            console.error('Failed bulk action:', error);
            showToast(error.response?.data?.message || 'Bulk action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Multi-select helpers
    const toggleSelectAll = () => {
        if (reviews.length > 0 && selectedIds.length === reviews.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(reviews.map(r => r._id));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleRevealPrivacy = (id) => {
        setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Helpers to render stars
    const renderStarRating = (rating) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={15}
                        className={
                            star <= rating
                                ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                                : 'text-slate-700'
                        }
                    />
                ))}
                <span className="ml-1.5 text-xs font-semibold text-amber-300">{rating}.0</span>
            </div>
        );
    };

    // Status Badge Component
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                        <CheckCircle size={12} className="text-emerald-400" />
                        Approved
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                        <Clock size={12} className="text-amber-400" />
                        Pending Approval
                    </span>
                );
            case 'flagged':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300">
                        <ShieldAlert size={12} className="text-rose-400" />
                        Flagged Spam
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        <XCircle size={12} className="text-red-400" />
                        Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 pb-16">
            <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />

            {/* Top Header / Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl flex items-center gap-2.5">
                        <Star className="text-amber-400 fill-amber-400" size={28} />
                        Reviews & Moderation
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Audit user ratings, verify paid consultations, and filter spam or bot attacks.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={fetchReviews}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
                        title="Refresh Reviews"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:brightness-110 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Verified Review
                    </button>
                </div>
            </div>

            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div
                    onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        activeTab === 'all'
                            ? 'border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/40'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                    <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Total Reviews</p>
                    <p className="mt-2 text-2xl font-bold text-slate-100">{stats.total || 0}</p>
                </div>

                <div
                    onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        activeTab === 'pending'
                            ? 'border-amber-500/50 bg-amber-500/15 shadow-lg shadow-amber-950/40'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase font-medium tracking-wider text-amber-400">Pending Gate</p>
                        {stats.pending > 0 && (
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                        )}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-300">{stats.pending || 0}</p>
                </div>

                <div
                    onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        activeTab === 'approved'
                            ? 'border-emerald-500/50 bg-emerald-500/15 shadow-lg shadow-emerald-950/40'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                    <p className="text-xs uppercase font-medium tracking-wider text-emerald-400">Approved</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-300">{stats.approved || 0}</p>
                </div>

                <div
                    onClick={() => { setActiveTab('flagged'); setCurrentPage(1); }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        activeTab === 'flagged'
                            ? 'border-rose-500/50 bg-rose-500/15 shadow-lg shadow-rose-950/40'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                    <p className="text-xs uppercase font-medium tracking-wider text-rose-400">Flagged Spam</p>
                    <p className="mt-2 text-2xl font-bold text-rose-300">{stats.flagged || 0}</p>
                </div>

                <div
                    onClick={() => { setActiveTab('verified'); setCurrentPage(1); }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                        activeTab === 'verified'
                            ? 'border-indigo-500/50 bg-indigo-500/15 shadow-lg shadow-indigo-950/40'
                            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                >
                    <p className="text-xs uppercase font-medium tracking-wider text-indigo-400">Verified Bookings</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-300">{stats.verified || 0}</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase font-medium tracking-wider text-slate-400">Avg Rating</p>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-amber-400">{stats.avgRating || '0.0'}</span>
                        <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
                {[
                    { id: 'all', label: 'All Reviews', count: stats.total },
                    { id: 'pending', label: 'Pending Approval', count: stats.pending, alert: true },
                    { id: 'approved', label: 'Approved', count: stats.approved },
                    { id: 'flagged', label: 'Flagged (Spam)', count: stats.flagged, alert: stats.flagged > 0 },
                    { id: 'rejected', label: 'Rejected', count: stats.rejected },
                    { id: 'verified', label: 'Verified Bookings Only', count: stats.verified },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setCurrentPage(1);
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner'
                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                    >
                        {tab.label}
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                activeTab === tab.id
                                    ? 'bg-cyan-500/30 text-cyan-200'
                                    : tab.alert && tab.count > 0
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search, Filter & Bulk Actions Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search reviewer name, email, booking ID, comment..."
                        className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Rating filter & Sorting */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-1.5">
                        <Filter size={15} className="text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium">Rating:</span>
                        <select
                            value={ratingFilter}
                            onChange={(e) => {
                                setRatingFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-slate-900">All Stars</option>
                            <option value="5" className="bg-slate-900">5 Stars ★</option>
                            <option value="4" className="bg-slate-900">4 Stars ★</option>
                            <option value="3" className="bg-slate-900">3 Stars ★</option>
                            <option value="2" className="bg-slate-900">2 Stars ★</option>
                            <option value="1" className="bg-slate-900">1 Star ★</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-1.5">
                        <span className="text-xs text-slate-400 font-medium">Sort:</span>
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, dir] = e.target.value.split('-');
                                setSortBy(field);
                                setSortOrder(dir);
                                setCurrentPage(1);
                            }}
                            className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
                        >
                            <option value="createdAt-desc" className="bg-slate-900">Newest First</option>
                            <option value="createdAt-asc" className="bg-slate-900">Oldest First</option>
                            <option value="rating-desc" className="bg-slate-900">Highest Rating</option>
                            <option value="rating-asc" className="bg-slate-900">Lowest Rating</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Sticky / Active Bulk Actions Bar when items selected */}
            {selectedIds.length > 0 && (
                <div className="sticky top-24 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-xs font-bold text-cyan-300">
                            {selectedIds.length}
                        </span>
                        <p className="text-sm font-medium text-slate-200">
                            {selectedIds.length} review{selectedIds.length > 1 ? 's' : ''} selected
                        </p>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-xs text-slate-400 hover:text-white underline underline-offset-2 ml-1"
                        >
                            Deselect all
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleBulkAction('approve')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                            <Check size={14} /> Approve
                        </button>
                        <button
                            onClick={() => handleBulkAction('flag')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/30"
                        >
                            <ShieldAlert size={14} /> Flag as Spam
                        </button>
                        <button
                            onClick={() => handleBulkAction('reject')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
                        >
                            <XCircle size={14} /> Reject
                        </button>
                        <button
                            onClick={() => handleBulkAction('delete')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Reviews List / Table Container */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
                {/* Select All Row */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3.5 bg-slate-950/40">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={reviews.length > 0 && selectedIds.length === reviews.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Select All On Page ({reviews.length})
                        </span>
                    </label>

                    <div className="text-xs text-slate-400">
                        Showing {reviews.length} of {totalMatching} matching reviews
                    </div>
                </div>

                {/* Loading Skeleton */}
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="animate-pulse rounded-xl bg-slate-800/40 p-5 space-y-3">
                                <div className="h-5 w-1/4 rounded bg-slate-700/50" />
                                <div className="h-4 w-3/4 rounded bg-slate-700/30" />
                                <div className="h-4 w-1/2 rounded bg-slate-700/20" />
                            </div>
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-200">No Reviews Found</h3>
                        <p className="mt-1 text-sm text-slate-400 max-w-sm">
                            {searchTerm || ratingFilter !== 'all' || activeTab !== 'all'
                                ? 'No reviews match your current filters or search term.'
                                : 'There are currently no reviews in the system.'}
                        </p>
                        {(searchTerm || ratingFilter !== 'all' || activeTab !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setRatingFilter('all');
                                    setActiveTab('all');
                                    setCurrentPage(1);
                                }}
                                className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                            >
                                Reset All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    /* Review Cards Feed */
                    <div className="divide-y divide-slate-800/80">
                        {reviews.map((review) => {
                            const isSelected = selectedIds.includes(review._id);
                            const isRevealed = revealedIds[review._id];

                            return (
                                <div
                                    key={review._id}
                                    className={`p-5 sm:p-6 transition-all duration-150 ${
                                        isSelected
                                            ? 'bg-cyan-500/5 border-l-4 border-l-cyan-400'
                                            : review.status === 'flagged'
                                            ? 'bg-rose-950/10 hover:bg-rose-950/20'
                                            : review.status === 'pending'
                                            ? 'bg-amber-950/5 hover:bg-slate-800/30'
                                            : 'hover:bg-slate-800/30'
                                    }`}
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        {/* Left Column: Checkbox, Author, Rating & Comment */}
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectOne(review._id)}
                                                className="mt-1.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                            />

                                            <div className="space-y-2 flex-1 min-w-0">
                                                {/* Header row: Author + Badges */}
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                                                        {(review.authorName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-slate-100 text-base">
                                                            {review.authorName}
                                                        </span>
                                                        {review.location && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-300/90 ml-2 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                                                📍 {review.location}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-400 ml-2">
                                                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>

                                                    {/* Verified Booking Badge */}
                                                    {review.isVerifiedBooking ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                                                            <CheckCircle size={13} className="text-emerald-400" />
                                                            Verified Booking
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                                                            Guest Review
                                                        </span>
                                                    )}

                                                    {/* Status Badge */}
                                                    {renderStatusBadge(review.status)}
                                                </div>

                                                {/* Star Rating & Consultation Target */}
                                                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                                                    {renderStarRating(review.rating)}
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-xs font-medium text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700/50">
                                                        Service: {review.serviceName || review.astrologerName || 'Vedic Astrology'}
                                                    </span>
                                                    {review.bookingId && (
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            Ref: {review.bookingId}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Review Comment Text (Client-side XSS safe text rendering) */}
                                                <p className="text-sm text-slate-200 leading-relaxed pt-1 whitespace-pre-line font-normal">
                                                    {review.comment}
                                                </p>

                                                {/* Anti-Spam / Profanity Flag Warning Chips */}
                                                {review.flags && review.flags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5 pt-1">
                                                        {review.flags.map((flag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-300"
                                                            >
                                                                <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                                                                {flag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Privacy & Audit Info Row */}
                                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Mail size={13} className="text-slate-500" />
                                                        <span>
                                                            {isRevealed
                                                                ? review.userEmail || 'No email'
                                                                : review.maskedEmail || 'k***@***.com'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <Phone size={13} className="text-slate-500" />
                                                        <span>
                                                            {isRevealed
                                                                ? review.userPhone || 'No phone'
                                                                : review.maskedPhone || '****'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => toggleRevealPrivacy(review._id)}
                                                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition"
                                                    >
                                                        {isRevealed ? (
                                                            <>
                                                                <EyeOff size={13} /> Mask Privacy
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Eye size={13} /> Reveal
                                                            </>
                                                        )}
                                                    </button>

                                                    {review.ipAddress && (
                                                        <span className="font-mono text-[11px] text-slate-500">
                                                            IP: {review.ipAddress}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Admin Notes Preview */}
                                                {review.adminNotes && (
                                                    <div className="mt-2.5 rounded-xl border border-slate-700/50 bg-slate-950/40 p-2.5 text-xs text-slate-300 flex items-start gap-2">
                                                        <span className="font-semibold text-cyan-400 shrink-0">Admin Note:</span>
                                                        <span className="text-slate-300 italic">{review.adminNotes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Moderation Quick Actions */}
                                        <div className="flex items-center gap-1.5 self-end lg:self-start shrink-0 pt-2 lg:pt-0">
                                            {/* Quick Approve Button */}
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={(e) => handleQuickStatusChange(review._id, 'approved', e)}
                                                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/25 active:scale-95"
                                                    title="Approve for public website"
                                                >
                                                    <Check size={14} />
                                                    Approve
                                                </button>
                                            )}

                                            {/* Quick Flag Button */}
                                            {review.status !== 'flagged' && (
                                                <button
                                                    onClick={(e) => handleQuickStatusChange(review._id, 'flagged', e)}
                                                    className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-slate-300 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 active:scale-95"
                                                    title="Flag as suspicious / spam"
                                                >
                                                    <ShieldAlert size={16} />
                                                </button>
                                            )}

                                            {/* Edit Button */}
                                            <button
                                                onClick={() => setEditModal({ open: true, review: { ...review } })}
                                                className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-slate-300 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300 active:scale-95"
                                                title="Edit comment text or rating"
                                            >
                                                <Edit3 size={16} />
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => setDeleteModal({ open: true, review, permanent: false })}
                                                className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-2 text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 active:scale-95"
                                                title="Delete Review"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950/40">
                        <p className="text-xs text-slate-400">
                            Page <span className="font-semibold text-slate-200">{currentPage}</span> of{' '}
                            <span className="font-semibold text-slate-200">{totalPages}</span>
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || loading}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>

                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || loading}
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* EDIT REVIEW MODAL */}
            {/* ========================================================= */}
            {editModal.open && editModal.review && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <Edit3 className="text-cyan-400" size={20} />
                                <h3 className="text-lg font-bold text-slate-100">Edit Review & Moderation</h3>
                            </div>
                            <button
                                onClick={() => setEditModal({ open: false, review: null })}
                                className="text-slate-400 hover:text-white"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-300">Author Name</label>
                                <input
                                    type="text"
                                    value={editModal.review.authorName || ''}
                                    onChange={(e) =>
                                        setEditModal({
                                            ...editModal,
                                            review: { ...editModal.review, authorName: e.target.value },
                                        })
                                    }
                                    required
                                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Rating (1 to 5 Stars)</label>
                                    <div className="mt-1 flex items-center gap-1.5 py-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                type="button"
                                                key={s}
                                                onClick={() =>
                                                    setEditModal({
                                                        ...editModal,
                                                        review: { ...editModal.review, rating: s },
                                                    })
                                                }
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    size={22}
                                                    className={
                                                        s <= editModal.review.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-700'
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Moderation Status</label>
                                    <select
                                        value={editModal.review.status || 'pending'}
                                        onChange={(e) =>
                                            setEditModal({
                                                ...editModal,
                                                review: { ...editModal.review, status: e.target.value },
                                            })
                                        }
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
                                    >
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending Approval</option>
                                        <option value="flagged">Flagged (Spam/Abuse)</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300">
                                    Review Feedback / Comment
                                    <span className="text-slate-500 ml-1">(Edit profanity, typos, or inappropriate text)</span>
                                </label>
                                <textarea
                                    rows={4}
                                    value={editModal.review.comment || ''}
                                    onChange={(e) =>
                                        setEditModal({
                                            ...editModal,
                                            review: { ...editModal.review, comment: e.target.value },
                                        })
                                    }
                                    required
                                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-500 font-normal leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300">
                                    Internal Admin Notes
                                    <span className="text-slate-500 ml-1">(Explanation for approval / rejection)</span>
                                </label>
                                <input
                                    type="text"
                                    value={editModal.review.adminNotes || ''}
                                    onChange={(e) =>
                                        setEditModal({
                                            ...editModal,
                                            review: { ...editModal.review, adminNotes: e.target.value },
                                        })
                                    }
                                    placeholder="e.g. Cleaned typo, verified booking payment in Razorpay"
                                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(editModal.review.isVerifiedBooking)}
                                        onChange={(e) =>
                                            setEditModal({
                                                ...editModal,
                                                review: {
                                                    ...editModal.review,
                                                    isVerifiedBooking: e.target.checked,
                                                },
                                            })
                                        }
                                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                                    />
                                    <span className="text-xs font-medium text-slate-300">
                                        Mark as Verified Paid Consultation
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditModal({ open: false, review: null })}
                                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MANUAL CREATE REVIEW MODAL */}
            {/* ========================================================= */}
            {createModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="text-amber-400" size={20} />
                                <h3 className="text-lg font-bold text-slate-100">Add Verified Testimonial</h3>
                            </div>
                            <button onClick={() => setCreateModal(false)} className="text-slate-400 hover:text-white">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReviewSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Client / Reviewer Name *</label>
                                    <input
                                        type="text"
                                        value={createForm.authorName}
                                        onChange={(e) => setCreateForm({ ...createForm, authorName: e.target.value })}
                                        required
                                        placeholder="e.g. Ramesh Patel"
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Target Astrologer</label>
                                    <input
                                        type="text"
                                        value={createForm.astrologerName}
                                        onChange={(e) => setCreateForm({ ...createForm, astrologerName: e.target.value })}
                                        placeholder="Astrologer Sharma"
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Client Email (Encrypted for Privacy)</label>
                                    <input
                                        type="email"
                                        value={createForm.userEmail}
                                        onChange={(e) => setCreateForm({ ...createForm, userEmail: e.target.value })}
                                        placeholder="client@example.com"
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Client Phone (Encrypted for Privacy)</label>
                                    <input
                                        type="text"
                                        value={createForm.userPhone}
                                        onChange={(e) => setCreateForm({ ...createForm, userPhone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Star Rating *</label>
                                    <div className="mt-1 flex items-center gap-1.5 py-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                type="button"
                                                key={s}
                                                onClick={() => setCreateForm({ ...createForm, rating: s })}
                                                className="focus:outline-none"
                                            >
                                                <Star
                                                    size={22}
                                                    className={
                                                        s <= createForm.rating
                                                            ? 'fill-amber-400 text-amber-400'
                                                            : 'text-slate-700'
                                                    }
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-300">Initial Status</label>
                                    <select
                                        value={createForm.status}
                                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500 cursor-pointer"
                                    >
                                        <option value="approved">Approved (Live)</option>
                                        <option value="pending">Pending Approval</option>
                                        <option value="flagged">Flagged</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300">Consultation Service Name</label>
                                <input
                                    type="text"
                                    value={createForm.serviceName}
                                    onChange={(e) => setCreateForm({ ...createForm, serviceName: e.target.value })}
                                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-300">Review Feedback Text *</label>
                                <textarea
                                    rows={3}
                                    value={createForm.comment}
                                    onChange={(e) => setCreateForm({ ...createForm, comment: e.target.value })}
                                    required
                                    placeholder="Enter verified customer review or testimonial text..."
                                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isVerifiedBooking"
                                    checked={createForm.isVerifiedBooking}
                                    onChange={(e) => setCreateForm({ ...createForm, isVerifiedBooking: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                                />
                                <label htmlFor="isVerifiedBooking" className="text-xs font-medium text-slate-300 cursor-pointer">
                                    Display "Verified Booking" green checkmark badge
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setCreateModal(false)}
                                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Creating...' : 'Create Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* DELETE CONFIRMATION MODAL */}
            {/* ========================================================= */}
            {deleteModal.open && deleteModal.review && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
                    <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-100">Delete Review</h3>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed">
                            Are you sure you want to remove the review from{' '}
                            <span className="font-semibold text-slate-100">{deleteModal.review.authorName}</span>?
                        </p>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 italic line-clamp-3">
                            "{deleteModal.review.comment}"
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                            <input
                                type="checkbox"
                                checked={deleteModal.permanent}
                                onChange={(e) => setDeleteModal({ ...deleteModal, permanent: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-0"
                            />
                            <span className="text-xs font-medium text-red-300">
                                Permanently purge from database (cannot be restored)
                            </span>
                        </label>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ open: false, review: null, permanent: false })}
                                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={actionLoading}
                                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                            >
                                {actionLoading ? 'Deleting...' : deleteModal.permanent ? 'Permanently Delete' : 'Move to Trash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
