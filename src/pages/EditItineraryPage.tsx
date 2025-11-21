import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ItineraryEditor } from "@/components/ItineraryEditor";
import type { ItineraryEditorData } from "@/components/ItineraryEditor";
import {
  getItineraryById,
  updateItinerary,
  createItinerary,
  itemsToDayData,
} from "@/lib/itineraryService";

export function EditItineraryPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorData, setEditorData] = useState<ItineraryEditorData | null>(
    null
  );

  // Determine if we're creating a new itinerary
  const isNew = location.pathname === "/itineraries/new" || id === "new";

  useEffect(() => {
    if (isNew) {
      // New itinerary - initialize with empty data
      setEditorData({
        clientName: "",
        villaName: "",
        arrivalDate: undefined,
        departureDate: undefined,
        dayData: [],
      });
      setLoading(false);
    } else if (id) {
      // Load existing itinerary
      loadItinerary(id);
    } else {
      // No id and not new - redirect to list
      navigate("/itineraries", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew, navigate]);

  const loadItinerary = async (itineraryId: string) => {
    setLoading(true);
    setError("");
    const { data, error: err } = await getItineraryById(itineraryId);

    if (err || !data) {
      setError(err?.message || "Failed to load itinerary");
      setLoading(false);
      return;
    }

    // Convert database format to editor format
    const arrivalDate = new Date(data.arrival_date);
    const departureDate = new Date(data.departure_date);
    const dayData = itemsToDayData(data.items, arrivalDate, departureDate);

    setEditorData({
      clientName: data.client_name,
      villaName: data.villa_name,
      arrivalDate,
      departureDate,
      dayData,
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editorData) return;

    if (
      !editorData.arrivalDate ||
      !editorData.departureDate ||
      !editorData.clientName ||
      !editorData.villaName
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");

    if (isNew) {
      // Create new itinerary
      console.log(
        "Creating itinerary with dayData:",
        editorData.dayData.length,
        "days"
      );
      console.log(
        "Total items:",
        editorData.dayData.reduce((sum, day) => sum + day.items.length, 0)
      );
      const { data, error: err } = await createItinerary(
        editorData.clientName,
        editorData.villaName,
        editorData.arrivalDate,
        editorData.departureDate,
        editorData.dayData
      );

      if (err || !data) {
        setError(err?.message || "Failed to create itinerary");
        setSaving(false);
        return;
      }

      navigate("/itineraries");
    } else if (id) {
      // Update existing itinerary
      const { error: err } = await updateItinerary(
        id,
        editorData.clientName,
        editorData.villaName,
        editorData.arrivalDate,
        editorData.departureDate,
        editorData.dayData
      );

      if (err) {
        setError(err.message || "Failed to update itinerary");
        setSaving(false);
        return;
      }

      navigate("/itineraries");
    }
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
            onClick={() => navigate("/itineraries")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Itineraries
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
                <span>{isNew ? "Create" : "Save"}</span>
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
          initialArrivalDate={editorData.arrivalDate}
          initialDepartureDate={editorData.departureDate}
          initialDayData={editorData.dayData}
          onDataChange={setEditorData}
          showHeader={false}
        />
      </div>
    </Layout>
  );
}
