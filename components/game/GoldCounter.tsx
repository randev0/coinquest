"use client";

import { useEffect, useRef, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoldCounterProps {
  amount: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function GoldCounter({
  amount,
  label,
  size = "md",
  className,
  showIcon = true,
}: GoldCounterProps) {
  const [displayAmount, setDisplayAmount] = useState(0);
  const prevAmount = useRef(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevAmount.current;
    const end = amount;
    const duration = 600;
    const startTime = performance.now();

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      setDisplayAmount(start + (end - start) * eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        prevAmount.current = end;
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [amount]);

  const sizeMap = {
    sm: { text: "text-sm", icon: 12, label: "text-[8px]" },
    md: { text: "text-xl", icon: 16, label: "text-[9px]" },
    lg: { text: "text-3xl", icon: 20, label: "text-[10px]" },
  };

  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-start gap-0.5", className)}>
      {label && (
        <span className={cn("font-pixel text-mmorpg-steel uppercase tracking-widest", s.label)}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {showIcon && (
          <Coins size={s.icon} className="text-mmorpg-gold" />
        )}
        <span
          className={cn(
            "font-pixel text-mmorpg-gold gold-counter tabular-nums",
            s.text
          )}
        >
          RM {displayAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// HP/SP style progress bar
export function ResourceBar({
  value,
  max,
  type = "hp",
  label,
  showNumbers = true,
}: {
  value: number;
  max: number;
  type?: "hp" | "mp" | "xp" | "gold";
  label?: string;
  showNumbers?: boolean;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorMap = {
    hp: "bg-danger-gradient",
    mp: "bg-xp-gradient",
    xp: "bg-xp-gradient",
    gold: "bg-gold-gradient",
  };

  const trackColorMap = {
    hp: "bg-[#1a0a0a] border-[#3a1a1a]",
    mp: "bg-[#0a0a1a] border-[#1a1a3a]",
    xp: "bg-[#0a0a1a] border-[#1a1a3a]",
    gold: "bg-[#1a1200] border-[#3a2a00]",
  };

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-pixel text-mmorpg-steel uppercase tracking-wider">
            {label}
          </span>
          {showNumbers && (
            <span className="text-[9px] font-pixel text-mmorpg-steelLight">
              {value.toFixed(0)} / {max.toFixed(0)}
            </span>
          )}
        </div>
      )}
      <div className={cn("h-3 border rounded-sm overflow-hidden", trackColorMap[type])}>
        <div
          className={cn("h-full transition-all duration-500 ease-out", colorMap[type])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
