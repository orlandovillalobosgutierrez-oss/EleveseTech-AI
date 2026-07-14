import * as Network from 'expo-network';
import { useNetworkStore } from '../store/useNetworkStore';
import { processSyncQueue } from './sync-queue';

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startNetworkMonitoring(): void {
  // Check connectivity every 15 seconds
  checkAndNotify();
  intervalId = setInterval(checkAndNotify, 15000);
}

export function stopNetworkMonitoring(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

async function checkAndNotify(): Promise<void> {
  const store = useNetworkStore.getState();

  try {
    const state = await Network.getNetworkStateAsync();
    const isConnected = state.isConnected ?? false;
    const connectionType =
      state.type === Network.NetworkStateType.WIFI
        ? 'wifi'
        : state.type === Network.NetworkStateType.CELLULAR
          ? 'cellular'
          : state.type === Network.NetworkStateType.NONE
            ? 'none'
            : 'unknown';

    const wasDisconnected = !store.isConnected;
    store.setConnected(isConnected, connectionType);

    // Trigger sync when we regain connectivity
    if (isConnected && (wasDisconnected || !store.isSyncing)) {
      processSyncQueue();
    }
  } catch {
    store.setConnected(false, 'unknown');
  }
}

export async function checkConnectivity(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected ?? false;
  } catch {
    return false;
  }
}
