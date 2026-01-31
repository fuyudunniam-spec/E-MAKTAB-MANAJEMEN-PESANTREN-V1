import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  UserPlus,
  Heart,
  Menu,
  ArrowRight,
  MonitorPlay,
  BarChart2,
  GraduationCap,
  Sprout,
  Quote,
  Facebook,
  Instagram,
  Youtube,
  MapPin,
  Phone,
  Mail,
  Calculator,
  Package,
  Check,
  CheckCircle2,
  ChevronRight,
  LogIn
} from "lucide-react";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [zakatInput, setZakatInput] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const calculateZakat = (val: number) => {
    setZakatInput(val);
  };

  const zakatResult = zakatInput * 0.025;

  return (
    <div className="min-h-screen bg-paper font-body selection:bg-gold-200 selection:text-royal-950">
      <Helmet>
        <title>Al-Bisri | Royal Education Foundation</title>
        <meta name="description" content="Memuliakan Yatim, Membangun Peradaban. Lembaga pendidikan dan filantropi Islam modern." />
      </Helmet>

      {/* HEADER */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-10 h-10 bg-royal-900 text-white rotate-45 flex items-center justify-center rounded-sm shadow-md hover:rotate-0 transition-transform duration-300">
              <span className="font-display font-bold text-gold-400 text-lg -rotate-45">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-royal-900 tracking-widest text-lg leading-none">AL-BISRI</span>
              <span className="text-[9px] text-gold-600 uppercase tracking-[0.25em] font-sans font-semibold">Institute</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <a href="#filosofi" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Filosofi</a>
            <a href="#academy" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Academy</a>
            <button onClick={() => navigate('/donasi')} className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Wakaf</button>
            <button onClick={() => navigate('/blog')} className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Berita</button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pms/admin')}
              className="hidden xl:flex items-center gap-2 text-stone-500 hover:text-royal-900 text-xs font-bold uppercase tracking-wider transition group"
            >
              <LogIn className="w-4 h-4 text-gold-500 group-hover:scale-110 transition" /> Login E-Maktab
            </button>
            <button
              onClick={() => navigate('/psb/auth')}
              className="hidden xl:flex items-center gap-2 text-stone-500 hover:text-royal-900 text-xs font-bold uppercase tracking-wider transition group"
            >
              <UserPlus className="w-4 h-4 text-gold-500 group-hover:scale-110 transition" /> Portal PSB
            </button>
            <button
              onClick={() => navigate('/donasi')}
              className="group flex items-center gap-2 px-6 py-2.5 bg-royal-900 text-white text-sm uppercase tracking-widest font-semibold hover:bg-royal-800 transition shadow-lg shadow-royal-900/20 rounded-sm"
            >
              <span>Investasi Wakaf</span>
              <Heart className="w-3 h-3 text-gold-400 fill-current group-hover:scale-110 transition-transform" />
            </button>
            <button className="lg:hidden text-royal-900 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-24 px-6">
          <div className="flex flex-col gap-6">
            <a href="#filosofi" className="text-stone-600 text-xl font-display font-bold border-b border-stone-100 pb-4" onClick={() => setIsMenuOpen(false)}>Filosofi</a>
            <a href="#academy" className="text-stone-600 text-xl font-display font-bold border-b border-stone-100 pb-4" onClick={() => setIsMenuOpen(false)}>Academy</a>
            <button onClick={() => { navigate('/donasi'); setIsMenuOpen(false); }} className="text-left text-stone-600 text-xl font-display font-bold border-b border-stone-100 pb-4">Wakaf</button>
            <button onClick={() => { navigate('/blog'); setIsMenuOpen(false); }} className="text-left text-stone-600 text-xl font-display font-bold border-b border-stone-100 pb-4">Berita</button>
            <button
              onClick={() => navigate('/psb/auth')}
              className="flex items-center gap-3 text-royal-900 font-bold py-2"
            >
              <UserPlus className="w-5 h-5" /> Portal PSB
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center pt-10 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-100 rounded-full blur-[100px] opacity-40 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-royal-100 rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 w-full">
          <div className="animate-fade-in relative z-20">
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 rounded-full border border-royal-900/10 bg-white/80 backdrop-blur-md shadow-sm w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
              <span className="text-royal-900 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">
                100% Lulusan Dhuafa Masuk PTN/Timur Tengah
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium text-royal-950 mb-8 leading-[1.1]">
              Memuliakan <span className="text-royal-800">Yatim,</span><br />
              <span className="italic text-gold-600 font-serif relative inline-block">
                Membangun Peradaban
                <svg className="absolute w-full h-3 -bottom-2 left-0 text-gold-400/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-xl text-stone-600 mb-10 max-w-lg font-light leading-relaxed">
              Kami tidak sekadar memberi santunan, tapi memberikan <strong>pendidikan terbaik</strong> agar anak yatim & dhuafa tumbuh menjadi pemimpin yang mandiri dan bermartabat.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <button
                onClick={() => navigate('/donasi')}
                className="group relative px-10 py-4 bg-royal-900 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative font-display font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                  Investasi Wakaf <ArrowRight className="w-4 h-4 text-gold-400" />
                </span>
              </button>
              <button
                onClick={() => navigate('/psb/auth')}
                className="group px-8 py-4 bg-white border border-stone-200 text-royal-900 font-bold uppercase tracking-widest text-sm rounded-full hover:border-gold-400 hover:text-gold-600 transition shadow-sm flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-royal-900 group-hover:text-gold-600 transition" /> Daftar Reguler
              </button>
            </div>
          </div>

          <div className="relative animate-fade-in flex justify-center lg:justify-end pt-10 lg:pt-0" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-gold-200/30 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition duration-700 ease-out group aspect-[3/4]">
                <div className="absolute inset-0 bg-royal-900/10 group-hover:bg-transparent transition duration-500 z-10"></div>
                <img
                  src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1200&auto=format&fit=crop"
                  alt="Santri Al-Bisri"
                  className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition duration-700"
                />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-royal-950/80 to-transparent z-20"></div>
                <div className="absolute bottom-8 left-8 z-30">
                  <p className="text-gold-400 font-display text-lg italic mb-1">\"Bukan Panti, Tapi Pesantren\"</p>
                  <p className="text-white text-xs uppercase tracking-widest font-light">Rumah Bagi 150+ Santri Yatim</p>
                </div>
              </div>
              <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3 z-40">
                <div className="w-10 h-10 bg-royal-100 rounded-full flex items-center justify-center text-royal-800">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Amanah Umat</p>
                  <p className="font-display text-lg font-bold text-royal-900">1.250 Santri</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="filosofi" className="py-24 relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative group order-2 md:order-1">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-royal-50 rounded-full -z-10 group-hover:scale-110 transition-transform"></div>
              <img
                src="https://images.unsplash.com/photo-1542816417-0983c9c9ad53?q=80&w=2670&auto=format&fit=crop"
                alt="Asrama Al-Bisri"
                className="rounded-[3rem] shadow-2xl w-full h-[500px] object-cover grayscale hover:grayscale-0 transition duration-700"
              />
              <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-stone-100 max-w-xs transition-transform duration-500 hover:scale-105">
                <p className="font-display text-4xl font-bold text-royal-900 mb-1">Mandiri<span className="text-gold-500 text-2xl">.</span></p>
                <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">Visi Ekonomi Pesantren</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-4 block">Filosofi Kemandirian</span>
              <h2 className="text-4xl md:text-5xl font-display text-royal-900 mb-6 leading-tight">Gotong Royong <br /><span className="italic text-stone-400">Pendidikan Umat</span></h2>
              <p className="text-stone-600 text-lg leading-relaxed mb-6">
                Al-Bisri menerapkan sistem <strong>Subsidi Silang (Cross-Subsidy)</strong>. Kami membuka layanan asrama dan pendidikan berbayar bagi masyarakat umum.
              </p>
              <p className="text-stone-600 text-lg leading-relaxed mb-8 border-l-4 border-gold-400 pl-4">
                Keuntungan dari program reguler inilah yang menopang operasional dan menjamin <strong>pendidikan GRATIS berkualitas tinggi</strong> bagi ratusan santri yatim dan dhuafa.
              </p>
              <button
                onClick={() => navigate('/donasi')}
                className="inline-flex items-center gap-2 text-royal-900 font-bold uppercase tracking-widest text-sm border-b-2 border-gold-400 pb-1 hover:text-gold-600 transition group"
              >
                Dukung Gerakan Ini <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="py-24 bg-royal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <span className="text-gold-400 font-bold uppercase tracking-[0.2em] text-xs">Milestones</span>
            <h2 className="text-3xl md:text-4xl font-display text-white mt-3">Jejak Langkah Pengabdian</h2>
          </div>
          <div className="relative">
            <div className="absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent hidden md:block"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
              {[
                { year: "1998", title: "Perintisan", desc: "Pendirian Panti Asuhan & Pesantren Yatim pertama." },
                { year: "2010", title: "Legalitas Madin", desc: "Izin operasional resmi Madrasah Diniyah & Program Asrama." },
                { year: "2024", title: "Ekosistem Baru", desc: "Peluncuran unit usaha mandiri & Pesantren Mahasiswa." },
                { year: "2026", title: "Kemandirian", desc: "Target operasional mandiri penuh & Universitas." }
              ].map((m, idx) => (
                <div key={idx} className="relative group text-center">
                  <div className="hidden md:flex justify-center items-center absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-4 h-4 bg-royal-900 border-2 border-gold-500 rounded-full group-hover:scale-125 group-hover:bg-gold-500 transition duration-500 shadow-[0_0_15px_rgba(212,175,55,0.5)]"></div>
                  </div>
                  <div className="mb-12 md:mb-16 transform transition duration-500 group-hover:-translate-y-2">
                    <span className="text-5xl md:text-6xl font-display text-transparent bg-clip-text bg-gradient-to-b from-gold-300 to-gold-600 font-bold opacity-80">{m.year}</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-gold-500/30 transition duration-500 relative overflow-hidden group-hover:shadow-2xl">
                    <h4 className="text-xl font-display text-white mb-3 relative z-10">{m.title}</h4>
                    <p className="text-sm text-royal-200 leading-relaxed font-light relative z-10">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMY / E-LEARNING */}
      <section id="academy" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block py-1 px-3 rounded-full bg-royal-100 text-royal-800 text-xs font-bold uppercase tracking-wider mb-4 border border-royal-200">Didukung Isyraq Annur Media</span>
              <h2 className="text-4xl md:text-5xl font-display text-royal-900 mb-6">Akses Kurikulum <br /> <span className="italic text-gold-600">Bahasa Arab Digital</span></h2>
              <p className="text-stone-600 text-lg mb-8 leading-relaxed">
                Kami membuka akses materi pembelajaran Bahasa Arab standar Timur Tengah secara digital. Dikembangkan oleh tim ahli Pesantren Mahasiswa An-Nur.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="group px-10 py-4 bg-royal-900 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold uppercase tracking-widest text-sm flex items-center gap-3"
              >
                Masuk Academy <MonitorPlay className="w-4 h-4 text-gold-400" />
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gold-400/20 rounded-[3rem] rotate-6 scale-95 blur-xl"></div>
              <div className="relative bg-stone-50 p-2 rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
                  className="rounded-[2rem] w-full object-cover opacity-90 hover:opacity-100 transition duration-700"
                  alt="E-Learning Platform"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT / WAKAF */}
      <section id="wakaf" className="py-32 relative bg-royal-900 text-white rounded-t-[4rem] -mt-10 z-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-3 block">Transparansi Dana Wakaf</span>
              <h2 className="text-4xl md:text-5xl font-display text-white mb-4">Laporan Penyaluran</h2>
              <p className="text-royal-200 font-light text-lg">Melihat langsung bagaimana donasi Anda menjadi \"darah\" bagi pendidikan anak yatim.</p>
            </div>
            <div>
              <button
                onClick={() => navigate('/auth')}
                className="px-8 py-3 border border-white/20 text-white text-sm hover:bg-white hover:text-royal-900 transition flex items-center gap-2 uppercase tracking-wider rounded-full font-bold"
              >
                <BarChart2 className="w-4 h-4" /> Masuk Portal Transparansi
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-royal-950/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-xl font-display font-bold text-white mb-6 text-center">Fokus Penyaluran</h3>
              <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl">
                {/* Chart Placeholder */}
                <div className="text-center">
                  <BarChart2 className="w-12 h-12 text-gold-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-royal-300">Statistik Penyaluran</p>
                </div>
              </div>
              <div className="mt-8 text-center border-t border-white/10 pt-6">
                <p className="text-[10px] text-royal-300 uppercase tracking-widest mb-1">Aset Produktif</p>
                <p className="text-3xl font-display text-gold-400">Rp 12.5 M</p>
              </div>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {[
                { count: "150 Kader", label: "Santri Yatim Takhassus Mukim.", icon: GraduationCap, progress: 85 },
                { count: "20 Hektar", label: "Lahan wakaf produktif untuk kemandirian.", icon: Sprout, progress: 60 }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 text-gold-400 text-2xl">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-display mb-2">{item.count}</h4>
                  <p className="text-royal-200 text-sm mb-4">{item.label}</p>
                  <div className="w-full bg-royal-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gold-400 h-full rounded-full" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              ))}
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition group sm:col-span-2 flex items-center justify-between hover:-translate-y-1">
                <div>
                  <h4 className="text-xl font-display mb-1">Pembangunan Asrama Putra</h4>
                  <p className="text-royal-200 text-sm">Progres fisik mencapai 75%</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display text-gold-400">75%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-gold-600 font-bold uppercase tracking-widest text-xs">Suara Hati</span>
            <h2 className="text-4xl font-display text-royal-900 mt-2">Kisah Penerima Manfaat</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "Al-Bisri memberi saya rumah ketika saya kehilangan segalanya. Di sini saya belajar bahwa yatim bukan alasan untuk menyerah.",
                author: "Ahmad Fikri",
                role: "Alumni 2018",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
              },
              {
                text: "Sistem transparansi wakafnya luar biasa. Saya mendapat laporan berkala tentang perkembangan pohon mangga wakaf saya.",
                author: "Hj. Siti Aminah",
                role: "Wakif Tetap",
                img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
              },
              {
                text: "Lulus dari sini saya punya hafalan 30 Juz dan skill desain grafis. Sekarang saya merintis usaha percetakan sendiri.",
                author: "Rudi Santoso",
                role: "Santripreneur",
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
              }
            ].map((t, idx) => (
              <div key={idx} className="bg-stone-50 p-8 rounded-[2.5rem] relative hover:shadow-lg transition duration-500 flex flex-col justify-between h-full group">
                <div>
                  <Quote className="w-8 h-8 text-gold-400 mb-4 fill-current opacity-50 group-hover:opacity-100 transition-opacity" />
                  <p className="text-stone-600 italic mb-6 leading-relaxed">\"{t.text}\"</p>
                </div>
                <div className="flex items-center gap-4 mt-auto">
                  <img src={t.img} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt={t.author} />
                  <div>
                    <p className="font-bold text-royal-900 text-sm">{t.author}</p>
                    <p className="text-xs text-stone-500 uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      <section id="berita" className="py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display text-royal-900">Kabar Pesantren</h2>
            </div>
            <button
              onClick={() => navigate('/blog')}
              className="text-sm font-bold text-gold-600 hover:text-royal-900 transition flex items-center gap-1 rounded-full px-4 py-2 border border-stone-200 bg-white hover:border-royal-900"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { tag: "Prestasi", title: "Santri Al-Bisri Juara 1 MHQ Nasional", date: "20 Okt 2024", img: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=800&auto=format&fit=crop" },
              { tag: "Wakaf Produktif", title: "Panen Raya Padi Organik", date: "18 Okt 2024", img: "https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=800&auto=format&fit=crop" },
              { tag: "Kunjungan", title: "Studi Banding Kemenag", date: "15 Okt 2024", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop" }
            ].map((n, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition group cursor-pointer hover:-translate-y-1 duration-500">
                <div className="h-56 overflow-hidden">
                  <img src={n.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={n.title} />
                </div>
                <div className="p-8">
                  <span className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-2 block">{n.tag}</span>
                  <h3 className="font-display text-lg font-bold text-royal-900 mb-3 group-hover:text-gold-600 transition">{n.title}</h3>
                  <p className="text-stone-400 text-xs font-bold uppercase">{n.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DONATION CTA & ZAKAT CALC */}
      <section id="donasi-cta" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-stone-50 rounded-[4rem] p-10 md:p-16 shadow-2xl border border-stone-100 relative overflow-hidden mb-24">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3"></div>
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-4xl font-display text-royal-900 mb-4">Investasi Akhirat</h2>
              <p className="text-stone-500">Pilih jalur kontribusi terbaik Anda.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              <div>
                <h3 className="font-bold text-royal-900 mb-6 flex items-center gap-2 text-lg">
                  <Calculator className="w-5 h-5 text-gold-500" /> Hitung Zakat Maal
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Total Aset (Setahun)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-900 font-bold">Rp</span>
                      <input
                        type="number"
                        onChange={(e) => calculateZakat(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-full py-4 pl-14 text-royal-900 font-bold focus:border-royal-900 focus:outline-none transition shadow-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="bg-royal-900 text-white p-6 rounded-[2rem] flex justify-between items-center shadow-lg">
                    <span className="text-sm font-medium opacity-80">Wajib Zakat (2.5%)</span>
                    <span className="text-2xl font-display text-gold-400">Rp {zakatResult.toLocaleString('id-ID')}</span>
                  </div>
                  <button
                    onClick={() => navigate('/donasi')}
                    className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-full shadow-lg transition transform hover:-translate-y-1"
                  >
                    Tunaikan Zakat
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-royal-900 mb-6 flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-gold-500" /> Paket Wakaf Tunai
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "Wakaf Semen & Bata", desc: "Pembangunan Asrama", price: "100.000" },
                    { title: "Wakaf Benih Padi", desc: "Pertanian Produktif", price: "500.000" },
                    { title: "Wakaf Alat Belajar", desc: "Kitab & Komputer", price: "1.000.000" }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate('/donasi')}
                      className="w-full flex justify-between items-center p-5 bg-white border border-stone-200 rounded-[1.5rem] hover:border-gold-500 hover:shadow-lg transition group text-left"
                    >
                      <div>
                        <span className="block font-bold text-royal-900">{p.title}</span>
                        <span className="text-xs text-stone-500">{p.desc}</span>
                      </div>
                      <span className="font-display font-bold text-gold-600 group-hover:text-gold-500">Rp {p.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-royal-950 text-stone-400 pt-20 pb-10 border-t border-royal-900">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gold-500 text-royal-950 flex items-center justify-center rounded-full shadow-lg">
                <span className="font-display font-bold text-lg">A</span>
              </div>
              <span className="font-display font-bold text-white text-lg tracking-widest">AL-BISRI</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 font-light">Yayasan sosial & pendidikan yang berdedikasi memuliakan anak yatim melalui pendidikan berkualitas.</p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Youtube].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full bg-royal-900 flex items-center justify-center text-stone-400 hover:bg-gold-500 hover:text-royal-950 transition">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigasi</h5>
            <ul className="space-y-3 text-sm font-light">
              {["Tentang Kami", "Program Pendidikan", "Laporan Keuangan", "Hubungi Kami"].map(item => (
                <li key={item}><a href="#" className="hover:text-gold-400 transition">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Program Wakaf</h5>
            <ul className="space-y-3 text-sm font-light">
              {["Wakaf Uang", "Wakaf Aset", "Wakaf Profesi"].map(item => (
                <li key={item}><a href="#" className="hover:text-gold-400 transition">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Kontak</h5>
            <ul className="space-y-4 text-sm font-light">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-gold-500" />
                <span>Jl. Pesantren No. 45<br />Kota Batu, Jawa Timur</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold-500" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold-500" />
                <span>info@albisri.org</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-royal-900 pt-8 text-center text-xs text-stone-500 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Yayasan Al-Bisri Royal Philanthropy. <br />
          <span className="text-royal-800 mt-2 block">Powered by <strong>Isyraq Annur Media</strong> & <strong>Pesantren Mahasiswa An-Nur</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
