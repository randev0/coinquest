import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  const where: Record<string, unknown> = {
    accountId: accountId ? accountId : { in: accountIds },
  };

  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.postedDate = {
      gte: new Date(year, m - 1, 1),
      lte: new Date(year, m, 0, 23, 59, 59),
    };
  }

  if (categoryId === "uncategorized") {
    where.categoryId = null;
  } else if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { normalizedDescription: { contains: search.toUpperCase() } },
      { merchantGuess: { contains: search, mode: "insensitive" } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy: { postedDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
