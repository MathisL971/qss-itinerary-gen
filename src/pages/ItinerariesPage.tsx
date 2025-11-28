import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Share2,
  Check,
  Download,
  Link as LinkIcon,
} from "lucide-react";
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
import { parseLocalDate } from "@/lib/utils";

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
      console.log("Exporting PDF for itinerary:", itineraryId);

      setGeneratingPDF(itineraryId);

      const { data, error } = await getItineraryById(itineraryId);
      if (error || !data) {
        alert(
          "Failed to load itinerary: " + (error?.message || "Unknown error")
        );
        return;
      }

      // Get dates from stay (required - all itineraries must have a stay)
      if (!data.stay?.arrival_date || !data.stay?.departure_date) {
        alert("Invalid itinerary: missing stay information");
        return;
      }

      const arrivalDate = parseLocalDate(data.stay.arrival_date);
      const departureDate = parseLocalDate(data.stay.departure_date);
      const dayData = itemsToDayData(data.items, arrivalDate, departureDate);

      const clientName = data.stay?.client?.name || "";
      const villaName = data.stay?.accommodation?.name || "";
      const clientLanguage = data.stay?.client?.language;
      const accommodationName = data.stay?.accommodation?.name || "";

      await generatePDF(
        clientName,
        villaName,
        arrivalDate,
        departureDate,
        dayData,
        clientLanguage,
        accommodationName
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-[0.02em] uppercase text-foreground">
              My Itineraries
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg font-light tracking-wide">
              Manage your exclusive travel collections
            </p>
          </div>
          <Button
            onClick={() => navigate("/itineraries/new")}
            size="lg"
            className="shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="h-4 w-4" />
            New Itinerary
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/5 text-destructive px-6 py-4 rounded-lg mb-8 border border-destructive/10 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            {error}
          </div>
        )}

        {itineraries.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border rounded-xl bg-card/50">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Plus className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-wide uppercase">
              No itineraries yet
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto font-light">
              Start your first collection to create unforgettable experiences.
            </p>
            <Button
              onClick={() => navigate("/itineraries/new")}
              size="lg"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Create Itinerary
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                className="group relative border border-border/60 rounded-xl p-6 bg-card hover:bg-card/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl font-bold tracking-wide uppercase pr-4 leading-tight">
                        {itinerary.stay?.client?.name || "Untitled"}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleShare(itinerary.share_token)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Share"
                        >
                          {copiedToken === itinerary.share_token ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Share2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={generatingPDF === itinerary.id}
                          onClick={() => handleExportPDF(itinerary.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Export PDF"
                        >
                          {generatingPDF === itinerary.id ? (
                            <ClipLoader color="#1a1a1a" size={14} />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground tracking-wider uppercase">
                        {itinerary.stay?.accommodation?.name || "-"}
                      </div>
                      {itinerary.stay_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/stays/${itinerary.stay_id}`);
                          }}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <LinkIcon className="h-3 w-3 mr-1" />
                          View Stay
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-border/40 border-b">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Arrival
                      </span>
                      {itinerary.stay?.arrival_date ? (
                        <>
                          <span className="text-lg">
                            {format(
                              parseLocalDate(itinerary.stay.arrival_date),
                              "MMM d"
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {format(
                              parseLocalDate(itinerary.stay.arrival_date),
                              "yyyy"
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">-</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Departure
                      </span>
                      {itinerary.stay?.departure_date ? (
                        <>
                          <span className="text-lg">
                            {format(
                              parseLocalDate(itinerary.stay.departure_date),
                              "MMM d"
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {format(
                              parseLocalDate(itinerary.stay.departure_date),
                              "yyyy"
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg text-muted-foreground">-</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Details</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(itinerary.id)}
                      className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
                      title="Delete Itinerary"
                    >
                      <Trash2 className="h-4 w-4" />
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
