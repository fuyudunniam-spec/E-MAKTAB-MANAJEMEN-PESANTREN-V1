import { useState, useEffect } from "react";
import { BookOpen, GraduationCap, Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Using a stable placeholder since local assets might be missing
const aboutImageFallback = "https://images.unsplash.com/photo-1577894748404-f43f5889a911?auto=format&fit=crop&q=80&w=2070";

interface AboutSettings {
  about_section_label: string;
  about_section_title: string;
  about_description_1: string;
  about_vision: string;
  about_mission: string;
  about_image_url: string;
  about_experience_number: string;
  about_experience_label: string;
}

const defaultSettings: AboutSettings = {
  about_section_label: "Tentang Kami",
  about_section_title: "Tentang Pesantren Mahasiswa An-Nur",
  about_description_1: "Pesantren Mahasiswa An-Nur didirikan untuk menjawab kebutuhan mahasiswa Muslim yang ingin mendalami ilmu agama tanpa meninggalkan pendidikan formal. Kami menyediakan lingkungan yang kondusif untuk belajar Al-Quran, kajian Islam, dan pengembangan diri.",
  about_vision: "Mencetak generasi muda Muslim yang Qurani, cendekia, dan berakhlak mulia yang siap berkontribusi untuk umat dan bangsa.",
  about_mission: "Menyelenggarakan pendidikan pesantren yang berkualitas, membina akhlak dan karakter Islami, serta membekali santri dengan ilmu agama dan keterampilan hidup.",
  about_image_url: "",
  about_experience_number: "10+",
  about_experience_label: "Tahun Pengalaman",
};

export function AboutSection() {
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);

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
        const settingsMap: Partial<AboutSettings> = {};
        data.forEach((item) => {
          if (item.key.startsWith('about_') && item.value) {
            settingsMap[item.key as keyof AboutSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error fetching about settings:', error);
    }
  };

  const values = [
    { icon: BookOpen, label: "Qurani", desc: "Berbasis Al-Quran dan Sunnah" },
    { icon: GraduationCap, label: "Akademis", desc: "Mendukung prestasi kuliah" },
    { icon: Heart, label: "Akhlak", desc: "Membentuk karakter mulia" },
    { icon: Users, label: "Sosial", desc: "Membangun ukhuwah Islamiyah" },
  ];

  const aboutImage = settings.about_image_url || aboutImageFallback;

  return (
    <section id="tentang" className="py-24 bg-surface relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50/50 -z-10" />

      <div className="container-section">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-1 transition-transform hover:rotate-0 duration-500">
              <img
                src={aboutImage}
                alt="Santri belajar bersama di Pesantren An-Nur"
                className="w-full h-auto object-cover aspect-square"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Pattern Dots */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-dots-primary opacity-20 hidden md:block" />

            {/* Floating Card */}
            <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-xl shadow-xl border border-slate-100 hidden md:flex items-center gap-4 animate-bounce-slow">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-heading font-bold text-primary">{settings.about_experience_number}</div>
                <div className="text-sm text-slate-500 font-medium">{settings.about_experience_label}</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full">
                {settings.about_section_label}
              </span>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 leading-tight">
                {settings.about_section_title}
              </h2>
            </div>

            <p className="text-lg text-slate-600 leading-relaxed font-light">
              {settings.about_description_1}
            </p>

            <div className="space-y-4 pl-6 border-l-4 border-secondary/30">
              <p className="text-slate-600 leading-relaxed">
                <strong className="text-primary font-bold block mb-1">Visi Kami</strong>
                {settings.about_vision}
              </p>
              <p className="text-slate-600 leading-relaxed">
                <strong className="text-primary font-bold block mb-1">Misi Kami</strong>
                {settings.about_mission}
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-5 pt-6">
              {values.map((value) => (
                <div
                  key={value.label}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <value.icon className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{value.label}</div>
                    <div className="text-sm text-slate-500 leading-snug">{value.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Award(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}
