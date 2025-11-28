import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { getStayById, type Stay } from "@/lib/stayService";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Share2,
  Check,
  Download,
  Edit,
} from "lucide-react";
import { EditStayDialog } from "@/components/EditStayDialog";
import { ItineraryEditor } from "@/components/ItineraryEditor";
import type { ItineraryEditorData } from "@/components/ItineraryEditor";
import { itemsToDayData, generateShareUrl } from "@/lib/itineraryService";
import { generatePDF } from "@/lib/pdfGenerator";
import { supabase } from "@/lib/supabase";
import { ClipLoader } from "react-spinners";
import { parseLocalDate } from "@/lib/utils";

export function StayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stay, setStay] = useState<Stay | null>(null);
  const [loading, setLoading] = useState(true);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [itineraryData, setItineraryData] =
    useState<ItineraryEditorData | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadStay(id);
    }
  }, [id]);

  const loadStay = async (stayId: string) => {
    setLoading(true);
    setError("");
    const { data, error } = await getStayById(stayId);
    if (error || !data) {
      setError(error?.message || "Failed to load stay");
      setLoading(false);
      return;
    }
    setStay(data);

    // Try to find itinerary for this stay
    const { data: itinerary, error: itineraryError } = await supabase
      .from("itineraries")
      .select("*")
      .eq("stay_id", stayId)
      .single();

    if (!itineraryError && itinerary) {
      setItineraryId(itinerary.id);
      setShareToken(itinerary.share_token);

      // Load itinerary items with service and provider data (including policies)
      const { data: items } = await supabase
        .from("itinerary_items")
        .select(
          `
          *,
          service_provider:service_providers(id, name, policy_en, policy_fr),
          service:services(
            id,
            name,
            base_price,
            currency,
            pricing_type,
            service_providers(id, name, policy_en, policy_fr)
          )
        `
        )
        .eq("itinerary_id", itinerary.id)
        .order("day_date", { ascending: true })
        .order("sort_order", { ascending: true });

      // Use stay dates (always from the stay) - parse in local time to avoid timezone issues
      const arrivalDate = parseLocalDate(data.arrival_date);
      const departureDate = parseLocalDate(data.departure_date);
      // Always generate dayData from dates, even if there are no items
      // itemsToDayData will create empty days if items array is empty
      const dayData = itemsToDayData(items || [], arrivalDate, departureDate);

      setItineraryData({
        clientName: data.client?.name || "",
        villaName: data.accommodation?.name || "",
        clientId: data.client_id,
        accommodationId: data.accommodation_id,
        stayId: data.id,
        arrivalDate,
        departureDate,
        dayData,
      });
    } else {
      // No itinerary exists yet - create empty one with days generated from dates
      const arrivalDate = parseLocalDate(data.arrival_date);
      const departureDate = parseLocalDate(data.departure_date);
      // Generate empty dayData from dates so PDF can be exported
      const dayData = itemsToDayData([], arrivalDate, departureDate);
      setItineraryData({
        clientName: data.client?.name || "",
        villaName: data.accommodation?.name || "",
        clientId: data.client_id,
        accommodationId: data.accommodation_id,
        stayId: data.id,
        arrivalDate,
        departureDate,
        dayData,
      });
    }

    setLoading(false);
  };

  const handleShare = async () => {
    if (!shareToken) return;
    const shareUrl = generateShareUrl(shareToken);
    await navigator.clipboard.writeText(shareUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExportPDF = async () => {
    if (!itineraryData) {
      console.error("No itinerary data available");
      alert(
        "No itinerary data available. Please ensure the stay has an itinerary."
      );
      return;
    }

    if (!stay) {
      console.error("No stay data available");
      alert("No stay data available.");
      return;
    }

    if (!itineraryData.arrivalDate || !itineraryData.departureDate) {
      console.error("Missing dates", {
        arrivalDate: itineraryData.arrivalDate,
        departureDate: itineraryData.departureDate,
      });
      alert(
        "Missing arrival or departure date. Please check the stay details."
      );
      return;
    }

    if (!itineraryData.dayData || itineraryData.dayData.length === 0) {
      console.warn(
        "No day data available, but proceeding with empty itinerary"
      );
      // Allow PDF generation even with empty dayData - the PDF generator handles this
    }

    try {
      setGeneratingPDF(true);
      await generatePDF(
        stay.client?.name || itineraryData.clientName,
        stay.accommodation?.name || itineraryData.villaName,
        itineraryData.arrivalDate,
        itineraryData.departureDate,
        itineraryData.dayData || [],
        stay.client?.language,
        stay.accommodation?.name
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert(
        `Failed to export PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  const formatDate = (dateString: string) => {
    return parseLocalDate(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: Stay["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "checked-in":
        return "bg-blue-100 text-blue-800";
      case "checked-out":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!stay || !itineraryData) {
    return (
      <Layout>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="text-destructive">{error || "Stay not found"}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/stays")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Stays
          </Button>
          <div className="flex items-center gap-2">
            <EditStayDialog
              stay={stay}
              onStayUpdated={() => loadStay(stay.id)}
            />
            {itineraryId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/stays/${stay.id}/itinerary/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Itinerary
              </Button>
            )}
            {shareToken && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-2"
                >
                  {copiedToken === shareToken ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={generatingPDF}
                  className="gap-2"
                >
                  {generatingPDF ? (
                    <>
                      <ClipLoader color="#1a1a1a" size={14} />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export PDF
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                {stay.client?.name || "Unknown Client"}
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Accommodation:
                  </span>
                  <p className="font-medium">
                    {stay.accommodation?.name || "Unknown"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <p className="font-medium">{stay.client?.email || "-"}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Arrival Date
                  </span>
                  <p className="font-medium text-lg">
                    {formatDate(stay.arrival_date)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Departure Date
                  </span>
                  <p className="font-medium text-lg">
                    {formatDate(stay.departure_date)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <p>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                        stay.status
                      )}`}
                    >
                      {stay.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {stay.notes && (
            <div className="mt-6 pt-6 border-t">
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="mt-2">{stay.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6">
          <ItineraryEditor
            initialClientName={itineraryData.clientName}
            initialVillaName={itineraryData.villaName}
            initialClientId={itineraryData.clientId}
            initialAccommodationId={itineraryData.accommodationId}
            initialArrivalDate={itineraryData.arrivalDate}
            initialDepartureDate={itineraryData.departureDate}
            initialDayData={itineraryData.dayData}
            datesLocked={true}
            hideBasicInfo={true}
            readOnly={true}
            showHeader={false}
          />
        </div>
      </div>
    </Layout>
  );
}
