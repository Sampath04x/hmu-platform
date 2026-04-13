import { supabase } from './supabase';

export const getApiUrl = () => {
  let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  API_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return API_BASE_URL;
};

export const getAuthToken = async () => {
  if (typeof window !== 'undefined') {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  }
  return null;
};

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  token?: string | null;
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
    // Use the provided token if available, otherwise fetch from session
    const token = options.token || await getAuthToken();
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
      const textResponse = await response.text();
      if (textResponse) {
        try {
          const errorData = JSON.parse(textResponse);
          const potentialError = errorData.error || errorData.message;
          errorMsg = typeof potentialError === 'string' 
            ? potentialError 
            : (typeof potentialError === 'object' ? JSON.stringify(potentialError) : errorMsg);
        } catch {
          errorMsg = textResponse;
        }
      } else {
        errorMsg = response.statusText;
      }
    } catch (e) {
      errorMsg = response.statusText;
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
