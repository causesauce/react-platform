Each condition uses the tool that fits its shape:

- **The empty cart changes the whole output**, so it's an early `return` at the top. The rest of the function can then assume there's at least one item, and the main markup stays unindented.
- **"item" or "items" picks between two values**, so it's a ternary inside the JSX.
- **"Free shipping" is something or nothing**, so it's `&&` with a real boolean on the left: `total >= 50`.

The starter's `{itemCount && <p>Total…</p>}` is the classic trap. For an empty cart, `itemCount && …` evaluates to `0`, and React renders numbers, so a stray "0" shows up on the page. The first test catches it by checking the component's entire text: nothing may appear besides the empty-cart message. Checking only that the message exists would miss the leak.

`toFixed(2)` formats the total with two decimals (`64.5` → `"64.50"`). A real shop would use `Intl.NumberFormat` to get the currency symbol and separators right for each locale. That's a formatting concern rather than a React one, so the exercise keeps it simple.
