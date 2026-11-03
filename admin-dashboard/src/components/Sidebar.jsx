import { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Star,
    Ticket,
    LogOut,
    X,
    Moon,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    // Support keyboard shortcut Ctrl + B to toggle minimize
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                onToggleCollapse?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onToggleCollapse]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose?.();
    };

    const links = [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/bookings', name: 'Bookings', icon: <Users size={20} /> },
        { path: '/contacts', name: 'Inquiries', icon: <MessageSquare size={20} /> },
        { path: '/reviews', name: 'Reviews & Ratings', icon: <Star size={20} /> },
        { path: '/coupons', name: 'Coupons', icon: <Ticket size={20} /> },
    ];

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <button
                    onClick={onClose}
                    aria-label="Close sidebar backdrop"
                    className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden cursor-pointer"
                ></button>
            )}

            {/* Sidebar Aside */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-xl transition-all duration-300 ease-in-out lg:static lg:z-auto ${
                    isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
                } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
            >
                <div className="flex h-full flex-col pb-4 pt-5">
                    {/* Header: Logo, Title & Minimize Toggle */}
                    <div className={`mb-6 flex items-center transition-all duration-200 ${
                        isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
                    }`}>
                        {!isCollapsed ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 shrink-0">
                                    <Moon size={20} className="fill-[#fff8e7]/50" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-semibold truncate">Astro Suite</p>
                                    <p className="text-xl font-bold text-slate-100 truncate">AstroAdmin</p>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={onToggleCollapse}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer hover:scale-105 transition-transform"
                                title="Click to expand sidebar"
                            >
                                <Moon size={22} className="fill-[#fff8e7]/50" />
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-1">
                            {/* Desktop Minimize Toggle Button (when expanded) */}
                            {!isCollapsed && (
                                <button
                                    onClick={onToggleCollapse}
                                    className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors cursor-pointer"
                                    title="Minimize sidebar (Ctrl+B)"
                                    aria-label="Minimize sidebar"
                                >
                                    <PanelLeftClose size={18} />
                                </button>
                            )}

                            {/* Mobile Close Button */}
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:hidden cursor-pointer"
                                aria-label="Close sidebar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Collapsed Mode Expand Button */}
                    {isCollapsed && (
                        <div className="hidden lg:flex justify-center mb-4 px-2">
                            <button
                                onClick={onToggleCollapse}
                                className="w-10 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 border border-slate-700/60 flex items-center justify-center transition-colors cursor-pointer"
                                title="Expand sidebar (Ctrl+B)"
                                aria-label="Expand sidebar"
                            >
                                <PanelLeftOpen size={16} />
                            </button>
                        </div>
                    )}

                    {/* Nav Links */}
                    <nav className={`flex-1 space-y-1.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {links.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `group relative flex items-center rounded-xl transition-all duration-200 ${
                                        isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-3'
                                    } ${
                                        isActive
                                            ? 'border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-inner shadow-cyan-900/40'
                                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                                    }`
                                }
                            >
                                <span className="transition-colors group-hover:text-cyan-400 shrink-0">
                                    {link.icon}
                                </span>

                                {!isCollapsed && (
                                    <span className="font-medium text-sm truncate">{link.name}</span>
                                )}

                                {/* Hover Floating Tooltip in Minimized Mode */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-3 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-100 shadow-2xl whitespace-nowrap z-50 pointer-events-none">
                                        <span>{link.name}</span>
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Footer / Logout */}
                    <div className={`mt-auto ${isCollapsed ? 'px-2' : 'mx-4'}`}>
                        <div className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isCollapsed ? 'p-1.5' : 'p-3'}`}>
                            <button
                                onClick={handleLogout}
                                className={`group relative flex w-full items-center rounded-lg text-slate-300 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300 cursor-pointer ${
                                    isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3 py-2.5'
                                }`}
                                title={isCollapsed ? "Logout" : undefined}
                            >
                                <LogOut size={18} className="shrink-0" />
                                {!isCollapsed && <span className="font-medium text-sm">Logout</span>}

                                {/* Tooltip for logout when minimized */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-3 hidden group-hover:flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-red-500/30 text-xs font-semibold text-red-300 shadow-2xl whitespace-nowrap z-50 pointer-events-none">
                                        <span>Logout</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
