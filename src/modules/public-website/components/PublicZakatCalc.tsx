import React, { useState } from 'react';
import { Calculator, Package } from 'lucide-react';

const PublicZakatCalc: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const zakat = amount * 0.025;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="donasi" className="py-24 bg-white relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-stone-50 rounded-[4rem] p-10 md:p-16 shadow-2xl border border-stone-100 relative overflow-hidden mb-24">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-100 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl font-display text-royal-900 mb-4">Investasi Akhirat</h2>
            <p className="text-stone-500">Pilih jalur kontribusi terbaik Anda.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 relative z-10">
            <div>
              <h3 className="font-bold text-royal-900 mb-6 flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5 text-gold-500" /> Hitung Zakat Maal
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Total Aset (Setahun)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-royal-900 font-bold">Rp</span>
                    <input 
                      type="number" 
                      className="w-full bg-white border border-stone-200 rounded-full py-4 pl-14 text-royal-900 font-bold focus:border-royal-900 focus:outline-none transition shadow-sm"
                      placeholder="0"
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="bg-royal-900 text-white p-6 rounded-[2rem] flex justify-between items-center shadow-lg">
                  <span className="text-sm font-medium opacity-80">Wajib Zakat (2.5%)</span>
                  <span className="text-2xl font-display text-gold-400">{formatCurrency(zakat)}</span>
                </div>
                
                <button className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-full shadow-lg transition transform hover:-translate-y-1">
                  Tunaikan Zakat
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-royal-900 mb-6 flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-gold-500" /> Paket Wakaf Tunai
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Wakaf Semen & Bata', desc: 'Pembangunan Asrama', price: 100000 },
                  { title: 'Wakaf Benih Padi', desc: 'Pertanian Produktif', price: 500000 },
                  { title: 'Wakaf Alat Belajar', desc: 'Kitab & Komputer', price: 1000000 },
                ].map((item, i) => (
                  <button key={i} className="w-full flex justify-between items-center p-5 bg-white border border-stone-200 rounded-[1.5rem] hover:border-gold-500 hover:shadow-lg transition group text-left">
                    <div>
                      <span className="block font-bold text-royal-900">{item.title}</span>
                      <span className="text-xs text-stone-500">{item.desc}</span>
                    </div>
                    <span className="font-display font-bold text-gold-600 group-hover:text-gold-500">
                      {formatCurrency(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicZakatCalc;
