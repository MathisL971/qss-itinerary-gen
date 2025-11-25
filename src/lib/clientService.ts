import { supabase } from "./supabase";

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type { Client };

export async function getClients(): Promise<{ data: Client[] | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");
  
  return { data, error };
}

export async function searchClients(query: string): Promise<{ data: Client[] | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10);
    
  return { data, error };
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();
    
  return { data, error };
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
    
  return { data, error };
}

export async function deleteClient(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);
    
  return { error };
}

