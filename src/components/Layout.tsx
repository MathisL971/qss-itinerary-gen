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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/itineraries" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src="/qss-villa-rental-logo.jpg"
                alt="QSS Villa Rental Saint Barth Logo"
                className="h-10 sm:h-12 w-auto"
              />
              <span className="text-lg sm:text-xl font-bodoni font-bold tracking-[0.05em] uppercase">QSS Itineraries</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

