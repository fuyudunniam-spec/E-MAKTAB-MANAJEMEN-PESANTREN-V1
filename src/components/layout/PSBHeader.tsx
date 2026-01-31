import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PSBHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/psb/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md shadow-sm border-b border-stone-200/50 font-body">
      <div className="container-section flex h-20 items-center justify-between px-6">
        {/* Logo Section */}
        <Link to="/psb" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-royal-800 to-royal-950 flex items-center justify-center shadow-lg shadow-royal-900/20 transition-transform duration-300 group-hover:scale-105 text-white ring-2 ring-white/50">
             <span className="font-heading font-bold text-lg pb-1">ا</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg text-royal-950 leading-none group-hover:text-royal-700 transition-colors">
              Penerimaan Santri Baru
            </span>
            <span className="text-[10px] text-stone-500 font-medium tracking-widest uppercase mt-0.5">
              Pesantren Al-Bisri
            </span>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border border-stone-200">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="bg-royal-50 text-royal-700 font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => navigate('/psb/portal')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard Portal</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/psb/auth')}
                className="font-medium text-stone-600 hover:text-royal-900 rounded-full px-6"
              >
                Masuk
              </Button>
              <Button 
                onClick={() => navigate('/psb/register')}
                className="bg-royal-900 hover:bg-royal-800 text-white shadow-lg shadow-royal-900/20 rounded-full px-6 font-bold"
              >
                Daftar Sekarang
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
