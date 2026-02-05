import React, { useEffect } from 'react';
import { TrendingUp, MoreHorizontal, BarChart2, GraduationCap, Sprout, CheckCircle2, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { getPublicImpactData } from '../services/publicKeuangan.service';

const TransparansiPage: React.FC = () => {
  const { data: impactData, isLoading } = useQuery({
    queryKey: ['public-impact-data'],
    queryFn: getPublicImpactData
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)} Jt`;
    return formatCurrency(val);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-royal-900 animate-spin mx-auto" />
          <p className="text-stone-500 font-display animate-pulse uppercase tracking-widest">Memuat Laporan Transparansi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-body selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />
      
      {/* HEADER */}
      <header className="bg-royal-900 text-white pt-16 pb-32 relative overflow-hidden rounded-b-[4rem]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="text-gold-400 font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Akuntabilitas Akademis</span>
          <h1 className="text-4xl md:text-6xl font-display mb-6">Laporan Investasi Ilmu</h1>
          <p className="text-royal-200 text-lg max-w-2xl mx-auto font-light">
            Transparansi pengelolaan dana wakaf untuk pengembangan kurikulum, riset, dan beasiswa kader ulama.
          </p>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <main className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-24">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-100 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-2">Aset Wakaf Produktif</p>
              <h3 className="text-4xl font-display text-royal-900 mb-2">{formatNumber(impactData?.totalAset || 0)}</h3>
              <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 w-fit px-2 py-1 rounded-lg">
                <TrendingUp className="w-4 h-4" /> Realtime Data
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-royal-100 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-2">Dana Beasiswa & Riset</p>
              <h3 className="text-4xl font-display text-royal-900 mb-2">{formatNumber(impactData?.totalPenyaluran || 0)}</h3>
              <p className="text-sm text-stone-400">Total Penyaluran Akumulatif</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-stone-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-stone-100 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mb-2">Kader Dibina</p>
              <h3 className="text-4xl font-display text-royal-900 mb-2">{impactData?.totalPenerima || 0} Santri</h3>
              <p className="text-sm text-stone-400">Jenjang Takhassus & Ma'had Aly</p>
            </div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Source of Funds */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display text-xl text-royal-900">Komposisi Penyaluran</h4>
              <button className="text-stone-400 hover:text-royal-900"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impactData?.sourceComposition || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(impactData?.sourceComposition || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value}%`, 'Persentase']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-3">
              {(impactData?.sourceComposition || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-stone-100 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    {item.name}
                  </span>
                  <span className="font-bold text-stone-600">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allocation Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-stone-200">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-display text-xl text-royal-900">Grafik Penyaluran Dana Pendidikan</h4>
              <span className="text-xs font-bold text-royal-800 bg-royal-50 px-3 py-1 rounded-full">Akumulatif (Jutaan Rp)</span>
            </div>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={impactData?.allocationTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, family: 'Cormorant Garamond' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, family: 'Cormorant Garamond' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`Rp ${value} Jt`, 'Penyaluran']}
                  />
                  <Bar dataKey="amount" fill="#166534" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* REALIZATION TRACKER */}
        <div className="mb-12">
          <h4 className="font-display text-2xl text-royal-900 mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-gold-400 rounded-full"></span> Realisasi Program Strategis
          </h4>

          <div className="grid md:grid-cols-2 gap-6">
            {(impactData?.strategicPrograms || []).map((prog, i) => (
              <div key={i} className="bg-white rounded-[2rem] p-6 border border-stone-200 flex gap-6 items-center shadow-sm hover:shadow-md transition">
                <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden relative">
                  <img src={prog.image} className="w-full h-full object-cover" alt={prog.title} />
                  <div className={`absolute bottom-0 left-0 w-full text-white text-[10px] text-center py-1 ${prog.status === 'Selesai' ? 'bg-green-600/80' : 'bg-royal-900/80'}`}>
                    {prog.progress}%
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="font-display text-lg text-royal-900 mb-1">{prog.title}</h5>
                  <p className="text-stone-500 text-sm mb-4">{prog.description}</p>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 mb-2">
                    <div className={`${prog.status === 'Selesai' ? 'bg-green-600' : 'bg-gold-400'} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${prog.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-stone-400">
                    <span>Realisasi: {formatNumber(prog.progress * prog.budget / 100)}</span>
                    <span>Target {prog.targetDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT TRANSACTIONS TABLE */}
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="p-8 border-b border-stone-100 flex justify-between items-center">
            <h4 className="font-display text-xl text-royal-900">Arus Kas Wakaf</h4>
            <button className="text-xs font-bold text-gold-600 hover:text-royal-900 uppercase tracking-wider">Laporan Detail</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-royal-900 font-bold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-8 py-4">Tanggal</th>
                  <th className="px-8 py-4">Uraian Transaksi</th>
                  <th className="px-8 py-4">Kategori</th>
                  <th className="px-8 py-4 text-right">Nominal</th>
                  <th className="px-8 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(impactData?.recentTransactions || []).map((row, i) => (
                  <tr key={i} className="hover:bg-royal-50/50 transition">
                    <td className="px-8 py-4 font-mono text-stone-500">{new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-8 py-4 font-bold text-royal-900">{row.description}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-royal-50 text-royal-700 border border-royal-100">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-mono font-bold">{formatCurrency(row.amount)}</td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!impactData?.recentTransactions || impactData.recentTransactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-stone-400 italic">Belum ada riwayat transaksi yang ditampilkan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TransparansiPage;
