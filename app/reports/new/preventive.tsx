import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList,
  Image, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, shadows, borderRadius, Colors } from '../../../src/constants/theme';
import { MAX_PHOTOS_PER_REPORT, REPORT_ZONE_LABELS } from '../../../src/constants/config';
import { capturePhoto, pickFromGallery, requestCameraPermission, createPreviewUri, type CaptureResult } from '../../../src/services/photo-capture';
import { classifyPhotosInBatch } from '../../../src/services/vision-service';
import { ReportRepository } from '../../../src/db/repositories/report-repository';
import { PhotoRepository } from '../../../src/db/repositories/photo-repository';
import type { Photo, Report, ReportZone } from '../../../src/types/report';

export default function PreventiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ technicianId: string; technicianName: string }>();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reportId] = useState(() => uuidv4());
  const [buildingInfo, setBuildingInfo] = useState({ building: '', elevatorId: '', address: '' });
  const [step, setStep] = useState<'info' | 'capture' | 'processing' | 'done'>('info');
  const scrollRef = useRef<FlatList>(null);

  const handleStartCapture = () => {
    if (!buildingInfo.building.trim() || !buildingInfo.elevatorId.trim()) {
      Alert.alert('Datos requeridos', 'Completa el edificio y el ID del elevador');
      return;
    }
    setStep('capture');
  };

  const handleCapture = async () => {
    if (photos.length >= MAX_PHOTOS_PER_REPORT) {
      Alert.alert('Límite alcanzado', `Máximo ${MAX_PHOTOS_PER_REPORT} fotos por reporte`);
      return;
    }

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara');
      return;
    }

    const result = await capturePhoto(reportId);
    if (result.success && result.photo) {
      setPhotos((prev) => {
        const updated = [...prev, result.photo];
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        return updated;
      });
    }
  };

  const handleGallery = async () => {
    if (photos.length >= MAX_PHOTOS_PER_REPORT) {
      Alert.alert('Límite alcanzado');
      return;
    }

    const result = await pickFromGallery(reportId);
    if (result.success && result.photo) {
      setPhotos((prev) => [...prev, result.photo]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleProcessWithAI = async () => {
    if (photos.length === 0) {
      Alert.alert('Sin fotos', 'Captura al menos una foto');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // 1. Guardar reporte en SQLite
      const now = new Date().toISOString();
      const report: Report = {
        id: reportId,
        technicianId: params.technicianId || 'TEC-001',
        technicianName: params.technicianName || 'Técnico',
        elevatorId: buildingInfo.elevatorId,
        buildingName: buildingInfo.building,
        address: buildingInfo.address || '',
        mode: 'preventive',
        status: 'ai_processing',
        technicianNotes: '',
        photos: [],
        createdAt: now,
        updatedAt: now,
      };

      await ReportRepository.create(report);
      await PhotoRepository.bulkCreate(photos);

      // 2. Clasificar con IA
      const photoBase64List = photos
        .filter((p) => p.blobBase64)
        .map((p) => ({ id: p.id, base64: p.blobBase64! }));

      if (photoBase64List.length > 0) {
        const result = await classifyPhotosInBatch(photoBase64List);

        // Actualizar cada foto con su clasificación
        for (const classification of result.classifications) {
          await PhotoRepository.update(classification.photoId, {
            zoneCategory: classification.zone,
          });

          setPhotos((prev) =>
            prev.map((p) =>
              p.id === classification.photoId
                ? { ...p, zoneCategory: classification.zone }
                : p
            )
          );
        }

        // Actualizar zone_classifications en el reporte
        const zoneMap: Record<ReportZone, string[]> = {
          machine_room_control: [],
          machine_room_motor: [],
          shaft_rails: [],
          floor_doors: [],
          pit: [],
        };

        for (const classification of result.classifications) {
          zoneMap[classification.zone]?.push(classification.photoId);
        }

        await ReportRepository.update(reportId, {
          zoneClassifications: zoneMap,
          status: 'ready_for_review',
        });
      }

      await ReportRepository.update(reportId, { status: 'ready_for_review' });
      setStep('done');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = () => {
    router.replace(`/reports/${reportId}`);
  };

  const getZoneLabel = (zone?: ReportZone) => {
    return zone ? REPORT_ZONE_LABELS[zone] : 'Sin clasificar';
  };

  const getZoneColor = (zone?: import('../../../src/types/report').ReportZone) => {
    return zone ? Colors.zoneColors[zone] : colors.textSecondary;
  };

  if (step === 'info') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Datos del Servicio</Text>
        </View>
        <View style={styles.form}>
          {renderInput('Edificio', buildingInfo.building, (v) => setBuildingInfo((p) => ({ ...p, building: v })))}
          {renderInput('ID del Elevador', buildingInfo.elevatorId, (v) => setBuildingInfo((p) => ({ ...p, elevatorId: v })))}
          {renderInput('Dirección', buildingInfo.address, (v) => setBuildingInfo((p) => ({ ...p, address: v })))}
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartCapture}>
            <Text style={styles.primaryButtonText}>Comenzar Captura</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingText}>IA clasificando {photos.length} fotos...</Text>
        <Text style={styles.processingSubtext}>Esto puede tomar unos segundos</Text>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        <Text style={styles.doneTitle}>¡Clasificación completada!</Text>
        <Text style={styles.doneSubtext}>{photos.length} fotos clasificadas en 5 zonas</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewReport}>
          <Text style={styles.primaryButtonText}>Ver Reporte</Text>
          <Ionicons name="document-text" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.captureHeader}>
        <Text style={styles.captureTitle}>Modo Preventivo</Text>
        <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS_PER_REPORT} fotos</Text>
      </View>

      <FlatList
        ref={scrollRef}
        data={photos}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photoStrip}
        renderItem={({ item }) => (
          <View style={styles.photoCard}>
            <Image source={{ uri: createPreviewUri(item) }} style={styles.photoThumb} />
            {item.zoneCategory && (
              <View style={[styles.zoneTag, { backgroundColor: getZoneColor(item.zoneCategory) }]}>
                <Text style={styles.zoneTagText} numberOfLines={1}>
                  {getZoneLabel(item.zoneCategory)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemovePhoto(item.id)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCapture}>
            <Ionicons name="camera-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>Toma fotos del elevador</Text>
          </View>
        }
      />

      <View style={styles.captureActions}>
        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
          <Ionicons name="camera" size={28} color={colors.textOnPrimary} />
          <Text style={styles.captureBtnText}>Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryBtn} onPress={handleGallery}>
          <Ionicons name="images" size={28} color={colors.primary} />
          <Text style={styles.galleryBtnText}>Galería</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryButton, photos.length === 0 && styles.buttonDisabled]}
          onPress={handleProcessWithAI}
          disabled={photos.length === 0 || isProcessing}
        >
          <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>
            Procesar con IA
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function renderInput(label: string, value: string, onChange: (v: string) => void) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={`Ingresa ${label.toLowerCase()}`}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xl, fontWeight: '800', color: colors.textOnPrimary },
  form: { padding: spacing.xl, gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  inputLabel: { fontSize: typography.fontSizes.sm, fontWeight: '600', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  inputText: { fontSize: typography.fontSizes.lg, color: colors.text },
  placeholder: { color: colors.textSecondary },
  primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, ...shadows.medium },
  primaryButtonText: { color: colors.textOnPrimary, fontSize: typography.fontSizes.lg, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
  captureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.primary },
  captureTitle: { fontSize: typography.fontSizes.lg, fontWeight: '800', color: colors.textOnPrimary },
  photoCount: { fontSize: typography.fontSizes.md, fontWeight: '600', color: colors.textOnPrimary, opacity: 0.9 },
  photoStrip: { paddingHorizontal: spacing.md, gap: spacing.sm, height: 180, alignItems: 'center' },
  photoCard: { position: 'relative' },
  photoThumb: { width: 120, height: 160, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant },
  zoneTag: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, borderBottomLeftRadius: borderRadius.md, borderBottomRightRadius: borderRadius.md },
  zoneTagText: { color: '#FFF', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: colors.surface, borderRadius: 12 },
  emptyCapture: { width: 200, height: 160, justifyContent: 'center', alignItems: 'center', marginHorizontal: spacing.xl },
  emptyText: { color: colors.textSecondary, marginTop: spacing.sm },
  captureActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, padding: spacing.xl },
  captureBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.full, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', ...shadows.large },
  captureBtnText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  galleryBtn: { backgroundColor: colors.surface, borderRadius: borderRadius.full, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary },
  galleryBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  bottomBar: { padding: spacing.xl, paddingBottom: 40 },
  processingText: { fontSize: typography.fontSizes.lg, fontWeight: '600', color: colors.text, marginTop: spacing.xl },
  processingSubtext: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginTop: spacing.sm },
  doneTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.xl },
  doneSubtext: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginTop: spacing.sm },
});
