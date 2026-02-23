import React from 'react';
import { Home, BookMarked, GraduationCap, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PublicServicesProps {
    data?: any[];
}

const STATIC_SERVICES = [
    {
        icon: Home,
        title: 'Asrama & Pangan',
        desc: 'Tempat tinggal yang layak dan makan bergizi tiga kali sehari untuk setiap santri yatim.',
        impactText: 'Aktif',
    },
    {
        icon: BookMarked,
        title: 'Diniyah & Tahfidz',
        desc: 'Kurikulum salaf: kajian kitab kuning, tahsin, dan program hafal Al-Qur\'an dengan sanad terpercaya.',
        impactText: 'Rutin',
    },
    {
        icon: GraduationCap,
        title: 'Pendidikan Formal',
        desc: 'Antar-jemput ke sekolah formal mitra terpilih, pengawalan akademik, dan subsidi biaya sekolah.',
        impactText: 'Mitra 5+',
    },
    {
        icon: Building,
        title: 'Operasional Khidmah',
        desc: 'Pemeliharaan fasilitas, kegiatan organisasi santri, dan program pengembangan karakter kepemimpinan.',
        impactText: 'Berkelanjutan',
    },
];

const PublicServices: React.FC<PublicServicesProps> = ({ data }) => {
    const services = (data && data.length > 0)
        ? data.map((s: any) => ({
            icon: STATIC_SERVICES.find(st => st.title.toLowerCase().includes(s.title?.toLowerCase().split(' ')[0]?.toLowerCase()))?.icon || Home,
            title: s.title,
            desc: s.description,
            impactText: s.impactText || 'Aktif',
        }))
        : STATIC_SERVICES;

    return (
        <section id="transparansi" className="py-24 bg-[#fafafa]">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">
                        Empat Pilar Pelayanan
                    </h4>
                    <h2 className="text-3xl md:text-4xl font-serif text-[#0f172a] leading-tight">
                        Fokus Penyaluran Amanah
                    </h2>
                    <p className="text-slate-500 mt-4 text-sm leading-relaxed">
                        Setiap rupiah yang Anda amanahkan dikanalkan ke empat pilar layanan utama yang terukur dan transparan.
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {services.map((s: any, i: number) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={i}
                                className="bg-white p-8 border border-slate-200 hover:border-[#0f172a] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                            >
                                <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-[#0f172a] transition-colors duration-300">
                                    <Icon className="w-5 h-5 text-[#0f172a] group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-[11px] font-bold text-[#0f172a] uppercase tracking-widest mb-3 leading-relaxed">
                                    {s.title}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                                    {s.desc}
                                </p>
                                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-[#c09c53] uppercase tracking-widest">
                                        Status
                                    </span>
                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-3 py-1">
                                        {s.impactText}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <Link
                        to="/transparansi"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-[#0f172a] transition-colors border-b border-slate-200 pb-1"
                    >
                        Lihat Laporan Transparansi
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default PublicServices;
