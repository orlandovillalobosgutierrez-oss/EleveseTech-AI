import { API_BASE_URL } from '../constants/config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

const DEFAULT_TIMEOUT = 30000;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    let data: T | null = null;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text as any;
    }

    if (!response.ok) {
      return {
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return { data, error: null, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { data: null, error: 'Request timeout', status: 0 };
    }
    return { data: null, error: error.message || 'Network error', status: 0 };
  }
}

export async function uploadFile(
  endpoint: string,
  fileUri: string,
  fieldName: string = 'file',
  additionalFields?: Record<string, string>
): Promise<ApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();

    const filename = fileUri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeType =
      ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    formData.append(fieldName, {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    if (additionalFields) {
      for (const [key, value] of Object.entries(additionalFields)) {
        formData.append(key, value);
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        data: null,
        error: `Upload failed: ${response.status}`,
        status: response.status,
      };
    }

    return { data, error: null, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);
    return { data: null, error: error.message || 'Upload error', status: 0 };
  }
}
