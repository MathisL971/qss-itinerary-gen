import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Only detect session from URL once on initial page load, not on every visibility change
    detectSessionInUrl: true,
    // Persist session to localStorage
    persistSession: true,
    // Auto-refresh tokens, but we'll handle the events carefully
    autoRefreshToken: true,
    // Use PKCE flow for better security
    flowType: "pkce",
  },
});
