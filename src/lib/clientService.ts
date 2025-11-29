import { supabase } from "./supabase";
import { escapeLikePattern } from "./utils";

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  language?: "en" | "fr";
  preferences?: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getClients(organizationId: string): Promise<{
  data: Client[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  return { data, error };
}

export async function searchClients(
  organizationId: string,
  query: string
): Promise<{ data: Client[] | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("organization_id", organizationId)
    .ilike("name", `%${escapeLikePattern(query)}%`)
    .order("name")
    .limit(10);

  return { data, error };
}

export async function createClient(
  organizationId: string,
  client: Omit<Client, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...client, organization_id: organizationId })
    .select()
    .single();

  return { data, error };
}

export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, "id" | "organization_id" | "created_at" | "updated_at">>
): Promise<{ data: Client | null; error: any }> {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteClient(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from("clients").delete().eq("id", id);

  return { error };
}
