import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DateFormatType = 'full' | 'short' | 'dateOnly';

export function formatDate(date: Date, formatType: DateFormatType = 'full'): string {
  // Convert to Date object if it's not already
  const dateObj = new Date(date);
  
  // Use en-US locale for consistent formatting on both server and client
  switch(formatType) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    case 'dateOnly':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'full':
    default:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  }
}
