import { create } from 'zustand';

type ConnectionType = 'wifi' | 'cellular' | 'none' | 'unknown';

interface NetworkState {
  isConnected: boolean;
  connectionType: ConnectionType;
  isSyncing: boolean;
  lastSyncAt: string | null;

  setConnected: (connected: boolean, type: ConnectionType) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (timestamp: string) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: false,
  connectionType: 'unknown',
  isSyncing: false,
  lastSyncAt: null,

  setConnected: (isConnected, connectionType) => set({ isConnected, connectionType }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
}));
