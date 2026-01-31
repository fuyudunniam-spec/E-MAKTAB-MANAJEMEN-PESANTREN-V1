import { MainLayout } from "@/components/layout/MainLayout";
import { Link, useParams } from "react-router-dom";
import { Search, Calendar, User, ArrowRight, ArrowLeft, Loader2, FileText, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Helmet } from "react-helmet";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  author: string;
  category: string;
  image_url: string | null;
  published_at: string | null;
  tags: string[] | null;
}

const TagPage = () => {
  const { slug } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const tagName = slug ? decodeURIComponent(slug).replace(/-/g, ' ') : '';

  useEffect(() => {
    if (slug) {
      fetchPostsByTag();
    }
  }, [slug]);

  const fetchPostsByTag = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, slug, title, excerpt, author, category, image_url, published_at, tags')
        .eq('is_published', true)
        .contains('tags', [tagName])
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'd MMM yyyy', { locale: id });
  };

  const siteName = "Pesantren An-Nur";
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Generate JSON-LD schema for tag page
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Tag: ${tagName} | ${siteName}`,
    "description": `Artikel dengan tag "${tagName}" di ${siteName}. Temukan artikel terkait topik ${tagName}.`,
    "url": currentUrl,
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/favicon.ico`
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filtered.length,
      "itemListElement": filtered.map((post, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt || '',
          "url": `${baseUrl}/blog/${post.slug}`,
          "image": post.image_url || undefined,
          "datePublished": post.published_at || undefined,
          "author": {
            "@type": "Person",
            "name": post.author
          },
          "articleSection": post.category,
          "keywords": tagName
        }
      }))
    }
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Tag: {tagName} | {siteName}</title>
        <meta name="description" content={`Artikel dengan tag "${tagName}" di ${siteName}. Temukan artikel terkait topik ${tagName}.`} />
        <meta property="og:title" content={`Tag: ${tagName} | ${siteName}`} />
        <meta property="og:description" content={`Artikel dengan tag "${tagName}" di ${siteName}.`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`Tag: ${tagName} | ${siteName}`} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </Helmet>

      <section className="py-16 bg-surface min-h-screen">
        <div className="container-section">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Blog</Link>
          </Button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Tag className="w-5 h-5" />
              <span className="font-medium capitalize">{tagName}</span>
            </div>
            <h1 className="section-title">Artikel dengan Tag "{tagName}"</h1>
            <p className="section-subtitle">{posts.length} artikel ditemukan</p>
          </div>

          <div className="relative max-w-md mx-auto mb-12">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Cari artikel..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'Artikel tidak ditemukan' : `Tidak ada artikel dengan tag "${tagName}"`}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(post => (
                <Link to={`/blog/${post.slug}`} key={post.id} className="block">
                  <article className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all cursor-pointer h-full">
                    <div className="aspect-video overflow-hidden bg-muted">
                      {post.image_url ? (
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-medium text-secondary-foreground dark:text-secondary bg-secondary/20 px-2 py-1 rounded">{post.category}</span>
                      <h2 className="font-semibold text-foreground mt-3 mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt || 'Klik untuk membaca artikel lengkap...'}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.published_at)}</span>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                        </div>
                        <span className="text-primary flex items-center gap-1">Baca <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default TagPage;
