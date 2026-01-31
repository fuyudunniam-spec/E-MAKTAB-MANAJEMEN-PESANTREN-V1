import { MainLayout } from "@/components/layout/MainLayout";
import { Search, ShoppingBag, Loader2, Percent, X, Filter, ArrowUpDown, ArrowUp, ArrowDown, BookOpen, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  discount_price: number | null;
  discount_percentage: number | null;
  is_on_sale: boolean | null;
  category: string;
  image_url: string | null;
  publish_year: number | null;
  product_type: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'year-new' | 'year-old';
type ProductTypeFilter = 'all' | 'book' | 'general';

const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [productType, setProductType] = useState<ProductTypeFilter>('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, price, discount_price, discount_percentage, is_on_sale, category, image_url, publish_year, product_type')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('type', 'product')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getDiscountPercentage = (product: Product) => {
    if (product.discount_percentage) return product.discount_percentage;
    if (product.discount_price && product.price > 0) {
      return Math.round(((product.price - product.discount_price) / product.price) * 100);
    }
    return 0;
  };

  const getEffectivePrice = (product: Product) => {
    if (product.is_on_sale && product.discount_price) {
      return product.discount_price;
    }
    return product.price;
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearch("");
    setSortBy('newest');
    setProductType('all');
  };

  // Count products by type
  const productCounts = useMemo(() => {
    const books = products.filter(p => p.product_type === 'book').length;
    const general = products.filter(p => p.product_type === 'general').length;
    return { books, general, all: products.length };
  }, [products]);

  const sortedAndFiltered = useMemo(() => {
    // First filter
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesType = productType === 'all' || p.product_type === productType;
      return matchesSearch && matchesCategory && matchesType;
    });

    // Then sort
    switch (sortBy) {
      case 'newest':
        // Already sorted by created_at desc from query
        break;
      case 'oldest':
        result = [...result].reverse();
        break;
      case 'price-low':
        result = [...result].sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case 'price-high':
        result = [...result].sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'id'));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.name.localeCompare(a.name, 'id'));
        break;
      case 'year-new':
        result = [...result].sort((a, b) => (b.publish_year || 0) - (a.publish_year || 0));
        break;
      case 'year-old':
        result = [...result].sort((a, b) => (a.publish_year || 0) - (b.publish_year || 0));
        break;
    }

    return result;
  }, [products, search, selectedCategories, sortBy, productType]);

  const hasActiveFilters = selectedCategories.length > 0 || search.length > 0 || sortBy !== 'newest' || productType !== 'all';

  return (
    <MainLayout>
      <Helmet>
        <title>Toko Buku & Produk | Pesantren An-Nur</title>
        <meta name="description" content="Beli buku-buku Islami, kitab, dan produk resmi Pesantren An-Nur. Koleksi buku berkualitas untuk kajian dan pembelajaran." />
        <meta property="og:title" content="Toko Buku & Produk | Pesantren An-Nur" />
        <meta property="og:description" content="Beli buku-buku Islami, kitab, dan produk resmi Pesantren An-Nur." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Toko Buku & Produk | Pesantren An-Nur" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
        
        {/* Scholar-friendly hints */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </Helmet>

      <section className="py-16 bg-surface min-h-screen">
        <div className="container-section">
          <div className="text-center mb-12">
            <h1 className="section-title">Toko An-Nur</h1>
            <p className="section-subtitle">Buku, merchandise, dan produk resmi Pesantren An-Nur</p>
          </div>

          {/* Product Type Tabs */}
          <div className="max-w-4xl mx-auto mb-6">
            <Tabs value={productType} onValueChange={(v) => setProductType(v as ProductTypeFilter)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Semua ({productCounts.all})
                </TabsTrigger>
                <TabsTrigger value="book" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Buku ({productCounts.books})
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produk Lain ({productCounts.general})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search & Filter Section */}
          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Cari produk..." 
                  className="pl-10" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[200px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="price-low">
                    <span className="flex items-center gap-1">
                      Harga <ArrowUp className="w-3 h-3" /> Terendah
                    </span>
                  </SelectItem>
                  <SelectItem value="price-high">
                    <span className="flex items-center gap-1">
                      Harga <ArrowDown className="w-3 h-3" /> Tertinggi
                    </span>
                  </SelectItem>
                  <SelectItem value="name-asc">Nama A-Z</SelectItem>
                  <SelectItem value="name-desc">Nama Z-A</SelectItem>
                  {productType !== 'general' && (
                    <>
                      <SelectItem value="year-new">Tahun Terbaru</SelectItem>
                      <SelectItem value="year-old">Tahun Terlama</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Kategori:</span>
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={selectedCategories.includes(category.name) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleCategory(category.name)}
                  >
                    {category.name}
                    {selectedCategories.includes(category.name) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>

              {/* Active Filters & Clear */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Menampilkan {sortedAndFiltered.length} dari {products.length} produk
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    <X className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedAndFiltered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{hasActiveFilters ? 'Tidak ada produk yang sesuai filter' : 'Belum ada produk tersedia'}</p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Hapus semua filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedAndFiltered.map(product => {
                const isOnSale = product.is_on_sale && product.discount_price && product.discount_price < product.price;
                const discountPercent = getDiscountPercentage(product);
                
                return (
                  <Link to={`/shop/${product.slug}`} key={product.id} className="block">
                    <article className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all cursor-pointer h-full">
                      <div className="aspect-square overflow-hidden bg-muted relative">
                        {/* Discount Badge */}
                        {isOnSale && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className="bg-destructive text-destructive-foreground font-bold text-xs px-2 py-1">
                              <Percent className="w-3 h-3 mr-1" />
                              {discountPercent}%
                            </Badge>
                          </div>
                        )}
                        
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <span className="text-xs font-medium text-secondary-foreground dark:text-secondary bg-secondary/20 px-2 py-1 rounded">{product.category}</span>
                        <h2 className="font-semibold text-foreground mt-2 mb-1 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h2>
                        
                        {/* Price Display */}
                        <div className="mb-3">
                          {isOnSale ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-muted-foreground line-through">Rp {product.price.toLocaleString('id-ID')}</p>
                              <p className="text-lg font-bold text-destructive">Rp {product.discount_price?.toLocaleString('id-ID')}</p>
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-primary">Rp {product.price.toLocaleString('id-ID')}</p>
                          )}
                        </div>
                        
                        <Button size="sm" className="w-full">
                          <ShoppingBag className="w-4 h-4 mr-2" />Lihat Detail
                        </Button>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default ShopPage;
