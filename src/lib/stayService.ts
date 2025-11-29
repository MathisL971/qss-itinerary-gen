import { supabase } from "./supabase";

export interface Stay {
  id: string;
  organization_id: string;
  client_id: string;
  accommodation_id: string;
  arrival_date: string;
  departure_date: string;
  status: "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";
  notes: string;
  created_at: string;
  updated_at: string;
  client?: { name: string; email: string; language?: string };
  accommodation?: { name: string };
}

export async function getStays(organizationId: string) {
  const { data, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      client:clients(name, email, language),
      accommodation:accommodations(name)
    `
    )
    .eq("organization_id", organizationId)
    .order("arrival_date", { ascending: true });

  return { data, error };
}

export async function getStayById(id: string) {
  const { data, error } = await supabase
    .from("stays")
    .select(
      `
      *,
      client:clients(name, email, language),
      accommodation:accommodations(name)
    `
    )
    .eq("id", id)
    .single();

  return { data, error };
}

export async function createStay(
  organizationId: string,
  stay: Omit<Stay, "id" | "organization_id" | "created_at" | "updated_at" | "client" | "accommodation">
) {
  const { data, error } = await supabase
    .from("stays")
    .insert({ ...stay, organization_id: organizationId })
    .select()
    .single();

  return { data, error };
}

export async function updateStay(
  id: string,
  stay: Partial<Omit<Stay, "id" | "organization_id" | "created_at" | "updated_at" | "client" | "accommodation">>
) {
  const { data, error } = await supabase
    .from("stays")
    .update(stay)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteStay(id: string) {
  const { error } = await supabase.from("stays").delete().eq("id", id);

  return { error };
}
