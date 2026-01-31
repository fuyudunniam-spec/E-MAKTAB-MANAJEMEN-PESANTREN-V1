import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Crown,
    HeartHandshake,
    Coins,
    ArrowRight,
    ShieldCheck,
    Users,
    BookOpen,
    Home,
    MessageCircle,
    CheckCircle2,
    Globe,
    GraduationCap,
    ChevronDown,
    Menu,
    Lock,
    School,
    MonitorPlay,
    Star,
    Scroll,
    Lightbulb
} from "lucide-react";

// --- MOCK COMPONENTS (Standalone) ---

const Button = ({ children, onClick, className, variant = "default" }: any) => {
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    const combinedClass = `${baseClass} ${className}`;
    return <button onClick={onClick} className={combinedClass}>{children}</button>;
};

// Komponen Accordion yang diperbaiki
const AccordionItem = ({ children, className }: any) => (
    <div className={`border-b border-stone-100 last:border-0 ${className}`}>
        {children}
    </div>
);

const AccordionTrigger = ({ children, isOpen, onClick }: any) => (
    <button 
        onClick={onClick}
        className="flex flex-1 items-center justify-between py-4 font-display font-bold text-[#082f49] text-lg hover:underline transition-all w-full text-left"
    >
        {children}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 text-[#d4af37] ${isOpen ? 'rotate-180' : ''}`} />
    </button>
);

const AccordionContent = ({ children, isOpen }: any) => (
    <div className={`overflow-hidden text-sm transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-stone-500 font-medium leading-relaxed text-base font-body">
            {children}
        </div>
    </div>
);

// Komponen Wrapper Accordion Utama
const Accordion = ({ items }: { items: { q: string, a: string }[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="w-full space-y-2">
            {items.map((item, i) => (
                <AccordionItem key={i}>
                    <AccordionTrigger 
                        isOpen={openIndex === i} 
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    >
                        {item.q}
                    </AccordionTrigger>
                    <AccordionContent isOpen={openIndex === i}>
                        {item.a}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </div>
    );
};

// --- MAIN PAGE ---

const PSBPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Penerimaan Santri Baru | Al-Bisri Royal Education";
    }, []);

    const stats = [
        { label: "Mahasantri Aktif", value: "200+", icon: GraduationCap },
        { label: "Sekolah Mitra", value: "5+", icon: School },
        { label: "Penerima Beasiswa", value: "150", icon: HeartHandshake },
    ];

    const advantages = [
        {
            title: "Tahsin & Tahfidz Al-Qur'an",
            desc: "Fokus utama pada perbaikan kualitas bacaan (tajwid & makhraj) serta program hafalan yang fleksibel dan terjaga sanadnya.",
            icon: BookOpen,
            color: "bg-[#f0f9ff] text-[#075985]" // emerald equivalent in theme
        },
        {
            title: "Kajian Kitab Turats",
            desc: "Melestarikan tradisi ngaji kitab kuning (Fiqh, Aqidah, Tasawuf) warisan ulama salaf sebagai fondasi pemahaman agama.",
            icon: Scroll,
            color: "bg-[#fef9c3] text-[#d97706]" // yellow equivalent
        },
        {
            title: "Bahasa & Literasi",
            desc: "Pengembangan skill Bahasa Arab & Inggris aktif, serta budaya literasi (membaca & menulis) untuk wawasan global.",
            icon: Globe,
            color: "bg-[#e0f2fe] text-[#075985]"
        },
        {
            title: "Studi & Akademik",
            desc: "Lingkungan asrama yang kondusif untuk belajar, mendukung santri/mahasiswa berprestasi di sekolah formal & kampus.",
            icon: GraduationCap,
            color: "bg-[#fef9c3] text-[#d97706]"
        }
    ];

    const faqs = [
        {
            q: "Apakah Al-Bisri memiliki sekolah formal sendiri?",
            a: "Saat ini, Al-Bisri fokus pada Madrasah Diniyah (Kepesantrenan) dan Asrama. Untuk sekolah formal (SD-SMA/SMK), kami bermitra dengan lembaga pendidikan formal terpercaya di sekitar Gunung Anyar. Santri akan diantar-jemput ke sekolah mitra tersebut."
        },
        {
            q: "Apakah kegiatan pesantren mengganggu sekolah atau kuliah?",
            a: "Tidak. Jadwal kegiatan pesantren disusun agar tidak mengganggu jam akademik formal. Kegiatan Madrasah Diniyah (Madin) memiliki jadwal fleksibel (Sore atau Malam), dan kajian kitab dilaksanakan di luar jam sekolah/kuliah, sehingga santri tetap bisa fokus mengejar prestasi akademik."
        },
        {
            q: "Apakah lokasi pesantren strategis untuk Mahasiswa?",
            a: "Sangat strategis. Pesantren Mahasiswa Al-Bisri berlokasi di Perum IKIP C-92, Gunung Anyar, yang sangat dekat dengan kampus UINSA Kampus 2 dan UPN Veteran Jatim, menjadikannya hunian ideal bagi mahasiswa."
        },
        {
            q: "Bagaimana pembagian antara Santri Yatim dan Reguler?",
            a: "Kami mengintegrasikan mereka dalam satu lingkungan yang saling asah-asih-asuh. Santri Yatim (Full Beasiswa) dan Santri Reguler/Mahasiswa (Berbayar) mendapatkan fasilitas pendidikan dan kurikulum diniyah yang setara."
        }
    ];

    return (
        <div className="bg-[#FAFAF9] min-h-screen font-sans text-stone-800 selection:bg-[#D4AF37] selection:text-white">
             <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                .font-display { font-family: 'Cinzel', serif; }
                .font-serif { font-family: 'Cinzel', serif; }
                .font-body { font-family: 'Cormorant Garamond', serif; }
                .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
            `}</style>

            {/* Navigasi */}
            <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img src="/kop-albisri.png" alt="Logo Al-Bisri" className="h-12 w-auto" />
                        <div className="flex flex-col">
                            <span className="font-serif font-bold text-[#082f49] tracking-widest text-lg leading-none">PESANTREN AL-BISRI</span>
                            <span className="text-[10px] text-[#d4af37] uppercase tracking-[0.25em] font-sans font-semibold">Pesantren & Pengasuhan</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <button onClick={() => navigate('/psb/auth')} className="text-stone-500 font-bold text-sm hover:text-[#082f49] transition-colors flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Portal Wali
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section: JUJUR & EMPATIK */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f0f9ff] border border-[#e0f2fe] mb-8 animate-fade-in">
                            <ShieldCheck className="w-4 h-4 text-[#075985]" />
                            <span className="text-xs font-bold text-[#075985] uppercase tracking-widest">Penerimaan Santri Baru</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-display font-medium text-[#082f49] mb-8 leading-tight">
                            Rumah Kedua Bagi <br />
                            <span className="text-[#d4af37] italic">Generasi Penerus</span>
                        </h1>
                        
                        <p className="text-xl text-stone-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light font-body">
                            Kami menyediakan lingkungan <strong>asrama yang aman</strong> dan <strong>pendidikan diniyah berkualitas</strong>. 
                            Bermitra dengan sekolah formal terpilih, kami memastikan keseimbangan ilmu umum dan agama.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                onClick={() => navigate('/psb/register')}
                                className="bg-[#082f49] hover:bg-[#0c4a6e] text-white font-bold px-10 py-7 text-lg transition-all shadow-xl shadow-royal-900/20 active:scale-95"
                            >
                                Daftar Pengasuhan
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button
                                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                                className="border border-stone-300 text-stone-600 hover:bg-stone-50 hover:border-[#d4af37] px-10 py-7 bg-white text-lg font-bold"
                            >
                                Info Asrama
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 px-6 -mt-10 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {stats.map((stat, i) => (
                        <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-xl shadow-stone-200/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="p-4 rounded-2xl bg-[#f0f9ff] text-[#075985] mb-4">
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <p className="text-4xl font-serif font-bold text-[#082f49] mb-1">{stat.value}</p>
                            <p className="text-sm text-stone-500 font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Programs / Advantages */}
            <section id="programs" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-[#d4af37] font-bold uppercase tracking-[0.2em] text-xs mb-4 block">FOKUS PENDIDIKAN</span>
                        <h2 className="text-4xl md:text-5xl font-display text-[#082f49] mb-6">Pilar Pengasuhan & Akademik</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto text-lg font-body">
                            Kurikulum kami dirancang untuk menyeimbangkan kebutuhan spiritual (Ruhiyah) dan intelektual (Aqliyah) santri.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {advantages.map((adv, i) => (
                            <div key={i} className="group p-10 rounded-[3rem] bg-white border border-stone-100 shadow-lg hover:shadow-2xl hover:border-[#fde68a] transition-all duration-500">
                                <div className={`w-16 h-16 rounded-[1.5rem] ${adv.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    <adv.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-[#082f49] mb-4">{adv.title}</h3>
                                <p className="text-stone-500 leading-relaxed font-medium font-body">{adv.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jalur Pendaftaran (Cards Style) */}
            <section className="py-24 bg-white rounded-[4rem] mx-4 md:mx-10 shadow-sm border border-stone-100 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#082f49] via-[#d4af37] to-[#082f49]"></div>
                    
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif text-[#082f49] mb-6">Pilihan Program</h2>
                        <p className="text-stone-500 max-w-2xl mx-auto text-lg font-body">
                            Temukan program pendidikan yang sesuai dengan jenjang dan kebutuhan Anda.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-start">
                        
                        {/* 1. Santri Reguler */}
                        <div className="group rounded-[2.5rem] p-8 border border-stone-200 hover:border-[#d4af37] transition-all duration-300 bg-[#FAFAF9] flex flex-col relative overflow-hidden order-2 lg:order-1 h-full">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-[#e0f2fe] text-[#075985] flex items-center justify-center">
                                        <School className="w-7 h-7" />
                                    </div>
                                    <span className="text-[#075985] font-bold text-[10px] bg-[#f0f9ff] px-3 py-1 rounded-full uppercase tracking-wider">SD - SMA</span>
                                </div>
                                
                                <h3 className="text-2xl font-serif font-bold text-[#082f49] mb-2">Santri Reguler</h3>
                                <p className="text-stone-600 mb-6 text-sm font-body leading-relaxed">
                                    Program asrama & diniyah untuk siswa sekolah formal. Fokus pembinaan karakter dan kemandirian.
                                </p>

                                <div className="bg-white rounded-xl p-4 border border-stone-100 mb-6">
                                    <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">Infaq Pendidikan</p>
                                    <p className="text-2xl font-bold text-[#082f49] font-serif">Rp 850rb<span className="text-sm text-stone-400 font-sans font-normal">/bln</span></p>
                                    <p className="text-[10px] text-[#d4af37] mt-1 font-medium italic">*Termasuk subsidi silang yatim</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        "Asrama & Makan 3x Sehari",
                                        "Antar-Jemput Sekolah Mitra",
                                        "Madrasah Diniyah Sore",
                                        "Laundry & Kesehatan"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[#075985] text-sm font-medium font-body">
                                            <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    <Button
                                        onClick={() => navigate('/psb/register?type=reguler')}
                                        className="w-full py-6 rounded-full bg-white border-2 border-[#082f49] text-[#082f49] hover:bg-[#082f49] hover:text-white font-bold transition-all"
                                    >
                                        Daftar Reguler
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 2. Pesantren Mahasiswa (Highlight) - SINGLE PRICING */}
                        <div className="group rounded-[2.5rem] p-8 border-2 border-[#082f49] bg-[#082f49] text-white flex flex-col relative overflow-hidden shadow-2xl order-1 lg:order-2 transform lg:-translate-y-4 h-full z-10">
                            <div className="absolute top-0 right-0">
                                <div className="bg-[#d4af37] text-[#082f49] text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider shadow-md">
                                    Program Unggulan
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#d4af37] text-[#082f49] flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
                                        <GraduationCap className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="flex gap-1 justify-end mb-1">
                                            <Star className="w-3 h-3 text-[#d4af37] fill-current" />
                                            <Star className="w-3 h-3 text-[#d4af37] fill-current" />
                                            <Star className="w-3 h-3 text-[#d4af37] fill-current" />
                                        </div>
                                        <span className="text-[#bae6fd] font-bold text-[10px] uppercase tracking-wider">Mahasiswa</span>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-serif font-bold text-white mb-2">Pesantren Mahasiswa</h3>
                                <p className="text-stone-300 mb-8 text-sm font-body leading-relaxed">
                                    Hunian strategis & edukatif khusus mahasantri. Kajian Turats mendalam, fasilitas co-working, dan networking.
                                </p>

                                {/* Simple Pricing Block */}
                                <div className="bg-white/10 rounded-xl p-5 border border-white/10 mb-8 backdrop-blur-sm">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-[#d4af37] font-bold mb-1">Infaq Syahriah (Bulanan)</p>
                                        <p className="text-3xl font-bold text-white font-serif">Rp 650rb<span className="text-sm text-stone-300 font-sans font-normal">/bln</span></p>
                                        <p className="text-[10px] text-stone-300 mt-2 font-light">Skema pembayaran fleksibel & ringan.</p>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Kajian Kitab Kuning & Kontemporer",
                                        "Kamar AC & WiFi High Speed",
                                        "Mentoring Riset & Akademik",
                                        "Program Tahfidz Fleksibel"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white text-sm font-medium font-body">
                                            <div className="p-0.5 rounded-full bg-[#d4af37]/20">
                                                <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    <Button
                                        onClick={() => navigate('/psb/register?type=mahasiswa')}
                                        className="w-full py-7 rounded-full bg-[#d4af37] hover:bg-[#b4941f] text-[#082f49] font-bold text-lg transition-all shadow-lg shadow-[#d4af37]/20"
                                    >
                                        Daftar Mahasantri
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Beasiswa Yatim */}
                        <div className="group rounded-[2.5rem] p-8 border border-stone-200 hover:border-[#d4af37] transition-all duration-300 bg-[#FAFAF9] flex flex-col relative overflow-hidden order-3 lg:order-3 h-full">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-stone-200 text-stone-600 flex items-center justify-center">
                                        <HeartHandshake className="w-7 h-7" />
                                    </div>
                                    <span className="text-stone-500 font-bold text-[10px] bg-stone-100 px-3 py-1 rounded-full uppercase tracking-wider">Sosial</span>
                                </div>
                                
                                <h3 className="text-2xl font-serif font-bold text-[#082f49] mb-2">Beasiswa Kader</h3>
                                <p className="text-stone-600 mb-6 text-sm font-body leading-relaxed">
                                    Program khusus Yatim & Dhuafa berprestasi. Seleksi ketat untuk mencetak kader ulama masa depan.
                                </p>

                                <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#dcfce7] mb-6">
                                    <p className="text-[10px] uppercase tracking-widest text-[#15803d] font-bold mb-1">Beasiswa Penuh</p>
                                    <p className="text-2xl font-bold text-[#166534] font-serif">Gratis 100%</p>
                                    <p className="text-[10px] text-[#166534] mt-1 font-medium">*Wajib lolos seleksi & survey</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {[
                                        "Asrama & Makan Gratis",
                                        "Biaya Sekolah Formal Ditanggung",
                                        "Pembinaan Intensif 24 Jam",
                                        "Wajib Pengabdian (Khidmah)"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-[#075985] text-sm font-medium font-body">
                                            <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    <Button
                                        onClick={() => navigate('/psb/register?type=scholarship')}
                                        className="w-full py-6 rounded-full bg-white border border-stone-300 text-stone-600 hover:border-[#082f49] hover:text-[#082f49] font-bold transition-all"
                                    >
                                        Ajukan Seleksi
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <div>
                        <span className="text-[#d4af37] font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Pusat Informasi</span>
                        <h2 className="text-4xl font-serif text-[#082f49] mb-8">Pertanyaan Umum</h2>
                        
                        <div className="space-y-6 font-body">
                            <p className="text-stone-600 leading-relaxed text-lg">
                                Proses seleksi di Al-Bisri mengutamakan transparansi dan objektivitas untuk menjaring bibit unggul.
                            </p>
                            
                            <div className="p-8 rounded-[2rem] bg-[#082f49] text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-serif font-bold text-xl mb-2">Butuh Bantuan Pendaftaran?</h4>
                                    <p className="text-[#bae6fd] mb-6">Tim panitia kami siap memandu Anda langkah demi langkah.</p>
                                    <Button className="rounded-full border border-[#075985] text-white hover:bg-[#075985] bg-transparent px-6 py-2">
                                        Chat Panitia WA
                                    </Button>
                                </div>
                                <MessageCircle className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-5" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100">
                        <Accordion items={faqs} />
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-20 bg-[#082f49] text-white rounded-t-[4rem] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
                
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-serif mb-8">Siap Menjadi Bagian Keluarga <br/> <span className="text-[#d4af37]">Al-Bisri?</span></h2>
                    <p className="text-[#bae6fd] text-xl max-w-2xl mx-auto mb-12 font-light font-body">
                        Segera daftarkan putra-putri Anda sebelum kuota terpenuhi. Masa depan gemilang dimulai dari pendidikan yang tepat.
                    </p>
                    <Button
                        onClick={() => navigate('/psb/register')}
                        className="bg-[#d4af37] hover:bg-[#b4941f] text-[#082f49] font-bold px-12 py-8 rounded-full text-xl shadow-2xl shadow-[#d4af37]/20 hover:scale-105 transition-transform"
                    >
                        Daftar Sekarang
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default PSBPage;