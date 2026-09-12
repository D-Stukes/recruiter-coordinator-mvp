import { useState } from 'react';
import { uploadCandidates } from '../Scripts/api.js';
import '../Styles/UploadForm.css';

export default function UploadForm({ recruiters, onUploaded }) {
  const [recruiterId, setRecruiterId] = useState(recruiters[0]?.id || '');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !recruiterId) return;

    setSubmitting(true);
    setMessage('Uploading…');
    setStatus(null);

    const formData = new FormData();
    formData.append('recruiterId', recruiterId);
    formData.append('csvFile', file);

    try {
      const data = await uploadCandidates(formData);
      setMessage(data.message);
      setStatus('success');
      setFile(null);
      e.target.reset();
      onUploaded();
    } catch (err) {
      setMessage(err.message);
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card upload-card">
      <h2><span className="step-number">1</span>Upload candidates</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="recruiterSelect">Recruiter</label>
        <select
          id="recruiterSelect"
          value={recruiterId}
          onChange={(e) => setRecruiterId(e.target.value)}
          required
        >
          {recruiters.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label htmlFor="csvFile">Candidates CSV (columns: name, email)</label>
        <input
          type="file"
          id="csvFile"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0] || null)}
          required
        />

        <button type="submit" className="upload-button" disabled={submitting}>
          {submitting ? 'Starting…' : 'Start Scheduling'}
        </button>
      </form>
      {message && <p className={`message ${status || ''}`}>{message}</p>}
      <p className="hint">
        No CSV handy? <a href="/sample-candidates.csv" download>Download a sample file</a>.
      </p>
    </section>
  );
}
