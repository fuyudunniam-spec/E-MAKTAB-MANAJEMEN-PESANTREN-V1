import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  MonitorPlay,
  Heart
} from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form states
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionUser(session.user);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setSessionUser(null);
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loginIdentifier = loginEmail.trim().toUpperCase();

      // Check if input is id_santri format (8 chars alphanumeric) or purely numeric ID Santri
      // Regex: ^[A-Z0-9]{8}$ matches old alphanumeric format
      // Regex: ^[0-9]+$ matches numeric ID Santri (e.g. 2024001)
      const isIdSantri = /^[A-Z0-9]{8}$/.test(loginIdentifier) || /^[0-9]+$/.test(loginIdentifier);

      let emailToUse = loginIdentifier;
      if (isIdSantri) {
        // Lookup email via ID Santri
        try {
          // 1. Get user_id from santri table
          const { data: santri, error: santriError } = await supabase
             .from('santri')
             .select('user_id')
             .eq('id_santri', loginIdentifier)
             .maybeSingle();
             
          if (santriError || !santri || !santri.user_id) {
              console.error('ID Santri lookup failed:', santriError);
              throw new Error('ID Santri tidak ditemukan.');
          }
          
          // 2. Get email from profiles
          const { data: profile, error: profileError } = await supabase
             .from('profiles')
             .select('email')
             .eq('id', santri.user_id)
             .maybeSingle();
             
          if (profileError || !profile || !profile.email) {
              console.error('Profile lookup failed:', profileError);
              throw new Error('Data user tidak valid.');
          }
          
          emailToUse = profile.email;
        } catch (lookupError: any) {
           setError(lookupError.message);
           setIsLoading(false);
           return;
        }
      } else {
        emailToUse = loginIdentifier.toLowerCase();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: loginPassword,
      });

      if (error) {
        if (isIdSantri) {
          setError('ID Santri atau password salah. Silakan coba lagi.');
        } else {
          setError('Email atau password salah.');
        }
      } else {
        // Successful login
        // Optional: Check if user is actually a santri
        setSuccess('Login berhasil! Mengarahkan ke dashboard...');
        
        // If login with ID Santri, we can assume it's a santri user.
        // Redirect to profile page.
        // We can fetch profile to get santri_id if needed for redirection URL
        if (data.user) {
             const { data: profile } = await supabase
            .from('profiles')
            .select('role, santri_id')
            .eq('id', data.user.id)
            .single();
            
            if (profile?.role === 'santri') {
                 // Use profile.santri_id if available, otherwise fallback
                 const targetId = profile.santri_id || 'me'; 
                 navigate(`/santri/profile/${targetId}`, { replace: true });
            } else if (profile?.role === 'santri_calon' || !profile?.role) {
                 // If role is explicitly santri_calon OR role is missing (new user treated as calon)
                 navigate('/psb/portal', { replace: true });
            } else {
                 // Fallback for non-santri users logging in here (e.g. parents?)
                 navigate('/pms', { replace: true });
            }
        } else {
            navigate('/pms', { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerName,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterName("");
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body bg-paper">
      {/* Left Decoration - Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-royal-950 relative flex-col justify-between p-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-royal-950 to-royal-900"></div>

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 bg-white/10 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center group-hover:bg-gold-500 group-hover:border-gold-500 transition-all duration-300">
            <ArrowLeft className="w-5 h-5 group-hover:text-royal-950 transition-colors" />
          </div>
          <span className="font-display font-bold tracking-widest text-lg">AL-BISRI</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-900/50 border border-white/10 text-royal-200 text-[10px] uppercase tracking-widest font-bold mb-6">
            <ShieldCheck className="w-3 h-3 text-gold-400" /> Executive Management System
          </div>
          <h1 className="text-5xl font-display font-medium leading-[1.1] mb-8">
            Panel <span className="text-gold-400 italic">E-Maktab</span><br />
            Pesantren Modern Al-Bisri.
          </h1>
          <p className="text-lg text-royal-200 font-light leading-relaxed">
            Kelola data akademik, administrasi, dan perkembangan santri dalam satu platform terpadu yang aman dan efisien.
          </p>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center text-royal-950 shadow-lg shadow-gold-500/20">
            <MonitorPlay className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Live Support</p>
            <p className="text-sm font-light text-royal-100">Hubungi Admin jika kendala login.</p>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-royal-900 via-gold-500 to-royal-900 lg:hidden"></div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-royal-900 text-white rotate-45 flex items-center justify-center rounded-sm">
                <span className="font-display font-bold text-gold-400 text-xl -rotate-45">A</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display font-bold text-royal-900 tracking-widest text-xl leading-none">AL-BISRI</span>
                <span className="text-[10px] text-gold-600 uppercase tracking-[0.25em] font-sans font-semibold">Institute</span>
              </div>
            </div>
          </div>

          {sessionUser ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 rounded-[32px] bg-royal-950 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center text-royal-950 mb-6 shadow-xl shadow-gold-500/20 ring-4 ring-white/10">
                    <User className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-2">Sesi Aktif Terdeteksi</h3>
                  <p className="text-royal-200 text-sm font-light mb-8 italic">
                    Log in sebagai: <span className="font-bold text-white uppercase tracking-wider">{sessionUser.user_metadata?.full_name || sessionUser.email}</span>
                  </p>

                  <div className="grid grid-cols-1 w-full gap-4">
                    <Button
                      onClick={() => navigate('/pms')}
                      className="py-7 bg-gold-500 hover:bg-gold-600 text-royal-950 rounded-2xl font-bold shadow-lg shadow-gold-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Buka Dashboard Utama <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="py-7 text-royal-200 hover:text-white hover:bg-white/10 rounded-2xl font-bold transition-all"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Logout / Gunakan Akun Lain"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-amber-100 bg-amber-50 flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1 uppercase tracking-wider">Peringatan Keamanan</p>
                  Sistem mendeteksi Anda masih terhubung. Jika ini bukan perangkat pribadi Anda, pastikan untuk <strong>Logout</strong> sebelum meninggalkan komputer.
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-display font-bold text-royal-950 mb-3">
                  {activeTab === "login" ? "Masuk E-Maktab" : "Pendaftaran Pengurus"}
                </h2>
                <p className="text-stone-500 font-light">
                  {activeTab === "login"
                    ? "Gunakan Email atau ID Santri untuk mengelola sistem."
                    : "Daftarkan akun pengurus baru untuk akses manajemen."}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-xl border-rose-100 bg-rose-50 text-rose-900 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="font-bold">Gagal</AlertTitle>
                  <AlertDescription className="text-xs opacity-90">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 rounded-xl border-emerald-100 bg-emerald-50 text-emerald-900 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="font-bold">Berhasil</AlertTitle>
                  <AlertDescription className="text-xs opacity-90">{success}</AlertDescription>
                </Alert>
              )}

              {/* Form Content */}
              <form onSubmit={activeTab === "login" ? handleLogin : handleRegister} className="space-y-6">
                {activeTab === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-xs uppercase tracking-widest font-bold text-stone-400">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        id="reg-name"
                        placeholder="Nama Lengkap Anda"
                        className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-stone-400">
                    {activeTab === "login" ? "Email / Username" : "Email Aktif"}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      id="email"
                      placeholder={activeTab === "login" ? "nama@email.com atau ID Santri" : "nama@email.com"}
                      className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all"
                      value={activeTab === "login" ? loginEmail : registerEmail}
                      onChange={(e) => activeTab === "login" ? setLoginEmail(e.target.value) : setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-stone-400">Password</Label>
                    {activeTab === "login" && (
                      <button type="button" className="text-[10px] font-bold text-gold-600 uppercase tracking-wider hover:text-royal-900 transition-colors">Lupa Password?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all font-sans"
                      value={activeTab === "login" ? loginPassword : registerPassword}
                      onChange={(e) => activeTab === "login" ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-7 bg-royal-900 hover:bg-royal-800 text-white rounded-xl shadow-xl shadow-royal-900/20 transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="font-display font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                      {activeTab === "login" ? "Masuk Sekarang" : "Buat Akun"}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Tab Switcher / Toggle */}
          <div className="mt-12 pt-8 border-t border-stone-100 flex flex-col items-center gap-4">
            <p className="text-sm text-stone-500 font-light">
              {activeTab === "login" ? "Belum memiliki akun?" : "Sudah memiliki akun?"}
              <button
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
                className="ml-2 font-bold text-royal-900 hover:text-gold-600 transition-colors"
              >
                {activeTab === "login" ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </p>
            <Link to="/" className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-royal-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-16 flex flex-col items-center opacity-40">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-500 mb-2">
              <Heart className="w-3 h-3 text-gold-600 fill-current" /> Supported by
            </div>
            <div className="font-display font-bold text-royal-900 tracking-[0.3em] text-[10px]">
              AN-NUR MEDIA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
