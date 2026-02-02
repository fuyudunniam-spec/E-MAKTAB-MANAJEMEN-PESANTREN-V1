import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { getUserRoles } from "@/services/auth.service";

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
          const hasAdminRole = roles.some(r => ['admin', 'superadmin', 'pengurus'].includes(r) || r.startsWith('admin_'));
          
          if (isAdminLogin) {
            if (hasAdminRole) {
              navigate('/pms', { replace: true });
            } else {
               // Logged in as santri but trying to access admin login page -> redirect to santri dashboard
               navigate('/santri', { replace: true });
            }
          } else {
             // Standard login page (/auth)
             if (hasAdminRole) {
                // Admin trying to access public login -> redirect to PMS
                navigate('/pms', { replace: true });
             } else {
                navigate('/santri', { replace: true });
             }
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

      // Check if input is id_santri format (8 chars alphanumeric)
      const isIdSantri = /^[A-Z0-9]{8}$/.test(loginIdentifier);

      let emailToUse = loginIdentifier;
      
      if (!isAdminLogin) {
         // PUBLIC/SANTRI LOGIN
         // Rule: Santri MUST use ID Santri.
         // If user inputs email here, we assume they are trying to use admin account or wrong page.
         // However, existing admins might use this page too (as per existing logic).
         // If we want to strictly enforce "Santri use ID", we prioritize ID detection.
         
         if (isIdSantri) {
            emailToUse = `${loginIdentifier}@pondoksukses.local`;
         } else {
            // Not an ID Santri format.
            // If it's an email, it might be an admin trying to login here (which we redirect later)
            // OR it's a santri trying to use their personal email (which we should BLOCK/WARN).
            emailToUse = loginIdentifier.toLowerCase();
         }
      } else {
         // ADMIN LOGIN PAGE
         // Admins use Email.
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
              // On public login, if they used email and failed -> warn them to use ID Santri if they are santri
              setError('Email atau password salah. Santri harap login menggunakan ID Santri.');
           } else {
              setError('Email atau password salah.');
           }
        }
      } else if (data.user) {
        // Successful login - Now check Role Access
        const roles = await getUserRoles(data.user.id);
        
        // Double check metadata directly just in case getUserRoles failed/cached wrong
        const metaRole = data.user.user_metadata?.role;
        const hasMetaAdmin = metaRole === 'admin' || metaRole === 'superadmin';
        
        const hasAdminRole = hasMetaAdmin || roles.some(r => ['admin', 'superadmin', 'pengurus'].includes(r) || r.startsWith('admin_'));

        if (isAdminLogin) {
           // Admin Login Page Logic
           if (!hasAdminRole) {
              await supabase.auth.signOut();
              setError('Akses ditolak. Halaman ini khusus untuk Administrator & Pengurus.');
              return;
           }
           setSuccess('Login berhasil! Mengarahkan ke dashboard admin...');
           navigate('/pms', { replace: true });
        } else {
           // Public Login Page Logic
           if (hasAdminRole) {
              await supabase.auth.signOut();
              setError('Administrator harap login melalui portal khusus admin.');
              return;
           }

           // Prevent PSB accounts (registered via email) from logging in here if they somehow passed auth
           // Santri accounts should be ID based. If current email is NOT ID based, it might be a PSB account.
           const userEmail = data.user.email || "";
           const isEmailLogin = userEmail.includes('@') && !userEmail.endsWith('@pondoksukses.local');
           
           if (isEmailLogin) {
              // This is likely a PSB account trying to login to Santri Dashboard
              // Redirect them to PSB Portal or Show Error
               await supabase.auth.signOut();
               setError('Akun pendaftaran PSB tidak dapat digunakan di sini. Silakan login di Portal PSB.');
               setTimeout(() => navigate('/psb/auth'), 2000);
               return;
           }

           setSuccess('Login berhasil! Mengarahkan ke dashboard santri...');
           navigate('/santri', { replace: true });
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Hero Image */}
      <div className="relative hidden lg:block bg-slate-900">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1549675583-45984c497939?auto=format&fit=crop&q=80&w=2974')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b2b1f]/90 via-[#0b2b1f]/50 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <Link to="/" className="w-fit">
            <img 
              src="/kop-albisri.png" 
              alt="Logo Al-Bisri" 
              className="w-56 mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500 brightness-0 invert" 
            />
          </Link>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-heading font-bold leading-[1.3]">
              Selamat Datang di <span className="text-secondary">e-Maktab</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-light">
              Platform manajemen terpadu Pesantren Al-Bisri. Kelola data akademik, administrasi, dan perkembangan Anda.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-[#0b2b1f] bg-slate-200 z-[${5 - i}]`} />
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold">500+ Santri & Alumni</span>
                <span className="text-xs text-slate-400">Telah bergabung bersama kami</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Powered by: Isyraq An-Nur
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/">
              <img src="/kop-albisri.png" alt="Logo Al-Bisri" className="w-40" />
            </Link>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-heading font-bold text-slate-900">Masuk ke Akun</h2>
            <p className="text-slate-500">Silakan masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-white border border-slate-200 rounded-full">
              <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Daftar Baru</TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-6 animate-shake">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-emerald-50 text-emerald-800 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle>Berhasil</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-600 font-medium">Email / ID Santri</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="nama@email.com atau ID Santri"
                      className="pl-10 bg-white border-slate-200 focus-visible:ring-primary h-11"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-600 font-medium">Password</Label>
                    <Link to="#" className="text-xs text-primary hover:underline font-medium">Lupa Password?</Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-white border-slate-200 focus-visible:ring-primary h-11"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-lg shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Masuk Sekarang"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-slate-600 font-medium">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="reg-name"
                      placeholder="Nama Lengkap Anda"
                      className="pl-10 bg-white border-slate-200 focus-visible:ring-primary h-11"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-slate-600 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-10 bg-white border-slate-200 focus-visible:ring-primary h-11"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-slate-600 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 bg-white border-slate-200 focus-visible:ring-primary h-11"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg shadow-lg shadow-secondary/20" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Buat Akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-50 px-2 text-slate-500">Atau</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-11 bg-white border-slate-200 hover:bg-slate-50 text-slate-700" onClick={() => navigate('/')}>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
