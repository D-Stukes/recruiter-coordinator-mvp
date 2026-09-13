import { useEffect, useMemo, useState } from 'react';
import StatusPill from './StatusPill.jsx';
import { slotOrBookedLabel, statusLabel } from '../Scripts/format.js';
import '../Styles/CandidatesTable.css';

const PAGE_SIZE = 10;

export default function CandidatesTable({ candidates }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [recruiterFilter, setRecruiterFilter] = useState('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const statuses = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.status))).sort(),
    [candidates]
  );

  const recruiterNames = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.recruiterName))).sort(),
    [candidates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (recruiterFilter !== 'ALL' && c.recruiterName !== recruiterFilter) return false;
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.recruiterName?.toLowerCase().includes(q)
      );
    });
  }, [candidates, query, statusFilter, recruiterFilter]);

  // Reset back to the first page whenever the filter criteria change (not
  // on every poll refresh of `candidates`, so scrolling isn't interrupted).
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, statusFilter, recruiterFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

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
          className="candidates-recruiter-filter"
          value={recruiterFilter}
          onChange={(e) => setRecruiterFilter(e.target.value)}
        >
          <option value="ALL">All recruiters</option>
          {recruiterNames.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
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
          {visible.map((c) => (
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
      {hasMore && (
        <div className="candidates-pagination">
          <button
            type="button"
            className="link-button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            Show next {Math.min(PAGE_SIZE, filtered.length - visibleCount)}
          </button>
          <span className="candidates-pagination-hint">
            Showing {visible.length} of {filtered.length}
          </span>
        </div>
      )}
    </section>
  );
}
