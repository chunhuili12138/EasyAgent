const OFFSET_FREE_DATE_TIME = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export function parseAutomationTime(value: string): Date {
  const normalized = OFFSET_FREE_DATE_TIME.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  return new Date(normalized);
}

export function formatAutomationTime(value?: string): string {
  if (!value) return '-';

  const date = parseAutomationTime(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
