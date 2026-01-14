import { useState, useEffect } from "react";
import { BookOpen, Users, Heart, Globe, GraduationCap, Moon, Star, Award, Lightbulb, Target, Compass, Feather, Languages, School, Library, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface ProgramsSettings {
  programs_section_label: string;
  programs_section_title: string;
  programs_section_subtitle: string;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  position: number | null;
  is_active: boolean | null;
}

const defaultSettings: ProgramsSettings = {
  programs_section_label: "Program Kami",
  programs_section_title: "Program Unggulan",
  programs_section_subtitle: "Berbagai program pendidikan dan pembinaan untuk membentuk santri yang berkualitas",
};

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  BookOpen,
  GraduationCap,
  Users,
  Heart,
  Globe,
  Moon,
  Star,
  Award,
  Lightbulb,
  Target,
  Compass,
  Feather,
  Languages,
  School,
  Library,
  Pencil,
};

// Fallback programs if database is empty
const fallbackPrograms = [
  {
    id: '1',
    icon: 'BookOpen',
    title: "Program Tahfidz/Tahsin",
    description: "Menghafal Al-Quran dengan metode mutqin dan talaqqi langsung dengan ustadz berpengalaman.",
    position: 0,
    is_active: true,
  },
  {
    id: '2',
    icon: 'Moon',
    title: "Kajian Rutin",
    description: "Kajian kitab kuning dan fiqh kontemporer setiap malam untuk memperdalam pemahaman agama.",
    position: 1,
    is_active: true,
  },
  {
    id: '3',
    icon: 'Users',
    title: "Mentoring & Halaqah",
    description: "Bimbingan personal dan halaqah mingguan untuk pembinaan karakter dan akhlak.",
    position: 2,
    is_active: true,
  },
  {
    id: '4',
    icon: 'Heart',
    title: "Kegiatan Sosial",
    description: "Bakti sosial, santunan yatim, dan pengabdian masyarakat sebagai wujud kepedulian.",
    position: 3,
    is_active: true,
  },
  {
    id: '5',
    icon: 'GraduationCap',
    title: "Pendampingan Akademik",
    description: "Dukungan belajar dan manajemen waktu agar santri tetap berprestasi di kampus.",
    position: 4,
    is_active: true,
  },
  {
    id: '6',
    icon: 'Globe',
    title: "Pengembangan Skill",
    description: "Pelatihan public speaking, leadership, dan keterampilan digital untuk masa depan.",
    position: 5,
    is_active: true,
  },
];



export function ProgramsSection() {
  const [settings, setSettings] = useState<ProgramsSettings>(defaultSettings);
  const [programs, setPrograms] = useState<Program[]>([]);
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
        const settingsMap: Partial<ProgramsSettings> = {};
        settingsData.forEach((item) => {
          if (item.key.startsWith('programs_') && item.value) {
            settingsMap[item.key as keyof ProgramsSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }

      // Fetch programs from database
      const { data: programsData, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_active', true)
        .order('position', { ascending: true });

      if (error) throw error;

      // Use database programs if available, otherwise use fallback
      if (programsData && programsData.length > 0) {
        setPrograms(programsData);
      } else {
        setPrograms(fallbackPrograms as Program[]);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setPrograms(fallbackPrograms as Program[]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    const IconComponent = iconMap[iconName || 'BookOpen'] || BookOpen;
    return IconComponent;
  };

  return (
    <section id="program" className="py-24 bg-slate-50 relative">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

      <div className="container-section relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <span className="text-primary font-bold text-sm uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm">
            {settings.programs_section_label}
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-slate-900">{settings.programs_section_title}</h2>
          <p className="text-xl text-slate-600 font-light leading-relaxed">
            {settings.programs_section_subtitle}
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => {
            const IconComponent = getIcon(program.icon);
            // Simple slugify for linking
            const programSlug = program.title
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');

            return (
              <Card
                key={program.id}
                className="group relative overflow-hidden bg-white border-none shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <CardHeader className="pt-8 px-8 pb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 bg-slate-50 group-hover:bg-primary text-slate-600 group-hover:text-white shadow-inner group-hover:shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
                  >
                    <IconComponent className="w-8 h-8 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <CardTitle className="text-2xl font-heading font-bold text-slate-800 group-hover:text-primary transition-colors">
                    {program.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex-grow">
                  <CardDescription className="text-base text-slate-600 leading-relaxed mb-6">
                    {program.description}
                  </CardDescription>

                  <div className="mt-auto">
                    <a
                      href={`/p/${programSlug}`}
                      className="inline-flex items-center text-sm font-bold text-primary hover:text-secondary transition-colors group/btn"
                    >
                      Pelajari Lebih Lanjut
                      <svg className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
