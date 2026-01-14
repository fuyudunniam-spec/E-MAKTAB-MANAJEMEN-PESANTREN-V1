import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterSettings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
  site_name: string;
  site_description_short: string;
}

const defaultSettings: FooterSettings = {
  contact_email: "info@pesantrenannur.id",
  contact_phone: "+62 812-3456-7890",
  contact_address: "Jl. Pendidikan No. 123, Kota Santri",
  social_facebook: "https://facebook.com",
  social_instagram: "https://instagram.com",
  social_twitter: "https://twitter.com",
  social_youtube: "https://youtube.com",
  site_name: "Pesantren An-Nur",
  site_description_short: "Membangun Generasi Rabbani yang Cendekia dan Berakhlak Mulia.",
};

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(defaultSettings);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsMap: Partial<FooterSettings> = {};
        data.forEach((item) => {
          if (Object.keys(defaultSettings).includes(item.key) && item.value) {
            settingsMap[item.key as keyof FooterSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 py-16 font-sans border-t border-slate-900">
      <div className="container-section">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 border-b border-slate-800 pb-12 mb-12">

          {/* Column 1: Institution */}
          <div className="lg:col-span-1 space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-heading font-bold text-white tracking-tight">
                An<span className="text-primary">-Nur</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              {settings.site_description_short}
            </p>
            <div className="flex gap-4">
              <SocialIcon href={settings.social_facebook} icon={Facebook} />
              <SocialIcon href={settings.social_instagram} icon={Instagram} />
              <SocialIcon href={settings.social_twitter} icon={Twitter} />
              <SocialIcon href={settings.social_youtube} icon={Youtube} />
            </div>
          </div>

          {/* Column 2: Jelajahi */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 font-heading">Jelajahi</h4>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/" label="Beranda" />
              <FooterLink to="/about" label="Tentang Kami" />
              <FooterLink to="/#program" label="Program Pendidikan" />
              <FooterLink to="/blog" label="Artikel & Berita" />
              <FooterLink to="/donasi" label="Donasi" />
            </ul>
          </div>

          {/* Column 3: Kontak */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 font-heading">Hubungi Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-slate-400 leading-relaxed">{settings.contact_address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-slate-400">{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-slate-400">{settings.contact_email}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter/Action */}
          <div className="lg:col-span-1">
            <h4 className="text-white font-bold mb-6 font-heading">Bergabung</h4>
            <p className="text-sm text-slate-400 mb-6">
              Jadilah bagian dari keluarga besar Pesantren An-Nur.
            </p>
            <Link
              to="/santri/onboarding"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-bold text-slate-900 transition-all duration-200 bg-primary rounded-full hover:bg-primary/90 hover:scale-105"
            >
              Daftar Santri Baru
            </Link>
            <Link
              to="/donasi"
              className="inline-flex items-center justify-center w-full px-6 py-3 mt-3 text-sm font-bold text-white transition-all duration-200 bg-transparent border border-white/20 rounded-full hover:bg-white/5"
            >
              Salurkan Donasi
            </Link>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {currentYear} {settings.site_name}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/qa" className="hover:text-white transition-colors">Tanya Jawab</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon: Icon }: { href: string; icon: any }) {
  if (!href || href === '#') return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-primary hover:bg-primary transition-all duration-300"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className="text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
        {label}
      </Link>
    </li>
  );
}
