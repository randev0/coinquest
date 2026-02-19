import { prisma } from "@/lib/db";
import { InsightData, CategoryTotal, MerchantTotal, MonthComparison, CategoryLeak } from "@/types";
import { getPreviousMonth, formatMYR } from "@/lib/utils";
import { detectSubscriptions } from "./subscription-detector";

export async function generateInsights(
  userId: string,
  month: string
): Promise<InsightData> {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59);

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  // Fetch transactions for month
  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      postedDate: { gte: start, lte: end },
    },
    include: { category: true },
  });

  const debits = transactions.filter((t) => t.direction === "DEBIT");
  const credits = transactions.filter((t) => t.direction === "CREDIT");

  const totalSpend = debits.reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
  const totalIncome = credits.reduce((s, t) => s + parseFloat(t.amount.toString()), 0);

  // Top categories
  const catMap = new Map<string, CategoryTotal>();
  for (const tx of debits) {
    const key = tx.categoryId || "uncategorized";
    const cat = tx.category;
    if (!catMap.has(key)) {
      catMap.set(key, {
        categoryId: key,
        categoryName: cat?.name || "Uncategorized",
        icon: cat?.icon || "📦",
        color: cat?.color || "#5a5a6a",
        total: 0,
        count: 0,
      });
    }
    const entry = catMap.get(key)!;
    entry.total += parseFloat(tx.amount.toString());
    entry.count++;
  }
  const topCategories = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top merchants
  const merchantMap = new Map<string, MerchantTotal>();
  for (const tx of debits) {
    const merchant = tx.merchantGuess || tx.normalizedDescription.substring(0, 40);
    if (!merchantMap.has(merchant)) {
      merchantMap.set(merchant, { merchant, total: 0, count: 0 });
    }
    const entry = merchantMap.get(merchant)!;
    entry.total += parseFloat(tx.amount.toString());
    entry.count++;
  }
  const topMerchants = Array.from(merchantMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Subscriptions
  const subscriptions = await detectSubscriptions(userId, 6);
  const monthSubs = subscriptions.filter(
    (s) =>
      s.lastCharge >= start &&
      s.lastCharge <= end
  );
  const subscriptionTotal = monthSubs.reduce((s, sub) => s + sub.avgAmount, 0);
  const subscriptionShare = totalSpend > 0 ? (subscriptionTotal / totalSpend) * 100 : 0;

  // Previous month comparison
  const prevMonth = getPreviousMonth(month);
  const [py, pm] = prevMonth.split("-").map(Number);
  const prevStart = new Date(py, pm - 1, 1);
  const prevEnd = new Date(py, pm, 0, 23, 59, 59);

  const prevTransactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      postedDate: { gte: prevStart, lte: prevEnd },
      direction: "DEBIT",
    },
    include: { category: true },
  });

  let previousMonthComparison: MonthComparison | undefined;
  let leakCategory: CategoryLeak | undefined;

  if (prevTransactions.length > 0) {
    const prevTotal = prevTransactions.reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
    const delta = totalSpend - prevTotal;
    const deltaPercent = prevTotal > 0 ? (delta / prevTotal) * 100 : 0;

    previousMonthComparison = {
      previousMonth: prevMonth,
      currentTotal: totalSpend,
      previousTotal: prevTotal,
      delta,
      deltaPercent,
    };

    // Detect leak: category with biggest increase
    const prevCatMap = new Map<string, number>();
    for (const tx of prevTransactions) {
      const key = tx.categoryId || "uncategorized";
      prevCatMap.set(key, (prevCatMap.get(key) || 0) + parseFloat(tx.amount.toString()));
    }

    let maxIncrease = 0;
    for (const [catId, current] of catMap) {
      const prev = prevCatMap.get(catId) || 0;
      const increase = current.total - prev;
      const increasePercent = prev > 0 ? (increase / prev) * 100 : 100;
      if (increase > maxIncrease && increasePercent > 10) {
        maxIncrease = increase;
        leakCategory = {
          categoryName: catMap.get(catId)?.categoryName || "Unknown",
          currentTotal: current.total,
          previousTotal: prev,
          increase,
          increasePercent,
        };
      }
    }
  }

  // Generate suggestions
  const suggestions: string[] = [];

  if (subscriptionTotal > 0) {
    const subNames = monthSubs
      .slice(0, 3)
      .map((s) => s.merchant)
      .join(", ");
    suggestions.push(
      `Subscriptions cost ${formatMYR(subscriptionTotal)} (${subscriptionShare.toFixed(1)}% of spend). Top: ${subNames || "see subscriptions tab"}`
    );
  }

  if (leakCategory && leakCategory.increasePercent > 20) {
    suggestions.push(
      `${leakCategory.categoryName} increased by ${formatMYR(leakCategory.increase)} (+${leakCategory.increasePercent.toFixed(0)}%) vs last month`
    );
  }

  const feesCategory = Array.from(catMap.values()).find((c) => c.categoryName === "Fees");
  if (feesCategory && feesCategory.total > 0) {
    suggestions.push(
      `Bank fees detected: ${formatMYR(feesCategory.total)}. Review your account to avoid these charges.`
    );
  }

  if (topCategories.length > 0) {
    const top = topCategories[0];
    const pct = totalSpend > 0 ? (top.total / totalSpend) * 100 : 0;
    if (pct > 40) {
      suggestions.push(
        `${top.categoryName} accounts for ${pct.toFixed(0)}% of spending (${formatMYR(top.total)}). Your biggest expense this month.`
      );
    }
  }

  if (previousMonthComparison && previousMonthComparison.deltaPercent > 15) {
    suggestions.push(
      `Total spend is up ${previousMonthComparison.deltaPercent.toFixed(0)}% vs last month (${formatMYR(previousMonthComparison.previousTotal)} → ${formatMYR(totalSpend)})`
    );
  }

  if (totalIncome > 0 && totalSpend > totalIncome) {
    suggestions.push(
      `Spend (${formatMYR(totalSpend)}) exceeded income (${formatMYR(totalIncome)}) this month. Review your top categories.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Looking good! No major issues detected this month.");
  }

  const insightData: InsightData = {
    month,
    totalSpend,
    totalIncome,
    topCategories,
    topMerchants,
    subscriptions: monthSubs,
    subscriptionTotal,
    subscriptionShare,
    previousMonthComparison,
    leakCategory,
    suggestions,
  };

  // Upsert insight
  await prisma.insight.upsert({
    where: { userId_month: { userId, month } },
    update: { data: insightData as object },
    create: { userId, month, data: insightData as object },
  });

  return insightData;
}
