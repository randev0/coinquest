"use client";

import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "game-window rounded-sm px-4 py-3 flex items-start gap-3 shadow-window",
            toast.variant === "destructive" && "border-mmorpg-danger/50"
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="font-pixel text-[9px] text-mmorpg-parchment uppercase tracking-wide">
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p className="text-xs text-mmorpg-steel mt-0.5">{toast.description}</p>
            )}
          </div>
          <button onClick={() => dismiss(toast.id)} className="text-mmorpg-steel hover:text-mmorpg-parchment shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
