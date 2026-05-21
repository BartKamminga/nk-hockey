import React from 'react'

// ── Shared helpers (used across multiple tabs) ──
export const pct = (c, N) => Math.round(c / N * 100)
export const pc = (p, hi, mid) => p >= hi ? 'prob-hi' : p >= mid ? 'prob-mid' : 'prob-low'
export function fmtMatchDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' } }

export const Bar = ({ p, col }) => (
  <div className="bar-wrap">
    <div className="bar-track"><div className="bar-fill" style={{ width: `${p}%`, background: col }}></div></div>
    <span className="bar-val">{p}%</span>
  </div>
)
