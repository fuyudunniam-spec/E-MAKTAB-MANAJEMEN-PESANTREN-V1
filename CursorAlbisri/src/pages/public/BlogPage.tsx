import { MainLayout } from "@/components/layout/MainLayout";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Calendar, User, ArrowRight, Loader2, FileText, Tag, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Helmet } from "react-helmet";
import { Badge } from "@/components/ui/badge";

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

const POSTS_PER_PAGE = 9;

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const selectedCategory = searchParams.get("category") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, slug, title, excerpt, author, category, image_url, published_at, tags')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAllPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter posts
  const filtered = useMemo(() => {
    return allPosts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allPosts, search, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filtered.slice(start, start + POSTS_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (cat: string) => {
    const params = new URLSearchParams();
    if (cat) {
      params.set("category", cat);
    }
    setSearchParams(params);
  };

  // Calculate categories with counts
  const categories = useMemo(() => {
    const catCount: Record<string, number> = {};
    allPosts.forEach(post => {
      catCount[post.category] = (catCount[post.category] || 0) + 1;
    });
    return Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  }, [allPosts]);

  // Calculate popular tags
  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    allPosts.forEach(post => {
      post.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [allPosts]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'd MMM yyyy', { locale: id });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const siteName = "Pesantren An-Nur";
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Generate JSON-LD ItemList schema for blog listing
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Blog & Kajian | Pesantren An-Nur",
    "description": "Artikel, kajian Islam, dan pengumuman resmi dari Pesantren An-Nur.",
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
      "itemListElement": paginatedPosts.map((post, index) => ({
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
          "articleSection": post.category
        }
      }))
    }
  };

  return (
    <MainLayout>
      <Helmet>
        <title>Blog & Kajian | Pesantren An-Nur</title>
        <meta name="description" content="Artikel, kajian Islam, dan pengumuman resmi dari Pesantren An-Nur. Dapatkan ilmu dan wawasan keislaman terbaru." />
        <meta property="og:title" content="Blog & Kajian | Pesantren An-Nur" />
        <meta property="og:description" content="Artikel, kajian Islam, dan pengumuman resmi dari Pesantren An-Nur." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Blog & Kajian | Pesantren An-Nur" />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema)}
        </script>
      </Helmet>

      <section className="py-16 bg-surface min-h-screen">
        <div className="container-section">
          <div className="text-center mb-12">
            <h1 className="section-title">Blog & Kajian An-Nur</h1>
            <p className="section-subtitle">Artikel, kajian, dan pengumuman dari Pesantren An-Nur</p>
          </div>
          <div className="relative max-w-md mx-auto mb-12">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Cari artikel..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paginatedPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {search || selectedCategory ? 'Artikel tidak ditemukan' : 'Belum ada artikel tersedia'}
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedPosts.map(post => (
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => goToPage(page as number)}
                          >
                            {page}
                          </Button>
                        )
                      ))}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Menampilkan {((currentPage - 1) * POSTS_PER_PAGE) + 1}-{Math.min(currentPage * POSTS_PER_PAGE, filtered.length)} dari {filtered.length} artikel
                  </p>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-72 shrink-0 space-y-6">
              {/* Categories */}
              <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Kategori
                </h3>
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada kategori</p>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleCategoryChange("")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !selectedCategory 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      Semua <span className="opacity-70">({allPosts.length})</span>
                    </button>
                    {categories.map(([cat, count]) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === cat 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {cat} <span className="opacity-70">({count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Tags */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-primary" />
                  Popular Tags
                </h3>
                {popularTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada tag</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(([tag, count]) => (
                      <Link key={tag} to={`/tag/${encodeURIComponent(tag)}`}>
                        <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                          {tag} <span className="ml-1 text-xs opacity-70">({count})</span>
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BlogPage;
