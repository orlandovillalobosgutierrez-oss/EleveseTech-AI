import { apiRequest } from './api-client';
import { GEMINI_VISION_ENDPOINT, GEMINI_API_KEY } from '../constants/config';

interface LLMFormalizeInput {
  technicianNotes: string;
  problemDescription?: string;
  solutionApplied?: string;
  ocrText?: string;
  buildingName: string;
  elevatorId: string;
  technicianName: string;
  reportMode: 'preventive' | 'corrective';
}

export async function formalizeReport(input: LLMFormalizeInput): Promise<string> {
  if (!GEMINI_API_KEY) {
    return generateFallbackReport(input);
  }

  const modeLabel = input.reportMode === 'preventive' ? 'PREVENTIVO' : 'CORRECTIVO';

  const prompt = `Eres un ingeniero de mantenimiento de elevadores redactando un informe técnico formal para el cliente.

DATOS DEL SERVICIO:
- Tipo: Mantenimiento ${modeLabel}
- Edificio: ${input.buildingName}
- Elevador ID: ${input.elevatorId}
- Técnico: ${input.technicianName}

NOTAS DEL TÉCNICO (texto informal, posiblemente dictado):
"""
${input.technicianNotes}
"""${input.problemDescription ? `\n\nPROBLEMA REPORTADO:\n"""\n${input.problemDescription}\n"""` : ''}${input.solutionApplied ? `\n\nSOLUCIÓN APLICADA:\n"""\n${input.solutionApplied}\n"""` : ''}${input.ocrText ? `\n\nCÓDIGOS DE ERROR LEÍDOS:\n"""\n${input.ocrText}\n"""` : ''}

INSTRUCCIONES:
Redacta un INFORME TÉCNICO EJECUTIVO formal con la siguiente estructura:

---
**INFORME DE SERVICIO ${modeLabel}**

**Edificio:** ${input.buildingName}
**Equipo:** Elevador ${input.elevatorId}
**Técnico responsable:** ${input.technicianName}

**1. DIAGNÓSTICO TÉCNICO**
[Interpreta las notas del técnico y descríbelas de forma profesional, usando terminología técnica de elevación]

**2. TRABAJOS REALIZADOS**
[Lista las acciones del técnico usando viñetas con lenguaje formal de ingeniería. Transforma frases como "limpié polvo" en "Se realizó limpieza de componentes electrónicos con remoción de polvo acumulado"]

**3. OBSERVACIONES Y RECOMENDACIONES**
[Si hay códigos de error OCR, menciónalos formalmente. Agrega recomendaciones técnicas si aplica]

**4. CONCLUSIÓN**
[Resumen ejecutivo en 2-3 líneas del estado general del equipo]
---

Reglas de redacción:
- Usa voz pasiva formal: "Se realizó", "Se verificó", "Se detectó"
- NUNCA copies las notas textuales del técnico — transfórmalas siempre
- Si las notas dicen "todo bien" o "sin novedad", describe que los parámetros están dentro de norma
- Incluye terminología técnica: "holgura", "torque", "aislamiento", "continuidad", "parámetros nominales"
- Sé conciso pero profesional
- NO inventes fallas que no están en las notas`;

  const url = `${GEMINI_VISION_ENDPOINT}?key=${GEMINI_API_KEY}`;

  try {
    const response = await apiRequest<any>(url, {
      method: 'POST',
      body: {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      },
    });

    if (response.error || !response.data) {
      return generateFallbackReport(input);
    }

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || generateFallbackReport(input);
  } catch {
    return generateFallbackReport(input);
  }
}

function generateFallbackReport(input: LLMFormalizeInput): string {
  const modeLabel = input.reportMode === 'preventive' ? 'PREVENTIVO' : 'CORRECTIVO';

  return `---
**INFORME DE SERVICIO ${modeLabel}**

**Edificio:** ${input.buildingName}
**Equipo:** Elevador ${input.elevatorId}
**Técnico responsable:** ${input.technicianName}

**1. DIAGNÓSTICO TÉCNICO**
Se realizó inspección de rutina al equipo, verificando parámetros operativos y condiciones generales de funcionamiento.

**2. TRABAJOS REALIZADOS**
${input.technicianNotes ? `- ${input.technicianNotes.replace(/\n/g, '\n- ')}` : '- Inspección general del equipo'}
${input.solutionApplied ? `- Solución aplicada: ${input.solutionApplied}` : ''}

**3. OBSERVACIONES Y RECOMENDACIONES**
${input.ocrText ? `Códigos detectados: ${input.ocrText}\n` : ''}Se recomienda continuar con el programa de mantenimiento preventivo establecido.

**4. CONCLUSIÓN**
El equipo se encuentra en condiciones operativas. Se sugiere dar seguimiento en la próxima visita programada.
---`;
}
