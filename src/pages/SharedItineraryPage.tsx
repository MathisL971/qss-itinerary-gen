import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { ItineraryEditor } from '@/components/ItineraryEditor';
import {
  getSharedItinerary,
  itemsToDayData,
  type DayData,
} from '@/lib/itineraryService';

export function SharedItineraryPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [clientName, setClientName] = useState('');
  const [villaName, setVillaName] = useState('');
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined
  );
  const [dayData, setDayData] = useState<DayData[]>([]);

  useEffect(() => {
    if (token) {
      // Decode the token in case it's URL encoded
      const decodedToken = decodeURIComponent(token);
      loadSharedItinerary(decodedToken);
    } else {
      setError('Invalid share link. No token provided.');
      setLoading(false);
    }
  }, [token]);

  const loadSharedItinerary = async (shareToken: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await getSharedItinerary(shareToken);

      if (err) {
        console.error('Error loading shared itinerary:', err);
        setError(
          err.message || 
          err.details || 
          'Failed to load shared itinerary. Please check that the link is correct.'
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Shared itinerary not found. The link may be invalid or expired.');
        setLoading(false);
        return;
      }

      // Convert database format to editor format
      const arrival = new Date(data.arrival_date);
      const departure = new Date(data.departure_date);
      const days = itemsToDayData(data.items, arrival, departure);

      setClientName(data.client_name);
      setVillaName(data.villa_name);
      setArrivalDate(arrival);
      setDepartureDate(departure);
      setDayData(days);
      setLoading(false);
    } catch (err: any) {
      console.error('Unexpected error loading shared itinerary:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ClipLoader color="#1a1a1a" size={48} />
          <div className="text-muted-foreground font-medium">Loading shared itinerary...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-destructive text-lg font-semibold mb-2">
            Error Loading Shared Itinerary
          </div>
          <div className="text-muted-foreground">{error}</div>
          <div className="mt-4 text-sm text-muted-foreground">
            Please verify that you copied the complete link and try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <ItineraryEditor
      initialClientName={clientName}
      initialVillaName={villaName}
      initialArrivalDate={arrivalDate}
      initialDepartureDate={departureDate}
      initialDayData={dayData}
      readOnly={true}
      showHeader={true}
    />
  );
}

