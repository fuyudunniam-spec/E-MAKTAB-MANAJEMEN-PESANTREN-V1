import React from 'react';
import { ArrowRight } from 'lucide-react';

const news = [
  {
    category: 'Prestasi',
    title: 'Santri Al-Bisri Juara 1 MHQ Nasional',
    desc: 'Ananda Fatih berhasil menyisihkan 300 peserta dari seluruh Indonesia...',
    date: '20 Okt 2024',
    img: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=800&auto=format&fit=crop'
  },
  {
    category: 'Wakaf Produktif',
    title: 'Panen Raya Padi Organik',
    desc: 'Hasil panen meningkat 20% berkat penerapan teknologi irigasi tetes...',
    date: '18 Okt 2024',
    img: 'https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=800&auto=format&fit=crop'
  },
  {
    category: 'Kunjungan',
    title: 'Studi Banding Kemenag',
    desc: 'Kunjungan untuk meninjau kurikulum kewirausahaan santri...',
    date: '15 Okt 2024',
    img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop'
  }
];

const PublicNews: React.FC = () => {
  return (
    <section id="news" className="py-24 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-display text-royal-900">Kabar Pesantren</h2>
          </div>
          <a href="#" className="text-sm font-bold text-gold-600 hover:text-royal-900 transition flex items-center gap-1 rounded-full px-4 py-2 border border-stone-200 bg-white hover:border-royal-900">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {news.map((item, i) => (
            <div key={i} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition group cursor-pointer hover:-translate-y-1 duration-500">
              <div className="h-56 overflow-hidden">
                <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={item.title} />
              </div>
              <div className="p-8">
                <span className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-2 block">{item.category}</span>
                <h3 className="font-display text-lg font-bold text-royal-900 mb-3 group-hover:text-gold-600 transition">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-sm mb-4 line-clamp-2">{item.desc}</p>
                <span className="text-xs text-stone-400 font-bold uppercase">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicNews;
