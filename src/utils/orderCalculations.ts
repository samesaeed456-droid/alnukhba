export function calculateOrderTotals(
  subtotal: number,
  shipping: number,
  discountAmount: number,
) {
  return Math.max(0, subtotal + shipping - discountAmount);
}

export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
