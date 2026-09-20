const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('mineguard_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('mineguard_token', token);
  } else {
    localStorage.removeItem('mineguard_token');
  }
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// Upload photo file or base64 data URL
export const uploadFile = async (fileOrDataUrl: File | Blob | string): Promise<string> => {
  let blob: Blob;

  if (typeof fileOrDataUrl === 'string') {
    // Convert base64 dataUrl to Blob
    const parts = fileOrDataUrl.split(';base64,');
    if (parts.length === 2) {
      const contentType = parts[0].split(':')[1] || 'image/jpeg';
      const byteCharacters = atob(parts[1]);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      blob = new Blob(byteArrays, { type: contentType });
    } else {
      return fileOrDataUrl; // Already a URL
    }
  } else {
    blob = fileOrDataUrl;
  }

  const formData = new FormData();
  formData.append('file', blob, 'evidence-photo.jpg');

  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload file');
  }

  const result = await res.json();
  return result.fileUrl;
};
