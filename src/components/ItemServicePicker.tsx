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
import { ServiceProviderSelector } from "./ServiceProviderSelector";
import { getServicesByProvider, formatServicePrice } from "@/lib/serviceService";
import type { Service } from "@/lib/serviceService";
import { Package, X, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemServicePickerProps {
  serviceId?: string;
  service?: {
    id: string;
    name: string;
    base_price?: number;
    currency?: string;
    pricing_type?: string;
    service_providers?: {
      id: string;
      name: string;
    };
  };
  onServiceChange: (serviceId: string | undefined, service: any | undefined) => void;
  disabled?: boolean;
}

export function ItemServicePicker({
  serviceId,
  service,
  onServiceChange,
  disabled = false,
}: ItemServicePickerProps) {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState<string>(
    service?.service_providers?.id || ""
  );
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Load services when provider changes
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

  // Reset provider ID when dialog opens with existing service
  useEffect(() => {
    if (open && service?.service_providers?.id) {
      setProviderId(service.service_providers.id);
    }
  }, [open, service]);

  const handleSelectService = (selectedService: Service) => {
    onServiceChange(selectedService.id, {
      id: selectedService.id,
      name: selectedService.name,
      base_price: selectedService.base_price,
      currency: selectedService.currency,
      pricing_type: selectedService.pricing_type,
      service_providers: selectedService.service_providers,
    });
    setOpen(false);
  };

  const handleClear = () => {
    onServiceChange(undefined, undefined);
    setProviderId("");
  };

  // Display label
  const displayLabel = service
    ? `${service.service_providers?.name || "Provider"} → ${service.name}`
    : null;

  return (
    <div className="flex items-center gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={service ? "secondary" : "ghost"}
            size="sm"
            disabled={disabled}
            className={cn(
              "h-8 gap-1.5 text-xs",
              !service && "text-muted-foreground"
            )}
          >
            <Package className="h-3.5 w-3.5" />
            {displayLabel ? (
              <span className="max-w-[150px] truncate">{displayLabel}</span>
            ) : (
              <span>Link Service</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Service</DialogTitle>
            <DialogDescription>
              Choose a service provider, then select one of their services.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Provider Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Provider</label>
              <ServiceProviderSelector
                value={providerId}
                onSelect={(provider) => setProviderId(provider?.id || "")}
                placeholder="Search for a provider..."
              />
            </div>

            {/* Services List */}
            {providerId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Available Services</label>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 border rounded-md bg-muted/30">
                    No services available for this provider.
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto border rounded-md">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => handleSelectService(svc)}
                        className={cn(
                          "w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between",
                          serviceId === svc.id && "bg-primary/10"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{svc.name}</div>
                          {svc.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {svc.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {svc.base_price && (
                            <span className="text-sm text-muted-foreground">
                              {formatServicePrice(svc)}
                            </span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clear Button */}
            {service && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleClear}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Service Link
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick clear button when service is selected */}
      {service && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={handleClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

