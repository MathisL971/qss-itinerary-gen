import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Download,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import jsPDF from "jspdf";
import "./App.css";
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

interface DayItem {
  id: string;
  time: string;
  event: string;
  location: string;
}

interface DayData {
  date: Date;
  items: DayItem[];
}

function App() {
  // Initialize with dummy data for testing
  const today = new Date();
  const arrival = new Date(today);
  arrival.setDate(today.getDate() + 1); // Tomorrow
  const departure = new Date(arrival);
  departure.setDate(arrival.getDate() + 6); // 6 days after arrival (7 days total)

  const [clientName, setClientName] = useState("John Smith");
  const [villaName, setVillaName] = useState("Oceanview Villa");
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(arrival);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    departure
  );
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [draggedItem, setDraggedItem] = useState<{
    dayIndex: number;
    itemIndex: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    dayIndex: number;
    itemIndex: number;
    position: "top" | "bottom";
  } | null>(null);

  // Generate days based on arrival and departure dates
  useEffect(() => {
    if (!arrivalDate || !departureDate || departureDate < arrivalDate) {
      setDayData([]);
      return;
    }

    setDayData((prevDayData) => {
      const days: DayData[] = [];
      const currentDate = new Date(arrivalDate);

      while (currentDate <= departureDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const existingDay = prevDayData.find(
          (d) => d.date.toISOString().split("T")[0] === dateStr
        );

        days.push({
          date: new Date(currentDate),
          items: existingDay?.items || [],
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return days;
    });
  }, [arrivalDate, departureDate]);

  // Populate dummy data on initial load
  useEffect(() => {
    if (dayData.length > 0 && dayData.every((day) => day.items.length === 0)) {
      const dummyData: DayData[] = dayData.map((day, dayIndex) => {
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
        } else if (dayIndex === 5) {
          // Day 6
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
              event: "Hiking Trail",
              location: "Colombier Beach Trail",
            },
            {
              id: crypto.randomUUID(),
              time: "14:00",
              event: "Picnic Lunch",
              location: "Colombier Beach",
            },
            {
              id: crypto.randomUUID(),
              time: "18:00",
              event: "Sunset Viewing",
              location: "Fort Karl",
            },
            {
              id: crypto.randomUUID(),
              time: "20:30",
              event: "Farewell Dinner",
              location: "L'Esprit Jean-Claude Dufour",
            }
          );
        } else if (dayIndex === 6) {
          // Day 7 - Departure day
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

        return {
          ...day,
          items,
        };
      });

      setDayData(dummyData);
    }
  }, [dayData.length]);

  // Helper to add item to a specific day
  const addDayItem = (dayIndex: number) => {
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
    const updatedDays = [...dayData];
    const items = [...updatedDays[dayIndex].items];
    const [removed] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, removed);
    updatedDays[dayIndex].items = items;
    setDayData(updatedDays);
  };

  // Helper to move item up
  const moveItemUp = (dayIndex: number, itemIndex: number) => {
    if (itemIndex > 0) {
      reorderDayItems(dayIndex, itemIndex, itemIndex - 1);
    }
  };

  // Helper to move item down
  const moveItemDown = (dayIndex: number, itemIndex: number) => {
    const day = dayData[dayIndex];
    if (itemIndex < day.items.length - 1) {
      reorderDayItems(dayIndex, itemIndex, itemIndex + 1);
    }
  };

  // Handle date changes
  const handleArrivalDateChange = (date: Date | undefined) => {
    setArrivalDate(date);
    if (!date || !departureDate || date > departureDate) {
      setDayData([]);
    }
  };

  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);
    if (!date || !arrivalDate || arrivalDate > date) {
      setDayData([]);
    }
  };

  // Helper function to format time (e.g., "14:30" -> "2:30pm")
  const formatTimeForPDF = (time: string): string => {
    if (!time) return "";
    const match = time.match(/(\d{1,2}):(\d{2})/);
    if (!match) return time;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12

    return `${hours}:${minutes}${ampm}`;
  };

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Generate PDF from itinerary data
  const generatePDF = async () => {
    if (!arrivalDate || !departureDate || dayData.length === 0) {
      return;
    }

    // Load logo image and convert to base64, get dimensions
    let logoDataUrl = "";
    let logoWidth = 0;
    let logoHeight = 0;
    try {
      const response = await fetch("/qss-villa-rental-logo.jpg");
      const blob = await response.blob();
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Get image dimensions
      const img = new Image();
      img.src = logoDataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          logoWidth = img.width;
          logoHeight = img.height;
          resolve();
        };
        img.onerror = () => resolve();
      });
    } catch (error) {
      console.error("Error loading logo:", error);
    }

    const doc = new jsPDF();

    // Load Bodoni 72 font if available
    let fontFamily = "times"; // Fallback font
    try {
      // Load Bodoni 72 Book (normal weight)
      const bookFontResponse = await fetch("/bodoni-72-book.ttf");
      if (bookFontResponse.ok) {
        const bookFontBlob = await bookFontResponse.blob();
        const bookFontArrayBuffer = await bookFontBlob.arrayBuffer();
        const bookFontBase64 = btoa(
          String.fromCharCode(...new Uint8Array(bookFontArrayBuffer))
        );

        // Add normal font to jsPDF
        doc.addFileToVFS("Bodoni72-Book.ttf", bookFontBase64);
        doc.addFont("Bodoni72-Book.ttf", "Bodoni72", "normal");
        doc.addFont("Bodoni72-Book.ttf", "Bodoni72", "italic");

        fontFamily = "Bodoni72";

        // Try to load Bodoni 72 Bold for bold text
        try {
          const boldFontResponse = await fetch("/bodoni-72-bold.ttf");
          if (boldFontResponse.ok) {
            const boldFontBlob = await boldFontResponse.blob();
            const boldFontArrayBuffer = await boldFontBlob.arrayBuffer();
            const boldFontBase64 = btoa(
              String.fromCharCode(...new Uint8Array(boldFontArrayBuffer))
            );

            // Add bold font to jsPDF
            doc.addFileToVFS("Bodoni72-Bold.ttf", boldFontBase64);
            doc.addFont("Bodoni72-Bold.ttf", "Bodoni72", "bold");
            doc.addFont("Bodoni72-Bold.ttf", "Bodoni72", "bolditalic");
          }
        } catch (e) {
          // If bold font fails, use book font for bold (fallback)
          doc.addFont("Bodoni72-Book.ttf", "Bodoni72", "bold");
          doc.addFont("Bodoni72-Book.ttf", "Bodoni72", "bolditalic");
        }
      }
    } catch (error) {
      console.warn("Bodoni 72 font not found, using Times fallback:", error);
    }
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const tableIndent = 1; // Indentation on both sides of day tables
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Black color for all elements
    const blackR = 0;
    const blackG = 0;
    const blackB = 0;
    // Medium-light gray color for table row values (between gray and light gray)
    const grayR = 160;
    const grayG = 160;
    const grayB = 160;

    // Font size
    const fontSize = 10;

    // Calculate logo dimensions once
    let logoWidthMm = 0;
    let logoHeightMm = 0;
    if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
      const pixelsToMm = 25.4 / 72;
      logoWidthMm = logoWidth * pixelsToMm;
      logoHeightMm = logoHeight * pixelsToMm;
    }
    const headerHeight = logoHeightMm > 0 ? logoHeightMm + 8 : 18;

    // Function to draw header with logo on every page
    const drawHeader = () => {
      const headerY = margin;
      if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
        const logoX = (pageWidth - logoWidthMm) / 2;
        doc.addImage(
          logoDataUrl,
          "JPEG",
          logoX,
          headerY,
          logoWidthMm,
          logoHeightMm
        );
      } else {
        // Fallback to text if logo fails to load
        doc.setFontSize(fontSize);
        doc.setFont(fontFamily, "bold");
        doc.setTextColor(blackR, blackG, blackB);
        doc.text("QSS", pageWidth / 2, headerY, { align: "center" });
        doc.setFontSize(fontSize);
        doc.setFont(fontFamily, "normal");
        doc.setTextColor(blackR, blackG, blackB);
        doc.text("SAINT BARTH", pageWidth / 2, headerY + 6, {
          align: "center",
        });
      }
    };

    // Function to draw page number in bottom right
    const drawPageNumber = (pageNum: number) => {
      const pageNumberY = pageHeight - margin;
      doc.setFontSize(fontSize - 2);
      doc.setFont(fontFamily, "normal");
      doc.setTextColor(blackR, blackG, blackB);
      doc.text(pageNum.toString(), pageWidth - margin, pageNumberY, {
        align: "right",
      });
    };

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        drawHeader(); // Draw header on new page
        yPosition = margin + headerHeight;
        return true;
      }
      return false;
    };

    // Draw header on first page
    drawHeader();
    yPosition = margin + headerHeight;

    // Header section with CLIENT, VILLA, ARRIVAL, DEPARTURE
    const labelY = yPosition;
    const lineY = yPosition + 1;

    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(blackR, blackG, blackB);

    // Labels
    const labelSpacing = contentWidth / 4;
    doc.text("CLIENT", margin, labelY);
    doc.text("VILLA", margin + labelSpacing, labelY);
    doc.text("ARRIVAL", margin + labelSpacing * 2, labelY);
    doc.text("DEPARTURE", margin + labelSpacing * 3, labelY);

    // Black line
    doc.setDrawColor(blackR, blackG, blackB);
    doc.setLineWidth(0.2);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    // Values
    yPosition = lineY + 4;
    doc.setFontSize(fontSize);
    doc.setTextColor(grayB, grayG, grayB);
    doc.text(clientName || "XXX", margin, yPosition);
    doc.text(villaName || "XXX", margin + labelSpacing, yPosition);
    doc.text(
      arrivalDate ? format(arrivalDate, "MMM d, yyyy").toUpperCase() : "XXX",
      margin + labelSpacing * 2,
      yPosition
    );
    doc.text(
      departureDate
        ? format(departureDate, "MMM d, yyyy").toUpperCase()
        : "XXX",
      margin + labelSpacing * 3,
      yPosition
    );

    yPosition += 15;

    // Main title: YOUR ITINERARY
    doc.setFontSize(fontSize + 2);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(blackR, blackG, blackB);
    doc.text("YOUR ITINERARY", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Iterate through each day
    dayData.forEach((day) => {
      checkPageBreak(40);

      // Day and date header (e.g., "WEDNESDAY 18th")
      const dayName = format(day.date, "EEEE").toUpperCase();
      const dayNumber = day.date.getDate();
      const ordinal = getOrdinalSuffix(dayNumber);
      const dayTitle = `${dayName} ${dayNumber}${ordinal}`;

      doc.setFontSize(fontSize);
      doc.setFont(fontFamily, "bold");
      doc.setTextColor(blackR, blackG, blackB);
      doc.text(dayTitle, margin, yPosition);
      yPosition += 8;

      if (day.items.length === 0) {
        doc.setFontSize(fontSize);
        doc.setFont(fontFamily, "italic");
        doc.setTextColor(blackR, blackG, blackB);
        doc.text("No items added for this day", margin, yPosition);
        yPosition += 10;
      } else {
        // Table headers: TIME, EVENT, LOCATION
        checkPageBreak(20);
        doc.setFontSize(fontSize);
        doc.setFont(fontFamily, "normal");
        doc.setTextColor(blackR, blackG, blackB);

        const tableLeft = margin + tableIndent;
        const tableRight = pageWidth - margin - tableIndent;
        const timeColX = tableLeft;
        const eventColX = tableLeft + 35;
        const locationColX = tableLeft + 120;

        doc.text("TIME", timeColX, yPosition);
        doc.text("EVENT", eventColX, yPosition);
        doc.text("LOCATION", locationColX, yPosition);

        // Black line under headers
        const headerLineY = yPosition + 1;
        doc.setDrawColor(blackR, blackG, blackB);
        doc.setLineWidth(0.2);
        doc.line(tableLeft, headerLineY, tableRight, headerLineY);
        yPosition += 5;

        // Table rows
        day.items.forEach((item, itemIndex) => {
          checkPageBreak(12);

          doc.setFont(fontFamily, "normal");
          doc.setFontSize(fontSize);
          doc.setTextColor(grayR, grayG, grayB);

          // Format time
          const timeText = item.time ? formatTimeForPDF(item.time) : "-";
          const timeMaxWidth = eventColX - timeColX - 5;
          const timeLines = doc.splitTextToSize(timeText, timeMaxWidth);
          doc.text(timeLines, timeColX, yPosition);

          // Event (may need to wrap)
          const eventMaxWidth = locationColX - eventColX - 5;
          const eventLines = doc.splitTextToSize(
            item.event || "-",
            eventMaxWidth
          );
          doc.text(eventLines, eventColX, yPosition);

          // Location (may need to wrap)
          const locationMaxWidth = tableRight - locationColX - 5;
          const locationLines = doc.splitTextToSize(
            item.location || "-",
            locationMaxWidth
          );
          doc.text(locationLines, locationColX, yPosition);

          // Move yPosition based on the tallest column
          // Line height is 6 (consistent with font size 10)
          const maxLines = Math.max(
            timeLines.length,
            eventLines.length,
            locationLines.length,
            1
          );
          yPosition += maxLines * (maxLines === 1 ? 2.5 : 3.6);

          // Black separator line between rows (not after last item)
          if (itemIndex < day.items.length - 1) {
            const tableLeft = margin + tableIndent;
            const tableRight = pageWidth - margin - tableIndent;
            doc.setDrawColor(blackR, blackG, blackB);
            doc.setLineWidth(0.2);
            doc.line(tableLeft, yPosition - 1, tableRight, yPosition - 1);
            yPosition += 3;
          }
        });

        // Add line under the last row of the table
        doc.setDrawColor(blackR, blackG, blackB);
        doc.setLineWidth(0.2);
        doc.line(tableLeft, yPosition - 1, tableRight, yPosition - 1);
        yPosition += 3;
      }

      yPosition += 6; // Space between days
    });

    // Add second page with Cancellation and Delays Policies
    doc.addPage();
    drawHeader(); // Draw header on second page
    yPosition = margin + headerHeight;

    // Main title: CANCELLATION AND DELAYS POLICIES
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(blackR, blackG, blackB);
    doc.text("CANCELLATION AND DELAYS POLICIES", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 12;

    // General Policy Paragraph
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(blackR, blackG, blackB);
    const generalPolicyText =
      "All reservations must be canceled at least 24 to 48 hours in advance to avoid penalty fees. Some establishments also offer a courtesy delay of 15 to 30 minutes. Beyond this grace period, tables may be reassigned, and cancellation fees will apply.";
    const generalPolicyLines = doc.splitTextToSize(
      generalPolicyText,
      pageWidth - 2 * margin
    );
    doc.text(generalPolicyLines, margin, yPosition);
    yPosition += generalPolicyLines.length * 4 + 5;

    // Fee Details and Specific Policies Section
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(blackR, blackG, blackB);
    doc.text("Fee Details and Specific Policies:", margin, yPosition);
    yPosition += 6;

    // Bulleted list of policies
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(blackR, blackG, blackB);

    const policies = [
      "ISOLA: €250 per person fee.",
      "SHELLONA: €250 per person fee, with a 30-minute courtesy policy.",
      "TAMARIN: €150 per person fee.",
      "LA GUÉRITE: €250 per person fee.",
      "MAMO: €260 per person fee.",
      "GYPSEA: 48 HOURS CANCELLATION POLICY - €220 per person fee, with a 15-minute courtesy policy.",
    ];

    policies.forEach((policy) => {
      checkPageBreak(10);
      const bulletX = margin + 5;
      const textX = margin + 10;
      doc.text("•", bulletX, yPosition);

      // Handle GYPSEA special formatting
      if (policy.includes("48 HOURS CANCELLATION POLICY")) {
        const parts = policy.split("48 HOURS CANCELLATION POLICY");
        doc.setFont(fontFamily, "normal");
        doc.text("GYPSEA: ", textX, yPosition);
        const textWidth = doc.getTextWidth("GYPSEA: ");
        doc.setFont(fontFamily, "bolditalic");
        doc.text("48 HOURS CANCELLATION POLICY", textX + textWidth, yPosition);
        doc.setFont(fontFamily, "normal");
        const boldTextWidth = doc.getTextWidth("48 HOURS CANCELLATION POLICY");
        const remainingText = parts[1];
        const remainingLines = doc.splitTextToSize(
          remainingText,
          pageWidth - margin - textX - textWidth - boldTextWidth - 5
        );
        if (remainingLines.length > 1) {
          doc.text(
            remainingLines[0],
            textX + textWidth + boldTextWidth,
            yPosition
          );
          yPosition += 6;
          doc.text(remainingLines.slice(1), textX, yPosition);
        } else {
          doc.text(remainingText, textX + textWidth + boldTextWidth, yPosition);
        }
      } else {
        const policyLines = doc.splitTextToSize(
          policy,
          pageWidth - margin - textX - 5
        );
        doc.text(policyLines, textX, yPosition);
        if (policyLines.length > 1) {
          yPosition += (policyLines.length - 1) * 6;
        }
      }
      yPosition += 5;
    });

    yPosition += 5;

    // For GYPSEA Section
    checkPageBreak(15);
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(blackR, blackG, blackB);
    doc.text("For GYPSEA:", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(blackR, blackG, blackB);
    const gypseaText =
      "Beach beds cannot be pre-confirmed as priority is given to hotel guests. A note has been added to your reservation, and the team will contact you in the morning to reconfirm. Once confirmed, arrival must occur between 10:30 AM and 12:30 PM. If not, the chairs will be released.";
    const gypseaLines = doc.splitTextToSize(gypseaText, pageWidth - 2 * margin);
    doc.text(gypseaLines, margin, yPosition);
    yPosition += gypseaLines.length * 4 + 5;

    // NAILS by Romane Section
    checkPageBreak(15);
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "bold");
    doc.setTextColor(blackR, blackG, blackB);
    doc.text("NAILS by Romane:", margin, yPosition);
    yPosition += 6;

    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "normal");
    doc.setTextColor(blackR, blackG, blackB);
    const nailsText =
      "Modifications or cancellations must be communicated at least 24 hours in advance of the scheduled appointment. Otherwise, a cancellation fee of 100% will apply.";
    const nailsLines = doc.splitTextToSize(nailsText, pageWidth - 2 * margin);
    doc.text(nailsLines, margin, yPosition);

    // Add page numbers to all pages
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawPageNumber(i);
    }

    // Generate filename
    const filename = clientName
      ? `Itinerary_${clientName.replace(/\s+/g, "_")}_${format(
          new Date(),
          "yyyy-MM-dd"
        )}.pdf`
      : `Itinerary_${format(new Date(), "yyyy-MM-dd")}.pdf`;

    // Save the PDF
    doc.save(filename);
  };

  return (
    <div className="app">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <img src="/qss-villa-rental-logo.jpg" alt="QSS Villa Rental Saint Barth Logo" className="logo mx-auto mb-8" />
          <p className="text-muted-foreground text-lg font-light tracking-wide">
            Create personalized travel itineraries
          </p>
        </div>

        <form className="space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6 border border-border/50 rounded-xl p-6 md:p-8 bg-card/30 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-semibold">
                Basic Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="villaName">Villa Name</Label>
                <Input
                  id="villaName"
                  value={villaName}
                  onChange={(e) => setVillaName(e.target.value)}
                  placeholder="Enter villa name"
                />
              </div>
              <div className="space-y-2">
                <Label>Arrival Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !arrivalDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {arrivalDate ? (
                        format(arrivalDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
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
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !departureDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? (
                        format(departureDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
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
                </Popover>
              </div>
            </div>
          </div>

          {/* Itinerary Breakdown Section */}
          {arrivalDate && departureDate && dayData.length > 0 && (
            <div className="space-y-8 border border-border/50 rounded-xl p-6 md:p-8 bg-card/30 backdrop-blur-sm shadow-xl animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full"></div>
                  <h2 className="text-2xl md:text-3xl font-semibold">
                    Itinerary Breakdown
                  </h2>
                </div>
                <Button
                  type="button"
                  onClick={generatePDF}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              </div>
              <div className="space-y-10">
                {dayData.map((day, dayIndex) => (
                  <div key={day.date.toISOString()} className="space-y-4 group">
                    <div className="flex items-center gap-4 pb-3 border-b border-border/50">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                        <span className="text-lg font-bold text-primary">
                          {dayIndex + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">
                          Day {dayIndex + 1}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {format(day.date, "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/50 overflow-hidden bg-card/20">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-[50px] font-semibold"></TableHead>
                            <TableHead className="w-[180px] font-semibold">
                              Time
                            </TableHead>
                            <TableHead className="font-semibold">
                              Event
                            </TableHead>
                            <TableHead className="font-semibold">
                              Location
                            </TableHead>
                            <TableHead className="w-[140px] text-center font-semibold">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {day.items.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-12"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                    <Plus className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <p className="font-medium">
                                    No items added yet
                                  </p>
                                  <p className="text-sm">
                                    Click "Add Item" to get started
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
                                    "group/row cursor-move transition-all",
                                    isDragging && "opacity-50",
                                    isDropTargetTop &&
                                      "border-t-4 border-primary bg-primary/10 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]",
                                    isDropTargetBottom &&
                                      "border-b-4 border-primary bg-primary/10 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                                  )}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggedItem({ dayIndex, itemIndex });
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  onDragOver={(e) => {
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
                                  }}
                                  onDragLeave={(e) => {
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
                                  }}
                                  onDrop={(e) => {
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
                                      if (draggedItem.itemIndex < targetIndex) {
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
                                  }}
                                  onDragEnd={() => {
                                    setDraggedItem(null);
                                    setDropTarget(null);
                                  }}
                                >
                                  <TableCell className="align-middle w-[50px]">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="cursor-grab active:cursor-grabbing">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="align-middle">
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
                                  </TableCell>
                                  <TableCell className="align-middle">
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
                                  </TableCell>
                                  <TableCell className="align-middle">
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
                                  </TableCell>
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
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addDayItem(dayIndex)}
                      className="w-full sm:w-auto hover:bg-primary/10 hover:border-primary/50 transition-all"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
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

export default App;
