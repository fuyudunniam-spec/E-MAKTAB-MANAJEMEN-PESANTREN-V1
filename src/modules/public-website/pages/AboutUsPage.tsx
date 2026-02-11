import React, { useEffect } from 'react';
import { Eye, Target, Award, Users, BookOpen } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const AboutUsPage: React.FC = () => {
  const { data: sanityData } = useQuery({
    queryKey: ['aboutPage'],
    queryFn: SanityService.getAboutPageData
  });

  const team = sanityData?.team || [
    { name: 'KH. Ahmad Bisri, Lc. MA', role: 'Pengasuh Pesantren', description: 'Alumni Universitas Al-Azhar Kairo dengan spesialisasi Fiqih Muamalah.', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop' },
    { name: 'Dr. H. Muhammad Ilham', role: 'Direktur Pendidikan', description: 'Doktor Manajemen Pendidikan Islam, fokus pada pengembangan kurikulum riset.', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop' },
    { name: 'H. Yusuf Mansur, SE', role: 'Ketua Yayasan', description: 'Profesional di bidang keuangan syariah dan pengembangan wakaf produktif.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  ];

  const facilities = sanityData?.facilities || [
    { name: 'Asrama Putra/Putri', description: 'Kapasitas 500 Santri', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop' },
    { name: 'Perpustakaan Digital', description: 'Akses Kitab & Jurnal', img: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=600&auto=format&fit=crop' },
    { name: 'Lab Komputer', description: 'Pusat Riset & Multimedia', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop' },
    { name: 'Greenhouse Wakaf', description: 'Laboratorium Alam', img: 'https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=600&auto=format&fit=crop' },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-paper font-jakarta selection:bg-gold-200 selection:text-navy-950">
      <PublicNavbar />

      {/* HERO HEADER - Luxury Navy Theme */}
      <header className="relative py-32 lg:py-48 px-6 bg-navy-950 text-white overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-navy-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 text-center max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold"></span>
            <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-[10px]">Profil Lembaga</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-medium text-white mb-8 leading-tight">
            Penjaga Tradisi, <br />
            <span className="italic text-accent-gold font-serif">Pembangun Peradaban</span>
          </h1>
          <p className="text-lg md:text-xl text-royal-200 leading-relaxed max-w-2xl mx-auto font-light">
            Al-Bisri adalah perwujudan dari cita-cita luhur untuk mengangkat derajat umat melalui pendidikan yang berkarakter, mandiri, dan berwawasan global.
          </p>
        </div>
      </header>

      {/* SEJARAH - Clean Layout with Whitespace */}
      <section id="sejarah" className="py-24 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Image Composition */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-6 -left-6 w-full h-full border border-gold-400/30 rounded-[3rem]"></div>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-square group bg-stone-100">
                <img src="https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=2670&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-1000 transform group-hover:scale-105" alt="Sejarah Pesantren" />
                <div className="absolute inset-0 bg-royal-950/20 mix-blend-multiply"></div>

                {/* Floating Card */}
                <div className="absolute bottom-8 right-8 bg-white p-8 rounded-2xl shadow-xl border-t-4 border-accent-gold max-w-xs animate-in slide-in-from-bottom-8 duration-700 delay-300">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Didirikan Tahun</p>
                  <p className="font-display text-5xl text-navy-950 leading-none">1998</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Akar Sejarah</span>
              <h2 className="text-4xl lg:text-5xl font-display text-navy-950 mb-8 leading-tight">
                Transformasi dari <br /><span className="italic text-stone-400">Majelis ke Institut</span>
              </h2>

              <div className="prose prose-lg text-slate-500 font-jakarta leading-relaxed">
                <p className="mb-6">
                  Bermula dari sebuah rumah wakaf sederhana di pinggiran kota, KH. Bisri Mustofa (Alm) memulai majelis taklim kecil dengan lima orang santri yatim. Niat beliau sederhana: memberikan hak pendidikan bagi mereka yang kurang beruntung.
                </p>
                <p className="mb-8">
                  Seiring berjalannya waktu, amanah umat semakin besar. Pada tahun 2010, Yayasan Al-Bisri resmi bertransformasi menjadi lembaga pendidikan terpadu yang memadukan kurikulum salaf (kitab kuning) dengan sistem sekolah formal modern.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12 border-t border-stone-200 pt-10 mt-10">
                <div>
                  <span className="text-4xl font-display text-accent-gold block mb-2">1.2k+</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Alumni Tersebar</span>
                </div>
                <div>
                  <span className="text-4xl font-display text-accent-gold block mb-2">100%</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lulusan Kompeten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISI & MISI - Dark Navy Section */}
      <section id="visi" className="py-24 lg:py-32 bg-navy-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16">

            {/* Header */}
            <div className="lg:col-span-4">
              <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs mb-4 block">Arah Perjuangan</span>
              <h2 className="text-4xl lg:text-5xl font-display text-white mb-6">Visi & Misi</h2>
              <p className="text-royal-200 font-light leading-relaxed mb-8">
                Menjadi kompas moral dan intelektual dalam mencetak generasi pemimpin masa depan yang berkarakter Qur'ani.
              </p>
              <div className="w-20 h-1 bg-accent-gold rounded-full"></div>
            </div>

            {/* Cards */}
            <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
              {/* Visi */}
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition duration-500 backdrop-blur-sm">
                <div className="w-14 h-14 bg-accent-gold/20 rounded-2xl flex items-center justify-center text-accent-gold mb-8 border border-accent-gold/30">
                  <Eye className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display mb-4 text-white">Visi Utama</h3>
                <p className="text-royal-100/80 leading-relaxed font-light italic">
                  "Menjadi pusat kaderisasi ulama dan intelektual muslim yang mandiri, berakhlak mulia, dan berwawasan global."
                </p>
              </div>

              {/* Misi */}
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition duration-500 backdrop-blur-sm">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8 border border-white/20">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display mb-6 text-white">Misi Strategis</h3>
                <ul className="space-y-4">
                  {[
                    "Integrasi tradisi klasik & sains modern.",
                    "Kemandirian ekonomi pesantren.",
                    "Skill teknokrat & kepemimpinan."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4 items-start text-sm text-royal-200 font-light">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-bold text-white shrink-0 mt-0.5">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PIMPINAN - Clean Carousel */}
      <section id="pimpinan" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-accent-gold font-bold uppercase tracking-[0.2em] text-xs">Struktur Organisasi</span>
            <h2 className="text-4xl lg:text-5xl font-display text-navy-950 mt-3">Dewan Pengasuh</h2>
          </div>

          <div className="px-4">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full max-w-5xl mx-auto"
            >
              <CarouselContent className="-ml-4 md:-ml-8">
                {team.map((p: any, i: number) => (
                  <CarouselItem key={i} className="pl-4 md:pl-8 md:basis-1/2 lg:basis-1/3">
                    <div className="group h-full text-center p-6 rounded-[2rem] hover:bg-white transition duration-500 shadow-sm hover:shadow-lg border border-transparent hover:border-navy-900/5">
                      <div className="relative w-40 h-40 mx-auto mb-8">
                        <div className="absolute inset-0 border border-gold-400/30 rounded-full scale-110 group-hover:scale-100 transition duration-500"></div>
                        <img src={p.photo ? SanityService.imageUrl(p.photo) : (p.img || "https://placehold.co/400x400?text=Pimpinan")}
                          className="w-full h-full object-cover rounded-full shadow-lg grayscale group-hover:grayscale-0 transition duration-500"
                          alt={p.name} />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-navy-950 mb-1">{p.name}</h3>
                        <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest mb-4">{p.role}</p>
                        <p className="text-sm text-slate-500 leading-relaxed font-light">{p.description || p.desc}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 hover:bg-royal-900 hover:text-white border-royal-900/10" />
                <CarouselNext className="static translate-y-0 hover:bg-royal-900 hover:text-white border-royal-900/10" />
              </div>
            </Carousel>
          </div>
        </div>
      </section>

      {/* FASILITAS - Luxury Gallery */}
      <section id="fasilitas" className="py-24 lg:py-32 bg-paper border-t border-navy-900/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-display text-navy-950 mb-3">Fasilitas Penunjang</h2>
              <p className="text-slate-500 font-light">Lingkungan yang kondusif untuk tumbuh kembang santri.</p>
            </div>
            <div className="hidden md:block w-32 h-px bg-stone-300"></div>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-6">
              {facilities.map((f: any, i: number) => (
                <CarouselItem key={i} className="pl-6 md:basis-1/2 lg:basis-1/3">
                  <div className="group relative rounded-[2rem] overflow-hidden aspect-[4/3] cursor-pointer">
                    <img src={f.image ? SanityService.imageUrl(f.image) : (f.img || "https://placehold.co/600x600?text=Fasilitas")}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      alt={f.name || f.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-royal-950/90 via-royal-950/20 to-transparent flex flex-col justify-end p-8 translate-y-4 group-hover:translate-y-0 transition duration-500">
                      <h4 className="text-white font-display text-xl mb-1">{f.name || f.title}</h4>
                      <p className="text-white/70 text-sm font-light opacity-0 group-hover:opacity-100 transition duration-500 delay-100">{f.description || f.desc}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-4 mt-8 md:hidden">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutUsPage;
