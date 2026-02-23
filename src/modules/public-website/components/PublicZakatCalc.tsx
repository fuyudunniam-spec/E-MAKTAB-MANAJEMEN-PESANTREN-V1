import React, { useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicZakatCalc: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const zakat = amount * 0.025;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const QUICK_AMOUNTS = [
    { label: '1 Juta', value: 1_000_000 },
    { label: '5 Juta', value: 5_000_000 },
    { label: '10 Juta', value: 10_000_000 },
    { label: '50 Juta', value: 50_000_000 },
  ];

  return (
    <section id="donasi" className="py-24 bg-[#0f172a] text-white relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#c09c53]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#c09c53]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

        {/* Left: Info */}
        <div>
          <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
            <span className="w-8 h-px bg-[#c09c53]" />
            Investasi Akhirat
          </h4>
          <h2 className="text-3xl md:text-5xl font-serif leading-tight mb-6">
            Tunaikan Zakat &<br />
            <span className="italic text-slate-400 font-normal">Sedekah Terbaik Anda.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-md">
            Hitung zakat maal Anda di sini, kemudian salurkan langsung untuk beasiswa santri yatim dan operasional pesantren. Setiap amanah kami kelola dengan penuh tanggung jawab dan transparansi.
          </p>
          <div className="space-y-4">
            {[
              { pct: '60%', label: 'Beasiswa & Pendidikan Santri Yatim' },
              { pct: '25%', label: 'Asrama, Gizi & Kesehatan' },
              { pct: '15%', label: 'Operasional & Pengembangan Lembaga' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 text-right text-[10px] font-bold text-[#c09c53] shrink-0">{item.pct}</div>
                <div className="flex-1 h-px bg-white/10 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#c09c53]/40"
                    style={{ width: item.pct }}
                  />
                </div>
                <span className="text-[11px] text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
          <Link
            to="/transparansi"
            className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors border-b border-white/10 pb-1"
          >
            Lihat Laporan Lengkap <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Right: Calculator Card */}
        <div className="bg-white text-[#0f172a] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0f172a] flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#c09c53]" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#0f172a]">
                Kalkulator Zakat Maal
              </h3>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">Nisab 2.5%</p>
            </div>
          </div>

          {/* Quick Select */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {QUICK_AMOUNTS.map(q => (
              <button
                key={q.value}
                onClick={() => setAmount(q.value)}
                className={`py-2 text-[9px] font-bold uppercase tracking-wider border transition-colors ${amount === q.value ? 'bg-[#0f172a] text-white border-[#0f172a]' : 'border-slate-200 text-slate-500 hover:border-[#0f172a] hover:text-[#0f172a]'}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Total Aset (Setahun)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">Rp</span>
              <input
                type="number"
                value={amount || ''}
                className="w-full bg-[#fafafa] border border-slate-200 py-3.5 pl-10 pr-4 text-[#0f172a] text-sm font-bold focus:border-[#0f172a] focus:outline-none transition"
                placeholder="0"
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Result */}
          <div className="bg-[#0f172a] p-5 flex justify-between items-center mb-6">
            <div>
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Wajib Zakat (2.5%)</p>
              <p className="text-xl font-serif text-[#c09c53]">{formatCurrency(zakat)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Per Bulan</p>
              <p className="text-sm font-bold text-white">{formatCurrency(zakat / 12)}</p>
            </div>
          </div>

          <Link
            to="/donasi"
            className="w-full block text-center bg-[#c09c53] text-[#0f172a] py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#b08a42] transition-colors"
          >
            Tunaikan Sekarang →
          </Link>
          <p className="text-center text-[9px] text-slate-400 mt-4">
            Dapat juga melalui transfer ke: <span className="font-bold text-[#0f172a]">BSI 1234567890</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PublicZakatCalc;
