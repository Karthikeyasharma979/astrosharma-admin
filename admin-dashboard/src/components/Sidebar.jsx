import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const links = [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/bookings', name: 'Bookings', icon: <Users size={20} /> },
        { path: '/contacts', name: 'Inquiries', icon: <MessageSquare size={20} /> },
    ];

    return (
        <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col pt-6 pb-4">
            <div className="px-6 mb-8 flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-base shadow-lg shadow-purple-500/20">
                 A
               </div>
               AstroAdmin
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {links.map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`
                        }
                    >
                        {link.icon}
                        <span className="font-medium">{link.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
