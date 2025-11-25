import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { searchServiceProviders } from "@/lib/serviceProviderService";
import type { ServiceProvider } from "@/lib/serviceProviderService";
import { cn } from "@/lib/utils";

interface ServiceProviderSelectorProps {
  value?: string; // provider ID
  onSelect: (provider: ServiceProvider | null, name: string) => void;
  initialName?: string;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export function ServiceProviderSelector({
  onSelect,
  initialName = "",
  className,
  readOnly = false,
  placeholder = "Search provider..."
}: ServiceProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialName);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(initialName);
  }, [initialName]);

  useEffect(() => {
    if (readOnly) return;
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchServiceProviders(searchTerm).then(({ data }) => {
          if (data) setProviders(data);
        });
      } else {
        setProviders([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, readOnly]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (provider: ServiceProvider) => {
    if (readOnly) return;
    setSearchTerm(provider.name);
    onSelect(provider, provider.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const newName = e.target.value;
    setSearchTerm(newName);
    onSelect(null, newName); // Pass name, no ID (yet)
    setOpen(true);
  };

  if (readOnly) {
    return (
      <div className={cn("relative", className)}>
        <div className="py-2 font-medium text-foreground">
          {initialName || "-"}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <Input
        ref={inputRef}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full"
        autoComplete="off"
      />
      {open && providers.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
              onClick={() => handleSelect(provider)}
            >
              <span>{provider.name}</span>
              {provider.service_categories?.name && (
                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">
                  {provider.service_categories.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

