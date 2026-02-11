import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicAbout: React.FC = () => {
  return (
    <section id="about" className="py-24 relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative group order-2 md:order-1">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-royal-50 rounded-full -z-10 group-hover:scale-110 transition-transform"></div>
            <img
              src="https://images.unsplash.com/photo-1542816417-0983c9c9ad53?q=80&w=2670&auto=format&fit=crop"
              alt="Asrama Al-Bisri"
              className="rounded-[3rem] shadow-2xl w-full h-[500px] object-cover grayscale hover:grayscale-0 transition duration-700"
            />
            <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-[2rem] shadow-xl border border-stone-100 max-w-xs animate-float [animation-delay:1000ms]">
              <p className="font-display text-4xl font-bold text-royal-900 mb-1">Mandiri<span className="text-gold-500 text-2xl">.</span></p>
              <p className="text-xs text-stone-500 uppercase tracking-widest font-bold">Visi Ekonomi Pesantren</p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <span className="text-gold-600 font-bold uppercase tracking-widest text-xs mb-4 block">Filosofi Kemandirian</span>
            <h2 className="text-4xl md:text-5xl font-display text-royal-900 mb-6 leading-tight">
              Gotong Royong <br />
              <span className="italic text-stone-400">Pendidikan Umat</span>
            </h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-6">
              Al-Bisri menerapkan sistem <strong>Subsidi Silang (Cross-Subsidy)</strong>. Kami membuka layanan asrama dan pendidikan berbayar bagi masyarakat umum.
            </p>
            <p className="text-stone-600 text-lg leading-relaxed mb-8 border-l-4 border-gold-400 pl-4">
              Keuntungan dari program reguler inilah yang menopang operasional dan menjamin <strong>pendidikan GRATIS berkualitas tinggi</strong> bagi ratusan santri yatim dan dhuafa.
            </p>
            <Link to="/tentang-kami" className="inline-flex items-center gap-2 text-royal-900 font-bold uppercase tracking-widest text-sm border-b-2 border-gold-400 pb-1 hover:text-gold-600 transition group">
              Pelajari Filosofi Kami <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicAbout;
