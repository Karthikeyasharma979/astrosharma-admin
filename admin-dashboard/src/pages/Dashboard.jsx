import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { getAmountPaid, getClientName } from '../utils/bookingFormat';
import {
    Activity,
    BookOpen,
    MessageCircle,
    TrendingUp,
    Sparkles,
    Star,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    IndianRupee,
    Calendar,
    ArrowUpRight,
    ArrowRight,
    ChevronRight,
    Compass,
    ShieldCheck,
    ShieldAlert,
    Zap
} from 'lucide-react';

const CosmicInsights = [
    {
        title: "Planetary Alignment Surge",
        quote: "High planetary alignment in the 7th house. Expect a noticeable surge in marriage matching & relationship compatibility requests.",
        auspiciousWindow: "10:30 AM – 1:45 PM",
        element: "Fire & Water Harmonics",
        transitNote: "Venus conjunct Jupiter: Optimal harmony for relationship readings."
    },
    {
        title: "Mercury Transit Influence",
        quote: "Mercury enters clear transit today. Precise Vedic calculations and gemstone consultations will resonate strongly with seekers.",
        auspiciousWindow: "2:15 PM – 5:30 PM",
        element: "Air & Mental Clarity",
        transitNote: "Enhanced analytical faculties for detailed horoscope synthesis."
    },
    {
        title: "Auspicious Muhurtham Wave",
        quote: "Shukla Paksha cosmic energies are calm and receptive. Favorable cosmic horizon for career breakthroughs and business name queries.",
        auspiciousWindow: "8:00 AM – 11:30 AM",
        element: "Earth Stability",
        transitNote: "Saturn steadying influence favors long-term planning consultations."
    },
    {
        title: "Jupiter's Golden Radiance",
        quote: "Jupiter casts a benevolent drishti on financial houses today. Excellent cosmic alignment for prosperity readings and wealth analysis.",
        auspiciousWindow: "11:00 AM – 3:30 PM",
        element: "Ether & Abundance",
        transitNote: "Brihaspati blessings: heightened intuition and spiritual insight."
    },
    {
        title: "Lunar Transit Guidance",
        quote: "Moon transitions through Rohini nakshatra. Clients may seek emotional balance, family harmony, and parental blessing guidance.",
        auspiciousWindow: "4:00 PM – 7:30 PM",
        element: "Soma & Emotional Healing",
        transitNote: "Empathetic listening and calming remedies will yield high client gratitude."
    }
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [insightIndex, setInsightIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'bookings' | 'contacts' | 'reviews'
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [loadFailed, setLoadFailed] = useState(false);

    const currentHour = new Date().getHours();
    const greeting = useMemo(() => {
        if (currentHour < 12) return 'Good Morning';
        if (currentHour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, [currentHour]);

    const fetchStats = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const { data } = await axios.get('/admin/stats');
            setStats(data);
            setLastUpdated(new Date());
            setLoadFailed(false);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
            setLoadFailed(true);
        } finally {
            setLoading(false);
            if (isManual) {
                setTimeout(() => setRefreshing(false), 500);
            }
        }
    };

    useEffect(() => {
        // Pick an initial insight based on the current day/hour
        const initialIndex = Math.floor(Math.random() * CosmicInsights.length);
        setInsightIndex(initialIndex);
        fetchStats();

        // Auto refresh every 45 seconds to keep live metrics up-to-date
        const interval = setInterval(() => {
            fetchStats(false);
        }, 45000);

        return () => clearInterval(interval);
    }, []);

    const cycleInsight = () => {
        setInsightIndex((prev) => (prev + 1) % CosmicInsights.length);
    };

    const currentInsight = CosmicInsights[insightIndex];

    // Status breakdown calculations
    const totals = stats?.totals || {};
    const totalBookings = totals.bookings || 0;
    const completedBookings = totals.completedBookings || 0;
    const pendingBookings = totals.pendingBookings || 0;
    const failedBookings = totals.failedBookings || 0;
    const totalRevenue = totals.totalRevenue || 0;
    const averageRating = totals.averageRating || 0;
    const pendingReviews = totals.pendingReviews || 0;

    const completionRate = totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0;

    const pendingRate = totalBookings > 0
        ? Math.round((pendingBookings / totalBookings) * 100)
        : 0;

    const failedRate = totalBookings > 0
        ? Math.round((failedBookings / totalBookings) * 100)
        : 0;

    // Unified activities list
    const combinedActivities = useMemo(() => {
        const bookings = (stats?.recentActivities?.bookings || []).map(b => ({
            type: 'booking',
            id: b._id,
            title: getClientName(b),
            subtitle: b.consultationType || 'Astrology Consultation',
            date: b.createdAt,
            status: b.status || 'Pending',
            price: getAmountPaid(b),
            email: b.email,
            phone: b.phone,
            raw: b
        }));

        const contacts = (stats?.recentActivities?.contacts || []).map(c => ({
            type: 'contact',
            id: c._id,
            title: c.name || 'Inquirer',
            subtitle: c.message || 'General Query',
            date: c.createdAt,
            status: 'Inquiry',
            email: c.email,
            phone: c.phone,
            raw: c
        }));

        const reviews = (stats?.recentActivities?.reviews || []).map(r => ({
            type: 'review',
            id: r._id,
            title: r.authorName || 'Verified Seeker',
            subtitle: r.comment,
            date: r.createdAt,
            status: r.status || 'pending',
            rating: r.rating || 5,
            serviceName: r.serviceName,
            isVerified: r.isVerifiedBooking,
            raw: r
        }));

        return {
            bookings,
            contacts,
            reviews,
            all: [...bookings, ...contacts, ...reviews].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            )
        };
    }, [stats]);

    const displayedActivities = useMemo(() => {
        if (activeTab === 'bookings') return combinedActivities.bookings;
        if (activeTab === 'contacts') return combinedActivities.contacts;
        if (activeTab === 'reviews') return combinedActivities.reviews;
        return combinedActivities.all;
    }, [activeTab, combinedActivities]);

    // Format helpers
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 2) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-slate-800/80 rounded-xl animate-pulse"></div>
                        <div className="h-4 w-96 bg-slate-800/50 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 w-28 bg-slate-800/60 rounded-xl animate-pulse"></div>
                        <div className="h-10 w-36 bg-slate-800/60 rounded-xl animate-pulse"></div>
                    </div>
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-panel p-6 rounded-2xl border border-slate-700/40 bg-slate-800/30">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-7 w-28 bg-slate-700/70 rounded-lg animate-pulse"></div>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-slate-700/40 animate-pulse"></div>
                            </div>
                            <div className="h-3 w-36 bg-slate-700/30 rounded animate-pulse mt-4"></div>
                        </div>
                    ))}
                </div>

                {/* Mid Section Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl h-64 bg-slate-800/30 animate-pulse"></div>
                    <div className="glass-panel p-6 rounded-2xl h-64 bg-slate-800/30 animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative z-10 pb-12">
            {loadFailed && (
                <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>Could not load the latest figures, so the numbers below may be out of date or empty. Please refresh.</span>
                </div>
            )}

            {/* Header with Greeting & Quick Actions */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Sparkles size={13} className="text-purple-400 animate-pulse" />
                            <span>Vedic Command Portal</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                        {greeting}, <span className="premium-gradient">Astro Admin</span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                        Monitor live client consultations, inquiries, revenue flows, and reputation metrics in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Pending review alert button */}
                    {pendingReviews > 0 && (
                        <button
                            onClick={() => navigate('/reviews')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400/50 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] group"
                        >
                            <ShieldAlert size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
                            <span>{pendingReviews} Reviews Pending</span>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        </button>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchStats(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:bg-slate-700/70 hover:text-white hover:border-slate-600 transition-all active:scale-95 disabled:opacity-60"
                        title="Refresh metrics"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-cyan-400' : 'text-slate-400'} />
                        <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Refresh'}</span>
                    </button>

                    {/* Bookings Hub Button */}
                    <button
                        onClick={() => navigate('/bookings')}
                        className="btn-primary text-xs px-4 py-2.5 gap-2 group cursor-pointer"
                    >
                        <span>Manage Bookings</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            {/* Metrics KPI Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Bookings */}
                <div
                    onClick={() => navigate('/bookings')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer group hover:translate-y-[-4px] hover:border-cyan-500/40 hover:shadow-[0_10px_25px_-5px_rgba(6,182,212,0.25)] transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-500 pointer-events-none"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Bookings</span>
                            <h3 className="text-3xl font-extrabold text-slate-100 mt-1 tracking-tight">
                                {totalBookings.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-500/15 text-cyan-400 border border-cyan-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <BookOpen size={22} />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs relative z-10">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                                <span>{completedBookings} Completed</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 whitespace-nowrap text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                                <span>{pendingBookings} Pending</span>
                            </span>
                        </div>
                        <ArrowUpRight size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </div>
                </div>

                {/* 2. Total Consultation Revenue */}
                <div className="glass-panel p-6 rounded-2xl group hover:translate-y-[-4px] hover:border-emerald-500/40 hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.25)] transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500 pointer-events-none"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Consultation Revenue</span>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="text-xl font-bold text-emerald-400">₹</span>
                                <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                                    {totalRevenue.toLocaleString('en-IN')}
                                </h3>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-400 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <IndianRupee size={22} />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 relative z-10">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 whitespace-nowrap">
                            <span>Completion Rate</span>
                            <span className="text-emerald-400 font-semibold">{completionRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, completionRate))}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* 3. Inquiries & Client Leads */}
                <div
                    onClick={() => navigate('/contacts')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer group hover:translate-y-[-4px] hover:border-purple-500/40 hover:shadow-[0_10px_25px_-5px_rgba(168,85,247,0.25)] transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500 pointer-events-none"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Inquiries Received</span>
                            <h3 className="text-3xl font-extrabold text-slate-100 mt-1 tracking-tight">
                                {(totals.contacts || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/15 to-indigo-500/15 text-purple-400 border border-purple-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <MessageCircle size={22} />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs relative z-10">
                        <span className="text-slate-400 flex items-center gap-1.5 whitespace-nowrap text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0"></span>
                            Direct Seeker Inquiries
                        </span>
                        <div className="flex items-center gap-1 text-purple-400 font-semibold group-hover:translate-x-0.5 transition-transform whitespace-nowrap text-[11px]">
                            <span>View All</span>
                            <ArrowUpRight size={13} className="shrink-0" />
                        </div>
                    </div>
                </div>

                {/* 4. Reputation & Client Ratings */}
                <div
                    onClick={() => navigate('/reviews')}
                    className="glass-panel p-6 rounded-2xl cursor-pointer group hover:translate-y-[-4px] hover:border-amber-500/40 hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.25)] transition-all duration-300 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>

                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Client Reputation</span>
                            <div className="flex items-center gap-2 mt-1">
                                <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                                    {averageRating.toFixed(1)}
                                </h3>
                                <div className="flex items-center text-amber-400">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 text-amber-400 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <Star size={22} className="fill-amber-400/30" />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs relative z-10">
                        <span className="text-slate-400 whitespace-nowrap text-[11px]">
                            {totals.reviews || 0} Total Reviews
                        </span>
                        {pendingReviews > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse whitespace-nowrap">
                                {pendingReviews} Pending
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium whitespace-nowrap text-[11px]">
                                <ShieldCheck size={13} className="shrink-0" />
                                Moderated
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* Mid Section: Celestial Guidance & Consultation Pipeline Breakdown */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Cosmic Transit & Daily Insight Card (7 cols) */}
                <div className="lg:col-span-7 glass-panel p-6 sm:p-7 rounded-2xl relative overflow-hidden border border-purple-500/20 group">
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/40 relative z-10">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shrink-0">
                                <Compass size={18} className="animate-spin" style={{ animationDuration: '24s' }} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-slate-100 whitespace-nowrap">
                                        Cosmic Guidance
                                    </h3>
                                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                        Vedic Transit
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 truncate mt-0.5">{currentInsight.title}</p>
                            </div>
                        </div>

                        <button
                            onClick={cycleInsight}
                            className="text-xs font-medium text-purple-300 hover:text-purple-200 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                            title="Cycle astrological insight"
                        >
                            <Sparkles size={13} className="shrink-0" />
                            <span>Next Guidance</span>
                        </button>
                    </div>

                    <div className="relative z-10 my-4">
                        <blockquote className="text-slate-200 text-sm italic leading-relaxed pl-4 border-l-2 border-purple-500/60 bg-slate-900/40 p-4 rounded-r-xl">
                            "{currentInsight.quote}"
                        </blockquote>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs relative z-10">
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5 mb-1 whitespace-nowrap text-[11px]">
                                <Clock size={13} className="text-cyan-400 shrink-0" />
                                Auspicious Window
                            </span>
                            <span className="font-semibold text-slate-200 whitespace-nowrap text-xs">{currentInsight.auspiciousWindow}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5 mb-1 whitespace-nowrap text-[11px]">
                                <Zap size={13} className="text-amber-400 shrink-0" />
                                Elemental Flow
                            </span>
                            <span className="font-semibold text-slate-200 whitespace-nowrap text-xs">{currentInsight.element}</span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5 mb-1 whitespace-nowrap text-[11px]">
                                <TrendingUp size={13} className="text-emerald-400 shrink-0" />
                                System Integrity
                            </span>
                            <span className="font-semibold text-emerald-400 flex items-center gap-1 whitespace-nowrap text-xs">
                                <CheckCircle2 size={13} className="shrink-0" />
                                100% Operational
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Consultation Status & Pipeline Breakdown (5 cols) */}
                <div className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-2xl relative overflow-hidden border border-slate-700/40 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/40">
                            <div>
                                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                    <Activity size={18} className="text-cyan-400" />
                                    <span>Consultation Pipeline</span>
                                </h3>
                                <p className="text-xs text-slate-400">Distribution by booking status</p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                {totalBookings} Total
                            </span>
                        </div>

                        {/* Visual Pipeline Stacked Bar */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-medium">
                                    <span>Status Breakdown</span>
                                    <span>{completedBookings} Completed • {pendingBookings} Pending</span>
                                </div>
                                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                                    {completedBookings > 0 && (
                                        <div
                                            className="bg-emerald-500 h-full transition-all duration-500"
                                            style={{ width: `${completionRate}%` }}
                                            title={`Completed: ${completionRate}%`}
                                        ></div>
                                    )}
                                    {pendingBookings > 0 && (
                                        <div
                                            className="bg-amber-400 h-full transition-all duration-500"
                                            style={{ width: `${pendingRate}%` }}
                                            title={`Pending: ${pendingRate}%`}
                                        ></div>
                                    )}
                                    {failedBookings > 0 && (
                                        <div
                                            className="bg-rose-500 h-full transition-all duration-500"
                                            style={{ width: `${failedRate}%` }}
                                            title={`Failed: ${failedRate}%`}
                                        ></div>
                                    )}
                                </div>
                            </div>

                            {/* Status Legend Pills */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                                    <p className="text-[11px] text-slate-400 mb-0.5">Completed</p>
                                    <p className="text-base font-bold text-emerald-400">{completedBookings}</p>
                                    <p className="text-[10px] text-slate-500">{completionRate}%</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                                    <p className="text-[11px] text-slate-400 mb-0.5">Pending</p>
                                    <p className="text-base font-bold text-amber-400">{pendingBookings}</p>
                                    <p className="text-[10px] text-slate-500">{pendingRate}%</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                                    <p className="text-[11px] text-slate-400 mb-0.5">Failed</p>
                                    <p className="text-base font-bold text-rose-400">{failedBookings}</p>
                                    <p className="text-[10px] text-slate-500">{failedRate}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick navigation action */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            Auto-sync with Razorpay & Client Mailer
                        </span>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                            <span>Filter Pending</span>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Quick Navigation Hub */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/bookings')}
                    className="glass-panel p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all text-left group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">Bookings Directory</p>
                        <p className="text-[11px] text-slate-500 truncate">View & update orders</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/contacts')}
                    className="glass-panel p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-800/60 hover:border-purple-500/30 transition-all text-left group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <MessageCircle size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">Client Inquiries</p>
                        <p className="text-[11px] text-slate-500 truncate">Seeker questions</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/reviews')}
                    className="glass-panel p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-800/60 hover:border-amber-500/30 transition-all text-left group cursor-pointer relative"
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Star size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-300 transition-colors">Review Moderation</p>
                            {pendingReviews > 0 && (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{pendingReviews} to review</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/bookings')}
                    className="glass-panel p-4 rounded-xl flex items-center gap-3.5 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">Export & Reports</p>
                        <p className="text-[11px] text-slate-500 truncate">Download PDF receipts</p>
                    </div>
                </button>
            </section>

            {/* Recent Unified Activity Feed */}
            <section className="glass-panel rounded-2xl border border-slate-700/40 overflow-hidden shadow-2xl">
                {/* Activity Feed Header & Interactive Tabs */}
                <div className="p-5 sm:p-6 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <Activity size={20} className="text-cyan-400" />
                            <span>Recent Platform Activity</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time incoming client requests, appointments, and reviews</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            All Activity ({combinedActivities.all.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'bookings'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Bookings ({combinedActivities.bookings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('contacts')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'contacts'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Inquiries ({combinedActivities.contacts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'reviews'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Reviews ({combinedActivities.reviews.length})
                        </button>
                    </div>
                </div>

                {/* Activity List */}
                <div className="divide-y divide-slate-800/80">
                    {displayedActivities.length > 0 ? (
                        displayedActivities.map((item) => {
                            if (item.type === 'booking') {
                                return (
                                    <div
                                        key={`booking-${item.id}`}
                                        onClick={() => navigate(`/bookings/${item.id}`)}
                                        className="p-5 sm:p-6 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            {/* Avatar with initials */}
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                {item.title ? item.title.charAt(0).toUpperCase() : 'B'}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-slate-100 text-sm group-hover:text-cyan-300 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 border border-slate-700">
                                                        {item.subtitle}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                                    {item.email && <span className="truncate max-w-[200px]">{item.email}</span>}
                                                    {item.phone && <span>• {item.phone}</span>}
                                                    <span>• {formatDate(item.date)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                                            {item.price !== null && item.price !== undefined && (
                                                <span className="text-xs font-semibold text-slate-300 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                                                    ₹{item.price}
                                                </span>
                                            )}

                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                                    item.status === 'Completed'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : item.status === 'Failed'
                                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                                }`}
                                            >
                                                {item.status}
                                            </span>

                                            <ChevronRight
                                                size={16}
                                                className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            if (item.type === 'contact') {
                                return (
                                    <div
                                        key={`contact-${item.id}`}
                                        onClick={() => navigate('/contacts')}
                                        className="p-5 sm:p-6 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                                                {item.title ? item.title.charAt(0).toUpperCase() : 'C'}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-slate-100 text-sm group-hover:text-purple-300 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                                        Inquiry
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-xl">
                                                    "{item.subtitle}"
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    {formatDate(item.date)} {item.email ? `• ${item.email}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                                                View Inquiry
                                            </span>
                                            <ChevronRight
                                                size={16}
                                                className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all"
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            if (item.type === 'review') {
                                return (
                                    <div
                                        key={`review-${item.id}`}
                                        onClick={() => navigate('/reviews')}
                                        className="p-5 sm:p-6 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                                                {item.rating}★
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-slate-100 text-sm group-hover:text-amber-300 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center text-amber-400">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={12}
                                                                className={star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                                                            />
                                                        ))}
                                                    </div>
                                                    {item.isVerified && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Verified Client
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-xl">
                                                    "{item.subtitle}"
                                                </p>
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    {formatDate(item.date)} {item.serviceName ? `• ${item.serviceName}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                            <span
                                                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                                                    item.status === 'approved'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : item.status === 'flagged'
                                                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}
                                            >
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                            <ChevronRight
                                                size={16}
                                                className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all"
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            return null;
                        })
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-500">
                                <Sparkles size={28} />
                            </div>
                            <h4 className="text-base font-semibold text-slate-300">No activity recorded yet</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                New bookings, contact messages, and reviews submitted by clients will automatically show up here.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer action to view entire directory */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                        Showing latest platform records
                    </span>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                        <span>Open Full Bookings Ledger</span>
                        <ArrowRight size={13} />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
