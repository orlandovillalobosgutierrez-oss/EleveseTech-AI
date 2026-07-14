# EleveseTech-AI — Plan de Implementación

> **Para Hermes:** Usar subagent-driven-development para implementar tarea por tarea.

**Objetivo:** App móvil React Native + Expo para técnicos ELEVESE que automatiza reportes de mantenimiento de elevadores con IA multimodal, operación offline-first y sincronización cloud.

**Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, expo-router, expo-sqlite, Zustand
**Arquitectura:** Feature-based modular, offline-first con cola de sync, IA via API REST

---

## FASE 0 — FUNDACIÓN (Tasks 0.1-0.5)

### Task 0.1: Instalar dependencias base y configurar expo-router
**Objetivo:** Instalar todas las dependencias del proyecto y migrar a expo-router.

**Archivos:**
- Modificar: `package.json` (agregar deps)
- Modificar: `app.json` (agregar scheme, plugins)
- Crear: `app/_layout.tsx` (root layout)
- Crear: `app/index.tsx` (entry redirect)
- Eliminar: `App.tsx` (reemplazado por expo-router)
- Modificar: `index.ts` (mantener entry point)

**Deps a instalar:**
```
expo-router expo-sqlite expo-image-picker expo-image-manipulator
expo-camera expo-location expo-file-system expo-background-fetch
react-native-signature-canvas zustand date-fns uuid expo-constants
expo-linking expo-system-ui @react-native-async-storage/async-storage
react-native-safe-area-context react-native-screens
react-native-gesture-handler react-native-reanimated
@expo/vector-icons
```

**Verificación:** `npx expo start --web` debe mostrar pantalla de bienvenida.

---

### Task 0.2: Definir tipos TypeScript globales
**Objetivo:** Crear todos los tipos/interfaces del dominio de la app.

**Archivos:**
- Crear: `src/types/report.ts` — Report, Photo, ReportZone, ReportStatus
- Crear: `src/types/sync.ts` — SyncQueueItem, SyncStatus
- Crear: `src/types/api.ts` — VisionApiRequest, VisionApiResponse, LLMRequest

---

### Task 0.3: Configurar tema y constantes
**Objetivo:** Definir colores corporativos ELEVESE, tipografía, y constantes de la app.

**Archivos:**
- Crear: `src/constants/theme.ts` — colores, espaciado, sombras
- Crear: `src/constants/config.ts` — API endpoints, timeouts, límites

---

### Task 0.4: Crear store global con Zustand
**Objetivo:** Estado global para reportes, fotos, y estado de red.

**Archivos:**
- Crear: `src/store/useReportStore.ts`
- Crear: `src/store/useNetworkStore.ts`
- Crear: `src/store/useSyncStore.ts`

---

### Task 0.5: Inicializar base de datos SQLite
**Objetivo:** Schema completo: tablas reports, photos, sync_queue, settings.

**Archivos:**
- Crear: `src/db/database.ts` — init, migraciones, helpers
- Crear: `src/db/migrations.ts` — schema SQL

---

## FASE 1 — SERVICIOS CORE (Tasks 1.1-1.6)

### Task 1.1: Servicio de captura y compresión de fotos
**Objetivo:** Capturar fotos con cámara, comprimir a JPEG Q=50, max 1920px, guardar BLOB en SQLite.

**Archivos:**
- Crear: `src/services/photo-capture.ts`

---

### Task 1.2: Repositorio de reportes (CRUD SQLite)
**Objetivo:** Capa de acceso a datos para reportes.

**Archivos:**
- Crear: `src/db/repositories/report-repository.ts`

---

### Task 1.3: Repositorio de fotos (SQLite BLOBs)
**Objetivo:** CRUD de fotos con BLOBs comprimidos.

**Archivos:**
- Crear: `src/db/repositories/photo-repository.ts`

---

### Task 1.4: Servicio de API — Cliente base
**Objetivo:** Cliente HTTP con timeout, reintentos, y manejo de errores para llamadas a APIs de IA.

**Archivos:**
- Crear: `src/services/api-client.ts`

---

### Task 1.5: Servicio de IA — Visión (Gemini Flash)
**Objetivo:** Cliente para clasificar fotos en 5 zonas (Cuarto de Máquinas/Control, Cuarto de Máquinas/Motor, Cubo/Rieles, Puertas, Fosa/Pozo).

**Archivos:**
- Crear: `src/services/vision-service.ts`

---

### Task 1.6: Servicio de IA — LLM (Redacción formal)
**Objetivo:** Transformar notas informales del técnico en reporte ejecutivo formal.

**Archivos:**
- Crear: `src/services/llm-service.ts`

---

## FASE 2 — PANTALLAS (Tasks 2.1-2.8)

### Task 2.1: Pantalla de Login
**Objetivo:** Login simple con ID de técnico + PIN. Offline-first.

**Archivos:**
- Crear: `app/(auth)/_layout.tsx`
- Crear: `app/(auth)/login.tsx`

---

### Task 2.2: Layout principal con tabs
**Objetivo:** Navegación por tabs: Reportes, Nuevo Reporte, Sincronización, Ajustes.

**Archivos:**
- Crear: `app/(tabs)/_layout.tsx`

---

### Task 2.3: Pantalla de lista de reportes
**Objetivo:** Lista de reportes guardados con filtro por estado.

**Archivos:**
- Crear: `app/(tabs)/reports/index.tsx`

---

### Task 2.4: Pantalla de selección de modo (Preventivo/Correctivo)
**Objetivo:** Elegir entre Modo A (preventivo) y Modo B (correctivo).

**Archivos:**
- Crear: `app/(tabs)/new-report.tsx`

---

### Task 2.5: Modo A — Captura masiva de fotos
**Objetivo:** Flujo de captura rápida: hasta 25 fotos secuenciales con preview y re-take.

**Archivos:**
- Crear: `app/reports/new/preventive.tsx`
- Crear: `src/components/PhotoGrid.tsx`
- Crear: `src/components/PhotoCard.tsx`

---

### Task 2.6: Modo B — Dictado + OCR + Notas
**Objetivo:** Pantalla con dictado por voz, escaneo OCR, y campo de notas técnicas.

**Archivos:**
- Crear: `app/reports/new/corrective.tsx`
- Crear: `src/components/DictationButton.tsx`
- Crear: `src/components/OCRScanner.tsx`

---

### Task 2.7: Pantalla de preview del reporte
**Objetivo:** Vista previa maquetada del reporte con fotos clasificadas por zona.

**Archivos:**
- Crear: `app/reports/[id].tsx`

---

### Task 2.8: Pantalla de firma digital
**Objetivo:** Canvas táctil para firma del cliente con geolocalización y timestamp.

**Archivos:**
- Crear: `app/reports/[id]/signature.tsx`
- Crear: `src/components/SignatureCanvas.tsx`

---

## FASE 3 — SINCRONIZACIÓN (Tasks 3.1-3.3)

### Task 3.1: Cola de sincronización offline
**Objetivo:** Sistema de cola para subir reportes cuando haya conexión.

**Archivos:**
- Crear: `src/services/sync-queue.ts`

---

### Task 3.2: Servicio de webhook (Make/NubeHost)
**Objetivo:** Enviar reporte completo a webhook para generación de PDF y envío por email.

**Archivos:**
- Crear: `src/services/webhook-service.ts`

---

### Task 3.3: Monitoreo de red y background sync
**Objetivo:** Detectar cambios de conectividad y disparar sincronización.

**Archivos:**
- Crear: `src/services/network-monitor.ts`

---

## FASE 4 — INTEGRACIÓN Y BUILD (Tasks 4.1-4.2)

### Task 4.1: Configurar EAS Build para APK
**Objetivo:** Configurar eas.json para build de Android preview.

**Archivos:**
- Crear: `eas.json`

---

### Task 4.2: Integración final y pruebas de compilación
**Objetivo:** Verificar que el proyecto compila, corregir errores, commit final.

**Verificación:** `npx expo export --platform android` sin errores.
