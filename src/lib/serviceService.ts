import { supabase } from "./supabase";
import { escapeLikePattern } from "./utils";

export interface Service {
  id: string;
  service_provider_id: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  base_price?: number;
  currency: string;
  pricing_type?: "fixed" | "per_person" | "per_hour" | "custom";
  capacity_min?: number;
  capacity_max?: number;
  is_available: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  service_providers?: {
    id: string;
    name: string;
    service_categories?: {
      name: string;
    };
  };
}

export async function getServices(providerId?: string): Promise<{
  data: Service[] | null;
  error: any;
}> {
  let query = supabase
    .from("services")
    .select(
      `
      *,
      service_providers (
        id,
        name,
        service_categories (
          name
        )
      )
    `
    )
    .is("deleted_at", null)
    .order("name");

  if (providerId) {
    query = query.eq("service_provider_id", providerId);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getServicesByProvider(
  providerId: string
): Promise<{ data: Service[] | null; error: any }> {
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      service_providers (
        id,
        name,
        service_categories (
          name
        )
      )
    `
    )
    .eq("service_provider_id", providerId)
    .is("deleted_at", null)
    .order("name");

  return { data, error };
}

export async function getService(
  id: string
): Promise<{ data: Service | null; error: any }> {
  const { data, error } = await supabase
    .from("services")
    .select(
      `
      *,
      service_providers (
        id,
        name,
        service_categories (
          name
        )
      )
    `
    )
    .eq("id", id)
    .single();

  return { data, error };
}

export async function searchServices(
  query: string,
  providerId?: string
): Promise<{ data: Service[] | null; error: any }> {
  let dbQuery = supabase
    .from("services")
    .select(
      `
      *,
      service_providers (
        id,
        name,
        service_categories (
          name
        )
      )
    `
    )
    .is("deleted_at", null)
    .ilike("name", `%${escapeLikePattern(query)}%`)
    .order("name")
    .limit(20);

  if (providerId) {
    dbQuery = dbQuery.eq("service_provider_id", providerId);
  }

  const { data, error } = await dbQuery;

  return { data, error };
}

export async function createService(
  service: Omit<
    Service,
    "id" | "created_at" | "updated_at" | "service_providers"
  >
): Promise<{ data: Service | null; error: any }> {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  return { data, error };
}

export async function updateService(
  id: string,
  updates: Partial<Service>
): Promise<{ data: Service | null; error: any }> {
  // Remove joined fields from updates
  const { service_providers, ...cleanUpdates } = updates as any;

  const { data, error } = await supabase
    .from("services")
    .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteService(id: string): Promise<{ error: any }> {
  // Soft delete
  const { error } = await supabase
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  return { error };
}

// Helper function to format price with currency
export function formatServicePrice(service: Service): string {
  if (!service.base_price) return "-";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: service.currency || "EUR",
  });

  const price = formatter.format(service.base_price);

  switch (service.pricing_type) {
    case "per_person":
      return `${price}/person`;
    case "per_hour":
      return `${price}/hour`;
    case "custom":
      return `From ${price}`;
    default:
      return price;
  }
}

// Helper function to format duration
export function formatDuration(minutes?: number): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
}
