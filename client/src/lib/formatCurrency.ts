const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹1,85,000 — Indian digit grouping, no paise. */
export function formatCurrency(amount: number | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return formatter.format(0);
  return formatter.format(value);
}

/** Compact form for chart axes: ₹1.2L, ₹45k, ₹800. */
export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(1).replace(/\.0$/, '')}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${sign}₹${abs}`;
}
