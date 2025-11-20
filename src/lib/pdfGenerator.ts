import jsPDF from "jspdf";
import { format } from "date-fns";
import type { DayData } from "./itineraryService";

// Helper function to format time (e.g., "14:30" -> "2:30pm")
function formatTimeForPDF(time: string): string {
  if (!time) return "";
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${hours}:${minutes}${ampm}`;
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(day: number): string {
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
}

export async function generatePDF(
  clientName: string,
  villaName: string,
  arrivalDate: Date,
  departureDate: Date,
  dayData: DayData[]
): Promise<void> {
  if (!arrivalDate || !departureDate || dayData.length === 0) {
    return;
  }

  // Load logo image and convert to base64, get dimensions
  let logoDataUrl = "";
  let logoWidth = 0;
  let logoHeight = 0;
  try {
    const response = await fetch("/logo.png");
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
  doc.setTextColor(grayR, grayG, grayB);
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
}




