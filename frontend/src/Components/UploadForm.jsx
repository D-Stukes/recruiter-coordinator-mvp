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
  const [showFileInput, setShowFileInput] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [submitting, setSubmitting] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    setPickedFile(e.target.files[0] || null);
  }

  function resetToDefault() {
    setPickedFile(null);
    setShowFileInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!recruiterId) return;
    setShowWarningModal(true);
  }

  async function confirmAndUpload() {
    setShowWarningModal(false);
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
      <form onSubmit={handleFormSubmit}>
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

        {showFileInput ? (
          <>
            <label htmlFor="csvFile">Candidates CSV (columns: name, email)</label>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <p className="hint">
              {pickedFile ? `Using: ${pickedFile.name}. ` : 'Choose a CSV to upload. '}
              <button type="button" className="link-button" onClick={resetToDefault}>
                Use default dataset instead
              </button>
            </p>
          </>
        ) : (
          <p className="hint">
            Using {DEFAULT_DATASET_LABEL}.{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => setShowFileInput(true)}
            >
              Have your own CSV? Upload it instead
            </button>
          </p>
        )}

        <button type="submit" className="upload-button" disabled={submitting}>
          {submitting ? 'Starting…' : 'Start Scheduling'}
        </button>
      </form>
      {message && <p className={`message ${status || ''}`}>{message}</p>}

      {showWarningModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3>Heads up</h3>
            <p>
              Uploading candidates may take a few seconds to fully populate the
              list below while scheduling runs in the background. Give it a
              moment before assuming something's wrong.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="link-button"
                onClick={() => setShowWarningModal(false)}
              >
                Cancel
              </button>
              <button type="button" className="upload-button" onClick={confirmAndUpload}>
                Got it, continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
