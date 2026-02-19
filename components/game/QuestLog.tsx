"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Scroll, CheckCircle, Circle, Clock } from "lucide-react";

export type QuestStatus = "new" | "inprogress" | "done";

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward?: string;
  status: QuestStatus;
  categoryFilter?: string;
}

interface QuestLogProps {
  quests: Quest[];
  onQuestClick?: (quest: Quest) => void;
  onStatusChange?: (id: string, status: QuestStatus) => void;
}

const statusConfig: Record<QuestStatus, { label: string; icon: typeof Circle; color: string }> = {
  new: { label: "New", icon: Circle, color: "text-mmorpg-accentBlue" },
  inprogress: { label: "Active", icon: Clock, color: "text-mmorpg-warning" },
  done: { label: "Done", icon: CheckCircle, color: "text-mmorpg-success" },
};

export function QuestLog({ quests, onQuestClick, onStatusChange }: QuestLogProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (quest: Quest) => {
    setSelected(quest.id === selected ? null : quest.id);
    onQuestClick?.(quest);
  };

  const cycleStatus = (e: React.MouseEvent, quest: Quest) => {
    e.stopPropagation();
    const next: Record<QuestStatus, QuestStatus> = {
      new: "inprogress",
      inprogress: "done",
      done: "new",
    };
    onStatusChange?.(quest.id, next[quest.status]);
  };

  if (quests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Scroll className="text-mmorpg-border mb-2" size={24} />
        <p className="text-[10px] font-pixel text-mmorpg-steel">No quests available</p>
        <p className="text-xs text-mmorpg-steel/60 mt-1">Generate insights to see recommendations</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {quests.map((quest) => {
        const config = statusConfig[quest.status];
        const Icon = config.icon;
        const isSelected = selected === quest.id;

        return (
          <div
            key={quest.id}
            onClick={() => handleClick(quest)}
            className={cn(
              "quest-entry rounded-sm",
              `quest-${quest.status}`,
              isSelected && "bg-mmorpg-panelLight"
            )}
          >
            <div className="flex items-start gap-2">
              <button
                onClick={(e) => cycleStatus(e, quest)}
                className="mt-0.5 shrink-0"
                title="Click to change status"
              >
                <Icon size={12} className={config.color} />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-pixel text-mmorpg-parchment leading-tight truncate">
                  {quest.title}
                </p>
                {isSelected && (
                  <p className="text-[10px] text-mmorpg-steel mt-1 leading-relaxed">
                    {quest.description}
                  </p>
                )}
                {quest.reward && (
                  <p className="text-[9px] text-mmorpg-gold mt-0.5 font-pixel">
                    ⚔ {quest.reward}
                  </p>
                )}
              </div>

              <span
                className={cn(
                  "text-[8px] font-pixel uppercase shrink-0",
                  config.color
                )}
              >
                {config.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
