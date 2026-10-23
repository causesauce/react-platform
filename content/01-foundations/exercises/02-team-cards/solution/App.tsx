type MemberCardProps = {
  name: string;
  avatarUrl: string;
  role?: string;
};

export function MemberCard({ name, avatarUrl, role = "Contributor" }: MemberCardProps) {
  return (
    <article className="member-card">
      <img src={avatarUrl} alt={`${name}'s avatar`} width={64} height={64} />
      <h2>{name}</h2>
      <p>{role}</p>
    </article>
  );
}

export default function App() {
  return (
    <section aria-label="Team">
      <MemberCard name="Ines Duarte" role="Design lead" avatarUrl="/avatars/ines.png" />
      <MemberCard name="Kofi Mensah" role="Engineer" avatarUrl="/avatars/kofi.png" />
      <MemberCard name="Lena Vogel" avatarUrl="/avatars/lena.png" />
    </section>
  );
}
