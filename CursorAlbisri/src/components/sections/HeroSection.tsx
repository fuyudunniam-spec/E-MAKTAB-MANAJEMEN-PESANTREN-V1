import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Using a stable placeholder since local assets might be missing
const heroBgFallback = "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=2072";

interface HeroSettings {
  hero_badge_text: string;
  hero_title_1: string;
  hero_title_highlight_1: string;
  hero_title_2: string;
  hero_title_3: string;
  hero_subtitle: string;
  hero_cta_primary_text: string;
  hero_cta_primary_link: string;
  hero_cta_secondary_text: string;
  hero_stat_1_number: string;
  hero_stat_1_label: string;
  hero_stat_2_number: string;
  hero_stat_2_label: string;
  hero_stat_3_number: string;
  hero_stat_3_label: string;
  hero_background_image: string;
}

const defaultSettings: HeroSettings = {
  hero_badge_text: "Penerimaan Santri Baru Tahun Ajaran 2024/2025",
  hero_title_1: "Membangun Generasi",
  hero_title_highlight_1: "Qurani",
  hero_title_2: "Cendekia",
  hero_title_3: "Berakhlak Mulia",
  hero_subtitle: "Pesantren Mahasiswa An-Nur: Paduan harmonis antara tradisi keilmuan Islam dan pendidikan akademik modern.",
  hero_cta_primary_text: "Daftar Sekarang",
  hero_cta_primary_link: "/#kontak",
  hero_cta_secondary_text: "Tentang Kami",
  hero_stat_1_number: "500+",
  hero_stat_1_label: "Alumni Sukses",
  hero_stat_2_number: "50+",
  hero_stat_2_label: "Mahasiswa Aktif",
  hero_stat_3_number: "15+",
  hero_stat_3_label: "Tahun Mengabdi",
  hero_background_image: "",
};

export function HeroSection() {
  const [settings, setSettings] = useState<HeroSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

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
        const settingsMap: Partial<HeroSettings> = {};
        data.forEach((item) => {
          if (item.key.startsWith('hero_')) {
            settingsMap[item.key as keyof HeroSettings] = item.value || '';
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error fetching hero settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById("tentang");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const backgroundImage = settings.hero_background_image || heroBgFallback;

  const stats = [
    { number: settings.hero_stat_1_number, label: settings.hero_stat_1_label, highlight: false },
    { number: settings.hero_stat_2_number, label: settings.hero_stat_2_label, highlight: true },
    { number: settings.hero_stat_3_number, label: settings.hero_stat_3_label, highlight: false },
  ];

  if (loading) {
    return (
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b2b1f]/90 via-[#0b2b1f]/80 to-[#0b2b1f]/95 z-0" />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] z-0 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container-section text-center py-24 sm:py-32">
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-up">
          {/* Badge */}
          {settings.hero_badge_text && (
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-secondary text-sm font-medium backdrop-blur-sm animate-fade-in shadow-lg">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
              <span className="tracking-wide uppercase text-xs sm:text-sm">{settings.hero_badge_text}</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl">
            {settings.hero_title_1}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{settings.hero_title_highlight_1}</span><br className="hidden md:block" />
            <span className="text-secondary drop-shadow-md">{settings.hero_title_2}</span> <span className="text-white">&</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">{settings.hero_title_3}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            {settings.hero_subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 text-lg px-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300 rounded-full group"
              asChild
            >
              <Link to={settings.hero_cta_primary_link}>
                {settings.hero_cta_primary_text}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 text-lg px-8 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 rounded-full backdrop-blur-sm"
              onClick={scrollToAbout}
            >
              {settings.hero_cta_secondary_text}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-16 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="relative group p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`text-3xl md:text-4xl font-bold font-heading mb-1 ${stat.highlight ? 'text-secondary' : 'text-emerald-400'}`}>
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-slate-300 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToAbout}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
          aria-label="Scroll down"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
}
