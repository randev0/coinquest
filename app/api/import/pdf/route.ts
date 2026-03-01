import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePDFContent } from "@/lib/parser/pdf-parser";
import { categorizeTransaction } from "@/lib/categorization";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Strip path separators and null bytes from a filename before storing it. */
function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>\x00]/g, "_").substring(0, 255);
}

/** Verify the buffer starts with the PDF magic bytes: %PDF */
function isPdfBuffer(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  );
}

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

  // File size check
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Read buffer first so we can validate magic bytes before doing anything else
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate PDF magic bytes — extension checks alone are trivially bypassed
  if (!isPdfBuffer(buffer)) {
    return NextResponse.json({ error: "Invalid file type. Only PDF files are accepted." }, { status: 400 });
  }

  const safeFilename = sanitizeFilename(file.name);

  // Verify account belongs to user
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const batch = await prisma.importBatch.create({
    data: {
      userId: session.user.id,
      accountId,
      filename: safeFilename,
      month,
      status: "PROCESSING",
    },
  });

  try {
    const { transactions, profile, errors } = await parsePDFContent(buffer, accountId);

    let importedRows = 0;
    let skippedRows = 0;
    let duplicateCount = 0;

    for (const tx of transactions) {
      const existing = await prisma.transaction.findFirst({
        where: { fingerprint: tx.fingerprint, accountId },
      });

      if (existing) {
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
    // Log full error server-side only; return a generic message to the client
    console.error("[import/pdf] processing error:", err);

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Import failed. Please check your file format and try again." },
      { status: 500 }
    );
  }
}
