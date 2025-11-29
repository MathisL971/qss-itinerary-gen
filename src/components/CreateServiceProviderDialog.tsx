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
import { createServiceProvider } from "@/lib/serviceProviderService";
import { ServiceCategorySelector } from "./ServiceCategorySelector";
import { Plus, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

interface CreateServiceProviderDialogProps {
  onProviderCreated: () => void;
}

export function CreateServiceProviderDialog({
  onProviderCreated,
}: CreateServiceProviderDialogProps) {
  const { currentOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [policyEn, setPolicyEn] = useState("");
  const [policyFr, setPolicyFr] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !currentOrganization) return;

    setLoading(true);
    const { error } = await createServiceProvider(currentOrganization.id, {
      name,
      category_id: categoryId || undefined,
      description,
      address,
      website,
      notes,
      policy_en: policyEn || undefined,
      policy_fr: policyFr || undefined,
      is_active: isActive,
    });
    setLoading(false);

    if (!error) {
      setOpen(false);
      resetForm();
      onProviderCreated();
    }
  };

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setDescription("");
    setAddress("");
    setWebsite("");
    setNotes("");
    setPolicyEn("");
    setPolicyFr("");
    setIsActive(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Provider</DialogTitle>
          <DialogDescription>
            Create a new service provider profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy-en">Cancellation Policy (English)</Label>
            <Textarea
              id="policy-en"
              value={policyEn}
              onChange={(e) => setPolicyEn(e.target.value)}
              placeholder="Cancellation policy, terms, etc. (displayed on itinerary)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy-fr">Cancellation Policy (French)</Label>
            <Textarea
              id="policy-fr"
              value={policyFr}
              onChange={(e) => setPolicyFr(e.target.value)}
              placeholder="Politique d'annulation, conditions, etc. (affiché sur l'itinéraire)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is-active">Active</Label>
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
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
