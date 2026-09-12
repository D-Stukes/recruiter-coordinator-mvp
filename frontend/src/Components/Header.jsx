import calendarIcon from '../Images/calendar-icon.svg';
import '../Styles/Header.css';

export default function Header({ status }) {
  const label = status
    ? `Calendar: ${status.googleCalendarMode} · Email: ${status.emailMode}`
    : 'loading…';

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
