The solution follows the order from the "Thinking in components" lesson. First it finds the tree: a `Schedule` holds a `DaySection` for each day, and each `DaySection` holds a `SessionItem` for each session. Then it builds the static version, with data flowing down as props.

**Shape the data before rendering.** The flat `sessions` array doesn't match the UI, which is grouped by day. `groupByDay` reshapes it once, and from there every component is a plain `map`. A `Map` keeps keys in insertion order, so days come out in the order they first appear. A plain object could reorder some keys (integer-like ones go first), and sorting by name would put Saturday before Friday.

**Small components, one job each.** `SessionItem` knows how to display one session, including the "no speaker" case. `DaySection` knows how to frame a day. `Schedule` only groups. Each could be tested or restyled without touching the others.

**Keys at each level.** Days use the day name, which is unique within the schedule. Sessions use their `id`. Both are stable, so neither depends on position.

**Meaningful markup.** Each day is a `<section>` labelled by its `<h2>`, which makes it a named region that screen reader users can jump to. The sessions use an ordered list, `<ol>`, because the order is the schedule. The start time sits in a `<time>` element, which marks it as a time rather than plain text. The tests find days by region name and sessions by list item, so they pass for any markup that keeps this structure.
