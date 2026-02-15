import React, { useEffect, useState, useMemo } from 'react';
import { Layers, ArrowDownLeft, ArrowUpRight, Check, ChevronDown, CheckCircle2, Loader2, ArrowRight, X, Menu, Download } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { DonasiTransparansiService, type DonasiTransparansiData } from '@/modules/donasi/services/donasi.service';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TransparansiPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  // Data Fetching — scoped to donation program akun_kas only
  const { data: impactData, isLoading } = useQuery<DonasiTransparansiData>({
    queryKey: ['donasi-transparansi', selectedYear],
    queryFn: () => DonasiTransparansiService.getData(selectedYear)
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Prepare Chart Data
  const compositionData = useMemo(() => {
    if (!impactData) return null;
    // Build composition from income vs expense
    const labels = ['Pemasukan', 'Penyaluran'];
    const designColors = ['#020617', '#d4af37'];

    return {
      labels,
      datasets: [{
        data: [impactData.totalPemasukan, impactData.totalPengeluaran],
        backgroundColor: designColors,
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  }, [impactData]);

  const cashFlowData = useMemo(() => {
    if (!impactData) return null;

    const labels = impactData.trendBulanan.map(d => d.month);
    const incomeData = impactData.trendBulanan.map(d => d.pemasukan);
    const expenseData = impactData.trendBulanan.map(d => d.pengeluaran);

    return {
      labels,
      datasets: [
        {
          label: 'Masuk',
          data: incomeData,
          backgroundColor: '#020617', // Royal-950
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        },
        {
          label: 'Penyaluran',
          data: expenseData,
          backgroundColor: '#d4af37', // Gold-500
          borderRadius: 4,
          barPercentage: 0.6,
          categoryPercentage: 0.8
        }
      ]
    };
  }, [impactData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#020617',
        padding: 12,
        titleFont: { family: "'Plus Jakarta Sans', sans-serif" },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif" }
      }
    },
    cutout: '80%'
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { borderDash: [4, 4], color: '#f1f5f9', drawBorder: false },
        ticks: {
          font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
          callback: function (value: any) {
            return value + ' Jt';
          },
          color: '#64748b'
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
          color: '#64748b'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-stone-50 text-royal-900 font-sans min-h-screen selection:bg-gold-200 selection:text-royal-950">

      <PublicNavbar />

      {/* HEADER: IMPACT STATEMENT */}
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 bg-royal-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-royal-900/50 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
            <div className="animate-fade-in w-full md:max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[1px] bg-gold-500"></div>
                <span className="text-gold-500 text-xs font-bold uppercase tracking-[0.3em]">Transparansi Publik</span>
              </div>
              <h1 className="font-display text-4xl lg:text-6xl leading-tight mb-6">
                Jejak Kebaikan & <br /><span className="text-gold-500 italic font-serif">Realisasi Amanah.</span>
              </h1>
              <p className="text-slate-300 font-light max-w-xl text-lg leading-relaxed">

                Setiap rupiah yang Anda titipkan bertransformasi menjadi ilmu yang bermanfaat, makanan yang bergizi, dan senyum anak-anak yatim.
              </p>
            </div>

            {/* Elegant Filter */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Periode Laporan</label>

              <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-lg backdrop-blur-sm w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full md:w-auto appearance-none bg-transparent border-none text-white px-4 py-2 pr-10 text-sm font-display cursor-pointer focus:ring-0 focus:outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                      <option key={y} value={y} className="bg-royal-950 text-white">{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gold-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* KEY METRICS */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="border-l-2 border-gold-500/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-4 h-4 text-gold-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Saldo Program Donasi</p>

              </div>
              <h3 className="font-display text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.totalSaldoProgram || 0)}</h3>
            </div>

            {/* Card 2 */}
            <div className="border-l-2 border-gold-500/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownLeft className="w-4 h-4 text-gold-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Donasi Diterima</p>

              </div>
              <h3 className="font-display text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.totalPemasukan || 0)}</h3>
            </div>

            {/* Card 3 */}
            <div className="border-l-2 border-gold-500/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUpRight className="w-4 h-4 text-gold-500" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Penyaluran</p>

              </div>
              <h3 className="font-display text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.totalPengeluaran || 0)}</h3>
            </div>

          </div>
        </div>
      </header>

      {/* VISUALISASI DAMPAK (Charts) */}
      <section className="py-20 px-6 relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8 text-royal-900">

          {/* Donut Chart: Alokasi */}
          <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50 p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold mb-2">Peta Penyaluran</h3>
              <p className="text-xs text-stone-500 font-light">Proporsi distribusi dana amanah.</p>
            </div>

            <div className="relative h-64 w-full flex-1 flex justify-center items-center mb-6">
              {compositionData && <Doughnut data={compositionData} options={chartOptions} />}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-display font-bold text-royal-950">100%</span>
                <span className="text-[9px] uppercase tracking-widest text-stone-400">Tersalurkan</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-stone-100">
              {impactData && [
                { name: 'Pemasukan', value: impactData.totalPemasukan, color: 'bg-royal-950' },
                { name: 'Penyaluran', value: impactData.totalPengeluaran, color: 'bg-gold-500' },
              ].map((item, idx) => {
                const total = impactData.totalPemasukan + impactData.totalPengeluaran;
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;

                return (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-3 text-stone-600 font-medium">
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                      {item.name}
                    </span>
                    <span className="font-bold text-royal-950">{percentage}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bar Chart: Tren */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50 p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
              <div>
                <h3 className="font-display text-2xl font-bold mb-2">Tren Amanah vs Penyaluran</h3>
                <p className="text-xs text-stone-500 font-light">Perbandingan arus dana bulanan.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-royal-950 rounded-full"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Masuk</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-gold-500 rounded-full"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Penyaluran</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[300px]">
              {cashFlowData && <Bar data={cashFlowData} options={barOptions} />}
            </div>
          </div>

        </div>
      </section>

      {/* PROGRESS PROGRAM */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <span className="text-gold-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block">Program Unggulan</span>
              <h3 className="font-display text-3xl text-royal-900">Progres Realisasi Program</h3>
            </div>
            <a href="/donasi" className="hidden sm:flex text-xs font-bold uppercase tracking-widest text-royal-900 hover:text-gold-600 items-center gap-2 transition-colors">
              Lihat Semua Program <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Programs from donation data are not fetched here — link to /donasi instead */}
          <div className="text-center py-8 bg-white rounded-2xl border border-stone-100">
            <p className="text-stone-500 font-light mb-4">Lihat detail progres setiap program donasi</p>
            <a href="/donasi" className="inline-flex items-center gap-2 px-6 py-3 bg-royal-950 text-white rounded-full text-sm font-bold uppercase tracking-widest hover:bg-gold-600 transition-all">
              Buka Halaman Donasi <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* TABEL RINCIAN */}
      <section id="transaksi" className="py-20 px-6 bg-stone-100 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-8 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-display text-xl font-bold text-royal-900">Rincian Mutasi Dana</h3>
                <p className="text-xs text-stone-400 mt-1 font-light">Data transaksi terbaru tahun {selectedYear}</p>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-royal-900 border border-royal-200 px-5 py-3 rounded-full hover:bg-royal-950 hover:text-white transition-all">
                <Download className="w-4 h-4" /> Download Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    <th className="p-6 font-medium">Tanggal</th>
                    <th className="p-6 font-medium">Uraian Transaksi</th>
                    <th className="p-6 font-medium">Kategori</th>
                    <th className="p-6 font-medium text-right">Nominal</th>
                    <th className="p-6 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm bg-white">
                  {(impactData?.recentTransactions || []).map((row, i) => (
                    <tr key={i} className={`border-b border-stone-50 transition-colors group ${row.type === 'Pemasukan' ? 'hover:bg-gold-50/10' : 'hover:bg-stone-50'}`}>

                      <td className="p-6 font-medium text-stone-500">
                        {new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="p-6">
                        <p className="font-display font-medium text-royal-900 text-base">{row.description}</p>
                        {row.program_nama && (
                          <p className="text-xs text-stone-400 font-light mt-0.5">
                            Program: {row.program_nama}
                          </p>
                        )}
                      </td>
                      <td className="p-6">
                        <span className={`text-[10px] uppercase tracking-wider border px-3 py-1 rounded-full font-bold ${row.type === 'Pemasukan' ? 'text-gold-700 border-gold-200 bg-gold-50' : 'text-stone-500 border-stone-200 bg-stone-50'}`}>
                          {row.category}
                        </span>
                      </td>

                      <td className={`p-6 text-right font-display text-lg ${row.type === 'Pemasukan' ? 'text-gold-700 font-bold' : 'text-royal-900'}`}>
                        {row.type === 'Pemasukan' ? '+' : '-'} {formatCurrency(row.amount)}
                      </td>

                      <td className="p-6 text-center">
                        {row.type === 'Pemasukan' ? (
                          <div className="flex items-center justify-center w-8 h-8 bg-gold-50 rounded-full mx-auto text-gold-700">
                            <ArrowDownLeft className="w-4 h-4" />
                          </div>
                        ) : (

                          <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full mx-auto text-stone-400">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!impactData?.recentTransactions || impactData.recentTransactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-stone-400 italic font-light">
                        Belum ada data transaksi untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default TransparansiPage;
