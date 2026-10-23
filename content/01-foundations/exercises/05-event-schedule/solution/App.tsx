export type Session = {
  id: string;
  day: string;
  time: string;
  title: string;
  speaker: string | null;
};

export const sessions: Session[] = [
  { id: "s1", day: "Friday", time: "09:00", title: "Opening keynote", speaker: "Mariam Haddad" },
  { id: "s2", day: "Friday", time: "10:30", title: "Coffee break", speaker: null },
  { id: "s3", day: "Friday", time: "11:00", title: "Accessible forms in practice", speaker: "Tomás Ruiz" },
  { id: "s4", day: "Saturday", time: "09:30", title: "Testing what users see", speaker: "Yuki Tanaka" },
  { id: "s5", day: "Saturday", time: "12:00", title: "Lunch", speaker: null },
  { id: "s6", day: "Saturday", time: "13:30", title: "Design systems that last", speaker: "Priya Natarajan" },
];

function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const byDay = new Map<string, Session[]>();
  for (const session of sessions) {
    const day = byDay.get(session.day) ?? [];
    day.push(session);
    byDay.set(session.day, day);
  }
  return byDay;
}

function SessionItem({ session }: { session: Session }) {
  return (
    <li>
      <time>{session.time}</time> {session.title}
      {session.speaker !== null && <span> with {session.speaker}</span>}
    </li>
  );
}

function DaySection({ day, sessions }: { day: string; sessions: Session[] }) {
  const headingId = `day-${day.toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{day}</h2>
      <ol>
        {sessions.map((session) => (
          <SessionItem key={session.id} session={session} />
        ))}
      </ol>
    </section>
  );
}

export function Schedule({ sessions }: { sessions: Session[] }) {
  const byDay = groupByDay(sessions);
  return (
    <>
      {Array.from(byDay, ([day, daySessions]) => (
        <DaySection key={day} day={day} sessions={daySessions} />
      ))}
    </>
  );
}

export default function App() {
  return (
    <main>
      <h1>Frontend Days Lisbon</h1>
      <Schedule sessions={sessions} />
    </main>
  );
}
