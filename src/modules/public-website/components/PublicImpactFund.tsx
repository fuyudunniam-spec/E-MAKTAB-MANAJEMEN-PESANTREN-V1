import React from 'react';
import { BarChart2, GraduationCap, Sprout, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicImpactData } from '../services/publicKeuangan.service';

const PublicImpactFund: React.FC = () => {
  const { data: impactData, isLoading } = useQuery({
    queryKey: ['public-impact-data'],
    queryFn: getPublicImpactData
  });

  const formatNumber = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  if (isLoading) {
    return (
      <section className="py-32 bg-royal-900 text-white rounded-t-[4rem] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </section>
    );
  }

  return (
    <section id="impact" className="py-32 relative bg-royal-900 text-white rounded-t-[4rem] -mt-10 z-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-3 block">Transparansi Dana Wakaf</span>
            <h2 className="text-4xl md:text-5xl font-display text-white mb-4">Laporan Penyaluran</h2>
            <p className="text-royal-200 font-light text-lg">Melihat langsung bagaimana donasi Anda menjadi "darah" bagi pendidikan anak yatim.</p>
          </div>
          <div>
            <Link to="/transparansi" className="px-8 py-3 border border-white/20 text-white text-sm hover:bg-white hover:text-royal-900 transition flex items-center gap-2 uppercase tracking-wider rounded-full font-bold">
              <BarChart2 className="w-4 h-4" /> Detail Transparansi
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-panel-dark p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/20 rounded-full blur-2xl"></div>
            <h3 className="text-xl font-display font-bold text-white mb-6 text-center">Fokus Penyaluran</h3>
            
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactData?.sourceComposition || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(impactData?.sourceComposition || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] uppercase font-display text-white/80">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 text-center border-t border-white/10 pt-6">
              <p className="text-[10px] text-royal-300 uppercase tracking-widest mb-1">Aset Wakaf Produktif</p>
              <p className="text-3xl font-display text-gold-400">{formatNumber(impactData?.totalAset || 0)}</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition group hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 text-gold-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-display mb-2">{impactData?.totalPenerima || 0} Santri</h4>
              <p className="text-royal-200 text-sm mb-4">Penerima Manfaat Beasiswa Kader.</p>
              <div className="w-full bg-royal-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gold-400 h-full w-[85%] rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition group hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 text-gold-400">
                <Sprout className="w-6 h-6" />
              </div>
              <h4 className="text-2xl font-display mb-2">Pilar Pendidikan</h4>
              <p className="text-royal-200 text-sm mb-4">Fokus pada Turats & Sains Modern.</p>
              <div className="w-full bg-royal-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gold-400 h-full w-[100%] rounded-full"></div>
              </div>
            </div>
            
            {(impactData?.strategicPrograms || []).slice(0, 1).map((prog, i) => (
              <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition group sm:col-span-2 flex items-center justify-between hover:-translate-y-1">
                <div>
                  <h4 className="text-xl font-display mb-1">{prog.title}</h4>
                  <p className="text-royal-200 text-sm">Target Realisasi Anggaran</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-display text-gold-400">{prog.progress}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicImpactFund;
