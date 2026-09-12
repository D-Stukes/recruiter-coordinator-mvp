const recruiterSelect = document.getElementById('recruiterSelect');
const uploadForm = document.getElementById('uploadForm');
const uploadMessage = document.getElementById('uploadMessage');
const candidatesTableBody = document.querySelector('#candidatesTable tbody');
const emptyState = document.getElementById('emptyState');
const emailLogEl = document.getElementById('emailLog');
const modeBadge = document.getElementById('modeBadge');

async function loadRecruiters() {
  const res = await fetch('/api/recruiters');
  const recruiters = await res.json();
  recruiterSelect.innerHTML = recruiters
    .map((r) => `<option value="${r.id}">${r.name}</option>`)
    .join('');
}

function slotOrBookedLabel(candidate) {
  if (candidate.status === 'BOOKED' && candidate.bookedSlot) {
    return new Date(candidate.bookedSlot.start).toLocaleString();
  }
  if (candidate.status === 'SLOTS_SENT' && candidate.slots?.length) {
    return `${candidate.slots.length} option(s) sent`;
  }
  return '—';
}

async function loadCandidates() {
  const res = await fetch('/api/candidates');
  const candidates = await res.json();

  emptyState.style.display = candidates.length ? 'none' : 'block';

  candidatesTableBody.innerHTML = candidates
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.email}</td>
      <td>${c.recruiterName}</td>
      <td><span class="status-pill status-${c.status}">${c.status.replace('_', ' ')}</span></td>
      <td>${slotOrBookedLabel(c)}</td>
    </tr>`
    )
    .join('');
}

async function loadEmailLog() {
  const res = await fetch('/api/email-log');
  const entries = await res.json();
  emailLogEl.innerHTML = entries.length
    ? entries
        .map(
          (e) => `
      <div class="email-item">
        <div><span class="to">${e.to}</span> — <span class="subject">${e.subject}</span></div>
        <pre>${e.text}</pre>
      </div>`
        )
        .join('')
    : '<p class="hint">No emails sent yet.</p>';
}

async function loadStatus() {
  const res = await fetch('/api/status');
  const status = await res.json();
  modeBadge.textContent = `Calendar: ${status.googleCalendarMode} · Email: ${status.emailMode}`;
}

async function refreshAll() {
  await Promise.all([loadCandidates(), loadEmailLog()]);
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  uploadMessage.textContent = 'Uploading…';

  const formData = new FormData(uploadForm);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    uploadMessage.textContent = data.message;
    uploadMessage.style.color = '#16a34a';
    uploadForm.reset();
    await refreshAll();
  } catch (err) {
    uploadMessage.textContent = err.message;
    uploadMessage.style.color = '#dc2626';
  }
});

(async function init() {
  await loadRecruiters();
  await loadStatus();
  await refreshAll();
  // Poll so the dashboard reflects a candidate booking their slot in another tab.
  setInterval(refreshAll, 4000);
})();
