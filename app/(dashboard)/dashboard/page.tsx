import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurrentMonth, getPreviousMonth, formatMYR, getMonthLabel } from "@/lib/utils";
import { GameWindow, StatRow } from "@/components/game/GameWindow";
import { GoldCounter, ResourceBar } from "@/components/game/GoldCounter";
import { QuestLog } from "@/components/game/QuestLog";
import { Hotbar } from "@/components/game/Hotbar";
import { RpgMenu } from "@/components/game/RpgMenu";
import { FirstQuest } from "@/components/game/FirstQuest";
import { Upload, ListTodo, PieChart, FileText, Settings } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const month = getCurrentMonth();
  const prevMonth = getPreviousMonth(month);
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59);

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const accountIds = accounts.map((a) => a.id);

  // Current month stats
  const [spendAgg, incomeAgg, txCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { accountId: { in: accountIds }, postedDate: { gte: start, lte: end }, direction: "DEBIT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { accountId: { in: accountIds }, postedDate: { gte: start, lte: end }, direction: "CREDIT" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { accountId: { in: accountIds }, postedDate: { gte: start, lte: end } },
    }),
  ]);

  const totalSpend = parseFloat(spendAgg._sum.amount?.toString() || "0");
  const totalIncome = parseFloat(incomeAgg._sum.amount?.toString() || "0");

  // Previous month spend
  const [py, pm] = prevMonth.split("-").map(Number);
  const prevStart = new Date(py, pm - 1, 1);
  const prevEnd = new Date(py, pm, 0, 23, 59, 59);
  const prevSpendAgg = await prisma.transaction.aggregate({
    where: { accountId: { in: accountIds }, postedDate: { gte: prevStart, lte: prevEnd }, direction: "DEBIT" },
    _sum: { amount: true },
  });
  const prevSpend = parseFloat(prevSpendAgg._sum.amount?.toString() || "0");

  // Top categories
  const txWithCats = await prisma.transaction.findMany({
    where: { accountId: { in: accountIds }, postedDate: { gte: start, lte: end }, direction: "DEBIT" },
    include: { category: true },
  });

  const catTotals = new Map<string, { name: string; icon: string; color: string; total: number }>();
  for (const tx of txWithCats) {
    const key = tx.categoryId || "uncategorized";
    const cat = tx.category;
    if (!catTotals.has(key)) {
      catTotals.set(key, {
        name: cat?.name || "Uncategorized",
        icon: cat?.icon || "📦",
        color: cat?.color || "#5a5a6a",
        total: 0,
      });
    }
    catTotals.get(key)!.total += parseFloat(tx.amount.toString());
  }
  const topCats = Array.from(catTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Budgets
  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, month },
    include: { category: true },
  });

  // Recent import
  const latestBatch = await prisma.importBatch.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { account: true },
  });

  // Insight / quest data
  const insight = await prisma.insight.findUnique({
    where: { userId_month: { userId: session.user.id, month } },
  });

  const insightData = insight?.data as Record<string, unknown> | null;
  const suggestions: string[] = (insightData?.suggestions as string[]) || [];

  const quests = suggestions.map((s, i) => ({
    id: `quest-${i}`,
    title: s.split(".")[0].substring(0, 50),
    description: s,
    reward: "Save money!",
    status: "new" as const,
  }));

  const deltaPercent =
    prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend) * 100 : 0;

  const isDemo = session.user.email === "demo@coinquest.app";

  const hasAccount = accounts.length > 0;
  const hasImport = !!latestBatch;
  const hasBudget = budgets.length > 0;
  const hasInsight = !!insight;

  const firstQuestSteps = [
    { id: "account", label: "Create a bank account in Settings", href: "/settings", done: hasAccount, locked: false },
    { id: "import", label: "Import a bank statement", href: "/import", done: hasImport, locked: !hasAccount },
    { id: "budget", label: "Set a monthly budget", href: "/budgets", done: hasBudget, locked: !hasImport },
    { id: "insights", label: "Generate financial insights", href: "/insights", done: hasInsight, locked: !hasBudget },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 pb-20 sm:pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT: Character Panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <GameWindow title="Character" icon="⚔" collapsible>
            <div className="flex flex-col gap-3">
              <div className="text-center pb-3 border-b border-mmorpg-border/50">
                <div className="w-12 h-12 rounded-full bg-mmorpg-panelLight border-2 border-mmorpg-gold/30 flex items-center justify-center mx-auto mb-2 text-xl">
                  🧙
                </div>
                <p className="font-pixel text-[9px] text-mmorpg-parchment">
                  {session.user.name || "Adventurer"}
                </p>
                <p className="text-[9px] text-mmorpg-steel mt-0.5">{session.user.email}</p>
              </div>

              <GoldCounter
                amount={totalSpend}
                label="Spent this month"
                size="sm"
                className="py-1"
              />

              <div className="flex flex-col gap-2">
                <ResourceBar
                  value={totalSpend}
                  max={Math.max(totalSpend, prevSpend, 1000)}
                  type="hp"
                  label="HP (Spend)"
                />
                <ResourceBar
                  value={totalIncome}
                  max={Math.max(totalIncome, totalSpend, 1)}
                  type="mp"
                  label="MP (Income)"
                />
              </div>

              <StatRow label="Transactions" value={txCount} />
              <StatRow label="Month" value={getMonthLabel(month)} />
              <StatRow
                label="vs Last Month"
                value={
                  prevSpend > 0
                    ? `${deltaPercent > 0 ? "+" : ""}${deltaPercent.toFixed(1)}%`
                    : "N/A"
                }
                valueClass={deltaPercent > 0 ? "text-mmorpg-dangerLight" : "text-mmorpg-successLight"}
              />
            </div>
          </GameWindow>

          {/* Accounts */}
          <GameWindow title="Accounts" icon="💳" collapsible>
            {accounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-[9px] font-pixel text-mmorpg-steel">No accounts yet</p>
                <Link href="/settings" className="text-[9px] text-mmorpg-accentBlue mt-1 block">
                  → Create in Settings
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between py-1.5 border-b border-mmorpg-border/30">
                    <div>
                      <p className="text-[10px] text-mmorpg-parchment">{acc.name}</p>
                      <p className="text-[9px] text-mmorpg-steel uppercase">{acc.type}</p>
                    </div>
                    <span className="text-[9px] font-pixel text-mmorpg-gold">{acc.currency}</span>
                  </div>
                ))}
              </div>
            )}
          </GameWindow>
        </div>

        {/* CENTER: Main Window */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* First Quest checklist */}
          <FirstQuest steps={firstQuestSteps} isDemo={isDemo} />

          {/* Overview */}
          <GameWindow title={`Overview — ${getMonthLabel(month)}`} icon="📊">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Spend", value: formatMYR(totalSpend), color: "text-mmorpg-dangerLight" },
                { label: "Total Income", value: formatMYR(totalIncome), color: "text-mmorpg-successLight" },
                { label: "Net", value: formatMYR(totalIncome - totalSpend), color: totalIncome >= totalSpend ? "text-mmorpg-successLight" : "text-mmorpg-dangerLight" },
              ].map((stat) => (
                <div key={stat.label} className="game-window p-3 text-center rounded-sm">
                  <p className="font-pixel text-[7px] text-mmorpg-steel uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`font-pixel text-xs ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Top categories */}
            {topCats.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                <p className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-wider mb-2">
                  Top Categories
                </p>
                {topCats.map((cat) => {
                  const pct = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="text-sm w-6 text-center">{cat.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-mmorpg-steelLight">{cat.name}</span>
                          <span className="text-[10px] font-pixel text-mmorpg-parchment">{formatMYR(cat.total)}</span>
                        </div>
                        <div className="h-2 bg-mmorpg-bg rounded-sm overflow-hidden">
                          <div
                            className="h-full rounded-sm transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-[9px] text-mmorpg-steel w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] font-pixel text-mmorpg-steel">No data for this month</p>
                <Link href="/import" className="text-[10px] text-mmorpg-accentBlue mt-2 block">
                  → Import a statement
                </Link>
              </div>
            )}
          </GameWindow>

          {/* Budget Status */}
          {budgets.length > 0 && (
            <GameWindow title="Budget Status" icon="🛡" collapsible>
              <div className="flex flex-col gap-3">
                {budgets.slice(0, 5).map((budget) => {
                  const actual = catTotals.get(budget.categoryId)?.total || 0;
                  const budgeted = parseFloat(budget.amount.toString());
                  const pct = budgeted > 0 ? (actual / budgeted) * 100 : 0;
                  const over = pct > 100;

                  return (
                    <div key={budget.id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-mmorpg-steelLight flex items-center gap-1">
                          <span>{budget.category?.icon}</span> {budget.category?.name}
                        </span>
                        <span className={`text-[10px] font-pixel ${over ? "text-mmorpg-dangerLight" : "text-mmorpg-parchment"}`}>
                          {formatMYR(actual)} / {formatMYR(budgeted)}
                        </span>
                      </div>
                      <div className="hp-bar">
                        <div
                          className="hp-bar-fill"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: over
                              ? "linear-gradient(90deg, #a83030, #c84040)"
                              : "linear-gradient(90deg, #3a7bd5, #6a9aff)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Link href="/budgets" className="text-[9px] font-pixel text-mmorpg-accentBlue mt-1">
                  → Manage Budgets
                </Link>
              </div>
            </GameWindow>
          )}

          {/* Latest import */}
          {latestBatch && (
            <GameWindow title="Last Import" icon="📂" collapsible defaultCollapsed>
              <div className="flex flex-col gap-1.5">
                <StatRow label="File" value={latestBatch.filename} />
                <StatRow label="Account" value={latestBatch.account.name} />
                <StatRow label="Month" value={latestBatch.month} />
                <StatRow label="Imported" value={`${latestBatch.importedRows} rows`} />
                <StatRow
                  label="Status"
                  value={latestBatch.status}
                  valueClass={
                    latestBatch.status === "COMPLETED"
                      ? "text-mmorpg-successLight"
                      : "text-mmorpg-warningLight"
                  }
                />
              </div>
            </GameWindow>
          )}
        </div>

        {/* RIGHT: Quest Log */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <GameWindow
            title="Quest Log"
            icon="📜"
            badge={quests.length}
            collapsible
          >
            <QuestLog quests={quests} />
            {quests.length === 0 && (
              <div className="text-center mt-2">
                <Link href="/insights" className="text-[9px] font-pixel text-mmorpg-accentBlue">
                  → Generate Insights
                </Link>
              </div>
            )}
          </GameWindow>

          {/* Quick links */}
          <GameWindow title="Quick Actions" icon="⚡">
            <div className="flex flex-col gap-2">
              {[
                { label: "Import Statement", href: "/import", icon: "📥", color: "btn-gold" },
                { label: "View Transactions", href: "/transactions", icon: "📜", color: "btn-game" },
                { label: "Set Budgets", href: "/budgets", icon: "🛡", color: "btn-game" },
                { label: "Insights", href: "/insights", icon: "🔮", color: "btn-game" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${item.color} flex items-center gap-2 px-3 py-2 rounded-sm text-[9px] font-pixel text-mmorpg-parchment w-full`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </GameWindow>

          {/* Disclaimer */}
          <div className="game-window rounded-sm p-3 opacity-60">
            <p className="text-[8px] text-mmorpg-steel font-pixel leading-relaxed">
              ⚔ DISCLAIMER: CoinQuest is for expense tracking only. Not financial advice.
            </p>
          </div>
        </div>
      </div>


    </div>
  );
}
