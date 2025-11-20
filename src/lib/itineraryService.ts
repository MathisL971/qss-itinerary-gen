import { supabase } from "./supabase";

export interface DayItem {
  id: string;
  time: string;
  event: string;
  location: string;
}

export interface DayData {
  date: Date;
  items: DayItem[];
}

export interface Itinerary {
  id: string;
  user_id: string;
  client_name: string;
  villa_name: string;
  arrival_date: string;
  departure_date: string;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  day_date: string;
  time: string;
  event: string;
  location: string;
  sort_order: number;
  created_at: string;
}

export interface ItineraryWithItems extends Itinerary {
  items: ItineraryItem[];
}

// Convert database items to DayData format
export function itemsToDayData(
  items: ItineraryItem[],
  arrivalDate: Date,
  departureDate: Date
): DayData[] {
  const dayDataMap = new Map<string, DayData>();
  const currentDate = new Date(arrivalDate);

  // Initialize all days
  while (currentDate <= departureDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    dayDataMap.set(dateStr, {
      date: new Date(currentDate),
      items: [],
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add items to their respective days
  items.forEach((item) => {
    const dayData = dayDataMap.get(item.day_date);
    if (dayData) {
      dayData.items.push({
        id: item.id,
        time: item.time,
        event: item.event,
        location: item.location,
      });
    }
  });

  // Sort items within each day by sort_order
  dayDataMap.forEach((dayData) => {
    dayData.items.sort((a, b) => {
      const aItem = items.find((item) => item.id === a.id);
      const bItem = items.find((item) => item.id === b.id);
      return (aItem?.sort_order || 0) - (bItem?.sort_order || 0);
    });
  });

  return Array.from(dayDataMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}

// Convert DayData to database items format
export function dayDataToItems(
  dayData: DayData[],
  itineraryId: string
): Omit<ItineraryItem, "id" | "created_at">[] {
  const items: Omit<ItineraryItem, "id" | "created_at">[] = [];

  dayData.forEach((day) => {
    day.items.forEach((item, index) => {
      items.push({
        itinerary_id: itineraryId,
        day_date: day.date.toISOString().split("T")[0],
        time: item.time,
        event: item.event,
        location: item.location,
        sort_order: index,
      });
    });
  });

  return items;
}

export async function createItinerary(
  clientName: string,
  villaName: string,
  arrivalDate: Date,
  departureDate: Date,
  dayData: DayData[]
): Promise<{ data: Itinerary | null; error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  const shareToken = crypto.randomUUID();

  // Create itinerary
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      client_name: clientName,
      villa_name: villaName,
      arrival_date: arrivalDate.toISOString().split("T")[0],
      departure_date: departureDate.toISOString().split("T")[0],
      share_token: shareToken,
    })
    .select()
    .single();

  if (itineraryError) {
    return { data: null, error: itineraryError };
  }

  // Create items
  const items = dayDataToItems(dayData, itinerary.id);
  console.log(
    "Creating itinerary items:",
    items.length,
    "items from",
    dayData.length,
    "days"
  );

  if (items.length > 0) {
    const { error: itemsError, data: insertedItems } = await supabase
      .from("itinerary_items")
      .insert(items)
      .select();

    if (itemsError) {
      console.error("Error inserting items:", itemsError);
      // Rollback itinerary creation
      await supabase.from("itineraries").delete().eq("id", itinerary.id);
      return { data: null, error: itemsError };
    }
    console.log("Successfully inserted", insertedItems?.length || 0, "items");
  } else {
    console.warn("No items to insert - dayData might be empty");
  }

  return { data: itinerary, error: null };
}

export async function updateItinerary(
  itineraryId: string,
  clientName: string,
  villaName: string,
  arrivalDate: Date,
  departureDate: Date,
  dayData: DayData[]
): Promise<{ error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "User not authenticated" } };
  }

  // Update itinerary
  const { error: itineraryError } = await supabase
    .from("itineraries")
    .update({
      client_name: clientName,
      villa_name: villaName,
      arrival_date: arrivalDate.toISOString().split("T")[0],
      departure_date: departureDate.toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })
    .eq("id", itineraryId)
    .eq("user_id", user.id);

  if (itineraryError) {
    return { error: itineraryError };
  }

  // Delete existing items
  const { error: deleteError } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("itinerary_id", itineraryId);

  if (deleteError) {
    return { error: deleteError };
  }

  // Insert new items
  const items = dayDataToItems(dayData, itineraryId);
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("itinerary_items")
      .insert(items);

    if (itemsError) {
      return { error: itemsError };
    }
  }

  return { error: null };
}

export async function deleteItinerary(
  itineraryId: string
): Promise<{ error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "User not authenticated" } };
  }

  // Delete items first (foreign key constraint)
  const { error: itemsError } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("itinerary_id", itineraryId);

  if (itemsError) {
    return { error: itemsError };
  }

  // Delete itinerary
  const { error: itineraryError } = await supabase
    .from("itineraries")
    .delete()
    .eq("id", itineraryId)
    .eq("user_id", user.id);

  return { error: itineraryError };
}

export async function getUserItineraries(): Promise<{
  data: Itinerary[] | null;
  error: any;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getItineraryById(
  itineraryId: string
): Promise<{ data: ItineraryWithItems | null; error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not authenticated" } };
  }

  // Get itinerary
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", itineraryId)
    .eq("user_id", user.id)
    .single();

  if (itineraryError || !itinerary) {
    return { data: null, error: itineraryError };
  }

  // Get items
  const { data: items, error: itemsError } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("itinerary_id", itineraryId)
    .order("day_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return { data: null, error: itemsError };
  }

  return {
    data: { ...itinerary, items: items || [] },
    error: null,
  };
}

export async function getSharedItinerary(
  shareToken: string
): Promise<{ data: ItineraryWithItems | null; error: any }> {
  if (!shareToken || shareToken.trim() === "") {
    return {
      data: null,
      error: { message: "Invalid share token provided" },
    };
  }

  // Get itinerary by share_token (public access - no auth required)
  // The RLS policy "Public can view shared itineraries" should allow this
  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("*")
    .eq("share_token", shareToken.trim())
    .single();

  if (itineraryError) {
    console.error("Error fetching shared itinerary:", itineraryError);
    // Provide more helpful error messages
    if (itineraryError.code === "PGRST116") {
      return {
        data: null,
        error: {
          ...itineraryError,
          message:
            "Shared itinerary not found. The link may be invalid or expired.",
        },
      };
    }
    return { data: null, error: itineraryError };
  }

  if (!itinerary) {
    return {
      data: null,
      error: { message: "Shared itinerary not found" },
    };
  }

  // Get items (public access via RLS policy)
  const { data: items, error: itemsError } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("itinerary_id", itinerary.id)
    .order("day_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("Error fetching shared itinerary items:", itemsError);
    return { data: null, error: itemsError };
  }

  return {
    data: { ...itinerary, items: items || [] },
    error: null,
  };
}

export function generateShareUrl(shareToken: string): string {
  return `${window.location.origin}/share/${shareToken}`;
}
