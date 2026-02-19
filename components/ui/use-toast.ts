"use client";

import { useState, useEffect } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Simple in-memory toast store using module-level state
let toastList: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function notifyAll() {
  const copy = [...toastList];
  listeners.forEach((l) => l(copy));
}

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastList = [...toastList, { ...t, id }];
  notifyAll();

  setTimeout(() => {
    toastList = toastList.filter((x) => x.id !== id);
    notifyAll();
  }, 4000);

  return id;
}

export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toastList);

  useEffect(() => {
    const handler = (t: Toast[]) => setLocalToasts(t);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const dismiss = (id: string) => {
    toastList = toastList.filter((t) => t.id !== id);
    notifyAll();
  };

  return { toasts: localToasts, dismiss };
}
