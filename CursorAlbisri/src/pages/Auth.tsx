import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, CheckCircle2, AlertCircle } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

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
          // Redirect to Admin Dashboard / PMS
          navigate('/pms', { replace: true });
        }
      } catch (err) {
        console.error('Error checking session:', err);
      }
    };

    checkSession();
  }, [navigate]);

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
      if (isIdSantri) {
        emailToUse = `${loginIdentifier}@pondoksukses.local`;
      } else {
        emailToUse = loginIdentifier.toLowerCase();
      }

      const { error } = await supabase.auth.signInWithPassword({
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
        setSuccess('Login berhasil! Mengarahkan ke dashboard...');
        // REDIRECT TO ADMIN DASHBOARD
        navigate('/pms', { replace: true });
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
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <span className="font-heading font-bold text-xl">ا</span>
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">An-Nur</span>
          </Link>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
              Selamat Datang di <span className="text-secondary">e-Maktab</span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-light">
              Platform manajemen terpadu Pesantren Mahasiswa An-Nur. Mengelola akademik, administrasi, dan perkembangan santri dalam satu pintu.
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
            © {new Date().getFullYear()} Yayasan An-Nur. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="font-heading font-bold text-xl text-white">ا</span>
              </div>
              <span className="font-heading font-bold text-2xl text-slate-900">An-Nur</span>
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
