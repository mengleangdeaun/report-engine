import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconLock, IconMail, IconRefresh, IconArrowRight } from '@tabler/icons-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PortalLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/portal/login', { email, password });
            localStorage.setItem('clientToken', data.token);
            localStorage.setItem('client', JSON.stringify(data.client));
            toast.success('Welcome to your Client Portal!');
            navigate('/portal/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <IconLock className="text-primary" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
                    <p className="text-gray-500 mt-2 text-lg">Securely access your assigned reports</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Portal Email</label>
                            <div className="relative">
                                <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    required
                                    className="form-input pl-12 h-12 rounded-xl text-lg w-full bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="form-input pl-12 h-12 rounded-xl text-lg w-full bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-14 rounded-xl text-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {loading ? <IconRefresh className="animate-spin" /> : (
                                <>
                                    Enter Portal
                                    <IconArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-400 mt-8 text-sm">
                    Protected by Secure Encryption. If you've lost access, contact your account coordinator.
                </p>
            </div>
        </div>
    );
};

export default PortalLogin;
