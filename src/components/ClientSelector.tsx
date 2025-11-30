import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { searchClients } from "@/lib/clientService";
import type { Client } from "@/lib/clientService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getTranslations, type Language } from "@/lib/i18n";

interface ClientSelectorProps {
  value?: string; // client ID
  onSelect: (client: Client | null, name: string) => void;
  initialName?: string;
  className?: string;
  readOnly?: boolean;
  language?: Language;
}

export function ClientSelector({
  onSelect,
  initialName = "",
  className,
  readOnly = false,
  language = "en",
}: ClientSelectorProps) {
  const t = getTranslations(language);
  const { currentOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialName);
  const [clients, setClients] = useState<Client[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialName);
  }, [initialName]);

  useEffect(() => {
    if (readOnly || !currentOrganization) return;
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchClients(currentOrganization.id, searchTerm).then(({ data }) => {
          if (data) setClients(data);
        });
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, readOnly, currentOrganization]);

  const handleSelect = (client: Client) => {
    if (readOnly) return;
    setSearchTerm(client.name);
    onSelect(client, client.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const newName = e.target.value;
    setSearchTerm(newName);
    onSelect(null, newName); // Pass name, no ID
    setOpen(true);
  };

  if (readOnly) {
    return (
      <div className={cn("relative", className)}>
        <Label htmlFor="client-search">{t.labels.clientName}</Label>
        <div className="py-2 font-medium text-foreground">
          {initialName || "-"}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="client-search">Client Name</Label>
      <div className="relative">
        <Input
          id="client-search"
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search or enter client name..."
          className="w-full"
          autoComplete="off"
        />
        {open && clients.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {clients.map((client) => (
              <div
                key={client.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                onClick={() => handleSelect(client)}
              >
                <span>{client.name}</span>
                {client.email && (
                  <span className="text-gray-400 text-sm">{client.email}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
