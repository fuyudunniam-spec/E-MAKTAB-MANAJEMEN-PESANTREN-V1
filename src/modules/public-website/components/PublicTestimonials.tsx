import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: "Alhamdulillah, melihat perkembangan anak-anak di sini sangat mengharukan. Mereka tidak hanya hafal Qur'an, tapi juga punya adab yang sangat santun.",
    name: 'Hj. Fatimah',
    role: 'Donatur Tetap',
  },
  {
    quote: "Transparansi laporan keuangan Al-Bisri membuat saya percaya. Setiap rupiah benar-benar terlihat dampaknya untuk pendidikan adik-adik yatim.",
    name: 'Bpk. Hendarman',
    role: 'Wali Santri',
  },
  {
    quote: "Lingkungan pesantren yang kondusif membuat kuliah saya tidak terganggu. Justru kajian kitab di sini menambah wawasan yang tidak saya dapatkan di kampus.",
    name: 'Ahmad Fauzi',
    role: 'Mahasantri',
  },
  {
    quote: "Program beasiswa kader benar-benar mengubah hidup saya. Dari tidak tahu harus kemana, sekarang saya bisa hafal Qur'an dan lulus SMA dengan beasiswa penuh.",
    name: 'Abdurrauf',
    role: 'Alumni Santri Yatim',
  },
];

interface PublicTestimonialsProps {
  data?: any[];
}

const PublicTestimonials: React.FC<PublicTestimonialsProps> = ({ data }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const testimonials = (data && data.length > 0)
    ? data.map(t => ({
      quote: t.content || t.quote || '',
      name: t.name || '',
      role: t.role || '',
    }))
    : TESTIMONIALS;

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const amount = 380;
    sliderRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section id="testimoni" className="py-24 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20 items-start md:items-center">

          {/* Left: Title + Controls */}
          <div className="w-full md:w-1/3 shrink-0">
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4 flex items-center gap-3">
              <span className="w-8 h-px bg-[#c09c53]" />
              Saksi Kebaikan
            </h4>
            <h2 className="text-3xl font-serif text-[#0f172a] leading-tight mb-5">
              Jejak Nyata<br />
              <span className="italic text-slate-400 font-normal">Sebuah Amanah.</span>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Kepercayaan donatur dan kepuasan santri adalah amanah utama yang kami jaga sepenuh hati.
            </p>
            {/* Arrow Controls */}
            <div className="flex gap-3">
              <button
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f172a] hover:border-[#0f172a] hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0f172a] hover:border-[#0f172a] hover:bg-slate-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Scrollable Slider */}
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none flex-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[320px] bg-[#fafafa] border border-slate-100 p-8 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-[#c09c53] text-5xl font-serif leading-none mb-4 opacity-30">"</div>
                <p className="text-sm text-slate-600 italic leading-relaxed mb-8">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-[#0f172a] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-[9px] text-[#c09c53] font-bold uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublicTestimonials;
