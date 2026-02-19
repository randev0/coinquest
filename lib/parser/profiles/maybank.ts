import { StatementProfile, ColumnMapping } from "@/types";
import { TransactionDirection } from "@prisma/client";
import { parseAmount } from "@/lib/utils";

// Maybank Credit Card CSV profile
// Typical headers: Date, Description, Amount, Balance
// Or: Date, Description, Debit, Credit, Balance
export const MaybankProfile: StatementProfile = {
  name: "Maybank",

  detectHeaders(headers: string[]): boolean {
    const normalized = headers.map((h) => h.toUpperCase().trim());
    // Look for Maybank-ish columns
    const hasDate = normalized.some((h) => h.includes("DATE") || h.includes("TARIKH"));
    const hasDesc = normalized.some(
      (h) => h.includes("DESCRIPTION") || h.includes("KETERANGAN") || h.includes("TRANSACTION")
    );
    return hasDate && hasDesc;
  },

  mapColumns(headers: string[]): ColumnMapping {
    const normalized = headers.map((h) => h.toUpperCase().trim());

    const dateIdx = normalized.findIndex(
      (h) => h.includes("DATE") || h.includes("TARIKH") || h.includes("POSTING")
    );
    const descIdx = normalized.findIndex(
      (h) => h.includes("DESCRIPTION") || h.includes("KETERANGAN") || h.includes("TRANSACTION DETAILS") || h.includes("PARTICULARS")
    );
    const amountIdx = normalized.findIndex(
      (h) => h === "AMOUNT" || h === "JUMLAH" || h === "AMT"
    );
    const debitIdx = normalized.findIndex(
      (h) => h.includes("DEBIT") || h.includes("DR") || h.includes("WITHDRAWAL")
    );
    const creditIdx = normalized.findIndex(
      (h) => h.includes("CREDIT") || h.includes("CR") || h.includes("DEPOSIT")
    );

    return {
      dateColumn: headers[dateIdx] || headers[0],
      descriptionColumn: headers[descIdx] || headers[1],
      amountColumn: amountIdx >= 0 ? headers[amountIdx] : undefined,
      debitColumn: debitIdx >= 0 ? headers[debitIdx] : undefined,
      creditColumn: creditIdx >= 0 ? headers[creditIdx] : undefined,
    };
  },

  parseAmount(debit: string, credit: string): { amount: number; direction: TransactionDirection } {
    const debitAmt = parseAmount(debit || "0");
    const creditAmt = parseAmount(credit || "0");

    if (debitAmt > 0) {
      return { amount: debitAmt, direction: "DEBIT" };
    }
    if (creditAmt > 0) {
      return { amount: creditAmt, direction: "CREDIT" };
    }
    return { amount: 0, direction: "DEBIT" };
  },
};
