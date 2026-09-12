import { statusLabel } from '../Scripts/format.js';

export default function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{statusLabel(status)}</span>;
}
