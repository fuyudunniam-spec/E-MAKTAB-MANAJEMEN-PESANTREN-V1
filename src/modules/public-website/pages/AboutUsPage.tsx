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
        <header className="pt-24 lg:pt-32 pb-16 px-6 bg-white text-center">
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
        {/* SECTION 3: BENTO GRID VISI & MISI          */}
        {/* ========================================== */}
        <section className="py-24 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#c09c53] uppercase mb-4">Arah Perjuangan</h4>
              <h2 className="text-4xl lg:text-5xl font-serif text-[#0f172a] mb-4">Visi &amp; Misi</h2>
              <p className="text-slate-500 font-light text-lg">
                Membangun fondasi ilmu dan akhlak untuk mencetak individu yang berdaya guna bagi masyarakat.
              </p>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 lg:gap-6">

              {/* Main Vision — wide & tall */}
              <div className="md:col-span-2 md:row-span-2 bg-[#0f172a] text-white p-10 lg:p-14 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#c09c53]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-1000 group-hover:scale-150" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-16 backdrop-blur-md">
                    <Eye className="w-6 h-6 text-[#c09c53]" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-[#c09c53] uppercase tracking-widest mb-4">Visi Utama</h3>
                    <p className="text-3xl lg:text-4xl xl:text-5xl font-serif leading-[1.2] italic text-white/90">
                      "{sanityData?.aboutPage?.vision?.mainVision || 'Menjadi pusat pendidikan Islam terpadu yang melahirkan generasi muslim mandiri, berakhlak mulia, dan berwawasan luas.'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Mission Point 1 */}
              <div className="bg-[#fafafa] p-8 lg:p-10 rounded-[2rem] border border-slate-100 hover:border-[#c09c53]/50 hover:bg-white transition-colors shadow-sm">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <span className="font-serif font-bold text-[#0f172a]">1</span>
                </div>
                <p className="text-sm lg:text-base text-slate-600 leading-relaxed font-light">
                  {sanityData?.aboutPage?.mission?.points?.[0] ||
                    'Menyelenggarakan pendidikan yang mengintegrasikan tradisi keilmuan klasik dan pengetahuan modern.'}
                </p>
              </div>

              {/* Mission Point 2 & 3 */}
              <div className="bg-[#c09c53] text-[#0f172a] p-8 lg:p-10 rounded-[2rem] shadow-lg shadow-[#c09c53]/20">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-5 h-5" />
                </div>
                <ul className="space-y-4">
                  <li className="text-sm font-medium leading-relaxed">
                    {sanityData?.aboutPage?.mission?.points?.[1] ||
                      'Membangun kemandirian hidup santri melalui program keterampilan dan kewirausahaan.'}
                  </li>
                  <li className="text-sm font-medium leading-relaxed pt-4 border-t border-[#0f172a]/10">
                    {sanityData?.aboutPage?.mission?.points?.[2] ||
                      'Menjadi lembaga yang amanah dan profesional dalam mengelola kontribusi umat untuk pendidikan anak yatim.'}
                  </li>
                </ul>
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
