"use client";

import { cn, formatMYR, getMonthLabel } from "@/lib/utils";
import { Shield, Coins, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

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

export function HudBar({ month, totalSpend, userName }: HudBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="status-bar sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">

        {/* Left: Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Shield className="text-mmorpg-gold" size={18} />
          <span className="font-pixel text-[11px] text-mmorpg-gold tracking-widest hidden sm:block">
            COINQUEST
          </span>
        </div>

        {/* Center: Full nav tabs (desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "game-tab flex items-center gap-1.5",
                  isActive && "active"
                )}
              >
                <span className="text-xs">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Center: Dropdown nav (mobile only) */}
        <div className="relative md:hidden" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="game-tab active flex items-center gap-2"
            style={{ borderBottom: "2px solid #d4a017", color: "#d4a017", padding: "6px 14px" }}
          >
            <span className="text-xs">{current.icon}</span>
            <span className="font-pixel text-[9px] uppercase tracking-widest">{current.label}</span>
            <ChevronDown
              size={11}
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
                color: "#d4a017",
              }}
            />
          </button>

          {open && (
            <div
              className="absolute left-1/2 mt-1 z-50"
              style={{
                transform: "translateX(-50%)",
                minWidth: "160px",
                background: "linear-gradient(145deg, #111827 0%, #0e1525 100%)",
                border: "1px solid #2a3650",
                boxShadow: "0 4px 24px rgba(0,0,0,0.8), 0 0 0 1px #2a3650, inset 1px 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {NAV_ITEMS.map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 14px",
                      borderBottom: i < NAV_ITEMS.length - 1 ? "1px solid #1e2a3a" : "none",
                      background: isActive ? "rgba(212,160,23,0.08)" : "transparent",
                      borderLeft: isActive ? "2px solid #d4a017" : "2px solid transparent",
                      transition: "background 0.1s",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(58,123,213,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span style={{ fontSize: "13px", lineHeight: 1 }}>{item.icon}</span>
                    <span
                      className="font-pixel"
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                        color: isActive ? "#d4a017" : "#9aaac4",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="font-pixel" style={{ fontSize: "8px", color: "#d4a017", marginLeft: "auto" }}>
                        ◀
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: spend this month */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <Calendar size={11} className="text-mmorpg-steel" />
            <span className="text-[9px] font-pixel text-mmorpg-steelLight">
              {getMonthLabel(month)}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <Coins size={12} className="text-mmorpg-gold" />
              <span className="text-[10px] font-pixel text-mmorpg-gold">
                {formatMYR(totalSpend)}
              </span>
            </div>
            <span className="text-[7px] font-pixel text-mmorpg-steel/60 hidden lg:block">
              spent this month
            </span>
          </div>
          {userName && (
            <span className="text-[9px] font-pixel text-mmorpg-steel hidden lg:block">
              [{userName}]
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
