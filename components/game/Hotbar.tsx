"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";

interface HotbarItem {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  shortcut?: string;
  variant?: "default" | "gold" | "danger";
  disabled?: boolean;
}

interface HotbarProps {
  items: HotbarItem[];
}

export function Hotbar({ items }: HotbarProps) {
  return (
    <div className="hotbar fixed bottom-0 left-0 right-0 z-50 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        {items.map((item, i) => {
          const base = cn(
            "btn-game flex flex-col items-center gap-0.5 px-4 py-2 rounded-sm cursor-pointer select-none",
            item.variant === "gold" && "btn-gold",
            item.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
          );

          const inner = (
            <>
              <span className="text-base">{item.icon}</span>
              <span className="font-pixel text-[7px] uppercase tracking-wider text-mmorpg-steelLight whitespace-nowrap">
                {item.label}
              </span>
              {item.shortcut && (
                <span className="text-[7px] text-mmorpg-steel/50 font-pixel">[{item.shortcut}]</span>
              )}
            </>
          );

          if (item.href) {
            return (
              <Link key={i} href={item.href} className={base}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={i} onClick={item.onClick} className={base} disabled={item.disabled}>
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
