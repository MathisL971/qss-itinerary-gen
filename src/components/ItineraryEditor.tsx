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

import { ClientSelector } from "@/components/ClientSelector";
import { AccommodationSelector } from "@/components/AccommodationSelector";

export interface ItineraryEditorData {
  clientName: string;
  villaName: string;
  clientId?: string;
  accommodationId?: string;
  stayId?: string;
  arrivalDate: Date | undefined;
  departureDate: Date | undefined;
  dayData: DayData[];
}

interface ItineraryEditorProps {
  initialClientName?: string;
  initialVillaName?: string;
  initialClientId?: string;
  initialAccommodationId?: string;
  initialArrivalDate?: Date;
  initialDepartureDate?: Date;
  initialDayData?: DayData[];
  readOnly?: boolean;
  showHeader?: boolean;
  datesLocked?: boolean; // When true, dates are read-only (e.g., when linked to a stay)
  hideBasicInfo?: boolean; // When true, hide the Basic Information section
  onDataChange?: (data: ItineraryEditorData) => void;
}

export function ItineraryEditor({
  initialClientName = "",
  initialVillaName = "",
  initialClientId,
  initialAccommodationId,
  initialArrivalDate,
  initialDepartureDate,
  initialDayData = [],
  readOnly = false,
  showHeader = true,
  datesLocked = false,
  hideBasicInfo = false,
  onDataChange,
}: ItineraryEditorProps) {
  const [clientName, setClientName] = useState(initialClientName);
  const [villaName, setVillaName] = useState(initialVillaName);
  const [clientId, setClientId] = useState(initialClientId);
  const [accommodationId, setAccommodationId] = useState(
    initialAccommodationId
  );
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
  // Track previous prop values to compare by value, not reference
  const prevPropsRef = React.useRef({
    initialClientName,
    initialVillaName,
    initialClientId,
    initialAccommodationId,
    initialArrivalDate,
    initialDepartureDate,
    initialDayData,
  });

  // Helper function to compare dates by value
  const areDatesEqual = (
    a: Date | undefined,
    b: Date | undefined
  ): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.getTime() === b.getTime();
  };

  // Helper function to compare dayData arrays by value
  const areDayDataEqual = (a: DayData[], b: DayData[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((dayA, index) => {
      const dayB = b[index];
      if (!dayB) return false;
      if (dayA.date.toISOString() !== dayB.date.toISOString()) return false;
      if (dayA.items.length !== dayB.items.length) return false;
      return dayA.items.every((itemA, itemIndex) => {
        const itemB = dayB.items[itemIndex];
        if (!itemB) return false;
        return (
          itemA.id === itemB.id &&
          itemA.time === itemB.time &&
          itemA.event === itemB.event &&
          itemA.location === itemB.location
        );
      });
    });
  };

  // Update state when props change (only if values actually changed)
  useEffect(() => {
    const prev = prevPropsRef.current;
    
    // Check if any prop values actually changed
    const clientNameChanged = prev.initialClientName !== initialClientName;
    const villaNameChanged = prev.initialVillaName !== initialVillaName;
    const clientIdChanged = prev.initialClientId !== initialClientId;
    const accommodationIdChanged =
      prev.initialAccommodationId !== initialAccommodationId;
    const arrivalDateChanged = !areDatesEqual(
      prev.initialArrivalDate,
      initialArrivalDate
    );
    const departureDateChanged = !areDatesEqual(
      prev.initialDepartureDate,
      initialDepartureDate
    );
    const dayDataChanged = !areDayDataEqual(
      prev.initialDayData,
      initialDayData
    );

    // Only update if something actually changed
    if (
      !clientNameChanged &&
      !villaNameChanged &&
      !clientIdChanged &&
      !accommodationIdChanged &&
      !arrivalDateChanged &&
      !departureDateChanged &&
      !dayDataChanged
    ) {
      return; // No changes, skip update
    }

    isUpdatingFromPropsRef.current = true;

    if (clientNameChanged) setClientName(initialClientName);
    if (villaNameChanged) setVillaName(initialVillaName);
    if (clientIdChanged) setClientId(initialClientId);
    if (accommodationIdChanged) setAccommodationId(initialAccommodationId);
    if (arrivalDateChanged) setArrivalDate(initialArrivalDate);
    if (departureDateChanged) setDepartureDate(initialDepartureDate);

    // Only update dayData from props if it has items, or if dates are invalid
    // Otherwise, let the day generation effect handle it
    const hasItems = initialDayData.some((day) => day.items.length > 0);
    if (
      dayDataChanged &&
      (hasItems ||
        !initialArrivalDate ||
        !initialDepartureDate ||
        initialDepartureDate < initialArrivalDate)
    ) {
      setDayData(initialDayData);
    }

    // Update ref with current values
    prevPropsRef.current = {
      initialClientName,
      initialVillaName,
      initialClientId,
      initialAccommodationId,
      initialArrivalDate,
      initialDepartureDate,
      initialDayData,
    };

    // Use requestAnimationFrame to reset flag after React finishes updating
    requestAnimationFrame(() => {
      isUpdatingFromPropsRef.current = false;
    });
  }, [
    initialClientName,
    initialVillaName,
    initialClientId,
    initialAccommodationId,
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

      while (currentDate <= departureDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const existingDay = prevDayData.find(
          (d) => d.date.toISOString().split("T")[0] === dateStr
        );

        // If we have existing items, use them; otherwise use empty array
        let items: DayItem[] = existingDay?.items || [];

        days.push({
          date: new Date(currentDate),
          items,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;
    });
  }, [arrivalDate, departureDate]);

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
    if (readOnly || datesLocked) return;
    setArrivalDate(date);
    setArrivalDateOpen(false); // Close popover when date is selected
    if (!date || !departureDate || date > departureDate) {
      setDayData([]);
    }
  };

  const handleDepartureDateChange = (date: Date | undefined) => {
    if (readOnly || datesLocked) return;
    setDepartureDate(date);
    setArrivalDateOpen(false); // Close popover when date is selected
    if (!date || !arrivalDate || arrivalDate > date) {
      setDayData([]);
    }
  };

  // Notify parent of data changes (only when user makes changes, not when props update)
  useEffect(() => {
    if (!onDataChange || readOnly) {
      return;
    }

    const currentData: ItineraryEditorData = {
      clientName,
      villaName,
      clientId,
      accommodationId,
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
      lastSent.clientId !== currentData.clientId ||
      lastSent.accommodationId !== currentData.accommodationId ||
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
    clientId,
    accommodationId,
    arrivalDate,
    departureDate,
    dayData,
    onDataChange,
  ]);

  return (
    <div className="app">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Section */}
        {showHeader && (
          <div className="text-center mb-12">
            <img
              src="/qss-villa-rental-logo.jpg"
              alt="QSS Villa Rental Saint Barth Logo"
              className="logo mx-auto mb-8"
            />
            {!readOnly && (
              <p className="text-muted-foreground text-base font-normal tracking-[0.05em] uppercase">
                Create personalized travel itineraries
              </p>
            )}
          </div>
        )}

        <form className="space-y-8">
          {/* Basic Info Section */}
          {!hideBasicInfo && (
            <div className="space-y-8 border border-border/60 rounded-xl p-8 md:p-10 bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="mb-8 border-b border-border/40 pb-6">
                <h2 className="text-2xl md:text-3xl font-bold tracking-wide uppercase text-foreground">
                  Basic Information
                </h2>
                {!readOnly && (
                  <p className="text-muted-foreground mt-2 font-light">
                    Enter the key details for this trip
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <ClientSelector
                    value={clientId}
                    initialName={clientName}
                    readOnly={readOnly}
                    onSelect={(client, name) => {
                      setClientName(name);
                      setClientId(client?.id);
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <AccommodationSelector
                    value={accommodationId}
                    initialName={villaName}
                    readOnly={readOnly}
                    onSelect={(acc, name) => {
                      setVillaName(name);
                      setAccommodationId(acc?.id);
                    }}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Arrival Date
                  </Label>
                  {readOnly ? (
                    <div className="py-2 font-medium text-foreground">
                      {arrivalDate ? format(arrivalDate, "PPP") : "-"}
                    </div>
                  ) : (
                    <Popover
                      open={arrivalDateOpen}
                      onOpenChange={setArrivalDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex h-10 w-full rounded-md border border-input items-center cursor-pointer bg-transparent px-3 py-2 text-sm ring-offset-background transition-colors duration-200",
                            "hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "focus:outline-none focus:ring-2 focus:ring-ring",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "justify-start text-left gap-2",
                            arrivalDateOpen && "ring-2 ring-ring",
                            !arrivalDate && "text-muted-foreground"
                          )}
                          disabled={datesLocked}
                          type="button"
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          {arrivalDate ? (
                            format(arrivalDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      {!datesLocked && (
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
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    Departure Date
                  </Label>
                  {readOnly ? (
                    <div className="py-2 font-medium text-foreground">
                      {departureDate ? format(departureDate, "PPP") : "-"}
                    </div>
                  ) : (
                    <Popover
                      open={departureDateOpen}
                      onOpenChange={setDepartureDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          className={cn(
                            "flex h-10 w-full rounded-md border border-input items-center cursor-pointer bg-transparent px-3 py-2 text-sm ring-offset-background transition-colors duration-200",
                            "hover:border-ring/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "focus:outline-none focus:ring-2 focus:ring-ring",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            "justify-start text-left gap-2",
                            departureDateOpen && "ring-2 ring-ring",
                            !departureDate && "text-muted-foreground"
                          )}
                          disabled={datesLocked}
                          type="button"
                        >
                          <CalendarIcon className="h-4 w-4 shrink-0" />
                          {departureDate ? (
                            format(departureDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      {!datesLocked && (
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
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Itinerary Breakdown Section */}
          {arrivalDate && departureDate && dayData.length > 0 && (
            <div className="space-y-16 animate-fade-in">
              <div className="text-center py-8 m-0">
                <h2 className="text-3xl md:text-4xl font-bold tracking-widest uppercase border-b-2 border-foreground/5 inline-block pb-4">
                  Itinerary Breakdown
                </h2>
              </div>
              <div className="space-y-12">
                {dayData.map((day, dayIndex) => (
                  <div key={day.date.toISOString()} className="space-y-6 group">
                    <div className="flex gap-6 border-b border-border/40 pb-4 items-center">
                      <span className="text-5xl md:text-6xl font-bodoni font-bold text-foreground/5 leading-none select-none">
                        {String(dayIndex + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold tracking-wide uppercase mb-1">
                          Day {dayIndex + 1}
                        </h3>
                        <p className="text-sm text-muted-foreground tracking-widest uppercase">
                          {format(day.date, "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="border border-border/60 rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
                            {!readOnly && (
                              <TableHead className="w-[50px]"></TableHead>
                            )}
                            <TableHead className="w-[180px] font-bold text-[11px] tracking-widest uppercase text-muted-foreground py-4 px-4">
                              Time
                            </TableHead>
                            <TableHead className="font-bold text-[11px] tracking-widest uppercase text-muted-foreground py-4 px-4">
                              Event
                            </TableHead>
                            <TableHead className="font-bold text-[11px] tracking-widest uppercase text-muted-foreground py-4 px-4">
                              Location
                            </TableHead>
                            {!readOnly && (
                              <TableHead className="w-[140px] text-center font-bold text-[11px] tracking-widest uppercase text-muted-foreground py-4">
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
                                className="text-center py-12"
                              >
                                <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
                                    <Plus className="h-5 w-5" />
                                  </div>
                                  <p className="text-lg tracking-wide uppercase">
                                    No items added yet
                                  </p>
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
                                  <TableCell className="align-middle px-4">
                                    {readOnly ? (
                                      <div className="py-2 font-medium">
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
                                  <TableCell className="align-middle px-4">
                                    {readOnly ? (
                                      <div className="py-2 font-medium">
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
                                        className="h-10 bg-transparent border border-input hover:border-border/50 focus:border-ring/50 px-3"
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell className="align-middle px-4">
                                    {readOnly ? (
                                      <div className="py-2 text-muted-foreground">
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
                                        className="h-10 bg-transparent border border-input hover:border-border/50 focus:border-ring/50 px-3"
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
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addDayItem(dayIndex)}
                          className="w-full sm:w-auto gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Item</span>
                        </Button>
                      </div>
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
