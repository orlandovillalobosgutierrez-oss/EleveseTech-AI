import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, shadows, borderRadius } from '../../../src/constants/theme';
import { formalizeReport } from '../../../src/services/llm-service';
import { ReportRepository } from '../../../src/db/repositories/report-repository';
import type { Report } from '../../../src/types/report';

export default function CorrectiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ technicianId: string; technicianName: string }>();
  const [reportId] = useState(() => uuidv4());
  const [step, setStep] = useState<'info' | 'notes' | 'processing' | 'done'>('info');
  const [buildingInfo, setBuildingInfo] = useState({ building: '', elevatorId: '', address: '' });

  // Modo correctivo fields
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionApplied, setSolutionApplied] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formalReport, setFormalReport] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleStartNotes = () => {
    if (!buildingInfo.building.trim() || !buildingInfo.elevatorId.trim()) {
      Alert.alert('Datos requeridos', 'Completa el edificio y el ID del elevador');
      return;
    }
    setStep('notes');
  };

  const handleDictate = () => {
    // En producción, usar expo-speech-recognition o Whisper API
    Alert.alert(
      'Dictado por voz',
      'En el dispositivo real, esto activará el reconocimiento de voz. Por ahora, escribe tus notas manualmente.',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Simular dictado',
          onPress: () => {
            const simulatedText =
              'Revisé el variador de frecuencia, encontré polvo acumulado en los contactores. ' +
              'Limpié el tablero de control, verifiqué parámetros y ajusté la velocidad de puerta. ' +
              'El elevador queda operando correctamente.';
            setTechnicianNotes((prev) => prev + (prev ? '\n' : '') + simulatedText);
          },
        },
      ]
    );
  };

  const handleOCRScan = () => {
    // En producción, usar react-native-vision-camera + MLKit
    Alert.alert(
      'Escáner OCR',
      'En el dispositivo real, esto abrirá la cámara para leer códigos de error en pantallas y LEDs.',
      [
        { text: 'OK', style: 'default' },
        {
          text: 'Simular lectura',
          onPress: () => {
            const simulatedCode = 'Err 42 — Sobrevelocidad detectada en puerta de piso 3. ' +
              'Código E7 — Fallo en sensor de puerta.';
            setOcrText((prev) => prev + (prev ? '\n' : '') + simulatedCode);
          },
        },
      ]
    );
  };

  const handleGenerateFormal = async () => {
    if (!technicianNotes.trim() && !problemDescription.trim()) {
      Alert.alert('Sin datos', 'Ingresa al menos notas del técnico o descripción del problema');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Guardar reporte borrador
      const now = new Date().toISOString();
      const report: Report = {
        id: reportId,
        technicianId: params.technicianId || 'TEC-001',
        technicianName: params.technicianName || 'Técnico',
        elevatorId: buildingInfo.elevatorId,
        buildingName: buildingInfo.building,
        address: buildingInfo.address || '',
        mode: 'corrective',
        status: 'ai_processing',
        technicianNotes,
        problemDescription,
        solutionApplied,
        ocrText,
        photos: [],
        createdAt: now,
        updatedAt: now,
      };

      await ReportRepository.create(report);

      // Llamar LLM para formalizar
      const formal = await formalizeReport({
        technicianNotes,
        problemDescription: problemDescription || undefined,
        solutionApplied: solutionApplied || undefined,
        ocrText: ocrText || undefined,
        buildingName: buildingInfo.building,
        elevatorId: buildingInfo.elevatorId,
        technicianName: params.technicianName || 'Técnico',
        reportMode: 'corrective',
      });

      setFormalReport(formal);

      await ReportRepository.update(reportId, {
        formalReport: formal,
        status: 'ready_for_review',
      });

      setStep('done');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al generar reporte');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = () => {
    router.replace(`/reports/${reportId}`);
  };

  if (step === 'processing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingText}>IA generando informe formal...</Text>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        <Text style={styles.doneTitle}>¡Informe generado!</Text>
        <Text style={styles.doneSubtext}>La IA ha redactado el informe formal</Text>
        <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
          <Text style={styles.previewText}>{formalReport}</Text>
        </ScrollView>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewReport}>
          <Text style={styles.primaryButtonText}>Ver Reporte Completo</Text>
          <Ionicons name="document-text" size={20} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartNotes}>
            <Text style={styles.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Modo Correctivo</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={[styles.toolBtn, isRecording && styles.toolBtnActive]}
            onPress={handleDictate}
          >
            <Ionicons name="mic" size={24} color={isRecording ? colors.error : colors.primary} />
            <Text style={styles.toolBtnText}>Dictar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolBtn} onPress={handleOCRScan}>
            <Ionicons name="scan" size={24} color={colors.primary} />
            <Text style={styles.toolBtnText}>Escanear</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notas del Técnico</Text>
        <TextInput
          style={styles.textArea}
          value={technicianNotes}
          onChangeText={setTechnicianNotes}
          placeholder="Dicta o escribe tus notas técnicas informales..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Descripción del Problema</Text>
        <TextInput
          style={styles.textArea}
          value={problemDescription}
          onChangeText={setProblemDescription}
          placeholder="Describe el problema encontrado..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Solución Aplicada</Text>
        <TextInput
          style={styles.textArea}
          value={solutionApplied}
          onChangeText={setSolutionApplied}
          placeholder="¿Qué hiciste para resolverlo?"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Códigos de Error (OCR)</Text>
        <TextInput
          style={styles.textArea}
          value={ocrText}
          onChangeText={setOcrText}
          placeholder="Escanea o escribe los códigos de error..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.primaryButton, styles.generateBtn]}
          onPress={handleGenerateFormal}
          disabled={isProcessing}
        >
          <Ionicons name="sparkles" size={20} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>Generar Informe Formal</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function renderInput(label: string, value: string, onChange: (v: string) => void) {
  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={`Ingresa ${label.toLowerCase()}`}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="words"
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { fontSize: typography.fontSizes.sm, fontWeight: '600', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md },
  text: { fontSize: typography.fontSizes.lg, color: colors.text },
  placeholder: { color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { backgroundColor: colors.secondary, paddingTop: 60, paddingBottom: spacing.lg, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xl, fontWeight: '800', color: colors.textOnPrimary },
  form: { padding: spacing.xl, gap: spacing.md },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.md },
  toolbar: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.md },
  toolBtn: {
    alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceVariant, padding: spacing.md,
    borderRadius: borderRadius.lg, minWidth: 100, ...shadows.small,
  },
  toolBtnActive: { backgroundColor: colors.error + '15' },
  toolBtnText: { fontSize: typography.fontSizes.sm, fontWeight: '600', color: colors.primary },
  label: { fontSize: typography.fontSizes.sm, fontWeight: '600', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.fontSizes.md,
    color: colors.text, minHeight: 100,
  },
  primaryButton: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.lg, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: spacing.sm, ...shadows.medium,
  },
  primaryButtonText: { color: colors.textOnPrimary, fontSize: typography.fontSizes.lg, fontWeight: '700' },
  generateBtn: { marginTop: spacing.md, marginBottom: spacing.xxl },
  processingText: { fontSize: typography.fontSizes.lg, fontWeight: '600', color: colors.text, marginTop: spacing.xl },
  doneTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.text, marginTop: spacing.xl },
  doneSubtext: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginTop: spacing.sm },
  previewScroll: { maxHeight: 300, width: '100%', marginTop: spacing.lg },
  previewContent: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.md, ...shadows.small },
  previewText: { fontSize: typography.fontSizes.sm, color: colors.text, lineHeight: 20 },
});
