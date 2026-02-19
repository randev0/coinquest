"use client";

import { cn, formatMYR, getMonthLabel } from "@/lib/utils";
import { Shield, Coins, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HudBarProps {
  month: string;
  totalSpend: number;
  savingsGoal?: number;
  savingsActual?: number;
  userName?: string;
  onMonthChange?: (month: string) => void;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: "⚔" },
  { label: "Transactions", href: "/transactions", icon: "📜" },
  { label: "Budgets", href: "/budgets", icon: "🛡" },
  { label: "Insights", href: "/insights", icon: "🔮" },
  { label: "Settings", href: "/settings", icon: "⚙" },
];

export function HudBar({
  month,
  totalSpend,
  userName,
}: HudBarProps) {
  const pathname = usePathname();

  return (
    <div className="status-bar sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Logo + User */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="text-mmorpg-gold" size={18} />
            <span className="font-pixel text-[11px] text-mmorpg-gold tracking-widest">
              COINQUEST
            </span>
          </div>
          {userName && (
            <span className="text-[9px] font-pixel text-mmorpg-steel hidden sm:block">
              [{userName}]
            </span>
          )}
        </div>

        {/* Center: Nav */}
        <nav className="flex items-center gap-0 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("game-tab flex items-center gap-1.5", isActive && "active")}
              >
                <span className="text-xs">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: HUD stats */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 hidden md:flex">
            <Calendar size={11} className="text-mmorpg-steel" />
            <span className="text-[9px] font-pixel text-mmorpg-steelLight">
              {getMonthLabel(month)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins size={12} className="text-mmorpg-gold" />
            <span className="text-[10px] font-pixel text-mmorpg-gold">
              {formatMYR(totalSpend)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 hidden lg:flex">
            <TrendingUp size={11} className="text-mmorpg-accentBlue" />
            <span className="text-[9px] font-pixel text-mmorpg-accentBlue">SPEND</span>
          </div>
        </div>
      </div>
    </div>
  );
}
