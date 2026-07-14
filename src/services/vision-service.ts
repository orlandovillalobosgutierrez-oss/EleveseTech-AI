import { apiRequest } from './api-client';
import { GEMINI_VISION_ENDPOINT, GEMINI_API_KEY, REPORT_ZONE_LABELS } from '../constants/config';
import type { ReportZone } from '../types/report';

interface VisionClassificationResult {
  photoId: string;
  zone: ReportZone;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

interface BatchClassificationResponse {
  classifications: VisionClassificationResult[];
  error?: string;
}

export async function classifyPhotosInBatch(
  photoBase64List: Array<{ id: string; base64: string }>
): Promise<BatchClassificationResponse> {
  if (!GEMINI_API_KEY) {
    return {
      classifications: photoBase64List.map((p) => ({
        photoId: p.id,
        zone: 'machine_room_control',
        confidence: 'low',
        description: 'API key no configurada — clasificación por defecto',
      })),
      error: 'GEMINI_API_KEY not configured',
    };
  }

  const zoneList = Object.entries(REPORT_ZONE_LABELS)
    .map(([key, label]) => `- "${key}": ${label}`)
    .join('\n');

  const parts: any[] = [
    {
      text: `Eres un inspector de mantenimiento de elevadores. Clasifica cada una de las siguientes
fotos en EXACTAMENTE UNA de estas 5 zonas:

${zoneList}

Reglas de clasificación:
- "machine_room_control": Tableros eléctricos, PLCs, variadores de frecuencia, paneles de control, botoneras, displays, gabinetes metálicos con electrónica, cableado de control.
- "machine_room_motor": Máquina de tracción, motor eléctrico, polea, freno, reductor, generador, cabrestante, volante de inercia.
- "shaft_rails": Rieles verticales, guías, contrapeso, cables de tracción viajando por el cubo, poleas desviadoras, interior del cubo sin puertas visibles, estructuras metálicas verticales del hueco.
- "floor_doors": Puertas de piso (exteriores), puertas de cabina (interiores), operador de puerta, cerrojo, contacto de puerta, marco de puerta, sensores de puerta, any vista donde se vean claramente puertas de elevador.
- "pit": Foso/pozo, polea tensora, amortiguadores, finales de carrera inferiores, iluminación de foso, cable viajero en zona baja, cualquier vista del fondo del cubo.

Responde ÚNICAMENTE con un objeto JSON con este formato exacto:
{
  "classifications": [
    {
      "photoIndex": 0,
      "zone": "machine_room_control",
      "confidence": "high",
      "description": "Panel de control con PLC y variadores de frecuencia"
    }
  ]
}

La confianza es "high" si estás completamente seguro, "medium" si hay ambigüedad entre 2 zonas, "low" si no estás seguro.`,
    },
  ];

  for (let i = 0; i < photoBase64List.length; i++) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: photoBase64List[i].base64,
      },
    });
    parts.push({
      text: `Foto ${i}:`,
    });
  }

  const url = `${GEMINI_VISION_ENDPOINT}?key=${GEMINI_API_KEY}`;

  try {
    const response = await apiRequest<any>(url, {
      method: 'POST',
      body: {
        contents: [
          {
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      },
    });

    if (response.error || !response.data) {
      return {
        classifications: photoBase64List.map((p) => ({
          photoId: p.id,
          zone: 'machine_room_control',
          confidence: 'low',
          description: `Error de API: ${response.error}`,
        })),
        error: response.error ?? 'Unknown error',
      };
    }

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text from Gemini');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const classifications = parsed.classifications.map((c: any) => ({
      photoId: photoBase64List[c.photoIndex]?.id || '',
      zone: c.zone as ReportZone,
      confidence: c.confidence as 'high' | 'medium' | 'low',
      description: c.description || '',
    }));

    return { classifications };
  } catch (error: any) {
    return {
      classifications: photoBase64List.map((p) => ({
        photoId: p.id,
        zone: 'machine_room_control' as ReportZone,
        confidence: 'low',
        description: `Error: ${error.message}`,
      })),
      error: error.message,
    };
  }
}
