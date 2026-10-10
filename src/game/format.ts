/** ₦1,234,567 */
export const fmt = (n: number): string => '₦' + Math.round(n).toLocaleString('en-US');

/** ₦1.2m, ₦450k, ₦1.17bn */
export function short(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return '₦' + (n / 1e9).toFixed(2) + 'bn';
  if (a >= 1e6) return '₦' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (a >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
  return '₦' + Math.round(n);
}

/** In-game minutes since midnight → "10:40 PM". Wraps past midnight. */
export function clock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ap}`;
}

export const clamp = (v: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, v));
