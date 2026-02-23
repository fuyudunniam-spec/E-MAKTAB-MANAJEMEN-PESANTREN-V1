import React, { useEffect } from 'react';
import {
    HeartHandshake, BookOpen, GraduationCap, Home,
    Clock, ArrowRight, CheckCircle2, Quote, Sun, Moon,
    Users, TrendingUp, ShieldCheck, BookMarked
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { Link } from 'react-router-dom';

// ============================================
// MAIN PAGE COMPONENT
// ============================================

const PublicProgramPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const SCHEDULE = [
        { time: "04:00 - 04:30", act: "Qiyamullail & Shalat Subuh Berjamaah", icon: Moon },
        { time: "04:30 - 05:30", act: "Madrasah Diniyah & Kajian Kitab Salaf (Senin-Jumat)", icon: BookOpen, isCore: true },
        { time: "05:30 - 06:20", act: "Bersih Diri, Sarapan & Persiapan Berangkat", icon: Home },
        { time: "06:20 - 15:30", act: "Sekolah Formal di Sekolah Mitra (Waktu Menyesuaikan Jenjang)", icon: GraduationCap },
        { time: "15:30 - 16:00", act: "Shalat Ashar Berjamaah (Kondisional Kepulangan)", icon: Sun },
        { time: "16:00 - 16:45", act: "Taman Pendidikan Al-Qur'an (TPQ) (Senin-Jumat)", icon: BookMarked, isCore: true },
        { time: "18:10 - 18:30", act: "Shalat Maghrib & Doa Bersama Khusus Donatur", icon: HeartHandshake },
        { time: "18:30 - 19:40", act: "Tahsin & Tahfidz Al-Qur'an (Senin-Rabu)", icon: BookOpen, isCore: true },
        { time: "19:40 - 20:00", act: "Shalat Isya Berjamaah & Makan Malam", icon: Home },
        { time: "20:00 - 22:00", act: "Belajar Bersama & Muroja'ah", icon: BookOpen, note: "* Batas akhir kunjungan tamu adalah pukul 21:00 WIB." },
        { time: "22:00 - 04:00", act: "Istirahat / Jam Malam", icon: Moon },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-[#c09c53]/20 selection:text-[#0f172a] flex flex-col">
            <PublicNavbar />

            <main className="flex-1 w-full overflow-hidden">

                {/* ========================================== */}
                {/* HERO SECTION                               */}
                {/* ========================================== */}
                <header className="pt-24 lg:pt-32 pb-16 px-6 bg-white text-center">
                    <div className="max-w-4xl mx-auto animate-fade-in-up">
                        <h4 className="text-[#c09c53] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Program & Layanan</h4>
                        <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-serif text-[#0f172a] leading-[1.1] mb-8 tracking-tight">
                            Sinergi Pembinaan,<br />
                            <span className="italic text-slate-400 font-light">Merajut Masa Depan.</span>
                        </h1>
                        <p className="text-slate-500 text-lg max-w-3xl mx-auto leading-relaxed font-light mb-12">
                            Kami hadir memberikan solusi pendidikan utuh. Menjamin pengasuhan adab di dalam pesantren, sekaligus memberikan akses pendidikan formal berkualitas bagi generasi mandiri.
                        </p>
                    </div>
                </header>

                {/* ========================================== */}
                {/* PILAR 1: PENDIDIKAN DINIYAH (INTERNAL)     */}
                {/* ========================================== */}
                <section className="py-20 lg:py-32 bg-[#fafafa] border-y border-slate-200">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                            <div className="order-2 lg:order-1 relative group animate-fade-in-up">
                                <div className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative">
                                    <img src="https://images.unsplash.com/photo-1609599006353-e629aaab31bf?auto=format&fit=crop&q=80" alt="Kajian Diniyah" className="w-full h-full object-cover transition duration-[2000ms] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-[#0f172a]/20 mix-blend-multiply"></div>
                                </div>
                                <div className="absolute -bottom-8 -right-4 lg:-right-12 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 max-w-[280px]">
                                    <BookOpen className="w-8 h-8 text-[#c09c53] mb-4" />
                                    <p className="font-serif text-xl text-[#0f172a] mb-2 leading-tight">Kurikulum Salaf & Tahfidz</p>
                                    <p className="text-xs text-slate-500">Membentuk fondasi tauhid dan akhlak mulia santri mukim.</p>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2 animate-fade-in-up delay-100">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
                                    <span className="w-8 h-px bg-[#c09c53]"></span> Fokus Internal
                                </h4>
                                <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-8 leading-[1.15]">
                                    Kajian Diniyah & <br /><span className="italic text-slate-400">Pembinaan Karakter.</span>
                                </h2>
                                <div className="space-y-6 text-slate-600 leading-relaxed font-light mb-8">
                                    <p>
                                        Santri mukim mendapatkan bimbingan intensif setiap harinya. Pengasuhan berfokus pada kedisiplinan ibadah, perbaikan bacaan (tahsin), dan hafalan Al-Qur'an sebagai kurikulum utama.
                                    </p>
                                    <p>
                                        Penanaman adab dan akhlakul karimah menjadi prioritas kami, memastikan setiap santri memiliki karakter yang kuat dalam menghadapi tantangan zaman.
                                    </p>
                                </div>
                                <ul className="space-y-4">
                                    {['Halaqah Tahfidz & Tahsin Harian', 'Pengkajian Fiqih & Akhlak', 'Pembiasaan Ibadah Sunnah Bersama'].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm font-medium text-[#0f172a]">
                                            <CheckCircle2 className="w-5 h-5 text-[#c09c53]" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* PILAR 2: BEASISWA SEKOLAH (EKSTERNAL)      */}
                {/* ========================================== */}
                <section className="py-20 lg:py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                            <div className="animate-fade-in-up">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
                                    <span className="w-8 h-px bg-[#c09c53]"></span> Kemitraan Strategis
                                </h4>
                                <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-8 leading-[1.15]">
                                    Beasiswa Penuh <br /><span className="italic text-slate-400">Sekolah Formal.</span>
                                </h2>
                                <div className="space-y-6 text-slate-600 leading-relaxed font-light mb-8">
                                    <p>
                                        Seluruh santri yatim Al-Bisri dijamin akses pendidikan formalnya melalui kemitraan dengan sekolah-sekolah unggulan di area Surabaya.
                                    </p>
                                    <p>
                                        Beasiswa mencakup seluruh biaya SPP, uang pangkal, hingga keperluan buku dan seragam. Kami memastikan mereka siap secara akademik untuk bersaing di dunia profesional kelak.
                                    </p>
                                </div>
                                <div className="bg-[#fafafa] border border-slate-200 p-6 rounded-2xl">
                                    <div className="flex gap-4">
                                        <GraduationCap className="w-8 h-8 text-[#c09c53] shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-[#0f172a] mb-1">100% Bebas Biaya Sekolah</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">Donasi disalurkan untuk menjamin kelangsungan ijazah formal santri yatim.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group animate-fade-in-up delay-100">
                                <div className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative">
                                    <img src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80" alt="Sekolah Formal" className="w-full h-full object-cover transition duration-[2000ms] group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-[#0f172a]/10"></div>
                                </div>
                                <div className="absolute top-8 -left-4 lg:-left-12 bg-[#0f172a] text-white p-6 md:p-8 rounded-3xl shadow-xl max-w-[260px]">
                                    <Quote className="w-6 h-6 text-[#c09c53] mb-4 opacity-50" />
                                    <p className="font-serif text-lg mb-2 italic">"Pendidikan adalah paspor menuju masa depan."</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* PILAR 3: ASRAMA & PENGASUHAN (INTERNAL)    */}
                {/* ========================================== */}
                <section className="py-20 lg:py-32 bg-[#0f172a] text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">Rumah Harapan</h4>
                        <h2 className="text-4xl lg:text-5xl font-serif mb-16">Pengasuhan & Asrama Santri</h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <Home className="w-10 h-10 text-[#c09c53] mb-6" />
                                <h3 className="text-xl font-serif mb-3">Hunian yang Nyaman</h3>
                                <p className="text-sm text-slate-300 font-light leading-relaxed">
                                    Asrama yang bersih dan kondusif untuk beristirahat serta muroja'ah hafalan setelah beraktivitas sekolah.
                                </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <HeartHandshake className="w-10 h-10 text-[#c09c53] mb-6" />
                                <h3 className="text-xl font-serif mb-3">Kebutuhan Gizi Terjamin</h3>
                                <p className="text-sm text-slate-300 font-light leading-relaxed">
                                    Pemberian makan bergizi 3x sehari guna mendukung pertumbuhan fisik dan konsentrasi santri dalam belajar.
                                </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <Clock className="w-10 h-10 text-[#c09c53] mb-6" />
                                <h3 className="text-xl font-serif mb-3">Pendampingan 24 Jam</h3>
                                <p className="text-sm text-slate-300 font-light leading-relaxed">
                                    Pengawasan asatidz/musyrif yang senantiasa membimbing ibadah dan perkembangan psikologis santri setiap saat.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* PILAR 4: PESANTREN MAHASISWA               */}
                {/* ========================================== */}
                <section className="py-20 lg:py-32 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                            <div className="lg:col-span-5 order-2 lg:order-1 animate-fade-in-up">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80" alt="Mahasiswa" className="w-full h-48 object-cover rounded-2xl shadow-md" />
                                        <div className="bg-[#fafafa] p-6 rounded-2xl border border-slate-100">
                                            <TrendingUp className="w-6 h-6 text-[#c09c53] mb-3" />
                                            <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest mb-1">Subsidi Silang</p>
                                            <p className="text-[10px] text-slate-500">Menopang biaya beasiswa yatim.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-8">
                                        <div className="bg-[#0f172a] p-6 rounded-2xl text-white">
                                            <Users className="w-6 h-6 text-[#c09c53] mb-3" />
                                            <p className="text-xs font-bold uppercase tracking-widest mb-1">Kakak Asuh</p>
                                            <p className="text-[10px] text-slate-400">Menjadi teladan bagi adik yatim.</p>
                                        </div>
                                        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" alt="Diskusi" className="w-full h-48 object-cover rounded-2xl shadow-md" />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7 order-1 lg:order-2 animate-fade-in-up delay-100">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
                                    <span className="w-8 h-px bg-[#c09c53]"></span> Pesantren Mahasiswa
                                </h4>
                                <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-8 leading-[1.15]">
                                    Program Reguler <br /><span className="italic text-slate-400">Sinergi Pembinaan.</span>
                                </h2>
                                <div className="space-y-6 text-slate-600 leading-relaxed font-light mb-8">
                                    <p>
                                        Al-Bisri membuka jalur reguler berbayar bagi mahasiswa aktif yang ingin memperdalam ilmu agama di lingkungan asrama yang islami di kawasan strategis Rungkut.
                                    </p>
                                    <p>
                                        Selain mendapatkan fasilitas asrama dan pembinaan diniyah, mahasiswa dalam program ini diproyeksikan sebagai <em>Musyrif</em> (Kakak Asuh) bagi santri yatim, menciptakan ekosistem belajar yang harmonis.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-[#0f172a]">
                                        <ShieldCheck className="w-4 h-4 text-[#c09c53]" /> Kuota Terbatas
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* PILAR 5: TPQ ANAK & SORE (NEW SECTION)      */}
                {/* ========================================== */}
                <section className="py-20 lg:py-32 bg-[#f9f5ec] border-y border-[#c09c53]/10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">

                            <div className="lg:col-span-7 animate-fade-in-up">
                                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
                                    <span className="w-8 h-px bg-[#c09c53]"></span> Khidmah Masyarakat
                                </h4>
                                <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-8 leading-[1.15]">
                                    TPQ Anak & Remaja <br /><span className="italic text-slate-400">Cahaya Lingkungan.</span>
                                </h2>
                                <div className="space-y-6 text-slate-600 leading-relaxed font-light mb-8">
                                    <p>
                                        Sebagai bentuk pengabdian kepada warga sekitar (Medokan Asri & Rungkut), Al-Bisri menyelenggarakan program <strong>TPQ Sore</strong> bagi anak-anak usia dini hingga jenjang SMP.
                                    </p>
                                    <p>
                                        Kami berfokus pada pengajaran Tahsin (perbaikan bacaan) dengan metode yang menyenangkan, hafalan surat-surat pendek, serta penanaman adab harian agar anak-anak tumbuh dengan karakter islami sejak dini.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#c09c53]/20 flex items-center justify-center shrink-0">
                                            <BookMarked className="w-5 h-5 text-[#c09c53]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0f172a]">Metode Tahsin</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Pembinaan Tartil Al-Qur'an</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#c09c53]/20 flex items-center justify-center shrink-0">
                                            <HeartHandshake className="w-5 h-5 text-[#c09c53]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#0f172a]">Infaq Terjangkau</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Mendukung Pendidikan Umat</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-5 relative group animate-fade-in-up delay-100">
                                <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-white">
                                    <img src="https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?auto=format&fit=crop&q=80" alt="Anak-anak TPQ" className="w-full h-full object-cover transition duration-1000 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-[#0f172a]/5"></div>
                                </div>
                                {/* Decorative Tag */}
                                <div className="absolute -bottom-6 -right-6 bg-[#0f172a] text-white p-6 rounded-2xl shadow-xl">
                                    <p className="text-[10px] text-[#c09c53] font-bold uppercase tracking-widest mb-1">Jadwal Kelas</p>
                                    <p className="font-serif text-lg">Pukul 16:00 WIB</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* A DAY IN THE LIFE (SCHEDULE)               */}
                {/* ========================================== */}
                <section className="py-24 lg:py-32 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">Disiplin Harian</h4>
                            <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a]">Aktivitas Santri</h2>
                            <p className="text-slate-500 font-light mt-4 mb-8">Keseimbangan waktu antara ibadah, sekolah formal, dan istirahat.</p>

                            <div className="inline-flex items-start gap-3 bg-amber-50/80 border border-amber-200/60 p-4 rounded-xl text-amber-900 text-xs font-medium max-w-2xl mx-auto text-left shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 animate-pulse"></div>
                                <p className="leading-relaxed">
                                    <strong className="font-bold text-amber-950">Catatan:</strong> Bagian dengan sorotan <span className="font-bold text-[#c09c53]">Emas (Agenda Wajib)</span> adalah waktu sakral belajar diniyah. Batas maksimal kunjungan tamu adalah <strong>pukul 21:00 WIB</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-0 md:border-l-0 mt-8">
                            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>

                            <div className="space-y-12 md:space-y-0">
                                {SCHEDULE.map((item, i) => {
                                    const isEven = i % 2 === 0;
                                    return (
                                        <div key={i} className={`relative flex flex-col md:flex-row items-start md:items-center ${isEven ? 'md:flex-row-reverse' : ''} group`}>
                                            <div className={`absolute left-[-21px] md:left-1/2 top-1 md:top-1/2 w-10 h-10 rounded-full border-[3px] transition-colors flex items-center justify-center -translate-y-1/2 md:-translate-x-1/2 z-10 shadow-sm ${item.isCore ? 'bg-[#c09c53] border-white' : 'bg-white border-slate-200 group-hover:border-[#c09c53]'}`}>
                                                <item.icon className={`w-4 h-4 transition-colors ${item.isCore ? 'text-white' : 'text-slate-400 group-hover:text-[#c09c53]'}`} />
                                            </div>
                                            <div className={`ml-8 md:ml-0 w-full md:w-1/2 ${isEven ? 'md:pl-16' : 'md:pr-16 text-left md:text-right'}`}>
                                                <div className={`p-6 rounded-2xl border transition-all ${item.isCore ? 'bg-[#c09c53]/5 border-[#c09c53]/30 shadow-md ring-1 ring-[#c09c53]/20' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <div className={`flex items-center gap-3 mb-2 ${isEven ? 'justify-start' : 'md:justify-end justify-start'}`}>
                                                        <p className="text-[#c09c53] font-mono text-xs font-bold">{item.time}</p>
                                                        {item.isCore && <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-[#c09c53] px-2 py-0.5 rounded-md shadow-sm">Agenda Wajib</span>}
                                                    </div>
                                                    <p className={`font-serif leading-tight ${item.isCore ? 'text-[#0f172a] font-bold text-xl mb-2' : 'text-slate-600 text-lg'}`}>{item.act}</p>
                                                    {item.note && <p className={`text-xs mt-1 ${item.isCore ? 'text-[#c09c53] font-medium' : 'text-slate-400'}`}>{item.note}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ========================================== */}
                {/* CALL TO ACTION                             */}
                {/* ========================================== */}
                <section className="py-20 border-t border-slate-200 bg-white text-center px-6">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-serif text-[#0f172a] mb-6">Ambil Bagian dalam Mencetak Generasi Peradaban</h2>
                        <p className="text-slate-500 mb-10 leading-relaxed font-light">
                            Setiap dukungan yang Anda berikan memastikan tidak ada satu pun santri yatim kami yang putus sekolah. Anda juga dapat bergabung sebagai Mahasiswa Reguler atau Santri TPQ.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to="/donasi" className="bg-[#0f172a] hover:bg-slate-800 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                                Donasi Program <HeartHandshake className="w-4 h-4" />
                            </Link>
                            <Link to="/psb" className="bg-white hover:bg-slate-50 border border-slate-200 text-[#0f172a] px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                                Portal Pendaftaran Santri
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            <PublicFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 100ms; }
      `}} />
        </div>
    );
};

export default PublicProgramPage;
