"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { GameWindow } from "@/components/game/GameWindow";
import { InventoryTable, InventoryItem } from "@/components/game/InventoryTable";
import { Hotbar } from "@/components/game/Hotbar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCurrentMonth, formatMYR, formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Search, Filter, RefreshCw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Transaction {
  id: string;
  postedDate: string;
  description: string;
  normalizedDescription: string;
  amount: string;
  direction: "DEBIT" | "CREDIT";
  merchantGuess: string | null;
  category: Category | null;
  notes: string | null;
  isSubscription: boolean;
  isDuplicate: boolean;
  account: { name: string };
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSub, setEditSub] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCategoryId, setRuleCategoryId] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({
    month,
    page: String(page),
    pageSize: "50",
  });
  if (search) params.set("search", search);
  if (categoryFilter) params.set("categoryId", categoryFilter);

  const { data, mutate, isLoading } = useSWR<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }>(`/api/transactions?${params}`, fetcher);

  const { data: catData } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);
  const categories = catData?.categories || [];

  const transactions = data?.transactions || [];

  const inventoryItems: InventoryItem[] = transactions.map((tx) => ({
    id: tx.id,
    date: new Date(tx.postedDate),
    description: tx.description,
    merchant: tx.merchantGuess || tx.normalizedDescription.substring(0, 40),
    amount: parseFloat(tx.amount),
    direction: tx.direction,
    category: tx.category,
    isSubscription: tx.isSubscription,
    isDuplicate: tx.isDuplicate,
  }));

  const openDetail = (item: InventoryItem) => {
    const tx = transactions.find((t) => t.id === item.id);
    if (!tx) return;
    setSelectedTx(tx);
    setEditCategory(tx.category?.id || "");
    setEditNotes(tx.notes || "");
    setEditSub(tx.isSubscription);
  };

  const saveTransaction = async () => {
    if (!selectedTx) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editCategory || null,
          notes: editNotes,
          isSubscription: editSub,
        }),
      });
      if (res.ok) {
        toast({ title: "Saved!", description: "Transaction updated" });
        mutate();
        setSelectedTx(null);
      } else {
        toast({ title: "Error", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const createRule = async () => {
    if (!rulePattern || !ruleCategoryId) return;
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pattern: rulePattern.toUpperCase(),
        matchType: "CONTAINS",
        categoryId: ruleCategoryId,
        priority: 50,
      }),
    });
    if (res.ok) {
      toast({ title: "Rule created!", description: `"${rulePattern}" → categorized automatically` });
      setAddRuleOpen(false);
    } else {
      toast({ title: "Error creating rule", variant: "destructive" });
    }
  };

  const applyRules = async () => {
    const res = await fetch("/api/rules", { method: "PUT" });
    const data = await res.json();
    toast({ title: "Rules applied!", description: `${data.updated} transactions updated` });
    mutate();
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: d.toLocaleDateString("en-MY", { month: "short", year: "numeric" }) };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <GameWindow
        title="Inventory — Transactions"
        icon="📜"
        badge={data?.total}
        action={
          <button onClick={applyRules} className="btn-game px-2 py-1 rounded-sm text-[8px] font-pixel text-mmorpg-parchment flex items-center gap-1">
            <RefreshCw size={10} />
            Apply Rules
          </button>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-mmorpg-border/50">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mmorpg-steel" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search merchants..."
              className="game-input pl-8"
            />
          </div>

          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            className="game-input w-auto"
          >
            <option value="">All months</option>
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="game-input w-auto"
          >
            <option value="">All categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <InventoryTable
          items={inventoryItems}
          onRowClick={openDetail}
          selectedId={selectedTx?.id}
          loading={isLoading}
        />

        {/* Pagination */}
        {(data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-mmorpg-border/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-game px-3 py-1 rounded-sm font-pixel text-[8px] text-mmorpg-parchment disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="font-pixel text-[9px] text-mmorpg-steel">
              {page} / {data?.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data?.totalPages || 1, p + 1))}
              disabled={page === (data?.totalPages || 1)}
              className="btn-game px-3 py-1 rounded-sm font-pixel text-[8px] text-mmorpg-parchment disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </GameWindow>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
        {selectedTx && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedTx.merchantGuess || selectedTx.normalizedDescription.substring(0, 40)}
              </DialogTitle>
            </DialogHeader>

            <div className="p-4 flex flex-col gap-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-pixel text-[7px] text-mmorpg-steel uppercase mb-0.5">Date</p>
                  <p className="text-mmorpg-parchment">{formatDate(selectedTx.postedDate)}</p>
                </div>
                <div>
                  <p className="font-pixel text-[7px] text-mmorpg-steel uppercase mb-0.5">Amount</p>
                  <p className={`font-pixel ${selectedTx.direction === "CREDIT" ? "text-mmorpg-successLight" : "text-mmorpg-parchment"}`}>
                    {selectedTx.direction === "CREDIT" ? "+" : "-"}{formatMYR(parseFloat(selectedTx.amount))}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="font-pixel text-[7px] text-mmorpg-steel uppercase mb-0.5">Account</p>
                  <p className="text-mmorpg-parchment">{selectedTx.account.name}</p>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="game-input"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                  Notes
                </label>
                <input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add a note..."
                  className="game-input"
                />
              </div>

              {/* Subscription flag */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editSub}
                  onChange={(e) => setEditSub(e.target.checked)}
                  className="accent-mmorpg-gold"
                />
                <span className="font-pixel text-[9px] text-mmorpg-parchment">
                  Mark as Subscription
                </span>
              </label>

              {/* Create rule button */}
              <button
                onClick={() => {
                  setRulePattern(selectedTx.merchantGuess || selectedTx.normalizedDescription.substring(0, 30));
                  setRuleCategoryId(editCategory);
                  setSelectedTx(null);
                  setAddRuleOpen(true);
                }}
                className="btn-game px-3 py-2 rounded-sm font-pixel text-[8px] text-mmorpg-parchment text-center"
              >
                ⚡ Create Rule from this Merchant
              </button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTx(null)}>Cancel</Button>
              <Button variant="gold" onClick={saveTransaction} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Categorization Rule</DialogTitle>
          </DialogHeader>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Merchant Pattern (CONTAINS)
              </label>
              <input
                value={rulePattern}
                onChange={(e) => setRulePattern(e.target.value)}
                className="game-input"
                placeholder="e.g. NETFLIX"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Category
              </label>
              <select
                value={ruleCategoryId}
                onChange={(e) => setRuleCategoryId(e.target.value)}
                className="game-input"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRuleOpen(false)}>Cancel</Button>
            <Button variant="gold" onClick={createRule} disabled={!rulePattern || !ruleCategoryId}>
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Hotbar
        items={[
          { label: "Import", icon: "📥", href: "/import", variant: "gold" },
          { label: "Dashboard", icon: "⚔", href: "/dashboard" },
          { label: "Budgets", icon: "🛡", href: "/budgets" },
          { label: "Insights", icon: "🔮", href: "/insights" },
          { label: "Settings", icon: "⚙", href: "/settings" },
        ]}
      />
    </div>
  );
}
