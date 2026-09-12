import '../Styles/EmailLog.css';

// Splitting on a regex with a capturing group keeps the matches in the
// result array: even indexes are plain text, odd indexes are the URLs.
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;
// A separate, non-global pattern for a quick yes/no check per line -- a
// global regex's .test() mutates its own lastIndex, which causes it to
// silently skip matches on repeated calls, so detection uses its own copy.
const HAS_URL = /https?:\/\//;

function linkifyLine(line) {
  return line.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

function EmailBody({ text }) {
  const lines = text.split('\n');
  return (
    <div className="email-body">
      {lines.map((line, i) => (
        <div key={i} className={HAS_URL.test(line) ? 'email-line has-link' : 'email-line'}>
          {line ? linkifyLine(line) : '\u00A0'}
        </div>
      ))}
    </div>
  );
}

export default function EmailLog({ entries }) {
  return (
    <section className="card">
      <h2><span className="step-number">3</span>Email activity</h2>
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
            <EmailBody text={e.text} />
          </div>
        ))}
      </div>
    </section>
  );
}