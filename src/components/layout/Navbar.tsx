import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, ExternalLink, ChevronDown, LogIn, LayoutDashboard, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  is_external: boolean | null;
  parent_id: string | null;
  position: number;
  children?: MenuItem[];
}

interface HeaderSettings {
  logo_url: string;
  site_name: string;
  site_name_short: string;
}

const defaultHeaderSettings: HeaderSettings = {
  logo_url: "",
  site_name: "Pesantren Mahasiswa An-Nur",
  site_name_short: "An-Nur",
};

// Fallback menu jika database kosong - CLEANED UP for Landing Page Only
const fallbackMenu = [
  { id: '1', title: "Beranda", url: "/", is_external: false, parent_id: null, position: 1 },
  { id: '2', title: "Tentang Kami", url: "/about", is_external: false, parent_id: null, position: 2 },
  { id: '3', title: "PSB Online", url: "/psb", is_external: false, parent_id: null, position: 3 },
  // { id: '4', title: "Blog", url: "/blog", is_external: false, parent_id: null, position: 4 }, // Removed
  // { id: '5', title: "Donasi", url: "/donasi", is_external: false, parent_id: null, position: 5 }, // Removed
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const { theme, toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    fetchMenuItems();
    fetchHeaderSettings();
  }, []);

  const fetchHeaderSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsMap: Partial<HeaderSettings> = {};
        data.forEach((item) => {
          if (['logo_url', 'site_name', 'site_name_short'].includes(item.key) && item.value) {
            settingsMap[item.key as keyof HeaderSettings] = item.value;
          }
        });
        setHeaderSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error('Error fetching header settings:', error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_links')
        .select('id, title, url, is_external, parent_id, position')
        .eq('group_name', 'main')
        .eq('is_active', true)
        .order('position');

      if (error) throw error;

      let hierarchy: MenuItem[] = [];

      if (data && data.length > 0) {
        // Build hierarchy
        const parents = data.filter(item => !item.parent_id);
        hierarchy = parents.map(parent => ({
          ...parent,
          children: data
            .filter(item => item.parent_id === parent.id)
            .sort((a, b) => a.position - b.position)
        }));
      } else {
        hierarchy = [...fallbackMenu];
      }

      // CUSTOM LOGIC: Always Ensure "Donasi" exists if not present in main items
      // DISABLED: Donasi removed from public view
      /*
      if (!hierarchy.some(item => item.url === '/donasi' || item.title.toLowerCase().includes('donasi'))) {
        // Insert "Donasi" before the last item (which is usually a functional item or Contact)
        // Or if generic, just push it before user related items
        // Let's insert it at index 3 or 4 if possible
        const insertIndex = Math.min(hierarchy.length, 4);
        hierarchy.splice(insertIndex, 0, {
          id: 'virtual-donasi',
          title: 'Donasi',
          url: '/donasi',
          is_external: false,
          parent_id: null,
          position: 98
        });
      }
      */

      // CUSTOM LOGIC: Ensure "Kesantrian" exists for Login dropdown
      // Edited: Login E-Maktab sekarang hanya untuk Santri (/auth)
      // Login Admin (/pms/auth) disembunyikan dari menu publik
      const kesantrianIndex = hierarchy.findIndex(item => item.title.toLowerCase().includes('kesantrian'));
      const loginItem = {
        id: 'login-emaktab',
        title: 'Login E-Maktab',
        url: '/auth', // Mengarah ke login santri
        is_external: false,
        parent_id: 'virtual-kesantrian',
        position: 99,
      };

      if (kesantrianIndex !== -1) {
        // Add to existing Kesantrian menu
        if (!hierarchy[kesantrianIndex].children) {
          hierarchy[kesantrianIndex].children = [];
        }
        // Check if login already exists to avoid dupes (unlikely but safe)
        if (!hierarchy[kesantrianIndex].children!.some(c => c.url === '/auth')) {
          hierarchy[kesantrianIndex].children!.push(loginItem);
        }
        // Remove Admin login link if exists (cleanup)
        hierarchy[kesantrianIndex].children = hierarchy[kesantrianIndex].children!.filter(c => c.url !== '/pms/auth');
      } else {
        // Create new Kesantrian menu (virtual)
        hierarchy.push({
          id: 'virtual-kesantrian',
          title: 'Kesantrian',
          url: '#',
          is_external: false,
          parent_id: null,
          position: 99,
          children: [loginItem]
        });
      }

      setMenuItems(hierarchy);

    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuItems(fallbackMenu);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href.startsWith("#") || href.startsWith("/#")) return false;
    return location.pathname.startsWith(href.split("#")[0]);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.includes("#")) {
      const [path, hash] = href.split("#");

      if (location.pathname === path || (path === "/" && location.pathname === "/") || path === "") {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isDonasi = item.url === '/donasi';

    if (hasChildren) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-full outline-none",
                "text-slate-600 hover:text-primary hover:bg-primary/5 group data-[state=open]:text-primary data-[state=open]:bg-primary/5"
              )}
            >
              {item.title}
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[200px] border border-slate-100 shadow-xl bg-white/95 backdrop-blur-md rounded-xl p-1.5 mt-2 animate-in fade-in zoom-in-95 duration-200">
            {item.children!.map((child) => (
              <DropdownMenuItem key={child.id} asChild className="rounded-lg focus:bg-primary/5 focus:text-primary cursor-pointer px-3 py-2.5">
                {child.is_external ? (
                  <a
                    href={child.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full font-medium text-slate-600"
                  >
                    {child.title}
                    <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                  </a>
                ) : (
                  <Link
                    to={child.url}
                    onClick={() => handleNavClick(child.url)}
                    className="w-full font-medium text-slate-600 flex items-center gap-2"
                  >
                    {child.url === '/auth' && <LogIn className="w-3.5 h-3.5 opacity-70" />}
                    {child.title}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Single menu item (no children)
    if (item.is_external) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors hover:bg-primary/5 rounded-full"
        >
          {item.title}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </a>
      );
    }

    // Special styling for Donasi if desired, or standard
    return (
      <Link
        key={item.id}
        to={item.url}
        onClick={() => handleNavClick(item.url)}
        className={cn(
          "px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full flex items-center gap-1.5",
          isActive(item.url.split("#")[0])
            ? "text-primary bg-primary/10 shadow-sm"
            : isDonasi
              ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              : "text-slate-600 hover:text-primary hover:bg-primary/5"
        )}
      >
        {isDonasi && <Heart className="w-3.5 h-3.5 fill-current" />}
        {item.title}
      </Link>
    );
  };

  const renderMobileMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMobile === item.id;
    const isDonasi = item.url === '/donasi';

    if (hasChildren) {
      return (
        <div key={item.id} className="border-b border-slate-100 last:border-0">
          <button
            onClick={() => setExpandedMobile(isExpanded ? null : item.id)}
            className="flex items-center justify-between w-full px-4 py-4 text-sm font-medium text-slate-700 active:bg-slate-50 transition-colors"
          >
            {item.title}
            <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-400", isExpanded && "rotate-180")} />
          </button>
          {isExpanded && (
            <div className="bg-slate-50/50 px-4 pb-2 space-y-1">
              {item.children!.map((child) => (
                child.is_external ? (
                  <a
                    key={child.id}
                    href={child.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 text-sm text-slate-600 rounded-lg hover:bg-white hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {child.title}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ) : (
                  <Link
                    key={child.id}
                    to={child.url}
                    onClick={() => handleNavClick(child.url)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600 rounded-lg hover:bg-white hover:text-primary transition-colors"
                  >
                    {child.url === '/auth' && <LogIn className="w-4 h-4 opacity-70" />}
                    {child.title}
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.is_external) {
      return (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-4 text-sm font-medium text-slate-700 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
          onClick={() => setIsOpen(false)}
        >
          {item.title}
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </a>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.url}
        onClick={() => handleNavClick(item.url)}
        className={cn(
          "block px-4 py-4 text-sm font-medium border-b border-slate-100 last:border-0 transition-colors flex items-center gap-2",
          isActive(item.url.split("#")[0])
            ? "text-primary bg-primary/5"
            : isDonasi
              ? "text-amber-600 bg-amber-50/50"
              : "text-slate-700 hover:bg-slate-50 hover:text-primary"
        )}
      >
        {isDonasi && <Heart className="w-4 h-4 fill-current" />}
        {item.title}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/60 text-slate-900 border-b border-slate-200/50">
      <nav className="container-section flex h-20 items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group"
        >
          {headerSettings.logo_url ? (
            <img
              src={headerSettings.logo_url}
              alt={headerSettings.site_name}
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-[#0f3d2c] flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105 text-white ring-2 ring-white/50">
              <span className="font-heading font-bold text-xl pb-1">ا</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-heading font-bold text-xl text-slate-900 leading-none group-hover:text-primary transition-colors tracking-tight">
              <span className="hidden sm:inline">{headerSettings.site_name}</span>
              <span className="sm:hidden">{headerSettings.site_name_short}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-widest uppercase hidden sm:block mt-1">
              Membangun Generasi Rabbani
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          {menuItems.map(renderMenuItem)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Button
              asChild
              size="sm"
              className="hidden sm:flex gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/20 rounded-full px-6 transition-all hover:scale-105"
            >
              <Link to="/pms">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {/* Mobile: Simple Login Icon/Button */}
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="sm:hidden text-slate-600"
              >
                <Link to="/auth">
                  <LogIn className="w-5 h-5" />
                </Link>
              </Button>

              {/* Desktop: Daftar Sekarang Button with Shine Effect */}
              <Button
                asChild
                size="sm"
                className="hidden sm:flex relative overflow-hidden gap-2 bg-gradient-to-r from-secondary to-amber-500 hover:to-amber-600 text-white shadow-lg shadow-secondary/25 rounded-full px-6 transition-all hover:scale-105 border-none group"
              >
                <Link to="/santri/onboarding" className="relative z-10 font-bold tracking-wide">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                  Daftar Sekarang
                </Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-600 hover:text-primary hover:bg-primary/5 rounded-full"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-slate-100 bg-white/95 backdrop-blur-xl shadow-xl animate-accordion-down origin-top h-[calc(100vh-80px)]">
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="py-2">
              {menuItems.map(renderMobileMenuItem)}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 mt-auto mb-8">
              {user ? (
                <Button asChild className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm rounded-xl py-6">
                  <Link to="/pms" onClick={() => setIsOpen(false)}>
                    <LayoutDashboard className="w-5 h-5" />
                    Buka Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild className="w-full gap-2 bg-gradient-to-r from-secondary to-amber-500 hover:to-amber-600 text-white shadow-lg shadow-secondary/20 rounded-xl py-6 font-bold text-lg">
                  <Link to="/santri/onboarding" onClick={() => setIsOpen(false)}>
                    Daftar Santri Baru
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
