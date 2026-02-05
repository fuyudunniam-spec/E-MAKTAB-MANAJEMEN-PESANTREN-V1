import React, { useEffect } from 'react';
import { Eye, Target } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const AboutUsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-paper royal-pattern font-body selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />
      
      {/* HERO HEADER */}
      <header className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2674&auto=format&fit=crop" className="w-full h-full object-cover opacity-30" alt="Al-Bisri" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-50 via-stone-50/50 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl px-6 animate-fade-in">
          <span className="text-gold-600 font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Tentang Kami</span>
          <h1 className="text-5xl md:text-7xl font-display text-royal-900 mb-6">Penjaga Tradisi, <br /> <span className="italic text-stone-500 font-serif">Pembangun Masa Depan</span></h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Al-Bisri adalah perwujudan dari cita-cita luhur untuk mengangkat derajat umat melalui pendidikan yang berkarakter, mandiri, dan berwawasan global.
          </p>
        </div>
      </header>

      {/* SEJARAH */}
      <section id="sejarah" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-gold-400 rounded-[3rem]"></div>
              <img src="https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=2670&auto=format&fit=crop" className="rounded-[3rem] shadow-2xl w-full aspect-[4/5] object-cover relative z-10 grayscale hover:grayscale-0 transition duration-1000" alt="History" />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-stone-100 z-20 max-w-xs">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Didirikan Tahun</p>
                <p className="font-display text-4xl text-royal-900">1998</p>
              </div>
            </div>

            <div className="space-y-8 pt-8">
              <div>
                <h2 className="text-4xl font-display text-royal-900 mb-6">Akar Sejarah</h2>
                <div className="prose prose-lg text-stone-600 font-sans">
                  <p className="mb-4">
                    Bermula dari sebuah rumah wakaf sederhana di pinggiran kota, KH. Bisri Mustofa (Alm) memulai majelis taklim kecil dengan lima orang santri yatim. Niat beliau sederhana: memberikan hak pendidikan bagi mereka yang kurang beruntung.
                  </p>
                  <p className="mb-4">
                    Seiring berjalannya waktu, amanah umat semakin besar. Pada tahun 2010, Yayasan Al-Bisri resmi bertransformasi menjadi lembaga pendidikan terpadu yang memadukan kurikulum salaf (kitab kuning) dengan sistem sekolah formal modern.
                  </p>
                  <p>
                    Kini, di bawah naungan <strong>Isyraq Annur Media</strong> dan dukungan <strong>Pesantren Mahasiswa An-Nur</strong>, Al-Bisri terus berinovasi mengembangkan kurikulum riset berbasis turats untuk menjawab tantangan zaman.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-stone-200 pt-8">
                <div>
                  <span className="text-4xl font-display text-gold-500 block mb-1">1.2k+</span>
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-bold">Alumni Tersebar</span>
                </div>
                <div>
                  <span className="text-4xl font-display text-gold-500 block mb-1">100%</span>
                  <span className="text-xs text-stone-500 uppercase tracking-wider font-bold">Lulusan Kompeten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISI & MISI */}
      <section id="visi" className="py-24 bg-royal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }}></div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-white">Visi & Misi</h2>
            <div className="w-24 h-1 bg-gold-500 mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center text-royal-950 mb-6">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display mb-4 text-gold-400">Visi Utama</h3>
              <p className="text-royal-100 leading-relaxed font-light">
                "Menjadi pusat kaderisasi ulama dan intelektual muslim yang mandiri, berakhlak mulia, dan berwawasan global."
              </p>
            </div>

            <div className="md:col-span-2 bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-royal-100 rounded-full flex items-center justify-center text-royal-900 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display mb-6 text-white">Misi Strategis</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { id: '01', text: 'Menyelenggarakan pendidikan Islam yang memadukan tradisi klasik dan sains modern.' },
                  { id: '02', text: 'Mengembangkan unit usaha produktif untuk kemandirian ekonomi pesantren.' },
                  { id: '03', text: 'Membekali santri dengan keterampilan teknokrat dan kepemimpinan.' },
                  { id: '04', text: 'Menyebarkan dakwah Islam yang rahmatan lil \'alamin melalui media digital.' },
                ].map((m) => (
                  <div key={m.id} className="flex gap-4">
                    <span className="text-gold-500 font-bold text-xl">{m.id}</span>
                    <p className="text-royal-200 text-sm">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PIMPINAN */}
      <section id="pimpinan" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-gold-600 font-bold uppercase tracking-[0.2em] text-xs">Struktur Organisasi</span>
            <h2 className="text-4xl font-display text-royal-900 mt-2">Dewan Pengasuh</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { name: 'KH. Ahmad Bisri, Lc. MA', role: 'Pengasuh Pesantren', desc: 'Alumni Universitas Al-Azhar Kairo dengan spesialisasi Fiqih Muamalah.', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop' },
              { name: 'Dr. H. Muhammad Ilham', role: 'Direktur Pendidikan', desc: 'Doktor Manajemen Pendidikan Islam, fokus pada pengembangan kurikulum riset.', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop' },
              { name: 'H. Yusuf Mansur, SE', role: 'Ketua Yayasan', desc: 'Profesional di bidang keuangan syariah dan pengembangan wakaf produktif.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
            ].map((p, i) => (
              <div key={i} className="group">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 border-2 border-gold-400 rounded-full rotate-12 group-hover:rotate-45 transition duration-500"></div>
                  <img src={p.img} className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg relative z-10 grayscale group-hover:grayscale-0 transition duration-500" alt={p.name} />
                </div>
                <h3 className="text-xl font-display font-bold text-royal-900">{p.name}</h3>
                <p className="text-xs text-stone-500 uppercase tracking-widest mt-1">{p.role}</p>
                <p className="text-sm text-stone-600 mt-4 px-4 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FASILITAS */}
      <section id="fasilitas" className="py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display text-royal-900">Fasilitas Penunjang</h2>
              <p className="text-stone-500 mt-2">Lingkungan yang kondusif untuk tumbuh kembang santri.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Asrama Putra/Putri', desc: 'Kapasitas 500 Santri', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop' },
              { title: 'Perpustakaan Digital', desc: 'Akses Kitab & Jurnal', img: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=600&auto=format&fit=crop' },
              { title: 'Lab Komputer', desc: 'Pusat Riset & Multimedia', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop' },
              { title: 'Greenhouse Wakaf', desc: 'Laboratorium Alam', img: 'https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=600&auto=format&fit=crop' },
            ].map((f, i) => (
              <div key={i} className="group relative rounded-2xl overflow-hidden aspect-square">
                <img src={f.img} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={f.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-royal-900/90 to-transparent flex flex-col justify-end p-6">
                  <h4 className="text-white font-bold text-lg">{f.title}</h4>
                  <p className="text-royal-200 text-xs mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default AboutUsPage;
