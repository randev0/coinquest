import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const upsertSchema = z.object({
  categoryId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().min(0),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (month) where.month = month;

  const budgets = await prisma.budget.findMany({
    where,
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  return NextResponse.json({ budgets });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { categoryId, month, amount } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month: {
        userId: session.user.id,
        categoryId,
        month,
      },
    },
    update: { amount },
    create: {
      userId: session.user.id,
      categoryId,
      month,
      amount,
    },
    include: { category: true },
  });

  return NextResponse.json({ budget });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const budget = await prisma.budget.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.budget.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
