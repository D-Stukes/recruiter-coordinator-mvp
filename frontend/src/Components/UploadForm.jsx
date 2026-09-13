import { useRef, useState } from 'react';
import { uploadCandidates } from '../Scripts/api.js';
import { DEFAULT_CANDIDATES_CSV, DEFAULT_DATASET_LABEL } from '../Scripts/defaultDataset.js';
import '../Styles/UploadForm.css';

// Turns the bundled default CSV text into a real File object, so it can be
// sent through the exact same upload path as a recruiter-picked file --
// the backend never needs to know the difference.
function defaultCsvAsFile() {
  const blob = new Blob([DEFAULT_CANDIDATES_CSV], { type: 'text/csv' });
  return new File([blob], 'default-candidates.csv', { type: 'text/csv' });
}

export default function UploadForm({ recruiters, onUploaded }) {
  const [recruiterId, setRecruiterId] = useState(recruiters[0]?.id || '');
  const [pickedFile, setPickedFile] = useState(null); // null = using the default dataset
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    setPickedFile(e.target.files[0] || null);
  }

  function resetToDefault() {
    setPickedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!recruiterId) return;

    setSubmitting(true);
    setMessage('Uploading…');
    setStatus(null);

    const formData = new FormData();
    formData.append('recruiterId', recruiterId);
    formData.append('csvFile', pickedFile || defaultCsvAsFile());

    try {
      const data = await uploadCandidates(formData);
      setMessage(data.message);
      setStatus('success');
      resetToDefault();
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
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <p className="hint">
          {pickedFile
            ? `Using: ${pickedFile.name}. `
            : `Using ${DEFAULT_DATASET_LABEL}. `}
          {pickedFile && (
            <button type="button" className="link-button" onClick={resetToDefault}>
              Use default instead
            </button>
          )}
        </p>

        <button type="submit" className="upload-button" disabled={submitting}>
          {submitting ? 'Starting…' : 'Start Scheduling'}
        </button>
      </form>
      {message && <p className={`message ${status || ''}`}>{message}</p>}
    </section>
  );
}
