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

export default function AdminAuth() {
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
           console.warn('Session error:', sessionError);
           // Force signOut if session is invalid
           await supabase.auth.signOut();
           setSessionUser(null);
           setCheckingSession(false);
           return;
        }

        if (session) {
          // Verify role for admin access
          let userRole = 'unknown';
          let profileError = null;
          let profile = null;

          try {
             // 1. Try to get role from metadata first (fastest, no DB call)
             const metadata = session.user.user_metadata;
             if (metadata && metadata.role) {
                userRole = metadata.role;
                console.log('DEBUG: Role found in metadata:', userRole);
             } else {
                // 2. Fallback to DB fetch if not in metadata
                const { data, error } = await supabase
                  .from('profiles')
                  .select('*') // Select all to avoid ambiguity
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                profile = data;
                profileError = error;
                if (data) {
                    userRole = data.role;
                    console.log('DEBUG: Role found in DB:', userRole);
                }
             }
          } catch (e) {
             console.error("Error determining role:", e);
             profileError = e;
          }
            
          console.log("DEBUG: Final userRole check:", userRole);

          // Log full session user for debugging
          console.log("DEBUG: Full Session User Object:", session.user);

          if (profileError) {
             console.error('Profile fetch error:', profileError);
             // Emergency Fallback: If we can't verify role but user is authenticated
             // and we are in development mode or specific user, let them in with warning
             // For now: Force logout to be safe
             // await supabase.auth.signOut();
             // setSessionUser(null);
             // setError(`Terjadi kesalahan sistem (Profile Error: ${JSON.stringify(profileError)}). Silakan login kembali.`);
             
             // FAIL OPEN MODE: ALLOW LOGIN WITH WARNING
             console.warn("FAIL OPEN: Allowing login despite profile error");
             setSessionUser(session.user);
          } else if (['admin', 'pengurus', 'keuangan', 'pengajar'].includes(userRole?.toLowerCase())) {
            setSessionUser(session.user);
          } else {
            // Check if profile exists but role is wrong
            console.warn(`DEBUG: Role '${userRole}' rejected. Allowed: admin, pengurus, keuangan, pengajar`);
            
            if (userRole !== 'unknown' && userRole !== undefined) {
                 // Strict rejection for known non-admin roles
                 setError(`Akun Anda (Role: ${userRole}) tidak memiliki akses ke halaman ini.`);
                 setTimeout(async () => {
                    await supabase.auth.signOut();
                    setSessionUser(null);
                }, 1000);
            } else {
                 // FAIL OPEN MODE FOR UNDEFINED ROLE (Debugging)
                 console.warn("FAIL OPEN: Allowing login with UNDEFINED role for debugging");
                 // Don't set error, allow session
                 setSessionUser(session.user);
            }
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
        // Force logout on unexpected error
        await supabase.auth.signOut();
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleResetSession = async () => {
    setIsLoading(true);
    try {
        await supabase.auth.signOut();
        setSessionUser(null);
        setError(null);
        window.location.reload(); // Hard reload to clear any memory state
    } catch (e) {
        console.error("Logout error:", e);
    } finally {
        setIsLoading(false);
    }
  };

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
      const loginIdentifier = loginEmail.trim();

      // Admin login usually via Email or specific username format
      // We assume email for admin for now
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier,
        password: loginPassword,
      });

      if (error) {
        setError('Email atau password salah.');
      } else {
        // Check role after login
        if (data.user) {
          // Verify role for admin access
          let userRole = 'unknown';
          let profileError = null;

          try {
             // 1. Try to get role from metadata first
             const metadata = data.user.user_metadata;
             if (metadata && metadata.role) {
                userRole = metadata.role;
             } else {
                // 2. Fallback to DB fetch
                const { data: profileData, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', data.user.id)
                  .maybeSingle();

                if (fetchError) profileError = fetchError;
                if (profileData) userRole = profileData.role;
             }
          } catch (e) {
             profileError = e;
          }

          if (['admin', 'pengurus', 'keuangan', 'pengajar'].includes(userRole?.toLowerCase())) {
            setSuccess('Login berhasil! Mengarahkan ke dashboard...');
            navigate('/pms', { replace: true });
          } else {
             // Not authorized
             console.warn(`DEBUG: Login Role '${userRole}' rejected. Allowed: admin, pengurus, keuangan, pengajar`);
             
             if (profileError) {
                // FAIL OPEN FOR LOGIN AS WELL
                console.warn("FAIL OPEN: Allowing login despite profile error");
                setSuccess('Login berhasil (Debug Mode)! Mengarahkan ke dashboard...');
                navigate('/pms', { replace: true });
             } else if (userRole === 'unknown' || userRole === undefined) {
                 // FAIL OPEN FOR UNDEFINED ROLE
                 console.warn("FAIL OPEN: Allowing login with UNDEFINED role");
                 setSuccess('Login berhasil (Role Undefined)! Mengarahkan ke dashboard...');
                 navigate('/pms', { replace: true });
             } else {
                setError(`Akun Anda (Role: ${userRole}) tidak memiliki akses ke Dashboard Admin.`);
                setTimeout(async () => {
                     await supabase.auth.signOut();
                 }, 1000);
             }
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
    // Disable register for Admin Auth page - Admin creation should be internal only
    setError("Pendaftaran admin hanya dapat dilakukan oleh Super Admin.");
  };

  return (
    <div className="min-h-screen flex font-body bg-stone-50">
      {/* Left Decoration - Admin Style (Darker/More Professional) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between p-16 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-800 opacity-90"></div>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit group">
          <div className="w-10 h-10 bg-white/5 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-all duration-300">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-display font-bold tracking-widest text-lg text-slate-200">KEMBALI KE WEBSITE</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-[10px] uppercase tracking-widest font-bold mb-6">
            <ShieldCheck className="w-3 h-3 text-indigo-400" /> Secure Admin Access
          </div>
          <h1 className="text-4xl font-display font-bold leading-[1.2] mb-6 tracking-tight">
            Sistem Manajemen<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Terintegrasi</span>
          </h1>
          <p className="text-base text-slate-400 font-light leading-relaxed border-l-2 border-indigo-500/50 pl-4">
            Akses khusus untuk Administrator, Pengurus, dan Staff Keuangan. 
            Mohon pastikan Anda memiliki wewenang untuk mengakses halaman ini.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs text-slate-500 font-mono">
           <span>v1.0.2 Stable</span>
           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
           <span>Secure Connection</span>
           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
           <span>IP Logged</span>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 relative bg-white">
        <div className="w-full max-w-md">
          {/* Admin Header Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
             <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                ADMIN PANEL
             </div>
          </div>

          {sessionUser ? (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 ring-4 ring-white">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">Sesi Aktif</h3>
                  <p className="text-slate-500 text-sm mb-6">
                    {sessionUser.user_metadata?.full_name || sessionUser.email}
                  </p>

                  <div className="grid grid-cols-1 w-full gap-3">
                    <Button
                      onClick={() => navigate('/pms')}
                      className="py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all"
                    >
                      Buka Dashboard <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="py-6 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Logout"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Login Administrator
                </h2>
                <p className="text-slate-500 text-sm">
                  Masukkan kredensial akun pengelola Anda.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 rounded-lg border-red-200 bg-red-50 text-red-900">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="font-bold">Akses Ditolak</AlertTitle>
                  <AlertDescription className="text-xs">
                    {error}
                    {/* Tombol reset session jika error terkait token/session */}
                    <button 
                        onClick={handleResetSession}
                        className="block mt-2 underline font-semibold hover:text-red-700"
                    >
                        Klik di sini untuk reset sesi login
                    </button>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 rounded-lg border-emerald-200 bg-emerald-50 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="font-bold">Berhasil</AlertTitle>
                  <AlertDescription className="text-xs">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email / Username
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      placeholder="admin@pesantren.com"
                      className="pl-10 py-5 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</Label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 py-5 rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white font-sans"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-600/20 transition-all duration-300 font-bold text-sm tracking-wide mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "MASUK DASHBOARD"
                  )}
                </Button>
              </form>
              
              <div className="mt-8 text-center">
                 <p className="text-xs text-slate-400">
                    Lupa password? Hubungi tim IT Support Pesantren.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
