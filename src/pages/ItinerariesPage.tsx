import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Share2, Check, Download } from "lucide-react";
import { ClipLoader } from "react-spinners";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  getUserItineraries,
  deleteItinerary,
  generateShareUrl,
  getItineraryById,
  itemsToDayData,
  type Itinerary,
} from "@/lib/itineraryService";
import { generatePDF } from "@/lib/pdfGenerator";

export function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await getUserItineraries();
    if (err) {
      setError(err.message || "Failed to load itineraries");
    } else {
      setItineraries(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this itinerary?")) {
      return;
    }

    const { error } = await deleteItinerary(id);
    if (error) {
      alert(
        "Failed to delete itinerary: " + (error.message || "Unknown error")
      );
    } else {
      loadItineraries();
    }
  };

  const handleShare = async (shareToken: string) => {
    const shareUrl = generateShareUrl(shareToken);
    await navigator.clipboard.writeText(shareUrl);
    setCopiedToken(shareToken);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleExportPDF = async (itineraryId: string) => {
    try {
      setGeneratingPDF(itineraryId);

      const { data, error } = await getItineraryById(itineraryId);
      if (error || !data) {
        alert(
          "Failed to load itinerary: " + (error?.message || "Unknown error")
        );
        return;
      }

      const arrivalDate = new Date(data.arrival_date);
      const departureDate = new Date(data.departure_date);
      const dayData = itemsToDayData(data.items, arrivalDate, departureDate);

      await generatePDF(
        data.client_name,
        data.villa_name,
        arrivalDate,
        departureDate,
        dayData
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setGeneratingPDF(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center gap-4">
            <ClipLoader color="#1a1a1a" size={48} />
            <div className="text-muted-foreground font-medium">
              Loading itineraries...
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <h1 className="text-5xl font-bodoni font-bold tracking-[0.05em] uppercase">
              My Itineraries
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Create and manage your travel itineraries
            </p>
          </div>
          <Button onClick={() => navigate("/itineraries/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Itinerary
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {itineraries.length === 0 ? (
          <div className="text-center py-24 border border-border rounded-lg bg-card shadow-sm">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 border border-border">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-4xl font-bodoni font-bold mb-4 tracking-[0.05em] uppercase">
              No itineraries yet
            </h2>
            <p className="text-muted-foreground mb-8 text-base">
              Create your first itinerary to get started
            </p>
            <Button onClick={() => navigate("/itineraries/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Itinerary
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                className="border border-border rounded-lg p-8 bg-card hover:shadow-md hover:border-foreground/20 transition-all duration-200"
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 justify-between mb-2">
                      <h3 className="text-2xl font-bodoni font-bold tracking-[0.03em] uppercase">
                        {itinerary.client_name || "Untitled"}
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(itinerary.share_token)}
                          className="flex-1"
                        >
                          {copiedToken === itinerary.share_token ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Share2 className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={generatingPDF === itinerary.id}
                          onClick={() => handleExportPDF(itinerary.id)}
                          className="flex-1"
                        >
                          {generatingPDF === itinerary.id ? (
                            <ClipLoader color="#1a1a1a" size={16} />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {itinerary.villa_name}
                    </p>
                  </div>

                  <div className="text-sm space-y-1.5">
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Arrival:{" "}
                      </span>
                      <span className="font-bodoni">
                        {format(
                          new Date(itinerary.arrival_date),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Departure:{" "}
                      </span>
                      <span className="font-bodoni">
                        {format(
                          new Date(itinerary.departure_date),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(itinerary.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      DELETE
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
