import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMYR(amount: number): string {
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year), parseInt(m) - 1, 1);
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(date);
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getPreviousMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function generateFingerprint(
  accountId: string,
  postedDate: Date,
  amount: number,
  normalizedDescription: string
): string {
  const raw = `${accountId}|${postedDate.toISOString().split("T")[0]}|${amount.toFixed(2)}|${normalizedDescription}`;
  return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
}

export function normalizeDescription(description: string): string {
  return description
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
    // Remove common trailing reference codes: sequences like 123456789, *1234, REF: xxx
    .replace(/\s+REF[:\s]+\S+$/i, "")
    .replace(/\s+\d{8,}$/g, "") // trailing long numbers
    .replace(/\s+\*\d+$/g, "") // trailing *digits
    .trim();
}

export function guessMerchant(description: string): string {
  // Take the first meaningful segment before special chars
  const cleaned = description
    .replace(/\s+\d{4,}\s*/g, " ")
    .replace(/\s+REF[:\s]+\S+/gi, "")
    .trim();

  // Split on common separators and take first part
  const parts = cleaned.split(/[|*/\\@]/);
  return parts[0].trim().substring(0, 50);
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY
  let match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Try YYYY-MM-DD
  match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // Try DD-MM-YYYY
  match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }

  // Try DD MMM YYYY
  match = dateStr.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (match) {
    return new Date(Date.parse(`${match[2]} ${match[1]}, ${match[3]}`));
  }

  // Fallback
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function isNumeric(str: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(str.replace(/,/g, "").trim());
}

export function parseAmount(str: string): number {
  const cleaned = str.replace(/,/g, "").replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned) || 0;
}
