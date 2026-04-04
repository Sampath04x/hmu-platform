export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hmu_token');
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hmu_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hmu_token');
  }
};

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiFetch = async (endpoint: string, options: RequestOptions = {}) => {
  const url = `${getApiUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers);

  // Add JSON content type if body is present and not multipart/form-data
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Add auth token if required
  if (options.requireAuth !== false) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred during the API request.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch (e) {
      // Not JSON
      errorMsg = await response.text() || response.statusText;
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};
