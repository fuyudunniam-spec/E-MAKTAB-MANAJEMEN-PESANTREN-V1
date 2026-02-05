import React from 'react';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-royal-950 text-stone-400 pt-20 pb-10 border-t border-royal-900">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-500 text-royal-950 flex items-center justify-center rounded-full shadow-lg">
              <span className="font-display font-bold text-lg">A</span>
            </div>
            <span className="font-display font-bold text-white text-lg tracking-widest">AL-BISRI</span>
          </div>
          <p className="text-sm leading-relaxed mb-6 font-light">
            Yayasan sosial & pendidikan yang berdedikasi memuliakan anak yatim melalui pendidikan berkualitas.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-royal-900 flex items-center justify-center text-stone-400 hover:bg-gold-500 hover:text-royal-950 transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-royal-900 flex items-center justify-center text-stone-400 hover:bg-gold-500 hover:text-royal-950 transition">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-royal-900 flex items-center justify-center text-stone-400 hover:bg-gold-500 hover:text-royal-950 transition">
              <Youtube className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Navigasi</h5>
          <ul className="space-y-3 text-sm font-light">
            <li><Link to="/tentang-kami" className="hover:text-gold-400 transition">Tentang Kami</Link></li>
            <li><Link to="/program" className="hover:text-gold-400 transition">Program Pendidikan</Link></li>
            <li><Link to="/transparansi" className="hover:text-gold-400 transition">Laporan Keuangan</Link></li>
            <li><Link to="/kontak" className="hover:text-gold-400 transition">Hubungi Kami</Link></li>
          </ul>
        </div>
        
        <div>
          <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Program Wakaf</h5>
          <ul className="space-y-3 text-sm font-light">
            <li><Link to="/donasi?type=uang" className="hover:text-gold-400 transition">Wakaf Uang</Link></li>
            <li><Link to="/donasi?type=aset" className="hover:text-gold-400 transition">Wakaf Aset</Link></li>
            <li><Link to="/donasi?type=profesi" className="hover:text-gold-400 transition">Wakaf Profesi</Link></li>
          </ul>
        </div>
        
        <div>
          <h5 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Kontak</h5>
          <ul className="space-y-4 text-sm font-light">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-gold-500" />
              <span>Jl. Pesantren No. 45<br />Kota Batu, Jawa Timur</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gold-500" />
              <span>+62 812-3456-7890</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gold-500" />
              <span>info@albisri.org</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-royal-900 pt-8 text-center text-xs text-stone-500 uppercase tracking-widest">
        &copy; 2026 Yayasan Al-Bisri Royal Philanthropy. <br />
        <span className="text-royal-800 mt-2 block">
          Powered by <strong>Isyraq Annur Media</strong> & <strong>Pesantren Mahasiswa An-Nur</strong>
        </span>
      </div>
    </footer>
  );
};

export default PublicFooter;
