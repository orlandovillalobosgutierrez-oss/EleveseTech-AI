import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../../../src/constants/theme';
import { ReportRepository } from '../../../src/db/repositories/report-repository';
import type { Report } from '../../../src/types/report';

export default function ReportsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ technicianId: string; technicianName: string }>();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = filter === 'all'
        ? await ReportRepository.findAll()
        : await ReportRepository.findByStatus(filter);
      setReports(data);
    } catch (e) {
      console.error('Error loading reports:', e);
    }
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const interval = setInterval(loadReports, 5000);
    return () => clearInterval(interval);
  }, [loadReports]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return colors.warning;
      case 'signed': return colors.success;
      case 'synced': return colors.primary;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      ai_processing: 'IA procesando',
      ready_for_review: 'Revisión',
      signed: 'Firmado',
      syncing: 'Sincronizando',
      synced: 'Sincronizado',
      failed: 'Error',
    };
    return labels[status] || status;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/reports/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name={item.mode === 'preventive' ? 'shield-checkmark' : 'construct'}
            size={20}
            color={item.mode === 'preventive' ? colors.success : colors.secondary}
          />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.buildingName}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.cardSubtitle}>
        Elevador {item.elevatorId} · {item.mode === 'preventive' ? 'Preventivo' : 'Correctivo'}
      </Text>
      <Text style={styles.cardMeta}>
        {formatDate(item.createdAt)} · {item.photos?.length || 0} fotos
        {item.technicianName ? ` · ${item.technicianName}` : ''}
      </Text>
    </TouchableOpacity>
  );

  const filters = [
    { key: 'all', label: 'Todos', icon: 'list' },
    { key: 'draft', label: 'Borradores', icon: 'document' },
    { key: 'signed', label: 'Firmados', icon: 'checkmark-circle' },
    { key: 'synced', label: 'Enviados', icon: 'cloud-done' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes</Text>
        {params.technicianName && (
          <Text style={styles.headerSubtitle}>Técnico: {params.technicianName}</Text>
        )}
      </View>

      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Ionicons
              name={f.icon as any}
              size={14}
              color={filter === f.key ? colors.textOnPrimary : colors.textSecondary}
            />
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadReports} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>Sin reportes</Text>
            <Text style={styles.emptySubtext}>Toca + para crear uno nuevo</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.textOnPrimary },
  headerSubtitle: { fontSize: typography.fontSizes.sm, color: colors.textOnPrimary, opacity: 0.8, marginTop: spacing.xs },
  filterRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface, ...shadows.small },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, backgroundColor: colors.background,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadows.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, marginRight: spacing.sm },
  cardTitle: { fontSize: typography.fontSizes.lg, fontWeight: '700', color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  badgeText: { fontSize: typography.fontSizes.xs, fontWeight: '700' },
  cardSubtitle: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginBottom: spacing.xs },
  cardMeta: { fontSize: typography.fontSizes.sm, color: colors.textSecondary },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: typography.fontSizes.lg, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { fontSize: typography.fontSizes.md, color: colors.textSecondary },
});
