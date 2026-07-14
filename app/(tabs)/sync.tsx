import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../../src/constants/theme';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useNetworkStore } from '../../src/store/useNetworkStore';
import { processSyncQueue } from '../../src/services/sync-queue';
import { startNetworkMonitoring, stopNetworkMonitoring, checkConnectivity } from '../../src/services/network-monitor';

export default function SyncScreen() {
  const { queue, pendingCount, failedCount } = useSyncStore();
  const { isConnected, connectionType, isSyncing, lastSyncAt } = useNetworkStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    startNetworkMonitoring();
    return () => stopNetworkMonitoring();
  }, []);

  const handleSyncNow = async () => {
    setChecking(true);
    try {
      await processSyncQueue();
    } finally {
      setChecking(false);
    }
  };

  const connectionLabel = (type: string) => {
    switch (type) {
      case 'wifi': return 'Wi-Fi';
      case 'cellular': return 'Datos móviles';
      case 'none': return 'Sin conexión';
      default: return 'Desconocido';
    }
  };

  const connectionIcon = (type: string) => {
    switch (type) {
      case 'wifi': return 'wifi';
      case 'cellular': return 'cellular';
      case 'none': return 'cloud-offline';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sincronización</Text>
      </View>

      {/* Connection status */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Ionicons name={connectionIcon(connectionType) as any} size={24} color={isConnected ? colors.success : colors.error} />
          <View style={styles.cardTextCol}>
            <Text style={styles.cardTitle}>
              {isConnected ? 'Conectado' : 'Sin conexión'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {connectionLabel(connectionType)}
              {isSyncing ? ' · Sincronizando...' : ''}
            </Text>
          </View>
          <View style={[styles.dot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
        </View>
      </View>

      {/* Queue stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.statNumber}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
          <Text style={styles.statNumber}>{failedCount}</Text>
          <Text style={styles.statLabel}>Fallidos</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
          <Text style={styles.statNumber}>{queue.filter((q) => q.status === 'done').length}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      {/* Queue items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cola de sincronización</Text>
        {queue.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-done" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No hay elementos en cola</Text>
          </View>
        ) : (
          queue.slice(0, 10).map((item) => (
            <View key={item.id} style={styles.queueItem}>
              <Ionicons
                name={item.type === 'upload_photos' ? 'image' : 'document-text'}
                size={18}
                color={item.status === 'done' ? colors.success : item.status === 'failed' ? colors.error : colors.warning}
              />
              <Text style={styles.queueText} numberOfLines={1}>
                {item.type === 'upload_photos' ? 'Subir fotos' : 'Webhook reporte'}
              </Text>
              <Text style={styles.queueStatus}>
                {item.status === 'done' ? '✔' : item.status === 'failed' ? '✘' : item.status === 'in_progress' ? '...' : '⏳'}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.syncButton, (checking || !isConnected) && styles.buttonDisabled]}
        onPress={handleSyncNow}
        disabled={checking || !isConnected}
        activeOpacity={0.8}
      >
        {checking || isSyncing ? (
          <ActivityIndicator size="small" color={colors.textOnPrimary} />
        ) : (
          <Ionicons name="sync" size={20} color={colors.textOnPrimary} />
        )}
        <Text style={styles.syncButtonText}>
          {checking || isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </Text>
      </TouchableOpacity>

      {lastSyncAt && (
        <Text style={styles.lastSync}>
          Última sincronización: {new Date(lastSyncAt).toLocaleString('es-MX')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.textOnPrimary },
  card: {
    backgroundColor: colors.surface, margin: spacing.lg, borderRadius: borderRadius.lg,
    padding: spacing.lg, ...shadows.small,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTextCol: { flex: 1 },
  cardTitle: { fontSize: typography.fontSizes.lg, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statsRow: { flexDirection: 'row', marginHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, ...shadows.small, borderLeftWidth: 3,
  },
  statNumber: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.fontSizes.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginTop: spacing.sm },
  queueItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.surface, borderRadius: borderRadius.md,
    marginBottom: spacing.xs, ...shadows.small,
  },
  queueText: { flex: 1, fontSize: typography.fontSizes.sm, color: colors.text, fontWeight: '500' },
  queueStatus: { fontSize: typography.fontSizes.lg },
  syncButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.lg,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, ...shadows.medium,
  },
  syncButtonText: { color: colors.textOnPrimary, fontSize: typography.fontSizes.lg, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
  lastSync: { textAlign: 'center', fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.md },
});
