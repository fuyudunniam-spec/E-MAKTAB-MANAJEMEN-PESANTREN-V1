import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { CheckCircle2, ArrowRight, Clock, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const SCHEDULE = [
    { time: '03.30', label: 'Tahajjud & Subuh Berjamaah', category: 'ibadah' },
    { time: '05.00', label: 'Tahsin & Setoran Hafalan', category: 'diniyah' },
    { time: '06.30', label: 'Sarapan & Persiapan', category: 'umum' },
    { time: '07.00', label: 'Sekolah / Kuliah', category: 'formal' },
    { time: '13.00', label: 'Dzuhur Berjamaah & Makan Siang', category: 'ibadah' },
    { time: '14.00', label: 'Madrasah Diniyah (Kitab Kuning)', category: 'diniyah' },
    { time: '17.00', label: 'Ashar Berjamaah & Olahraga', category: 'ibadah' },
    { time: '18.15', label: 'Maghrib & Kajian Qur\'an', category: 'diniyah' },
    { time: '19.30', label: 'Isya & Belajar Mandiri / Ekstra', category: 'formal' },
    { time: '22.00', label: 'Istirahat', category: 'umum' },
];

const CAT_STYLES: any = {
    ibadah: 'bg-[#c09c53]/10 text-[#c09c53] border-[#c09c53]/20',
    diniyah: 'bg-[#0f172a]/10 text-[#0f172a] border-[#0f172a]/10',
    formal: 'bg-blue-50 text-blue-700 border-blue-100',
    umum: 'bg-slate-100 text-slate-500 border-slate-100',
};

const PublicProgramPage: React.FC = () => {
    const { data: psbData, isLoading } = useQuery({
        queryKey: ['psbPage'],
        queryFn: SanityService.getPsbPageData
    });

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const programs = psbData?.programs || [];

    return (
        <div className="min-h-screen bg-[#fafafa] font-jakarta">
            <PublicNavbar />

            {/* ── HERO ── */}
            <header className="pt-24 lg:pt-32 pb-16 px-6 bg-white text-center">
                <div className="max-w-4xl mx-auto animate-fade-in-up">
                    <h4 className="text-[#c09c53] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Program &amp; Layanan</h4>
                    <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-serif text-[#0f172a] leading-[1.1] mb-8 tracking-tight">
                        Sinergi Pembinaan,<br />
                        <span className="italic text-slate-400 font-light">Merajut Masa Depan.</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-3xl mx-auto leading-relaxed font-light mb-12">
                        Kami hadir untuk memberikan solusi pendidikan yang utuh. Menjamin pengasuhan dan adab di dalam pesantren, sekaligus memberikan beasiswa penuh untuk pendidikan formal di sekolah-sekolah mitra pilihan.
                    </p>
                </div>
            </header>

            {/* ── PILAR 1: DINIYAH & TAHFIDZ ── */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative order-2 lg:order-1">
                        <div className="absolute -top-4 -left-4 w-full h-full border border-[#c09c53]/20 pointer-events-none" />
                        <div className="overflow-hidden aspect-[4/3] bg-slate-100">
                            <img src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop" alt="Diniyah" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 block">Pilar Pertama</span>
                        <h2 className="text-4xl font-serif text-[#0f172a] mb-6 leading-tight">Pendidikan Diniyah<br /><span className="italic text-slate-300 font-normal">& Tahfidz Al-Qur'an</span></h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            Madrasah Diniyah Al-Bisri mengajarkan kitab-kitab klasik ahlussunnah—dari Fiqh, Aqidah, hingga Tasawuf—dengan sanad keilmuan yang terjaga. Program Tahfidz yang fleksibel memungkinkan santri menghafal Al-Qur'an tanpa harus merobohkan jadwal akademik formal.
                        </p>
                        <ul className="space-y-3 mb-8">
                            {['Kajian Kitab Kuning (Fiqh, Aqidah, Tasawuf)', 'Program Tahsin & Tahfidz bersanad', 'Bahasa Arab aktif & komunikasi', 'Mentoring langsung dari Asatidz berpengalaman'].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-[#c09c53] shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Link to="/psb" className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#0f172a] border-b border-[#0f172a]/20 pb-1 hover:border-[#c09c53] hover:text-[#c09c53] transition-colors">
                            Informasi Pendaftaran <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── PILAR 2: BEASISWA SEKOLAH ── */}
            <section className="py-24 px-6 bg-[#fafafa]">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 block">Pilar Kedua</span>
                        <h2 className="text-4xl font-serif text-[#0f172a] mb-6 leading-tight">Beasiswa<br /><span className="italic text-slate-300 font-normal">Sekolah Formal</span></h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            Bagi santri yatim dan dhuafa, Al-Bisri menjamin seluruh biaya pendidikan formal—dari SD hingga SMA—melalui kemitraan dengan sekolah-sekolah terpilih di sekitar pesantren. Antar-jemput harian disediakan agar santri dapat fokus belajar.
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            {[{ v: '5+', l: 'Sekolah Mitra' }, { v: '100%', l: 'Biaya Ditanggung' }, { v: 'SD–SMA', l: 'Semua Jenjang' }].map((s, i) => (
                                <div key={i} className="bg-white border border-slate-100 p-5 text-center">
                                    <p className="text-2xl font-serif text-[#c09c53] mb-1">{s.v}</p>
                                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -top-4 -right-4 w-full h-full border border-[#c09c53]/20 pointer-events-none" />
                        <div className="overflow-hidden aspect-[4/3] bg-slate-100">
                            <img src="https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1000&auto=format&fit=crop" alt="Sekolah Formal" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PILAR 3: ASRAMA (from Sanity programs, or static) ── */}
            <section className="py-24 px-6 bg-[#0f172a] text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 block">Pilar Ketiga</span>
                        <h2 className="text-4xl font-serif leading-tight">Asrama &<br /><span className="italic text-slate-400 font-normal">Pengasuhan Santri</span></h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(programs.length > 0 ? programs : [
                            { title: 'Santri Yatim Reguler', description: 'Asrama & makan 3x sehari, antar-jemput sekolah mitra, laundry, dan layanan kesehatan dasar.', price: 'Gratis 100%', paymentPeriod: '' },
                            { title: 'Santri Berbayar', description: 'Fasilitas setara dengan subsidi silang dari yayasan. Termasuk semua layanan asrama dan diniyah.', price: 'Rp 850rb', paymentPeriod: '/bln' },
                        ]).map((p: any, i: number) => (
                            <div key={i} className="border border-white/10 p-8 hover:border-[#c09c53]/40 hover:bg-white/5 transition-all duration-300 group">
                                <h3 className="font-serif text-xl mb-3">{p.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">{p.description}</p>
                                <div className="border-t border-white/10 pt-5 flex items-baseline gap-1">
                                    <span className="font-serif text-[#c09c53] text-2xl">{p.price}</span>
                                    <span className="text-slate-500 text-xs">{p.paymentPeriod}</span>
                                </div>
                            </div>
                        ))}
                        {/* Pesantren Mahasiswa card */}
                        <div className="border border-[#c09c53]/30 bg-[#c09c53]/5 p-8 group">
                            <span className="text-[9px] font-bold text-[#c09c53] uppercase tracking-widest mb-3 block">Spesial</span>
                            <h3 className="font-serif text-xl mb-3">Pesantren Mahasiswa</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">Hunian strategis & edukatif untuk mahasantri. WiFi high speed, AC, co-working area, dan kajian turats mendalam.</p>
                            <div className="border-t border-[#c09c53]/20 pt-5 flex items-baseline gap-1">
                                <span className="font-serif text-[#c09c53] text-2xl">Rp 650rb</span>
                                <span className="text-slate-500 text-xs">/bln</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── JADWAL AKTIVITAS ── */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[9px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 block">Rutinitas Harian</span>
                        <h2 className="text-4xl font-serif text-[#0f172a]">Jadwal Aktivitas Santri</h2>
                        <p className="text-slate-400 text-sm mt-4 font-light">Setiap hari terstruktur untuk membangun kebiasaan, disiplin, dan cinta ilmu.</p>
                    </div>

                    <div className="space-y-0">
                        {SCHEDULE.map((item, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-12 gap-4 items-center group border-b border-slate-50 py-4 hover:bg-[#fafafa] transition-colors px-2"
                            >
                                <div className="col-span-2 flex items-center gap-2">
                                    {i < 2 || i === 9 ? <Moon className="w-3.5 h-3.5 text-[#c09c53]/60" /> : <Sun className="w-3.5 h-3.5 text-[#c09c53]/40" />}
                                    <span className="font-mono text-sm font-bold text-slate-400">{item.time}</span>
                                </div>
                                <div className="col-span-8">
                                    <span className="text-sm text-[#0f172a] font-medium">{item.label}</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className={`inline-block text-[8px] font-bold uppercase tracking-wider border px-2 py-0.5 ${CAT_STYLES[item.category]}`}>
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-6 bg-[#0f172a] text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
                <div className="max-w-2xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-5xl font-serif mb-6">Bergabung Bersama Kami</h2>
                    <p className="text-slate-300 mb-10 font-light text-lg">Daftarkan diri sekarang atau dukung program kami melalui donasi.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/psb" className="bg-[#c09c53] text-[#0f172a] px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#b08a42] transition-colors inline-flex items-center gap-2 justify-center">
                            Daftar Sekarang <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/donasi" className="border border-white/20 text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors inline-flex items-center justify-center">
                            Donasi Program
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default PublicProgramPage;
