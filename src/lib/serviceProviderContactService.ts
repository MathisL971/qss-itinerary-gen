import { supabase } from "./supabase";

export interface ServiceProviderContact {
  id: string;
  service_provider_id: string;
  contact_type: string;
  value: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function getServiceProviderContacts(providerId: string): Promise<{
  data: ServiceProviderContact[] | null;
  error: any;
}> {
  const { data, error } = await supabase
    .from("service_provider_contacts")
    .select("*")
    .eq("service_provider_id", providerId)
    .order("is_primary", { ascending: false })
    .order("created_at");

  return { data, error };
}

export async function createServiceProviderContact(
  contact: Omit<ServiceProviderContact, "id" | "created_at" | "updated_at">
): Promise<{ data: ServiceProviderContact | null; error: any }> {
  const { data, error } = await supabase
    .from("service_provider_contacts")
    .insert(contact)
    .select()
    .single();

  return { data, error };
}

export async function updateServiceProviderContact(
  id: string,
  updates: Partial<ServiceProviderContact>
): Promise<{ data: ServiceProviderContact | null; error: any }> {
  const { data, error } = await supabase
    .from("service_provider_contacts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteServiceProviderContact(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("service_provider_contacts")
    .delete()
    .eq("id", id);

  return { error };
}

