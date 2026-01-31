import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';

interface Page {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  featured_image: string | null;
  is_published: boolean;
}

interface PageBlock {
  id: string;
  type: string;
  content: Record<string, any>;
  position: number;
}

export default function PageSingle() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';
  
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        // Build query - for preview mode, don't filter by is_published
        let query = supabase
          .from('pages')
          .select('*')
          .eq('slug', slug);
        
        // Only filter by is_published if not in preview mode
        if (!isPreviewMode) {
          query = query.eq('is_published', true);
        }

        const { data: pageData, error: pageError } = await query.maybeSingle();

        if (pageError) throw pageError;
        
        if (!pageData) {
          setError('Halaman tidak ditemukan');
          setLoading(false);
          return;
        }

        setPage(pageData);

        const { data: blocksData, error: blocksError } = await supabase
          .from('page_blocks')
          .select('*')
          .eq('page_id', pageData.id)
          .order('position', { ascending: true });

        if (blocksError) throw blocksError;
        setBlocks((blocksData || []).map(block => ({
          id: block.id,
          type: block.type,
          content: block.content as Record<string, any>,
          position: block.position,
        })));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug, isPreviewMode]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !page) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Halaman Tidak Ditemukan</h1>
          <p className="text-muted-foreground">{error || 'Halaman yang Anda cari tidak tersedia.'}</p>
        </div>
      </MainLayout>
    );
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const siteName = "Pesantren An-Nur";

  return (
    <MainLayout>
      <Helmet>
        <title>{page.title} | {siteName}</title>
        {page.meta_description && <meta name="description" content={page.meta_description} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={page.title} />
        <meta property="og:type" content="website" />
        {page.meta_description && <meta property="og:description" content={page.meta_description} />}
        {page.featured_image && <meta property="og:image" content={page.featured_image} />}
        <meta property="og:url" content={currentUrl} />
        <meta property="og:site_name" content={siteName} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content={page.featured_image ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={page.title} />
        {page.meta_description && <meta name="twitter:description" content={page.meta_description} />}
        {page.featured_image && <meta name="twitter:image" content={page.featured_image} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
        
        {/* Robots directive */}
        <meta name="robots" content={page.is_published ? "index, follow" : "noindex, nofollow"} />
      </Helmet>

      {/* Preview Mode Banner */}
      {isPreviewMode && !page.is_published && (
        <div className="bg-amber-500/90 text-amber-950 py-2 px-4 text-center text-sm font-medium">
          <Badge variant="outline" className="mr-2 border-amber-950 text-amber-950">PREVIEW</Badge>
          Anda sedang melihat preview halaman draft. Halaman ini belum dipublikasikan.
        </div>
      )}

      {/* Featured Image */}
      {page.featured_image && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={page.featured_image}
            alt={page.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">{page.title}</h1>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-16">
        {!page.featured_image && (
          <h1 className="text-3xl md:text-5xl font-bold mb-8">{page.title}</h1>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

function BlockRenderer({ block }: { block: PageBlock }) {
  const { type, content } = block;

  switch (type) {
    case 'text':
      return (
        <p className="whitespace-pre-wrap leading-relaxed mb-6">
          {content.text}
        </p>
      );

    case 'heading':
      const HeadingTag = `h${content.level || 2}` as keyof JSX.IntrinsicElements;
      const headingClasses: Record<number, string> = {
        1: 'text-4xl font-bold mb-6',
        2: 'text-3xl font-bold mb-5',
        3: 'text-2xl font-semibold mb-4',
        4: 'text-xl font-semibold mb-3',
      };
      return (
        <HeadingTag className={headingClasses[content.level] || headingClasses[2]}>
          {content.text}
        </HeadingTag>
      );

    case 'image':
      return (
        <figure className="my-8">
          <img
            src={content.url}
            alt={content.alt || ''}
            className="w-full rounded-lg"
          />
          {content.caption && (
            <figcaption className="text-center text-muted-foreground mt-2 text-sm">
              {content.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'gallery':
      const images = content.images || [];
      const columns = content.columns || 3;
      const gridCols = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3';
      
      return (
        <figure className="my-8">
          <div className={`grid ${gridCols} gap-4`}>
            {images.map((image: { url: string; alt: string; caption?: string }, index: number) => (
              <div key={index} className="group relative overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.alt || `Galeri ${index + 1}`}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
          {content.caption && (
            <figcaption className="text-center text-muted-foreground mt-3 text-sm">
              {content.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'video':
      const videoUrl = content.url || '';
      let embedUrl = videoUrl;
      
      // Convert YouTube URLs to embed format
      if (videoUrl.includes('youtube.com/watch')) {
        const videoId = new URL(videoUrl).searchParams.get('v');
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (videoUrl.includes('vimeo.com/')) {
        const videoId = videoUrl.split('vimeo.com/')[1]?.split('?')[0];
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      return (
        <figure className="my-8">
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          {content.caption && (
            <figcaption className="text-center text-muted-foreground mt-2 text-sm">
              {content.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'embed':
      return (
        <div 
          className="my-8" 
          dangerouslySetInnerHTML={{ __html: content.code || '' }} 
        />
      );

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-6 py-2 my-8 italic">
          <p className="text-lg">{content.text}</p>
          {content.author && (
            <footer className="text-muted-foreground mt-2">— {content.author}</footer>
          )}
        </blockquote>
      );

    case 'list':
      const ListTag = content.ordered ? 'ol' : 'ul';
      return (
        <ListTag className={`my-6 pl-6 space-y-2 ${content.ordered ? 'list-decimal' : 'list-disc'}`}>
          {(content.items || []).map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ListTag>
      );

    default:
      return null;
  }
}
