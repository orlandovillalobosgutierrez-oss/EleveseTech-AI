import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SignatureCanvas from 'react-native-signature-canvas';
import * as Location from 'expo-location';
import { colors, typography, spacing, shadows, borderRadius } from '../../../src/constants/theme';
import { ReportRepository } from '../../../src/db/repositories/report-repository';
import { sendReportToWebhook } from '../../../src/services/sync-queue';

export default function SignatureScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const signatureRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleConfirm = () => {
    setHasSignature(true);
  };

  const handleSave = async () => {
    if (!hasSignature) {
      Alert.alert('Firma requerida', 'El cliente debe firmar en el canvas');
      return;
    }

    setIsSaving(true);

    try {
      // Obtener geolocalización
      let geo: { lat: number; lng: number } | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          geo = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
        }
      } catch {}

      // Obtener firma como base64
      const signatureBase64 = await signatureRef.current?.readSignature();

      if (signatureBase64 && id) {
        await ReportRepository.update(id, {
          signature: signatureBase64,
          signatureGeo: geo,
          signatureTimestamp: new Date().toISOString(),
          status: 'signed',
        });

        Alert.alert(
          'Reporte firmado',
          '¿Deseas enviar el reporte ahora?',
          [
            {
              text: 'Después',
              style: 'cancel',
              onPress: () => router.back(),
            },
            {
              text: 'Enviar ahora',
              onPress: async () => {
                try {
                  await sendReportToWebhook(id);
                  await ReportRepository.update(id, { status: 'syncing' });
                } catch (e: any) {
                  Alert.alert('Error al enviar', e.message);
                }
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la firma');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir firma',
      'El reporte se guardará sin firma. Podrás firmarlo después.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Omitir',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (isSaving) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.savingText}>Guardando firma...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Firma del Cliente</Text>
        <Text style={styles.headerSubtitle}>
          El cliente debe firmar en el área designada
        </Text>
      </View>

      <View style={styles.signatureContainer}>
        <Text style={styles.instructionText}>
          {hasSignature ? '✓ Firma capturada' : 'Firme dentro del recuadro'}
        </Text>
        <View style={styles.canvasWrapper}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleConfirm}
            onEmpty={() => setHasSignature(false)}
            descriptionText=""
            clearText=""
            confirmText=""
            webStyle={`
              .m-signature-pad {
                box-shadow: none;
                border: none;
                width: 100%;
                height: 100%;
              }
              .m-signature-pad--body {
                border: none;
                width: 100%;
                height: 100%;
              }
              .m-signature-pad--body canvas {
                width: 100%;
                height: 100%;
                border-radius: 12px;
              }
              .m-signature-pad--footer {
                display: none;
              }
            `}
            penColor={colors.primary}
            backgroundColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Ionicons name="refresh" size={20} color={colors.textSecondary} />
          <Text style={styles.clearText}>Limpiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, !hasSignature && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasSignature}
        >
          <Ionicons name="checkmark" size={20} color={colors.textOnPrimary} />
          <Text style={styles.saveText}>Guardar Firma</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Omitir por ahora</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  savingText: { marginTop: spacing.md, fontSize: typography.fontSizes.md, color: colors.textSecondary },
  header: { backgroundColor: colors.success, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xl, fontWeight: '800', color: colors.textOnPrimary },
  headerSubtitle: { fontSize: typography.fontSizes.md, color: colors.textOnPrimary, opacity: 0.8, marginTop: spacing.xs },
  signatureContainer: { flex: 1, padding: spacing.xl },
  instructionText: {
    fontSize: typography.fontSizes.md, fontWeight: '600', color: colors.text,
    textAlign: 'center', marginBottom: spacing.lg,
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.medium,
  },
  actions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
  },
  clearText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: spacing.sm, padding: spacing.md, backgroundColor: colors.success,
    borderRadius: borderRadius.md, ...shadows.small,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: typography.fontSizes.md },
  skipBtn: { alignItems: 'center', paddingBottom: 40 },
  skipText: { color: colors.textSecondary, fontSize: typography.fontSizes.md },
});
