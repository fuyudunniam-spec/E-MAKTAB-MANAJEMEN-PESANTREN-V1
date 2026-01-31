import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, { label: string; parent?: string }> = {
  '/cms': { label: 'Dashboard' },
  '/cms/books': { label: 'Katalog Buku', parent: 'Produk' },
  '/cms/products': { label: 'Produk Umum', parent: 'Produk' },
  '/cms/posts': { label: 'Artikel', parent: 'Konten' },
  '/cms/pages': { label: 'Halaman', parent: 'Konten' },
  '/cms/gallery': { label: 'Galeri', parent: 'Konten' },
  '/cms/media': { label: 'Media Library', parent: 'Konten' },
  '/cms/authors': { label: 'Penulis', parent: 'Master Data' },
  '/cms/categories': { label: 'Kategori', parent: 'Master Data' },
  '/cms/menu-links': { label: 'Menu & Link', parent: 'Master Data' },
  '/cms/announcements': { label: 'Pengumuman', parent: 'Komunikasi' },
  '/cms/messages': { label: 'Pesan Masuk', parent: 'Komunikasi' },
  '/cms/settings': { label: 'Pengaturan Website', parent: 'Pengaturan' },
  '/cms/users': { label: 'Kelola Admin', parent: 'Pengaturan' },
  '/cms/activity-log': { label: 'Activity Log', parent: 'Pengaturan' },
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const currentRoute = routeLabels[location.pathname];

  if (!currentRoute || location.pathname === '/cms') {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/cms" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {currentRoute.parent && (
          <>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <span className="text-muted-foreground">{currentRoute.parent}</span>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium text-foreground">
            {currentRoute.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
