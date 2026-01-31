import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    UserPlus,
    LogIn,
    Loader2,
    ArrowLeft,
    ShieldCheck,
    User,
    Mail,
    Lock,
    ChevronRight,
    Heart
} from "lucide-react";

export default function PSBAuth() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"login" | "register">(
        location.pathname.includes('register') ? "register" : "login"
    );

    // Form states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [sessionUser, setSessionUser] = useState<any>(null);
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        // Only check session once on mount, and let the form handle redirects manually
        // This avoids fighting with useAuth hook elsewhere
        let mounted = true;

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session && mounted) {
                console.log("Session found, redirecting to portal...");
                navigate("/psb/portal", { replace: true });
            }
            if (mounted) {
                setCheckingSession(false);
            }
        };

        checkSession();

        return () => {
            mounted = false;
        };
    }, [navigate]);

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        setSessionUser(null);
        setLoading(false);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === "register") {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: 'santri_calon'
                        }
                    }
                });

                if (error) throw error;

                // Create initial santri record
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('santri')
                        .insert([
                            {
                                user_id: data.user.id,
                                nama_lengkap: fullName,
                                status_santri: 'Calon',
                                pendaftaran_status: 'Baru'
                            }
                        ]);

                    if (profileError) console.error("Error creating profile:", profileError);
                }

                toast({
                    title: "Pendaftaran Berhasil",
                    description: "Silakan periksa email Anda untuk verifikasi atau masuk ke portal.",
                });
                setMode("login");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
                navigate("/psb/portal");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Terjadi Kesalahan",
                description: error.message || "Gagal melakukan autentikasi",
            });
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-royal-950 text-white">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                    <p className="text-xs uppercase tracking-widest font-bold text-royal-200">Memeriksa Sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex font-body bg-paper">
            {/* Left Decoration - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-1/2 bg-royal-950 relative flex-col justify-between p-16 text-white overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-royal-950 to-royal-900 z-0"></div>
                <div className="absolute inset-0 opacity-10 z-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
                
                {/* Decorative Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <Link to="/" className="relative z-10 flex items-center gap-3 w-fit group">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500 group-hover:border-gold-500 transition-all duration-300">
                        <ArrowLeft className="w-5 h-5 group-hover:text-royal-950 transition-colors" />
                    </div>
                    <span className="font-display font-bold tracking-widest text-lg">AL-BISRI</span>
                </Link>

                <div className="relative z-10 max-w-md">
                    <img 
                        src="/kop-albisri.png" 
                        alt="Logo Al-Bisri" 
                        className="w-56 mb-12 drop-shadow-2xl hover:scale-105 transition-transform duration-500 brightness-0 invert"
                    />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-400 text-[10px] uppercase tracking-widest font-bold mb-6">
                        <ShieldCheck className="w-3 h-3" /> Penerimaan Santri Baru 2026/2027
                    </div>
                    <h1 className="text-5xl font-display font-medium leading-[1.3] mb-8">
                        Mulai <span className="text-gold-400 italic">Perjalanan</span><br />
                        Spiritual & Intelektual Anda.
                    </h1>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm text-royal-300 font-light">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-royal-950 bg-royal-800 flex items-center justify-center overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                            </div>
                        ))}
                    </div>
                    <p>Terdaftar <span className="text-gold-400 font-bold">1.2k+</span> calon santri musim ini</p>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-royal-900 via-gold-500 to-royal-900 lg:hidden"></div>

                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-12">
                        <img 
                            src="/kop-albisri.png" 
                            alt="Logo Al-Bisri" 
                            className="w-40"
                        />
                    </div>

                    {sessionUser ? (
                        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="p-8 rounded-[32px] bg-royal-950 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl"></div>

                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center text-royal-950 mb-6 shadow-xl shadow-gold-500/20 ring-4 ring-white/10">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-2xl font-display font-bold mb-2">Sesi Pendaftaran Aktif</h3>
                                    <p className="text-royal-200 text-sm font-light mb-8 italic">
                                        Terdeteksi sebagai: <span className="font-bold text-white uppercase tracking-wider">{sessionUser.user_metadata?.full_name || sessionUser.email}</span>
                                    </p>

                                    <div className="grid grid-cols-1 w-full gap-4">
                                        <Button
                                            onClick={() => navigate('/psb/portal')}
                                            className="py-7 bg-gold-500 hover:bg-gold-600 text-royal-950 rounded-2xl font-bold shadow-lg shadow-gold-500/20 transition-all hover:scale-[1.02] active:scale-95"
                                        >
                                            Buka Portal Pendaftaran <ChevronRight className="w-5 h-5 ml-2" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            disabled={loading}
                                            className="py-7 text-royal-200 hover:text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gunakan Akun / Email Lain"}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-blue-100 bg-blue-50 flex gap-4 items-start">
                                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800 leading-relaxed">
                                    <p className="font-bold mb-1 uppercase tracking-wider">Akses Portal</p>
                                    Anda sudah masuk ke sistem Al-Bisri. Klik tombol di atas untuk melanjutkan pengisian formulir atau melengkapi berkas.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="mb-10 text-center lg:text-left">
                                <h2 className="text-3xl font-display font-bold text-royal-950 mb-3">
                                    {mode === "register" ? "Buat Akun Baru" : "Selamat Datang Kembali"}
                                </h2>
                                <p className="text-stone-500 font-light">
                                    {mode === "register"
                                        ? "Lengkapi formulir di bawah untuk memulai proses pendaftaran."
                                        : "Masuk untuk melanjutkan proses pendaftaran Anda."}
                                </p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-6">
                                {mode === "register" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-xs uppercase tracking-widest font-bold text-stone-400">Nama Lengkap</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                            <Input
                                                id="fullName"
                                                placeholder="Masukkan nama sesuai ijazah"
                                                className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all font-body"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-stone-400">Email Aktif</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="nama@email.com"
                                            className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all font-body"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-stone-400">Password</Label>
                                        {mode === "login" && (
                                            <button type="button" className="text-[10px] font-bold text-gold-600 uppercase tracking-wider hover:text-royal-900 transition-colors">Lupa Password?</button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-7 bg-royal-900 hover:bg-royal-800 text-white rounded-xl shadow-xl shadow-royal-900/20 transition-all duration-300 group"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="font-display font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                                            {mode === "register" ? "Daftar Sekarang" : "Masuk Ke Portal"}
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-stone-100 flex flex-col items-center gap-4">
                        <p className="text-sm text-stone-500 font-light">
                            {mode === "register" ? "Sudah memiliki akun pendaftaran?" : "Belum memiliki akun?"}
                            <button
                                onClick={() => setMode(mode === "register" ? "login" : "register")}
                                className="ml-2 font-bold text-royal-900 hover:text-gold-600 transition-colors"
                            >
                                {mode === "register" ? "Masuk di sini" : "Daftar di sini"}
                            </button>
                        </p>
                    </div>

                    <div className="mt-20 flex flex-col items-center opacity-40">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-2">
                            <Heart className="w-3 h-3 text-gold-600 fill-current" /> Powered by:
                        </div>
                        <div className="font-display font-bold text-royal-900 tracking-[0.3em] text-[10px]">
                            Isyraq An-Nur
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
