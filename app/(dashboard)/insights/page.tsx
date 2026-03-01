"use client";

import { useState } from "react";
import useSWR from "swr";
import { GameWindow } from "@/components/game/GameWindow";
import { QuestLog, Quest } from "@/components/game/QuestLog";
import { GoldCounter } from "@/components/game/GoldCounter";
import { Hotbar } from "@/components/game/Hotbar";
import { getCurrentMonth, formatMYR, getMonthLabel } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Zap, TrendingUp, TrendingDown, Repeat } from "lucide-react";
import { InsightData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InsightsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [generating, setGenerating] = useState(false);
  const [questStatuses, setQuestStatuses] = useState<Record<string, "new" | "inprogress" | "done">>({});

  const { data, mutate, isLoading } = useSWR<{ insights: InsightData }>(
    `/api/insights?month=${month}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const insights = data?.insights;

  const regenerate = async () => {
    setGenerating(true);
    await mutate();
    setGenerating(false);
    toast({ title: "Insights updated!" });
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: d.toLocaleDateString("en-MY", { month: "long", year: "numeric" }) };
  });

  const quests: Quest[] = (insights?.suggestions || []).map((s, i) => ({
    id: `q${i}`,
    title: s.split(".")[0].substring(0, 55),
    description: s,
    reward: extractReward(s),
    status: questStatuses[`q${i}`] || "new",
  }));

  function extractReward(suggestion: string): string {
    const rmMatch = suggestion.match(/RM[\s]?[\d,]+\.?\d*/);
    if (rmMatch) return `Review spending of ${rmMatch[0]}`;
    return "Review & optimize";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="font-pixel text-[12px] text-mmorpg-gold tracking-wider">Financial Insights</h1>
        <p className="text-sm text-mmorpg-steel mt-1">AI-powered analysis of your spending habits and money leaks.</p>
      </div>
      {/* Header controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="game-input w-auto"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={regenerate}
          disabled={generating}
          className="btn-gold px-4 py-2 rounded-sm font-pixel text-[9px]"
        >
          <Zap size={12} className="inline mr-1" />
          {generating ? "Generating..." : "Generate Insights"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT: Summary Stats */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <GameWindow title={`${getMonthLabel(month)} Report`} icon="🔮">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-mmorpg-border/30 rounded" />)}
              </div>
            ) : insights ? (
              <div className="flex flex-col gap-3">
                <GoldCounter amount={insights.totalSpend} label="Total Spend" size="md" />
                <GoldCounter amount={insights.totalIncome} label="Total Income" size="sm" />

                {insights.previousMonthComparison && (
                  <div className="p-3 game-window rounded-sm mt-2">
                    <p className="font-pixel text-[8px] text-mmorpg-steel uppercase mb-2">vs Last Month</p>
                    <div className="flex items-center gap-2">
                      {insights.previousMonthComparison.delta > 0 ? (
                        <TrendingUp size={14} className="text-mmorpg-dangerLight" />
                      ) : (
                        <TrendingDown size={14} className="text-mmorpg-successLight" />
                      )}
                      <span className={`font-pixel text-sm ${insights.previousMonthComparison.delta > 0 ? "text-mmorpg-dangerLight" : "text-mmorpg-successLight"}`}>
                        {insights.previousMonthComparison.delta > 0 ? "+" : ""}
                        {insights.previousMonthComparison.deltaPercent.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-mmorpg-steel">
                        ({formatMYR(Math.abs(insights.previousMonthComparison.delta))})
                      </span>
                    </div>
                  </div>
                )}

                {/* Subscription share */}
                {insights.subscriptionTotal > 0 && (
                  <div className="p-3 game-window rounded-sm">
                    <p className="font-pixel text-[8px] text-mmorpg-steel uppercase mb-1">Subscription Share</p>
                    <div className="flex items-center justify-between">
                      <span className="text-mmorpg-teal font-pixel text-xs">{formatMYR(insights.subscriptionTotal)}</span>
                      <span className="text-[9px] text-mmorpg-steel">{insights.subscriptionShare.toFixed(1)}% of spend</span>
                    </div>
                    <div className="mp-bar mt-1">
                      <div
                        className="mp-bar-fill"
                        style={{
                          width: `${Math.min(insights.subscriptionShare, 100)}%`,
                          background: "linear-gradient(90deg, #1a8a8a, #2aaaba)",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Leak detector */}
                {insights.leakCategory && (
                  <div className="p-3 bg-mmorpg-danger/10 border border-mmorpg-danger/30 rounded-sm">
                    <p className="font-pixel text-[8px] text-mmorpg-dangerLight uppercase mb-1">⚠ Spending Spike</p>
                    <p className="text-[10px] text-mmorpg-parchment">{insights.leakCategory.categoryName}</p>
                    <p className="text-[9px] text-mmorpg-steel mt-0.5">
                      +{insights.leakCategory.increasePercent.toFixed(0)}% vs last month
                      ({formatMYR(insights.leakCategory.increase)})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="font-pixel text-[9px] text-mmorpg-steel">No insights yet</p>
                <p className="text-xs text-mmorpg-steel/60 mt-1">Click "Generate Insights" above</p>
              </div>
            )}
          </GameWindow>

          {/* Top Categories */}
          {insights?.topCategories && insights.topCategories.length > 0 && (
            <GameWindow title="Top Categories" icon="📊">
              <div className="flex flex-col gap-2">
                {insights.topCategories.map((cat) => {
                  const pct = insights.totalSpend > 0
                    ? (cat.total / insights.totalSpend) * 100
                    : 0;
                  return (
                    <div key={cat.categoryId}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] text-mmorpg-steelLight flex items-center gap-1">
                          {cat.icon} {cat.categoryName}
                        </span>
                        <span className="text-[10px] font-pixel text-mmorpg-parchment">{formatMYR(cat.total)}</span>
                      </div>
                      <div className="h-2 bg-mmorpg-bg rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GameWindow>
          )}
        </div>

        {/* CENTER: Subscriptions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <GameWindow title="Subscription Tracker" icon="🔁" badge={insights?.subscriptions?.length}>
            {insights?.subscriptions && insights.subscriptions.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {insights.subscriptions.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 game-window rounded-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Repeat size={12} className="text-mmorpg-teal shrink-0" />
                      <div>
                        <p className="text-[10px] text-mmorpg-parchment font-medium">{sub.merchant}</p>
                        <p className="text-[9px] text-mmorpg-steel">
                          {sub.monthsDetected} months · Last: {new Date(sub.lastCharge).toLocaleDateString("en-MY", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-pixel text-[10px] text-mmorpg-gold">{formatMYR(sub.avgAmount)}/mo</p>
                      <p className="text-[8px] text-mmorpg-steel">{formatMYR(sub.annualizedCost)}/yr</p>
                    </div>
                  </div>
                ))}

                {insights.subscriptions.length > 0 && (
                  <div className="p-3 bg-mmorpg-teal/10 border border-mmorpg-teal/30 rounded-sm mt-2">
                    <div className="flex justify-between">
                      <span className="font-pixel text-[8px] text-mmorpg-teal uppercase">Annual Cost</span>
                      <span className="font-pixel text-[10px] text-mmorpg-gold">
                        {formatMYR(insights.subscriptions.reduce((s, sub) => s + sub.annualizedCost, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="font-pixel text-[9px] text-mmorpg-steel">No subscriptions detected</p>
                <p className="text-xs text-mmorpg-steel/60 mt-1">
                  Needs 2+ months of data to detect recurring charges
                </p>
              </div>
            )}
          </GameWindow>

          {/* Top Merchants */}
          {insights?.topMerchants && insights.topMerchants.length > 0 && (
            <GameWindow title="Top Merchants" icon="🏪" collapsible defaultCollapsed>
              <div className="flex flex-col gap-1">
                {insights.topMerchants.slice(0, 10).map((m, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-mmorpg-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-pixel text-mmorpg-steel w-4">{i + 1}.</span>
                      <span className="text-[10px] text-mmorpg-steelLight">{m.merchant}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-pixel text-[10px] text-mmorpg-parchment">{formatMYR(m.total)}</span>
                      <span className="text-[9px] text-mmorpg-steel ml-1">×{m.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GameWindow>
          )}
        </div>

        {/* RIGHT: Quest Log */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <GameWindow
            title="AI Suggestions"
            icon="💡"
            badge={quests.length}
            subtitle={insights?.aiGenerated ? "✦ AI-powered" : undefined}
          >
            <QuestLog
              quests={quests}
              onStatusChange={(id, status) => {
                setQuestStatuses((prev) => ({ ...prev, [id]: status }));
              }}
            />
            {insights?.aiGenerated && (
              <p className="text-[8px] text-mmorpg-steel/50 font-pixel text-right mt-3">
                via Llama 3.3 · Groq
              </p>
            )}
          </GameWindow>
        </div>
      </div>

      <Hotbar
        items={[
          { label: "Import", icon: "📥", href: "/import", variant: "gold" },
          { label: "Dashboard", icon: "⚔", href: "/dashboard" },
          { label: "Transactions", icon: "📜", href: "/transactions" },
          { label: "Budgets", icon: "🛡", href: "/budgets" },
          { label: "Settings", icon: "⚙", href: "/settings" },
        ]}
      />
    </div>
  );
}
