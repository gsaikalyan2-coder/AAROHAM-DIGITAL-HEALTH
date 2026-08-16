/**
 * The ONLY place fetch() is called from the client.
 * Adding auth headers, retries, or error toasts is a one-file change.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let authToken = null;
export function setAuthToken(token) { authToken = token; }

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.success === false) {
    const err = new Error(payload?.error?.message || `Request failed (${res.status})`);
    err.code = payload?.error?.code || 'REQUEST_FAILED';
    err.status = res.status;
    err.details = payload?.error?.details || [];  
    throw err;
  }
  return payload.data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  health: () => request('/health'),
};
