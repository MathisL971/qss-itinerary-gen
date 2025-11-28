import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateService } from "@/lib/serviceService";
import type { Service } from "@/lib/serviceService";
import { Loader2 } from "lucide-react";

interface EditServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServiceUpdated: () => void;
}

export function EditServiceDialog({
  service,
  open,
  onOpenChange,
  onServiceUpdated,
}: EditServiceDialogProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [pricingType, setPricingType] = useState<string>("");
  const [capacityMin, setCapacityMin] = useState("");
  const [capacityMax, setCapacityMax] = useState("");
  const [notes, setNotes] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || "");
      setDurationMinutes(service.duration_minutes?.toString() || "");
      setBasePrice(service.base_price?.toString() || "");
      setCurrency(service.currency || "EUR");
      setPricingType(service.pricing_type || "");
      setCapacityMin(service.capacity_min?.toString() || "");
      setCapacityMax(service.capacity_max?.toString() || "");
      setNotes(service.notes || "");
      setIsAvailable(service.is_available);
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !name) return;

    setLoading(true);
    const { error } = await updateService(service.id, {
      name,
      description: description || undefined,
      duration_minutes: durationMinutes ? parseInt(durationMinutes) : undefined,
      base_price: basePrice ? parseFloat(basePrice) : undefined,
      currency,
      pricing_type: pricingType as any || undefined,
      capacity_min: capacityMin ? parseInt(capacityMin) : undefined,
      capacity_max: capacityMax ? parseInt(capacityMax) : undefined,
      notes: notes || undefined,
      is_available: isAvailable,
    });
    setLoading(false);

    if (!error) {
      onOpenChange(false);
      onServiceUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>
            Update service details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dinner, Private Chef, 4h Babysitting"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the service..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="e.g., 120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Base Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g., 150.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pricing Type</Label>
              <Select value={pricingType} onValueChange={setPricingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="per_person">Per Person</SelectItem>
                  <SelectItem value="per_hour">Per Hour</SelectItem>
                  <SelectItem value="custom">Custom/Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacityMin">Min Capacity</Label>
              <Input
                id="capacityMin"
                type="number"
                min="1"
                value={capacityMin}
                onChange={(e) => setCapacityMin(e.target.value)}
                placeholder="e.g., 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacityMax">Max Capacity</Label>
              <Input
                id="capacityMax"
                type="number"
                min="1"
                value={capacityMax}
                onChange={(e) => setCapacityMax(e.target.value)}
                placeholder="e.g., 12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes about this service..."
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="is-available">Available</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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

