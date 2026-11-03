import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import { formatAmount, getAmountPaid, getClientName, getListPrice, hasDiscount, normalizeServiceName } from '../utils/bookingFormat';
import {
    Search,
    Filter,
    Calendar as CalendarIcon,
    Phone,
    Mail,
    Trash2,
    Sparkles,
    CheckCircle2,
    Clock,
    AlertCircle,
    IndianRupee,
    ArrowUpRight,
    Download,
    RefreshCw,
    X,
    RotateCcw,
    Copy,
    Check,
    Eye,
    User,
    Receipt,
    ChevronDown,
    SlidersHorizontal
} from 'lucide-react';
import Toast from '../components/Toast';

const Bookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Filters
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [filterType, setFilterType] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMonth, setFilterMonth] = useState(''); // 'YYYY-MM'
    const [filterStartDate, setFilterStartDate] = useState(''); // 'YYYY-MM-DD'
    const [filterEndDate, setFilterEndDate] = useState(''); // 'YYYY-MM-DD'
    const [showDateFilters, setShowDateFilters] = useState(false);

    // Toast
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const fetchBookings = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const { data } = await axios.get('/admin/bookings');
            setBookings(data);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            showToast("Failed to load bookings", "error");
        } finally {
            setLoading(false);
            if (isManual) {
                setTimeout(() => setRefreshing(false), 400);
            }
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // A search from the top bar while already on this page
    useEffect(() => {
        const query = searchParams.get('search');
        if (query !== null) setSearchTerm(query);
    }, [searchParams]);

    // Unique consultation types in the dataset, with Telugu and English bookings of one service together
    const availableTypes = useMemo(() => {
        const types = new Set(bookings.map(b => normalizeServiceName(b.consultationType)).filter(Boolean));
        return ['All', ...Array.from(types)];
    }, [bookings]);

    // Status counts
    const statusCounts = useMemo(() => {
        return bookings.reduce(
            (acc, booking) => {
                const status = booking.status || 'Pending';
                if (status === 'Pending') acc.pending += 1;
                if (status === 'Completed') acc.completed += 1;
                if (status === 'Failed') acc.failed += 1;
                return acc;
            },
            { pending: 0, completed: 0, failed: 0 }
        );
    }, [bookings]);

    // Filtering logic
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch = !query ||
                (b.fullName || '').toLowerCase().includes(query) ||
                (b.email || '').toLowerCase().includes(query) ||
                (b.phone || '').toLowerCase().includes(query) ||
                (b.dob || '').toLowerCase().includes(query) ||
                (b.consultationType || '').toLowerCase().includes(query) ||
                (b.razorpay_order_id || '').toLowerCase().includes(query) ||
                (b.razorpay_payment_id || '').toLowerCase().includes(query);

            const matchesType = filterType === 'All' ? true : normalizeServiceName(b.consultationType) === filterType;
            const bookingStatus = b.status || 'Pending';
            const matchesStatus = filterStatus === 'All' ? true : bookingStatus === filterStatus;

            // Date filtering, by the day shown on this device rather than the UTC day
            let matchesDate = true;
            const created = new Date(b.createdAt);
            if (filterMonth) {
                const createdMonth = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
                matchesDate = createdMonth === filterMonth;
            }
            if (filterStartDate && created < new Date(`${filterStartDate}T00:00:00`)) {
                matchesDate = false;
            }
            if (filterEndDate && created > new Date(`${filterEndDate}T23:59:59.999`)) {
                matchesDate = false;
            }

            return matchesSearch && matchesType && matchesStatus && matchesDate;
        });
    }, [bookings, searchTerm, filterType, filterStatus, filterMonth, filterStartDate, filterEndDate]);

    const hasActiveFilters = searchTerm || filterType !== 'All' || filterStatus !== 'All' || filterMonth || filterStartDate || filterEndDate;

    const resetAllFilters = () => {
        setSearchTerm('');
        setFilterType('All');
        setFilterStatus('All');
        setFilterMonth('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const handleCopy = (text, id, e) => {
        e?.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        showToast("Order ID copied to clipboard", "success");
        setTimeout(() => setCopiedId(null), 1800);
    };

    const handleStatusChange = async (bookingId, status, e) => {
        e?.stopPropagation();
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

    const handleDeleteBooking = async (bookingId, clientName, e) => {
        e?.stopPropagation();
        const confirmed = window.confirm(`Are you sure you want to delete the booking for "${clientName || 'this client'}"?`);
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

    const exportToCSV = () => {
        if (!filteredBookings.length) {
            showToast("No bookings to export", "error");
            return;
        }

        // Quotes every cell, and stops a customer-typed name starting with = from running as a spreadsheet formula
        const csvCell = (value) => {
            const text = String(value ?? '');
            const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
            return `"${safeText.replace(/"/g, '""')}"`;
        };

        const headers = ["Order ID", "Client Name", "Email", "Phone", "Consultation Type", "Status", "List Price", "Amount Paid", "Coupon", "Date", "Completed At"];
        const rows = filteredBookings.map(b => [
            b.razorpay_order_id,
            b.fullName,
            b.email,
            b.phone,
            b.consultationType,
            b.status || 'Pending',
            getListPrice(b),
            getAmountPaid(b),
            b.couponCode,
            new Date(b.createdAt).toLocaleDateString(),
            b.completedAt ? new Date(b.completedAt).toLocaleDateString() : 'N/A'
        ]);

        // The leading BOM lets Excel show Telugu correctly
        const csvContent = '﻿' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `astro_consultations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Exported ${filteredBookings.length} bookings to CSV`, "success");
    };

    return (
        <div className="space-y-7 animate-in fade-in duration-500 relative z-10 pb-12">
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                            <Sparkles size={13} className="text-cyan-400" />
                            <span>Vedic Client Ledger</span>
                        </span>
                        <span className="text-xs text-slate-400">
                            • {bookings.length} Total Records
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                        Consultation <span className="premium-gradient">Bookings</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">
                        Review, moderate, and track all incoming client appointments, order payments, and horoscope queries.
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => fetchBookings(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/70 hover:text-white hover:border-slate-600 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                        title="Reload latest bookings"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'} />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>

                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:text-white transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                    >
                        <Download size={14} className="text-cyan-400" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Interactive KPI Filter Cards (Click to filter!) */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. All Bookings */}
                <div
                    onClick={() => setFilterStatus('All')}
                    className={`glass-panel p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                        filterStatus === 'All'
                            ? 'border-cyan-500/60 ring-2 ring-cyan-500/30 bg-slate-800/70 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                            : 'hover:border-slate-600/70 hover:translate-y-[-2px]'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">All Bookings</span>
                        <div className={`p-2 rounded-xl transition-colors ${filterStatus === 'All' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                            <Sparkles size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                            {bookings.length}
                        </h3>
                        {filterStatus === 'All' && (
                            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                                Active Filter
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Complete Consultation Ledger</p>
                </div>

                {/* 2. Pending Bookings */}
                <div
                    onClick={() => setFilterStatus('Pending')}
                    className={`glass-panel p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                        filterStatus === 'Pending'
                            ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-slate-800/70 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'hover:border-slate-600/70 hover:translate-y-[-2px]'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Pending</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        </div>
                        <div className={`p-2 rounded-xl transition-colors ${filterStatus === 'Pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400 group-hover:text-amber-400'}`}>
                            <Clock size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
                            {statusCounts.pending}
                        </h3>
                        {filterStatus === 'Pending' && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Active Filter
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Awaiting Astrologer Review</p>
                </div>

                {/* 3. Completed Bookings */}
                <div
                    onClick={() => setFilterStatus('Completed')}
                    className={`glass-panel p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                        filterStatus === 'Completed'
                            ? 'border-emerald-500/60 ring-2 ring-emerald-500/30 bg-slate-800/70 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                            : 'hover:border-slate-600/70 hover:translate-y-[-2px]'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Completed</span>
                        <div className={`p-2 rounded-xl transition-colors ${filterStatus === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                            {statusCounts.completed}
                        </h3>
                        {filterStatus === 'Completed' && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Active Filter
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Delivered & Closed</p>
                </div>

                {/* 4. Failed Bookings */}
                <div
                    onClick={() => setFilterStatus('Failed')}
                    className={`glass-panel p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                        filterStatus === 'Failed'
                            ? 'border-rose-500/60 ring-2 ring-rose-500/30 bg-slate-800/70 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                            : 'hover:border-slate-600/70 hover:translate-y-[-2px]'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Failed</span>
                        <div className={`p-2 rounded-xl transition-colors ${filterStatus === 'Failed' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400 group-hover:text-rose-400'}`}>
                            <AlertCircle size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
                            {statusCounts.failed}
                        </h3>
                        {filterStatus === 'Failed' && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                Active Filter
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Payment Dropped / Cancelled</p>
                </div>
            </section>

            {/* Unified Command & Filter Bar */}
            <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-700/50 shadow-xl space-y-3.5">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Search by client name, email, phone, order ID, or DOB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-9 rounded-xl text-sm bg-slate-900/70 border border-slate-700/60 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Consultation Type Selector */}
                        <div className="relative min-w-[170px] flex-1 sm:flex-initial">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full appearance-none bg-slate-900/70 border border-slate-700/60 text-slate-200 text-xs font-medium rounded-xl py-2.5 pl-3.5 pr-8 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
                            >
                                {availableTypes.map((type) => (
                                    <option key={type} value={type} className="bg-slate-900 text-slate-100">
                                        {type === 'All' ? 'All Consultation Types' : type}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative min-w-[130px] flex-1 sm:flex-initial">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full appearance-none bg-slate-900/70 border border-slate-700/60 text-slate-200 text-xs font-medium rounded-xl py-2.5 pl-3.5 pr-8 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
                            >
                                <option value="All" className="bg-slate-900 text-slate-100">All Statuses</option>
                                <option value="Pending" className="bg-slate-900 text-slate-100">Pending</option>
                                <option value="Completed" className="bg-slate-900 text-slate-100">Completed</option>
                                <option value="Failed" className="bg-slate-900 text-slate-100">Failed</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Date Filter Drawer Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowDateFilters(prev => !prev)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer ${
                                showDateFilters || filterMonth || filterStartDate || filterEndDate
                                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                    : 'bg-slate-900/70 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <CalendarIcon size={14} className="text-purple-400" />
                            <span>Date Filters</span>
                            {(filterMonth || filterStartDate || filterEndDate) && (
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                            )}
                        </button>

                        {/* Reset Filters Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetAllFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                                title="Reset all applied filters"
                            >
                                <RotateCcw size={13} />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Date & Range Filter Bar */}
                {showDateFilters && (
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end animate-in fade-in duration-300">
                        {/* By Specific Month */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <CalendarIcon size={12} className="text-purple-400" />
                                Filter By Month
                            </label>
                            <input
                                type="month"
                                value={filterMonth}
                                onChange={e => {
                                    setFilterMonth(e.target.value);
                                    setFilterStartDate('');
                                    setFilterEndDate('');
                                }}
                                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-purple-500/50 transition"
                            />
                        </div>

                        {/* From Date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <CalendarIcon size={12} className="text-cyan-400" />
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filterStartDate}
                                onChange={e => {
                                    setFilterStartDate(e.target.value);
                                    setFilterMonth('');
                                }}
                                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500/50 transition"
                            />
                        </div>

                        {/* To Date */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <CalendarIcon size={12} className="text-cyan-400" />
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filterEndDate}
                                onChange={e => {
                                    setFilterEndDate(e.target.value);
                                    setFilterMonth('');
                                }}
                                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500/50 transition"
                            />
                        </div>

                        {/* Clear Dates Only */}
                        <button
                            type="button"
                            onClick={() => {
                                setFilterMonth('');
                                setFilterStartDate('');
                                setFilterEndDate('');
                            }}
                            className="h-9 px-4 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700/70 transition cursor-pointer"
                        >
                            Clear Date Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Main Bookings Table Card */}
            <div className="glass-panel rounded-2xl border border-slate-700/40 overflow-hidden shadow-2xl">
                {/* Table Header Status Bar */}
                <div className="px-6 py-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300">
                            Showing <span className="text-cyan-400 font-bold">{filteredBookings.length}</span> of {bookings.length} consultations
                        </span>
                        {hasActiveFilters && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                                Filtered
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-slate-500">
                        Click on any client row to view full horoscope details
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/60 border-b border-slate-700/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                <th className="py-4 px-5 whitespace-nowrap">Client Name</th>
                                <th className="py-4 px-4 whitespace-nowrap">Consultation</th>
                                <th className="py-4 px-4 whitespace-nowrap">Contact Info</th>
                                <th className="py-4 px-4 whitespace-nowrap">Fee / Price</th>
                                <th className="py-4 px-4 whitespace-nowrap">Order ID</th>
                                <th className="py-4 px-4 whitespace-nowrap">Status & Update</th>
                                <th className="py-4 px-4 text-right whitespace-nowrap">Date</th>
                                <th className="py-4 px-5 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/80 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs font-medium">Loading consultations ledger...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-16 px-4 text-center">
                                        <div className="max-w-md mx-auto space-y-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-500 flex items-center justify-center mx-auto">
                                                <Sparkles size={24} />
                                            </div>
                                            <h4 className="text-base font-bold text-slate-200">No Consultations Found</h4>
                                            <p className="text-xs text-slate-400">
                                                {hasActiveFilters
                                                    ? 'No bookings match your current filter combination. Try clearing your filters or search query.'
                                                    : 'No client bookings have been received yet. When clients book on AstroSharma, they will show up here.'}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={resetAllFilters}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer mt-2"
                                                >
                                                    <RotateCcw size={13} />
                                                    <span>Clear All Filters</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => {
                                    const bookingStatus = booking.status || 'Pending';
                                    const clientInitial = getClientName(booking).charAt(0).toUpperCase();

                                    return (
                                        <tr
                                            key={booking._id}
                                            onClick={() => navigate(`/bookings/${booking._id}`)}
                                            className="group cursor-pointer transition-colors duration-150 hover:bg-slate-800/40"
                                        >
                                            {/* Client Column with Avatar */}
                                            <td className="py-4 px-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                                        {clientInitial}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                                                            <span>{getClientName(booking)}</span>
                                                            {booking.environment === 'testing' && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/60" title="Placed from a developer machine. Not counted in revenue.">
                                                                    TEST
                                                                </span>
                                                            )}
                                                        </div>
                                                        {booking.dob && (
                                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                <CalendarIcon size={11} className="text-slate-500" />
                                                                <span>DOB: {booking.dob}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Consultation Type Badge */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                                        normalizeServiceName(booking.consultationType) === 'Marriage Matching'
                                                            ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                                                            : normalizeServiceName(booking.consultationType).includes('Muhurtham')
                                                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                                                    }`}
                                                >
                                                    {booking.consultationType || 'Standard'}
                                                </span>
                                            </td>

                                            {/* Contact Info (Phone & Email) */}
                                            <td className="py-4 px-4 space-y-1 whitespace-nowrap text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-300">
                                                    <Phone size={13} className="text-cyan-400/80 shrink-0" />
                                                    <span className="font-mono">{booking.phone || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Mail size={13} className="text-slate-500 shrink-0" />
                                                    <span className="truncate max-w-[180px]">{booking.email || 'N/A'}</span>
                                                </div>
                                            </td>

                                            {/* Price / Fee */}
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <div className="flex items-center gap-0.5 font-bold text-slate-200">
                                                    <span className="text-xs text-emerald-400">₹</span>
                                                    <span>{formatAmount(getAmountPaid(booking))}</span>
                                                    {hasDiscount(booking) && (
                                                        <span className="ml-1.5 text-[11px] font-medium text-slate-500 line-through">₹{formatAmount(getListPrice(booking))}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-500">{booking.couponCode ? `Coupon ${booking.couponCode}` : 'Razorpay'}</span>
                                            </td>

                                            {/* Order ID with Copy Action */}
                                            <td className="py-4 px-4 whitespace-nowrap text-xs" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-800">
                                                        {booking.razorpay_order_id ? `${booking.razorpay_order_id.slice(0, 10)}...` : 'N/A'}
                                                    </span>
                                                    {booking.razorpay_order_id && (
                                                        <button
                                                            onClick={(e) => handleCopy(booking.razorpay_order_id, booking._id, e)}
                                                            className="p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
                                                            title="Copy Razorpay Order ID"
                                                        >
                                                            {copiedId === booking._id ? (
                                                                <Check size={13} className="text-emerald-400" />
                                                            ) : (
                                                                <Copy size={13} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status Badge & Status Selector */}
                                            <td className="py-4 px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                            bookingStatus === 'Completed'
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                : bookingStatus === 'Failed'
                                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                        }`}
                                                    >
                                                        {bookingStatus === 'Completed' && <CheckCircle2 size={13} className="shrink-0" />}
                                                        {bookingStatus === 'Pending' && <Clock size={13} className="shrink-0" />}
                                                        {bookingStatus === 'Failed' && <AlertCircle size={13} className="shrink-0" />}
                                                        <span>{bookingStatus}</span>
                                                    </span>

                                                    {/* Quick Status Dropdown */}
                                                    <select
                                                        value={bookingStatus}
                                                        disabled={updatingId === booking._id}
                                                        onChange={(e) => handleStatusChange(booking._id, e.target.value, e)}
                                                        className="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50 cursor-pointer"
                                                        title="Quick change status"
                                                    >
                                                        <option value="Pending" className="bg-slate-900 text-slate-200">Pending</option>
                                                        <option value="Completed" className="bg-slate-900 text-slate-200">Completed</option>
                                                        <option value="Failed" className="bg-slate-900 text-slate-200">Failed</option>
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Date / Created At */}
                                            <td className="py-4 px-4 text-right text-xs text-slate-400 whitespace-nowrap font-medium">
                                                {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => navigate(`/bookings/${booking._id}`)}
                                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/80 transition-all cursor-pointer"
                                                        title="View full booking dossier"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    <button
                                                        onClick={(e) => handleDeleteBooking(booking._id, booking.fullName, e)}
                                                        disabled={deletingId === booking._id}
                                                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
                                                        title="Delete booking"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                    <div>
                        Showing <span className="font-semibold text-slate-200">{filteredBookings.length}</span> results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                        >
                            Back to Top ↑
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bookings;
