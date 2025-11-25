import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string (YYYY-MM-DD) into a Date object in local time.
 * This prevents timezone issues where dates can shift by one day.
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local time
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }
  
  // Split the date string (YYYY-MM-DD)
  const parts = dateString.split('T')[0].split('-');
  if (parts.length !== 3) {
    // Fallback to standard parsing if format is unexpected
    return new Date(dateString);
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2], 10);
  
  // Create date in local time (not UTC)
  return new Date(year, month, day);
}






