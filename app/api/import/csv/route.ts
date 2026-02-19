import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCSVContent } from "@/lib/parser/csv-parser";
import { categorizeTransaction } from "@/lib/categorization";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const accountId = formData.get("accountId") as string | null;
  const month = formData.get("month") as string | null;

  if (!file || !accountId || !month) {
    return NextResponse.json({ error: "Missing file, accountId, or month" }, { status: 400 });
  }

  if (!month.match(/^\d{4}-\d{2}$/)) {
    return NextResponse.json({ error: "Invalid month format (use YYYY-MM)" }, { status: 400 });
  }

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Read CSV
  const csvContent = await file.text();

  // Create import batch
  const batch = await prisma.importBatch.create({
    data: {
      userId: session.user.id,
      accountId,
      filename: file.name,
      month,
      status: "PROCESSING",
    },
  });

  try {
    // Parse CSV
    const { transactions, profile, errors } = parseCSVContent(csvContent, accountId);

    let importedRows = 0;
    let skippedRows = 0;
    let duplicateCount = 0;

    // Insert transactions
    for (const tx of transactions) {
      // Check for existing fingerprint
      const existing = await prisma.transaction.findFirst({
        where: { fingerprint: tx.fingerprint, accountId },
      });

      if (existing) {
        // Check if raw differs — possible duplicate
        if (existing.rawLine !== tx.rawLine) {
          await prisma.transaction.update({
            where: { id: existing.id },
            data: { isDuplicate: true },
          });
          duplicateCount++;
        }
        skippedRows++;
        continue;
      }

      // Categorize
      const categoryId = await categorizeTransaction(
        tx.normalizedDescription,
        session.user.id
      );

      await prisma.transaction.create({
        data: {
          accountId,
          importBatchId: batch.id,
          postedDate: tx.postedDate,
          description: tx.description,
          normalizedDescription: tx.normalizedDescription,
          amount: tx.amount,
          direction: tx.direction,
          merchantGuess: tx.merchantGuess,
          rawLine: tx.rawLine,
          fingerprint: tx.fingerprint,
          categoryId,
        },
      });

      importedRows++;
    }

    // Update batch status
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "COMPLETED",
        totalRows: transactions.length + skippedRows,
        importedRows,
        skippedRows,
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      profile,
      totalRows: transactions.length + skippedRows,
      importedRows,
      skippedRows,
      duplicates: duplicateCount,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
