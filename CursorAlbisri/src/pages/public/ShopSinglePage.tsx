import { MainLayout } from "@/components/layout/MainLayout";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Loader2, BookOpen, Calendar, Building2, FileText, Hash, Globe, BookMarked, ExternalLink, Eye, Layers, Tag, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";
import { ImageZoomModal } from "@/components/ImageZoomModal";
import { RelatedProducts } from "@/components/RelatedProducts";
import { ShareButtons } from "@/components/ShareButtons";
import { CitationButtons } from "@/components/CitationButtons";
import { PDFViewer } from "@/components/PDFViewer";

interface Book {
  id: string;
  name: string;
  slug: string;
  author: string | null;
  author_family_name: string | null;
  author_affiliation: string | null;
  editor: string | null;
  publisher: string | null;
  publisher_city: string | null;
  publish_year: number | null;
  edition: string | null;
  pages: number | null;
  language: string | null;
  isbn: string | null;
  doi: string | null;
  abstract: string | null;
  table_of_contents: string | null;
  keywords: string[] | null;
  book_format: string | null;
  preview_link: string | null;
  preview_pdf: string | null;
  purchase_link: string | null;
  category: string;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  is_on_sale: boolean | null;
  stock: number | null;
  image_url: string | null;
}

const ShopSinglePage = () => {
  const { slug } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBook();
    }
  }, [slug]);

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setNotFound(true);
      } else {
        setBook(data);
      }
    } catch (error) {
      console.error('Error fetching book:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (notFound || !book) {
    return (
      <MainLayout>
        <div className="py-16 text-center">
          <div className="container-section max-w-4xl">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Buku Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-6">Buku yang Anda cari tidak tersedia atau sudah dihapus.</p>
            <Button asChild>
              <Link to="/shop">Kembali ke Katalog</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const waLink = `https://wa.me/6281234567890?text=Assalamu'alaikum,%20saya%20ingin%20memesan%20buku%20"${encodeURIComponent(book.name)}"`;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Format citation (Academic style)
  const formatCitation = () => {
    const parts = [];
    if (book.author) parts.push(book.author);
    if (book.publish_year) parts.push(`(${book.publish_year}).`);
    parts.push(`${book.name}.`);
    if (book.edition) parts.push(`${book.edition}.`);
    if (book.publisher) parts.push(`${book.publisher}.`);
    if (book.isbn) parts.push(`ISBN: ${book.isbn}.`);
    return parts.join(' ');
  };

  // Parse table of contents
  const parseToc = () => {
    if (!book.table_of_contents) return [];
    return book.table_of_contents.split('\n').filter(line => line.trim());
  };

  // Calculate discount percentage if not set
  const getDiscountPercentage = () => {
    if (book.discount_percentage) return book.discount_percentage;
    if (book.discount_price && book.price > 0) {
      return Math.round(((book.price - book.discount_price) / book.price) * 100);
    }
    return 0;
  };

  const isOnSale = book.is_on_sale && book.discount_price && book.discount_price < book.price;
  const discountPercent = getDiscountPercentage();

  return (
    <MainLayout>
      {/* SEO Meta Tags for Google Scholar */}
      <Helmet>
        <title>{book.name} | Toko Buku Pesantren An-Nur</title>
        <meta name="description" content={book.abstract || `${book.name} oleh ${book.author}`} />
        
        {/* Google Scholar Meta Tags */}
        <meta name="citation_title" content={book.name} />
        {book.author && <meta name="citation_author" content={book.author} />}
        {book.author_family_name && <meta name="citation_author_lastname" content={book.author_family_name} />}
        {book.author_affiliation && <meta name="citation_author_institution" content={book.author_affiliation} />}
        {book.editor && <meta name="citation_editor" content={book.editor} />}
        {book.publish_year && <meta name="citation_publication_date" content={String(book.publish_year)} />}
        {book.publisher && <meta name="citation_publisher" content={book.publisher} />}
        {book.isbn && <meta name="citation_isbn" content={book.isbn} />}
        {book.doi && <meta name="citation_doi" content={book.doi} />}
        {book.language && <meta name="citation_language" content={book.language} />}
        {book.abstract && <meta name="citation_abstract" content={book.abstract} />}
        {book.keywords?.map((keyword, i) => (
          <meta key={i} name="citation_keywords" content={keyword} />
        ))}
        
        {/* Dublin Core Metadata */}
        <meta name="DC.title" content={book.name} />
        {book.author && <meta name="DC.creator" content={book.author} />}
        {book.editor && <meta name="DC.contributor" content={book.editor} />}
        {book.publish_year && <meta name="DC.date" content={String(book.publish_year)} />}
        {book.publisher && <meta name="DC.publisher" content={book.publisher} />}
        {book.language && <meta name="DC.language" content={book.language} />}
        <meta name="DC.type" content="Book" />
        {book.isbn && <meta name="DC.identifier" content={`ISBN:${book.isbn}`} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={book.name} />
        <meta property="og:type" content="book" />
        <meta property="og:description" content={book.abstract || ''} />
        {book.image_url && <meta property="og:image" content={book.image_url} />}
        <meta property="og:url" content={currentUrl} />
        {book.isbn && <meta property="book:isbn" content={book.isbn} />}
        {book.author && <meta property="book:author" content={book.author} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={book.name} />
        <meta name="twitter:description" content={book.abstract || `${book.name} oleh ${book.author}`} />
        {book.image_url && <meta name="twitter:image" content={book.image_url} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      <article className="py-8 md:py-16">
        <div className="container-section max-w-5xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/shop"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Katalog</Link>
          </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Book Cover - Left Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-xl overflow-hidden bg-muted shadow-lg relative">
                  {/* Sale Badge */}
                  {isOnSale && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-destructive text-destructive-foreground font-bold text-sm px-3 py-1">
                        <Percent className="w-3 h-3 mr-1" />
                        DISKON {discountPercent}%
                      </Badge>
                    </div>
                  )}
                  
                  {book.image_url ? (
                    <ImageZoomModal src={book.image_url} alt={`Sampul buku ${book.name}`}>
                      <img 
                        src={book.image_url} 
                        alt={`Sampul buku ${book.name}`} 
                        className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute bottom-3 right-3 bg-background/80 px-2 py-1 rounded text-xs text-muted-foreground">
                        Klik untuk zoom
                      </div>
                    </ImageZoomModal>
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center bg-muted">
                      <BookOpen className="w-24 h-24 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                
                {/* Price & Order */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="text-center">
                      {isOnSale ? (
                        <>
                          <p className="text-lg text-muted-foreground line-through">
                            Rp {book.price.toLocaleString('id-ID')}
                          </p>
                          <p className="text-3xl font-bold text-destructive">
                            Rp {book.discount_price?.toLocaleString('id-ID')}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            <Tag className="w-3 h-3 mr-1" />
                            Hemat Rp {(book.price - (book.discount_price || 0)).toLocaleString('id-ID')}
                          </Badge>
                        </>
                      ) : (
                        <p className="text-3xl font-bold text-primary">
                          Rp {book.price.toLocaleString('id-ID')}
                        </p>
                      )}
                      {book.stock !== null && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {book.stock > 0 ? `Stok: ${book.stock} tersedia` : 'Stok habis'}
                        </p>
                      )}
                      {book.book_format && (
                        <Badge variant="outline" className="mt-2">
                          <Layers className="w-3 h-3 mr-1" />
                          {book.book_format}
                        </Badge>
                      )}
                    </div>
                    <Button size="lg" className="w-full" asChild disabled={book.stock === 0}>
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Pesan Sekarang
                      </a>
                    </Button>
                    {book.purchase_link && (
                      <Button size="lg" variant="outline" className="w-full" asChild>
                        <a href={book.purchase_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Beli di Marketplace
                        </a>
                      </Button>
                    )}
                    {book.preview_link && (
                      <Button size="lg" variant="ghost" className="w-full" asChild>
                        <a href={book.preview_link} target="_blank" rel="noopener noreferrer">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Preview
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Book Details - Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <header>
                <Badge className="mb-3">{book.category}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  {book.name}
                </h1>
                {book.author && (
                  <div className="space-y-1">
                    <p className="text-lg text-muted-foreground">
                      oleh <span className="text-foreground font-medium">{book.author}</span>
                    </p>
                    {book.author_affiliation && (
                      <p className="text-sm text-muted-foreground italic">
                        {book.author_affiliation}
                      </p>
                    )}
                  </div>
                )}
              </header>

              {/* Publication Info Grid */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {book.publisher && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Penerbit</p>
                          <p className="text-sm font-medium">{book.publisher}</p>
                        </div>
                      </div>
                    )}
                    {book.publish_year && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tahun Terbit</p>
                          <p className="text-sm font-medium">{book.publish_year}</p>
                        </div>
                      </div>
                    )}
                    {book.pages && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Halaman</p>
                          <p className="text-sm font-medium">{book.pages} halaman</p>
                        </div>
                      </div>
                    )}
                    {book.isbn && (
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">ISBN / ISSN</p>
                          <p className="text-sm font-medium">{book.isbn}</p>
                        </div>
                      </div>
                    )}
                    {book.language && (
                      <div className="flex items-start gap-2">
                        <Globe className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Bahasa</p>
                          <p className="text-sm font-medium">{book.language}</p>
                        </div>
                      </div>
                    )}
                    {book.edition && (
                      <div className="flex items-start gap-2">
                        <BookMarked className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Edisi</p>
                          <p className="text-sm font-medium">{book.edition}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Abstract */}
              {book.abstract && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Abstrak</h2>
                  <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {book.abstract}
                    </p>
                  </div>
                </section>
              )}

              {/* Keywords */}
              {book.keywords && book.keywords.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Kata Kunci</h2>
                  <div className="flex flex-wrap gap-2">
                    {book.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Table of Contents */}
              {book.table_of_contents && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Daftar Isi</h2>
                  <Card>
                    <CardContent className="p-4">
                      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        {parseToc().map((item, index) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </section>
              )}

              <Separator />

              {/* Citation with Copy Buttons */}
              <section>
                <h2 className="text-lg font-semibold mb-3">Cara Mengutip</h2>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground italic font-serif">
                      {formatCitation()}
                    </p>
                    <Separator />
                    <CitationButtons
                      title={book.name}
                      author={book.author}
                      authorFamilyName={book.author_family_name}
                      editor={book.editor}
                      publisher={book.publisher}
                      publisherCity={book.publisher_city}
                      publishYear={book.publish_year}
                      edition={book.edition}
                      pages={book.pages}
                      doi={book.doi}
                      isbn={book.isbn}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* PDF Preview */}
              {book.preview_pdf && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">Preview Buku (PDF)</h2>
                  <PDFViewer pdfUrl={book.preview_pdf} title={book.name} />
                </section>
              )}

              {/* DOI if available */}
              {book.doi && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">DOI</h2>
                  <a 
                    href={`https://doi.org/${book.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    https://doi.org/{book.doi}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </section>
              )}

              {/* Share Buttons */}
              <Separator />
              <section>
                <ShareButtons 
                  url={currentUrl} 
                  title={book.name} 
                  description={book.abstract || `${book.name} oleh ${book.author}`} 
                />
              </section>
            </div>
          </div>

          {/* Related Products */}
          <RelatedProducts
            currentProductId={book.id}
            category={book.category}
            productType="book"
          />
        </div>
      </article>

      {/* JSON-LD Structured Data for Google Scholar */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Book",
          "name": book.name,
          "author": book.author ? {
            "@type": "Person",
            "name": book.author,
            "familyName": book.author_family_name || undefined,
            "affiliation": book.author_affiliation ? {
              "@type": "Organization",
              "name": book.author_affiliation
            } : undefined
          } : undefined,
          "editor": book.editor ? {
            "@type": "Person",
            "name": book.editor
          } : undefined,
          "publisher": book.publisher ? {
            "@type": "Organization",
            "name": book.publisher
          } : undefined,
          "datePublished": book.publish_year ? String(book.publish_year) : undefined,
          "isbn": book.isbn || undefined,
          "numberOfPages": book.pages || undefined,
          "inLanguage": book.language || undefined,
          "abstract": book.abstract || undefined,
          "keywords": book.keywords?.join(", ") || undefined,
          "image": book.image_url || undefined,
          "bookFormat": book.book_format === 'PDF' ? "EBook" : book.book_format === 'eBook' ? "EBook" : "Paperback",
          "offers": {
            "@type": "Offer",
            "price": book.price,
            "priceCurrency": "IDR",
            "availability": book.stock && book.stock > 0 
              ? "https://schema.org/InStock" 
              : "https://schema.org/OutOfStock"
          }
        })}
      </script>
    </MainLayout>
  );
};

export default ShopSinglePage;
