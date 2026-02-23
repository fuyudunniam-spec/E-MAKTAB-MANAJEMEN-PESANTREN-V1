import React, { useEffect, useRef } from 'react';
import { Eye, Target, ArrowDown, MapPin, ChevronLeft, ChevronRight, ArrowRight, HeartHandshake } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';
import { Link } from 'react-router-dom';

const AboutUsPage: React.FC = () => {
  const teamScrollRef = useRef<HTMLDivElement>(null);

  const { data: sanityData } = useQuery({
    queryKey: ['aboutPage'],
    queryFn: SanityService.getAboutPageData
  });

  const team = sanityData?.team || [];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const scrollTeam = (direction: 'left' | 'right') => {
    if (teamScrollRef.current) {
      teamScrollRef.current.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-jakarta text-slate-800 selection:bg-[#c09c53]/20 selection:text-[#0f172a]">
      <PublicNavbar />

      <main className="w-full overflow-hidden">

        {/* ========================================== */}
        {/* SECTION 1: EDITORIAL WHITE HERO            */}
        {/* ========================================== */}
        <header className="pt-24 lg:pt-32 pb-16 px-6 bg-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h4 className="text-[#c09c53] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Mengenal Kami</h4>
            <h1 className="text-5xl md:text-6xl lg:text-[5rem] font-serif text-[#0f172a] leading-[1.1] mb-8 tracking-tight">
              {sanityData?.aboutPage?.hero?.title || 'Menjaga Tradisi,'}<br />
              <span className="italic text-slate-400 font-light">
                {sanityData?.aboutPage?.hero?.titleItalic || 'Membangun Peradaban.'}
              </span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light mb-12">
              {sanityData?.aboutPage?.hero?.subtitle ||
                'Al-Bisri hadir sebagai pusat pendidikan terpadu yang memadukan kedalaman khazanah keilmuan Islam klasik dengan wawasan modern, mencetak santri yatim yang mandiri, berkarakter, dan berdaya saing.'}
            </p>
            <ArrowDown className="w-6 h-6 text-slate-300 mx-auto animate-bounce" />
          </div>
        </header>

        {/* ========================================== */}
        {/* PANORAMIC IMAGE BANNER                     */}
        {/* ========================================== */}
        <div className="px-4 lg:px-8 max-w-[1600px] mx-auto pb-24 lg:pb-32 animate-fade-in-up delay-200">
          <div className="w-full aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] bg-slate-200 rounded-[2rem] lg:rounded-[3rem] overflow-hidden relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] group">
            <img
              src={
                sanityData?.aboutPage?.history?.image
                  ? SanityService.imageUrl(sanityData.aboutPage.history.image)
                  : 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&q=80&w=2670'
              }
              className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-105"
              alt="Panorama Pesantren Al-Bisri"
            />
            <div className="absolute inset-0 bg-[#0f172a]/10" />
            <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-12 bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
              <MapPin className="w-5 h-5 text-[#c09c53]" />
              <div>
                <p className="text-xs font-bold text-[#0f172a] uppercase tracking-widest">Pusat Kegiatan</p>
                <p className="text-[10px] text-slate-500">Kampus Utama Al-Bisri</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* SECTION 2: STICKY HISTORY GRID             */}
        {/* ========================================== */}
        <section className="relative py-24 bg-[#fafafa] border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">

              {/* Left: Sticky rounded image */}
              <div className="lg:col-span-5 lg:sticky lg:top-32 h-[50vh] lg:h-[75vh] w-full rounded-[2rem] overflow-hidden shadow-xl relative group">
                <img
                  src={
                    sanityData?.aboutPage?.history?.image
                      ? SanityService.imageUrl(sanityData.aboutPage.history.image)
                      : 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2670&auto=format&fit=crop'
                  }
                  className="w-full h-full object-cover transition duration-1000 group-hover:scale-105"
                  alt="Sejarah Al-Bisri"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-[10px] text-[#c09c53] font-bold uppercase tracking-widest mb-1">Berdiri Sejak</p>
                  <p className="font-serif text-5xl text-white leading-none drop-shadow-md">
                    {sanityData?.aboutPage?.history?.foundedYear || '2010'}
                  </p>
                </div>
              </div>

              {/* Right: History text */}
              <div className="lg:col-span-7 lg:py-12 flex flex-col gap-16">
                <div>
                  <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">
                    {sanityData?.aboutPage?.history?.badge || 'Akar Sejarah'}
                  </h4>
                  <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-8 leading-[1.15]">
                    {sanityData?.aboutPage?.history?.title || 'Transformasi dari'}<br />
                    <span className="italic text-slate-400">
                      {sanityData?.aboutPage?.history?.subtitle || 'Majelis ke Institut.'}
                    </span>
                  </h2>

                  <div className="space-y-6 text-slate-600 text-lg leading-relaxed font-light">
                    {sanityData?.aboutPage?.history?.description ? (
                      sanityData.aboutPage.history.description.map((block: any, idx: number) => (
                        <p key={idx}>{block.children?.map((c: any) => c.text).join('')}</p>
                      ))
                    ) : (
                      <>
                        <p>Bermula dari sebuah rumah wakaf sederhana di pinggiran kota, pendiri kami memulai majelis taklim kecil dengan lima orang santri yatim. Niat beliau sangat membumi: sekadar memberikan hak pendidikan bagi mereka yang kurang beruntung.</p>
                        <p>Seiring berjalannya waktu, amanah umat semakin membesar. Yayasan Al-Bisri resmi bertransformasi menjadi lembaga pendidikan terpadu yang memadukan kurikulum salaf dengan sistem sekolah menengah formal modern yang diakui negara.</p>
                        <p>Kini, di bawah pembinaan Pesantren Mahasiswa An-Nur, Al-Bisri terus berkembang—tidak hanya sebagai pesantren yatim, tetapi juga sebagai hunian edukatif bagi mahasiswa yang ingin menyeimbangkan karier akademik dan pendalaman ilmu agama.</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-12">
                  {(sanityData?.aboutPage?.history?.stats || [
                    { value: '1.2k+', label: 'Alumni Tersebar' },
                    { value: '100%', label: 'Lulusan Mandiri' },
                    { value: '200+', label: 'Santri Aktif' },
                    { value: '5+', label: 'Sekolah Mitra' },
                  ]).map((stat: any, i: number) => (
                    <div key={i}>
                      <span className="text-5xl font-serif text-[#0f172a] block mb-2">{stat.value}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SECTION 3: EDITORIAL VISI & MISI           */}
        {/* ========================================== */}
        <section className="py-24 lg:py-40 bg-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c09c53]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-100 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-center">

              {/* LEFT: VISI (Large Serif Quote style) */}
              <div className="relative animate-fade-in-up">
                <div className="flex items-center gap-4 mb-8">
                  <span className="h-px w-12 bg-[#c09c53]" />
                  <span className="text-[10px] font-bold text-[#c09c53] uppercase tracking-[0.3em]">Masa Depan Kami</span>
                </div>

                <div className="relative">
                  <span className="absolute -top-12 -left-8 text-[12rem] font-serif text-slate-100 leading-none select-none pointer-events-none">“</span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#0f172a] leading-[1.2] italic relative z-10">
                    {sanityData?.aboutPage?.vision?.mainVision || 'Menjadi pusat pendidikan Islam terpadu yang melahirkan generasi muslim mandiri, berakhlak mulia, dan berwawasan luas.'}
                  </h2>
                  <h3 className="mt-8 text-xl text-slate-400 font-light">— Visi Utama Al-Bisri</h3>
                </div>
              </div>

              {/* RIGHT: MISI (Staggered elegant list) */}
              <div className="flex flex-col gap-12 animate-fade-in-up delay-200">
                <div className="space-y-16">
                  {(sanityData?.aboutPage?.mission?.points || [
                    'Menyelenggarakan pendidikan yang mengintegrasikan tradisi keilmuan klasik dan pengetahuan modern.',
                    'Membangun kemandirian hidup santri melalui program keterampilan dan kewirausahaan.',
                    'Menjadi lembaga yang amanah dan profesional dalam mengelola kontribusi umat untuk pendidikan anak yatim.'
                  ]).map((point: string, idx: number) => (
                    <div key={idx} className={`flex gap-8 group ${idx % 2 !== 0 ? 'lg:pl-12' : ''}`}>
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-full border border-slate-100 flex items-center justify-center text-2xl font-serif text-[#c09c53] group-hover:bg-[#c09c53] group-hover:text-white transition-all duration-500 shadow-sm bg-white">
                          0{idx + 1}
                        </div>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Misi ke-{idx + 1}</h4>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-light group-hover:text-[#0f172a] transition-colors duration-500">
                          {point}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* SECTION 4: TEAM HORIZONTAL SCROLL          */}
        {/* ========================================== */}
        {team.length > 0 && (
          <section className="py-24 lg:py-32 bg-[#fafafa]">
            <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">Struktur Organisasi</h4>
                <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a]">Dewan Pengasuh</h2>
              </div>
              {team.length > 1 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => scrollTeam('left')}
                    className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#0f172a] hover:text-white transition-all bg-white shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollTeam('right')}
                    className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-[#0f172a] hover:text-white transition-all bg-white shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="w-full pl-6 md:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
              <div
                ref={teamScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6 pb-12 pr-6"
              >
                {team.map((p: any, i: number) => (
                  <div key={i} className="snap-start shrink-0 w-[280px] lg:w-[320px] group">
                    <div className="aspect-[4/5] rounded-[2rem] overflow-hidden mb-6 relative bg-slate-200 shadow-sm">
                      <img
                        src={p.photo ? SanityService.imageUrl(p.photo) : (p.img || 'https://placehold.co/600x800?text=&bg=e2e8f0')}
                        className="w-full h-full object-cover grayscale opacity-90 transition duration-700 group-hover:scale-105 group-hover:grayscale-0 group-hover:opacity-100"
                        alt={p.name}
                      />
                    </div>
                    <h3 className="text-2xl font-serif text-[#0f172a] mb-2">{p.name}</h3>
                    <p className="text-[10px] text-[#c09c53] font-bold uppercase tracking-widest mb-4">{p.role}</p>
                    <p className="text-sm text-slate-500 leading-relaxed font-light">{p.description || p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================== */}
        {/* CTA STRIP — Elegan, tidak norak            */}
        {/* ========================================== */}
        <section className="py-20 border-t border-slate-200 bg-white px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">Ambil Bagian</h4>
              <h2 className="text-3xl md:text-4xl font-serif text-[#0f172a] mb-4 leading-tight">
                Bersama Kami,<br />
                <span className="italic text-slate-400 font-normal">Cetak Generasi Peradaban.</span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed font-light">
                Setiap kontribusi memastikan tidak ada satu pun santri yatim yang putus dari pendidikan.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
              <Link
                to="/donasi"
                className="inline-flex items-center justify-center gap-2 bg-[#0f172a] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                <HeartHandshake className="w-4 h-4" /> Dukung Kami
              </Link>
              <Link
                to="/psb"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 text-[#0f172a] px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Daftar Santri <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { 
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .delay-200 { animation-delay: 200ms; }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

export default AboutUsPage;
