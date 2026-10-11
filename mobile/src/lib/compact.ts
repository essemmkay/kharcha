// Compact number for chart axes: 1500 -> "1.5K", 2_000_000 -> "2M".
// Intl compact notation is unreliable on Hermes, so do it by hand.
export function compactNumber(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [factor, suffix] of units) {
    if (abs >= factor) {
      const v = abs / factor;
      // one decimal only when it adds info (1.5K), none otherwise (2M)
      const s = v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
      return `${sign}${s}${suffix}`;
    }
  }
  return `${sign}${abs.toFixed(0)}`;
}
