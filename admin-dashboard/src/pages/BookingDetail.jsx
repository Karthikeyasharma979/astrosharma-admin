import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import {
    ArrowLeft,
    Phone,
    Mail,
    Calendar,
    Clock,
    CreditCard,
    HelpCircle,
    Heart,
    Loader2,
    Trash2,
    User,
    MapPin,
    Sparkles,
    Download,
    PhoneCall,
    PhoneOff,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Send,
    History,
    Award,
    FileText,
    Check,
    Copy,
    ExternalLink,
    Compass,
    Star,
    Layers,
    X,
    CalendarClock
} from 'lucide-react';
import Toast from '../components/Toast';
import { calculateClientKundli, calculateGunaMilan } from '../utils/astroCalculator';
import { generateConsultationPDF } from '../utils/pdfGenerator';
import { CLIENT_URL, formatAmount, getAmountPaid, getClientName, getListPrice, hasDiscount, normalizeServiceName } from '../utils/bookingFormat';

const DEFAULT_PROGRESS_NOTE = 'మీరు అందించిన వివరాలను శ్రీ అన్నపూర్ణ జ్యోతిష్యాలయం పండిట్‌జీ పరిశీలిస్తున్నారు. 24 గంటల లోపల మీ వాట్సాప్ నంబర్‌కు నేరుగా కాల్ చేసి లేదా నివేదిక రూపంలో ఫలితాలు అందజేయబడును. (Panditji is reviewing your details. Results will be shared via direct call or report within 24 hours.)';

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
    const [chartType, setChartType] = useState('south'); // 'south' | 'north'

    // Call Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [callSeconds, setCallSeconds] = useState(0);

    // Remedies Modal / Drawer State
    const [showRemediesModal, setShowRemediesModal] = useState(false);
    const [remediesInput, setRemediesInput] = useState({
        gemstones: '',
        poojas: '',
        mantras: '',
        generalNotes: ''
    });
    const [callDurationInput, setCallDurationInput] = useState('');
    const [followUpDateInput, setFollowUpDateInput] = useState('');
    const [sendEmailToggle, setSendEmailToggle] = useState(true);
    const [includeReviewToggle, setIncludeReviewToggle] = useState(true);
    const [submittingRemedies, setSubmittingRemedies] = useState(false);

    // Customer Real-Time Tracking State (ప్రస్తుత పురోగతి)
    const [progressStep, setProgressStep] = useState(2);
    const [astrologerNoteInput, setAstrologerNoteInput] = useState(DEFAULT_PROGRESS_NOTE);
    const [updatingProgress, setUpdatingProgress] = useState(false);
    const [selectedTemplateLang, setSelectedTemplateLang] = useState('all');

    const NOTE_TEMPLATES = [
        {
            lang: 'bilingual',
            label: 'పరిశీలిస్తున్నారు • Reviewing (Bilingual)',
            step: 2,
            text: 'మీరు అందించిన వివరాలను శ్రీ అన్నపూర్ణ జ్యోతిష్యాలయం పండిట్‌జీ పరిశీలిస్తున్నారు. 24 గంటల లోపల మీ వాట్సాప్ నంబర్‌కు నేరుగా కాల్ చేసి లేదా నివేదిక రూపంలో ఫలితాలు అందజేయబడును. (Panditji is examining your birth details. We will contact you via WhatsApp call or report within 24 hours.)'
        },
        {
            lang: 'bilingual',
            label: 'కాల్ చేస్తున్నారు • Calling Now (Bilingual)',
            step: 3,
            text: 'నమస్తే, మీ జాతక విశ్లేషణ సిద్ధంగా ఉంది. పండిట్‌జీ గారు ఇప్పుడు మీకు నేరుగా వాట్సాప్ / ఫోన్ కాల్ చేస్తున్నారు. దయచేసి కాల్ స్వీకరించండి. (Namaste, your horoscope analysis is ready. Panditji is calling you now. Please answer the call.)'
        },
        {
            lang: 'bilingual',
            label: 'పూర్తయింది • Completed (Bilingual)',
            step: 4,
            text: 'మీ జాతక సంప్రదింపు విజయవంతంగా పూర్తయింది. సూచించిన పరిహారాలు మరియు నివేదిక అందించబడింది. ధన్యవాదాలు. (Your consultation is complete. Prescribed remedies and report have been delivered. Thank you.)'
        },
        {
            lang: 'english',
            label: 'Under Review (English)',
            step: 2,
            text: 'Your birth details and queries are currently under review by Panditji. You will receive a direct WhatsApp call or detailed report within 24 hours.'
        },
        {
            lang: 'english',
            label: 'Calling Now (English)',
            step: 3,
            text: 'Namaste, your astrological reading is ready. Panditji is placing a direct consultation call to your WhatsApp/phone now. Please accept the call.'
        },
        {
            lang: 'english',
            label: 'Completed (English)',
            step: 4,
            text: 'Your consultation session is successfully completed. Recommended remedies, gemstones, and summary have been provided. Thank you!'
        },
        {
            lang: 'telugu',
            label: 'పరిశీలిస్తున్నారు (తెలుగు)',
            step: 2,
            text: 'మీరు అందించిన వివరాలను శ్రీ అన్నపూర్ణ జ్యోతిష్యాలయం పండిట్‌జీ పరిశీలిస్తున్నారు. 24 గంటల లోపల మీ వాట్సాప్ నంబర్‌కు నేరుగా కాల్ చేసి లేదా నివేదిక రూపంలో ఫలితాలు అందజేయబడును.'
        },
        {
            lang: 'telugu',
            label: 'కాల్ సమయం (తెలుగు)',
            step: 3,
            text: 'నమస్తే, మీ జాతక విశ్లేషణ సిద్ధంగా ఉంది. పండిట్‌జీ గారు ఇప్పుడు మీకు నేరుగా వాట్సాప్ / ఫోన్ కాల్ చేస్తున్నారు. దయచేసి కాల్ స్వీకరించండి.'
        },
        {
            lang: 'telugu',
            label: 'పూర్తయింది (తెలుగు)',
            step: 4,
            text: 'మీ జాతక సంప్రదింపు విజయవంతంగా పూర్తయింది. సూచించిన పరిహారాలు మరియు నివేదిక అందించబడింది. ధన్యవాదాలు.'
        }
    ];

    const filteredTemplates = selectedTemplateLang === 'all'
        ? NOTE_TEMPLATES
        : NOTE_TEMPLATES.filter(t => t.lang === selectedTemplateLang);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const fetchBooking = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await axios.get(`/admin/bookings/${id}`);
            setBooking(data);
            setSelectedStatus(data.status || 'Pending');
            setProgressStep(data.progressStep ?? 2);
            // Reset every field, so opening a past session never shows the previous client's notes
            setAstrologerNoteInput(data.astrologerUpdateNote || DEFAULT_PROGRESS_NOTE);
            setRemediesInput({
                gemstones: data.remedies?.gemstones || '',
                poojas: data.remedies?.poojas || '',
                mantras: data.remedies?.mantras || '',
                generalNotes: data.remedies?.generalNotes || ''
            });
            setCallDurationInput(data.callDuration || '');
            setFollowUpDateInput(data.followUpDate ? data.followUpDate.slice(0, 10) : '');
            setTimerActive(false);
            setCallSeconds(0);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch booking details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    // Timer Effect
    useEffect(() => {
        let interval = null;
        if (timerActive) {
            interval = setInterval(() => {
                setCallSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const formatTimer = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) {
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleStartCall = async () => {
        setTimerActive(true);
        try {
            await axios.put(`/admin/bookings/${id}/call-status`, { callStatus: 'In Call' });
            setBooking(prev => ({ ...prev, callStatus: 'In Call', progressStep: 3 }));
            setProgressStep(3);
            setSelectedStatus('Pending');
            showToast('Consultation call started. Timer running. Customer stage set to Live Call (3).', 'success');
        } catch (e) {
            console.error(e);
            showToast('The timer is running, but the customer stage could not be updated', 'error');
        }
    };

    const handleUpdateProgressStep = async (step, customNote) => {
        setUpdatingProgress(true);
        const targetStep = step !== undefined ? step : progressStep;
        const targetNote = customNote !== undefined ? customNote : astrologerNoteInput;
        try {
            const { data } = await axios.put(`/admin/bookings/${id}/progress-step`, {
                progressStep: targetStep,
                astrologerUpdateNote: targetNote
            });
            if (data.booking) {
                setBooking(data.booking);
                setProgressStep(data.booking.progressStep);
                if (data.booking.status) setSelectedStatus(data.booking.status);
                if (data.booking.astrologerUpdateNote) {
                    setAstrologerNoteInput(data.booking.astrologerUpdateNote);
                }
            } else {
                setProgressStep(targetStep);
            }
            showToast(`కస్టమర్ లైవ్ పురోగతి Stage ${targetStep} కి నవీకరించబడింది`, 'success');
        } catch (err) {
            console.error('Failed to update progress step:', err);
            showToast('Failed to update customer progress step', 'error');
        } finally {
            setUpdatingProgress(false);
        }
    };

    const handleEndCall = () => {
        setTimerActive(false);
        const mins = Math.max(1, Math.round(callSeconds / 60));
        const durationFormatted = `${mins} mins (${formatTimer(callSeconds)})`;
        setCallDurationInput(durationFormatted);
        setShowRemediesModal(true);
    };

    // Calculate Kundli
    const kundli = useMemo(() => {
        if (!booking) return null;
        return calculateClientKundli(booking.dob, booking.birthTime, booking.birthPlace);
    }, [booking]);

    // Calculate Marriage Matching (if applicable)
    const marriageMatch = useMemo(() => {
        if (!booking || normalizeServiceName(booking.consultationType) !== 'Marriage Matching') return null;
        return calculateGunaMilan(
            { name: booking.girlName, dob: booking.girlDob },
            { name: booking.boyName, dob: booking.boyDob }
        );
    }, [booking]);

    const handleStatusUpdate = async () => {
        setActionLoading(true);
        try {
            const { data } = await axios.put(`/admin/bookings/${id}/status`, { status: selectedStatus });
            setBooking(data);
            setSelectedStatus(data.status || 'Pending');
            showToast(`Status updated to ${selectedStatus}`, 'success');
        } catch {
            showToast('Failed to update status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveAndComplete = async () => {
        setSubmittingRemedies(true);
        try {
            const duration = callDurationInput || (callSeconds > 0 ? `${Math.max(1, Math.round(callSeconds / 60))} mins` : 'Completed Session');
            const { data } = await axios.put(`/admin/bookings/${id}/complete-call`, {
                callDuration: duration,
                remedies: remediesInput,
                followUpDate: followUpDateInput || undefined,
                sendEmail: sendEmailToggle,
                includeReviewLink: includeReviewToggle,
                callStatus: 'Completed'
            });

            setBooking(data.booking || data);
            setSelectedStatus('Completed');
            setProgressStep(4);
            setShowRemediesModal(false);
            if (sendEmailToggle && !data.emailSent) {
                showToast('Consultation saved, but the summary email could not be sent', 'error');
            } else {
                showToast('Consultation completed & remedies recorded successfully!', 'success');
            }
        } catch (err) {
            console.error('Failed to complete consultation', err);
            showToast('Failed to save consultation completion', 'error');
        } finally {
            setSubmittingRemedies(false);
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
        } catch {
            showToast('Failed to delete booking', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            await generateConsultationPDF(booking, remediesInput);
            showToast('Branded PDF Report downloaded successfully', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to generate PDF', 'error');
        }
    };

    const buildDetailGroup = (title, fields) => {
        const rows = fields.filter(([, value]) => value);
        return rows.length > 0 ? { title, rows } : null;
    };

    const personDetails = (title, prefix) => buildDetailGroup(title, [
        ['Name', booking?.[`${prefix}Name`]],
        ['Date of Birth', booking?.[`${prefix}Dob`]],
        ['Time of Birth', booking?.[`${prefix}Time`]],
        ['Place of Birth', booking?.[`${prefix}Place`]],
        ['Pincode', booking?.[`${prefix}Pincode`]],
    ]);

    const extraDetailGroups = [
        personDetails('Bride', 'girl'),
        personDetails('Groom', 'boy'),
        personDetails('Second Bride', 'girl2'),
        personDetails('Second Groom', 'boy2'),
        buildDetailGroup('Muhurtham', [
            ['From', booking?.startDate],
            ['To', booking?.endDate],
            ['Location', booking?.muhurthamLocation],
        ]),
    ].filter(Boolean);

    // Helper URLs
    const cleanPhone = booking?.phone ? String(booking.phone).replace(/[^0-9]/g, '') : '';
    const phoneWithCountry = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
    const whatsappGreeting = encodeURIComponent(
        `Namaste ${booking?.fullName || 'Ji'},\nI am AstroSharma. I am ready for your ${booking?.consultationType || 'Astrology'} consultation call.\nనమస్తే, మీ జాతక సంప్రదింపులకు సమయం సిద్ధంగా ఉంది.`
    );
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${whatsappGreeting}`;

    const handleSendWhatsAppSummary = () => {
        if (!booking?.phone) return;
        let msg = `*AstroSharma Vedic Consultation Summary*\n`;
        msg += `Namaste ${booking.fullName || 'Ji'},\nThank you for your consultation today.\n\n`;
        if (remediesInput.gemstones) msg += `💎 *Recommended Gemstone (రత్నం):* ${remediesInput.gemstones}\n`;
        if (remediesInput.poojas) msg += `🪔 *Recommended Poojas (పూజలు):* ${remediesInput.poojas}\n`;
        if (remediesInput.mantras) msg += `🕉️ *Daily Mantra (మంత్ర సాధన):* ${remediesInput.mantras}\n`;
        if (remediesInput.generalNotes) msg += `📜 *Notes:* ${remediesInput.generalNotes}\n`;
        msg += `\n⭐ Please share your review: ${CLIENT_URL}/review?bookingId=${booking._id}`;

        const summaryUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
        window.open(summaryUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                    <p className="text-sm font-medium text-slate-400">Loading consultation dossier...</p>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
                    <AlertCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-100">{error || 'Booking Not Found'}</h3>
                <p className="text-sm text-slate-400 max-w-md">This booking record might have been removed or does not exist.</p>
                <button
                    onClick={() => navigate('/bookings')}
                    className="btn-primary text-xs px-4 py-2 mt-2 gap-2 cursor-pointer"
                >
                    <ArrowLeft size={14} /> Back to Bookings Directory
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-7 animate-in fade-in duration-500 relative z-10 pb-16">
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            {/* Navigation & Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                <button
                    onClick={() => navigate('/bookings')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Bookings Directory</span>
                </button>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                        <Download size={14} className="text-cyan-400" />
                        <span>Download PDF Report</span>
                    </button>

                    <button
                        onClick={handleSendEmail}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#fff8e7]/10 text-[#fff8e7] border border-[#fff8e7]/30 hover:bg-[#fff8e7]/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        <Send size={14} className="text-[#fff8e7]" />
                        <span>{actionLoading ? 'Sending...' : 'Email Confirmation'}</span>
                    </button>

                    <button
                        onClick={handleDeleteBooking}
                        disabled={deleteLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Client Profile Header Card */}
            <section className="glass-panel p-6 sm:p-7 rounded-2xl relative overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/10 via-[#fff8e7]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    {/* Left: Client Info */}
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-lg shadow-amber-900/30">
                            {booking.fullName ? booking.fullName.charAt(0).toUpperCase() : 'C'}
                        </div>

                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                                    {getClientName(booking)}
                                </h1>

                                {booking.isRepeatClient && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
                                        <Award size={13} className="text-amber-400" />
                                        <span>Repeat Client ({booking.totalSessions} Sessions)</span>
                                    </span>
                                )}

                                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                                    booking.status === 'Completed'
                                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                        : booking.status === 'Failed'
                                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                }`}>
                                    {booking.status || 'Pending'}
                                </span>
                            </div>

                            <p className="text-sm font-semibold text-cyan-300 mt-1">
                                {booking.consultationType} Consultation
                            </p>

                            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <Phone size={13} className="text-cyan-400" />
                                    {booking.phone}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Mail size={13} className="text-slate-400" />
                                    {booking.email}
                                </span>
                                {booking.birthPlace && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={13} className="text-[#fff8e7]" />
                                        {booking.birthPlace}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Fee & Razorpay Info */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-6 gap-2">
                        <div className="text-left lg:text-right">
                            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Amount Paid</span>
                            <div className="flex items-center gap-1 text-2xl font-extrabold text-emerald-400 lg:justify-end">
                                <span>₹</span>
                                <span>{formatAmount(getAmountPaid(booking))}</span>
                            </div>
                            {hasDiscount(booking) && (
                                <p className="text-[11px] text-slate-400">
                                    <span className="line-through">₹{formatAmount(getListPrice(booking))}</span>
                                    {booking.couponCode && <span> • Coupon {booking.couponCode}</span>}
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] text-slate-500">Order Ref</span>
                            <p className="text-xs font-mono text-slate-400">
                                {booking.razorpay_order_id ? `${booking.razorpay_order_id.slice(0, 14)}...` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 1. Host Call Control Bar (Featured Toolbar) */}
                <div className="mt-6 pt-5 border-t border-slate-800/90 relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/40">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* WhatsApp Call / Chat Button */}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 hover:border-emerald-400/50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] active:scale-95"
                            title="Open WhatsApp chat with pre-filled Telugu/English greeting"
                        >
                            <MessageCircle size={16} className="text-emerald-400" />
                            <span>WhatsApp Connect</span>
                            <ExternalLink size={12} className="opacity-70" />
                        </a>

                        {/* Direct Phone Call Button */}
                        <a
                            href={`tel:${booking.phone}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-400/50 transition-all active:scale-95"
                            title="Dial client phone directly"
                        >
                            <Phone size={16} className="text-blue-400" />
                            <span>Direct Call ({booking.phone})</span>
                        </a>

                        {/* Remedies & Notes Button */}
                        <button
                            onClick={() => setShowRemediesModal(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#fff8e7]/10 text-[#fff8e7] border border-[#fff8e7]/30 hover:bg-[#fff8e7]/20 transition-all cursor-pointer"
                        >
                            <Sparkles size={14} className="text-amber-400" />
                            <span>{booking.remedies?.gemstones || booking.remedies?.poojas ? 'View / Edit Remedies' : 'Record Remedies (పరిహారాలు)'}</span>
                        </button>
                    </div>

                    {/* Live Call Timer Suite */}
                    <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-950/70 px-4 py-2 rounded-xl border border-slate-800">
                        {timerActive ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span className="text-xs font-bold font-mono text-emerald-400 tracking-wider">
                                        {formatTimer(callSeconds)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleEndCall}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-md active:scale-95 cursor-pointer"
                                    title="End call and open remedies modal"
                                >
                                    <PhoneOff size={14} />
                                    <span>End Call</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                {booking.callDuration && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock size={12} className="text-cyan-400" />
                                        Last: {booking.callDuration}
                                    </span>
                                )}
                                <button
                                    onClick={handleStartCall}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all active:scale-95 cursor-pointer"
                                >
                                    <PhoneCall size={14} className="text-emerald-400" />
                                    <span>Start Call Session</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Customer Real-Time Progress Tracker (కస్టమర్ ప్రస్తుత పురోగతి - లైవ్ ట్రాకింగ్) */}
            <section className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-cyan-500" />

                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                            <Clock size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-bold text-white tracking-wide">
                                    ప్రస్తుత పురోగతి <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">(Customer Real-Time Progress)</span>
                                </h2>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5" />
                                    Live Sync with Customer Screen
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                కస్టమర్ ట్రాకింగ్ స్క్రీన్‌పై కనిపించే 4 దశల పురోగతి మరియు లైవ్ అప్‌డేట్ నోట్‌ను ఇక్కడి నుండి నిర్వహించండి.
                                <span className="text-slate-500 block sm:inline sm:ml-1 font-sans">
                                    (Manage the 4-stage live progress and custom note shown on the customer's screen.)
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Active Stage Indicator */}
                    <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                        <span className="text-xs text-slate-400">ప్రస్తుత దశ / Active:</span>
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            Stage {progressStep} of 4:
                            <span className="text-white">
                                {progressStep === 1 && 'దక్షిణ సమర్పణ • Payment Confirmed'}
                                {progressStep === 2 && 'జాతక గణన • Horoscope Analysis'}
                                {progressStep === 3 && 'ప్రత్యక్ష కాల్ • Live Consultation Call'}
                                {progressStep === 4 && 'సంప్రదింపు పూర్తి • Consultation Completed'}
                            </span>
                        </span>
                    </div>
                </div>

                {/* 4-Step Visual Progress Stepper (Matching Client Screen Layout with English) */}
                <div className="py-7 px-2 sm:px-6">
                    <div className="relative flex items-center justify-between max-w-3xl mx-auto">
                        {/* Connecting Background Line */}
                        <div className="absolute top-5 left-10 right-10 h-1 bg-slate-700/60 z-0" />

                        {/* Active Progress Filled Line */}
                        <div
                            className="absolute top-5 left-10 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-cyan-500 z-0 transition-all duration-500 ease-out"
                            style={{
                                width: `${progressStep === 1 ? 0 : progressStep === 2 ? 33 : progressStep === 3 ? 66 : 100}%`
                            }}
                        />

                        {/* Step 1: దక్షిణ సమర్పణ / Payment Confirmed */}
                        <div
                            className="relative z-10 flex flex-col items-center text-center group cursor-pointer max-w-[150px]"
                            onClick={() => handleUpdateProgressStep(1)}
                            title="Click to set Stage 1 (Payment Confirmed)"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                progressStep >= 1
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                                <Check size={18} className="stroke-[3]" />
                            </div>
                            <span className="text-xs font-bold text-slate-100 mt-2.5">
                                దక్షిణ సమర్పణ
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                                Payment Confirmed
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium mt-0.5">
                                స్వీకరించబడింది • Received
                            </span>
                        </div>

                        {/* Step 2: జాతక గణన / Horoscope Analysis */}
                        <div
                            className="relative z-10 flex flex-col items-center text-center group cursor-pointer max-w-[150px]"
                            onClick={() => handleUpdateProgressStep(2)}
                            title="Click to set Stage 2 (Horoscope Calculation In Progress)"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                progressStep > 2
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                                    : progressStep === 2
                                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/50 ring-4 ring-amber-500/30 animate-pulse'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                                {progressStep > 2 ? (
                                    <Check size={18} className="stroke-[3]" />
                                ) : (
                                    <Sparkles size={18} className="text-white" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-100 mt-2.5">
                                జాతక గణన
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                                Horoscope Analysis
                            </span>
                            <span className={`text-[10px] font-medium mt-0.5 ${progressStep === 2 ? 'text-amber-400 animate-pulse font-bold' : progressStep > 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {progressStep === 2 ? 'జరుగుతోంది... • In Progress' : progressStep > 2 ? 'పూర్తయింది • Completed' : 'పెండింగ్ • Pending'}
                            </span>
                        </div>

                        {/* Step 3: ప్రత్యక్ష కాల్ / Live Consultation Call */}
                        <div
                            className="relative z-10 flex flex-col items-center text-center group cursor-pointer max-w-[150px]"
                            onClick={() => handleUpdateProgressStep(3)}
                            title="Click to set Stage 3 (Live Call)"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                progressStep > 3
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                                    : progressStep === 3
                                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 ring-4 ring-cyan-500/30 animate-pulse'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                                {progressStep > 3 ? (
                                    <Check size={18} className="stroke-[3]" />
                                ) : (
                                    <Phone size={18} />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-100 mt-2.5">
                                ప్రత్యక్ష కాల్
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                                Live Consultation Call
                            </span>
                            <span className={`text-[10px] font-medium mt-0.5 ${progressStep === 3 ? 'text-cyan-400 animate-pulse font-bold' : progressStep > 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {progressStep === 3 ? 'కాల్ జరుగుతోంది • In Call' : progressStep > 3 ? 'పూర్తయింది • Completed' : 'రాబోయే కాల్ • Upcoming'}
                            </span>
                        </div>

                        {/* Step 4: సంప్రదింపు పూర్తి / Consultation Completed */}
                        <div
                            className="relative z-10 flex flex-col items-center text-center group cursor-pointer max-w-[150px]"
                            onClick={() => handleUpdateProgressStep(4)}
                            title="Click to set Stage 4 (Consultation Completed)"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                progressStep === 4
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                                {progressStep === 4 ? (
                                    <Check size={18} className="stroke-[3]" />
                                ) : (
                                    <span>4</span>
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-100 mt-2.5">
                                సంప్రదింపు పూర్తి
                            </span>
                            <span className="text-[11px] font-semibold text-slate-300">
                                Consultation Completed
                            </span>
                            <span className={`text-[10px] font-medium mt-0.5 ${progressStep === 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                {progressStep === 4 ? 'విజయవంతం • Finished' : 'ఆఖరి దశ • Final Step'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stage Advance Toolbar (Bilingual) */}
                <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-700/50 mb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Layers size={14} className="text-amber-400" />
                            త్వరిత దశ మార్పు • One-Click Stage Switch:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { step: 1, te: 'దక్షిణ సమర్పణ', en: 'Payment Confirmed' },
                                { step: 2, te: 'జాతక గణన', en: 'Analysis In Progress' },
                                { step: 3, te: 'ప్రత్యక్ష కాల్', en: 'Live Call' },
                                { step: 4, te: 'సంప్రదింపు పూర్తి', en: 'Completed' }
                            ].map(item => (
                                <button
                                    key={item.step}
                                    type="button"
                                    disabled={updatingProgress}
                                    onClick={() => handleUpdateProgressStep(item.step)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        progressStep === item.step
                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                                    }`}
                                >
                                    {progressStep === item.step && <Check size={12} className="stroke-[3]" />}
                                    <span>
                                        {item.step}. {item.te} <span className="opacity-75 font-normal">({item.en})</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Astrologer Live Update Note to Customer (జ్యోతిష్యాలయం నుండి అప్‌డేట్ - Bilingual) */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 relative">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                            <Sparkles size={18} />
                        </div>
                        <div className="flex-1 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h3 className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide flex items-center gap-1.5">
                                    జ్యోతిష్యాలయం నుండి అప్‌డేట్ <span className="text-slate-300 font-normal text-xs">• Astrologer Live Note to Customer</span>
                                </h3>
                                <span className="text-[11px] text-slate-400">
                                    ఈ సందేశం కస్టమర్ స్క్రీన్‌పై కనిపిస్తుంది • Visible live on customer's tracking screen
                                </span>
                            </div>

                            {/* Language Filter & Preset Quick Chips */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] text-slate-400 font-medium">భాష / Filter:</span>
                                    {[
                                        { id: 'all', label: 'All Templates' },
                                        { id: 'bilingual', label: 'Bilingual (తెలుగు + English)' },
                                        { id: 'english', label: 'English Only' },
                                        { id: 'telugu', label: 'తెలుగు మాత్రమే' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setSelectedTemplateLang(tab.id)}
                                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                                                selectedTemplateLang === tab.id
                                                    ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 font-bold'
                                                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] text-slate-400 font-medium mr-1">టెంప్లేట్లు / Templates:</span>
                                    {filteredTemplates.map((tmpl, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setAstrologerNoteInput(tmpl.text);
                                                handleUpdateProgressStep(tmpl.step, tmpl.text);
                                            }}
                                            className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-amber-500/20 text-slate-200 hover:text-amber-200 border border-slate-700/70 hover:border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                                            title="Click to apply and save this message"
                                        >
                                            <span className="text-amber-400 font-bold">+</span>
                                            <span>{tmpl.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Area */}
                            <textarea
                                rows={2}
                                value={astrologerNoteInput}
                                onChange={(e) => setAstrologerNoteInput(e.target.value)}
                                placeholder="కస్టమర్ స్క్రీన్‌పై కనిపించాల్సిన అప్‌డేట్ సందేశాన్ని టైప్ చేయండి / Type update message in Telugu, English or both..."
                                className="w-full bg-slate-900/90 text-slate-200 text-xs sm:text-sm rounded-lg p-3 border border-slate-700/80 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all leading-relaxed"
                            />

                            {/* Submit Button */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                                <span className="text-[11px] text-slate-400">
                                    Tip: You can send bilingual notes or pure English notes for non-Telugu speaking clients.
                                </span>
                                <button
                                    type="button"
                                    disabled={updatingProgress}
                                    onClick={() => handleUpdateProgressStep(progressStep, astrologerNoteInput)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    {updatingProgress ? (
                                        <>
                                            <Loader2 size={13} className="animate-spin" />
                                            <span>నవీకరిస్తోంది... / Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={13} />
                                            <span>కస్టమర్ సందేశం నవీకరించు • Update Customer Note</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                {/* Left 7 Columns: Astrological Dossier & Kundli Chart */}
                <div className="lg:col-span-7 space-y-7">
                    {/* Birth Information Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-700/40">
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 mb-4 border-b border-slate-700/40">
                            <User size={18} className="text-cyan-400" />
                            <span>Client Birth Coordinates</span>
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block mb-0.5">Date of Birth</span>
                                <span className="font-semibold text-slate-200">{booking.dob || 'Not provided'}</span>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block mb-0.5">Time of Birth</span>
                                <span className="font-semibold text-slate-200">{booking.birthTime || 'Not provided'}</span>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block mb-0.5">Place of Birth</span>
                                <span className="font-semibold text-slate-200 truncate block">{booking.birthPlace || 'Not provided'}</span>
                            </div>
                            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                                <span className="text-slate-500 block mb-0.5">Pincode</span>
                                <span className="font-semibold text-slate-200">{booking.pincode || 'N/A'}</span>
                            </div>
                        </div>

                        {booking.question && (
                            <div className="mt-4 pt-4 border-t border-slate-800/80">
                                <span className="text-xs font-semibold text-[#fff8e7] block mb-1">
                                    Client Question / Spiritual Inquiry:
                                </span>
                                <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-[#fff8e7]/20 leading-relaxed italic">
                                    "{booking.question}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bride & Groom / Muhurtham details entered by the customer */}
                    {extraDetailGroups.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 mb-4 border-b border-slate-700/40">
                                <Heart size={18} className="text-pink-400" />
                                <span>Details Provided by the Customer</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                {extraDetailGroups.map((group) => (
                                    <div key={group.title} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                                        <p className="text-xs font-bold uppercase tracking-wide text-pink-300 mb-2">{group.title}</p>
                                        {group.rows.map(([label, value]) => (
                                            <div key={label} className="flex justify-between gap-3 py-0.5">
                                                <span className="text-slate-500">{label}</span>
                                                <span className="font-semibold text-slate-200 text-right break-words min-w-0">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Calculated from a hash of the text fields, not from planetary positions */}
                    <div role="note" className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 text-xs leading-relaxed">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                        <p>
                            <strong>Placeholder values, not a real calculation.</strong> The chart{marriageMatch ? ' and Guna Milan score' : ''} below
                            {marriageMatch ? ' are' : ' is'} generated from the text of the birth details, not from planetary positions.
                            Do not use {marriageMatch ? 'them' : 'it'} for guidance. Use the Kundli tools on the main website instead. These values are not included in the PDF report.
                        </p>
                    </div>

                    {/* 3. In-Page Kundli Chart & Planetary Positions Card (Styled in Authentic Vedic Parchment #fff8e7) */}
                    <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-[#fff8e7]/5 to-slate-900/90">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/40 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Compass size={18} className="text-amber-400" />
                                <h3 className="text-base font-bold text-slate-100">
                                    Vedic Kundli & Planetary Coordinates
                                </h3>
                            </div>

                            {/* Chart style toggle */}
                            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                                <button
                                    onClick={() => setChartType('south')}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        chartType === 'south' ? 'bg-[#fff8e7] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    South Indian (దక్షిణ)
                                </button>
                                <button
                                    onClick={() => setChartType('north')}
                                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                        chartType === 'north' ? 'bg-[#fff8e7] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    North Indian (ఉత్తర)
                                </button>
                            </div>
                        </div>

                        {/* Key Vedic Metrics Banner */}
                        {kundli && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
                                <div className="p-3 rounded-xl bg-[#fff8e7]/10 border border-[#fff8e7]/30 text-center">
                                    <span className="text-[10px] text-[#fff8e7] uppercase font-semibold block">Lagna (Ascendant)</span>
                                    <p className="font-bold text-slate-100 text-sm mt-0.5">{kundli.lagna?.name.split(' ')[0]}</p>
                                    <p className="text-[10px] text-amber-400">{kundli.lagna?.telugu}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                                    <span className="text-[10px] text-cyan-300 uppercase font-semibold block">Rashi (Moon Sign)</span>
                                    <p className="font-bold text-slate-100 text-sm mt-0.5">{kundli.rashi?.name.split(' ')[0]}</p>
                                    <p className="text-[10px] text-cyan-400">{kundli.rashi?.telugu}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                    <span className="text-[10px] text-amber-300 uppercase font-semibold block">Nakshatra</span>
                                    <p className="font-bold text-slate-100 text-sm mt-0.5">{kundli.nakshatra?.name}</p>
                                    <p className="text-[10px] text-amber-400">Pada {kundli.pada}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                    <span className="text-[10px] text-emerald-300 uppercase font-semibold block">Nakshatra Lord</span>
                                    <p className="font-bold text-slate-100 text-sm mt-0.5">{kundli.nakshatra?.lord}</p>
                                    <p className="text-[10px] text-emerald-400">{kundli.rashi?.element} Element</p>
                                </div>
                            </div>
                        )}

                        {/* Visual Chart Rendering */}
                        <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                            {chartType === 'south' ? (
                                /* South Indian Traditional 12-Box Grid Chart on #fff8e7 Vedic Parchment */
                                <div className="w-full max-w-[360px] aspect-square grid grid-cols-4 grid-rows-4 border-2 border-amber-500/60 rounded-xl overflow-hidden bg-[#fff8e7] text-slate-900 shadow-xl text-xs">
                                    {/* 12 Traditional South Indian Houses */}
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Meena ♓</span>
                                        <span className="text-cyan-600 font-bold text-[10px]">Ju, Ve</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Mesha ♈</span>
                                        <span className="text-amber-600 font-bold text-[10px]">As, Su</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Vrishabha ♉</span>
                                        <span className="text-amber-700 font-bold text-[10px]">Me</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Mithuna ♊</span>
                                        <span className="text-emerald-700 font-bold text-[10px]">Ra</span>
                                    </div>

                                    {/* Row 2 */}
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Kumbha ♒</span>
                                        <span className="text-slate-400 font-bold text-[10px]">-</span>
                                    </div>
                                    {/* Center Box (spans 2x2) */}
                                    <div className="col-span-2 row-span-2 border border-amber-500/40 bg-amber-100/60 flex flex-col items-center justify-center p-2 text-center">
                                        <Compass size={24} className="text-amber-600 mb-1" />
                                        <span className="text-[11px] font-bold text-slate-900">Rashi D-1 Chart</span>
                                        <span className="text-[9px] text-amber-800 font-semibold">చతురస్ర చక్రం</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Karka ♋</span>
                                        <span className="text-blue-700 font-bold text-[10px]">Mo</span>
                                    </div>

                                    {/* Row 3 */}
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Makara ♑</span>
                                        <span className="text-rose-700 font-bold text-[10px]">Sa</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Simha ♌</span>
                                        <span className="text-amber-600 font-bold text-[10px]">-</span>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Dhanu ♐</span>
                                        <span className="text-emerald-700 font-bold text-[10px]">Ke</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Vrischika ♏</span>
                                        <span className="text-rose-700 font-bold text-[10px]">Ma</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Tula ♎</span>
                                        <span className="text-slate-400 font-bold text-[10px]">-</span>
                                    </div>
                                    <div className="border border-amber-500/30 p-1.5 flex flex-col justify-between">
                                        <span className="text-[9px] text-slate-600 font-medium">Kanya ♍</span>
                                        <span className="text-cyan-700 font-bold text-[10px]">-</span>
                                    </div>
                                </div>
                            ) : (
                                /* North Indian Diamond Chart SVG */
                                <div className="w-full max-w-[340px] aspect-square relative flex items-center justify-center bg-[#fff8e7] rounded-xl p-2 shadow-xl">
                                    <svg viewBox="0 0 300 300" className="w-full h-full stroke-amber-600/80 fill-none stroke-[2]">
                                        <rect x="5" y="5" width="290" height="290" />
                                        <line x1="5" y1="5" x2="295" y2="295" />
                                        <line x1="295" y1="5" x2="5" y2="295" />
                                        <line x1="150" y1="5" x2="295" y2="150" />
                                        <line x1="295" y1="150" x2="150" y2="295" />
                                        <line x1="150" y1="295" x2="5" y2="150" />
                                        <line x1="5" y1="150" x2="150" y2="5" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-[10px] font-bold text-slate-900">
                                        <span className="text-amber-800">1st (Lagna)</span>
                                        <span className="text-xs text-amber-600">{kundli?.lagna?.name.split(' ')[0]}</span>
                                    </div>
                                </div>
                            )}

                            <span className="text-[11px] text-slate-500 mt-3 text-center">
                                Planetary positions derived from Vedic Lahiri Ayanamsa
                            </span>
                        </div>
                    </div>

                    {/* Marriage Matching Ashtakoota Section (if applicable) */}
                    {marriageMatch && (
                        <div className="glass-panel p-6 rounded-2xl border border-pink-500/20">
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/40">
                                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                    <Heart size={18} className="text-pink-400" />
                                    <span>Ashtakoota 36 Guna Milan (వివాహ పొంతన)</span>
                                </h3>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-pink-500/10 text-pink-300 border border-pink-500/30">
                                    <span>{marriageMatch.totalScore} / 36 Gunas</span>
                                    <span>({marriageMatch.percentage}%)</span>
                                </div>
                            </div>

                            {/* Verdict Pill */}
                            <div className={`p-3.5 rounded-xl mb-4 border text-xs font-semibold ${
                                marriageMatch.verdictColor === 'emerald'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : marriageMatch.verdictColor === 'amber'
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}>
                                <p className="font-bold text-sm">{marriageMatch.verdict}</p>
                                <p className="mt-0.5 opacity-90">{marriageMatch.verdictTelugu}</p>
                                <p className="mt-1 pt-1 border-t border-slate-700/40 text-[11px]">
                                    Manglik Analysis: {marriageMatch.manglikDosha}
                                </p>
                            </div>

                            {/* 8 Kootas Table */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {marriageMatch.kootas.map((k, i) => (
                                    <div key={i} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-300 truncate">{k.name}</p>
                                            <p className="text-[10px] text-slate-500">{k.desc}</p>
                                        </div>
                                        <p className="text-sm font-bold text-pink-400 mt-2">
                                            {k.score} / {k.max}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right 5 Columns: Prescribed Remedies, Payments & Status */}
                <div className="lg:col-span-5 space-y-7">
                    {/* Prescribed Remedies Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 relative">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/40">
                            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                                <Sparkles size={18} className="text-amber-400" />
                                <span>Prescribed Remedies (పరిహారాలు)</span>
                            </h3>

                            <button
                                onClick={() => setShowRemediesModal(true)}
                                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                            >
                                Edit Remedies
                            </button>
                        </div>

                        {booking.remedies?.recordedAt ? (
                            <div className="space-y-3.5 text-xs">
                                {booking.remedies.gemstones && (
                                    <div className="p-3 bg-[#fff8e7]/10 border border-[#fff8e7]/30 rounded-xl">
                                        <span className="text-[11px] font-bold text-[#fff8e7] uppercase block mb-1">
                                            💎 Recommended Gemstone (రత్నం)
                                        </span>
                                        <p className="text-slate-200">{booking.remedies.gemstones}</p>
                                    </div>
                                )}

                                {booking.remedies.poojas && (
                                    <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl">
                                        <span className="text-[11px] font-bold text-amber-300 uppercase block mb-1">
                                            🪔 Recommended Poojas & Temples (పూజలు / దర్శనాలు)
                                        </span>
                                        <p className="text-slate-200">{booking.remedies.poojas}</p>
                                    </div>
                                )}

                                {booking.remedies.mantras && (
                                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                                        <span className="text-[11px] font-bold text-emerald-300 uppercase block mb-1">
                                            🕉️ Daily Mantras (మంత్ర సాధన)
                                        </span>
                                        <p className="text-slate-200">{booking.remedies.mantras}</p>
                                    </div>
                                )}

                                {booking.remedies.generalNotes && (
                                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                            📜 Acharya Remarks
                                        </span>
                                        <p className="text-slate-300 whitespace-pre-line">{booking.remedies.generalNotes}</p>
                                    </div>
                                )}

                                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Recorded: {new Date(booking.remedies.recordedAt).toLocaleDateString()}</span>
                                    <button
                                        onClick={handleSendWhatsAppSummary}
                                        className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <MessageCircle size={12} /> Send via WhatsApp
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-400 mb-3">
                                    No remedies recorded yet for this session. Record gemstones, poojas, and mantras during or after the consultation call.
                                </p>
                                <button
                                    onClick={() => setShowRemediesModal(true)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer"
                                >
                                    + Add Remedies & Advice
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Status Update Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-700/40">
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 mb-4 border-b border-slate-700/40">
                            <Clock size={18} className="text-cyan-400" />
                            <span>Consultation Status</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1.5 block">Booking State</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="Pending">Pending Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Failed">Failed / Cancelled</option>
                                </select>
                            </div>

                            <button
                                onClick={handleStatusUpdate}
                                disabled={actionLoading || selectedStatus === booking.status}
                                className="w-full btn-primary text-xs py-2.5 disabled:opacity-50 cursor-pointer"
                            >
                                {actionLoading ? 'Updating Status...' : 'Save Status Change'}
                            </button>
                        </div>
                    </div>

                    {/* Razorpay & Audit Details */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-700/40 text-xs">
                        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 pb-3 mb-3 border-b border-slate-700/40">
                            <CreditCard size={18} className="text-emerald-400" />
                            <span>Payment & Ledger Audit</span>
                        </h3>

                        <div className="space-y-2.5">
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-500">Razorpay Order ID</span>
                                <span className="font-mono text-slate-300 select-all">{booking.razorpay_order_id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-500">Payment ID</span>
                                <span className="font-mono text-slate-300 select-all">{booking.razorpay_payment_id || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-500">Booked On</span>
                                <span className="text-slate-300">{new Date(booking.createdAt).toLocaleString()}</span>
                            </div>
                            {booking.completedAt && (
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-500">Completed At</span>
                                    <span className="text-emerald-400 font-medium">{new Date(booking.completedAt).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Client Past History & CRM Timeline Card */}
            {booking.history && booking.history.length > 0 && (
                <section className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-700/40 mt-8">
                    <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-700/40">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                                <History size={18} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-100">
                                    Client Consultation History & CRM
                                </h3>
                                <p className="text-xs text-slate-400">Previous sessions booked with this phone or email</p>
                            </div>
                        </div>

                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {booking.history.length} Previous Sessions
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {booking.history.map((past) => (
                            <div
                                key={past._id}
                                onClick={() => navigate(`/bookings/${past._id}`)}
                                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                        {past.consultationType}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                        past.status === 'Completed'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                        {past.status}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400 line-clamp-2 italic mb-3">
                                    "{past.question || 'Standard Vedic consultation'}"
                                </p>

                                {past.remedies?.gemstones && (
                                    <div className="text-[11px] text-[#fff8e7] truncate mb-1">
                                        💎 {past.remedies.gemstones}
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>{new Date(past.createdAt).toLocaleDateString()}</span>
                                    <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                                        View Dossier →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 2. "Call Completed & Astrologer Remedies" Drawer/Modal */}
            {showRemediesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#fff8e7]/15 text-[#fff8e7] flex items-center justify-center border border-[#fff8e7]/30">
                                    <Sparkles size={20} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100">
                                        Consultation Remedies & Advice (పరిహారాలు)
                                    </h3>
                                    <p className="text-xs text-slate-400">Record prescriptions and trigger automated client emails</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowRemediesModal(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Call Duration & Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="text-slate-400 block mb-1 font-medium">Session Duration</label>
                                <input
                                    type="text"
                                    value={callDurationInput}
                                    onChange={(e) => setCallDurationInput(e.target.value)}
                                    placeholder="e.g. 25 mins"
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1 font-medium">Schedule Follow-Up (Optional)</label>
                                <input
                                    type="date"
                                    value={followUpDateInput}
                                    onChange={(e) => setFollowUpDateInput(e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Remedies Textareas */}
                        <div className="space-y-3.5 text-xs">
                            <div>
                                <label className="text-[#fff8e7] font-semibold block mb-1 flex items-center gap-1.5">
                                    <span>💎 Recommended Gemstones (రత్నాలు)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Yellow Sapphire (పుష్యరాగం) 4.5 carats in Gold on Index Finger"
                                    value={remediesInput.gemstones}
                                    onChange={(e) => setRemediesInput(prev => ({ ...prev, gemstones: e.target.value }))}
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                                />
                            </div>

                            <div>
                                <label className="text-amber-300 font-semibold block mb-1 flex items-center gap-1.5">
                                    <span>🪔 Recommended Poojas & Temples (పూజలు / దర్శనాలు)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Navagraha Shanti, Rudrabhishekam at Srikalahasti on Mondays"
                                    value={remediesInput.poojas}
                                    onChange={(e) => setRemediesInput(prev => ({ ...prev, poojas: e.target.value }))}
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-emerald-300 font-semibold block mb-1 flex items-center gap-1.5">
                                    <span>🕉️ Daily Mantras & Japa (మంత్ర సాధన)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Om Namah Shivaya (108 times daily), Aditya Hrudayam on Sundays"
                                    value={remediesInput.mantras}
                                    onChange={(e) => setRemediesInput(prev => ({ ...prev, mantras: e.target.value }))}
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-slate-300 font-semibold block mb-1">
                                    📜 Acharya General Advice & Notes
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Dietary, behavioral, and planetary balance advice given to client..."
                                    value={remediesInput.generalNotes}
                                    onChange={(e) => setRemediesInput(prev => ({ ...prev, generalNotes: e.target.value }))}
                                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Communication Toggles */}
                        <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={sendEmailToggle}
                                    onChange={(e) => setSendEmailToggle(e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                                />
                                <span>Send Consultation Summary & Prescribed Remedies to client via Email ({booking.email})</span>
                            </label>

                            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={includeReviewToggle}
                                    onChange={(e) => setIncludeReviewToggle(e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                                />
                                <span>Include "Write a Review" invitation link in the email</span>
                            </label>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleSendWhatsAppSummary}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all cursor-pointer"
                            >
                                <MessageCircle size={14} />
                                <span>Send via WhatsApp</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRemediesModal(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleSaveAndComplete}
                                    disabled={submittingRemedies}
                                    className="btn-primary text-xs px-5 py-2.5 gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {submittingRemedies ? 'Saving...' : 'Save & Complete Consultation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetail;
