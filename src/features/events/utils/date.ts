export function formatDateTime(date: string | undefined) {
  if (!date) return undefined;

  // datetime-local: 2026-07-03T09:30
  if (date.length === 16) {
    return `${date}:00`;
  }

  return date;
}