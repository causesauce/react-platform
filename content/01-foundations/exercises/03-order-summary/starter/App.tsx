type OrderSummaryProps = {
  itemCount: number;
  total: number;
};

export function OrderSummary({ itemCount, total }: OrderSummaryProps) {
  // TODO: When itemCount is 0, render only <p>Your cart is empty.</p>.
  // TODO: Use "item" for exactly one item and "items" otherwise.
  // TODO: Show "Free shipping" only when total is 50 or more.
  return (
    <section aria-label="Order summary">
      <p>{itemCount} items</p>
      {itemCount && <p>Total: €{total.toFixed(2)}</p>}
      <p>Free shipping</p>
    </section>
  );
}

export default function App() {
  return (
    <main>
      <OrderSummary itemCount={3} total={64.5} />
      <OrderSummary itemCount={1} total={19} />
      <OrderSummary itemCount={0} total={0} />
    </main>
  );
}
