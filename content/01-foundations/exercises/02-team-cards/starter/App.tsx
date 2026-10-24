type MemberCardProps = {
  name: string;
  avatarUrl: string;
  role?: string;
};

// TODO: Destructure name, avatarUrl and role from the props.
// TODO: Give role the default value "Contributor".
export function MemberCard(props: MemberCardProps) {
  // TODO: Render an <article> that contains:
  //   - an <img> with src={avatarUrl} and the alt text "<name>'s avatar"
  //   - an <h2> with the name
  //   - a <p> with the role
  return (
    <article className="member-card">
      <h2>Name goes here</h2>
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
