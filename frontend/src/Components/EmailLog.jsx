import '../Styles/EmailLog.css';

export default function EmailLog({ entries }) {
  return (
    <section className="card">
      <h2>3. Email Activity (mock outbox)</h2>
      <p className="hint">
        Shows every email the system would send, so you can demo the loop without a live
        SendGrid account.
      </p>
      <div className="email-log">
        {entries.length === 0 && <p className="hint">No emails sent yet.</p>}
        {entries.map((e, i) => (
          <div className="email-item" key={`${e.to}-${e.sentAt}-${i}`}>
            <div>
              <span className="to">{e.to}</span> — <span className="subject">{e.subject}</span>
            </div>
            <pre>{e.text}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
