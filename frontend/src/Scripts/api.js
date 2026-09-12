// Scripts/api.js
// All fetch calls to the Express backend live here, so components never
// touch fetch() directly. Same-origin in production (server.js serves the
// built frontend); proxied through Vite's dev server locally.

const jsonOrThrow = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
};

export const getRecruiters = () => fetch('/api/recruiters').then(jsonOrThrow);

export const getCandidates = () => fetch('/api/candidates').then(jsonOrThrow);

export const getEmailLog = () => fetch('/api/email-log').then(jsonOrThrow);

export const getStatus = () => fetch('/api/status').then(jsonOrThrow);

export const uploadCandidates = (formData) =>
  fetch('/api/upload', { method: 'POST', body: formData }).then(jsonOrThrow);
