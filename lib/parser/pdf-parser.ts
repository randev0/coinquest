import { PDFParse } from "pdf-parse";
import { TransactionDirection } from "@prisma/client";
import { ParsedTransaction } from "@/types";
import {
  parseDate,
  parseAmount,
  normalizeDescription,
  guessMerchant,
  generateFingerprint,
} from "@/lib/utils";

export interface ParsePDFResult {
  transactions: ParsedTransaction[];
  profile: string;
  errors: string[];
}

// Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, DD MMM YYYY
const DATE_PATTERNS = [
  /^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/,
  /^\d{4}-\d{2}-\d{2}/,
  /^\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i,
];

const AMOUNT_RE = /\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g;

const CREDIT_RE = /\b(?:CR|CREDIT|MASUK|\+)\b/i;

function startsWithDate(line: string): boolean {
  return DATE_PATTERNS.some((re) => re.test(line.trim()));
}

function extractAmountFromLine(line: string): { amount: number; amountStr: string } | null {
  const matches = [...line.matchAll(AMOUNT_RE)];
  if (matches.length === 0) return null;

  // Use second-to-last if ≥2 matches (last is likely running balance)
  const target = matches.length >= 2 ? matches[matches.length - 2] : matches[matches.length - 1];
  const raw = target[0];
  const amount = parseAmount(raw);
  return amount > 0 ? { amount, amountStr: raw } : null;
}

function extractDateFromLine(line: string): Date | null {
  const trimmed = line.trim();
  // Try each pattern and extract just the date portion
  const ddmmyyyy = trimmed.match(/^(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/);
  if (ddmmyyyy) return parseDate(ddmmyyyy[1]);

  const yyyymmdd = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (yyyymmdd) return parseDate(yyyymmdd[1]);

  const ddMmmYyyy = trimmed.match(/^(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/i);
  if (ddMmmYyyy) return parseDate(ddMmmYyyy[1]);

  return null;
}

function stripDatePrefix(line: string): string {
  return line
    .replace(/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}\s*/, "")
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, "")
    .replace(/^\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*/i, "")
    .trim();
}

export async function parsePDFContent(
  buffer: Buffer,
  accountId: string
): Promise<ParsePDFResult> {
  const errors: string[] = [];
  const transactions: ParsedTransaction[] = [];

  let rawText: string;
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    rawText = result.text;
  } catch (err) {
    return {
      transactions: [],
      profile: "pdf-generic",
      errors: [`PDF extraction failed: ${err instanceof Error ? err.message : "Unknown error"}`],
    };
  }

  // Split into lines, trim, drop blanks
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  interface TxAccumulator {
    dateLine: string;
    descLines: string[];
    lineIndex: number;
  }

  const accumulated: TxAccumulator[] = [];
  let current: TxAccumulator | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (startsWithDate(line)) {
      if (current) accumulated.push(current);
      current = { dateLine: line, descLines: [], lineIndex: i };
    } else if (current) {
      // Append continuation lines to current transaction description
      // Stop accumulating if line looks like a section header (all caps, short)
      if (line.length > 0) {
        current.descLines.push(line);
      }
    }
  }
  if (current) accumulated.push(current);

  for (const acc of accumulated) {
    const { dateLine, descLines, lineIndex } = acc;

    try {
      const postedDate = extractDateFromLine(dateLine);
      if (!postedDate || isNaN(postedDate.getTime())) {
        errors.push(`Line ${lineIndex + 1}: Cannot parse date from "${dateLine.slice(0, 40)}"`);
        continue;
      }

      const amountResult = extractAmountFromLine(dateLine);
      if (!amountResult) {
        // Try first desc line if amount not on date line
        const altLine = descLines[0] || "";
        const altAmount = extractAmountFromLine(altLine);
        if (!altAmount) {
          errors.push(`Line ${lineIndex + 1}: Cannot extract amount from "${dateLine.slice(0, 60)}"`);
          continue;
        }
      }

      const { amount } = amountResult || extractAmountFromLine(descLines[0] || "")!;

      // Build description from date line remainder + accumulated desc lines
      const dateRemainder = stripDatePrefix(dateLine);
      // Remove amount tokens from description portion
      const allDescParts = [dateRemainder, ...descLines.slice(0, 2)].filter(Boolean);
      const rawDesc = allDescParts.join(" ").replace(AMOUNT_RE, "").replace(/\s{2,}/g, " ").trim();

      const description = rawDesc || dateLine.slice(0, 80);
      if (!description) {
        errors.push(`Line ${lineIndex + 1}: Empty description`);
        continue;
      }

      // Direction detection
      const fullLine = [dateLine, ...descLines].join(" ");
      const direction: TransactionDirection = CREDIT_RE.test(fullLine) ? "CREDIT" : "DEBIT";

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
        rawLine: dateLine,
        fingerprint,
      });
    } catch (err) {
      errors.push(`Line ${lineIndex + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
    }
  }

  return {
    transactions,
    profile: "pdf-generic",
    errors,
  };
}
