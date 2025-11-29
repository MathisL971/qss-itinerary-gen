import { supabase } from "./supabase";

export interface Accommodation {
  id: string;
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

export async function getAccommodations(type?: string): Promise<{ data: Accommodation[] | null; error: any }> {
  let query = supabase.from("accommodations").select("*").order("name");
  
  if (type) {
    query = query.eq("type", type);
  }
  
  const { data, error } = await query;
  
  return { data, error };
}

export async function searchAccommodations(query: string): Promise<{ data: Accommodation[] | null; error: any }> {
  const { data, error } = await supabase
    .from("accommodations")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10);
    
  return { data, error };
}

export async function createAccommodation(accommodation: Omit<Accommodation, "id" | "created_at" | "updated_at">): Promise<{ data: Accommodation | null; error: any }> {
  const { data, error } = await supabase
    .from("accommodations")
    .insert(accommodation)
    .select()
    .single();
    
  return { data, error };
}

export async function updateAccommodation(id: string, updates: Partial<Accommodation>): Promise<{ data: Accommodation | null; error: any }> {
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

