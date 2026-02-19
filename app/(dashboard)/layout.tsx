import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HudBar } from "@/components/game/HudBar";
import { prisma } from "@/lib/db";
import { getCurrentMonth } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const month = getCurrentMonth();
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59);

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const spendAgg = await prisma.transaction.aggregate({
    where: {
      accountId: { in: accounts.map((a) => a.id) },
      postedDate: { gte: start, lte: end },
      direction: "DEBIT",
    },
    _sum: { amount: true },
  });

  const totalSpend = parseFloat(spendAgg._sum.amount?.toString() || "0");

  return (
    <div className="min-h-screen flex flex-col">
      <HudBar
        month={month}
        totalSpend={totalSpend}
        userName={session.user.name || session.user.email}
      />
      <main className="flex-1 pb-20">{children}</main>
    </div>
  );
}
