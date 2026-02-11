import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-500 py-24 px-10 border-t border-white/5 font-jakarta">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
        {/* Brand */}
        <div className="flex flex-col max-w-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 border border-white/20 rounded-full text-white flex items-center justify-center font-playfair font-bold text-xl">B</div>
            <span className="font-playfair text-2xl text-white tracking-[0.1em] font-bold uppercase">Al-Bisri</span>
          </div>
          <p className="text-sm font-light leading-loose text-slate-400 mb-6">
            Mewujudkan peradaban ilmu dan kemandirian ekonomi umat melalui sinergi pendidikan berkualitas dan pengelolaan wakaf yang profesional.
          </p>
          <div className="flex flex-col gap-1 text-[10px] uppercase tracking-widest font-bold opacity-50">
            <p className="text-accent-gold">Supervisi: Pesantren Mahasiswa An-Nur</p>
            <p>Powered by: Isyraq An-Nur Media</p>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-20 text-[10px] font-bold uppercase tracking-[0.2em]">
          <div className="flex flex-col gap-6 text-white/50">
            <span className="text-white mb-2">Tentang Kami</span>
            <Link to="/tentang-kami" className="hover:text-accent-gold transition-colors">Profil Lembaga</Link>
            <Link to="/tentang-kami#filosofi" className="hover:text-accent-gold transition-colors">Filosofi</Link>
            <Link to="/tentang-kami#struktur" className="hover:text-accent-gold transition-colors">Struktur Pengurus</Link>
          </div>
          <div className="flex flex-col gap-6 text-white/50">
            <span className="text-white mb-2">Informasi</span>
            <Link to="/psb" className="hover:text-accent-gold transition-colors">Penerimaan Santri</Link>
            <Link to="/transparansi" className="hover:text-accent-gold transition-colors">Laporan Keuangan</Link>
            <Link to="/kontak" className="hover:text-accent-gold transition-colors">Kontak</Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8 items-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
        <p>© 2026 Yayasan Al-Bisri.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Instagram</a>
          <a href="#" className="hover:text-white transition-colors">Youtube</a>
          <a href="#" className="hover:text-white transition-colors">Email</a>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
