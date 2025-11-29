import { supabase } from "./supabase";

export interface Accommodation {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  address?: string;
  capacity?: number;
  amenities?: Record<string, any>;
  description?: string;
  base_rate?: number;
  nightly_rate?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export async function getAccommodations(
  organizationId: string,
  type?: string
): Promise<{ data: Accommodation[] | null; error: any }> {
  let query = supabase
    .from("accommodations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function searchAccommodations(
  organizationId: string,
  query: string
): Promise<{ data: Accommodation[] | null; error: any }> {
  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .eq("organization_id", organizationId)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10);

  return { data, error };
}

export async function createAccommodation(
  organizationId: string,
  accommodation: Omit<Accommodation, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<{ data: Accommodation | null; error: any }> {
  const { data, error } = await supabase
    .from("accommodations")
    .insert({ ...accommodation, organization_id: organizationId })
    .select()
    .single();

  return { data, error };
}

export async function updateAccommodation(
  id: string,
  updates: Partial<Omit<Accommodation, "id" | "organization_id" | "created_at" | "updated_at">>
): Promise<{ data: Accommodation | null; error: any }> {
  const { data, error } = await supabase
    .from("accommodations")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteAccommodation(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("accommodations")
    .delete()
    .eq("id", id);

  return { error };
}
