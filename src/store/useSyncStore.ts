import { create } from 'zustand';
import type { SyncQueueItem } from '../types/report';

interface SyncState {
  queue: SyncQueueItem[];
  pendingCount: number;
  failedCount: number;

  setQueue: (queue: SyncQueueItem[]) => void;
  addToQueue: (item: SyncQueueItem) => void;
  updateQueueItem: (id: string, updates: Partial<SyncQueueItem>) => void;
  removeFromQueue: (id: string) => void;
  recalculateCounts: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  queue: [],
  pendingCount: 0,
  failedCount: 0,

  setQueue: (queue) => {
    set({
      queue,
      pendingCount: queue.filter((q) => q.status === 'pending').length,
      failedCount: queue.filter((q) => q.status === 'failed').length,
    });
  },
  addToQueue: (item) =>
    set((s) => {
      const queue = [...s.queue, item];
      return {
        queue,
        pendingCount: queue.filter((q) => q.status === 'pending').length,
        failedCount: queue.filter((q) => q.status === 'failed').length,
      };
    }),
  updateQueueItem: (id, updates) =>
    set((s) => {
      const queue = s.queue.map((q) => (q.id === id ? { ...q, ...updates } : q));
      return {
        queue,
        pendingCount: queue.filter((q) => q.status === 'pending').length,
        failedCount: queue.filter((q) => q.status === 'failed').length,
      };
    }),
  removeFromQueue: (id) =>
    set((s) => {
      const queue = s.queue.filter((q) => q.id !== id);
      return {
        queue,
        pendingCount: queue.filter((q) => q.status === 'pending').length,
        failedCount: queue.filter((q) => q.status === 'failed').length,
      };
    }),
  recalculateCounts: () => {
    const { queue } = get();
    set({
      pendingCount: queue.filter((q) => q.status === 'pending').length,
      failedCount: queue.filter((q) => q.status === 'failed').length,
    });
  },
}));
