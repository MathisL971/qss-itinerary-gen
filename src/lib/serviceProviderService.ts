import { supabase } from "./supabase";

export interface ServiceProvider {
  id: string;
  name: string;
  category_id?: string;
  description?: string;
  address?: string;
  website?: string;
  notes?: string;
  policy?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service_categories?: {
    name: string;
  };
}

export async function getServiceProviders(categoryId?: string): Promise<{
  data: ServiceProvider[] | null;
  error: any;
}> {
  let query = supabase
    .from("service_providers")
    .select(
      `
      *,
      service_categories (
        name
      )
    `
    )
    .order("name");

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function searchServiceProviders(
  query: string
): Promise<{ data: ServiceProvider[] | null; error: any }> {
  const { data, error } = await supabase
    .from("service_providers")
    .select(
      `
      *,
      service_categories (
        name
      )
    `
    )
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(20);

  return { data, error };
}

export async function createServiceProvider(
  provider: Omit<
    ServiceProvider,
    "id" | "created_at" | "updated_at" | "service_categories"
  >
): Promise<{ data: ServiceProvider | null; error: any }> {
  const { data, error } = await supabase
    .from("service_providers")
    .insert(provider)
    .select()
    .single();

  return { data, error };
}

export async function updateServiceProvider(
  id: string,
  updates: Partial<ServiceProvider>
): Promise<{ data: ServiceProvider | null; error: any }> {
  // Remove service_categories from updates if present as it's a joined field
  const { service_categories, ...cleanUpdates } = updates as any;

  const { data, error } = await supabase
    .from("service_providers")
    .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteServiceProvider(
  id: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("service_providers")
    .delete()
    .eq("id", id);

  return { error };
}
