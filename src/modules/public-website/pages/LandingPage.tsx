import React, { useEffect } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import PublicHero from '../components/PublicHero';
import PublicAbout from '../components/PublicAbout';
import PublicMilestones from '../components/PublicMilestones';
import PublicImpactFund from '../components/PublicImpactFund';
import PublicTestimonials from '../components/PublicTestimonials';
import PublicNews from '../components/PublicNews';
import PublicZakatCalc from '../components/PublicZakatCalc';
import PublicFooter from '../components/PublicFooter';

const LandingPage: React.FC = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-paper royal-pattern font-body selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />
      
      <main>
        <PublicHero />
        
        {/* Partners Marquee */}
        <section className="py-20 bg-stone-50 border-y border-royal-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center mb-10">
            <p className="text-royal-800/60 text-xs font-bold uppercase tracking-[0.2em]">Dipercaya Oleh Lembaga & Korporasi</p>
          </div>
          <div className="relative flex overflow-x-hidden group py-4">
            <div className="animate-marquee whitespace-nowrap flex gap-20 items-center opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition duration-500">
              {Array(2).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <img src="https://placehold.co/150x60/e5e5e5/a3a3a3?text=BANK+BSI" className="h-12 w-auto object-contain" alt="Bank BSI" />
                  <img src="https://placehold.co/100x100/e5e5e5/a3a3a3?text=UNIV" className="h-16 w-auto object-contain rounded-full" alt="Universitas" />
                  <img src="https://placehold.co/150x60/e5e5e5/a3a3a3?text=BAZNAS" className="h-12 w-auto object-contain" alt="Baznas" />
                  <img src="https://placehold.co/150x60/e5e5e5/a3a3a3?text=KEMENAG" className="h-12 w-auto object-contain" alt="Kemenag" />
                  <img src="https://placehold.co/80x80/e5e5e5/a3a3a3?text=SCHOOL" className="h-16 w-auto object-contain rounded-full" alt="School Partner" />
                  <img src="https://placehold.co/150x60/e5e5e5/a3a3a3?text=DOMPET" className="h-12 w-auto object-contain" alt="Dompet Dhuafa" />
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <PublicAbout />
        <PublicMilestones />
        
        {/* E-Learning Section */}
        <section id="elearning" className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block py-1 px-3 rounded-full bg-royal-100 text-royal-800 text-xs font-bold uppercase tracking-wider mb-4 border border-royal-200">
                  Didukung Isyraq Annur Media
                </span>
                <h2 className="text-4xl md:text-5xl font-display text-royal-900 mb-6">
                  Akses Kurikulum <br /> <span className="italic text-gold-600">Bahasa Arab Digital</span>
                </h2>
                <p className="text-stone-600 text-lg mb-8 leading-relaxed">
                  Kami membuka akses materi pembelajaran Bahasa Arab standar Timur Tengah secara digital. Dikembangkan oleh tim ahli Pesantren Mahasiswa An-Nur.
                </p>
                <button className="group px-10 py-4 bg-royal-900 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold uppercase tracking-widest text-sm flex items-center gap-3">
                  Akses Gratis <span className="text-gold-400">Standard Timur Tengah</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gold-400/20 rounded-[3rem] rotate-6 scale-95 blur-xl"></div>
                <div className="relative bg-stone-50 p-2 rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop" 
                    className="rounded-[2rem] w-full object-cover opacity-90 hover:opacity-100 transition duration-700" 
                    alt="E-Learning Platform" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <PublicImpactFund />
        <PublicTestimonials />
        <PublicNews />
        <PublicZakatCalc />
      </main>
      
      <PublicFooter />
    </div>
  );
};

export default LandingPage;
