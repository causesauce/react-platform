const links = [
  { href: "/browse", label: "Browse" },
  { href: "/offer", label: "Offer a plant" },
  { href: "/swaps", label: "My swaps" },
];

function SiteHeader() {
  return (
    <header>
      <h1>Plant Swap</h1>
      <nav aria-label="Main">
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer>
      <p>© 2026 Plant Swap community</p>
    </footer>
  );
}

export default function App() {
  return (
    <div className="page">
      <SiteHeader />
      <main>
        <p>Trade cuttings and seedlings with people near you.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
