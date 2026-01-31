import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Bell,
  MessageSquare,
  Users,
  LogOut,
  BookOpen,
  Tag,
  UserPen,
  Link2,
  FileStack,
  Images,
  ShoppingBag,
  ChevronDown,
  Package,
  Newspaper,
  Settings,
  Database,
  ImageIcon,
  Cog,
  History,
  Home,
  GraduationCap,
  Quote,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const menuGroups = [
  {
    title: 'Produk',
    icon: Package,
    items: [
      { title: 'Katalog Buku', url: '/cms/books', icon: BookOpen },
      { title: 'Produk Umum', url: '/cms/products', icon: ShoppingBag },
    ],
  },
  {
    title: 'Konten',
    icon: Newspaper,
    items: [
      { title: 'Artikel', url: '/cms/posts', icon: FileText },
      { title: 'Halaman', url: '/cms/pages', icon: FileStack },
      { title: 'Galeri', url: '/cms/gallery', icon: Images },
      { title: 'Media Library', url: '/cms/media', icon: ImageIcon },
    ],
  },
  {
    title: 'Master Data',
    icon: Database,
    items: [
      { title: 'Penulis', url: '/cms/authors', icon: UserPen },
      { title: 'Kategori', url: '/cms/categories', icon: Tag },
      { title: 'Menu & Link', url: '/cms/menu-links', icon: Link2 },
    ],
  },
  {
    title: 'Komunikasi',
    icon: MessageSquare,
    items: [
      { title: 'Pengumuman', url: '/cms/announcements', icon: Bell },
      { title: 'Pesan Masuk', url: '/cms/messages', icon: MessageSquare, hasBadge: true },
    ],
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    items: [
      { title: 'Edit Homepage', url: '/cms/homepage', icon: Home },
      { title: 'Kelola Program', url: '/cms/programs', icon: GraduationCap },
      { title: 'Kelola Testimoni', url: '/cms/testimonials', icon: Quote },
      { title: 'Pengaturan Website', url: '/cms/settings', icon: Cog },
      { title: 'Kelola Admin', url: '/cms/users', icon: Users },
      { title: 'Activity Log', url: '/cms/activity-log', icon: History },
    ],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { signOut } = useAuthContext();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isGroupActive = (items: { url: string }[]) => {
    return items.some((item) => location.pathname === item.url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <NavLink to="/cms" className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-foreground">Admin An-Nur</span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard - standalone */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/cms"
                    end
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      location.pathname === '/cms'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Grouped menus */}
              {menuGroups.map((group) => (
                <Collapsible
                  key={group.title}
                  defaultOpen={isGroupActive(group.items)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          'flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors',
                          isGroupActive(group.items)
                            ? 'text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <group.icon className="h-5 w-5" />
                          {!isCollapsed && <span>{group.title}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu className="pl-4 mt-1 space-y-1">
                        {group.items.map((item) => {
                          const isActive = location.pathname === item.url;
                          const showBadge = 'hasBadge' in item && item.hasBadge && unreadCount > 0;
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={item.url}
                                  className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                  )}
                                >
                                  <item.icon className="h-4 w-4" />
                                  {!isCollapsed && (
                                    <span className="flex-1">{item.title}</span>
                                  )}
                                  {showBadge && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-auto h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                                    >
                                      {unreadCount}
                                    </Badge>
                                  )}
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Keluar</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
