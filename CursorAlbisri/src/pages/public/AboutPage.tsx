import { MainLayout } from "@/components/layout/MainLayout";
import { AboutSection } from "@/components/sections/AboutSection";
import { Helmet } from "react-helmet";
import { Calendar, Users, Award, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
    const milestones = [
        { year: "2010", title: "Pendirian Pesantren", desc: "Dimulai dari sebuah rumah sederhana dengan 5 orang santri." },
        { year: "2015", title: "Peresmian Gedung Utama", desc: "Pembangunan asrama putra dan ruang kelas permanen." },
        { year: "2018", title: "Pembukaan Program Beasiswa", desc: "Program khusus untuk yatim dan dhuafa berprestasi." },
        { year: "2023", title: "Ekspansi Digital", desc: "Peluncuran e-Maktab dan sistem pembelajaran hybrid." },
    ];

    const leaders = [
        { name: "KH. Ahmad Dahlan", role: "Pengasuh Pesantren", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200" },
        { name: "Ustadz H. Abdullah", role: "Kepala Kurikulum", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" },
        { name: "Ustadzah Fatimah", role: "Kepala Kesantrian Putri", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" },
    ];

    return (
        <MainLayout>
            <Helmet>
                <title>Profil & Sejarah | Pesantren An-Nur</title>
                <meta name="description" content="Mengenal lebih dekat sejarah, visi, misi, dan pimpinan Pesantren Mahasiswa An-Nur." />
            </Helmet>

            {/* Hero */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80')] bg-cover bg-center fixed-bg" />
                <div className="absolute inset-0 bg-slate-900/70" />
                <div className="container-section relative z-10 text-center text-white">
                    <Badge className="mb-6 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-none px-4 py-1.5 uppercase tracking-widest text-xs">
                        Profil Pesantren
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">Mengenal An-Nur Lebih Dekat</h1>
                    <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-light leading-relaxed">
                        Lebih dari sekadar tempat belajar, ini adalah rumah bagi tumbuh kembangnya karakter, ilmu, dan amal shaleh.
                    </p>
                </div>
            </section>

            {/* Use Existing AboutSection for Visi Misi */}
            <AboutSection />

            {/* History Timeline */}
            <section className="py-24 bg-slate-50">
                <div className="container-section">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Milestone Sejarah</h2>
                        <p className="text-slate-600">Perjalanan panjang kami dalam membersamai umat</p>
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-4 md:mx-auto md:max-w-3xl space-y-12">
                        {milestones.map((item, idx) => (
                            <div key={idx} className="relative pl-8 md:pl-0">
                                <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                                <div className="md:grid md:grid-cols-5 md:gap-8 items-start group">
                                    <div className="md:col-span-1 md:text-right mb-2 md:mb-0">
                                        <span className="text-2xl font-bold text-primary opacity-50 group-hover:opacity-100 transition-opacity font-heading">{item.year}</span>
                                    </div>
                                    <div className="md:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                        <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leadership */}
            <section className="py-24 bg-white">
                <div className="container-section">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Pimpinan & Pengasuh</h2>
                        <p className="text-slate-600">Para asatidz yang mendedikasikan ilmunya untuk santri</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {leaders.map((leader, idx) => (
                            <div key={idx} className="group text-center">
                                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-slate-50 shadow-lg mb-6 group-hover:scale-105 transition-transform duration-300">
                                    {/* Fallback avatar if image fails */}
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 bg-cover bg-center" style={{ backgroundImage: `url(${leader.img})` }}>
                                    </div>
                                </div>
                                <h3 className="text-xl font-heading font-bold text-slate-900 mb-1">{leader.name}</h3>
                                <p className="text-primary font-medium text-sm">{leader.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics */}
            <section className="py-20 bg-slate-900 text-white">
                <div className="container-section">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { icon: Users, label: "Santri Aktif", val: "500+" },
                            { icon: BookOpen, label: "Hafizh Quran", val: "120+" },
                            { icon: Award, label: "Penghargaan", val: "45" },
                            { icon: Calendar, label: "Tahun Mengabdi", val: "15" },
                        ].map((stat, idx) => (
                            <div key={idx} className="space-y-4">
                                <stat.icon className="w-8 h-8 mx-auto text-amber-500 opacity-80" />
                                <div className="text-4xl font-heading font-bold">{stat.val}</div>
                                <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
