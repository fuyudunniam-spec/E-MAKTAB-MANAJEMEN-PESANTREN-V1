import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../../public-website/services/sanity.service';

const PublicFooter: React.FC = () => {

  const { data: footerData } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: SanityService.getSiteSettings
  });

  // Fallback data structure if Sanity data is missing or loading
  const brand = footerData?.brand || {
    title: 'Al-Bisri',
    subtitle: 'Foundation',
    description: 'Mewujudkan peradaban ilmu dan kemandirian ekonomi umat melalui sinergi pendidikan berkualitas.'
  };

  const supervision = footerData?.supervision || {
    label: 'Supervisi',
    value: 'Pesantren Mahasiswa An-Nur'
  };

  const footerMenu = footerData?.footerMenu || [
    { title: 'Profil Lembaga', link: '/tentang-kami' },
    { title: 'Filosofi & Visi', link: '/tentang-kami#filosofi' },
    { title: 'Struktur Pengurus', link: '/tentang-kami#struktur' },
    { title: 'Penerimaan Santri', link: '/psb' },
    { title: 'Laporan Keuangan', link: '/transparansi' }
  ];

  const location = footerData?.location || {
    title: 'Lokasi Kami',
    mapUrl: 'https://maps.google.com',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.999789332214!2d110.3695!3d-7.7956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwNDcnNDQuMiJTIDExMMKwMjInMTAuMiJF!5e0!3m2!1sen!2sid!4v1625634589000!5m2!1sen!2sid',
    address: 'Jl. Contoh Pesantren No. 123, Kelurahan Ngrukem,\nSewon, Bantul, D.I. Yogyakarta 55188'
  };

  const socialMedia = footerData?.socialMedia || [
    { platform: 'Instagram', url: '#' },
    { platform: 'Youtube', url: '#' },
    { platform: 'Email', url: '#' }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#030406] text-white pt-20 pb-10 px-8 md:px-12 lg:px-24 border-t border-white/[0.03] font-jakarta">
      <div className="max-w-[1400px] mx-auto">

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20 border-b border-white/[0.03] pb-16">

          {/* 1. Brand Section (4 Columns) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-center gap-5 group">
              <div className="relative">
                {footerData?.logo ? (
                  <img
                    src={SanityService.imageUrl(footerData.logo)}
                    alt={brand.title}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center text-lg font-light group-hover:bg-white group-hover:text-black transition-all duration-500 font-playfair">
                    {brand.title.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-playfair text-3xl italic leading-none">{brand.title}</h2>
                <p className="text-[9px] uppercase tracking-[0.4em] text-gray-500 mt-1 font-medium">{brand.subtitle}</p>
              </div>
            </div>
            <p className="text-lg text-gray-400 font-light leading-relaxed">
              {brand.description}
            </p>
            <div className="pt-4">
              <span className="text-[10px] uppercase tracking-widest text-gray-600 block mb-2">{supervision.label}</span>
              <p className="text-sm text-white font-medium">{supervision.value}</p>
            </div>
          </div>

          {/* 2. Navigation Section (3 Columns) */}
          <div className="lg:col-span-3 lg:pl-8 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold border-b border-white/10 pb-4 inline-block">Menu Utama</h4>
            <ul className="space-y-4 text-sm font-light">
              {footerMenu.map((item: any, index: number) => (
                <li key={index}>
                  <Link to={item.link} className="nav-link block text-slate-400 hover:text-white transition-all transform hover:translate-x-1 duration-300">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Map & Location Section (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex justify-between items-end mb-2">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">{location.title}</h4>
              <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest text-white hover:underline">Buka di Maps ↗</a>
            </div>

            {/* Styled Map Container */}
            <div className="map-container w-full h-48 rounded-sm overflow-hidden border border-white/10 relative group bg-gray-900">
              {/* Map iframe */}
              <div className="w-full h-full grayscale hover:grayscale-0 transition-all duration-500 opacity-80 hover:opacity-100 invert-[.9] hover:invert-0 contrast-[.8] hover:contrast-100">
                <iframe
                  src={location.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy">
                </iframe>
              </div>

              {/* Overlay Text (Optional, vanishes on hover) */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                <span className="bg-black/80 px-4 py-2 text-xs uppercase tracking-widest text-white backdrop-blur-sm border border-white/10">Lihat Peta</span>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-1 bg-white/20 h-full min-h-[40px]"></div>
              <div>
                <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-line">
                  {location.address}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Minimalist Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] tracking-[0.2em] text-gray-600 uppercase">
            © {currentYear} {brand.title} {brand.subtitle}.
          </div>

          <div className="flex gap-8">
            {socialMedia.map((social: any, idx: number) => (
              <a key={idx} href={social.url} className="text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors">
                {social.platform}
              </a>
            ))}
          </div>

          <div className="hidden md:block text-[9px] tracking-widest text-gray-700 uppercase">
            Powered by Isyraq An-Nur Media
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
