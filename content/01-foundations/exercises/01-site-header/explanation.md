The page is split into components that each do one job. `SiteHeader` and `SiteFooter` are declared at the top level of the module, next to `App`, never inside it. `App` reads like an outline of the page.

The header's links come from a small array rendered with `map`. Three hand-written `<a>` tags would work just as well. The array earns its place once a fourth link arrives or the links need to come from data. Each `<li>` gets the link's `href` as its `key` because it's unique and stable.

The tests find elements by **role** (`heading`, `navigation`, `link`, `main`, `contentinfo`), and that's why semantic tags matter here:

- `<header>`, `<main>` and `<footer>` give the page landmarks that screen reader users can jump between. A `<footer>` that isn't inside an `<article>` or `<section>` is the page's `contentinfo` landmark.
- `aria-label="Main"` names the navigation. A page often has more than one `<nav>`, and a name tells them apart.

A version built from `<div>`s could look identical, but it would fail these tests. It would also be harder to use without a mouse or a screen.
