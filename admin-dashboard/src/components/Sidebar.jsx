import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose?.();
    };

    const links = [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/bookings', name: 'Bookings', icon: <Users size={20} /> },
        { path: '/contacts', name: 'Inquiries', icon: <MessageSquare size={20} /> },
    ];

    return (
        <>
            {isOpen && (
                <button
                    onClick={onClose}
                    aria-label="Close sidebar backdrop"
                    className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm lg:hidden"
                ></button>
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col pb-4 pt-5">
                    <div className="mb-6 flex items-center justify-between px-5">
                        <div>
                            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Astro Suite</p>
                            <div className="mt-1 flex items-center gap-3 text-2xl font-semibold text-slate-100">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-base text-white shadow-lg shadow-cyan-700/30">
                                    A
                                </div>
                                AstroAdmin
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:hidden"
                            aria-label="Close sidebar"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <nav className="flex-1 px-3 space-y-1.5">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 shadow-inner shadow-cyan-900/30'
                                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                            }`
                        }
                    >
                        <span className="text-slate-500 transition-colors group-hover:text-slate-300">{link.icon}</span>
                        <span className="font-medium">{link.name}</span>
                    </NavLink>
                ))}
                    </nav>

                    <div className="mx-4 mt-auto rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
                        >
                            <LogOut size={18} />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
