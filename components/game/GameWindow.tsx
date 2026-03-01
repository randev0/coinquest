"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, X } from "lucide-react";
import { ReactNode, useState } from "react";

interface GameWindowProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  badge?: string | number;
  action?: ReactNode;
  subtitle?: string;
}

export function GameWindow({
  title,
  icon,
  children,
  className,
  titleClassName,
  contentClassName,
  collapsible = false,
  defaultCollapsed = false,
  badge,
  action,
  subtitle,
}: GameWindowProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("game-window rounded-sm overflow-hidden", className)}
    >
      {/* Title Bar */}
      <div className={cn("game-window-title flex items-center justify-between px-3 py-2", titleClassName)}>
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-mmorpg-gold opacity-80 text-sm">{icon}</span>
          )}
          <span className="font-pixel text-[9px] text-mmorpg-parchment tracking-widest uppercase">
            {title}
          </span>
          {badge !== undefined && (
            <span className="bg-mmorpg-gold text-mmorpg-bg text-[8px] font-pixel px-1.5 py-0.5 rounded-sm">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="text-[8px] font-pixel text-mmorpg-teal opacity-80">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {action && <div className="mr-1">{action}</div>}
          {/* Cosmetic window buttons */}
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-4 h-4 flex items-center justify-center rounded-sm bg-mmorpg-border hover:bg-mmorpg-bevelLight transition-colors"
            >
              <Minus size={8} className="text-mmorpg-steel" />
            </button>
          )}
          <div className="w-4 h-4 flex items-center justify-center rounded-sm bg-mmorpg-border opacity-40 cursor-not-allowed">
            <X size={8} className="text-mmorpg-steel" />
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className={cn("overflow-hidden")}
          >
            <div className={cn("p-4", contentClassName)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Stat row used in character panel
export function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-mmorpg-border/40">
      <span className="text-mmorpg-steel text-[10px] font-pixel uppercase tracking-wider">
        {label}
      </span>
      <span className={cn("text-mmorpg-parchment text-xs font-medium", valueClass)}>
        {value}
      </span>
    </div>
  );
}
