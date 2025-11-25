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
import { updateServiceProvider } from "@/lib/serviceProviderService";
import type { ServiceProvider } from "@/lib/serviceProviderService";
import { ServiceCategorySelector } from "./ServiceCategorySelector";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface EditServiceProviderDialogProps {
  provider: ServiceProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderUpdated: () => void;
}

export function EditServiceProviderDialog({
  provider,
  open,
  onOpenChange,
  onProviderUpdated,
}: EditServiceProviderDialogProps) {
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [policy, setPolicy] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setCategoryId(provider.category_id || "");
      setDescription(provider.description || "");
      setAddress(provider.address || "");
      setWebsite(provider.website || "");
      setNotes(provider.notes || "");
      setPolicy(provider.policy || "");
      setIsActive(provider.is_active);
    }
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider || !name) return;

    setLoading(true);
    const { error } = await updateServiceProvider(provider.id, {
      name,
      category_id: categoryId || undefined,
      description,
      address,
      website,
      notes,
      policy,
      is_active: isActive,
    });
    setLoading(false);

    if (!error) {
      onOpenChange(false);
      onProviderUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Provider</DialogTitle>
          <DialogDescription>
            Update the service provider details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Provider Name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <ServiceCategorySelector
              value={categoryId}
              onSelect={setCategoryId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Internal Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-policy">Policy</Label>
            <Textarea
              id="edit-policy"
              value={policy}
              onChange={(e) => setPolicy(e.target.value)}
              placeholder="Cancellation policy, terms, etc. (displayed on itinerary)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="edit-is-active">Active</Label>
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
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
