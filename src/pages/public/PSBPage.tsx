import React from 'react';
import { PSBLayout } from "@/components/layout/PSBLayout";
import { Helmet } from "react-helmet";
import {
    Crown,
    HeartHandshake,
    Coins,
    FileCheck,
    ArrowRight,
    ShieldCheck,
    Calendar,
    Users,
    Info,
    Sparkles,
    BookOpen,
    Home,
    MessageCircle,
    MapPin,
    Phone,
    ChevronRight,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const PSBPage = () => {
    const navigate = useNavigate();

    const stats = [
        { label: "Pendaftar", value: "500+", icon: Users },
        { label: "Kuota", value: "150", icon: Crown },
        { label: "Cabang", value: "3", icon: ShieldCheck },
    ];

    const advantages = [
        {
            title: "Kurikulum Terpadu",
            desc: "Integrasi kurikulum pesantren modern dengan Tahfidzul Qur'an yang terukur.",
            icon: BookOpen,
            color: "bg-royal-50 text-royal-600"
        },
        {
            title: "Fasilitas Modern",
            desc: "Dukungan fasilitas asrama, laboratorium, dan area olahraga yang representatif.",
            icon: Home,
            color: "bg-gold-50 text-gold-600"
        },
        {
            title: "Pembinaan Karakter",
            desc: "Lingkungan 24 jam yang membentuk disiplin dan akhlakul karimah santri.",
            icon: Sparkles,
            color: "bg-royal-100 text-royal-700"
        },
        {
            title: "Ekstrakurikuler",
            desc: "Pengembangan minat bakat melalui memanah, seni islami, dan olahraga sunnah.",
            icon: Crown,
            color: "bg-gold-100 text-gold-700"
        }
    ];

    const faqs = [
        {
            q: "Kapan periode pendaftaran Gelombang 1 ditutup?",
            a: "Pendaftaran Gelombang 1 dibuka mulai Januari 2026 hingga Maret 2026. Namun, pendaftaran akan ditutup lebih awal jika kuota sudah terpenuhi."
        },
        {
            q: "Apakah ada tes seleksi untuk masuk?",
            a: "Ya, setiap pendaftar akan mengikuti tes seleksi meliputi baca tulis Al-Qur'an, tes akademik dasar, dan wawancara orang tua."
        },
        {
            q: "Bagaimana cara melakukan pembayaran pendaftaran?",
            a: "Untuk jalur Reguler, pembayaran dapat dilakukan melalui transfer bank yang detailnya akan muncul di portal pendaftar setelah Anda membuat akun."
        },
        {
            q: "Apakah santri diwajibkan untuk mukim (tinggal di asrama)?",
            a: "Sistem utama pendaftaran kami adalah mukim (asrama) penuh untuk memastikan pembinaan intensif 24 jam."
        }
    ];

    return (
        <PSBLayout>
            <Helmet>
                <title>Penerimaan Santri Baru | Pesantren Al-Bisri</title>
                <meta name="description" content="Pendaftaran santri baru Pesantren Al-Bisri tahun ajaran 2026/2027." />
            </Helmet>

            <div className="bg-paper min-h-screen font-body text-stone-800">
                {/* Hero Section */}
                <section className="relative pt-32 pb-24 overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230c4a6e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>

                    <div className="container-section relative z-10 px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-royal-50 border border-royal-100 mb-8 animate-fade-in">
                                <Crown className="w-4 h-4 text-royal-600" />
                                <span className="text-xs font-bold text-royal-800 uppercase tracking-widest">Tahun Ajaran 2026/2027</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-display font-medium text-royal-950 mb-8 leading-tight">
                                Membangun Generasi <br />
                                <span className="text-gold-500 italic">Rabbani</span> yang Beradab
                            </h1>
                            
                            <p className="text-xl text-stone-600 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
                                Bergabunglah bersama ekosistem pendidikan Pesantren Al-Bisri. Memadukan tradisi keilmuan Islam dengan kompetensi modern.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={() => navigate('/psb/register')}
                                    className="bg-royal-900 hover:bg-royal-800 text-white font-bold px-10 py-7 rounded-full text-lg transition-all shadow-xl shadow-royal-900/20 active:scale-95"
                                >
                                    Daftar Sekarang
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/psb/auth')}
                                    className="border-stone-300 text-stone-600 hover:bg-stone-50 hover:border-royal-200 px-10 py-7 rounded-full text-lg bg-white"
                                >
                                    Masuk Portal
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section - Floating Cards */}
                <section className="py-12 container-section px-6 -mt-10 relative z-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {stats.map((stat, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-xl shadow-stone-200/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                                <div className="p-4 rounded-2xl bg-royal-50 text-royal-600 mb-4">
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <p className="text-4xl font-display font-bold text-royal-900 mb-1">{stat.value}</p>
                                <p className="text-sm text-stone-500 font-bold uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Programs / Advantages */}
                <section className="py-24 container-section px-6">
                    <div className="text-center mb-20">
                        <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Keunggulan Kami</span>
                        <h2 className="text-4xl md:text-5xl font-display text-royal-950 mb-6">Kenapa Memilih Al-Bisri?</h2>
                        <div className="h-1 w-20 bg-gold-400 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {advantages.map((adv, i) => (
                            <div key={i} className="group p-10 rounded-[3rem] bg-white border border-stone-100 shadow-lg hover:shadow-2xl hover:border-gold-200 transition-all duration-500">
                                <div className={`w-16 h-16 rounded-[1.5rem] ${adv.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    <adv.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-display font-bold text-royal-900 mb-4">{adv.title}</h3>
                                <p className="text-stone-500 leading-relaxed font-medium">{adv.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Jalur Pendaftaran (Cards Style) */}
                <section className="py-24 bg-white rounded-[4rem] mx-4 md:mx-10 shadow-sm border border-stone-100 relative overflow-hidden">
                     {/* Background Pattern */}
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-royal-900 via-gold-400 to-royal-900"></div>
                     
                    <div className="container-section px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-display text-royal-950 mb-6">Jalur Pendaftaran</h2>
                            <p className="text-stone-500 max-w-2xl mx-auto text-lg">Pilih jalur yang sesuai dengan kualifikasi dan kebutuhan pendidikan putra-putri Anda.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {/* Jalur Reguler */}
                            <div className="group rounded-[3rem] p-10 border-2 border-stone-100 hover:border-gold-400 transition-all duration-300 bg-[#FAFAF9] flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Coins className="w-64 h-64 text-royal-900" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-royal-100 text-royal-800 flex items-center justify-center">
                                            <Crown className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-display font-bold text-royal-950">Reguler</h3>
                                            <span className="text-royal-600 font-bold text-sm bg-royal-50 px-3 py-1 rounded-full mt-2 inline-block">Mandiri</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-stone-600 mb-8 leading-relaxed text-lg">
                                        Program pendidikan standar pesantren dengan pembiayaan mandiri. Fasilitas lengkap dan kurikulum terpadu.
                                    </p>

                                    <ul className="space-y-4 mb-10">
                                        {[
                                            "Asrama & Fasilitas Standar",
                                            "Makan 3x Sehari",
                                            "Ekstrakurikuler Pilihan",
                                            "Program Tahfidz Reguler"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-royal-800 font-medium">
                                                <CheckCircle2 className="w-5 h-5 text-gold-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            onClick={() => navigate('/psb/register')}
                                            className="w-full py-7 rounded-full bg-white border-2 border-royal-900 text-royal-900 hover:bg-royal-900 hover:text-white font-bold text-lg transition-all"
                                        >
                                            Daftar Reguler
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Jalur Beasiswa */}
                            <div className="group rounded-[3rem] p-10 border-2 border-royal-900 bg-royal-900 text-white flex flex-col relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <HeartHandshake className="w-64 h-64 text-gold-500" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-gold-500 text-royal-950 flex items-center justify-center">
                                            <HeartHandshake className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-display font-bold text-white">Beasiswa</h3>
                                            <span className="text-royal-900 font-bold text-sm bg-gold-500 px-3 py-1 rounded-full mt-2 inline-block">Full Funded</span>
                                        </div>
                                    </div>

                                    <p className="text-royal-200 mb-8 leading-relaxed text-lg">
                                        Khusus untuk Yatim & Dhuafa berprestasi. Bebas biaya pendidikan sepenuhnya dengan seleksi ketat.
                                    </p>

                                    <ul className="space-y-4 mb-10">
                                        {[
                                            "Gratis Biaya Pendidikan 100%",
                                            "Prioritas Program Tahfidz",
                                            "Pembinaan Intensif Khusus",
                                            "Wajib Pengabdian (Khidmah)"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-white font-medium">
                                                <div className="p-1 rounded-full bg-gold-500/20">
                                                    <CheckCircle2 className="w-4 h-4 text-gold-400" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-auto">
                                        <Button
                                            onClick={() => navigate('/psb/register')}
                                            className="w-full py-7 rounded-full bg-gold-500 hover:bg-gold-600 text-royal-950 font-bold text-lg transition-all shadow-lg shadow-gold-500/20"
                                        >
                                            Ajukan Beasiswa
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-24 container-section px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div>
                            <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Informasi Umum</span>
                            <h2 className="text-4xl font-display text-royal-950 mb-8">Pertanyaan yang Sering Diajukan</h2>
                            
                            <div className="space-y-6">
                                <p className="text-stone-600 leading-relaxed text-lg">
                                    Kami telah merangkum beberapa pertanyaan umum untuk membantu Anda memahami proses pendaftaran di Pesantren Al-Bisri.
                                </p>
                                
                                <div className="p-8 rounded-[2rem] bg-royal-900 text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h4 className="font-display font-bold text-xl mb-2">Butuh Bantuan Lain?</h4>
                                        <p className="text-royal-200 mb-6">Tim panitia kami siap membantu Anda.</p>
                                        <Button variant="outline" className="rounded-full border-royal-700 text-white hover:bg-royal-800 hover:text-white bg-transparent">
                                            Hubungi WhatsApp
                                        </Button>
                                    </div>
                                    <MessageCircle className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-5" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100">
                            <Accordion type="single" collapsible className="w-full space-y-4">
                                {faqs.map((faq, i) => (
                                    <AccordionItem key={i} value={`item-${i}`} className="border-b border-stone-100 last:border-0 px-2">
                                        <AccordionTrigger className="hover:no-underline font-display font-bold text-royal-900 text-lg text-left py-4">
                                            {faq.q}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-stone-500 font-medium pb-4 leading-relaxed text-base">
                                            {faq.a}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="py-20 bg-royal-950 text-white rounded-t-[4rem] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    
                    <div className="container-section px-6 text-center relative z-10">
                        <h2 className="text-4xl md:text-6xl font-display mb-8">Siap Menjadi Bagian Keluarga <br/> <span className="text-gold-500">Al-Bisri?</span></h2>
                        <p className="text-royal-200 text-xl max-w-2xl mx-auto mb-12 font-light">
                            Segera daftarkan putra-putri Anda sebelum kuota terpenuhi. Masa depan gemilang dimulai dari pendidikan yang tepat.
                        </p>
                        <Button
                            onClick={() => navigate('/psb/register')}
                            className="bg-gold-500 hover:bg-gold-600 text-royal-950 font-bold px-12 py-8 rounded-full text-xl shadow-2xl shadow-gold-500/20 hover:scale-105 transition-transform"
                        >
                            Daftar Sekarang
                        </Button>
                    </div>
                </section>
            </div>
        </PSBLayout>
    );
};

export default PSBPage;
