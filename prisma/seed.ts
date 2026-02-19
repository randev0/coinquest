import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Income", icon: "💰", color: "#3a8a5a", isSystem: true },
  { name: "Transfer", icon: "🔄", color: "#3a7bd5", isSystem: true },
  { name: "Bills", icon: "📋", color: "#6a3aad", isSystem: true },
  { name: "Subscriptions", icon: "🔁", color: "#1a8a8a", isSystem: true },
  { name: "Food", icon: "🍜", color: "#c85020", isSystem: true },
  { name: "Transport", icon: "🚗", color: "#3a5a9a", isSystem: true },
  { name: "Shopping", icon: "🛍️", color: "#8a3a7a", isSystem: true },
  { name: "Groceries", icon: "🛒", color: "#4a8a2a", isSystem: true },
  { name: "Healthcare", icon: "🏥", color: "#1a7a7a", isSystem: true },
  { name: "Education", icon: "📚", color: "#5a4a9a", isSystem: true },
  { name: "Entertainment", icon: "🎮", color: "#9a3a1a", isSystem: true },
  { name: "Fees", icon: "💳", color: "#7a6a4a", isSystem: true },
  { name: "Others", icon: "📦", color: "#5a5a6a", isSystem: true },
];

const DEFAULT_RULES = [
  // Subscriptions
  { pattern: "NETFLIX", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "YOUTUBE PREMIUM", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "GOOGLE ONE", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "GOOGLE STORAGE", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "SPOTIFY", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "APPLE.COM/BILL", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "ICLOUD", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "DISNEY PLUS", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "DISNEYPLUS", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "HBO MAX", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "AMAZON PRIME", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "MICROSOFT 365", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "OFFICE 365", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "ADOBE", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "CANVA", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "GITHUB", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 15 },
  { pattern: "CHATGPT", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "OPENAI", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "ASTRO", matchType: "CONTAINS", categoryName: "Subscriptions", priority: 10 },
  { pattern: "UNIFI", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "MAXIS", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "CELCOM", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "DIGI", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "TNB", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "SYABAS", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "INDAH WATER", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  { pattern: "AIR SELANGOR", matchType: "CONTAINS", categoryName: "Bills", priority: 20 },
  // Food
  { pattern: "GRAB FOOD", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "GRABFOOD", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "FOODPANDA", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "MCDONALDS", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "KFC", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "PIZZA", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "SUBWAY", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "STARBUCKS", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "TEALIVE", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "CHATIME", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  { pattern: "OLD TOWN", matchType: "CONTAINS", categoryName: "Food", priority: 30 },
  // Transport
  { pattern: "GRAB", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "MYBAYAR SEWA", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "PLUS EXPRESSWAY", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "PETRON", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "PETRONAS", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "SHELL", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "CALTEX", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "TOUCH N GO", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  { pattern: "TOUCHNGO", matchType: "CONTAINS", categoryName: "Transport", priority: 40 },
  // Shopping
  { pattern: "SHOPEE", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "LAZADA", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "ZALORA", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "H&M", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "ZARA", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "UNIQLO", matchType: "CONTAINS", categoryName: "Shopping", priority: 50 },
  { pattern: "AMAZON", matchType: "CONTAINS", categoryName: "Shopping", priority: 55 },
  // Groceries
  { pattern: "JAYA GROCER", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "VILLAGE GROCER", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "AEON", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "TESCO", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "LOTUS", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "GIANT", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "MYDIN", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "COLD STORAGE", matchType: "CONTAINS", categoryName: "Groceries", priority: 35 },
  { pattern: "BIG PHARMACY", matchType: "CONTAINS", categoryName: "Healthcare", priority: 38 },
  { pattern: "GUARDIAN", matchType: "CONTAINS", categoryName: "Healthcare", priority: 38 },
  { pattern: "WATSON", matchType: "CONTAINS", categoryName: "Healthcare", priority: 38 },
  // Fees
  { pattern: "ANNUAL FEE", matchType: "CONTAINS", categoryName: "Fees", priority: 25 },
  { pattern: "LATE CHARGE", matchType: "CONTAINS", categoryName: "Fees", priority: 25 },
  { pattern: "FINANCE CHARGE", matchType: "CONTAINS", categoryName: "Fees", priority: 25 },
  { pattern: "SERVICE TAX", matchType: "CONTAINS", categoryName: "Fees", priority: 25 },
  { pattern: "STAMP DUTY", matchType: "CONTAINS", categoryName: "Fees", priority: 25 },
  // Income
  { pattern: "SALARY", matchType: "CONTAINS", categoryName: "Income", priority: 5 },
  { pattern: "PAYMENT RECEIVED", matchType: "CONTAINS", categoryName: "Income", priority: 5 },
  { pattern: "CASHBACK", matchType: "CONTAINS", categoryName: "Income", priority: 5 },
  { pattern: "REFUND", matchType: "CONTAINS", categoryName: "Income", priority: 5 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create categories
  const categories: Record<string, { id: string }> = {};
  for (const cat of DEFAULT_CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories[cat.name] = category;
  }
  console.log(`✅ Created ${DEFAULT_CATEGORIES.length} categories`);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@coinquest.app" },
    update: {},
    create: {
      email: "demo@coinquest.app",
      name: "Demo Adventurer",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });
  console.log(`✅ Created demo user: demo@coinquest.app / demo1234`);

  // Create demo accounts
  await prisma.account.upsert({
    where: { userId_name: { userId: demoUser.id, name: "Primary Credit Card" } },
    update: {},
    create: {
      userId: demoUser.id,
      name: "Primary Credit Card",
      type: "CARD",
      currency: "MYR",
    },
  });

  await prisma.account.upsert({
    where: { userId_name: { userId: demoUser.id, name: "Secondary Debit Card" } },
    update: {},
    create: {
      userId: demoUser.id,
      name: "Secondary Debit Card",
      type: "CARD",
      currency: "MYR",
    },
  });
  console.log("✅ Created demo accounts");

  // Create default rules for demo user
  for (const rule of DEFAULT_RULES) {
    const category = categories[rule.categoryName];
    if (!category) continue;

    const existing = await prisma.rule.findFirst({
      where: {
        userId: demoUser.id,
        pattern: rule.pattern,
        matchType: rule.matchType as "CONTAINS" | "REGEX" | "EXACT",
      },
    });

    if (!existing) {
      await prisma.rule.create({
        data: {
          userId: demoUser.id,
          priority: rule.priority,
          matchType: rule.matchType as "CONTAINS" | "REGEX" | "EXACT",
          pattern: rule.pattern,
          categoryId: category.id,
        },
      });
    }
  }
  console.log(`✅ Created ${DEFAULT_RULES.length} default categorization rules`);

  console.log("\n🎉 Seed complete!");
  console.log("   Login: demo@coinquest.app");
  console.log("   Password: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
