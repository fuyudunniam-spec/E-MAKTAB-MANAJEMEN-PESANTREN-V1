import React, { useState, useEffect } from 'react';
import { Menu, X, UserPlus, LogIn, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../../public-website/services/sanity.service';

interface PublicNavbarProps {
  theme?: 'landing' | 'light';
}

const PublicNavbar: React.FC<PublicNavbarProps> = ({ theme = 'landing' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const { data: siteSettings } = useQuery({
    queryKey: ['siteSettings'],
    queryFn: SanityService.getSiteSettings
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  // Determine styles based on theme and scroll state
  const isLightMode = theme === 'light' || scrolled;

  // Text Colors
  const textColorClass = isLightMode ? 'text-navy-900' : 'text-white';
  const subTextColorClass = isLightMode ? 'text-navy-900/60' : 'text-white/60';
  const hoverColorClass = 'text-accent-gold';
  const borderColorClass = isLightMode ? 'border-navy-900/10' : 'border-white/10';
  const glassClass = isLightMode
    ? 'bg-white/90 backdrop-blur-md shadow-sm h-20'
    : 'bg-transparent h-24';

  // Helper to get menu item by title (case insensitive)
  const getLink = (title: string) => siteSettings?.headerMenu?.find((m: any) => m.title.toLowerCase() === title.toLowerCase())?.link || '#';
  const menuItems = siteSettings?.headerMenu || [];

  // Filter out "special" items that have specific UI buttons to avoid duplication in the main list if we want to render the rest generically
  // But for now, we will map specific items to specific UI slots to maintain the design.
  // We assume the user creates these items in Sanity. If not, we fall back to hardcoded paths.

  const logoUrl = siteSettings?.logo ? SanityService.imageUrl(siteSettings.logo) : '/kop-albisri.png';
  const brandTitle = siteSettings?.title || 'Pesantren Al-Bisri';

  return (
    <>
      {/* Progress Bar (Optional, keeps generic accent) */}
      <div id="progress-bar" className="fixed top-0 left-0 h-[3px] bg-accent-gold z-[1001] w-0 transition-all duration-300"></div>

      <nav
        id="main-nav"
        className={`fixed top-0 z-[100] w-full flex items-center transition-all duration-500 border-b ${borderColorClass} ${glassClass}`}
      >
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 w-full flex justify-between items-center">

          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-4 md:gap-5 group cursor-pointer z-50">
            <div className="relative">
              {!isLightMode && <div className="absolute inset-0 bg-white/10 blur-lg rounded-full transform scale-75 group-hover:scale-110 transition-transform duration-500"></div>}
              <img src={logoUrl} alt="Logo Al-Bisri" className="h-10 w-auto md:h-12 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className={`font-playfair text-lg md:text-xl tracking-[0.05em] font-bold leading-none ${textColorClass} group-hover:${hoverColorClass} transition-colors duration-300`}>
                {brandTitle}
              </span>
              <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-1 mt-1">
                <span className={`text-[7px] md:text-[8px] ${subTextColorClass} font-medium uppercase tracking-[0.1em] font-jakarta`}>
                  Under Supervision of
                </span>
                <span className="text-[7px] md:text-[8px] text-accent-gold font-bold uppercase tracking-[0.1em] font-jakarta">
                  Pesantren Mahasiswa An-Nur
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden lg:flex items-center gap-8 xl:gap-12 text-[10px] font-bold uppercase tracking-[0.2em] font-jakarta ${isLightMode ? 'text-navy-900/70' : 'text-white/70'}`}>
            {/* Standard Text Links */}
            {menuItems.filter((m: any) => !['PSB', 'Login', 'Donasi'].includes(m.title)).map((item: any) => (
              <Link
                key={item._key}
                to={item.title?.toLowerCase() === 'program' ? '/program' : item.link}
                className={`hover:${hoverColorClass} transition-colors relative group`}
              >
                {item.title}
                <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-accent-gold transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}

            {!menuItems.length && (
              <>
                <Link to="/tentang-kami" className={`hover:${hoverColorClass} transition-colors relative group`}>Profil</Link>
                <Link to="/program" className={`hover:${hoverColorClass} transition-colors relative group`}>Program</Link>
                <Link to="/transparansi" className={`hover:${hoverColorClass} transition-colors relative group`}>Transparansi</Link>
              </>
            )}

            <div className={`h-4 w-[1px] mx-2 ${isLightMode ? 'bg-navy-900/20' : 'bg-white/20'}`}></div>

            {/* Functional Links - Mapped from Sanity if available, else static */}
            <Link to={getLink('PSB') || '/psb'} className={`hover:${hoverColorClass} transition-colors flex items-center gap-2 group`} title="Pendaftaran Santri Baru">
              <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">PSB</span>
            </Link>
            <Link to={getLink('Login') || '/emaktab'} className={`hover:${hoverColorClass} transition-colors flex items-center gap-2 group`} title="E-Maktab Login">
              <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline">Login</span>
            </Link>

            <Link
              to={getLink('Donasi') || '/donasi'}
              className="bg-accent-gold text-navy-950 px-6 py-3 rounded-sm hover:bg-navy-900 hover:text-white transition-all duration-300 font-extrabold tracking-widest hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Donasi
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 rounded-full transition-colors z-50 ${isLightMode ? 'text-navy-900 hover:bg-navy-50' : 'text-white hover:bg-white/10'}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-navy-950/90 backdrop-blur-md transition-opacity duration-500 lg:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={closeMenu}
      />

      {/* Mobile Menu Content - Kept Dark for premium feel */}
      <div
        className={`fixed inset-y-0 right-0 z-[95] w-full max-w-[300px] bg-navy-900 border-l border-white/10 shadow-2xl transform transition-transform duration-500 ease-out lg:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full pt-28 pb-10 px-8 font-jakarta">
          <div className="space-y-6">
            <div>
              <h5 className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Navigasi Utama</h5>
              <div className="flex flex-col gap-4">
                <Link to="/" onClick={closeMenu} className="text-xl text-white font-playfair hover:text-accent-gold transition-colors">Beranda</Link>
                {menuItems.filter((m: any) => !['PSB', 'Login', 'Donasi'].includes(m.title)).map((item: any) => (
                  <Link
                    key={item._key}
                    to={item.title?.toLowerCase() === 'program' ? '/program' : item.link}
                    onClick={closeMenu}
                    className="text-xl text-white font-playfair hover:text-accent-gold transition-colors"
                  >
                    {item.title}
                  </Link>
                ))}
                {!menuItems.length && (
                  <>
                    <Link to="/tentang-kami" onClick={closeMenu} className="text-xl text-white font-playfair hover:text-accent-gold transition-colors">Profil & Sejarah</Link>
                    <Link to="/program" onClick={closeMenu} className="text-xl text-white font-playfair hover:text-accent-gold transition-colors">Program Pendidikan</Link>
                    <Link to="/transparansi" onClick={closeMenu} className="text-xl text-white font-playfair hover:text-accent-gold transition-colors">Transparansi</Link>
                  </>
                )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10"></div>

            <div>
              <h5 className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-bold mb-4">Akses Sistem</h5>
              <div className="grid grid-cols-2 gap-3">
                <Link to={getLink('PSB') || '/psb'} onClick={closeMenu} className="flex flex-col items-center justify-center p-4 rounded-sm border border-white/10 hover:border-accent-gold/50 hover:bg-white/5 transition-all group">
                  <UserPlus className="w-6 h-6 text-white mb-2 group-hover:text-accent-gold group-hover:scale-110 transition-all" />
                  <span className="text-[10px] uppercase tracking-widest text-white/80">PSB Online</span>
                </Link>
                <Link to={getLink('Login') || '/emaktab'} onClick={closeMenu} className="flex flex-col items-center justify-center p-4 rounded-sm border border-white/10 hover:border-accent-gold/50 hover:bg-white/5 transition-all group">
                  <LogIn className="w-6 h-6 text-white mb-2 group-hover:text-accent-gold group-hover:scale-110 transition-all" />
                  <span className="text-[10px] uppercase tracking-widest text-white/80">E-Maktab</span>
                </Link>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Link
                to={getLink('Donasi') || '/donasi'}
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 w-full py-4 bg-accent-gold text-navy-950 rounded-sm font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-white transition-all transform active:scale-95"
              >
                <span>Salurkan Donasi</span>
                <Heart className="w-3 h-3 fill-current" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PublicNavbar;
