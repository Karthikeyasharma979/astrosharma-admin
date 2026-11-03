import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Pause, Pencil, Play, Plus, Trash2, X } from 'lucide-react';
import Toast from '../components/Toast';

const EMPTY_FORM = {
    code: '',
    name: '',
    discountType: 'percentage',
    discountValue: '',
    minAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    oneUsePerCustomer: true,
    newCustomersOnly: false,
    isActive: true
};

const STATUS_STYLES = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Expired: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Used up': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
};

// Coupon dates are in Indian time, the same as the website that checks them
const getIndiaToday = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const getStatus = (coupon) => {
    const today = getIndiaToday();
    if (!coupon.isActive) return 'Paused';
    if (coupon.endDate && today > coupon.endDate) return 'Expired';
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return 'Used up';
    if (coupon.startDate && today < coupon.startDate) return 'Scheduled';
    return 'Active';
};

const formatDate = (dateKey) => {
    const [year, month, day] = dateKey.split('-');
    return `${day}/${month}/${year}`;
};

const formatValidity = ({ startDate, endDate }) => {
    if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    if (startDate) return `From ${formatDate(startDate)}`;
    if (endDate) return `Until ${formatDate(endDate)}`;
    return 'No end date';
};

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [form, setForm] = useState(null); // null = closed
    const [editingId, setEditingId] = useState(null);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const { data } = await axios.get('/admin/coupons');
                setCoupons(data);
            } catch (error) {
                console.error('Failed to fetch coupons', error);
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchCoupons();
    }, []);

    const openNewForm = () => {
        setEditingId(null);
        setFormError('');
        setForm(EMPTY_FORM);
    };

    const openEditForm = (coupon) => {
        setEditingId(coupon._id);
        setFormError('');
        setForm({
            code: coupon.code,
            name: coupon.name || '',
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            minAmount: coupon.minAmount ? String(coupon.minAmount) : '',
            startDate: coupon.startDate || '',
            endDate: coupon.endDate || '',
            usageLimit: coupon.usageLimit === null ? '' : String(coupon.usageLimit),
            oneUsePerCustomer: coupon.oneUsePerCustomer,
            newCustomersOnly: coupon.newCustomersOnly,
            isActive: coupon.isActive
        });
    };

    const updateField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormError('');
        try {
            if (editingId) {
                const { data } = await axios.put(`/admin/coupons/${editingId}`, form);
                setCoupons(prev => prev.map(coupon => (coupon._id === editingId ? data : coupon)));
                showToast(`${data.code} updated`);
            } else {
                const { data } = await axios.post('/admin/coupons', form);
                setCoupons(prev => [data, ...prev]);
                showToast(`${data.code} created`);
            }
            setForm(null);
        } catch (error) {
            console.error('Failed to save coupon', error);
            setFormError(error.response?.data?.message || 'Could not save this coupon. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (coupon) => {
        setBusyId(coupon._id);
        try {
            const { data } = await axios.put(`/admin/coupons/${coupon._id}`, { ...coupon, isActive: !coupon.isActive });
            setCoupons(prev => prev.map(item => (item._id === coupon._id ? data : item)));
            showToast(`${coupon.code} ${data.isActive ? 'activated' : 'paused'}`);
        } catch (error) {
            console.error('Failed to update coupon', error);
            showToast(error.response?.data?.message || 'Failed to update coupon', 'error');
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (coupon) => {
        const confirmed = window.confirm(`Delete ${coupon.code}? Customers will no longer be able to use it. Past bookings are not affected.`);
        if (!confirmed) return;

        setBusyId(coupon._id);
        try {
            await axios.delete(`/admin/coupons/${coupon._id}`);
            setCoupons(prev => prev.filter(item => item._id !== coupon._id));
            showToast(`${coupon.code} deleted`);
        } catch (error) {
            console.error('Failed to delete coupon', error);
            showToast('Failed to delete coupon', 'error');
        } finally {
            setBusyId(null);
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

            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 mb-2">Coupons</h1>
                    <p className="text-slate-400">Create discount codes that customers can enter when booking a consultation.</p>
                </div>
                <button
                    onClick={openNewForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer shrink-0"
                >
                    <Plus size={16} />
                    New Coupon
                </button>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                <th className="p-4 font-medium text-sm text-slate-400">Code</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Discount</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Valid</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Used</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Status</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading coupons...</td>
                                </tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-red-300">Could not load coupons. Please refresh the page.</td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No coupons yet. Create your first one with New Coupon.</td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => {
                                    const status = getStatus(coupon);
                                    return (
                                        <tr key={coupon._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-mono font-semibold text-slate-100">{coupon.code}</div>
                                                {coupon.name && <div className="text-sm text-slate-500">{coupon.name}</div>}
                                            </td>
                                            <td className="p-4 text-sm text-slate-200 whitespace-nowrap">
                                                <div>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}</div>
                                                {coupon.minAmount > 0 && <div className="text-xs text-slate-500">Min. ₹{coupon.minAmount}</div>}
                                                {coupon.newCustomersOnly && <div className="text-xs text-slate-500">New customers only</div>}
                                                {coupon.oneUsePerCustomer && !coupon.newCustomersOnly && <div className="text-xs text-slate-500">Once per customer</div>}
                                            </td>
                                            <td className="p-4 text-sm text-slate-300 whitespace-nowrap">{formatValidity(coupon)}</td>
                                            <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                                                {coupon.usedCount}{coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ''}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_STYLES[status]}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleActive(coupon)}
                                                        disabled={busyId === coupon._id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700/60 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {coupon.isActive ? <Pause size={14} /> : <Play size={14} />}
                                                        {coupon.isActive ? 'Pause' : 'Activate'}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditForm(coupon)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20 cursor-pointer"
                                                    >
                                                        <Pencil size={14} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon)}
                                                        disabled={busyId === coupon._id}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
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
            </div>

            {form && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4">
                    <form
                        onSubmit={handleSubmit}
                        role="dialog"
                        aria-modal="true"
                        aria-label={editingId ? `Edit ${form.code}` : 'New coupon'}
                        className="w-full max-w-lg rounded-2xl border border-slate-700/70 bg-slate-900 p-6 shadow-2xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-100">{editingId ? `Edit ${form.code}` : 'New Coupon'}</h2>
                            <button
                                type="button"
                                onClick={() => setForm(null)}
                                aria-label="Close"
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Coupon code</span>
                                <input
                                    required
                                    autoFocus={!editingId}
                                    disabled={Boolean(editingId)}
                                    value={form.code}
                                    onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                                    maxLength={20}
                                    placeholder="e.g. SUMMER15"
                                    className="input-field w-full font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                {editingId && <span className="block text-xs text-slate-500 mt-1">The code can't be changed after creation.</span>}
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Note for you (optional)</span>
                                <input
                                    value={form.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    maxLength={80}
                                    placeholder="e.g. Instagram campaign"
                                    className="input-field w-full"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Discount type</span>
                                <select
                                    value={form.discountType}
                                    onChange={(e) => updateField('discountType', e.target.value)}
                                    className="input-field w-full"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="flat">Flat amount (₹)</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">
                                    {form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
                                </span>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max={form.discountType === 'percentage' ? 100 : undefined}
                                    step="1"
                                    value={form.discountValue}
                                    onChange={(e) => updateField('discountValue', e.target.value)}
                                    className="input-field w-full"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Start date (optional)</span>
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) => updateField('startDate', e.target.value)}
                                    className="input-field w-full [color-scheme:dark]"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">End date (optional)</span>
                                <input
                                    type="date"
                                    min={form.startDate || undefined}
                                    value={form.endDate}
                                    onChange={(e) => updateField('endDate', e.target.value)}
                                    className="input-field w-full [color-scheme:dark]"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Minimum order ₹ (optional)</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.minAmount}
                                    onChange={(e) => updateField('minAmount', e.target.value)}
                                    className="input-field w-full"
                                />
                            </label>
                            <label className="block">
                                <span className="block text-sm font-medium text-slate-300 mb-1.5">Total uses allowed (optional)</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={form.usageLimit}
                                    onChange={(e) => updateField('usageLimit', e.target.value)}
                                    placeholder="Unlimited"
                                    className="input-field w-full"
                                />
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={form.oneUsePerCustomer} onChange={(e) => updateField('oneUsePerCustomer', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                                Each customer can use it only once
                            </label>
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={form.newCustomersOnly} onChange={(e) => updateField('newCustomersOnly', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                                Only for first-time customers
                            </label>
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                                Active
                            </label>
                        </div>

                        <p className="text-xs text-slate-500">Dates follow Indian time. A customer never pays less than ₹21, whatever the discount.</p>

                        {formError && (
                            <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{formError}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setForm(null)}
                                className="rounded-lg border border-slate-600/60 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                            >
                                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Coupon'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Coupons;
