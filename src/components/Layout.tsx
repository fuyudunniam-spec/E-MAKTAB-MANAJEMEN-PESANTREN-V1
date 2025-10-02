import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Wallet, 
  Heart, 
  Package, 
  Store, 
  DollarSign,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Data Santri", path: "/santri" },
  { icon: Award, label: "Monitoring", path: "/monitoring" },
  { icon: Wallet, label: "Tabungan", path: "/tabungan" },
  { icon: Heart, label: "Donasi", path: "/donasi" },
  { icon: Package, label: "Inventaris", path: "/inventaris" },
  { icon: Store, label: "Koperasi", path: "/koperasi" },
  { icon: DollarSign, label: "Keuangan", path: "/keuangan" },
];

interface LayoutProps {
  children: ReactNode;
}

const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          Pesantren Al-Bisri
        </h1>
        <p className="text-sm text-sidebar-foreground/70 mt-1">
          Sistem Manajemen Terpadu
        </p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-4">
          <p className="text-sm font-medium text-sidebar-accent-foreground">
            Yayasan Anak Yatim
          </p>
          <p className="text-xs text-sidebar-accent-foreground/70 mt-1">
            Al-Bisri © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar-background flex-col border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar-background">
            <SidebarContent mobile />
          </SheetContent>
        </Sheet>
        <h1 className="ml-4 font-bold text-lg">Pesantren Al-Bisri</h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:mt-0 mt-16">
        {children}
      </main>
    </div>
  );
};
