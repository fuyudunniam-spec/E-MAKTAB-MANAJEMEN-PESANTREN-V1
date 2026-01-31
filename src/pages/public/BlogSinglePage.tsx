import { MainLayout } from "@/components/layout/MainLayout";
import { Link, useParams } from "react-router-dom";
import { Calendar, ArrowLeft, Loader2, FileText, User, Tag, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Helmet } from "react-helmet";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { Separator } from "@/components/ui/separator";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  author: string;
  category: string;
  image_url: string | null;
  tags: string[] | null;
  published_at: string | null;
}

interface Author {
  name: string;
  image_url: string | null;
  bio: string | null;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string | null;
}

const BlogSinglePage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
      window.scrollTo(0, 0);
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
      } else {
        setPost(data);
        fetchRelatedPosts(data.id, data.category, data.tags);
        fetchAuthor(data.author);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthor = async (authorName: string) => {
    try {
      const { data } = await supabase
        .from('authors')
        .select('name, image_url, bio')
        .eq('name', authorName)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setAuthor(data);
      }
    } catch (error) {
      console.error('Error fetching author:', error);
    }
  };

  const fetchRelatedPosts = async (currentId: string, category: string, tags: string[] | null) => {
    try {
      // First try to get posts with matching tags
      if (tags && tags.length > 0) {
        const { data: tagRelated } = await supabase
          .from('posts')
          .select('id, title, slug, image_url, published_at')
          .eq('is_published', true)
          .neq('id', currentId)
          .overlaps('tags', tags)
          .limit(3);

        if (tagRelated && tagRelated.length > 0) {
          setRelatedPosts(tagRelated);
          return;
        }
      }

      // Fallback to category-based related posts
      const { data } = await supabase
        .from('posts')
        .select('id, title, slug, image_url, published_at')
        .eq('is_published', true)
        .eq('category', category)
        .neq('id', currentId)
        .limit(3);

      setRelatedPosts(data || []);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  const getTagSlug = (tag: string) => {
    return encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: id });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (notFound || !post) {
    return (
      <MainLayout>
        <div className="py-24 text-center bg-slate-50 min-h-[60vh] flex flex-col items-center justify-center">
          <div className="max-w-md px-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-3">Artikel Tidak Ditemukan</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">Maaf, artikel yang Anda cari mungkin telah dihapus atau URL yang Anda tuju salah.</p>
            <Button asChild className="rounded-full px-8">
              <Link to="/blog">Kembali ke Blog</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const siteName = "Pesantren An-Nur";

  return (
    <MainLayout>
      <Helmet>
        <title>{post.title} | Blog {siteName}</title>
        <meta name="description" content={post.excerpt || `Baca artikel ${post.title} di blog ${siteName}`} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
        <meta property="og:description" content={post.excerpt || ''} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content={siteName} />
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        <meta property="article:author" content={post.author} />
        <meta property="article:section" content={post.category} />
        {post.tags && post.tags.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}

        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      <article className="bg-white min-h-screen pb-24">
        {/* Article Header */}
        <header className="pt-24 pb-12 px-4 bg-slate-50 border-b border-slate-100">
          <div className="container-section max-w-4xl mx-auto text-center">
            <Link to="/blog" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>

            <div className="mb-6">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
                {post.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-slate-900 leading-tight mb-6">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl md:text-2xl text-slate-600 font-light italic leading-relaxed max-w-2xl mx-auto mb-8 font-heading">
                "{post.excerpt}"
              </p>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-slate-200">
                  <AvatarImage src={author?.image_url || undefined} alt={post.author} />
                  <AvatarFallback className="bg-primary text-white font-bold">{getInitials(post.author)}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="font-bold text-slate-900">{post.author}</div>
                  <div className="text-xs text-slate-500">Penulis</div>
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-slate-300"></div>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(post.published_at)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  5 min read
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image - Wide */}
        {post.image_url && (
          <div className="w-full max-w-6xl mx-auto -mt-8 md:-mt-12 px-4 mb-16 relative z-10">
            <div className="aspect-[21/9] overflow-hidden rounded-2xl shadow-2xl">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="text-center mt-3 text-sm text-slate-400 italic">
              Ilustrasi: {post.title}
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="container-section max-w-3xl mx-auto px-4">
          <div className="flex justify-center mb-8 md:hidden">
            <ShareButtons url={currentUrl} title={post.title} />
          </div>

          <div
            className="prose prose-lg md:prose-xl max-w-none text-slate-700 prose-headings:font-heading prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-slate-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:font-heading font-serif"
            dangerouslySetInnerHTML={{ __html: post.content || '<p>Konten artikel tidak tersedia.</p>' }}
          />

          {/* Social Share & Tags */}
          <div className="mt-16 pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-wrap gap-2">
                {post.tags && post.tags.map((tag, index) => (
                  <Link key={index} to={`/tag/${getTagSlug(tag)}`}>
                    <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 text-sm font-normal">
                      #{tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Bagikan:</span>
                <ShareButtons url={currentUrl} title={post.title} />
              </div>
            </div>
          </div>

          {/* Author Bio Box */}
          {author && (
            <div className="mt-16 p-8 bg-slate-50 rounded-2xl flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
              <Avatar className="w-20 h-20 border-2 border-white shadow-lg">
                <AvatarImage src={author.image_url || undefined} alt={author.name} />
                <AvatarFallback className="text-xl bg-primary text-white">{getInitials(author.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-heading font-bold text-xl text-slate-900 mb-2">Tentang {author.name}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{author.bio || "Penulis konten di Pesantren Mahasiswa An-Nur."}</p>
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link to="#">Lihat Artikel Lainnya</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-24 py-16 bg-slate-50 border-t border-slate-200">
            <div className="container-section max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Artikel Terkait</h3>
                <Link to="/blog" className="text-primary font-medium hover:underline">Lihat Semua</Link>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                    <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
                      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <FileText className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="text-xs text-slate-500 mb-3 flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {formatDate(post.published_at)}
                        </div>
                        <h4 className="font-heading font-bold text-xl text-slate-900 leading-tight group-hover:text-primary transition-colors mb-2">
                          {post.title}
                        </h4>
                        <span className="text-primary text-sm font-medium mt-auto inline-flex items-center group-hover:translate-x-1 transition-transform">
                          Baca Artikel <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </MainLayout>
  );
};

export default BlogSinglePage;
