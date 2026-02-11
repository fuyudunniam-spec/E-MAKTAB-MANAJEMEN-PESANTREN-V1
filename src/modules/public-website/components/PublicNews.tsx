import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicNews: React.FC = () => {
  const news = [
    {
      date: "12 Oktober 2025",
      title: "Wisuda Tahfidz Angkatan Ke-5 Berjalan Khidmat",
      image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800"
    },
    {
      date: "05 November 2025",
      title: "Kunjungan Studi Banding dari Universitas Al-Azhar",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800"
    },
    {
      date: "20 November 2025",
      title: "Laporan Audit Keuangan Tahunan Diterbitkan",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800"
    }
  ];

  return (
    <section id="berita" className="py-24 lg:py-32 px-6 lg:px-10 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 animate-fade-in">
          <div>
            <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Kabar Pesantren</span>
            <h2 className="font-playfair text-4xl lg:text-5xl text-navy-900">Berita Terkini</h2>
          </div>
          <Link to="/berita" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-navy-900 hover:text-accent-gold transition-colors">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Slider / Desktop Grid */}
        <div className="mobile-slider md:grid-cols-3 lg:gap-8 animate-slide-in">
          {news.map((item, index) => (
            <div key={index} className="group cursor-pointer min-w-[300px]">
              <div className="aspect-[4/3] bg-slate-100 mb-6 overflow-hidden rounded-md">
                <img
                  src={item.image}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={item.title}
                />
              </div>
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest mb-2 block">{item.date}</span>
              <h3 className="font-playfair text-xl text-navy-900 group-hover:text-accent-gold transition-colors leading-tight">
                {item.title}
              </h3>
            </div>
          ))}
        </div>

        <Link to="/berita" className="md:hidden mt-8 flex justify-center items-center gap-2 text-xs font-bold uppercase tracking-widest text-navy-900 hover:text-accent-gold transition-colors">
          Lihat Semua <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default PublicNews;
