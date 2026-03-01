import { prisma } from "@/lib/db";
import { isSafeRegex } from "./safe-regex";

interface Rule {
  id: string;
  matchType: string;
  pattern: string;
  categoryId: string;
  priority: number;
}

export function matchRule(rule: Rule, normalizedDescription: string): boolean {
  const desc = normalizedDescription.toUpperCase();
  const pattern = rule.pattern.toUpperCase();

  switch (rule.matchType) {
    case "CONTAINS":
      return desc.includes(pattern);
    case "EXACT":
      return desc === pattern;
    case "REGEX":
      try {
        // Only execute patterns that pass the ReDoS safety check
        if (!isSafeRegex(rule.pattern)) return false;
        return new RegExp(rule.pattern, "i").test(normalizedDescription);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function categorizeTransaction(
  normalizedDescription: string,
  userId: string
): Promise<string | null> {
  const rules = await prisma.rule.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: "asc" },
  });

  for (const rule of rules) {
    if (matchRule(rule, normalizedDescription)) {
      return rule.categoryId;
    }
  }

  return null;
}

export async function applyRulesToAccount(
  accountId: string,
  userId: string
): Promise<number> {
  const rules = await prisma.rule.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: { accountId },
    select: { id: true, normalizedDescription: true },
  });

  let updated = 0;
  for (const tx of transactions) {
    for (const rule of rules) {
      if (matchRule(rule, tx.normalizedDescription)) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { categoryId: rule.categoryId },
        });
        updated++;
        break;
      }
    }
  }

  return updated;
}

export async function applyRulesToBatch(
  batchId: string,
  userId: string
): Promise<number> {
  const rules = await prisma.rule.findMany({
    where: { userId, isActive: true },
    orderBy: { priority: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    where: { importBatchId: batchId },
    select: { id: true, normalizedDescription: true },
  });

  let updated = 0;
  for (const tx of transactions) {
    for (const rule of rules) {
      if (matchRule(rule, tx.normalizedDescription)) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { categoryId: rule.categoryId },
        });
        updated++;
        break;
      }
    }
  }

  return updated;
}
