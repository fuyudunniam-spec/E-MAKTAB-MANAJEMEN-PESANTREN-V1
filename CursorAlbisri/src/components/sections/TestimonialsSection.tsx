import { useState, useEffect } from "react";
import { Quote, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface TestimonialsSettings {
  testimonials_section_label: string;
  testimonials_section_title: string;
  testimonials_section_subtitle: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar_url: string | null;
  rating: number | null;
  position: number | null;
  is_active: boolean | null;
}

const defaultSettings: TestimonialsSettings = {
  testimonials_section_label: "Testimoni",
  testimonials_section_title: "Apa Kata Alumni & Santri",
  testimonials_section_subtitle: "Cerita dan pengalaman dari mereka yang telah merasakan manfaat belajar di An-Nur",
};

// Fallback testimonials if database is empty
const fallbackTestimonials: Testimonial[] = [
  {
    id: '1',
    name: "Ahmad Fauzi",
    role: "Alumni 2023 - Mahasiswa Teknik",
    content: "Pesantren An-Nur mengajarkan saya bagaimana menyeimbangkan kuliah dan ibadah. Alhamdulillah bisa hafal 10 juz sambil tetap lulus cum laude.",
    avatar_url: null,
    rating: 5,
    position: 0,
    is_active: true,
  },
  {
    id: '2',
    name: "Fatimah Azzahra",
    role: "Santri Aktif - Mahasiswi Kedokteran",
    content: "Lingkungan yang Islami dan supportif sangat membantu saya melewati masa-masa sulit kuliah kedokteran. Ukhuwah di sini luar biasa.",
    avatar_url: null,
    rating: 5,
    position: 1,
    is_active: true,
  },
  {
    id: '3',
    name: "Muhammad Rizki",
    role: "Alumni 2022 - Entrepreneur",
    content: "Nilai-nilai yang diajarkan di pesantren sangat bermanfaat dalam membangun bisnis yang halal dan berkah. Jazakumullah khairan untuk seluruh asatidz.",
    avatar_url: null,
    rating: 5,
    position: 2,
    is_active: true,
  },
  {
    id: '4',
    name: "Aisyah Putri",
    role: "Santri Aktif - Mahasiswi Hukum",
    content: "Belajar di An-Nur membuat saya lebih percaya diri dengan identitas Muslimah saya. Kajian-kajian di sini sangat relevan dengan kehidupan modern.",
    avatar_url: null,
    rating: 5,
    position: 3,
    is_active: true,
  },
];

export function TestimonialsSection() {
  const [settings, setSettings] = useState<TestimonialsSettings>(defaultSettings);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('key, value');

      if (settingsData) {
        const settingsMap: Partial<TestimonialsSettings> = {};
        settingsData.forEach((item) => {
          if (item.key.startsWith('testimonials_') && item.value) {
            settingsMap[item.key as keyof TestimonialsSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }

      // Fetch testimonials from database
      const { data: testimonialsData, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      // Use database testimonials if available, otherwise use fallback
      if (testimonialsData && testimonialsData.length > 0) {
        setTestimonials(testimonialsData);
      } else {
        setTestimonials(fallbackTestimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials(fallbackTestimonials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-slate-50">
      <div className="container-section text-center mb-16">
        <span className="text-primary font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
          Alumni & Kisah Sukses
        </span>
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 leading-tight mb-6">
          Generasi Penerus Peradaban
        </h2>
        <div className="w-24 h-1 bg-amber-400 mx-auto rounded-full" />
      </div>

      <div className="container-section max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="flex flex-col md:flex-row gap-8 items-start group"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="shrink-0 relative mx-auto md:mx-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10 group-hover:scale-105 transition-transform duration-500">
                  {testimonial.avatar_url ? (
                    <img
                      src={testimonial.avatar_url}
                      alt={testimonial.name}
                      className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <span className="text-2xl font-serif font-bold text-slate-400">{testimonial.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 z-20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Quote className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-grow text-center md:text-left">
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-primary/20 rotate-180 md:hidden mx-auto mb-4" />
                  <p className="text-xl md:text-2xl font-heading font-medium text-slate-800 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg tracking-wide uppercase">{testimonial.name}</h4>
                  <p className="text-primary text-sm font-medium mt-1">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
