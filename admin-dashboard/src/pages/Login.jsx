import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import useAuthStore from '../store/authStore';
import { Lock, Mail, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const login = useAuthStore(state => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post('/admin/login', { email, password });
            login({ email: data.email, _id: data._id }, data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] pointer-events-none"></div>
            
            <div className="relative z-10 w-full max-w-md p-8 sm:p-10 -mt-10">
                <div className="glass-panel p-8">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
                            <span className="text-white text-2xl font-bold">A</span>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-2">AstroAdmin</h1>
                        <p className="text-slate-400 text-sm">Secure Portal Login</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10" 
                                    placeholder="admin@astrosharma.com"
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10" 
                                    placeholder="••••••••"
                                    required 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn-primary w-full py-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-slate-500 text-xs mt-8">
                    &copy; 2026 Developer Build. By AstroSharma.
                </p>
            </div>
        </div>
    );
};

export default Login;
