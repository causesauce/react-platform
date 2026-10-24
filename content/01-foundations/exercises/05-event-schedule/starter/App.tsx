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

// TODO: Group the sessions by day, keeping days in the order they first appear.

// TODO: Split the UI into components. For example:
//   DaySection  - a <section> labelled by an <h2> with the day's name,
//                 containing an <ol> of that day's sessions
//   SessionItem - an <li> showing the time and title, plus " with <speaker>"
//                 when the session has a speaker

export function Schedule({ sessions }: { sessions: Session[] }) {
  // TODO: Render one DaySection per day.
  return <p>{sessions.length} sessions coming soon.</p>;
}

export default function App() {
  return (
    <main>
      <h1>Frontend Days Lisbon</h1>
      <Schedule sessions={sessions} />
    </main>
  );
}
