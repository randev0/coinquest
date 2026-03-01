import { getGroqClient } from "./groq-client";
import { InsightData } from "@/types";
import { formatMYR } from "./utils";

const MODEL = "llama-3.3-70b-versatile";

export async function generateAISuggestions(
  data: InsightData
): Promise<string[] | null> {
  const client = getGroqClient();
  if (!client) return null;

  const prompt = buildAnonymisedPrompt(data);

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `You are a financial advisor analyzing anonymised spending data for a Malaysian user.
Provide exactly 5 specific, actionable insights based on the data. Be concise and direct.
Currency is MYR (Malaysian Ringgit).
Respond ONLY with a JSON object: {"insights": ["insight1", "insight2", "insight3", "insight4", "insight5"]}
Each insight must be 1-2 sentences. Start each with a relevant emoji.
Focus on: biggest expenses, savings opportunities, subscription waste, unusual patterns, practical advice.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    const insights: unknown = parsed.insights;

    if (Array.isArray(insights) && insights.length > 0) {
      return insights.map((s: unknown) => String(s));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds a prompt using only aggregated, anonymised data.
 * No merchant names, category names, or subscription names are sent externally.
 * Only amounts, percentages, and counts are included.
 */
function buildAnonymisedPrompt(data: InsightData): string {
  const lines: string[] = [];

  lines.push(`Month: ${data.month}`);
  lines.push(`Total Spend: ${formatMYR(data.totalSpend)}`);

  if (data.totalIncome > 0) {
    const savingsRate =
      ((data.totalIncome - data.totalSpend) / data.totalIncome) * 100;
    lines.push(`Total Income: ${formatMYR(data.totalIncome)}`);
    lines.push(`Net Savings Rate: ${savingsRate.toFixed(1)}%`);
  }

  if (data.previousMonthComparison) {
    const { deltaPercent, previousTotal } = data.previousMonthComparison;
    lines.push(
      `vs Last Month: ${deltaPercent > 0 ? "+" : ""}${deltaPercent.toFixed(1)}% (was ${formatMYR(previousTotal)})`
    );
  }

  // Categories: send rank, amount, and percentage — NOT the category name
  if (data.topCategories.length > 0) {
    lines.push("\nTop Spending Categories (anonymised):");
    data.topCategories.forEach((cat, i) => {
      const pct =
        data.totalSpend > 0
          ? ((cat.total / data.totalSpend) * 100).toFixed(1)
          : "0";
      lines.push(
        `  - Category ${i + 1}: ${formatMYR(cat.total)} (${pct}%, ${cat.count} transactions)`
      );
    });
  }

  // Subscriptions: count, total monthly cost, annual cost — no merchant names
  if (data.subscriptions.length > 0) {
    const annualTotal = data.subscriptions.reduce(
      (s, x) => s + x.annualizedCost,
      0
    );
    lines.push(
      `\nActive Subscriptions: ${data.subscriptions.length} services, ${formatMYR(data.subscriptionTotal)}/mo = ${formatMYR(annualTotal)}/yr`
    );
    // Individual amounts only, no merchant names
    data.subscriptions.slice(0, 6).forEach((sub, i) => {
      lines.push(`  - Subscription ${i + 1}: ${formatMYR(sub.avgAmount)}/mo`);
    });
  }

  // Top merchants: rank and amount only — no merchant names
  if (data.topMerchants.length > 0) {
    lines.push("\nTop Merchants by spend (anonymised):");
    data.topMerchants.slice(0, 5).forEach((m, i) => {
      lines.push(`  - Merchant ${i + 1}: ${formatMYR(m.total)} (${m.count} visits)`);
    });
  }

  // Spending spike: category rank and amount increase — no category name
  if (data.leakCategory) {
    const catIndex = data.topCategories.findIndex(
      (c) => c.categoryName === data.leakCategory!.categoryName
    );
    const label = catIndex >= 0 ? `Category ${catIndex + 1}` : "a category";
    lines.push(
      `\nSpending Spike: ${label} jumped +${data.leakCategory.increasePercent.toFixed(0)}% vs last month (+${formatMYR(data.leakCategory.increase)})`
    );
  }

  return lines.join("\n");
}
