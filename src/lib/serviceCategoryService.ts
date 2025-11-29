import { supabase } from "./supabase";

export interface ServiceCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export async function getServiceCategories(organizationId: string): Promise<{
  data: ServiceCategory[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  return { data, error };
}

export async function createServiceCategory(
  organizationId: string,
  category: Omit<ServiceCategory, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<{ data: ServiceCategory | null; error: any }> {
  const { data, error } = await supabase
    .from("service_categories")
    .insert({ ...category, organization_id: organizationId })
    .select()
    .single();

  return { data, error };
}

export async function updateServiceCategory(
  id: string,
  updates: Partial<Omit<ServiceCategory, "id" | "organization_id" | "created_at" | "updated_at">>
): Promise<{ data: ServiceCategory | null; error: any }> {
  const { data, error } = await supabase
    .from("service_categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteServiceCategory(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from("service_categories").delete().eq("id", id);

  return { error };
}
