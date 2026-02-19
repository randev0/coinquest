"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  description?: string;
}

interface RpgMenuProps {
  items: MenuItem[];
  userName?: string;
}

export function RpgMenu({ items, userName }: RpgMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-50">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-sm font-pixel text-[10px] uppercase tracking-wider",
          "border-2 border-mmorpg-gold/50 bg-mmorpg-panel hover:bg-mmorpg-panelLight",
          "transition-all duration-200",
          isOpen && "bg-mmorpg-gold/20 border-mmorpg-gold"
        )}
      >
        <span className="text-mmorpg-gold">☰</span>
        <span className="text-mmorpg-parchment hidden sm:inline">Menu</span>
        <ChevronDown
          size={14}
          className={cn(
            "text-mmorpg-gold transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu - RPG Style */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-full left-0 mt-2 w-64 z-50">
            <div className="game-window p-2 border-2 border-mmorpg-gold/50">
              {/* Menu Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-mmorpg-border mb-2">
                <span className="font-pixel text-[10px] text-mmorpg-gold uppercase">
                  ⚔️ Quest Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-mmorpg-steel hover:text-mmorpg-parchment"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex flex-col gap-1">
                {items.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-sm",
                      "hover:bg-mmorpg-gold/10 hover:border-mmorpg-gold/30",
                      "border border-transparent transition-all group"
                    )}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <span className="block font-pixel text-[9px] text-mmorpg-parchment uppercase tracking-wider">
                        {item.label}
                      </span>
                      {item.description && (
                        <span className="block text-[8px] text-mmorpg-steel">
                          {item.description}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-mmorpg-gold/50 font-pixel">
                      [{i + 1}]
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              {userName && (
                <div className="mt-2 pt-2 border-t border-mmorpg-border px-3 py-1">
                  <span className="text-[8px] text-mmorpg-steel">
                    Adventurer: <span className="text-mmorpg-gold">{userName}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
