import Papa from "papaparse";
import { TransactionDirection } from "@prisma/client";
import { ParsedTransaction, StatementProfile, ColumnMapping } from "@/types";
import {
  parseDate,
  parseAmount,
  normalizeDescription,
  guessMerchant,
  generateFingerprint,
  isNumeric,
} from "@/lib/utils";
import { BankProfileA } from "./profiles/bank-format-a";
import { BankProfileB } from "./profiles/bank-format-b";
import { GenericProfile } from "./profiles/generic";

const PROFILES: StatementProfile[] = [BankProfileB, BankProfileA, GenericProfile];

export interface ParseCSVResult {
  transactions: ParsedTransaction[];
  profile: string;
  errors: string[];
  rawHeaders: string[];
  mapping: ColumnMapping;
}

function detectProfile(headers: string[]): StatementProfile {
  for (const profile of PROFILES) {
    if (profile.detectHeaders(headers)) return profile;
  }
  // Default: use generic auto-detection
  return GenericProfile;
}

function heuristicMapping(headers: string[], rows: Record<string, string>[]): ColumnMapping {
  // Find date column: try parsing sample values
  let dateColumn = "";
  let descriptionColumn = "";
  let amountColumn: string | undefined;
  let debitColumn: string | undefined;
  let creditColumn: string | undefined;

  const sample = rows.slice(0, 5);

  for (const header of headers) {
    const vals = sample.map((r) => (r[header] || "").trim()).filter(Boolean);

    // Date detection
    if (!dateColumn && vals.some((v) => parseDate(v) !== null)) {
      dateColumn = header;
      continue;
    }

    // Amount detection (numeric)
    const numericCount = vals.filter((v) => isNumeric(v)).length;
    const headerUpper = header.toUpperCase();

    if (numericCount >= Math.min(2, vals.length)) {
      if (headerUpper.includes("DEBIT") || headerUpper === "DR") {
        debitColumn = header;
      } else if (headerUpper.includes("CREDIT") || headerUpper === "CR") {
        creditColumn = header;
      } else if (!amountColumn) {
        amountColumn = header;
      }
    }
  }

  // Description: longest average string column that isn't date/amount
  const usedColumns = new Set([dateColumn, amountColumn, debitColumn, creditColumn].filter(Boolean));
  let maxAvgLen = 0;

  for (const header of headers) {
    if (usedColumns.has(header)) continue;
    const vals = sample.map((r) => (r[header] || "").trim());
    const avgLen = vals.reduce((s, v) => s + v.length, 0) / (vals.length || 1);
    if (avgLen > maxAvgLen) {
      maxAvgLen = avgLen;
      descriptionColumn = header;
    }
  }

  return {
    dateColumn: dateColumn || headers[0],
    descriptionColumn: descriptionColumn || headers[1],
    amountColumn,
    debitColumn,
    creditColumn,
  };
}

export function parseCSVContent(
  csvContent: string,
  accountId: string
): ParseCSVResult {
  const errors: string[] = [];

  // Strip BOM if present
  const content = csvContent.replace(/^\uFEFF/, "");

  // Parse CSV
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const fatalErrors = result.errors.filter((e) => e.type === "Delimiter");
    if (fatalErrors.length > 0) {
      errors.push(...fatalErrors.map((e) => e.message));
    }
  }

  const headers = result.meta.fields || [];
  if (headers.length === 0) {
    return { transactions: [], profile: "unknown", errors: ["No headers found"], rawHeaders: [], mapping: { dateColumn: "", descriptionColumn: "" } };
  }

  // Detect profile
  const profile = detectProfile(headers);
  let mapping = profile.mapColumns(headers);

  // Validate mapping with heuristic fallback
  const sampleRows = result.data.slice(0, 10);
  if (!mapping.dateColumn || !mapping.descriptionColumn) {
    mapping = heuristicMapping(headers, sampleRows);
  }

  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const rawLine = Object.values(row).join(",");

    try {
      // Parse date
      const dateStr = row[mapping.dateColumn]?.trim() || "";
      const postedDate = parseDate(dateStr);
      if (!postedDate || isNaN(postedDate.getTime())) {
        // Skip header-like rows or empty rows
        if (dateStr) errors.push(`Row ${i + 2}: Cannot parse date "${dateStr}"`);
        continue;
      }

      // Parse description
      const description = row[mapping.descriptionColumn]?.trim() || "";
      if (!description) {
        errors.push(`Row ${i + 2}: Empty description`);
        continue;
      }

      // Parse amount + direction
      let amount = 0;
      let direction: TransactionDirection = "DEBIT";

      if (mapping.debitColumn && mapping.creditColumn) {
        const parseResult = profile.parseAmount
          ? profile.parseAmount(
              row[mapping.debitColumn] || "",
              row[mapping.creditColumn] || ""
            )
          : defaultParseDebitCredit(
              row[mapping.debitColumn] || "",
              row[mapping.creditColumn] || ""
            );
        amount = parseResult.amount;
        direction = parseResult.direction;
      } else if (mapping.amountColumn) {
        const rawAmount = row[mapping.amountColumn]?.trim() || "0";
        const parsed = parseAmount(rawAmount);
        if (parsed < 0) {
          amount = Math.abs(parsed);
          direction = "CREDIT";
        } else {
          amount = parsed;
          direction = "DEBIT";
        }
      }

      if (amount === 0 && !mapping.debitColumn) {
        errors.push(`Row ${i + 2}: Zero or invalid amount`);
        continue;
      }

      const normalizedDesc = normalizeDescription(description);
      const merchant = guessMerchant(normalizedDesc);
      const fingerprint = generateFingerprint(accountId, postedDate, amount, normalizedDesc);

      transactions.push({
        postedDate,
        description,
        normalizedDescription: normalizedDesc,
        amount,
        direction,
        merchantGuess: merchant,
        rawLine,
        fingerprint,
      });
    } catch (err) {
      errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Parse error"}`);
    }
  }

  return {
    transactions,
    profile: profile.name,
    errors,
    rawHeaders: headers,
    mapping,
  };
}

function defaultParseDebitCredit(
  debit: string,
  credit: string
): { amount: number; direction: TransactionDirection } {
  const debitAmt = parseAmount(debit);
  const creditAmt = parseAmount(credit);

  if (debitAmt > 0) return { amount: debitAmt, direction: "DEBIT" };
  if (creditAmt > 0) return { amount: creditAmt, direction: "CREDIT" };
  return { amount: 0, direction: "DEBIT" };
}
