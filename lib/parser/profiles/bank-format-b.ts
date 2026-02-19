import { StatementProfile, ColumnMapping } from "@/types";
import { TransactionDirection } from "@prisma/client";
import { parseAmount } from "@/lib/utils";

// Bank Format B CSV profile
// Typical: Transaction Date, Description, Foreign Amount, Amount
// Or: Date, Transaction, Debit, Credit, Balance
export const BankProfileB: StatementProfile = {
  name: "Bank Format B",

  detectHeaders(headers: string[]): boolean {
    const normalized = headers.map((h) => h.toUpperCase().trim());
    const hasDateHint = normalized.some(
      (h) => h.includes("TRANSACTION DATE") || h.includes("FOREIGN") || h.includes("POSTING DATE")
    );
    return hasDateHint;
  },

  mapColumns(headers: string[]): ColumnMapping {
    const normalized = headers.map((h) => h.toUpperCase().trim());

    // Prefer "Transaction Date" over "Posting Date"
    const txDateIdx = normalized.findIndex((h) => h.includes("TRANSACTION DATE") || h.includes("TRANS DATE"));
    const postDateIdx = normalized.findIndex((h) => h.includes("POSTING DATE") || h.includes("DATE"));
    const dateIdx = txDateIdx >= 0 ? txDateIdx : postDateIdx;

    const descIdx = normalized.findIndex(
      (h) => h.includes("DESCRIPTION") || h.includes("TRANSACTION DETAILS") || h.includes("MERCHANT") || h.includes("DETAILS")
    );

    const amountIdx = normalized.findIndex(
      (h) => (h === "AMOUNT" || h === "LOCAL AMOUNT" || h.includes("BILLING AMOUNT")) && !h.includes("FOREIGN")
    );
    const debitIdx = normalized.findIndex((h) => h.includes("DEBIT") || h === "DR");
    const creditIdx = normalized.findIndex((h) => h.includes("CREDIT") || h === "CR");

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

    if (creditAmt > 0 && debitAmt === 0) {
      return { amount: creditAmt, direction: "CREDIT" };
    }
    return { amount: Math.abs(debitAmt || creditAmt), direction: "DEBIT" };
  },
};
