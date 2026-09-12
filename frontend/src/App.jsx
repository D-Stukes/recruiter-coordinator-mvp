import { useCallback, useEffect, useState } from 'react';
import Header from './Components/Header.jsx';
import UploadForm from './Components/UploadForm.jsx';
import CandidatesTable from './Components/CandidatesTable.jsx';
import EmailLog from './Components/EmailLog.jsx';
import { getRecruiters, getCandidates, getEmailLog, getStatus } from './Scripts/api.js';
import './Styles/App.css';

const POLL_INTERVAL_MS = 4000;

export default function App() {
  const [recruiters, setRecruiters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [emailLog, setEmailLog] = useState([]);
  const [status, setStatus] = useState(null);

  const refreshCandidatesAndEmail = useCallback(async () => {
    const [candidatesData, emailData] = await Promise.all([getCandidates(), getEmailLog()]);
    setCandidates(candidatesData);
    setEmailLog(emailData);
  }, []);

  useEffect(() => {
    getRecruiters().then(setRecruiters).catch(console.error);
    getStatus().then(setStatus).catch(console.error);
    refreshCandidatesAndEmail().catch(console.error);

    // Poll so the dashboard reflects a candidate booking their slot in another tab.
    const interval = setInterval(() => {
      refreshCandidatesAndEmail().catch(console.error);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshCandidatesAndEmail]);

  return (
    <div className="app">
      <Header status={status} />
      <main className="layout">
        {recruiters.length > 0 && (
          <UploadForm recruiters={recruiters} onUploaded={refreshCandidatesAndEmail} />
        )}
        <CandidatesTable candidates={candidates} />
        <EmailLog entries={emailLog} />
      </main>
    </div>
  );
}
