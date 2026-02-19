import { prisma } from "@/lib/db";
import { SubscriptionItem } from "@/types";

const KNOWN_SUBSCRIPTIONS = [
  "NETFLIX", "SPOTIFY", "YOUTUBE", "GOOGLE ONE", "GOOGLE STORAGE",
  "APPLE", "ICLOUD", "DISNEY", "HBO", "AMAZON PRIME",
  "MICROSOFT 365", "OFFICE 365", "ADOBE", "CANVA", "GITHUB",
  "CHATGPT", "OPENAI", "ASTRO", "DROPBOX", "NOTION",
  "SLACK", "ZOOM", "FIGMA", "LOOM",
];

interface MerchantGroup {
  merchant: string;
  charges: { amount: number; date: Date; month: string }[];
  isMarkedSubscription: boolean;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function isKnownSubscription(merchant: string): boolean {
  const upper = merchant.toUpperCase();
  return KNOWN_SUBSCRIPTIONS.some((s) => upper.includes(s));
}

function groupByMerchant(
  transactions: {
    id: string;
    normalizedDescription: string;
    merchantGuess: string | null;
    amount: string | number;
    postedDate: Date;
    isSubscription: boolean;
    direction: string;
  }[]
): Map<string, MerchantGroup> {
  const groups = new Map<string, MerchantGroup>();

  for (const tx of transactions) {
    if (tx.direction !== "DEBIT") continue;

    const merchant = (tx.merchantGuess || tx.normalizedDescription).substring(0, 40);
    const amount = typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount;
    const month = getMonthKey(tx.postedDate);

    if (!groups.has(merchant)) {
      groups.set(merchant, {
        merchant,
        charges: [],
        isMarkedSubscription: tx.isSubscription,
      });
    }

    const group = groups.get(merchant)!;
    group.charges.push({ amount, date: tx.postedDate, month });
    if (tx.isSubscription) group.isMarkedSubscription = true;
  }

  return groups;
}

function detectRecurring(group: MerchantGroup): boolean {
  if (group.isMarkedSubscription) return true;
  if (isKnownSubscription(group.merchant)) return true;

  // Check: appears in >= 2 distinct months with similar amounts
  const months = new Set(group.charges.map((c) => c.month));
  if (months.size < 2) return false;

  // Check amount variance: within 10%
  const amounts = group.charges.map((c) => c.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const maxDeviation = Math.max(...amounts.map((a) => Math.abs(a - avg)));
  const variance = avg > 0 ? maxDeviation / avg : 1;

  return variance <= 0.15; // <=15% variance = likely subscription
}

export async function detectSubscriptions(
  userId: string,
  lookbackMonths = 6
): Promise<SubscriptionItem[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - lookbackMonths);

  // Get all accounts for user
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });

  const accountIds = accounts.map((a) => a.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      postedDate: { gte: cutoff },
    },
    select: {
      id: true,
      normalizedDescription: true,
      merchantGuess: true,
      amount: true,
      postedDate: true,
      isSubscription: true,
      direction: true,
    },
    orderBy: { postedDate: "desc" },
  });

  const groups = groupByMerchant(
    transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    }))
  );

  const subscriptions: SubscriptionItem[] = [];

  for (const [, group] of groups) {
    if (!detectRecurring(group)) continue;

    const amounts = group.charges.map((c) => c.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const lastCharge = group.charges.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )[0].date;

    subscriptions.push({
      merchant: group.merchant,
      avgAmount,
      lastCharge,
      annualizedCost: avgAmount * 12,
      monthsDetected: new Set(group.charges.map((c) => c.month)).size,
      isMarkedSubscription: group.isMarkedSubscription,
    });
  }

  // Sort by annualized cost desc
  return subscriptions.sort((a, b) => b.annualizedCost - a.annualizedCost);
}

export async function getSubscriptionsForMonth(
  userId: string,
  month: string
): Promise<{ merchant: string; amount: number; date: Date }[]> {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59);

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { id: true },
  });

  const allSubs = await detectSubscriptions(userId);
  const subMerchants = new Set(allSubs.map((s) => s.merchant));

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      postedDate: { gte: start, lte: end },
      direction: "DEBIT",
    },
    select: {
      merchantGuess: true,
      normalizedDescription: true,
      amount: true,
      postedDate: true,
      isSubscription: true,
    },
  });

  return transactions
    .filter((t) => {
      const merchant = (t.merchantGuess || t.normalizedDescription).substring(0, 40);
      return t.isSubscription || subMerchants.has(merchant) || isKnownSubscription(merchant);
    })
    .map((t) => ({
      merchant: (t.merchantGuess || t.normalizedDescription).substring(0, 40),
      amount: parseFloat(t.amount.toString()),
      date: t.postedDate,
    }));
}
