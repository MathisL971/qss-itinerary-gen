import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import "../App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DayItem, DayData } from "@/lib/itineraryService";

export interface ItineraryEditorData {
  clientName: string;
  villaName: string;
  arrivalDate: Date | undefined;
  departureDate: Date | undefined;
  dayData: DayData[];
}

interface ItineraryEditorProps {
  initialClientName?: string;
  initialVillaName?: string;
  initialArrivalDate?: Date;
  initialDepartureDate?: Date;
  initialDayData?: DayData[];
  readOnly?: boolean;
  showHeader?: boolean;
  onDataChange?: (data: ItineraryEditorData) => void;
}

export function ItineraryEditor({
  initialClientName = "",
  initialVillaName = "",
  initialArrivalDate,
  initialDepartureDate,
  initialDayData = [],
  readOnly = false,
  showHeader = true,
  onDataChange,
}: ItineraryEditorProps) {
  const [clientName, setClientName] = useState(initialClientName);
  const [villaName, setVillaName] = useState(initialVillaName);
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    initialArrivalDate
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    initialDepartureDate
  );
  const [dayData, setDayData] = useState<DayData[]>(initialDayData);
  const [draggedItem, setDraggedItem] = useState<{
    dayIndex: number;
    itemIndex: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    dayIndex: number;
    itemIndex: number;
    position: "top" | "bottom";
  } | null>(null);
  const [arrivalDateOpen, setArrivalDateOpen] = useState(false);
  const [departureDateOpen, setDepartureDateOpen] = useState(false);

  // Track if we're updating from props to prevent infinite loops
  const isUpdatingFromPropsRef = React.useRef(false);
  // Track last data sent to parent to avoid unnecessary updates
  const lastSentDataRef = React.useRef<ItineraryEditorData | null>(null);

  // Update state when props change
  useEffect(() => {
    isUpdatingFromPropsRef.current = true;
    setClientName(initialClientName);
    setVillaName(initialVillaName);
    setArrivalDate(initialArrivalDate);
    setDepartureDate(initialDepartureDate);

    // Only update dayData from props if it has items, or if dates are invalid
    // Otherwise, let the day generation effect handle it (including dummy data generation)
    const hasItems = initialDayData.some((day) => day.items.length > 0);
    if (
      hasItems ||
      !initialArrivalDate ||
      !initialDepartureDate ||
      initialDepartureDate < initialArrivalDate
    ) {
      setDayData(initialDayData);
    }

    // Use requestAnimationFrame to reset flag after React finishes updating
    requestAnimationFrame(() => {
      isUpdatingFromPropsRef.current = false;
    });
  }, [
    initialClientName,
    initialVillaName,
    initialArrivalDate,
    initialDepartureDate,
    initialDayData,
  ]);

  // Generate days based on arrival and departure dates
  useEffect(() => {
    if (!arrivalDate || !departureDate || departureDate < arrivalDate) {
      setDayData([]);
      return;
    }

    setDayData((prevDayData) => {
      // Check if we already have days for these dates
      const expectedDays =
        Math.ceil(
          (departureDate.getTime() - arrivalDate.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      // If we already have the correct number of days, don't regenerate
      if (prevDayData.length === expectedDays) {
        const firstDay = prevDayData[0];
        const lastDay = prevDayData[prevDayData.length - 1];
        if (
          firstDay &&
          lastDay &&
          firstDay.date.toISOString().split("T")[0] ===
            arrivalDate.toISOString().split("T")[0] &&
          lastDay.date.toISOString().split("T")[0] ===
            departureDate.toISOString().split("T")[0]
        ) {
          return prevDayData;
        }
      }

      // Generate days
      const days: DayData[] = [];
      const currentDate = new Date(arrivalDate);
      const hasExistingItems = prevDayData.some((day) => day.items.length > 0);

      while (currentDate <= departureDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const existingDay = prevDayData.find(
          (d) => d.date.toISOString().split("T")[0] === dateStr
        );

        // If we have existing items, use them; otherwise generate dummy data for new itineraries
        let items: DayItem[] = existingDay?.items || [];

        // Generate dummy data if no existing items and this is a new itinerary (5 days or less)
        if (items.length === 0 && !hasExistingItems && expectedDays <= 5) {
          const dayIndex = days.length;
          items = generateDummyDataForDay(dayIndex, expectedDays);
        }

        days.push({
          date: new Date(currentDate),
          items,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;
    });
  }, [arrivalDate, departureDate]);

  // Helper function to generate dummy data for a specific day
  const generateDummyDataForDay = (
    dayIndex: number,
    totalDays: number
  ): DayItem[] => {
    const items: DayItem[] = [];

    if (dayIndex === 0) {
      // Day 1 - Arrival day
      items.push(
        {
          id: crypto.randomUUID(),
          time: "14:30",
          event: "Arrival with Flight Winair 2334",
          location: "Princess Juliana International Airport",
        },
        {
          id: crypto.randomUUID(),
          time: "15:30",
          event: "Private Transfer to Villa",
          location: "Oceanview Villa",
        },
        {
          id: crypto.randomUUID(),
          time: "18:00",
          event: "Welcome Dinner",
          location: "Beachfront Restaurant",
        }
      );
    } else if (dayIndex === 1) {
      // Day 2
      items.push(
        {
          id: crypto.randomUUID(),
          time: "09:00",
          event: "Breakfast at Villa",
          location: "Oceanview Villa",
        },
        {
          id: crypto.randomUUID(),
          time: "10:30",
          event: "Snorkeling Tour",
          location: "Coral Reef Bay",
        },
        {
          id: crypto.randomUUID(),
          time: "14:00",
          event: "Lunch at Beach Club",
          location: "Sunset Beach Club",
        },
        {
          id: crypto.randomUUID(),
          time: "19:00",
          event: "Sunset Cruise",
          location: "Marina Bay",
        }
      );
    } else if (dayIndex === 2) {
      // Day 3
      items.push(
        {
          id: crypto.randomUUID(),
          time: "08:00",
          event: "Early Morning Yoga Session",
          location: "Beach Pavilion",
        },
        {
          id: crypto.randomUUID(),
          time: "11:00",
          event: "Island Tour",
          location: "Various Locations",
        },
        {
          id: crypto.randomUUID(),
          time: "16:00",
          event: "Shopping at Local Market",
          location: "Downtown Market",
        },
        {
          id: crypto.randomUUID(),
          time: "20:00",
          event: "Fine Dining Experience",
          location: "The Cliff Restaurant",
        }
      );
    } else if (dayIndex === 3) {
      // Day 4
      items.push(
        {
          id: crypto.randomUUID(),
          time: "09:00",
          event: "Breakfast at Villa",
          location: "Oceanview Villa",
        },
        {
          id: crypto.randomUUID(),
          time: "11:00",
          event: "Beach Day",
          location: "Gouverneur Beach",
        },
        {
          id: crypto.randomUUID(),
          time: "15:00",
          event: "Afternoon Spa Treatment",
          location: "Luxury Spa Resort",
        },
        {
          id: crypto.randomUUID(),
          time: "19:30",
          event: "Dinner at Restaurant",
          location: "Bonito St. Barth",
        }
      );
    } else if (dayIndex === 4) {
      // Day 5
      items.push(
        {
          id: crypto.randomUUID(),
          time: "08:30",
          event: "Breakfast at Villa",
          location: "Oceanview Villa",
        },
        {
          id: crypto.randomUUID(),
          time: "10:00",
          event: "Water Sports Activities",
          location: "Grand Cul-de-Sac Beach",
        },
        {
          id: crypto.randomUUID(),
          time: "13:00",
          event: "Lunch at Beach Restaurant",
          location: "La Gloriette",
        },
        {
          id: crypto.randomUUID(),
          time: "17:00",
          event: "Shopping in Gustavia",
          location: "Gustavia Shopping District",
        },
        {
          id: crypto.randomUUID(),
          time: "20:00",
          event: "Cocktail Hour",
          location: "Le Select Bar",
        }
      );
    } else if (dayIndex === totalDays - 1) {
      // Last day - Departure day
      items.push(
        {
          id: crypto.randomUUID(),
          time: "09:00",
          event: "Check-out and Breakfast",
          location: "Oceanview Villa",
        },
        {
          id: crypto.randomUUID(),
          time: "11:00",
          event: "Private Transfer to Airport",
          location: "Princess Juliana International Airport",
        },
        {
          id: crypto.randomUUID(),
          time: "14:00",
          event: "Departure Flight Winair 2335",
          location: "Princess Juliana International Airport",
        }
      );
    }

    return items;
  };

  // Helper to add item to a specific day
  const addDayItem = (dayIndex: number) => {
    if (readOnly) return;
    const newItem: DayItem = {
      id: crypto.randomUUID(),
      time: "",
      event: "",
      location: "",
    };

    const updatedDays = [...dayData];
    updatedDays[dayIndex].items.push(newItem);
    setDayData(updatedDays);
  };

  // Helper to remove item from a specific day
  const removeDayItem = (dayIndex: number, itemId: string) => {
    if (readOnly) return;
    const updatedDays = [...dayData];
    updatedDays[dayIndex].items = updatedDays[dayIndex].items.filter(
      (item) => item.id !== itemId
    );
    setDayData(updatedDays);
  };

  // Helper to update item in a specific day
  const updateDayItem = (
    dayIndex: number,
    itemId: string,
    field: keyof DayItem,
    value: string
  ) => {
    if (readOnly) return;
    const updatedDays = [...dayData];
    const item = updatedDays[dayIndex].items.find((i) => i.id === itemId);
    if (item) {
      item[field] = value;
    }
    setDayData(updatedDays);
  };

  // Helper to reorder items in a specific day
  const reorderDayItems = (
    dayIndex: number,
    fromIndex: number,
    toIndex: number
  ) => {
    if (readOnly) return;
    const updatedDays = [...dayData];
    const items = [...updatedDays[dayIndex].items];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);
    updatedDays[dayIndex].items = items;
    setDayData(updatedDays);
  };

  // Helper to move item up
  const moveItemUp = (dayIndex: number, itemIndex: number) => {
    if (readOnly) return;
    if (itemIndex > 0) {
      reorderDayItems(dayIndex, itemIndex, itemIndex - 1);
    }
  };

  // Helper to move item down
  const moveItemDown = (dayIndex: number, itemIndex: number) => {
    if (readOnly) return;
    const day = dayData[dayIndex];
    if (itemIndex < day.items.length - 1) {
      reorderDayItems(dayIndex, itemIndex, itemIndex + 1);
    }
  };

  // Handle date changes
  const handleArrivalDateChange = (date: Date | undefined) => {
    if (readOnly) return;
    setArrivalDate(date);
    setArrivalDateOpen(false); // Close popover when date is selected
    if (!date || !departureDate || date > departureDate) {
      setDayData([]);
    }
  };

  const handleDepartureDateChange = (date: Date | undefined) => {
    if (readOnly) return;
    setDepartureDate(date);
    setDepartureDateOpen(false); // Close popover when date is selected
    if (!date || !arrivalDate || arrivalDate > date) {
      setDayData([]);
    }
  };

  // Notify parent of data changes (only when user makes changes, not when props update)
  useEffect(() => {
    if (!onDataChange) {
      return;
    }

    const currentData: ItineraryEditorData = {
      clientName,
      villaName,
      arrivalDate,
      departureDate,
      dayData,
    };

    // Check if data actually changed
    const lastSent = lastSentDataRef.current;
    const dataChanged =
      !lastSent ||
      lastSent.clientName !== currentData.clientName ||
      lastSent.villaName !== currentData.villaName ||
      lastSent.arrivalDate !== currentData.arrivalDate ||
      lastSent.departureDate !== currentData.departureDate ||
      lastSent.dayData.length !== currentData.dayData.length ||
      lastSent.dayData.some(
        (day, index) =>
          !currentData.dayData[index] ||
          day.date.toISOString() !==
            currentData.dayData[index].date.toISOString() ||
          day.items.length !== currentData.dayData[index].items.length
      );

    // Skip if we're currently updating from props AND data hasn't changed
    if (isUpdatingFromPropsRef.current && !dataChanged) {
      return;
    }

    // Use a small delay to ensure state updates are complete
    const timeoutId = setTimeout(() => {
      onDataChange(currentData);
      lastSentDataRef.current = currentData;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    clientName,
    villaName,
    arrivalDate,
    departureDate,
    dayData,
    onDataChange,
  ]);

  return (
    <div className="app">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header Section */}
        {showHeader && (
          <div className="text-center mb-12">
            <img
              src="/qss-villa-rental-logo.jpg"
              alt="QSS Villa Rental Saint Barth Logo"
              className="logo mx-auto mb-8"
            />
            <p className="text-muted-foreground text-base font-bodoni font-normal tracking-[0.05em] uppercase">
              Create personalized travel itineraries
            </p>
          </div>
        )}

        <form className="space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-8 border border-border rounded-lg p-10 md:p-12 bg-card shadow-sm">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-bodoni font-bold tracking-[0.05em] uppercase">
                Basic Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="villaName">Villa Name</Label>
                <Input
                  id="villaName"
                  value={villaName}
                  onChange={(e) => setVillaName(e.target.value)}
                  placeholder="Enter villa name"
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Date</Label>
                <Popover
                  open={arrivalDateOpen}
                  onOpenChange={setArrivalDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !arrivalDate && "text-muted-foreground"
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {arrivalDate ? (
                        format(arrivalDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  {!readOnly && (
                    <PopoverContent
                      className="w-auto p-0 bg-[hsl(var(--color-popover))] border-border"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={arrivalDate}
                        onSelect={handleArrivalDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Popover
                  open={departureDateOpen}
                  onOpenChange={setDepartureDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground"
                      )}
                      disabled={readOnly}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? (
                        format(departureDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  {!readOnly && (
                    <PopoverContent
                      className="w-auto p-0 bg-[hsl(var(--color-popover))] border-border"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={handleDepartureDateChange}
                        initialFocus
                      />
                    </PopoverContent>
                  )}
                </Popover>
              </div>
            </div>
          </div>

          {/* Itinerary Breakdown Section */}
          {arrivalDate && departureDate && dayData.length > 0 && (
            <div className="space-y-12 border border-border rounded-lg p-10 md:p-12 bg-card shadow-sm animate-fade-in">
              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-bodoni font-bold tracking-[0.05em] uppercase">
                  Itinerary Breakdown
                </h2>
              </div>
              <div className="space-y-12">
                {dayData.map((day, dayIndex) => (
                  <div key={day.date.toISOString()} className="space-y-6 group">
                    <div className="pb-6 border-b border-border">
                      <div className="flex gap-6 items-center">
                        <span className="text-6xl md:text-7xl font-bodoni font-bold text-foreground/10 leading-none">
                          {String(dayIndex + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="text-3xl md:text-4xl font-bodoni font-bold tracking-[0.05em] uppercase mb-2">
                            Day {dayIndex + 1}
                          </h3>
                          <p className="text-sm text-muted-foreground font-bodoni font-normal tracking-[0.05em] uppercase">
                            {format(day.date, "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border border-border overflow-hidden bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border">
                            {!readOnly && (
                              <TableHead className="w-[50px]"></TableHead>
                            )}
                            <TableHead className="w-[180px] font-bodoni font-bold text-xs tracking-[0.1em] uppercase">
                              Time
                            </TableHead>
                            <TableHead className="font-bodoni font-bold text-xs tracking-[0.1em] uppercase">
                              Event
                            </TableHead>
                            <TableHead className="font-bodoni font-bold text-xs tracking-[0.1em] uppercase">
                              Location
                            </TableHead>
                            {!readOnly && (
                              <TableHead className="w-[140px] text-center font-bodoni font-bold text-xs tracking-[0.1em] uppercase">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {day.items.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={readOnly ? 3 : 5}
                                className="text-center text-muted-foreground py-16"
                              >
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 border border-border">
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <p className="font-bodoni font-bold text-xl tracking-[0.05em] uppercase">
                                    No items added yet
                                  </p>
                                  {!readOnly && (
                                    <p className="text-sm text-muted-foreground">
                                      Click "Add Item" to get started
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            day.items.map((item, itemIndex) => {
                              const isDragging =
                                draggedItem?.dayIndex === dayIndex &&
                                draggedItem?.itemIndex === itemIndex;
                              const isDropTargetTop =
                                dropTarget?.dayIndex === dayIndex &&
                                dropTarget?.itemIndex === itemIndex &&
                                dropTarget?.position === "top" &&
                                !isDragging;
                              const isDropTargetBottom =
                                dropTarget?.dayIndex === dayIndex &&
                                dropTarget?.itemIndex === itemIndex &&
                                dropTarget?.position === "bottom" &&
                                !isDragging;
                              return (
                                <TableRow
                                  key={item.id}
                                  className={cn(
                                    !readOnly &&
                                      "group/row cursor-move transition-all",
                                    isDragging && "opacity-50",
                                    isDropTargetTop &&
                                      "border-t-4 border-primary bg-primary/10 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]",
                                    isDropTargetBottom &&
                                      "border-b-4 border-primary bg-primary/10 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                                  )}
                                  draggable={!readOnly}
                                  onDragStart={
                                    !readOnly
                                      ? (e) => {
                                          setDraggedItem({
                                            dayIndex,
                                            itemIndex,
                                          });
                                          e.dataTransfer.effectAllowed = "move";
                                        }
                                      : undefined
                                  }
                                  onDragOver={
                                    !readOnly
                                      ? (e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = "move";
                                          if (
                                            draggedItem &&
                                            draggedItem.dayIndex === dayIndex &&
                                            draggedItem.itemIndex !== itemIndex
                                          ) {
                                            const rect =
                                              e.currentTarget.getBoundingClientRect();
                                            const y = e.clientY;
                                            const rowMiddle =
                                              rect.top + rect.height / 2;
                                            const position =
                                              y < rowMiddle ? "top" : "bottom";
                                            setDropTarget({
                                              dayIndex,
                                              itemIndex,
                                              position,
                                            });
                                          }
                                        }
                                      : undefined
                                  }
                                  onDragLeave={
                                    !readOnly
                                      ? (e) => {
                                          // Only clear if we're actually leaving the row (not just moving to a child)
                                          const rect =
                                            e.currentTarget.getBoundingClientRect();
                                          const x = e.clientX;
                                          const y = e.clientY;
                                          if (
                                            x < rect.left ||
                                            x > rect.right ||
                                            y < rect.top ||
                                            y > rect.bottom
                                          ) {
                                            setDropTarget(null);
                                          }
                                        }
                                      : undefined
                                  }
                                  onDrop={
                                    !readOnly
                                      ? (e) => {
                                          e.preventDefault();
                                          if (
                                            draggedItem &&
                                            draggedItem.dayIndex === dayIndex &&
                                            dropTarget
                                          ) {
                                            // Calculate target index based on position
                                            let targetIndex =
                                              dropTarget.position === "top"
                                                ? itemIndex
                                                : itemIndex + 1;

                                            // Adjust if dragging down (indices shift after removal)
                                            if (
                                              draggedItem.itemIndex <
                                              targetIndex
                                            ) {
                                              targetIndex -= 1;
                                            }

                                            reorderDayItems(
                                              dayIndex,
                                              draggedItem.itemIndex,
                                              targetIndex
                                            );
                                          }
                                          setDraggedItem(null);
                                          setDropTarget(null);
                                        }
                                      : undefined
                                  }
                                  onDragEnd={
                                    !readOnly
                                      ? () => {
                                          setDraggedItem(null);
                                          setDropTarget(null);
                                        }
                                      : undefined
                                  }
                                >
                                  {!readOnly && (
                                    <TableCell className="align-middle w-[50px]">
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="cursor-grab active:cursor-grabbing">
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      </div>
                                    </TableCell>
                                  )}
                                  <TableCell className="align-middle">
                                    {readOnly ? (
                                      <div className="py-2">
                                        {item.time || "-"}
                                      </div>
                                    ) : (
                                      <TimePicker
                                        value={item.time}
                                        onChange={(value) =>
                                          updateDayItem(
                                            dayIndex,
                                            item.id,
                                            "time",
                                            value
                                          )
                                        }
                                        placeholder="Select time"
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell className="align-middle">
                                    {readOnly ? (
                                      <div className="py-2">
                                        {item.event || "-"}
                                      </div>
                                    ) : (
                                      <Input
                                        value={item.event}
                                        onChange={(e) =>
                                          updateDayItem(
                                            dayIndex,
                                            item.id,
                                            "event",
                                            e.target.value
                                          )
                                        }
                                        placeholder="e.g., Arrival with Flight Winair 2334"
                                        className="h-10 bg-background/50"
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell className="align-middle">
                                    {readOnly ? (
                                      <div className="py-2">
                                        {item.location || "-"}
                                      </div>
                                    ) : (
                                      <Input
                                        value={item.location}
                                        onChange={(e) =>
                                          updateDayItem(
                                            dayIndex,
                                            item.id,
                                            "location",
                                            e.target.value
                                          )
                                        }
                                        placeholder="e.g., Airport X"
                                        className="h-10 bg-background/50"
                                      />
                                    )}
                                  </TableCell>
                                  {!readOnly && (
                                    <TableCell className="align-middle">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            moveItemUp(dayIndex, itemIndex)
                                          }
                                          disabled={itemIndex === 0}
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                          title="Move up"
                                        >
                                          <ChevronUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            moveItemDown(dayIndex, itemIndex)
                                          }
                                          disabled={
                                            itemIndex === day.items.length - 1
                                          }
                                          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                          title="Move down"
                                        >
                                          <ChevronDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            removeDayItem(dayIndex, item.id)
                                          }
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addDayItem(dayIndex)}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Export a way to get current state (for parent components)
export function useItineraryEditorState() {
  // This can be used if we need to expose state to parent
  // For now, parent components will manage their own state
  return null;
}
