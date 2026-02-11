import React from 'react';

const PublicTestimonials: React.FC = () => {
  const testimonials = [
    {
      quote: "Alhamdulillah, melihat perkembangan anak-anak di sini sangat mengharukan. Mereka tidak hanya hafal Qur'an, tapi juga punya adab yang sangat santun.",
      name: "Hj. Fatimah",
      role: "Donatur Tetap",
      // avatar: "https://placehold.co/100x100/e2e8f0/64748b?text=HF" // Placeholder or empty div as per design
    },
    {
      quote: "Transparansi laporan keuangan Al-Bisri membuat saya percaya. Setiap rupiah benar-benar terlihat dampaknya untuk pendidikan adik-adik yatim.",
      name: "Bpk. Hendarman",
      role: "Wali Santri",
      // avatar: "https://placehold.co/100x100/e2e8f0/64748b?text=BH"
    }
  ];

  return (
    <section id="testimoni" className="py-24 lg:py-32 px-6 lg:px-10 bg-parchment">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <span className="text-accent-gold text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Suara Hati</span>
          <h2 className="font-playfair text-4xl lg:text-5xl text-navy-900">Apa Kata Mereka?</h2>
        </div>

        {/* Mobile Slider / Desktop Grid */}
        <div className="mobile-slider md:grid-cols-2 lg:gap-10 animate-slide-in">
          {testimonials.map((item, index) => (
            <div key={index} className="bg-white p-10 shadow-sm border border-slate-100 relative min-h-[280px]">
              <div className="text-accent-gold text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
              <p className="text-slate-600 italic mb-6 relative z-10 font-light leading-relaxed">
                {item.quote}
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 font-bold overflow-hidden">
                  {/* Placeholder Avatar */}
                  <span className="text-xs">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <h5 className="text-navy-900 font-bold text-sm">{item.name}</h5>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicTestimonials;
