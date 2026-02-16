import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, ChevronRight, Heart } from "lucide-react";
import { getUserRoles } from "@/modules/auth/services/auth.service";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  // Determine access type based on URL
  const isAdminLogin = location.pathname.includes('/pms/');

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form states
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerName, setRegisterName] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const isLoggingOut = sessionStorage.getItem('is_logging_out');
        if (isLoggingOut) {
          sessionStorage.removeItem('is_logging_out');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check role before redirecting
          const roles = await getUserRoles(session.user.id);
          const hasStaffOrAbove = roles.some(r => ['admin', 'pengurus', 'staff'].includes(r) || r.startsWith('admin_'));

          if (hasStaffOrAbove) {
            navigate('/pms', { replace: true });
          } else {
            navigate('/santri', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
  }, [navigate, isAdminLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const loginIdentifier = loginEmail.trim().toUpperCase();
      const isIdSantri = /^[A-Z0-9]{8}$/.test(loginIdentifier);
      let emailToUse = loginIdentifier;

      if (!isAdminLogin) {
        if (isIdSantri) {
          emailToUse = `${loginIdentifier}@pondoksukses.local`;
        } else {
          emailToUse = loginIdentifier.toLowerCase();
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
          if (!isAdminLogin) {
            setError('Email atau password salah. Santri harap login menggunakan ID Santri.');
          } else {
            setError('Email atau password salah.');
          }
        }
      } else if (data.user) {
        const roles = await getUserRoles(data.user.id);
        const hasStaffOrAbove = roles.some(r => ['admin', 'pengurus', 'staff'].includes(r) || r.startsWith('admin_'));

        if (isAdminLogin) {
          // /pms/secure-gate – only staff/admin/pengurus allowed
          if (!hasStaffOrAbove) {
            await supabase.auth.signOut();
            setError('Akses ditolak. Halaman ini khusus untuk Administrator, Pengurus & Staff.');
            return;
          }
          setSuccess('Login berhasil! Mengarahkan ke dashboard...');
          navigate('/pms', { replace: true });
        } else {
          // /auth – general login, route based on role
          if (hasStaffOrAbove) {
            // Staff/admin accessing /auth → redirect to admin dashboard
            setSuccess('Login berhasil! Mengarahkan ke dashboard...');
            navigate('/pms', { replace: true });
          } else {
            // Santri / pengajar → santri dashboard
            setSuccess('Login berhasil! Mengarahkan ke dashboard...');
            navigate('/santri', { replace: true });
          }
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
      <div className="hidden lg:flex lg:w-1/2 bg-royal-950 relative flex-col justify-between p-16 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-royal-950 to-royal-900 z-0"></div>
        <div className="absolute inset-0 opacity-10 z-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>

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
            <ShieldCheck className="w-3 h-3" /> Area Terbatas
          </div>
          <h1 className="text-5xl font-display font-medium leading-[1.3] mb-8">
            Portal Layanan <br />
            <span className="text-gold-400 italic">Akademik & Santri</span>
          </h1>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-royal-300 font-light">
          <p className="border-l-2 border-gold-500 pl-4">
            Silakan masuk menggunakan <strong>ID Santri</strong> yang tertera pada kartu pelajar Anda.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-royal-900 via-gold-500 to-royal-900 lg:hidden"></div>

        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6 pt-8">
            <Link to="/">
              <img src="/kop-albisri.png" alt="Logo Al-Bisri" className="w-32" />
            </Link>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-royal-950 mb-2">
              Selamat Datang di e-Maktab
            </h2>
            <p className="text-stone-500 font-light">
              Masuk untuk mengakses dashboard santri dan layanan akademik.
            </p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* 
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-stone-100 border border-stone-200 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-royal-900 data-[state=active]:shadow-sm font-bold uppercase tracking-wider text-xs">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-royal-900 data-[state=active]:shadow-sm font-bold uppercase tracking-wider text-xs">Daftar</TabsTrigger>
            </TabsList>
            */}
            {/* Registration hidden by default for E-Maktab as it is closed system usually */}

            {error && (
              <Alert variant="destructive" className="mb-6 animate-pulse bg-red-50 border-red-200 text-red-900">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-bold">Gagal Masuk</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-emerald-50 text-emerald-800 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="font-bold">Berhasil</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-stone-400">Email / ID Santri</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="Contoh: 20240001"
                      className="pl-12 py-4 md:py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all font-body"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-widest font-bold text-stone-400">Password</Label>
                    <Link to="#" className="text-[10px] font-bold text-gold-600 uppercase tracking-wider hover:text-royal-900 transition-colors">Lupa Password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 py-4 md:py-6 rounded-xl border-stone-200 focus:border-royal-900 focus:ring-royal-900/10 transition-all"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full py-4 md:py-7 bg-royal-900 hover:bg-royal-800 text-white rounded-xl shadow-xl shadow-royal-900/20 transition-all duration-300 group" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                    <span className="font-display font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                      Masuk Dashboard <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {/* Registration Form simplified/hidden if unused */}
              <form onSubmit={handleRegister} className="space-y-5">
                {/* ... registration fields ... */}
                <div className="text-center p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm text-stone-500">Pendaftaran akun santri dilakukan oleh administrator.</p>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 md:mt-20 flex flex-col items-center opacity-40 pb-6">
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
