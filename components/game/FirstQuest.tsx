"use client";

import Link from "next/link";
import { CheckCircle, Circle, Lock } from "lucide-react";

interface QuestStep {
  id: string;
  label: string;
  href: string;
  done: boolean;
  locked: boolean;
}

interface FirstQuestProps {
  steps: QuestStep[];
  isDemo?: boolean;
}

export function FirstQuest({ steps, isDemo = false }: FirstQuestProps) {
  const completedCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  if (allDone && !isDemo) return null;

  return (
    <div className="game-window rounded-sm p-4 border-2 border-mmorpg-gold/50 bg-mmorpg-panel/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <h2 className="font-pixel text-[10px] text-mmorpg-gold uppercase tracking-wider">
            Getting Started
          </h2>
        </div>
        <span className="font-pixel text-[8px] text-mmorpg-steel">
          {completedCount}/{totalCount}
        </span>
      </div>

      {allDone && isDemo ? (
        <p className="text-[10px] text-mmorpg-successLight mb-3 font-pixel">
          ✓ All set! (Demo account resets on each login)
        </p>
      ) : (
        <p className="text-[10px] text-mmorpg-steelLight mb-3">
          Complete these steps to start tracking your finances
        </p>
      )}

      <div className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const isNext = !step.done && !step.locked && steps.slice(0, index).every((s) => s.done);

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2 rounded-sm ${
                isNext ? "bg-mmorpg-gold/10 border border-mmorpg-gold/30" : "bg-mmorpg-bg/50"
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {step.done ? (
                  <CheckCircle className="text-mmorpg-successLight" size={16} />
                ) : step.locked ? (
                  <Lock className="text-mmorpg-steel/50" size={14} />
                ) : (
                  <Circle className={`${isNext ? "text-mmorpg-gold" : "text-mmorpg-steel"}`} size={16} />
                )}
              </div>

              <div className="flex-1">
                <span
                  className={`text-[10px] ${
                    step.done
                      ? "text-mmorpg-steel line-through"
                      : step.locked
                      ? "text-mmorpg-steel/50"
                      : isNext
                      ? "text-mmorpg-parchment font-medium"
                      : "text-mmorpg-steelLight"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {!step.done && !step.locked && (
                <Link
                  href={step.href}
                  className={`font-pixel text-[8px] px-2 py-1 rounded-sm ${
                    isNext
                      ? "bg-mmorpg-gold text-mmorpg-bg hover:bg-mmorpg-goldLight"
                      : "bg-mmorpg-border text-mmorpg-steel hover:bg-mmorpg-border/80"
                  }`}
                >
                  {isNext ? "Go →" : "Do"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
