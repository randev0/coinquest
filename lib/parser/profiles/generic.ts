import { StatementProfile, ColumnMapping, TransactionDirection } from "@/types";

export const GenericProfile: StatementProfile = {
  name: "Auto-Detected",
  detectHeaders: () => true, // Always matches as fallback
  mapColumns: (headers: string[]): ColumnMapping => {
    // Return empty mapping - will use heuristic detection
    return {
      dateColumn: "",
      descriptionColumn: "",
    };
  },
  parseAmount: (debit: string, credit: string): { amount: number; direction: TransactionDirection } => {
    const debitVal = parseFloat(debit.replace(/[^0-9.-]/g, "")) || 0;
    const creditVal = parseFloat(credit.replace(/[^0-9.-]/g, "")) || 0;
    if (debitVal > 0) return { amount: debitVal, direction: "DEBIT" };
    if (creditVal > 0) return { amount: creditVal, direction: "CREDIT" };
    return { amount: 0, direction: "DEBIT" };
  },
};
