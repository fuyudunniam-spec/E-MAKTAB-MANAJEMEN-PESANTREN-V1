import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Loader2, Megaphone, Bell, AlertTriangle, Info, Gift, Star, Heart, BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  link: string | null;
  icon: string | null;
  published_at: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  megaphone: Megaphone,
  bell: Bell,
  calendar: Calendar,
  alert: AlertTriangle,
  info: Info,
  gift: Gift,
  star: Star,
  heart: Heart,
  book: BookOpen,
  users: Users,
};

const getIcon = (iconName: string | null) => {
  return iconMap[iconName || 'megaphone'] || Megaphone;
};

export function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, link, icon, published_at')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd MMMM yyyy', { locale: id });
  };

  if (loading) {
    return (
      <section className="py-20 bg-surface">
        <div className="container-section flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-surface">
      <div className="container-section">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Kabar Terbaru
            </span>
            <h2 className="section-title mt-2">Pengumuman Terbaru</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/blog">
              Lihat Semua
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((item, index) => {
            const IconComponent = getIcon(item.icon);
            return (
              <article 
                key={item.id}
                className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-card transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon - Using consistent primary color */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <time>{formatDate(item.published_at)}</time>
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.content && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{item.content}</p>
                    )}
                  </div>
                  
                  {item.link ? (
                    <a 
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium whitespace-nowrap transition-colors"
                    >
                      Lihat Detail
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </a>
                  ) : (
                    <Link 
                      to="/blog" 
                      className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium whitespace-nowrap transition-colors"
                    >
                      Lihat Detail
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
