import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { IS_O16, POULE_ORDER_14, POULE_ORDER_16 } from '../constants'
import { runSimO14, runSimO16 } from '../simulation'
import { pct, pc, Bar, fmtMatchDate } from './Shared'

const OUTCOMES = [
  { key: null, label: '?', color: '#888', bg: '#f0ede8', title: 'Niet vastgezet (random)' },
  { key: 'W', label: 'W', color: '#16a34a', bg: '#dcfce7', title: 'Winst' },
  { key: 'D', label: 'G', color: '#b45309', bg: '#fef3c7', title: 'Gelijk' },
  { key: 'L', label: 'V', color: '#dc2626', bg: '#fee2e2', title: 'Verlies' },
]

function findMyMatches(data, myTeam, pouleOrder) {
  const matches = []
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    for (let i = 0; i < poule.remaining.length; i++) {
      const [h, a, date] = poule.remaining[i]
      if (h === myTeam || a === myTeam) {
        const opponent = h === myTeam ? a : h
        const isHome = h === myTeam
        matches.push({ pouleId, h, a, date, opponent, isHome, lockKey: `${h}_${a}` })
      }
    }
  }
  return matches
}

export default function WhatIfTab({ data, myTeam, effectiveComp }) {
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14
  const myMatches = useMemo(() => myTeam ? findMyMatches(data, myTeam, pouleOrder) : [], [data, myTeam, pouleOrder])
  const [locks, setLocks] = useState({})
  const [results, setResults] = useState(null)
  const [baseResults, setBaseResults] = useState(null)
  const [running, setRunning] = useState(false)

  const N = 10000

  const runSim = useCallback((currentLocks) => {
    setRunning(true)
    setTimeout(() => {
      const r = o16 ? runSimO16(data, N, 0, currentLocks) : runSimO14(data, N, 0, currentLocks)
      setResults(r)
      setRunning(false)
    }, 20)
  }, [data, N, o16])

  // Run baseline (no locks) on mount
  useEffect(() => {
    const base = o16 ? runSimO16(data, N, 0) : runSimO14(data, N, 0)
    setBaseResults(base)
    setResults(base)
  }, [data, N, o16])

  // Locks stored from FOCUS CLUB perspective, but simPoule needs HOME perspective
  // So we translate: if focus club is away, W→L and L→W
  function buildSimLocks(uiLocks) {
    const simLocks = {}
    for (const m of myMatches) {
      const ui = uiLocks[m.lockKey]
      if (!ui) continue
      if (m.isHome) {
        simLocks[m.lockKey] = ui // focus = home, no flip needed
      } else {
        // focus = away, flip W↔L
        simLocks[m.lockKey] = ui === 'W' ? 'L' : ui === 'L' ? 'W' : 'D'
      }
    }
    return simLocks
  }

  function toggleOutcome(lockKey, current) {
    const order = [null, 'W', 'D', 'L']
    const idx = order.indexOf(current)
    const next = order[(idx + 1) % order.length]
    const newLocks = { ...locks }
    if (next === null) delete newLocks[lockKey]
    else newLocks[lockKey] = next
    setLocks(newLocks)
    runSim(buildSimLocks(newLocks))
  }

  function setAll(outcome) {
    const newLocks = {}
    if (outcome !== null) {
      for (const m of myMatches) newLocks[m.lockKey] = outcome
    }
    setLocks(newLocks)
    runSim(buildSimLocks(newLocks))
  }

  const lockedCount = Object.keys(locks).length
  const hasLocks = lockedCount > 0

  if (!myTeam) return <div style={{ padding: 20, color: '#888', fontSize: 13 }}>Kies eerst een focus club (klik op 🏑)</div>
  if (myMatches.length === 0) return <div style={{ padding: 20, color: '#888', fontSize: 13 }}>Geen resterende wedstrijden voor {myTeam}</div>

  // Extract NK chances for focus team
  const getChances = (res) => {
    if (!res || !myTeam) return null
    if (o16) {
      const f = res.fin[myTeam]
      return f ? { kf: pct(f.kf, N), hf: pct(f.hf, N), fin: pct(f.finalist, N), p1: pct(f.p1, N) } : null
    } else {
      const f = res.fin[myTeam]
      return f ? { hf: pct(f.sfReach, N), fin: pct(f.finalist, N), p1: pct(f.p1, N), podium: pct(f.p1 + f.p2 + f.p3, N) } : null
    }
  }

  const current = getChances(results)
  const baseline = getChances(baseResults)

  const diff = (cur, base) => {
    if (cur == null || base == null) return null
    const d = cur - base
    if (d === 0) return <span style={{ color: '#888', fontSize: 10 }}> (=)</span>
    return <span style={{ color: d > 0 ? '#16a34a' : '#dc2626', fontSize: 10, fontWeight: 600 }}> ({d > 0 ? '+' : ''}{d}%)</span>
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <span>Wedstrijden van {myTeam} — klik om resultaat in te stellen</span>
          {running && <span style={{ fontSize: 10, color: '#3b82f6' }}>berekenen...</span>}
        </div>
        <div style={{ padding: '4px 0' }}>
          {myMatches.map(m => {
            const locked = locks[m.lockKey] || null
            const outcome = OUTCOMES.find(o => o.key === locked)
            return (
              <div key={m.lockKey} className="match-row" style={{ background: locked ? outcome.bg : 'transparent', cursor: 'pointer' }}
                onClick={() => toggleOutcome(m.lockKey, locked)}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 60 }}>
                  {fmtMatchDate(m.date) || '?'}
                </div>
                <div className="match-teams">
                  <div className="match-team right" style={m.isHome ? { fontWeight: 600 } : {}}>
                    {m.isHome ? myTeam : m.opponent}
                  </div>
                  <div className="match-vs">vs</div>
                  <div className="match-team" style={!m.isHome ? { fontWeight: 600 } : {}}>
                    {m.isHome ? m.opponent : myTeam}
                  </div>
                </div>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: outcome.bg, color: outcome.color, fontWeight: 700, fontSize: 13, border: `1.5px solid ${outcome.color}40`
                }} title={outcome.title}>
                  {outcome.label}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #e0ddd8', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="whatif-preset" onClick={() => setAll('W')} style={{ background: '#dcfce7', color: '#16a34a' }}>Alles winst</button>
          <button className="whatif-preset" onClick={() => setAll('D')} style={{ background: '#fef3c7', color: '#b45309' }}>Alles gelijk</button>
          <button className="whatif-preset" onClick={() => setAll('L')} style={{ background: '#fee2e2', color: '#dc2626' }}>Alles verlies</button>
          <button className="whatif-preset" onClick={() => setAll(null)} style={{ background: '#f0ede8', color: '#888' }}>Reset</button>
        </div>
      </div>

      {current && baseline && (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <span>NK kansen {myTeam}</span>
            {hasLocks && <span style={{ fontSize: 10, color: '#3b82f6' }}>{lockedCount} wedstrijd{lockedCount > 1 ? 'en' : ''} vastgezet</span>}
          </div>
          <table><tbody>
            {o16 ? (
              <>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Kwartfinale</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.kf, 50, 20)}>{current.kf}%{hasLocks && diff(current.kf, baseline.kf)}</td></tr>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Halve finale</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.hf, 30, 15)}>{current.hf}%{hasLocks && diff(current.hf, baseline.hf)}</td></tr>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Finale</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.fin, 20, 10)}>{current.fin}%{hasLocks && diff(current.fin, baseline.fin)}</td></tr>
                <tr style={{ background: '#fffbeb' }}><td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>🥇 Kampioen</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontWeight: 600 }} className={pc(current.p1, 15, 5)}>{current.p1}%{hasLocks && diff(current.p1, baseline.p1)}</td></tr>
              </>
            ) : (
              <>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Halve finale</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.hf, 30, 15)}>{current.hf}%{hasLocks && diff(current.hf, baseline.hf)}</td></tr>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Finale</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.fin, 20, 10)}>{current.fin}%{hasLocks && diff(current.fin, baseline.fin)}</td></tr>
                <tr style={{ background: '#fffbeb' }}><td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>🥇 Kampioen</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontWeight: 600 }} className={pc(current.p1, 15, 5)}>{current.p1}%{hasLocks && diff(current.p1, baseline.p1)}</td></tr>
                <tr><td style={{ padding: '8px 12px', fontSize: 13 }}>Podium (top 3)</td><td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace" }} className={pc(current.podium, 30, 15)}>{current.podium}%{hasLocks && diff(current.podium, baseline.podium)}</td></tr>
              </>
            )}
          </tbody></table>
        </div>
      )}

      <div className="sim-note">
        {N.toLocaleString('nl-NL')} simulaties · {hasLocks ? `${lockedCount} vastgezet` : 'geen scenario'} · {new Date().toLocaleTimeString('nl-NL')}
      </div>
    </div>
  )
}
