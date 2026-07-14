import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../../src/constants/theme';

export default function NewReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ technicianId: string; technicianName: string }>();

  const navigateToMode = (mode: 'preventive' | 'corrective') => {
    router.push({
      pathname: `/reports/new/${mode}`,
      params: { technicianId: params.technicianId, technicianName: params.technicianName },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        <Text style={styles.headerSubtitle}>Selecciona el tipo de servicio</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.card, styles.preventiveCard]}
          onPress={() => navigateToMode('preventive')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.success} />
          </View>
          <Text style={styles.cardTitle}>Modo A — Preventivo</Text>
          <Text style={styles.cardDescription}>
            Captura hasta 25 fotos del elevador. La IA las clasifica automáticamente en 5 zonas técnicas y genera el reporte.
          </Text>
          <View style={styles.features}>
            <FeatureItem icon="camera" text="Captura masiva de fotos" />
            <FeatureItem icon="eye" text="Clasificación por IA" />
            <FeatureItem icon="flash" text="Reporte automatizado" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.correctiveCard]}
          onPress={() => navigateToMode('corrective')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="construct" size={40} color={colors.secondary} />
          </View>
          <Text style={styles.cardTitle}>Modo B — Correctivo</Text>
          <Text style={styles.cardDescription}>
            Dictado por voz, escaneo OCR de códigos de error, y redacción formal automática del informe técnico.
          </Text>
          <View style={styles.features}>
            <FeatureItem icon="mic" text="Dictado por voz" />
            <FeatureItem icon="scan" text="OCR de códigos de error" />
            <FeatureItem icon="document-text" text="Redacción formal IA" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.textOnPrimary },
  headerSubtitle: { fontSize: typography.fontSizes.md, color: colors.textOnPrimary, opacity: 0.8, marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  card: {
    flex: 1, borderRadius: borderRadius.xl, padding: spacing.xl,
    justifyContent: 'center', ...shadows.medium,
  },
  preventiveCard: { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.success },
  correctiveCard: { backgroundColor: colors.surface, borderLeftWidth: 4, borderLeftColor: colors.secondary },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: typography.fontSizes.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  cardDescription: { fontSize: typography.fontSizes.md, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  features: { gap: spacing.xs },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: typography.fontSizes.sm, color: colors.text, fontWeight: '500' },
});
