import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServicesByProvider } from "@/lib/serviceService";
import type { Service } from "@/lib/serviceService";

interface ServiceSelectorProps {
  providerId: string;
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ServiceSelector({
  providerId,
  value,
  onSelect,
  placeholder = "Select service...",
  disabled = false,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!providerId) {
      setServices([]);
      return;
    }

    const loadServices = async () => {
      setLoading(true);
      const { data } = await getServicesByProvider(providerId);
      if (data) setServices(data);
      setLoading(false);
    };

    loadServices();
  }, [providerId]);

  if (!providerId) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select a provider first" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onSelect} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {services.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No services available
          </div>
        ) : (
          services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
              {service.base_price && (
                <span className="text-muted-foreground ml-2">
                  ({service.currency} {service.base_price})
                </span>
              )}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

