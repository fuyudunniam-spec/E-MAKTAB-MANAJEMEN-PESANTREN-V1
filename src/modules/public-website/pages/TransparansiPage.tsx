import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Layers, ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Loader2, ArrowRight, Download, FileText, ShieldCheck, BookOpen, Utensils, GraduationCap, HeartHandshake, Settings2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { DnsTransparansiService, type DnsTransparansiData } from '@/modules/donasi/services/dns.service';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// ================================================
// KATEGORI SLIDER COMPONENT
// ================================================

interface KategoriItem { nama: string; jumlah: number; persen?: number }

// More elegant & specific icons matching the categories
const KATEGORI_ICONS = [Utensils, Settings2, GraduationCap, HeartHandshake];
// Unified elegant colors
const KATEGORI_COLORS = [
  'bg-[#c09c53]/10 text-[#c09c53]',
  'bg-slate-100 text-slate-600',
  'bg-[#c09c53]/10 text-[#c09c53]',
  'bg-slate-100 text-slate-600',
];

const formatRpCompact = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(v);

const KategoriCard = ({ k, i }: { k: KategoriItem; i: number }) => {
  const Icon = KATEGORI_ICONS[i % KATEGORI_ICONS.length];
  const colorClass = KATEGORI_COLORS[i % KATEGORI_COLORS.length];
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm h-full flex flex-col group hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">{k.nama}</p>
      <p className="text-2xl font-display font-bold text-royal-950 mb-auto">{formatRpCompact(k.jumlah)}</p>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-stone-400 mb-1.5">
          <span>Proporsi</span>
          <span className="font-bold text-royal-900">{k.persen ?? 0}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-gold-500 rounded-full transition-all duration-700" style={{ width: `${k.persen ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
};

const KategoriSlider = ({ items }: { items: KategoriItem[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / items.length;
    setActiveIdx(Math.round(el.scrollLeft / cardW));
  }, [items.length]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / items.length;
    el.scrollTo({ left: idx * cardW, behavior: 'smooth' });
  };

  return (
    <>
      {/* MOBILE: swipe slider */}
      <div className="md:hidden">
        {/* Hint */}
        <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-semibold uppercase tracking-wider mb-3">
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Geser untuk melihat semua</span>
        </div>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((k, i) => (
            <div key={k.nama} className="snap-center shrink-0 w-[72vw] max-w-[260px]">
              <KategoriCard k={k} i={i} />
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${i === activeIdx
                  ? 'w-6 h-2 bg-gold-500'
                  : 'w-2 h-2 bg-stone-200 hover:bg-stone-300'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP: 2–4 grid */}
      <div className={`hidden md:grid gap-4 ${items.length <= 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {items.map((k, i) => (
          <KategoriCard key={k.nama} k={k} i={i} />
        ))}
      </div>
    </>
  );
};

const TransparansiPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Data Fetching — scoped to donation-linked akun_kas (dns_ filtered)
  const { data: impactData, isLoading } = useQuery<DnsTransparansiData>({
    queryKey: ['dns-transparansi', selectedYear],
    queryFn: () => DnsTransparansiService.getSummary(selectedYear)
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
    // Build donut from breakdown kategori pengeluaran
    const breakdown = impactData.breakdownKategori;
    if (!breakdown || breakdown.length === 0) {
      return {
        labels: ['Pemasukan', 'Penyaluran'],
        datasets: [{ data: [impactData.totalPemasukan, impactData.totalPengeluaran], backgroundColor: ['#020617', '#d4af37'], borderWidth: 0, hoverOffset: 10 }]
      };
    }
    const colors = ['#020617', '#d4af37', '#64748b', '#94a3b8', '#e7e5e4'];
    return {
      labels: breakdown.map(k => k.nama),
      datasets: [{
        data: breakdown.map(k => k.jumlah),
        backgroundColor: colors.slice(0, breakdown.length),
        borderWidth: 0,
        hoverOffset: 10
      }]
    };
  }, [impactData]);

  const cashFlowData = useMemo(() => {
    if (!impactData) return null;

    const labels = impactData.trendBulanan.map(d => d.month);
    const incomeData = impactData.trendBulanan.map(d => (d.pemasukan || 0) / 1_000_000);
    const expenseData = impactData.trendBulanan.map(d => (d.pengeluaran || 0) / 1_000_000);

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
      <header className="pt-32 pb-16 lg:pt-40 lg:pb-24 px-6 bg-[#0f172a] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#c09c53]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
            <div className="animate-fade-in w-full md:max-w-3xl">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-[#c09c53]" /> Transparansi Publik
              </h4>
              <h1 className="font-serif text-4xl lg:text-[3.5rem] text-white leading-[1.1] mb-6 tracking-tight">
                Jejak Kebaikan &amp; <br /><span className="italic text-[#c09c53] font-light">Realisasi Amanah.</span>
              </h1>
              <p className="text-slate-400 font-light max-w-xl text-base leading-relaxed">
                Setiap rupiah yang Anda titipkan bertransformasi menjadi ilmu yang bermanfaat, makanan yang bergizi, dan senyum anak-anak yatim.
              </p>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Periode Laporan</label>
              <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-lg backdrop-blur-sm">
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full md:w-auto appearance-none bg-transparent border-none text-white px-4 py-2 pr-10 text-sm cursor-pointer focus:ring-0 focus:outline-none"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                      <option key={y} value={y} className="bg-[#0f172a] text-white">{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#c09c53] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* KEY METRICS */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="border-l-2 border-[#c09c53]/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-4 h-4 text-[#c09c53]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Saldo Bersih Donasi</p>
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.saldoDonasi || 0)}</h3>
            </div>

            {/* Card 2 */}
            <div className="border-l-2 border-[#c09c53]/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownLeft className="w-4 h-4 text-[#c09c53]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Donasi Diterima</p>
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.totalPemasukan || 0)}</h3>
            </div>

            {/* Card 3 */}
            <div className="border-l-2 border-[#c09c53]/30 pl-6 py-2">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUpRight className="w-4 h-4 text-[#c09c53]" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Penyaluran</p>
              </div>
              <h3 className="font-serif text-3xl lg:text-4xl text-white">{formatCurrency(impactData?.totalPengeluaran || 0)}</h3>
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
              {impactData && impactData.breakdownKategori.length > 0
                ? impactData.breakdownKategori.map((item, idx) => {
                  const colors = ['bg-royal-950', 'bg-gold-500', 'bg-slate-400', 'bg-stone-300', 'bg-slate-200'];
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-3 text-stone-600 font-medium">
                        <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`}></div>
                        {item.nama}
                      </span>
                      <span className="font-bold text-royal-950">{item.persen ?? 0}%</span>
                    </div>
                  );
                })
                : [
                  { name: 'Pemasukan', value: impactData?.totalPemasukan ?? 0, color: 'bg-royal-950' },
                  { name: 'Penyaluran', value: impactData?.totalPengeluaran ?? 0, color: 'bg-gold-500' },
                ].map((item, idx) => {
                  const total = (impactData?.totalPemasukan ?? 0) + (impactData?.totalPengeluaran ?? 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-3 text-stone-600 font-medium">
                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                        {item.name}
                      </span>
                      <span className="font-bold text-royal-950">{pct}%</span>
                    </div>
                  );
                })
              }
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

      {/* BREAKDOWN KATEGORI PENGELUARAN */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-gold-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block">Penyaluran Dana</span>
            <h3 className="font-display text-3xl text-royal-900">Rincian Kategori Pengeluaran</h3>
          </div>

          {impactData && impactData.breakdownKategori.length > 0 ? (
            <KategoriSlider items={impactData.breakdownKategori} />
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-stone-100">
              <p className="text-stone-400 font-light">Belum ada data penyaluran untuk periode ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* DOKUMEN RESMI */}
      <section className="py-16 px-6 bg-stone-100 rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <span className="text-gold-600 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 block">Akuntabilitas</span>
            <h3 className="font-display text-3xl text-royal-900">Dokumen Resmi</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: `Laporan Keuangan ${selectedYear}`,
                desc: 'Rekap pemasukan dan penyaluran dana donasi tahunan yang telah diaudit internal.',
                icon: <FileText className="w-5 h-5" />,
                href: null,
                soon: true,
              },
              {
                title: 'Laporan Dampak Santri',
                desc: 'Data perkembangan jumlah santri, lulusan, dan program beasiswa aktif.',
                icon: <BookOpen className="w-5 h-5" />,
                href: null,
                soon: true,
              },
              {
                title: 'Akta & Legalitas Yayasan',
                desc: 'Dokumen pendirian yayasan, NPWP, dan sertifikat lembaga.',
                icon: <ShieldCheck className="w-5 h-5" />,
                href: null,
                soon: true,
              },
            ].map((doc) => (
              <div key={doc.title} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 bg-royal-950/5 rounded-xl flex items-center justify-center text-royal-950">
                  {doc.icon}
                </div>
                <div>
                  <h4 className="font-display font-bold text-royal-900 text-base">{doc.title}</h4>
                  <p className="text-xs text-stone-400 font-light mt-1 leading-relaxed">{doc.desc}</p>
                </div>
                {doc.soon ? (
                  <span className="mt-auto text-[10px] uppercase tracking-widest text-stone-400 border border-stone-200 rounded-full px-3 py-1 self-start">
                    Segera Tersedia
                  </span>
                ) : (
                  <a
                    href={doc.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-royal-900 border border-royal-200 px-4 py-2 rounded-full hover:bg-royal-950 hover:text-white transition-all self-start"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default TransparansiPage;
