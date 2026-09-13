import { useMemo, useState } from 'react';
import StatusPill from './StatusPill.jsx';
import { slotOrBookedLabel, statusLabel } from '../Scripts/format.js';
import '../Styles/CandidatesTable.css';

export default function CandidatesTable({ candidates }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const statuses = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.status))).sort(),
    [candidates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.recruiterName?.toLowerCase().includes(q)
      );
    });
  }, [candidates, query, statusFilter]);

  return (
    <section className="card">
      <h2><span className="step-number">2</span>Candidates</h2>
      <div className="candidates-filters">
        <input
          type="text"
          className="candidates-search"
          placeholder="Search by name, email, or recruiter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="candidates-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
        <span className="candidates-count">
          {filtered.length} of {candidates.length}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Recruiter</th>
            <th>Status</th>
            <th>Slot / Booked Time</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.recruiterName}</td>
              <td>
                <StatusPill status={c.status} />
              </td>
              <td>{slotOrBookedLabel(c)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {candidates.length === 0 && (
        <p className="hint">No candidates yet — upload a CSV above to start the loop.</p>
      )}
      {candidates.length > 0 && filtered.length === 0 && (
        <p className="hint">No candidates match your search.</p>
      )}
    </section>
  );
}
