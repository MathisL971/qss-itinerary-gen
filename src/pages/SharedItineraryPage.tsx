import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { ItineraryEditor } from "@/components/ItineraryEditor";
import {
  getSharedItinerary,
  itemsToDayData,
  extractPolicies,
  type DayData,
} from "@/lib/itineraryService";
import { parseLocalDate } from "@/lib/utils";
import { getTranslations, getClientLanguage, type Language } from "@/lib/i18n";
import { logger } from "@/lib/logger";

export function SharedItineraryPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [clientName, setClientName] = useState("");
  const [villaName, setVillaName] = useState("");
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined
  );
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [policies, setPolicies] = useState<
    { providerName: string; policy: string }[]
  >([]);
  const [language, setLanguage] = useState<Language>("en");
  const t = getTranslations(language);

  useEffect(() => {
    if (token) {
      // Decode the token in case it's URL encoded
      const decodedToken = decodeURIComponent(token);
      loadSharedItinerary(decodedToken);
    } else {
      setError("Invalid share link. No token provided.");
      setLoading(false);
    }
  }, [token]);

  const loadSharedItinerary = async (shareToken: string) => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await getSharedItinerary(shareToken);

      if (err) {
        logger.error("Error loading shared itinerary:", err);
        setError(
          err.message ||
            err.details ||
            "Failed to load shared itinerary. Please check that the link is correct."
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setError(
          "Shared itinerary not found. The link may be invalid or expired."
        );
        setLoading(false);
        return;
      }

      // Convert database format to editor format
      // Get dates and names from stay
      if (!data.stay) {
        setError("Invalid itinerary: missing stay information");
        setLoading(false);
        return;
      }

      // Parse dates in local time to avoid timezone shift
      const arrival = parseLocalDate(data.stay.arrival_date);
      const departure = parseLocalDate(data.stay.departure_date);
      const days = itemsToDayData(data.items, arrival, departure);

      // Get client language
      const clientLang = getClientLanguage(data.stay.client?.language);
      setLanguage(clientLang);

      setClientName(data.stay.client?.name || "");
      setVillaName(data.stay.accommodation?.name || "");
      setArrivalDate(arrival);
      setDepartureDate(departure);
      setDayData(days);

      // Extract policies from service providers (in the correct language)
      const extractedPolicies = extractPolicies(days, clientLang);
      setPolicies(extractedPolicies);

      setLoading(false);
    } catch (err: any) {
      logger.error("Unexpected error loading shared itinerary:", err);
      setError("An unexpected error occurred. Please try again later.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#1a1a1a" size={48} />
          <div className="text-muted-foreground font-medium">
            {t.messages.loading}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-destructive text-lg font-semibold mb-2">
            {t.messages.errorLoading}
          </div>
          <div className="text-muted-foreground">{error}</div>
          <div className="mt-4 text-sm text-muted-foreground">
            {t.messages.verifyLink}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ItineraryEditor
        initialClientName={clientName}
        initialVillaName={villaName}
        initialArrivalDate={arrivalDate}
        initialDepartureDate={departureDate}
        initialDayData={dayData}
        readOnly={true}
        showHeader={true}
        language={language}
      />

      {/* Service Provider Policies Section */}
      {policies.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="border border-border/60 rounded-xl p-8 md:p-10 bg-card shadow-sm">
            <div className="mb-6 border-b border-border/40 pb-4">
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase text-foreground">
                {t.labels.termsAndPolicies}
              </h2>
            </div>
            <div className="space-y-6">
              {policies.map((p, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-lg">{p.providerName}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                    {p.policy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
