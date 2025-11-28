import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getServicesByProvider,
  deleteService,
  formatServicePrice,
  formatDuration,
} from "@/lib/serviceService";
import type { Service } from "@/lib/serviceService";
import { CreateServiceDialog } from "./CreateServiceDialog";
import { EditServiceDialog } from "./EditServiceDialog";
import { Loader2, Edit, Trash2, Clock, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageServicesDialogProps {
  providerId: string | null;
  providerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageServicesDialog({
  providerId,
  providerName,
  open,
  onOpenChange,
}: ManageServicesDialogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadServices = async () => {
    if (!providerId) return;
    setLoading(true);
    const { data } = await getServicesByProvider(providerId);
    if (data) setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && providerId) {
      loadServices();
    }
  }, [open, providerId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    await deleteService(id);
    loadServices();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Services</DialogTitle>
          <DialogDescription>
            Services offered by {providerName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Services List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No services yet.</p>
              <p className="text-sm">
                Add services to track what this provider offers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    "px-4 py-2 border rounded-lg",
                    !service.is_available && "opacity-60 bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        {!service.is_available && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Unavailable
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      {service.base_price ||
                        service.duration_minutes ||
                        service.capacity_min ||
                        (service.capacity_max && (
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {service.base_price && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {formatServicePrice(service)}
                              </div>
                            )}
                            {service.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDuration(service.duration_minutes)}
                              </div>
                            )}
                            {(service.capacity_min || service.capacity_max) && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {service.capacity_min && service.capacity_max
                                  ? `${service.capacity_min}-${service.capacity_max} guests`
                                  : service.capacity_max
                                  ? `Up to ${service.capacity_max} guests`
                                  : `Min ${service.capacity_min} guests`}
                              </div>
                            )}
                          </div>
                        ))}
                      {service.notes && (
                        <p className="text-xs text-muted-foreground italic mt-2 border-l-2 pl-2">
                          {service.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingService(service);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Service Button */}
        <div className="pt-4 border-t">
          {providerId && (
            <CreateServiceDialog
              providerId={providerId}
              onServiceCreated={loadServices}
            />
          )}
        </div>

        <EditServiceDialog
          service={editingService}
          open={editOpen}
          onOpenChange={setEditOpen}
          onServiceUpdated={loadServices}
        />
      </DialogContent>
    </Dialog>
  );
}
