import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from '../src/db/database';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reports/new/preventive"
          options={{ headerShown: true, title: 'Reporte Preventivo' }}
        />
        <Stack.Screen
          name="reports/new/corrective"
          options={{ headerShown: true, title: 'Reporte Correctivo' }}
        />
        <Stack.Screen
          name="reports/[id]/signature"
          options={{ headerShown: true, title: 'Firma Digital' }}
        />
      </Stack>
    </>
  );
}
