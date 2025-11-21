import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState(value || "");

  React.useEffect(() => {
    setTimeValue(value || "");
  }, [value]);

  const formatTime = (time: string): string => {
    if (!time) return "";
    // If already in HH:MM format, convert to 12-hour format
    if (time.includes(":")) {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return time;
  };

  const parseTime = (time: string): { hours: number; minutes: number } => {
    if (!time) return { hours: 0, minutes: 0 };

    // Handle 12-hour format (e.g., "2:40 PM")
    const pmMatch = time.match(/(\d+):(\d+)\s*PM/i);
    const amMatch = time.match(/(\d+):(\d+)\s*AM/i);

    if (pmMatch) {
      const hours = parseInt(pmMatch[1], 10);
      const minutes = parseInt(pmMatch[2], 10);
      return { hours: hours === 12 ? 12 : hours + 12, minutes };
    }

    if (amMatch) {
      const hours = parseInt(amMatch[1], 10);
      const minutes = parseInt(amMatch[2], 10);
      return { hours: hours === 12 ? 0 : hours, minutes };
    }

    // Handle 24-hour format (e.g., "14:40")
    const match = time.match(/(\d+):(\d+)/);
    if (match) {
      return {
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10),
      };
    }

    return { hours: 0, minutes: 0 };
  };

  const handleTimeChange = (
    hours: number,
    minutes: number,
    closeAfterSelect = true
  ) => {
    const time24 = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
    const time12 = formatTime(time24);
    setTimeValue(time12);
    onChange?.(time12);
    if (closeAfterSelect) {
      setOpen(false);
    }
  };

  const { hours, minutes } = parseTime(timeValue);
  const displayHours = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full rounded-md border border-input items-center cursor-pointer bg-transparent px-3 py-2 text-sm ring-offset-background transition-colors duration-200",
            "hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "justify-start text-left gap-2",
            open && "ring-2 ring-ring",
            !timeValue && "text-muted-foreground",
            className
          )}
        >
          <Clock className="h-4 w-4 shrink-0" />
          {timeValue || <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 bg-[hsl(var(--color-popover))] border-border rounded-lg"
        align="start"
      >
        <div className="flex items-center gap-4">
          {/* Hours */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Hour
            </label>
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              {hoursList.map((h) => (
                <Button
                  key={h}
                  variant={displayHours === h ? "default" : "ghost"}
                  size="sm"
                  className="w-12 h-8 py-4"
                  onClick={() => {
                    const newHours =
                      ampm === "PM" && h !== 12
                        ? h + 12
                        : ampm === "AM" && h === 12
                        ? 0
                        : h;
                    handleTimeChange(newHours, minutes, false);
                  }}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Minute
            </label>
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              {minutesList
                .filter((m) => m % 5 === 0)
                .map((m) => (
                  <Button
                    key={m}
                    variant={minutes === m ? "default" : "ghost"}
                    size="sm"
                    className="w-12 h-8 py-4"
                    onClick={() => handleTimeChange(hours, m, true)}
                  >
                    {m.toString().padStart(2, "0")}
                  </Button>
                ))}
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Period
            </label>
            <div className="flex flex-col gap-1">
              <Button
                variant={ampm === "AM" ? "default" : "ghost"}
                size="sm"
                className="w-12 h-8"
                onClick={() => {
                  const newHours = ampm === "PM" ? hours - 12 : hours;
                  handleTimeChange(
                    newHours === 0 ? 0 : newHours,
                    minutes,
                    true
                  );
                }}
              >
                AM
              </Button>
              <Button
                variant={ampm === "PM" ? "default" : "ghost"}
                size="sm"
                className="w-12 h-8"
                onClick={() => {
                  const newHours = ampm === "AM" ? hours + 12 : hours;
                  handleTimeChange(
                    newHours === 24 ? 12 : newHours,
                    minutes,
                    true
                  );
                }}
              >
                PM
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Input
            type="time"
            value={`${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              handleTimeChange(h, m);
            }}
            className="h-9"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
