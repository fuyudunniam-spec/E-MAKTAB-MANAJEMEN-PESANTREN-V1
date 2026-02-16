import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { GraduationCap, Eye, EyeOff, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Login Santri Page – /login-santri
 * Santri login menggunakan ID Santri (format: BM240001) + Password.
 * Flow: ID Santri → RPC get_santri_auth_by_id → mendapat email → signInWithPassword
 */
const LoginSantri = () => {
    const [idSantri, setIdSantri] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            // Santri logged in → redirect to santri dashboard
            if (user.role === 'santri' && user.santriId) {
                navigate(`/santri/profile/${user.santriId}`, { replace: true });
            } else {
                navigate('/pms', { replace: true });
            }
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!idSantri.trim() || !password.trim()) {
            setError('ID Santri dan Password wajib diisi');
            return;
        }

        setLoading(true);

        try {
            // Step 1: Lookup email from ID Santri via RPC
            const { data: santriData, error: rpcError } = await supabase
                .rpc('get_santri_auth_by_id', { p_id_santri: idSantri.trim().toUpperCase() });

            if (rpcError) {
                console.error('[LoginSantri] RPC error:', rpcError);
                setError('Gagal mencari data santri. Silakan coba lagi.');
                setLoading(false);
                return;
            }

            if (!santriData || santriData.length === 0) {
                setError('ID Santri tidak ditemukan atau belum memiliki akun login.');
                setLoading(false);
                return;
            }

            const { email, nama_lengkap } = santriData[0];

            if (!email) {
                setError('Akun santri belum terhubung. Hubungi admin untuk bantuan.');
                setLoading(false);
                return;
            }

            // Step 2: Sign in with email + password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.error('[LoginSantri] Sign in error:', signInError);
                if (signInError.message.includes('Invalid login')) {
                    setError('Password salah. Silakan coba lagi atau hubungi admin.');
                } else {
                    setError(signInError.message);
                }
                setLoading(false);
                return;
            }

            // Success!
            toast.success(`Selamat datang, ${nama_lengkap}!`);
            // Auth state change listener in useAuth will handle the redirect

        } catch (err: any) {
            console.error('[LoginSantri] Unexpected error:', err);
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading screen while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back to staff login link */}
                <button
                    onClick={() => navigate('/auth')}
                    className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-800 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Login Staff / Admin
                </button>

                {/* Main card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-emerald-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4 backdrop-blur-sm">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Portal Santri</h1>
                        <p className="text-emerald-100 text-sm">Masuk menggunakan ID Santri & Password</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-5">
                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* ID Santri Input */}
                        <div className="space-y-2">
                            <label htmlFor="idSantri" className="block text-sm font-medium text-gray-700">
                                ID Santri
                            </label>
                            <input
                                id="idSantri"
                                type="text"
                                value={idSantri}
                                onChange={(e) => setIdSantri(e.target.value.toUpperCase())}
                                placeholder="Contoh: BM240001"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all tracking-wider font-mono text-lg"
                                maxLength={20}
                                autoComplete="username"
                                autoFocus
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500">
                                ID Santri tertera di kartu santri atau hubungi admin
                            </p>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all pr-12"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !idSantri.trim() || !password.trim()}
                            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-200"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>

                        {/* Help text */}
                        <p className="text-center text-xs text-gray-500 mt-4">
                            Lupa password? Hubungi admin pesantren untuk mereset password Anda.
                        </p>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    e-Maktab © {new Date().getFullYear()} — Sistem Informasi Pesantren
                </p>
            </div>
        </div>
    );
};

export default LoginSantri;
