import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [technicianId, setTechnicianId] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!technicianId.trim() || !technicianName.trim() || !pin.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (pin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos');
      return;
    }

    setIsLoading(true);
    // Simulación de autenticación offline
    await new Promise((r) => setTimeout(r, 800));

    // Guardar datos de sesión (en producción usar SecureStore)
    // Por ahora pasamos como params
    router.replace({
      pathname: '/(tabs)/reports',
      params: { technicianId: technicianId.trim(), technicianName: technicianName.trim() },
    });
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="build" size={48} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.appName}>EleveseTech</Text>
          <Text style={styles.subtitle}>Reportes Técnicos Inteligentes</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>ID de Técnico</Text>
          <TextInput
            style={styles.input}
            value={technicianId}
            onChangeText={setTechnicianId}
            placeholder="Ej: TEC-001"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            returnKeyType="next"
          />

          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            value={technicianName}
            onChangeText={setTechnicianName}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />

          <Text style={styles.label}>PIN de acceso</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="••••"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in" size={20} color={colors.textOnPrimary} />
            <Text style={styles.buttonText}>
              {isLoading ? 'Verificando...' : 'Ingresar'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>v1.0.0 — ELEVESE</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.medium,
    marginBottom: spacing.lg,
  },
  appName: { fontSize: typography.fontSizes.xxxl, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  subtitle: { fontSize: typography.fontSizes.md, color: colors.textSecondary, marginTop: spacing.xs },
  form: { width: '100%' },
  label: { fontSize: typography.fontSizes.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.fontSizes.lg,
    color: colors.text, ...shadows.small,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    padding: spacing.lg, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl,
    ...shadows.medium,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textOnPrimary, fontSize: typography.fontSizes.lg, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.textSecondary, fontSize: typography.fontSizes.xs, marginTop: spacing.xxl },
});
