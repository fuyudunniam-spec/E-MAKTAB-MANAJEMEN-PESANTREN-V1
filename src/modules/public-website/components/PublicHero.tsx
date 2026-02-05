import React from 'react';
import { ArrowRight, UserPlus, Heart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicImpactData } from '../services/publicKeuangan.service';

const PublicHero: React.FC = () => {
  const { data: impactData } = useQuery({
    queryKey: ['public-impact-data'],
    queryFn: getPublicImpactData
  });

  return (
    <section className="relative min-h-[90vh] flex items-center pt-10 pb-20 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-100 rounded-full blur-[100px] opacity-40 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-royal-100 rounded-full blur-[100px] opacity-40 -translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10 w-full">
        {/* Left: Typography */}
        <div className="animate-fade-in relative z-20">
          <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 rounded-full border border-royal-900/10 bg-white/80 backdrop-blur-md shadow-sm w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
            </span>
            <span className="text-royal-900 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold">
              100% Lulusan Dhuafa Masuk PTN/Timur Tengah
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium text-royal-950 mb-8 leading-[1.1]">
            Memuliakan <span className="text-royal-800">Yatim,</span><br />
            <span className="italic text-gold-600 font-serif relative inline-block">
              Membangun Peradaban
              <svg className="absolute w-full h-3 -bottom-2 left-0 text-gold-400/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="text-xl text-stone-600 mb-10 max-w-lg font-light leading-relaxed">
            Kami tidak sekadar memberi santunan, tapi memberikan <strong>pendidikan terbaik</strong> agar anak yatim & dhuafa tumbuh menjadi pemimpin yang mandiri dan bermartabat.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Link to="/donasi" className="group relative px-10 py-4 bg-royal-900 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-full btn-glow overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative font-display font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                Investasi Wakaf <ArrowRight className="w-4 h-4 text-gold-400" />
              </span>
            </Link>
            <Link to="/psb" className="group px-8 py-4 bg-white border border-stone-200 text-royal-900 font-bold uppercase tracking-widest text-sm rounded-full hover:border-gold-400 hover:text-gold-600 transition shadow-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-royal-900 group-hover:text-gold-600 transition" /> Daftar Reguler
            </Link>
          </div>
        </div>

        {/* Right: Visual */}
        <div className="relative animate-fade-in [animation-delay:200ms] flex justify-center lg:justify-end pt-10 lg:pt-0">
          <div className="relative w-full max-w-md mx-auto">
            <div className="absolute -top-6 -right-6 w-48 h-48 bg-gold-200/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition duration-700 ease-out group aspect-[3/4]">
              <div className="absolute inset-0 bg-royal-900/10 group-hover:bg-transparent transition duration-500 z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1200&auto=format&fit=crop" 
                alt="Santri Yatim Berprestasi" 
                className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition duration-700"
              />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-royal-950/80 to-transparent z-20"></div>
              <div className="absolute bottom-8 left-8 z-30">
                <p className="text-gold-400 font-display text-lg italic mb-1">"Bukan Panti, Tapi Pesantren"</p>
                <p className="text-white text-xs uppercase tracking-widest font-light">Rumah Bagi {impactData?.totalPenerima || '...'} Santri Yatim</p>
              </div>
            </div>
            
            {/* Badge */}
            <div className="absolute -top-4 -left-4 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3 animate-float z-40">
              <div className="w-10 h-10 bg-royal-100 rounded-full flex items-center justify-center text-royal-800">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Amanah Umat</p>
                <p className="font-display text-lg font-bold text-royal-900">
                  {impactData ? `${impactData.totalPenerima} Santri` : <Loader2 className="w-4 h-4 animate-spin" />}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicHero;
