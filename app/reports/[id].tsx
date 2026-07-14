import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius, Colors } from '../../src/constants/theme';
import { REPORT_ZONE_LABELS } from '../../src/constants/config';
import { ReportRepository } from '../../src/db/repositories/report-repository';
import { PhotoRepository } from '../../src/db/repositories/photo-repository';
import { createPreviewUri } from '../../src/services/photo-capture';
import { sendReportToWebhook } from '../../src/services/sync-queue';
import type { Report, Photo, ReportZone } from '../../src/types/report';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const r = await ReportRepository.findById(id);
      if (r) {
        const p = await PhotoRepository.findByReportId(id);
        setReport(r);
        setPhotos(p);
      }
    } catch (e) {
      console.error('Error loading report:', e);
    }
    setIsLoading(false);
  };

  const handleSign = () => {
    router.push(`/reports/${id}/signature`);
  };

  const handleSend = async () => {
    if (!report || report.status !== 'signed') {
      Alert.alert('Firma requerida', 'El cliente debe firmar antes de enviar');
      return;
    }
    setIsSending(true);
    try {
      await sendReportToWebhook(report.id);
      await ReportRepository.update(report.id, { status: 'syncing' });
      setReport((prev) => prev ? { ...prev, status: 'syncing' } : null);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Reporte no encontrado</Text>
      </View>
    );
  }

  const zoneLabels = REPORT_ZONE_LABELS;
  const zoneColors = Colors.zoneColors;

  const getPhotosByZone = (zone: ReportZone) => {
    return photos.filter((p) => p.zoneCategory === zone);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Ionicons
              name={report.mode === 'preventive' ? 'shield-checkmark' : 'construct'}
              size={24}
              color={colors.textOnPrimary}
            />
            <Text style={styles.headerTitle}>
              {report.mode === 'preventive' ? 'Reporte Preventivo' : 'Reporte Correctivo'}
            </Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {report.buildingName} · Elevador {report.elevatorId}
          </Text>
          {report.address ? <Text style={styles.headerAddress}>{report.address}</Text> : null}
          <Text style={styles.headerMeta}>
            {report.technicianName} · {formatDate(report.createdAt)}
          </Text>
        </View>

        {/* Formal Report / Notes */}
        {report.formalReport ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informe Técnico</Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportText}>{report.formalReport}</Text>
            </View>
          </View>
        ) : report.technicianNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas del Técnico</Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportText}>{report.technicianNotes}</Text>
            </View>
          </View>
        ) : null}

        {/* OCR / Error codes */}
        {report.ocrText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Códigos de Error Detectados</Text>
            <View style={[styles.reportCard, styles.ocrCard]}>
              <Text style={styles.ocrText}>{report.ocrText}</Text>
            </View>
          </View>
        ) : null}

        {/* Problem / Solution for corrective */}
        {report.mode === 'corrective' && (report.problemDescription || report.solutionApplied) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnóstico y Solución</Text>
            {report.problemDescription ? (
              <View style={styles.reportCard}>
                <Text style={styles.subLabel}>Problema</Text>
                <Text style={styles.reportText}>{report.problemDescription}</Text>
              </View>
            ) : null}
            {report.solutionApplied ? (
              <View style={styles.reportCard}>
                <Text style={styles.subLabel}>Solución</Text>
                <Text style={styles.reportText}>{report.solutionApplied}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Photos by zone (preventive) */}
        {report.mode === 'preventive' && photos.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos por Zona ({photos.length})</Text>
            {Object.entries(zoneLabels).map(([zone, label]) => {
              const zonePhotos = getPhotosByZone(zone as ReportZone);
              return (
                <View key={zone} style={styles.zoneGroup}>
                  <View style={[styles.zoneHeader, { backgroundColor: zoneColors[zone as ReportZone] + '15' }]}>
                    <View style={[styles.zoneDot, { backgroundColor: zoneColors[zone as ReportZone] }]} />
                    <Text style={styles.zoneTitle}>{label}</Text>
                    <Text style={styles.zoneCount}>{zonePhotos.length} fotos</Text>
                  </View>
                  {zonePhotos.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zonePhotos}>
                      {zonePhotos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: createPreviewUri(photo) }}
                          style={styles.zonePhoto}
                        />
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noPhotos}>Sin fotos en esta zona</Text>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Signature */}
        {report.signature ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firma del Cliente</Text>
            <View style={styles.signatureCard}>
              <Image source={{ uri: report.signature }} style={styles.signatureImage} />
              {report.signatureTimestamp ? (
                <Text style={styles.signatureMeta}>
                  Firmado: {formatDate(report.signatureTimestamp)}
                </Text>
              ) : null}
              {report.signatureGeo ? (
                <Text style={styles.signatureMeta}>
                  Ubicación: {report.signatureGeo.lat.toFixed(6)}, {report.signatureGeo.lng.toFixed(6)}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={
                report.status === 'signed' ? 'checkmark-circle'
                : report.status === 'synced' ? 'cloud-done'
                : report.status === 'failed' ? 'alert-circle'
                : 'time'
              }
              size={20}
              color={
                report.status === 'signed' || report.status === 'synced' ? colors.success
                : report.status === 'failed' ? colors.error
                : colors.warning
              }
            />
            <Text style={styles.statusText}>
              {report.status === 'draft' ? 'Borrador'
              : report.status === 'ready_for_review' ? 'Listo para revisión'
              : report.status === 'signed' ? 'Firmado'
              : report.status === 'syncing' ? 'Enviando...'
              : report.status === 'synced' ? 'Sincronizado'
              : report.status === 'failed' ? 'Error de sincronización'
              : report.status}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomBar}>
        {report.status !== 'signed' && report.status !== 'synced' && report.status !== 'syncing' ? (
          <TouchableOpacity style={styles.signButton} onPress={handleSign}>
            <Ionicons name="create" size={20} color={colors.textOnPrimary} />
            <Text style={styles.buttonText}>Firmar</Text>
          </TouchableOpacity>
        ) : null}

        {report.status === 'signed' ? (
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="cloud-upload" size={20} color={colors.textOnPrimary} />
            )}
            <Text style={styles.buttonText}>{isSending ? 'Enviando...' : 'Enviar a Webhook'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorText: { fontSize: typography.fontSizes.lg, color: colors.error, marginTop: spacing.sm },
  scrollContent: { paddingBottom: 40 },
  header: { backgroundColor: colors.primary, padding: spacing.xl, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  headerTitle: { fontSize: typography.fontSizes.xl, fontWeight: '800', color: colors.textOnPrimary },
  headerSubtitle: { fontSize: typography.fontSizes.lg, color: colors.textOnPrimary, opacity: 0.9 },
  headerAddress: { fontSize: typography.fontSizes.md, color: colors.textOnPrimary, opacity: 0.7 },
  headerMeta: { fontSize: typography.fontSizes.sm, color: colors.textOnPrimary, opacity: 0.6, marginTop: spacing.sm },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: typography.fontSizes.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  reportCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, ...shadows.small, marginBottom: spacing.sm,
  },
  reportText: { fontSize: typography.fontSizes.sm, color: colors.text, lineHeight: 20 },
  subLabel: { fontSize: typography.fontSizes.xs, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', marginBottom: spacing.xs },
  ocrCard: { backgroundColor: colors.error + '10', borderLeftWidth: 3, borderLeftColor: colors.error },
  ocrText: { fontSize: typography.fontSizes.sm, color: colors.text, fontFamily: 'monospace', lineHeight: 20 },
  zoneGroup: { marginBottom: spacing.md },
  zoneHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
  },
  zoneDot: { width: 10, height: 10, borderRadius: 5 },
  zoneTitle: { fontSize: typography.fontSizes.md, fontWeight: '600', color: colors.text, flex: 1 },
  zoneCount: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, fontWeight: '600' },
  zonePhotos: { paddingLeft: spacing.md },
  zonePhoto: { width: 100, height: 130, borderRadius: borderRadius.sm, marginRight: spacing.sm, backgroundColor: colors.surfaceVariant },
  noPhotos: { color: colors.textSecondary, fontSize: typography.fontSizes.sm, fontStyle: 'italic', paddingHorizontal: spacing.md },
  signatureCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, ...shadows.small, alignItems: 'center' },
  signatureImage: { width: '100%', height: 120, resizeMode: 'contain', borderRadius: borderRadius.sm },
  signatureMeta: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: spacing.xs },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.md, ...shadows.small },
  statusText: { fontSize: typography.fontSizes.md, fontWeight: '600', color: colors.text },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: 40, flexDirection: 'row', gap: spacing.md,
  },
  signButton: {
    flex: 1, backgroundColor: colors.success, borderRadius: borderRadius.md,
    padding: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  sendButton: {
    flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.md, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.textOnPrimary, fontSize: typography.fontSizes.md, fontWeight: '700' },
});
