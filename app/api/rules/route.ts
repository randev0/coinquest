import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRulesToAccount } from "@/lib/categorization";
import { assertSafeRegex } from "@/lib/safe-regex";

const createSchema = z.object({
  pattern: z.string().min(1).max(200),
  matchType: z.enum(["CONTAINS", "REGEX", "EXACT"]),
  categoryId: z.string(),
  priority: z.number().min(1).max(999).default(100),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.rule.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { priority: "asc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Validate REGEX patterns for safety before persisting
  if (parsed.data.matchType === "REGEX") {
    try {
      assertSafeRegex(parsed.data.pattern);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid regex pattern" },
        { status: 400 }
      );
    }
  }

  const rule = await prisma.rule.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
    include: { category: true },
  });

  return NextResponse.json({ rule }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const rule = await prisma.rule.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.rule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// POST /api/rules/apply — retroactively apply rules to all accounts
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let totalUpdated = 0;
  for (const acc of accounts) {
    totalUpdated += await applyRulesToAccount(acc.id, session.user.id);
  }

  return NextResponse.json({ updated: totalUpdated });
}
