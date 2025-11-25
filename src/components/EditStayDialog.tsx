import { useState, useEffect } from "react";
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
import { updateStay, type Stay } from "@/lib/stayService";
import { Loader2, Edit } from "lucide-react";
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

interface EditStayDialogProps {
  stay: Stay;
  onStayUpdated: () => void;
}

export function EditStayDialog({
  stay,
  onStayUpdated,
}: EditStayDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState(stay.client_id);
  const [accommodationId, setAccommodationId] = useState(stay.accommodation_id);
  const [arrivalDate, setArrivalDate] = useState(stay.arrival_date.split('T')[0]);
  const [departureDate, setDepartureDate] = useState(stay.departure_date.split('T')[0]);
  const [status, setStatus] = useState<Stay["status"]>(stay.status);
  const [notes, setNotes] = useState(stay.notes || "");

  useEffect(() => {
    setClientId(stay.client_id);
    setAccommodationId(stay.accommodation_id);
    setArrivalDate(stay.arrival_date.split('T')[0]);
    setDepartureDate(stay.departure_date.split('T')[0]);
    setStatus(stay.status);
    setNotes(stay.notes || "");
  }, [stay]);

  const handleClientSelect = (client: Client | null) => {
    setClientId(client?.id || "");
  };

  const handleAccommodationSelect = (accommodation: Accommodation | null) => {
    setAccommodationId(accommodation?.id || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !accommodationId || !arrivalDate || !departureDate) return;

    setLoading(true);
    const { error } = await updateStay(stay.id, {
      client_id: clientId,
      accommodation_id: accommodationId,
      arrival_date: arrivalDate,
      departure_date: departureDate,
      status,
      notes: notes || "",
    });
    setLoading(false);

    if (!error) {
      setOpen(false);
      onStayUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stay</DialogTitle>
          <DialogDescription>
            Update the stay details including dates, status, and notes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <ClientSelector
              onSelect={handleClientSelect}
              initialName={stay.client?.name || ""}
            />
          </div>
          <div className="space-y-2">
            <AccommodationSelector
              onSelect={handleAccommodationSelect}
              initialName={stay.accommodation?.name || ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-arrival-date">Arrival Date</Label>
              <Input
                id="edit-arrival-date"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departure-date">Departure Date</Label>
              <Input
                id="edit-departure-date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger id="edit-status">
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
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
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

