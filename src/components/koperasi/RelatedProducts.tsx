import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  discount_price: number | null;
  is_on_sale: boolean | null;
  image_url: string | null;
  product_type: string;
}

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  productType?: string;
  limit?: number;
}

export function RelatedProducts({
  currentProductId,
  category,
  productType = 'book',
  limit = 4,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId, category]);

  const fetchRelatedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, category, price, discount_price, is_on_sale, image_url, product_type')
        .eq('is_active', true)
        .eq('category', category)
        .neq('id', currentProductId)
        .limit(limit);

      if (error) throw error;

      // If not enough products in same category, get more from same product type
      if ((data?.length || 0) < limit) {
        const remaining = limit - (data?.length || 0);
        const existingIds = data?.map(p => p.id) || [];
        existingIds.push(currentProductId);

        const { data: moreData } = await supabase
          .from('products')
          .select('id, name, slug, category, price, discount_price, is_on_sale, image_url, product_type')
          .eq('is_active', true)
          .eq('product_type', productType)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .limit(remaining);

        setProducts([...(data || []), ...(moreData || [])]);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Produk Terkait</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const isOnSale = product.is_on_sale && product.discount_price && product.discount_price < product.price;
          return (
            <Link key={product.id} to={`/shop/${product.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {isOnSale && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                        SALE
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <Badge variant="secondary" className="text-xs mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {isOnSale ? (
                        <>
                          <span className="text-sm font-bold text-destructive">
                            Rp {product.discount_price?.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            Rp {product.price.toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
