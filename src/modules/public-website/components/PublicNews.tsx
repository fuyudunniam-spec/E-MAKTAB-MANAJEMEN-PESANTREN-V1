import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';

const PublicNews: React.FC = () => {
  const { data: newsData } = useQuery({
    queryKey: ['news-latest'],
    queryFn: SanityService.getNews
  });

  const sliderRef = useRef<HTMLDivElement>(null);
  const news = newsData || [];

  return (
    <section id="berita" className="py-24 bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-3 flex items-center gap-3">
              <span className="w-8 h-px bg-[#c09c53]" />
              Kabar Pesantren
            </h4>
            <h2 className="text-3xl md:text-4xl font-serif text-[#0f172a] leading-tight">
              Berita & Pemikiran Terbaru
            </h2>
          </div>
          <Link
            to="/berita"
            className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0f172a] transition-colors shrink-0 border-b border-slate-200 pb-1 hover:border-[#0f172a]"
          >
            Semua Berita <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {news.length === 0 ? (
          /* Empty state */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-100 p-0 overflow-hidden">
                <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-2 bg-slate-100 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-full animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {news.slice(0, 3).map((item: any, i: number) => (
              <Link
                to={`/berita/${item.slug?.current}`}
                key={item._id || i}
                className="group bg-white border border-slate-100 overflow-hidden hover:border-slate-200 hover:shadow-xl transition-all duration-400 flex flex-col"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden relative bg-slate-100">
                  <img
                    src={item.mainImage ? SanityService.imageUrl(item.mainImage) : `https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=800&auto=format&fit=crop`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Category tag */}
                  {item.category && (
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-[#0f172a] text-[9px] font-bold uppercase tracking-wider px-3 py-1">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[9px] font-bold text-[#c09c53] uppercase tracking-[0.2em] mb-3 block">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                      : ''}
                  </span>
                  <h3 className="font-serif text-[1.1rem] text-[#0f172a] leading-snug mb-3 group-hover:text-[#c09c53] transition-colors line-clamp-2 flex-1">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-5">
                    {item.excerpt}
                  </p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2 group-hover:text-[#0f172a] group-hover:gap-4 transition-all duration-300">
                    Baca Selengkapnya <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile link */}
        <div className="mt-8 text-center sm:hidden">
          <Link to="/berita" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0f172a] transition-colors border-b border-slate-200 pb-1">
            Semua Berita →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PublicNews;
