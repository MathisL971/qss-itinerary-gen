import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getStays } from "@/lib/stayService";
import type { Stay } from "@/lib/stayService";
import { cn, parseLocalDate } from "@/lib/utils";

interface StaySelectorProps {
  value?: string; // stay ID
  onSelect: (stay: Stay | null, displayText: string) => void;
  initialValue?: string;
  className?: string;
}

export function StaySelector({
  onSelect,
  initialValue = "",
  className,
}: StaySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [stays, setStays] = useState<Stay[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const loadStays = async () => {
      const { data } = await getStays();
      if (data) {
        setStays(data);
      }
    };
    loadStays();
  }, []);

  const filteredStays = stays.filter((stay) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      stay.client?.name?.toLowerCase().includes(searchLower) ||
      stay.accommodation?.name?.toLowerCase().includes(searchLower) ||
      stay.arrival_date.includes(searchTerm) ||
      stay.departure_date.includes(searchTerm)
    );
  });

  const formatStayDisplay = (stay: Stay) => {
    return `${stay.client?.name || "Unknown"} - ${stay.accommodation?.name || "Unknown"} (${parseLocalDate(stay.arrival_date).toLocaleDateString()} - ${parseLocalDate(stay.departure_date).toLocaleDateString()})`;
  };

  const handleSelect = (stay: Stay) => {
    const displayText = formatStayDisplay(stay);
    setSearchTerm(displayText);
    onSelect(stay, displayText);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    const matchingStay = filteredStays.find((stay) => formatStayDisplay(stay) === newValue);
    onSelect(matchingStay || null, newValue);
    setOpen(true);
  };

  return (
    <div className={cn("relative", className)}>
      <Label htmlFor="stay-search">Stay</Label>
      <div className="relative">
        <Input
          id="stay-search"
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search or select stay..."
          className="w-full"
          autoComplete="off"
        />
        {open && filteredStays.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredStays.map((stay) => (
              <div
                key={stay.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSelect(stay)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stay.client?.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {stay.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {stay.accommodation?.name} • {parseLocalDate(stay.arrival_date).toLocaleDateString()} - {parseLocalDate(stay.departure_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

