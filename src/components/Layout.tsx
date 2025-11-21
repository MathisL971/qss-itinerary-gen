import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-foreground/10">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/itineraries" className="flex items-center gap-4 hover:opacity-70 transition-opacity group">
              <img
                src="/qss-villa-rental-logo.jpg"
                alt="QSS Villa Rental Saint Barth Logo"
                className="h-10 w-auto grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="text-lg font-bodoni font-bold tracking-[0.1em] uppercase border-l border-border/60 pl-4 py-1">QSS Itineraries</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground hidden sm:inline tracking-wide uppercase font-medium">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="animate-fade-in">{children}</main>
    </div>
  );
}

