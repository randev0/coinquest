"use client";

import { useState, useRef } from "react";
import { GameWindow } from "@/components/game/GameWindow";
import { Hotbar } from "@/components/game/Hotbar";
import { getCurrentMonth } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  duplicates: number;
  errors: string[];
  batchId: string;
  profile: string;
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState("");
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: accountsData } = useSWR<{ accounts: { id: string; name: string; type: string }[] }>(
    "/api/accounts",
    fetcher
  );
  const accounts = accountsData?.accounts || [];

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".pdf")) {
      toast({ title: "Invalid file", description: "Only CSV and PDF files are supported", variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !accountId || !month) {
      toast({ title: "Missing fields", description: "Please select file, account, and month", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("accountId", accountId);
    formData.append("month", month);

    try {
      const isPDF = file.name.toLowerCase().endsWith(".pdf");
      const res = await fetch(isPDF ? "/api/import/pdf" : "/api/import/csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Import failed", description: data.error || "Unknown error", variant: "destructive" });
      } else {
        setResult(data);
        toast({
          title: "Import complete!",
          description: `${data.importedRows} transactions imported`,
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Network error during import", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { value, label: d.toLocaleDateString("en-MY", { month: "long", year: "numeric" }) };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="font-pixel text-[12px] text-mmorpg-gold tracking-wider">Import Bank Statement</h1>
        <p className="text-sm text-mmorpg-steel mt-1">Upload your bank CSV or PDF export to start tracking transactions.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Import Form */}
        <GameWindow title="Import Statement" icon="📥">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-mmorpg-gold bg-mmorpg-gold/5"
                  : file
                  ? "border-mmorpg-success bg-mmorpg-success/5"
                  : "border-mmorpg-border hover:border-mmorpg-bevelLight"
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="text-mmorpg-successLight" size={32} />
                  <p className="font-pixel text-[9px] text-mmorpg-parchment">{file.name}</p>
                  <p className="text-[10px] text-mmorpg-steel">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-[9px] font-pixel text-mmorpg-dangerLight mt-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="text-mmorpg-steel" size={32} />
                  <p className="font-pixel text-[9px] text-mmorpg-steel">
                    Drop CSV or PDF here or click to browse
                  </p>
                  <p className="text-[10px] text-mmorpg-steel/60">
                    Any bank CSV or PDF statement
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </div>

            {/* Account select */}
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="game-input"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
              {accounts.length === 0 && (
                <p className="text-[9px] text-mmorpg-warningLight">
                  No accounts. <a href="/settings" className="underline">Create one first →</a>
                </p>
              )}
            </div>

            {/* Month select */}
            <div className="flex flex-col gap-1">
              <label className="font-pixel text-[8px] text-mmorpg-steel uppercase tracking-widest">
                Statement Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="game-input"
                required
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !file || !accountId}
              className="btn-gold py-3 rounded-sm font-pixel text-[9px] uppercase tracking-widest disabled:opacity-40"
            >
              {loading ? "⚙ Parsing..." : "📥 Import Statement"}
            </button>
          </form>
        </GameWindow>

        {/* Result Panel */}
        <div className="flex flex-col gap-4">
          {result && (
            <GameWindow title="Import Result" icon={result.success ? "✅" : "❌"}>
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-2 p-3 rounded-sm ${
                  result.importedRows > 0
                    ? "bg-mmorpg-success/10 border border-mmorpg-success/30"
                    : "bg-mmorpg-warning/10 border border-mmorpg-warning/30"
                }`}>
                  {result.importedRows > 0 ? (
                    <CheckCircle className="text-mmorpg-successLight" size={16} />
                  ) : (
                    <AlertCircle className="text-mmorpg-warningLight" size={16} />
                  )}
                  <span className="font-pixel text-[9px] text-mmorpg-parchment">
                    {result.importedRows > 0 ? "Import Successful" : "Nothing Imported"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total Rows", value: result.totalRows },
                    { label: "Imported", value: result.importedRows, color: "text-mmorpg-successLight" },
                    { label: "Skipped", value: result.skippedRows, color: "text-mmorpg-warningLight" },
                    { label: "Duplicates", value: result.duplicates, color: "text-mmorpg-steel" },
                  ].map((stat) => (
                    <div key={stat.label} className="game-window p-2 rounded-sm">
                      <p className="font-pixel text-[7px] text-mmorpg-steel uppercase mb-1">{stat.label}</p>
                      <p className={`font-pixel text-sm ${stat.color || "text-mmorpg-parchment"}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[9px] text-mmorpg-steel">
                  Detected profile: <span className="text-mmorpg-gold font-pixel">{result.profile}</span>
                </p>

                {result.errors.length > 0 && (
                  <div className="bg-mmorpg-danger/10 border border-mmorpg-danger/30 p-3 rounded-sm">
                    <p className="font-pixel text-[8px] text-mmorpg-dangerLight mb-2">Parse Warnings:</p>
                    <div className="max-h-32 overflow-y-auto">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <p key={i} className="text-[9px] text-mmorpg-steel mb-0.5">{err}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <a
                    href="/transactions"
                    className="btn-game px-4 py-2 rounded-sm font-pixel text-[9px] text-mmorpg-parchment flex-1 text-center"
                  >
                    View Transactions →
                  </a>
                  <a
                    href="/insights"
                    className="btn-game px-4 py-2 rounded-sm font-pixel text-[9px] text-mmorpg-parchment flex-1 text-center"
                  >
                    Generate Insights →
                  </a>
                </div>
              </div>
            </GameWindow>
          )}

          {/* Format guide */}
          <GameWindow title="Supported Formats" icon="📖" collapsible defaultCollapsed>
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-mmorpg-steelLight">
                Works with <strong className="text-mmorpg-gold">any bank</strong> CSV export.
                Auto-detects columns for Date, Description, and Amount.
              </p>
              {[
                {
                  name: "Generic CSV",
                  format: "Date, Description, Amount (or Debit/Credit)",
                  note: "Most banks: Look for Download CSV or Export in online banking",
                },
                {
                  name: "Credit Card (Example)",
                  format: "Date, Description, Amount, Balance",
                  note: "Most banks: Look for Export or Download CSV in online banking",
                },
                {
                  name: "Debit Card (Example)",
                  format: "Transaction Date, Description, Amount, Balance",
                  note: "Export from your bank website or mobile app",
                },
                {
                  name: "PDF Statement (Generic)",
                  format: "Any PDF with date + description + amount per line",
                  note: "Works with BSN, Agrobank, Standard Chartered, and more. Heuristic extraction — results may vary.",
                },
              ].map((fmt) => (
                <div key={fmt.name} className="border-b border-mmorpg-border/40 pb-2">
                  <p className="font-pixel text-[9px] text-mmorpg-gold">{fmt.name}</p>
                  <p className="text-[10px] text-mmorpg-steelLight mt-0.5 font-mono">{fmt.format}</p>
                  <p className="text-[9px] text-mmorpg-steel/60 mt-1">{fmt.note}</p>
                </div>
              ))}
              <p className="text-[9px] text-mmorpg-steel/50 italic">
                ℹ Heuristic detection handles most column name variations automatically.
              </p>
            </div>
          </GameWindow>
        </div>
      </div>

      <Hotbar
        items={[
          { label: "Dashboard", icon: "⚔", href: "/dashboard" },
          { label: "Transactions", icon: "📜", href: "/transactions" },
          { label: "Budgets", icon: "🛡", href: "/budgets" },
          { label: "Insights", icon: "🔮", href: "/insights" },
          { label: "Settings", icon: "⚙", href: "/settings" },
        ]}
      />
    </div>
  );
}
