import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, shadows, borderRadius } from '../../src/constants/theme';
import { GEMINI_API_KEY, WEBHOOK_URL, API_BASE_URL } from '../../src/constants/config';

interface SettingItem {
  label: string;
  value: string;
  icon: string;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const settingsGroups: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Cuenta',
      items: [
        { label: 'Técnico', value: '—', icon: 'person', onPress: () => Alert.alert('Editar', 'En producción: editar perfil del técnico') },
        { label: 'ID de técnico', value: '—', icon: 'id-card', onPress: () => Alert.alert('Editar', 'En producción: editar ID del técnico') },
      ],
    },
    {
      title: 'API y Conexión',
      items: [
        { label: 'API Base URL', value: API_BASE_URL, icon: 'server' },
        { label: 'Gemini API Key', value: GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0, 8)}...` : 'No configurada', icon: 'key' },
        { label: 'Webhook URL', value: WEBHOOK_URL || 'No configurada', icon: 'link' },
      ],
    },
    {
      title: 'App',
      items: [
        { label: 'Versión', value: '1.0.0', icon: 'information-circle' },
        { label: 'Build', value: '1', icon: 'hammer' },
        { label: 'Entorno', value: 'Preview (APK)', icon: 'phone-portrait' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <Text style={styles.headerSubtitle}>Configuración de la aplicación</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {settingsGroups.map((group, gi) => (
          <View key={gi} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.settingRow, ii < group.items.length - 1 && styles.settingBorder]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                  activeOpacity={item.onPress ? 0.6 : 1}
                >
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  <View style={styles.settingTextCol}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingValue} numberOfLines={1}>{item.value}</Text>
                  </View>
                  {item.onPress && (
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="build" size={24} color={colors.textSecondary} />
          <Text style={styles.footerText}>EleveseTech v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2026 ELEVESE — Elevadores en Servicio</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingTop: 60, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl },
  headerTitle: { fontSize: typography.fontSizes.xxl, fontWeight: '800', color: colors.textOnPrimary },
  headerSubtitle: { fontSize: typography.fontSizes.md, color: colors.textOnPrimary, opacity: 0.8, marginTop: spacing.xs },
  scroll: { paddingBottom: 40 },
  group: { marginTop: spacing.xl, paddingHorizontal: spacing.xl },
  groupTitle: { fontSize: typography.fontSizes.sm, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  groupCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, ...shadows.small },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, minHeight: 52,
  },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingTextCol: { flex: 1 },
  settingLabel: { fontSize: typography.fontSizes.md, fontWeight: '600', color: colors.text },
  settingValue: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  footer: { alignItems: 'center', marginTop: spacing.xl * 2, paddingBottom: 40 },
  footerText: { fontSize: typography.fontSizes.sm, color: colors.textSecondary, fontWeight: '600', marginTop: spacing.sm },
  footerSubtext: { fontSize: typography.fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
});
