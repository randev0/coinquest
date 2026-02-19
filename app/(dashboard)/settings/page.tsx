"use client";

import { useState } from "react";
import useSWR from "swr";
import { GameWindow } from "@/components/game/GameWindow";
import { Hotbar } from "@/components/game/Hotbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Trash2, RefreshCw } from "lucide-react";
import { signOut } from "next-auth/react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Category { id: string; name: string; icon: string; color: string; }
interface Account { id: string; name: string; type: string; currency: string; }
interface Rule {
  id: string;
  pattern: string;
  matchType: string;
  priority: number;
  category: Category;
  isActive: boolean;
}

const ACCOUNT_TYPES = ["CARD", "EWALLET", "CASH", "BANK"] as const;

export default function SettingsPage() {
  const { data: accountData, mutate: mutateAccounts } = useSWR<{ accounts: Account[] }>("/api/accounts", fetcher);
  const { data: catData } = useSWR<{ categories: Category[] }>("/api/categories", fetcher);
  const { data: rulesData, mutate: mutateRules } = useSWR<{ rules: Rule[] }>("/api/rules", fetcher);

  const accounts = accountData?.accounts || [];
  const categories = catData?.categories || [];
  const rules = rulesData?.rules || [];

  // Account form
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<"CARD" | "EWALLET" | "CASH" | "BANK">("CARD");
  const [savingAcc, setSavingAcc] = useState(false);

  // Rule form
  const [rulePattern, setRulePattern] = useState("");
  const [ruleCatId, setRuleCatId] = useState("");
  const [ruleMatchType, setRuleMatchType] = useState<"CONTAINS" | "REGEX" | "EXACT">("CONTAINS");
  const [rulePriority, setRulePriority] = useState(100);
  const [savingRule, setSavingRule] = useState(false);

  const createAccount = async () => {
    if (!accName.trim()) return;
    setSavingAcc(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: accName, type: accType, currency: "MYR" }),
    });
    if (res.ok) {
      toast({ title: "Account created!" });
      setAccName("");
      mutateAccounts();
    } else {
      const data = await res.json();
      toast({ title: "Error", description: data.error?.message || "Failed", variant: "destructive" });
    }
    setSavingAcc(false);
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Remove this account? Transactions will be kept.")) return;
    await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    toast({ title: "Account removed" });
    mutateAccounts();
  };

  const createRule = async () => {
    if (!rulePattern || !ruleCatId) return;
    setSavingRule(true);
    const res = await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pattern: rulePattern.toUpperCase(),
        matchType: ruleMatchType,
        categoryId: ruleCatId,
        priority: rulePriority,
      }),
    });
    if (res.ok) {
      toast({ title: "Rule created!" });
      setRulePattern("");
      mutateRules();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
    setSavingRule(false);
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    toast({ title: "Rule deleted" });
    mutateRules();
  };

  const applyRules = async () => {
    const res = await fetch("/api/rules", { method: "PUT" });
    const data = await res.json();
    toast({ title: `Applied! ${data.updated} transactions updated` });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Accounts */}
        <GameWindow title="Accounts" icon="💳" badge={accounts.length}>
          <div className="flex flex-col gap-4">
            {/* List */}
            {accounts.length === 0 ? (
              <p className="text-[10px] text-mmorpg-steel text-center py-4">No accounts yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-2.5 game-window rounded-sm">
                    <div>
                      <p className="text-[10px] text-mmorpg-parchment font-medium">{acc.name}</p>
                      <p className="text-[9px] text-mmorpg-steel uppercase">{acc.type} · {acc.currency}</p>
                    </div>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="text-mmorpg-steel hover:text-mmorpg-dangerLight"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div className="border-t border-mmorpg-border/50 pt-4 flex flex-col gap-3">
              <p className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-wider">Add Account</p>
              <input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. My Credit Card"
                className="game-input"
              />
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as typeof accType)}
                className="game-input"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <Button variant="gold" onClick={createAccount} disabled={savingAcc || !accName}>
                <PlusCircle size={12} />
                {savingAcc ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </GameWindow>

        {/* Rules */}
        <GameWindow
          title="Categorization Rules"
          icon="⚡"
          badge={rules.length}
          action={
            <button onClick={applyRules} className="btn-game px-2 py-1 rounded-sm text-[8px] font-pixel text-mmorpg-parchment flex items-center gap-1">
              <RefreshCw size={10} />
              Apply All
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            {/* Rules list */}
            <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
              {rules.length === 0 ? (
                <p className="text-[10px] text-mmorpg-steel text-center py-4">No rules yet (seed data includes defaults)</p>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-2 game-window rounded-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[8px] text-mmorpg-gold">P{rule.priority}</span>
                        <span className="font-mono text-[10px] text-mmorpg-parchment truncate">{rule.pattern}</span>
                        <span className="text-[7px] font-pixel text-mmorpg-steel px-1 bg-mmorpg-border/50 rounded-sm">{rule.matchType}</span>
                      </div>
                      <p className="text-[9px] text-mmorpg-steel">
                        → {rule.category?.icon} {rule.category?.name}
                      </p>
                    </div>
                    <button onClick={() => deleteRule(rule.id)} className="text-mmorpg-steel hover:text-mmorpg-dangerLight ml-2 shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add rule */}
            <div className="border-t border-mmorpg-border/50 pt-4 flex flex-col gap-3">
              <p className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-wider">Add Rule</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={rulePattern}
                  onChange={(e) => setRulePattern(e.target.value)}
                  placeholder="Pattern (e.g. NETFLIX)"
                  className="game-input col-span-2"
                />
                <select
                  value={ruleMatchType}
                  onChange={(e) => setRuleMatchType(e.target.value as typeof ruleMatchType)}
                  className="game-input"
                >
                  <option value="CONTAINS">CONTAINS</option>
                  <option value="EXACT">EXACT</option>
                  <option value="REGEX">REGEX</option>
                </select>
                <input
                  type="number"
                  value={rulePriority}
                  onChange={(e) => setRulePriority(parseInt(e.target.value))}
                  placeholder="Priority"
                  className="game-input"
                  min="1"
                  max="999"
                />
                <select
                  value={ruleCatId}
                  onChange={(e) => setRuleCatId(e.target.value)}
                  className="game-input col-span-2"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <Button variant="gold" onClick={createRule} disabled={savingRule || !rulePattern || !ruleCatId}>
                <PlusCircle size={12} />
                {savingRule ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </div>
        </GameWindow>

        {/* Categories (read-only) */}
        <GameWindow title="Categories" icon="🏷" collapsible defaultCollapsed>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 game-window rounded-sm"
                style={{ borderLeft: `3px solid ${cat.color}` }}
              >
                <span>{cat.icon}</span>
                <span className="text-[10px] text-mmorpg-steelLight">{cat.name}</span>
              </div>
            ))}
          </div>
        </GameWindow>

        {/* Danger zone */}
        <GameWindow title="Session" icon="⚙">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-mmorpg-steel">
              CoinQuest stores only parsed transaction data. Raw CSV files are never saved.
            </p>
            <p className="text-[9px] text-mmorpg-steel/60 font-pixel">
              ⚔ DISCLAIMER: For tracking only. Not financial advice.
            </p>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/coinquest/login" })}
            >
              Sign Out
            </Button>
          </div>
        </GameWindow>
      </div>

      <Hotbar
        items={[
          { label: "Import", icon: "📥", href: "/import", variant: "gold" },
          { label: "Dashboard", icon: "⚔", href: "/dashboard" },
          { label: "Transactions", icon: "📜", href: "/transactions" },
          { label: "Budgets", icon: "🛡", href: "/budgets" },
          { label: "Insights", icon: "🔮", href: "/insights" },
        ]}
      />
    </div>
  );
}
