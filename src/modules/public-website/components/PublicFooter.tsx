import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../../public-website/services/sanity.service';
import { Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';

const SOCIAL_ICONS: any = { Instagram, Youtube, Email: Mail };

const PublicFooter: React.FC = () => {
  const { data: footerData } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: SanityService.getSiteSettings
  });

  const brand = footerData?.brand || {
    title: 'Al-Bisri.',
    subtitle: 'Yayasan Pesantren Yatim',
    description: 'Berdedikasi untuk melahirkan generasi muslim yang mandiri, beradab, dan berwawasan global melalui sinergi pendidikan salaf dan kurikulum modern.',
  };

  const supervision = footerData?.supervision || {
    label: 'Di bawah Pembinaan',
    value: 'Pesantren Mahasiswa An-Nur',
  };

  const footerMenu = footerData?.footerMenu || [
    { title: 'Beranda', link: '/' },
    { title: 'Profil Lembaga', link: '/tentang-kami' },
    { title: 'Program Pendidikan', link: '/akademik' },
    { title: 'Berita & Pemikiran', link: '/berita' },
    { title: 'Transparansi Keuangan', link: '/transparansi' },
  ];

  const admisiMenu = [
    { title: 'Santri Yatim (Beasiswa)', link: '/psb?jalur=yatim' },
    { title: 'Pesantren Mahasiswa', link: '/psb?jalur=mahasiswa' },
    { title: 'Program TPQ', link: '/psb?jalur=tpq' },
    { title: 'Donasi & Wakaf', link: '/donasi' },
    { title: 'Login E-Maktab', link: '/emaktab' },
  ];

  const location = footerData?.location || {
    title: 'Lokasi Kami',
    mapUrl: 'https://maps.google.com',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.999789332214!2d110.3695!3d-7.7956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwNDcnNDQuMiJTIDExMMKwMjInMTAuMiJF!5e0!3m2!1sen!2sid!4v1625634589000!5m2!1sen!2sid',
    address: 'Perum IKIP C-92, Gunung Anyar\nSurabaya, Jawa Timur 60294',
    phone: '+62 812-XXXX-XXXX',
    email: 'info@albisri.id',
  };

  const socialMedia = footerData?.socialMedia || [
    { platform: 'Instagram', url: '#' },
    { platform: 'Youtube', url: '#' },
    { platform: 'Email', url: 'mailto:info@albisri.id' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-white pt-20 pb-10 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#c09c53]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 mb-10 border-b border-white/[0.06]">

          {/* Col 1: Identity (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <span className="font-serif font-bold text-3xl text-white leading-none block">
                {brand.title}
              </span>
              <span className="text-[9px] tracking-[0.3em] text-[#c09c53] uppercase font-bold mt-1.5 block">
                {brand.subtitle}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-light">
              {brand.description}
            </p>
            <div className="pt-2 border-t border-white/[0.06]">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold block mb-1">{supervision.label}</span>
              <p className="text-sm text-white font-medium">{supervision.value}</p>
            </div>
            {/* Social Media */}
            <div className="flex gap-3 pt-2">
              {socialMedia.map((s: any, i: number) => {
                const Icon = SOCIAL_ICONS[s.platform] || Mail;
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 border border-white/10 flex items-center justify-center text-slate-400 hover:border-[#c09c53] hover:text-[#c09c53] transition-colors duration-300"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Navigasi (2 cols) */}
          <div className="lg:col-span-2 space-y-6 lg:pl-4">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c09c53]">Institusi</h4>
            <ul className="space-y-3">
              {footerMenu.map((item: any, i: number) => (
                <li key={i}>
                  <Link
                    to={item.link}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-[#c09c53] transition-all duration-300 group-hover:w-3" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Program Admisi (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c09c53]">Program Admisi</h4>
            <ul className="space-y-3">
              {admisiMenu.map((item: any, i: number) => (
                <li key={i}>
                  <Link
                    to={item.link}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-[#c09c53] transition-all duration-300 group-hover:w-3" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Kontak & Peta (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex justify-between items-center">
              <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c09c53]">Hubungi & Lokasi</h4>
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
              >
                Buka Maps ↗
              </a>
            </div>

            {/* Map */}
            <div className="relative h-36 overflow-hidden border border-white/10 group">
              <div className="w-full h-full grayscale group-hover:grayscale-0 opacity-70 group-hover:opacity-100 transition-all duration-500">
                <iframe
                  src={location.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                <span className="bg-black/70 text-white text-[9px] uppercase tracking-widest px-3 py-1.5 border border-white/10">Lihat Peta</span>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="flex gap-3">
              <MapPin className="w-3.5 h-3.5 text-[#c09c53] shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400 leading-relaxed font-light whitespace-pre-line">
                {location.address}
              </p>
            </div>
            {location.phone && (
              <div className="flex gap-3 items-center">
                <Phone className="w-3.5 h-3.5 text-[#c09c53] shrink-0" />
                <a href={`tel:${location.phone}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                  {location.phone}
                </a>
              </div>
            )}
            {location.email && (
              <div className="flex gap-3 items-center">
                <Mail className="w-3.5 h-3.5 text-[#c09c53] shrink-0" />
                <a href={`mailto:${location.email}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                  {location.email}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
          <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
            © {currentYear} Yayasan Pesantren Al-Bisri. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/kebijakan-privasi" className="text-[9px] text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Kebijakan Privasi</Link>
            <Link to="/syarat-ketentuan" className="text-[9px] text-slate-600 hover:text-white uppercase tracking-widest transition-colors">Syarat & Ketentuan</Link>
          </div>
          <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.15em]">
            Produced by Isyraq An-Nur Media ✦
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
