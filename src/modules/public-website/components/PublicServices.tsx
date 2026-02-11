import React from 'react';
import { GraduationCap, BookOpen, Home, Briefcase } from 'lucide-react';

const PublicServices: React.FC = () => {
    const services = [
        {
            icon: GraduationCap,
            title: "Pendidikan Formal",
            desc: "Memfasilitasi akses pendidikan formal (SD - SMA) melalui beasiswa penuh bagi santri yatim dan dhuafa.",
            impact: "Beasiswa Penuh"
        },
        {
            icon: BookOpen,
            title: "Pendidikan Pesantren",
            desc: "Kurikulum Diniyah, Tahfidz Al-Qur'an, dan kajian Kitab Kuning (Turats) bersanad.",
            impact: "Kurikulum Al-Azhar"
        },
        {
            icon: Home,
            title: "Asrama & Konsumsi",
            desc: "Menjamin tempat tinggal layak, makan bergizi, dan kesejahteraan harian santri.",
            impact: "Layanan 24 Jam"
        },
        {
            icon: Briefcase,
            title: "Operasional Yayasan",
            desc: "Dukungan manajemen profesional untuk keberlanjutan takmir dan layanan umat.",
            impact: "Manajemen Modern"
        }
    ];

    return (
        <section id="transparansi" className="py-24 lg:py-32 px-6 lg:px-10 bg-navy-950 text-white relative border-t border-white/5">
            <div className="max-w-7xl mx-auto relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 lg:mb-20 gap-8 animate-fade-in">
                    <div className="max-w-2xl">
                        <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Realisasi Layanan</span>
                        <h2 className="font-playfair text-4xl lg:text-6xl leading-tight mb-6">Pilar Layanan Pesantren</h2>
                        <p className="text-slate-400 font-light text-base lg:text-lg">
                            Setiap rupiah wakaf Anda dikonversi menjadi layanan pendidikan dan pengasuhan terbaik bagi yatim penghafal Qur'an.
                        </p>
                    </div>
                    <button className="hidden lg:block btn-luxury px-8 py-4 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-navy-950 hover:border-white transition-all">
                        Laporan Detail
                    </button>
                </div>

                {/* Cards Container (Slider on Mobile, Grid on Desktop) */}
                <div className="mobile-slider lg:grid-cols-4 lg:gap-6 animate-slide-in">

                    {services.map((service, index) => (
                        <div key={index} className="p-8 rounded-2xl flex flex-col h-full min-h-[320px] lg:min-h-0 border border-white/5 bg-white/5 hover:bg-white/10 transition-colors duration-300">
                            <div className="w-12 h-12 text-accent-gold mb-6 border border-accent-gold/30 rounded-lg flex items-center justify-center">
                                <service.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-playfair text-xl mb-4">{service.title}</h3>
                            <p className="text-slate-400 text-xs leading-relaxed mb-auto">
                                {service.desc}
                            </p>
                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">Impact</span>
                                <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full">{service.impact}</span>
                            </div>
                        </div>
                    ))}

                </div>

                {/* Mobile Report Button */}
                <div className="mt-8 flex justify-center lg:hidden">
                    <button className="btn-luxury px-8 py-4 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-navy-950 hover:border-white transition-all">
                        Laporan Detail
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PublicServices;
