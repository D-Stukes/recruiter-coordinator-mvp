import StatusPill from './StatusPill.jsx';
import { slotOrBookedLabel } from '../Scripts/format.js';
import '../Styles/CandidatesTable.css';

export default function CandidatesTable({ candidates }) {
  return (
    <section className="card">
      <h2><span className="step-number">2</span>Candidates</h2>
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
          {candidates.map((c) => (
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
    </section>
  );
}
