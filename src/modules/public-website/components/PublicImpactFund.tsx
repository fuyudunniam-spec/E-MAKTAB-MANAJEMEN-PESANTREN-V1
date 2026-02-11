import React from 'react';
import { BarChart2, GraduationCap, Sprout, Loader2, BookOpen, Home, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
// Removed: PieChart, Pie, Cell, ResponsiveContainer, LegendRef, useQuery, getPublicImpactData


const PublicImpactFund: React.FC = () => {
  // Hardcoded pillars as requested
  const pillars = [
    {
      id: 1,
      title: "Pendidikan Formal",
      icon: <GraduationCap className="w-8 h-8 text-gold-400" />,
      desc: "Memfasilitasi akses pendidikan formal (SD - SMA) melalui beasiswa penuh bagi santri yatim dan dhuafa.",
      stats: "Beasiswa Penuh"
    },
    {
      id: 2,
      title: "Pendidikan Pesantren",
      icon: <BookOpen className="w-8 h-8 text-gold-400" />,
      desc: "Kurikulum Diniyah, Tahfidz Al-Qur'an, dan kajian Kitab Kuning (Turats).",
      stats: "Kurikulum Al-Azhar"
    },
    {
      id: 3,
      title: "Asrama & Konsumsi",
      icon: <Home className="w-8 h-8 text-gold-400" />,
      desc: "Menjamin tempat tinggal layak, makan bergizi, dan kesejahteraan harian santri.",
      stats: "Layanan 24 Jam"
    },
    {
      id: 4,
      title: "Operasional Yayasan",
      icon: <Briefcase className="w-8 h-8 text-gold-400" />,
      desc: "Dukungan manajemen profesional untuk keberlanjutan takmir dan layanan umat.",
      stats: "Manajemen Modern"
    }
  ];

  return (
    <section id="impact" className="py-32 relative bg-royal-900 text-white rounded-t-[4rem] -mt-10 z-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-3xl">
            <span className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-3 block">Realisasi Layanan & Impact Funding</span>
            <h2 className="text-4xl md:text-5xl font-display text-white mb-6">Pilar Layanan Pesantren</h2>
            <p className="text-royal-200 font-light text-lg leading-relaxed">
              Mewujudkan transparansi melalui dampak nyata. Setiap rupiah wakaf Anda dikonversi menjadi layanan pendidikan dan pengasuhan terbaik bagi yatim penghafal Qur'an.
            </p>
          </div>
          <div>
            <Link to="/transparansi" className="px-8 py-4 border border-white/20 text-white text-sm hover:bg-gold-500 hover:border-gold-500 hover:text-royal-900 transition-all duration-300 flex items-center gap-3 uppercase tracking-wider rounded-full font-bold group shadow-lg hover:shadow-gold-500/20">
              <BarChart2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Laporan Detail</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item) => (
            <div key={item.id} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2rem] overflow-hidden hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl group-hover:bg-gold-500/20 transition-all duration-500"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-royal-800/50 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  {item.icon}
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-gold-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-royal-200/80 text-sm leading-relaxed mb-8 min-h-[60px]">
                  {item.desc}
                </p>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold-500">Impact</span>
                  <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">{item.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom decoration or additional info */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left opacity-60 hover:opacity-100 transition-opacity duration-500">
          <p className="text-sm text-royal-200 uppercase tracking-widest font-bold">Didukung Sistem Manajemen Terintegrasi</p>
          <div className="h-px w-20 bg-gold-500/50 hidden md:block"></div>
          <p className="text-sm text-royal-200 uppercase tracking-widest font-bold">Audit Berkala Independen</p>
        </div>
      </div>
    </section>
  );
};

export default PublicImpactFund;
