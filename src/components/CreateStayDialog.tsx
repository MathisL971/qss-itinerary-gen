import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStay } from "@/lib/stayService";
import { createItinerary } from "@/lib/itineraryService";
import { Loader2, Plus } from "lucide-react";
import { ClientSelector } from "./ClientSelector";
import { AccommodationSelector } from "./AccommodationSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/lib/clientService";
import type { Accommodation } from "@/lib/accommodationService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface CreateStayDialogProps {
  onStayCreated: () => void;
}

export function CreateStayDialog({ onStayCreated }: CreateStayDialogProps) {
  const { currentOrganization } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [accommodationId, setAccommodationId] = useState<string>("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [status, setStatus] = useState<"pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled">("pending");
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [accommodationName, setAccommodationName] = useState("");

  const handleClientSelect = (client: Client | null, name: string) => {
    setClientId(client?.id || "");
    setClientName(name);
  };

  const handleAccommodationSelect = (accommodation: Accommodation | null, name: string) => {
    setAccommodationId(accommodation?.id || "");
    setAccommodationName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !accommodationId || !arrivalDate || !departureDate || !clientName || !accommodationName || !currentOrganization) return;

    setLoading(true);
    // Create stay
    const { data: stay, error: stayError } = await createStay(currentOrganization.id, {
      client_id: clientId,
      accommodation_id: accommodationId,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      status,
      notes: notes || "",
    });

    if (stayError || !stay) {
      setLoading(false);
      return;
    }

    // Automatically create an empty itinerary for this stay
    const { error: itineraryError } = await createItinerary(
      currentOrganization.id,
      stay.id,
      [] // Empty dayData
    );

    setLoading(false);

    if (!itineraryError) {
      setOpen(false);
      // Reset form
      setClientId("");
      setAccommodationId("");
      setClientName("");
      setAccommodationName("");
      setArrivalDate("");
      setDepartureDate("");
      setStatus("pending");
      setNotes("");
      onStayCreated();
      // Navigate to the new stay page
      navigate(`/stays/${stay.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Stay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Stay</DialogTitle>
          <DialogDescription>
            Create a new stay record with client, accommodation, dates, and status information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <ClientSelector
              onSelect={handleClientSelect}
              initialName=""
            />
          </div>
          <div className="space-y-2">
            <AccommodationSelector
              onSelect={handleAccommodationSelect}
              initialName=""
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrival-date">Arrival Date</Label>
              <Input
                id="arrival-date"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure-date">Departure Date</Label>
              <Input
                id="departure-date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="checked-out">Checked Out</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !currentOrganization}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Stay
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
