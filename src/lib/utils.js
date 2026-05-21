// Pure utility functions — no React
export const pct = (c, N) => Math.round(c / N * 100)
export const pc = (p, hi, mid) => p >= hi ? 'prob-hi' : p >= mid ? 'prob-mid' : 'prob-low'
export function fmtMatchDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' } }
