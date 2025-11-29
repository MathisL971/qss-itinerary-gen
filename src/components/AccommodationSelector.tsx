import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { searchAccommodations } from "@/lib/accommodationService";
import type { Accommodation } from "@/lib/accommodationService";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface AccommodationSelectorProps {
  value?: string; // accommodation ID
  onSelect: (accommodation: Accommodation | null, name: string) => void;
  initialName?: string;
  className?: string;
  readOnly?: boolean;
}

export function AccommodationSelector({
  onSelect,
  initialName = "",
  className,
  readOnly = false,
}: AccommodationSelectorProps) {
  const { currentOrganization } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialName);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialName);
  }, [initialName]);

  useEffect(() => {
    if (readOnly || !currentOrganization) return;
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchAccommodations(currentOrganization.id, searchTerm).then(({ data }) => {
          if (data) setAccommodations(data);
        });
      } else {
        setAccommodations([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, readOnly, currentOrganization]);

  const handleSelect = (accommodation: Accommodation) => {
    if (readOnly) return;
    setSearchTerm(accommodation.name);
    onSelect(accommodation, accommodation.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const newName = e.target.value;
    setSearchTerm(newName);
    onSelect(null, newName);
    setOpen(true);
  };

  if (readOnly) {
    return (
      <div className={cn("relative", className)}>
        <Label htmlFor="accommodation-search">Accommodation Name</Label>
        <div className="py-2 font-medium text-foreground">
          {initialName || "-"}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="accommodation-search">Accommodation Name</Label>
      <div className="relative">
        <Input
          id="accommodation-search"
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search or enter villa name..."
          className="w-full"
          autoComplete="off"
        />
        {open && accommodations.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {accommodations.map((acc) => (
              <div
                key={acc.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                onClick={() => handleSelect(acc)}
              >
                <span>{acc.name}</span>
                <span className="text-gray-400 text-sm">{acc.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
