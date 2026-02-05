import React from 'react';
import { UserPlus, Heart, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicNavbar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-24 grid grid-cols-12 items-center gap-4">
        <div className="col-span-6 lg:col-span-3 flex justify-start items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-royal-900 text-white rotate-45 flex items-center justify-center rounded-sm shadow-md group-hover:rotate-0 transition-transform duration-300">
              <span className="font-display font-bold text-gold-400 text-lg -rotate-45 group-hover:rotate-0 transition-transform duration-300">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-royal-900 tracking-widest text-lg leading-none">AL-BISRI</span>
              <span className="text-[9px] text-gold-600 uppercase tracking-[0.25em] font-sans font-semibold">Institute</span>
            </div>
          </Link>
        </div>
        
        <div className="hidden lg:flex col-span-6 justify-center items-center gap-8">
          <a href="#about" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Filosofi</a>
          <a href="#elearning" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Academy</a>
          <Link to="/transparansi" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1 text-gold-600">Wakaf</Link>
          <a href="#news" className="text-stone-600 hover:text-royal-900 text-sm uppercase tracking-widest font-bold transition border-b-2 border-transparent hover:border-gold-400 pb-1">Berita</a>
        </div>
        
        <div className="col-span-6 lg:col-span-3 flex justify-end items-center gap-4">
          <Link to="/psb" className="hidden xl:flex items-center gap-2 text-stone-500 hover:text-royal-900 text-xs font-bold uppercase tracking-wider transition">
            <UserPlus className="w-3 h-3" /> Daftar Santri
          </Link>
          <Link to="/donasi" className="group flex items-center gap-2 px-6 py-2.5 bg-royal-900 text-white text-sm uppercase tracking-widest font-semibold hover:bg-royal-800 transition shadow-lg shadow-royal-900/20 rounded-sm">
            <span>Investasi Wakaf</span>
            <Heart className="w-3 h-3 text-gold-400 fill-current group-hover:scale-110 transition-transform" />
          </Link>
          <button className="lg:hidden text-royal-900 p-2">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
