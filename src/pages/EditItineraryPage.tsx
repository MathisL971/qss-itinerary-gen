import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ItineraryEditor } from "@/components/ItineraryEditor";
import type { ItineraryEditorData } from "@/components/ItineraryEditor";
import {
  updateItinerary,
  createItinerary,
  itemsToDayData,
} from "@/lib/itineraryService";
import { getStayById } from "@/lib/stayService";
import { supabase } from "@/lib/supabase";
import { parseLocalDate } from "@/lib/utils";

export function EditItineraryPage() {
  const { stayId } = useParams<{ stayId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorData, setEditorData] = useState<ItineraryEditorData | null>(
    null
  );
  const [itineraryId, setItineraryId] = useState<string | null>(null);

  useEffect(() => {
    if (stayId) {
      loadStayAndItinerary(stayId);
    } else {
      navigate("/stays", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stayId]);

  const loadStayAndItinerary = async (stayIdParam: string) => {
    setLoading(true);
    setError("");

    // Load stay
    const { data: stay, error: stayErr } = await getStayById(stayIdParam);
    if (stayErr || !stay) {
      setError(stayErr?.message || "Failed to load stay");
      setLoading(false);
      return;
    }

    // Try to find itinerary for this stay
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("stay_id", stayIdParam)
      .single();

    let dayData: any[] = [];
    if (!itineraryError && itinerary) {
      setItineraryId(itinerary.id);

      // Load itinerary items with service and provider data
      const { data: items } = await supabase
        .from("itinerary_items")
        .select(
          `
          *,
          service_provider:service_providers(id, name, policy),
          service:services(
            id,
            name,
            base_price,
            currency,
            pricing_type,
            service_providers(id, name, policy)
          )
        `
        )
        .eq("itinerary_id", itinerary.id)
        .order("day_date", { ascending: true })
        .order("sort_order", { ascending: true });

      if (items && items.length > 0) {
        const arrivalDate = parseLocalDate(stay.arrival_date);
        const departureDate = parseLocalDate(stay.departure_date);
        dayData = itemsToDayData(items, arrivalDate, departureDate);
      }
    }

    // Use stay dates (always from the stay) - parse in local time to avoid timezone issues
    const arrivalDate = parseLocalDate(stay.arrival_date);
    const departureDate = parseLocalDate(stay.departure_date);

    setEditorData({
      clientName: stay.client?.name || "",
      villaName: stay.accommodation?.name || "",
      clientId: stay.client_id,
      accommodationId: stay.accommodation_id,
      stayId: stay.id,
      arrivalDate,
      departureDate,
      dayData,
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editorData || !stayId) return;

    if (!editorData.dayData) {
      setError("Invalid itinerary data");
      return;
    }

    setSaving(true);
    setError("");

    if (itineraryId) {
      // Update existing itinerary
      const { error: err } = await updateItinerary(
        itineraryId,
        editorData.dayData
      );

      if (err) {
        setError(err.message || "Failed to update itinerary");
        setSaving(false);
        return;
      }
    } else {
      // Create new itinerary
      const { data, error: err } = await createItinerary(
        stayId,
        editorData.dayData
      );

      if (err || !data) {
        setError(err?.message || "Failed to create itinerary");
        setSaving(false);
        return;
      }

      setItineraryId(data.id);
    }

    // Navigate back to stay page
    navigate(`/stays/${stayId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <ClipLoader color="#1a1a1a" size={48} />
            <div className="text-muted-foreground font-medium">
              Loading itinerary...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!editorData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-destructive">Failed to load itinerary</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/stays/${stayId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stay
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="gap-2"
          >
            {saving ? (
              <>
                <ClipLoader color="currentColor" size={16} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Itinerary</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <ItineraryEditor
          initialClientName={editorData.clientName}
          initialVillaName={editorData.villaName}
          initialClientId={editorData.clientId}
          initialAccommodationId={editorData.accommodationId}
          initialArrivalDate={editorData.arrivalDate}
          initialDepartureDate={editorData.departureDate}
          initialDayData={editorData.dayData}
          datesLocked={true}
          hideBasicInfo={true}
          onDataChange={setEditorData}
          showHeader={false}
        />
      </div>
    </Layout>
  );
}
