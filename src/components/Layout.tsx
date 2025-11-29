import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Building2,
  ChevronDown,
  Settings,
  Plus,
  Calendar,
  Users,
  Home,
  Truck,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { createOrganization } from "@/lib/organizationService";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Stays", href: "/stays", icon: Calendar },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Accommodations", href: "/accommodations", icon: Home },
  { label: "Providers", href: "/providers", icon: Truck },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    user,
    signOut,
    organizations,
    currentOrganization,
    switchOrganization,
    refreshOrganizations,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSwitchOrg = (orgId: string) => {
    switchOrganization(orgId);
    setOrgMenuOpen(false);
  };

  const handleCreateOrg = async () => {
    const name = prompt("Enter organization name:");
    if (!name) return;

    setCreating(true);
    const { error } = await createOrganization(name);
    if (!error) {
      await refreshOrganizations();
    }
    setCreating(false);
    setOrgMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/stays") {
      return location.pathname === "/stays" || location.pathname.startsWith("/stays/");
    }
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-foreground/10">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/stays" className="flex items-center gap-2">
            <img
              src="/qss-villa-rental-logo.jpg"
              alt="QSS Villa Rental"
              className="h-8 w-auto"
            />
          </Link>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-[#faf9f7] border-r border-border/40
          flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border/40">
          <Link
            to="/stays"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src="/qss-villa-rental-logo.jpg"
              alt="QSS Villa Rental"
              className="h-9 w-auto"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bodoni font-bold tracking-[0.08em] uppercase leading-tight">
                QSS
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
                Itineraries
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Organization Switcher */}
        {currentOrganization && (
          <div className="px-3 py-4 border-b border-border/40">
            <div className="relative">
              <button
                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground bg-white hover:bg-muted/50 rounded-lg border border-border/60 transition-colors shadow-sm"
              >
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 text-left">
                  {currentOrganization.name}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                    orgMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {orgMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOrgMenuOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-border/60 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-border/40 bg-muted/30">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Organizations
                      </p>
                    </div>
                    <div className="max-h-48 overflow-auto p-1">
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => handleSwitchOrg(org.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                            org.id === currentOrganization.id
                              ? "bg-foreground/5 text-foreground font-medium"
                              : "hover:bg-muted/50 text-foreground/80"
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate flex-1 text-left">
                            {org.name}
                          </span>
                          {org.role === "owner" && (
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Owner
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-border/40 p-1">
                      <button
                        onClick={handleCreateOrg}
                        disabled={creating}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Organization</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${active ? "" : "opacity-70"}`} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="mt-auto border-t border-border/40">
          {/* Settings link */}
          <Link
            to="/organization"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 mx-3 my-2 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                location.pathname === "/organization"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            <Settings className="h-4 w-4 opacity-70" />
            <span className="tracking-wide">Settings</span>
          </Link>

          {/* User info */}
          <div className="px-4 py-4 border-t border-border/40 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-foreground/70">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
