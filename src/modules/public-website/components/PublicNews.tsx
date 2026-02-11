import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';

const PublicNews: React.FC = () => {
  const { data: newsData } = useQuery({
    queryKey: ['news-latest'],
    queryFn: SanityService.getNews
  });

  const news = newsData || [];


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
          {news.map((item: any, index: number) => (
            <Link to={`/berita/${item.slug?.current}`} key={index} className="group cursor-pointer min-w-[300px]">
              <div className="aspect-[4/3] bg-slate-100 mb-6 overflow-hidden rounded-md">
                <img
                  src={item.mainImage ? SanityService.imageUrl(item.mainImage) : "https://placehold.co/800x600?text=Berita"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={item.title}
                />
              </div>
              <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest mb-2 block">
                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
              </span>
              <h3 className="font-playfair text-xl text-navy-900 group-hover:text-accent-gold transition-colors leading-tight">
                {item.title}
              </h3>
            </Link>
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
