import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const toastVariants = {
    success: {
        icon: CheckCircle2,
        iconColor: 'text-emerald-300',
        wrapperClass: 'border-emerald-500/30 bg-emerald-500/10',
    },
    error: {
        icon: AlertCircle,
        iconColor: 'text-red-300',
        wrapperClass: 'border-red-500/30 bg-red-500/10',
    },
};

const Toast = ({ visible, message, type = 'success', onClose }) => {
    useEffect(() => {
        if (!visible) return undefined;

        const timeout = setTimeout(() => {
            onClose?.();
        }, 2800);

        return () => clearTimeout(timeout);
    }, [visible, onClose]);

    if (!visible || !message) return null;

    const variant = toastVariants[type] || toastVariants.success;
    const Icon = variant.icon;

    return (
        <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
            <div className={`flex min-w-[280px] max-w-sm items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-xl ${variant.wrapperClass}`}>
                <Icon size={18} className={`mt-0.5 shrink-0 ${variant.iconColor}`} />
                <p className="flex-1 text-sm text-slate-100">{message}</p>
                <button
                    onClick={onClose}
                    className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-white"
                    aria-label="Dismiss notification"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default Toast;