type OrderSummaryProps = {
  itemCount: number;
  total: number;
};

export function OrderSummary({ itemCount, total }: OrderSummaryProps) {
  if (itemCount === 0) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <section aria-label="Order summary">
      <p>
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </p>
      <p>Total: €{total.toFixed(2)}</p>
      {total >= 50 && <p>Free shipping</p>}
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
