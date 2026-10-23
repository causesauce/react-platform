`MemberCard` receives everything it shows through props, so the same component renders any person. That's why one test renders `MemberCard` on its own with a name that isn't in `App`: a card that only worked for the three hard-coded people would fail it.

Destructuring in the parameter list (`{ name, avatarUrl, role = "Contributor" }`) does two jobs at once. It names the props you use, and it gives `role` a default for when the parent leaves it out. The `?` in `role?: string` tells TypeScript that leaving it out is allowed. Without the `?`, `<MemberCard name="Lena Vogel" avatarUrl="…" />` would be a type error.

The alt text is built from the name with a template literal: `` alt={`${name}'s avatar`} ``. Alt text describes what the image shows for people who can't see it, and "Avatar" alone wouldn't say whose avatar it is.

`width` and `height` on the image let the browser reserve space before the image loads, which stops the layout from jumping. The tests don't check them.
