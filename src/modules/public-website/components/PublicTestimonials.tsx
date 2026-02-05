import React from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    text: "Al-Bisri memberi saya rumah ketika saya kehilangan segalanya. Di sini saya belajar bahwa yatim bukan alasan untuk menyerah.",
    author: "Ahmad Fikri",
    role: "Alumni 2018",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
  },
  {
    text: "Sistem transparansi wakafnya luar biasa. Saya mendapat laporan berkala tentang perkembangan pohon mangga wakaf saya.",
    author: "Hj. Siti Aminah",
    role: "Wakif Tetap",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop"
  },
  {
    text: "Lulus dari sini saya punya hafalan 30 Juz dan skill desain grafis. Sekarang saya merintis usaha percetakan sendiri.",
    author: "Rudi Santoso",
    role: "Santripreneur",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
  }
];

const PublicTestimonials: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-gold-600 font-bold uppercase tracking-widest text-xs">Suara Hati</span>
          <h2 className="text-4xl font-display text-royal-900 mt-2">Kisah Penerima Manfaat</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-stone-50 p-8 rounded-[2.5rem] relative hover:shadow-lg transition duration-500 flex flex-col justify-between h-full">
              <div>
                <Quote className="w-8 h-8 text-gold-400 mb-4 fill-current" />
                <p className="text-stone-600 italic mb-6 leading-relaxed">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <img src={t.img} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" alt={t.author} />
                <div>
                  <p className="font-bold text-royal-900 text-sm">{t.author}</p>
                  <p className="text-xs text-stone-500 uppercase tracking-wider">{t.role}</p>
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
