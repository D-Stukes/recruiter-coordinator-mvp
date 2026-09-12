import calendarIcon from '../Images/calendar-icon.svg';
import '../Styles/Header.css';

export default function Header({ status }) {
  const label = !status
    ? 'Loading…'
    : status.googleCalendarMode === 'mock' && status.emailMode === 'mock'
    ? 'Demo data — no live calendar or email connected'
    : 'Live calendar and email connected';

  return (
    <header className="topbar">
      <div className="topbar-title">
        <img src={calendarIcon} className="topbar-icon" alt="" />
        <h1>Recruiter Coordinator</h1>
      </div>
      <span className="badge">{label}</span>
    </header>
  );
}
