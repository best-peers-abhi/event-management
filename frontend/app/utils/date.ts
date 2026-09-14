/**
 * Formats an ISO date string to readable format: "Oct 15, 2026"
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string to 12-hour time: "09:00 AM"
 */
export function formatTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats an ISO date string to: "Oct 15, 2026 • 09:00 AM"
 */
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return `${formatDate(date)} • ${formatTime(date)}`;
}

/**
 * Formats date range: "Oct 15, 2026, 09:00 AM – 06:00 PM"
 */
export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date
): string {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) return '';

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
  }

  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/**
 * Checks if an event is upcoming
 */
export function isUpcoming(dateString: string | Date): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getTime() > Date.now();
}

/**
 * Checks if an event has passed
 */
export function isPast(dateString: string | Date): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date.getTime() <= Date.now();
}

/**
 * Converts date to input string compatible with HTML <input type="datetime-local">
 */
export function toDatetimeLocalInput(dateString?: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  // Format as YYYY-MM-DDThh:mm
  const pad = (num: number) => num.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
