import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  Wallet, 
  Heart, 
  Package, 
  Store, 
  DollarSign,
  Menu,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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

const SidebarContent = ({ mobile = false, onLogout }: { mobile?: boolean; onLogout: () => void }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sidebar-border">
        <h1 
          className="text-xl font-bold"
          style={{ color: 'hsl(0 0% 100%)' }}
        >
          Pesantren Al-Bisri
        </h1>
        <p 
          className="text-sm mt-1"
          style={{ color: 'hsl(0 0% 100% / 0.7)' }}
        >
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
                  ? "font-medium shadow-sm"
                  : ""
              )}
              style={{
                backgroundColor: isActive ? 'hsl(0 0% 100%)' : 'transparent',
                color: isActive ? 'hsl(160 84% 39%)' : 'hsl(0 0% 100%)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'hsl(160 70% 45%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div 
        className="p-4 border-t space-y-3"
        style={{ borderColor: 'hsl(160 70% 35%)' }}
      >
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3"
          style={{
            backgroundColor: 'transparent',
            borderColor: 'hsl(0 0% 100% / 0.2)',
            color: 'hsl(0 0% 100%)'
          }}
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </Button>
        <div 
          className="rounded-lg p-4"
          style={{ backgroundColor: 'hsl(160 70% 45%)' }}
        >
          <p 
            className="text-sm font-medium"
            style={{ color: 'hsl(0 0% 100%)' }}
          >
            Yayasan Anak Yatim
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: 'hsl(0 0% 100% / 0.7)' }}
          >
            Al-Bisri © 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else if (session && event === 'SIGNED_IN') {
          // Redirect to dashboard when user signs in
          navigate("/");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside 
        className="hidden lg:flex w-64 flex-col border-r"
        style={{
          backgroundColor: 'hsl(160 84% 39%)',
          borderColor: 'hsl(160 70% 35%)'
        }}
      >
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50 flex items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="p-0 w-64"
            style={{ backgroundColor: 'hsl(160 84% 39%)' }}
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu for the application
            </SheetDescription>
            <SidebarContent mobile onLogout={handleLogout} />
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
