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
      loadSharedItinerary(token);
    }
  }, [token]);

  const loadSharedItinerary = async (shareToken: string) => {
    setLoading(true);
    setError('');
    const { data, error: err } = await getSharedItinerary(shareToken);

    if (err || !data) {
      setError(err?.message || 'Failed to load shared itinerary');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive">{error}</div>
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

