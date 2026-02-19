"use client";

import { useState } from "react";
import { cn, formatMYR, formatDate } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface InventoryItem {
  id: string;
  date: Date | string;
  description: string;
  merchant: string;
  amount: number;
  direction: "DEBIT" | "CREDIT";
  category?: { name: string; icon: string; color: string } | null;
  isSubscription?: boolean;
  isDuplicate?: boolean;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onRowClick?: (item: InventoryItem) => void;
  selectedId?: string | null;
  loading?: boolean;
}

type SortField = "date" | "merchant" | "amount" | "category";
type SortDir = "asc" | "desc";

function getRarityClass(amount: number, direction: "DEBIT" | "CREDIT"): string {
  if (direction === "CREDIT") return "rarity-uncommon";
  if (amount >= 500) return "rarity-legendary";
  if (amount >= 200) return "rarity-epic";
  if (amount >= 50) return "rarity-rare";
  if (amount >= 10) return "rarity-uncommon";
  return "rarity-common";
}

export function InventoryTable({
  items,
  onRowClick,
  selectedId,
  loading,
}: InventoryTableProps) {
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({
    field: "date",
    dir: "desc",
  });

  const toggleSort = (field: SortField) => {
    setSort((prev) =>
      prev.field === field
        ? { field, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "desc" }
    );
  };

  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case "date":
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "merchant":
        cmp = a.merchant.localeCompare(b.merchant);
        break;
      case "amount":
        cmp = a.amount - b.amount;
        break;
      case "category":
        cmp = (a.category?.name || "").localeCompare(b.category?.name || "");
        break;
    }
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) return <ChevronUp size={10} className="opacity-20" />;
    return sort.dir === "asc" ? (
      <ChevronUp size={10} className="text-mmorpg-gold" />
    ) : (
      <ChevronDown size={10} className="text-mmorpg-gold" />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-1 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-mmorpg-border/30 rounded-sm" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[10px] font-pixel text-mmorpg-steel">INVENTORY EMPTY</p>
        <p className="text-xs text-mmorpg-steel/60 mt-2">Import a statement to begin</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-mmorpg-border">
            {[
              { label: "Type", field: null },
              { label: "Date", field: "date" as SortField },
              { label: "Merchant", field: "merchant" as SortField },
              { label: "Category", field: "category" as SortField },
              { label: "Amount", field: "amount" as SortField },
              { label: "Flags", field: null },
            ].map((col) => (
              <th
                key={col.label}
                onClick={() => col.field && toggleSort(col.field)}
                className={cn(
                  "text-left py-2 px-3 font-pixel text-[8px] text-mmorpg-steel uppercase tracking-wider whitespace-nowrap",
                  col.field && "cursor-pointer hover:text-mmorpg-steelLight select-none"
                )}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.field && <SortIcon field={col.field} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const isSelected = item.id === selectedId;
            const rarityClass = getRarityClass(item.amount, item.direction);

            return (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "inventory-row cursor-pointer",
                  isSelected && "selected"
                )}
              >
                {/* Type icon */}
                <td className="py-2 px-3 w-10">
                  <span className="text-sm">
                    {item.category?.icon || "📦"}
                  </span>
                </td>

                {/* Date */}
                <td className="py-2 px-3 text-mmorpg-steel whitespace-nowrap text-[10px]">
                  {formatDate(item.date)}
                </td>

                {/* Merchant */}
                <td className="py-2 px-3 max-w-[200px]">
                  <div className="truncate">
                    <span className={cn("font-medium", rarityClass)}>
                      {item.merchant}
                    </span>
                    {item.isSubscription && (
                      <span className="ml-1.5 text-[8px] font-pixel text-mmorpg-teal bg-mmorpg-teal/10 px-1 py-0.5 rounded-sm">
                        SUB
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-mmorpg-steel/60 truncate">{item.description}</div>
                </td>

                {/* Category */}
                <td className="py-2 px-3">
                  {item.category ? (
                    <span
                      className="text-[9px] font-pixel px-1.5 py-0.5 rounded-sm"
                      style={{
                        color: item.category.color,
                        backgroundColor: `${item.category.color}20`,
                        border: `1px solid ${item.category.color}40`,
                      }}
                    >
                      {item.category.name}
                    </span>
                  ) : (
                    <span className="text-[9px] font-pixel text-mmorpg-steel/50 italic">
                      Uncategorized
                    </span>
                  )}
                </td>

                {/* Amount */}
                <td className="py-2 px-3 text-right whitespace-nowrap font-medium">
                  <span
                    className={cn(
                      "font-pixel text-[10px]",
                      item.direction === "CREDIT"
                        ? "text-mmorpg-successLight"
                        : "text-mmorpg-parchment"
                    )}
                  >
                    {item.direction === "CREDIT" ? "+" : "-"}
                    {formatMYR(item.amount)}
                  </span>
                </td>

                {/* Flags */}
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    {item.isDuplicate && (
                      <span className="text-[8px] font-pixel text-mmorpg-warning bg-mmorpg-warning/10 px-1 rounded-sm">
                        DUP
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
