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
import {
  getServiceProviderContacts,
  createServiceProviderContact,
  deleteServiceProviderContact,
} from "@/lib/serviceProviderContactService";
import type { ServiceProviderContact } from "@/lib/serviceProviderContactService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Phone, Mail, MessageCircle } from "lucide-react";

interface ManageContactsDialogProps {
  providerId: string | null;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageContactsDialog({
  providerId,
  providerName,
  open,
  onOpenChange,
}: ManageContactsDialogProps) {
  const [contacts, setContacts] = useState<ServiceProviderContact[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New contact state
  const [type, setType] = useState("phone");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const loadContacts = async () => {
    if (!providerId) return;
    setLoading(true);
    const { data } = await getServiceProviderContacts(providerId);
    if (data) setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && providerId) {
      loadContacts();
    }
  }, [open, providerId]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId || !value) return;

    setAddLoading(true);
    const { error } = await createServiceProviderContact({
      service_provider_id: providerId,
      contact_type: type,
      value,
      is_primary: contacts.length === 0, // First one is primary by default
      notes,
    });
    setAddLoading(false);

    if (!error) {
      setValue("");
      setNotes("");
      loadContacts();
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Remove this contact?")) return;
    await deleteServiceProviderContact(id);
    loadContacts();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      case "whatsapp": return <MessageCircle className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Contacts</DialogTitle>
          <DialogDescription>
            Contacts for {providerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* List Contacts */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contacts yet.
              </p>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="text-muted-foreground">
                      {getIcon(contact.contact_type)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate">{contact.value}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {contact.contact_type} {contact.is_primary && "(Primary)"}
                      </span>
                      {contact.notes && (
                        <span className="text-xs text-muted-foreground italic mt-1">
                          {contact.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add Contact Form */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Add New Contact</h4>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div className="flex gap-2">
                <div className="w-1/3">
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-2/3">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Value (e.g. +1234567890)"
                    required
                  />
                </div>
              </div>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note (e.g. Manager's direct line)"
              />
              <Button type="submit" className="w-full" disabled={addLoading}>
                {addLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Contact
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

