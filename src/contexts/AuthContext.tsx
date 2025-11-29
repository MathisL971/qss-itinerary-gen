import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, siteUrl } from "@/lib/supabase";
import { getUserOrganizations } from "@/lib/organizationService";
import type { OrganizationWithRole } from "@/lib/organizationService";
import { logger } from "@/lib/logger";

type User = Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
type Session = Awaited<
  ReturnType<typeof supabase.auth.getSession>
>["data"]["session"];

const SELECTED_ORG_KEY = "qss_selected_organization_id";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // Organization state
  organizations: OrganizationWithRole[];
  currentOrganization: OrganizationWithRole | null;
  organizationsLoading: boolean;
  needsOnboarding: boolean;
  // Auth actions
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // Organization actions
  switchOrganization: (organizationId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Organization state
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>(
    []
  );
  const [currentOrganization, setCurrentOrganization] =
    useState<OrganizationWithRole | null>(null);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);

  // Computed: user needs onboarding if authenticated but has no organizations
  const needsOnboarding =
    !loading && !organizationsLoading && !!user && organizations.length === 0;

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async () => {
    setOrganizationsLoading(true);
    try {
      const { data, error } = await getUserOrganizations();
      if (error) {
        logger.error("Error fetching organizations:", error);
        setOrganizations([]);
        setCurrentOrganization(null);
        return;
      }

      const orgs = data || [];
      setOrganizations(orgs);

      if (orgs.length > 0) {
        // Try to restore previously selected organization
        const savedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
        const savedOrg = savedOrgId
          ? orgs.find((org) => org.id === savedOrgId)
          : null;

        // Use saved org, or default to first org
        setCurrentOrganization(savedOrg || orgs[0]);
      } else {
        setCurrentOrganization(null);
      }
    } catch (err) {
      logger.error("Error in fetchOrganizations:", err);
      setOrganizations([]);
      setCurrentOrganization(null);
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  // Switch to a different organization
  const switchOrganization = useCallback(
    (organizationId: string) => {
      const org = organizations.find((o) => o.id === organizationId);
      if (org) {
        setCurrentOrganization(org);
        localStorage.setItem(SELECTED_ORG_KEY, organizationId);
      }
    },
    [organizations]
  );

  // Refresh organizations (useful after creating a new org)
  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Fetch organizations if user is logged in
      if (session?.user) {
        fetchOrganizations();
      } else {
        setOrganizationsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchOrganizations();
      } else {
        // Clear organization state on logout
        setOrganizations([]);
        setCurrentOrganization(null);
        setOrganizationsLoading(false);
        localStorage.removeItem(SELECTED_ORG_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchOrganizations]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/login`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        organizations,
        currentOrganization,
        organizationsLoading,
        needsOnboarding,
        signUp,
        signIn,
        signOut,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
