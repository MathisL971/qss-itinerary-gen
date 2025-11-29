import jsPDF from "jspdf";
import { format } from "date-fns";
import type { DayData } from "./itineraryService";
import { extractPolicies } from "./itineraryService";
import { getTranslations, getClientLanguage } from "./i18n";
import { logger } from "./logger";

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
  dayData: DayData[],
  clientLanguage?: string | null,
  accommodationName?: string
): Promise<void> {
  if (!arrivalDate || !departureDate) {
    logger.error("Missing dates for PDF generation", {
      arrivalDate,
      departureDate,
    });
    throw new Error("Arrival and departure dates are required to generate PDF");
  }

  // Allow PDF generation even with empty dayData - we'll show "no items" for each day
  if (!dayData || dayData.length === 0) {
    logger.warn("No day data provided, generating PDF with empty itinerary");
  }

  // Get translations based on client language
  const language = getClientLanguage(clientLanguage);
  const t = getTranslations(language);

  // Load logo image and convert to base64, get dimensions
  let logoDataUrl = "";
  let logoWidth = 0;
  let logoHeight = 0;
  try {
    // Use the high-resolution JPG logo instead of the small PNG
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
    logger.error("Error loading logo:", error);
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
    logger.warn("Bodoni 72 font not found, using Times fallback:", error);
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
  // jsPDF uses points (pt) where 1 pt = 1/72 inch
  // We'll scale the logo to a tiny width (e.g., 17mm = ~48pt)
  let logoWidthPt = 0;
  let logoHeightPt = 0;
  if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
    // Target width: 17mm = 17 * 72 / 25.4 ≈ 48 points
    const targetWidthMm = 17;
    const targetWidthPt = (targetWidthMm * 72) / 25.4;
    const aspectRatio = logoHeight / logoWidth;
    logoWidthPt = targetWidthPt;
    logoHeightPt = targetWidthPt * aspectRatio;
  }
  const headerHeight = logoHeightPt > 0 ? logoHeightPt + 8 : 18;

  // Function to draw header with logo on every page
  const drawHeader = () => {
    const headerY = margin;
    if (logoDataUrl && logoWidth > 0 && logoHeight > 0) {
      const logoX = (pageWidth - logoWidthPt) / 2;
      // Use JPEG format for JPG files - jsPDF will handle the high-resolution image properly
      doc.addImage(
        logoDataUrl,
        "JPEG",
        logoX,
        headerY,
        logoWidthPt,
        logoHeightPt
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
  doc.text(t.labels.client, margin, labelY);
  doc.text(t.labels.villa, margin + labelSpacing, labelY);
  doc.text(t.labels.arrival, margin + labelSpacing * 2, labelY);
  doc.text(t.labels.departure, margin + labelSpacing * 3, labelY);

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
    departureDate ? format(departureDate, "MMM d, yyyy").toUpperCase() : "XXX",
    margin + labelSpacing * 3,
    yPosition
  );

  yPosition += 15;

  // Main title: YOUR ITINERARY
  doc.setFontSize(fontSize + 2);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(blackR, blackG, blackB);
  doc.text(t.labels.yourItinerary, pageWidth / 2, yPosition, {
    align: "center",
  });
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
      doc.text(t.labels.noItemsForDay, margin, yPosition);
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

      doc.text(t.labels.time, timeColX, yPosition);
      doc.text(t.labels.event, eventColX, yPosition);
      doc.text(t.labels.location, locationColX, yPosition);

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

        // Location (may need to wrap) - use accommodation name if is_accommodation_location is true
        const locationText = item.is_accommodation_location
          ? accommodationName || villaName || "Accommodation"
          : item.location || "-";
        const locationMaxWidth = tableRight - locationColX - 5;
        const locationLines = doc.splitTextToSize(
          locationText,
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

  // Extract dynamic policies from service providers used in the itinerary
  // Pass the language to get policies in the correct language
  const dynamicPolicies = extractPolicies(dayData, language);

  // Always add policies page
  doc.addPage();
  drawHeader();
  yPosition = margin + headerHeight;

  // Main title: CONDITIONS & POLICIES
  doc.setFontSize(fontSize + 2);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(blackR, blackG, blackB);
  doc.text(
    language === "fr" ? "CONDITIONS & POLITIQUES" : "CONDITIONS & POLICIES",
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );
  yPosition += 15;

  // Display dynamic policies from linked providers
  if (dynamicPolicies.length > 0) {
    dynamicPolicies.forEach((policy, index) => {
      // Check if we need a new page (estimate space needed for provider name + policy)
      const estimatedLines = Math.ceil(policy.policy.length / 80) + 2;
      checkPageBreak(estimatedLines * 5 + 15);

      // Provider name as header
      doc.setFontSize(fontSize);
      doc.setFont(fontFamily, "bold");
      doc.setTextColor(blackR, blackG, blackB);
      doc.text(policy.providerName.toUpperCase(), margin, yPosition);

      // Underline
      const providerNameWidth = doc.getTextWidth(
        policy.providerName.toUpperCase()
      );
      doc.setDrawColor(blackR, blackG, blackB);
      doc.setLineWidth(0.3);
      doc.line(
        margin,
        yPosition + 1,
        margin + providerNameWidth,
        yPosition + 1
      );
      yPosition += 8;

      // Policy text
      doc.setFontSize(fontSize - 1);
      doc.setFont(fontFamily, "normal");
      doc.setTextColor(60, 60, 60); // Slightly darker than gray for readability
      const policyLines = doc.splitTextToSize(
        policy.policy,
        pageWidth - 2 * margin
      );
      doc.text(policyLines, margin, yPosition);
      yPosition += policyLines.length * 4 + 12;

      // Add a subtle separator between providers (except after the last one)
      if (index < dynamicPolicies.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(
          margin + 20,
          yPosition - 6,
          pageWidth - margin - 20,
          yPosition - 6
        );
      }
    });
  } else {
    // Show message when no policies are available
    doc.setFontSize(fontSize);
    doc.setFont(fontFamily, "italic");
    doc.setTextColor(grayR, grayG, grayB);
    const noPolicesText =
      language === "fr"
        ? "Aucune politique de prestataire spécifique pour cet itinéraire."
        : "No specific service provider policies for this itinerary.";
    doc.text(noPolicesText, margin, yPosition);
    yPosition += 10;
  }

  // General cancellation note
  yPosition += 5;
  checkPageBreak(30);
  doc.setFontSize(fontSize);
  doc.setFont(fontFamily, "bold");
  doc.setTextColor(blackR, blackG, blackB);
  doc.text(
    language === "fr" ? "NOTE IMPORTANTE" : "IMPORTANT NOTE",
    margin,
    yPosition
  );
  yPosition += 6;

  doc.setFontSize(fontSize - 1);
  doc.setFont(fontFamily, "normal");
  doc.setTextColor(60, 60, 60);
  const generalNote =
    language === "fr"
      ? "Veuillez noter que les politiques d'annulation et les conditions peuvent varier selon les prestataires. Nous vous recommandons de confirmer directement avec chaque établissement pour les détails spécifiques."
      : "Please note that cancellation policies and conditions may vary by provider. We recommend confirming directly with each establishment for specific details.";
  const noteLines = doc.splitTextToSize(generalNote, pageWidth - 2 * margin);
  doc.text(noteLines, margin, yPosition);

  // Add page numbers to all pages
  // Get the current page count right before drawing to ensure accuracy
  // In jsPDF, doc.internal.pages is an array where index 0 is metadata/configuration
  // and indices 1+ are actual pages (1-indexed in the PDF)
  // So totalPages = length - 1
  const totalPages = Math.max(1, doc.internal.pages.length - 1);

  // Draw page numbers on each page
  // Use a try-catch to prevent drawing on non-existent pages
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    try {
      doc.setPage(pageNum);
      drawPageNumber(pageNum);
    } catch (error) {
      // If setting the page fails, skip it to avoid drawing on wrong page
      logger.warn(`Could not set page ${pageNum} for numbering:`, error);
      break; // Stop if we hit an invalid page
    }
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
