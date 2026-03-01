"use client";

import { useState } from "react";
import useSWR from "swr";
import { GameWindow } from "@/components/game/GameWindow";
import { Hotbar } from "@/components/game/Hotbar";
import { getCurrentMonth, formatMYR, getMonthLabel } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Category { id: string; name: string; icon: string; color: string; }
interface Budget {
  id: string;
  categoryId: string;
  month: string;
  amount: string;
  category: Category;
}
interface Transaction {
  categoryId: string | null;
  amount: string;
  direction: string;
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [newCatId, setNewCatId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: budgetData, mutate: mutateBudgets } = useSWR<{ budgets: Budget[] }>(
    `/api/budgets?month=${month}`,
    fetcher
  );
  const { data: catData } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);
  const { data: txData } = useSWR<{ transactions: Transaction[]; total: number }>(
    `/api/transactions?month=${month}&pageSize=1000`,
    fetcher
  );

  const budgets = budgetData?.budgets || [];
  const categories = catData?.categories || [];
  const transactions = txData?.transactions || [];

  // Compute actuals per category
  const actuals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.direction !== "DEBIT" || !tx.categoryId) continue;
    actuals.set(tx.categoryId, (actuals.get(tx.categoryId) || 0) + parseFloat(tx.amount));
  }

  const usedCatIds = new Set(budgets.map((b) => b.categoryId));
  const availableCats = categories.filter((c) => !usedCatIds.has(c.id));

  const totalBudgeted = budgets.reduce((s, b) => s + parseFloat(b.amount), 0);
  const totalActual = budgets.reduce((s, b) => s + (actuals.get(b.categoryId) || 0), 0);

  const addBudget = async () => {
    if (!newCatId || !newAmount || parseFloat(newAmount) <= 0) {
      toast({ title: "Invalid input", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: newCatId, month, amount: parseFloat(newAmount) }),
    });
    if (res.ok) {
      toast({ title: "Budget set!" });
      setNewCatId("");
      setNewAmount("");
      mutateBudgets();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteBudget = async (id: string) => {
    await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    toast({ title: "Budget removed" });
    mutateBudgets();
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: d.toLocaleDateString("en-MY", { month: "long", year: "numeric" }) };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="font-pixel text-[12px] text-mmorpg-gold tracking-wider">Monthly Budgets</h1>
        <p className="text-sm text-mmorpg-steel mt-1">Set spending limits per category and track how you&apos;re doing.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Budget List */}
        <div className="md:col-span-2">
          <GameWindow
            title={`Budgets — ${getMonthLabel(month)}`}
            icon="🛡"
            action={
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="game-input text-[9px] py-1 px-2 w-auto"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            }
          >
            {budgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-pixel text-[9px] text-mmorpg-steel">No budgets set for this month</p>
                <p className="text-xs text-mmorpg-steel/60 mt-1">Add categories using the panel →</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {budgets.map((budget) => {
                  const actual = actuals.get(budget.categoryId) || 0;
                  const budgeted = parseFloat(budget.amount);
                  const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
                  const over = pct > 100;
                  const warning = pct > 80;

                  return (
                    <div key={budget.id} className="p-3 game-window rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{budget.category.icon}</span>
                          <span className="font-pixel text-[9px] text-mmorpg-parchment">
                            {budget.category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-pixel text-[10px] ${over ? "text-mmorpg-dangerLight" : warning ? "text-mmorpg-warningLight" : "text-mmorpg-parchment"}`}>
                            {formatMYR(actual)} / {formatMYR(budgeted)}
                          </span>
                          <button
                            onClick={() => deleteBudget(budget.id)}
                            className="text-mmorpg-steel hover:text-mmorpg-dangerLight"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="hp-bar">
                        <div
                          className="hp-bar-fill transition-all duration-500"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: over
                              ? "linear-gradient(90deg, #a83030, #c84040)"
                              : warning
                              ? "linear-gradient(90deg, #c8a020, #e8c030)"
                              : "linear-gradient(90deg, #3a7bd5, #6a9aff)",
                          }}
                        />
                      </div>

                      <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-mmorpg-steel font-pixel">
                          {pct.toFixed(0)}% used
                        </span>
                        <span className={`text-[8px] font-pixel ${over ? "text-mmorpg-dangerLight" : "text-mmorpg-steel"}`}>
                          {over
                            ? `OVER by ${formatMYR(actual - budgeted)}`
                            : `Remaining: ${formatMYR(budgeted - actual)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GameWindow>
        </div>

        {/* Add Budget + Summary */}
        <div className="flex flex-col gap-4">
          <GameWindow title="Add Budget" icon="➕">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                  Category
                </label>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="game-input"
                >
                  <option value="">Select...</option>
                  {availableCats.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                  Monthly Budget (MYR)
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="500.00"
                  min="0"
                  step="0.01"
                  className="game-input"
                />
              </div>

              <Button variant="gold" onClick={addBudget} disabled={saving || !newCatId || !newAmount}>
                <PlusCircle size={12} />
                {saving ? "Saving..." : "Set Budget"}
              </Button>
            </div>
          </GameWindow>

          {/* Summary */}
          <GameWindow title="Budget Summary" icon="📊">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-mmorpg-steel">Total Budgeted</span>
                <span className="font-pixel text-[10px] text-mmorpg-parchment">{formatMYR(totalBudgeted)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-mmorpg-steel">Total Spent</span>
                <span className={`font-pixel text-[10px] ${totalActual > totalBudgeted ? "text-mmorpg-dangerLight" : "text-mmorpg-successLight"}`}>
                  {formatMYR(totalActual)}
                </span>
              </div>
              <div className="border-t border-mmorpg-border/50 pt-2 flex justify-between">
                <span className="text-[10px] text-mmorpg-steel">Remaining</span>
                <span className={`font-pixel text-[10px] ${totalActual > totalBudgeted ? "text-mmorpg-dangerLight" : "text-mmorpg-gold"}`}>
                  {formatMYR(totalBudgeted - totalActual)}
                </span>
              </div>
            </div>
          </GameWindow>
        </div>
      </div>

      <Hotbar
        items={[
          { label: "Import", icon: "📥", href: "/import", variant: "gold" },
          { label: "Dashboard", icon: "⚔", href: "/dashboard" },
          { label: "Transactions", icon: "📜", href: "/transactions" },
          { label: "Insights", icon: "🔮", href: "/insights" },
          { label: "Settings", icon: "⚙", href: "/settings" },
        ]}
      />
    </div>
  );
}
