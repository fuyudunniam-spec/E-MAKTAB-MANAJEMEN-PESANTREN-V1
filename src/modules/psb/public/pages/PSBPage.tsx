import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HeartHandshake,
    ArrowRight,
    ShieldCheck,
    BookOpen,
    School,
    GraduationCap,
    ChevronDown,
    MessageCircle,
    CheckCircle2,
    Scroll,
    Globe,
    Star
} from "lucide-react";

import PublicNavbar from '../../../public-website/components/PublicNavbar';
import PublicFooter from '../../../public-website/components/PublicFooter';

// --- MOCK COMPONENTS (Standalone) ---

const Button = ({ children, onClick, className }: any) => {
    return (
        <button onClick={onClick} className={`inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${className}`}>
            {children}
        </button>
    );
};

// Komponen Accordion yang diperbaiki
const AccordionItem = ({ children, className }: any) => (
    <div className={`border-b border-stone-200 last:border-0 ${className}`}>
        {children}
    </div>
);

const AccordionTrigger = ({ children, isOpen, onClick }: any) => (
    <button
        onClick={onClick}
        className="flex flex-1 items-center justify-between py-6 font-display font-bold text-royal-900 text-lg hover:text-gold-600 transition-all w-full text-left"
    >
        {children}
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-300 text-gold-500 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
);

const AccordionContent = ({ children, isOpen }: any) => (
    <div className={`overflow-hidden text-sm transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-stone-600 font-light leading-relaxed text-base font-sans">
            {children}
        </div>
    </div>
);

// Komponen Wrapper Accordion Utama
const Accordion = ({ items }: { items: { q: string, a: string }[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="w-full">
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
        window.scrollTo(0, 0);
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
            color: "bg-royal-50 text-royal-700"
        },
        {
            title: "Kajian Kitab Turats",
            desc: "Melestarikan tradisi ngaji kitab kuning (Fiqh, Aqidah, Tasawuf) warisan ulama salaf sebagai fondasi pemahaman agama.",
            icon: Scroll,
            color: "bg-gold-50 text-gold-600"
        },
        {
            title: "Bahasa & Literasi",
            desc: "Pengembangan skill Bahasa Arab & Inggris aktif, serta budaya literasi (membaca & menulis) untuk wawasan global.",
            icon: Globe,
            color: "bg-stone-100 text-stone-600"
        },
        {
            title: "Studi & Akademik",
            desc: "Lingkungan asrama yang kondusif untuk belajar, mendukung santri/mahasiswa berprestasi di sekolah formal & kampus.",
            icon: GraduationCap,
            color: "bg-royal-900 text-gold-400"
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
        <div className="min-h-screen bg-paper font-jakarta selection:bg-gold-200 selection:text-navy-950">
            {/* Navigasi */}
            <PublicNavbar />

            {/* Hero Section: LUXURY NAVY */}
            <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-navy-950 text-white">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-navy-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in backdrop-blur-sm">
                        <ShieldCheck className="w-4 h-4 text-accent-gold" />
                        <span className="text-xs font-bold text-accent-gold uppercase tracking-[0.2em]">Penerimaan Santri Baru</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-medium text-white mb-8 leading-tight">
                        Rumah Kedua Bagi <br />
                        <span className="text-accent-gold italic font-serif">Generasi Penerus</span>
                    </h1>

                    <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
                        Kami menyediakan lingkungan <strong>asrama yang aman</strong> dan <strong>pendidikan diniyah berkualitas</strong>.
                        Bermitra dengan sekolah formal terpilih, kami memastikan keseimbangan ilmu umum dan agama.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => navigate('/psb/register')}
                            className="bg-accent-gold hover:bg-gold-400 text-navy-950 font-bold px-10 py-5 rounded-full text-sm uppercase tracking-widest shadow-xl shadow-gold-900/20 active:scale-95 transition-transform"
                        >
                            Daftar Pengasuhan
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                            onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                            className="border border-white/20 text-white hover:bg-white/5 px-10 py-5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors backdrop-blur-sm"
                        >
                            Info Asrama
                        </Button>
                    </div>
                </div>
            </section>

            {/* Stats Section - Floating */}
            <section className="px-6 -mt-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {stats.map((stat, i) => (
                        <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-500 group">
                            <div className="p-4 rounded-2xl bg-paper text-navy-900 mb-4 group-hover:bg-accent-gold group-hover:text-navy-950 transition-colors duration-500">
                                <stat.icon className="w-8 h-8" />
                            </div>
                            <p className="text-4xl font-display font-bold text-navy-950 mb-1">{stat.value}</p>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Programs / Advantages */}
            <section id="programs" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs mb-4 block">FOKUS PENDIDIKAN</span>
                        <h2 className="text-4xl md:text-5xl font-display text-navy-950 mb-6">Pilar Pengasuhan & Akademik</h2>
                        <div className="w-24 h-1 bg-accent-gold mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {advantages.map((adv, i) => (
                            <div key={i} className="group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-accent-gold transition-all duration-500">
                                <div className={`w-16 h-16 rounded-[1.5rem] ${adv.color.replace('royal', 'navy').replace('stone', 'slate').replace('gold', 'accent-gold')} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    <adv.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-navy-950 mb-4">{adv.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-light text-sm">{adv.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Jalur Pendaftaran (Cards Style) */}
            <section className="py-24 bg-paper mx-4 md:mx-10 rounded-[3rem] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-display text-navy-950 mb-6">Pilihan Program</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg font-light">
                            Temukan program pendidikan yang sesuai dengan jenjang dan kebutuhan Anda.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">

                        {/* 1. Santri Reguler */}
                        <div className="group rounded-[2.5rem] p-8 border border-slate-100 bg-white hover:border-accent-gold transition-all duration-300 flex flex-col relative overflow-hidden order-2 lg:order-1 h-full shadow-lg">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-paper text-navy-950 flex items-center justify-center">
                                    <School className="w-7 h-7" />
                                </div>
                                <span className="text-navy-600 font-bold text-[10px] bg-paper px-3 py-1 rounded-full uppercase tracking-wider">SD - SMA</span>
                            </div>

                            <h3 className="text-2xl font-display font-bold text-navy-950 mb-2">Santri Reguler</h3>
                            <p className="text-slate-500 mb-8 text-sm font-light leading-relaxed">
                                Program asrama & diniyah untuk siswa sekolah formal. Fokus pembinaan karakter dan kemandirian.
                            </p>

                            <div className="bg-paper rounded-2xl p-6 border border-slate-100 mb-8">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Infaq Pendidikan</p>
                                <p className="text-3xl font-display font-bold text-navy-950">Rp 850rb<span className="text-sm text-slate-400 font-sans font-normal">/bln</span></p>
                                <p className="text-[10px] text-accent-gold mt-2 font-medium italic">*Termasuk subsidi silang yatim</p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {[
                                    "Asrama & Makan 3x Sehari",
                                    "Antar-Jemput Sekolah Mitra",
                                    "Madrasah Diniyah Sore",
                                    "Laundry & Kesehatan"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-stone-600 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                <Button
                                    onClick={() => navigate('/psb/register?type=reguler')}
                                    className="w-full py-4 rounded-full border border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white font-bold text-sm uppercase tracking-widest transition-all"
                                >
                                    Daftar Reguler
                                </Button>
                            </div>
                        </div>

                        {/* 2. Pesantren Mahasiswa (Highlight) */}
                        <div className="group rounded-[2.5rem] p-8 bg-navy-950 text-white flex flex-col relative overflow-hidden shadow-2xl order-1 lg:order-2 transform lg:-translate-y-8 h-full z-10 border border-navy-800">
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                            <div className="absolute top-0 right-0">
                                <div className="bg-accent-gold text-navy-950 text-[10px] font-bold px-4 py-2 rounded-bl-2xl uppercase tracking-wider shadow-md">
                                    Terpopuler
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-accent-gold text-navy-950 flex items-center justify-center shadow-lg shadow-gold-500/20">
                                        <GraduationCap className="w-8 h-8" />
                                    </div>
                                    <div className="text-right pt-2">
                                        <div className="flex gap-1 justify-end mb-1">
                                            {[1, 2, 3].map(i => <Star key={i} className="w-3 h-3 text-accent-gold fill-current" />)}
                                        </div>
                                        <span className="text-gold-200 font-bold text-[10px] uppercase tracking-wider">Mahasiswa</span>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-display font-bold text-white mb-2">Pesantren Mahasiswa</h3>
                                <p className="text-royal-200 mb-8 text-sm font-light leading-relaxed">
                                    Hunian strategis & edukatif khusus mahasantri. Kajian Turats mendalam, fasilitas co-working, dan networking.
                                </p>

                                <div className="bg-white/10 rounded-2xl p-6 border border-white/10 mb-8 backdrop-blur-sm">
                                    <p className="text-[10px] uppercase tracking-widest text-accent-gold font-bold mb-1">Infaq Syahriah (Bulanan)</p>
                                    <p className="text-4xl font-display font-bold text-white">Rp 650rb<span className="text-sm text-royal-200 font-sans font-normal">/bln</span></p>
                                    <p className="text-[10px] text-royal-300 mt-2 font-light">Skema pembayaran fleksibel & ringan.</p>
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Kajian Kitab Kuning & Kontemporer",
                                        "Kamar AC & WiFi High Speed",
                                        "Mentoring Riset & Akademik",
                                        "Program Tahfidz Fleksibel"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-white text-sm font-medium">
                                            <div className="p-0.5 rounded-full bg-accent-gold/20 text-accent-gold">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    <Button
                                        onClick={() => navigate('/psb/register?type=mahasiswa')}
                                        className="w-full py-5 rounded-full bg-accent-gold hover:bg-gold-400 text-navy-950 font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-gold-900/10"
                                    >
                                        Daftar Mahasantri
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Beasiswa Yatim */}
                        <div className="group rounded-[2.5rem] p-8 border border-slate-100 bg-white hover:border-accent-gold transition-all duration-300 flex flex-col relative overflow-hidden order-3 lg:order-3 h-full shadow-lg">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-paper text-slate-600 flex items-center justify-center">
                                    <HeartHandshake className="w-7 h-7" />
                                </div>
                                <span className="text-slate-600 font-bold text-[10px] bg-paper px-3 py-1 rounded-full uppercase tracking-wider">Sosial</span>
                            </div>

                            <h3 className="text-2xl font-display font-bold text-navy-950 mb-2">Beasiswa Kader</h3>
                            <p className="text-slate-500 mb-8 text-sm font-light leading-relaxed">
                                Program khusus Yatim & Dhuafa berprestasi. Seleksi ketat untuk mencetak kader ulama masa depan.
                            </p>

                            <div className="bg-paper rounded-2xl p-6 border border-slate-100 mb-8">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Beasiswa Penuh</p>
                                <p className="text-3xl font-display font-bold text-navy-950">Gratis 100%</p>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">*Wajib lolos seleksi & survey</p>
                            </div>

                            <ul className="space-y-4 mb-10">
                                {[
                                    "Asrama & Makan Gratis",
                                    "Biaya Sekolah Formal Ditanggung",
                                    "Pembinaan Intensif 24 Jam",
                                    "Wajib Pengabdian (Khidmah)"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600 text-sm font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-accent-gold shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                <Button
                                    onClick={() => navigate('/psb/register?type=scholarship')}
                                    className="w-full py-4 rounded-full border border-slate-300 text-slate-500 hover:border-navy-900 hover:text-navy-900 font-bold text-sm uppercase tracking-widest transition-all"
                                >
                                    Ajukan Seleksi
                                </Button>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    <div>
                        <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Pusat Informasi</span>
                        <h2 className="text-4xl font-display text-royal-900 mb-8">Pertanyaan Umum</h2>

                        <div className="space-y-8">
                            <p className="text-stone-500 leading-relaxed text-lg font-light">
                                Proses seleksi di Al-Bisri mengutamakan transparansi dan objektivitas untuk menjaring bibit unggul.
                            </p>

                            <div className="p-8 rounded-[2.5rem] bg-royal-900 text-white relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                                <div className="relative z-10 flex flex-col items-start">
                                    <h4 className="font-display font-bold text-xl mb-2">Butuh Bantuan Pendaftaran?</h4>
                                    <p className="text-royal-200 mb-8 font-light text-sm">Tim panitia kami siap memandu Anda langkah demi langkah.</p>
                                    <Button className="rounded-full border border-white/20 text-white hover:bg-white hover:text-royal-950 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all">
                                        Chat Panitia WA
                                    </Button>
                                </div>
                                <MessageCircle className="absolute -bottom-6 -right-6 w-40 h-40 text-white opacity-5 group-hover:scale-110 transition duration-700" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-stone-50 p-8 md:p-12 rounded-[3rem] border border-stone-100">
                        <Accordion items={faqs} />
                    </div>
                </div>
            </section>

            {/* CTA Footer - Luxury */}
            <section className="py-24 bg-navy-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-display mb-8 leading-tight">Siap Menjadi Bagian Keluarga <br /> <span className="text-accent-gold italic font-serif">Al-Bisri?</span></h2>
                    <p className="text-slate-200 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
                        Segera daftarkan putra-putri Anda sebelum kuota terpenuhi. Masa depan gemilang dimulai dari pendidikan yang tepat.
                    </p>
                    <Button
                        onClick={() => navigate('/psb/register')}
                        className="bg-accent-gold hover:bg-white hover:text-navy-950 text-navy-950 font-bold px-12 py-6 rounded-full text-sm uppercase tracking-widest shadow-2xl shadow-gold-500/20 hover:scale-105 transition-all duration-300"
                    >
                        Daftar Sekarang
                    </Button>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default PSBPage;
