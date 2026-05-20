import React, { useState, useEffect, useMemo } from 'react'
import { NK14_SLOTS, POULE_ORDER_14, POULE_ORDER_16, IS_O16 } from '../constants'
import { runSimO14, runSimO16 } from '../simulation'
import { pct, pc, Bar, fmtMatchDate } from './Shared'

// ══════════════════════════════════════
// WHAT-IF: match outcome picker
// ══════════════════════════════════════
const OUTCOMES = [
  { key: null, label: '?', color: '#888', bg: '#f0ede8', title: 'Random' },
  { key: 'W', label: 'W', color: '#16a34a', bg: '#dcfce7', title: 'Winst' },
  { key: 'D', label: 'G', color: '#b45309', bg: '#fef3c7', title: 'Gelijk' },
  { key: 'L', label: 'V', color: '#dc2626', bg: '#fee2e2', title: 'Verlies' },
]

function findMyMatches(data, myTeam, pouleOrder) {
  const matches = []
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    for (const [h, a, date] of poule.remaining) {
      if (h === myTeam || a === myTeam) {
        matches.push({ h, a, date, opponent: h === myTeam ? a : h, isHome: h === myTeam, lockKey: `${h}_${a}` })
      }
    }
  }
  return matches
}

function buildSimLocks(myMatches, uiLocks) {
  const simLocks = {}
  for (const m of myMatches) {
    const ui = uiLocks[m.lockKey]
    if (!ui) continue
    simLocks[m.lockKey] = m.isHome ? ui : (ui === 'W' ? 'L' : ui === 'L' ? 'W' : 'D')
  }
  return simLocks
}

function WhatIfPanel({ myTeam, myMatches, locks, onToggle, onSetAll }) {
  if (!myTeam || myMatches.length === 0) return null
  const lockedCount = Object.keys(locks).length
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <span>Scenario's {myTeam} ({myMatches.length} wedstrijden)</span>
        {lockedCount > 0 && <span style={{ fontSize: 10, color: '#3b82f6' }}>{lockedCount} vastgezet</span>}
      </div>
      <div style={{ padding: '4px 0' }}>
        {myMatches.map(m => {
          const locked = locks[m.lockKey] || null
          const outcome = OUTCOMES.find(o => o.key === locked)
          return (
            <div key={m.lockKey} className="match-row" style={{ background: locked ? outcome.bg : 'transparent' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 55 }}>
                {fmtMatchDate(m.date) || '?'}
              </div>
              <div className="match-teams">
                <div className="match-team right" style={m.isHome ? { fontWeight: 600 } : {}}>{m.isHome ? myTeam : m.opponent}</div>
                <div className="match-vs">vs</div>
                <div className="match-team" style={!m.isHome ? { fontWeight: 600 } : {}}>{m.isHome ? m.opponent : myTeam}</div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {OUTCOMES.map(o => (
                  <div key={o.label} onClick={() => onToggle(m.lockKey, o.key)} style={{
                    width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: locked === o.key ? o.bg : 'transparent', color: locked === o.key ? o.color : '#ccc',
                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                    border: locked === o.key ? `1.5px solid ${o.color}40` : '1.5px solid #e0ddd8',
                  }} title={o.title}>{o.label}</div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid #e0ddd8', display: 'flex', gap: 6 }}>
        <button className="whatif-preset" onClick={() => onSetAll('W')} style={{ background: '#dcfce7', color: '#16a34a' }}>Alles W</button>
        <button className="whatif-preset" onClick={() => onSetAll('D')} style={{ background: '#fef3c7', color: '#b45309' }}>Alles G</button>
        <button className="whatif-preset" onClick={() => onSetAll('L')} style={{ background: '#fee2e2', color: '#dc2626' }}>Alles V</button>
        <button className="whatif-preset" onClick={() => onSetAll(null)} style={{ background: '#f0ede8', color: '#888' }}>Reset</button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// NK CHANCES: focus club summary
// ══════════════════════════════════════
function NKChances({ myTeam, results, baseResults, N, o16, hasLocks }) {
  if (!myTeam || !results) return null
  const getChances = (res) => {
    if (!res) return null
    if (o16) {
      const f = res.fin[myTeam]
      return f ? { kf: pct(f.kf, N), hf: pct(f.hf, N), fin: pct(f.finalist, N), p1: pct(f.p1, N) } : null
    } else {
      const f = res.fin[myTeam]
      return f ? { hf: pct(f.sfReach, N), fin: pct(f.finalist, N), p1: pct(f.p1, N), podium: pct(f.p1 + f.p2 + f.p3, N) } : null
    }
  }
  const current = getChances(results), baseline = getChances(baseResults)
  if (!current) return null

  const diff = (cur, base) => {
    if (!hasLocks || base == null || cur == null) return null
    const d = cur - base
    if (d === 0) return <span style={{ color: '#888', fontSize: 10 }}> (=)</span>
    return <span style={{ color: d > 0 ? '#16a34a' : '#dc2626', fontSize: 10, fontWeight: 600 }}> ({d > 0 ? '+' : ''}{d}%)</span>
  }

  const Row = ({ label, val, baseVal, bold, gold }) => (
    <tr style={gold ? { background: '#fffbeb' } : {}}>
      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: bold ? 600 : 400 }}>{label}</td>
      <td style={{ textAlign: 'right', padding: '8px 12px', fontFamily: "'DM Mono',monospace", fontWeight: bold ? 600 : 400 }} className={pc(val, 30, 15)}>
        {val}%{diff(val, baseVal)}
      </td>
    </tr>
  )

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">NK kansen {myTeam}</div>
      <table><tbody>
        {o16 ? <>
          <Row label="Kwartfinale" val={current.kf} baseVal={baseline?.kf} />
          <Row label="Halve finale" val={current.hf} baseVal={baseline?.hf} />
          <Row label="Finale" val={current.fin} baseVal={baseline?.fin} />
          <Row label="🥇 Kampioen" val={current.p1} baseVal={baseline?.p1} bold gold />
        </> : <>
          <Row label="Halve finale" val={current.hf} baseVal={baseline?.hf} />
          <Row label="Finale" val={current.fin} baseVal={baseline?.fin} />
          <Row label="🥇 Kampioen" val={current.p1} baseVal={baseline?.p1} bold gold />
          <Row label="Podium (top 3)" val={current.podium} baseVal={baseline?.podium} />
        </>}
      </tbody></table>
    </div>
  )
}

// ══════════════════════════════════════
// O14 DETAIL TABLES
// ══════════════════════════════════════
function O14SuperRes({ data, ss, N, myTeam }) {
  const pk = POULE_ORDER_14.filter(id => data[id])
  return pk.map(id => {
    const poule = data[id], pa = ss[id], sl = NK14_SLOTS[id]
    const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])
    return (
      <div key={id}>
        <div className="poule-sim-label">Poule {id}<span className={`nk-badge nk-${sl[0].toLowerCase()}`}>#1→NK {sl[0]}</span><span className={`nk-badge nk-${sl[1].toLowerCase()}`}>#2→NK {sl[1]}</span></div>
        <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>#</th><th>Team</th><th>PT</th><th>DS</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
          {order.map((idx, rank) => {
            const p1 = pct(pa[idx][0], N), p2 = pct(pa[idx][1], N), top2 = p1 + p2, isMy = poule.teams[idx] === myTeam
            return <tr key={idx} className={isMy ? 'row-my' : p1 > 50 ? 'row-gold' : ''}><td style={{ color: '#aaa', fontSize: 11 }}>{rank + 1}</td><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{poule.teams[idx]}</td><td style={{ textAlign: 'right', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{poule.pts[idx]}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: poule.ds[idx] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[idx] >= 0 ? '+' : ''}{poule.ds[idx]}</td><td className={pc(p1, 50, 20)}>{p1}%</td><td className={pc(p2, 40, 20)}>{p2}%</td><td className={pc(top2, 60, 30)}>{top2}%</td></tr>
          })}
        </tbody></table></div>
      </div>
    )
  })
}

function O14NKRes({ results, N, myTeam }) {
  const { nkAp, nkBp, nkAa, nkBa } = results
  const renderGroup = (label, pm, am, badgeBg, badgeColor) => {
    const teams = Object.keys(pm).sort((a, b) => (am[b] || 0) - (am[a] || 0)).filter(t => (am[t] || 0) / N > 0.01)
    return (
      <div key={label}><div className="poule-sim-label"><span style={{ background: badgeBg, color: badgeColor, padding: '2px 10px', borderRadius: 99, fontSize: 11 }}>NK Poulefase {label}</span></div>
        <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
          {teams.map(t => { const app = am[t] || 0, pos = pm[t] || Array(5).fill(0), p1 = pct(pos[0], N), p2 = pct(pos[1], N), top2 = p1 + p2, isMy = t === myTeam; return <tr key={t} className={isMy ? 'row-my' : p1 >= 15 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}{pct(app, N) < 99 && <span className="origin"> kwal.{pct(app, N)}%</span>}</td><td className={pc(p1, 15, 8)}>{p1}%</td><td className={pc(p2, 15, 8)}>{p2}%</td><td className={pc(top2, 30, 15)}>{top2}%</td></tr> })}
        </tbody></table></div></div>
    )
  }
  return <>{renderGroup('A', nkAp, nkAa, '#dbeafe', '#1d4ed8')}{renderGroup('B', nkBp, nkBa, '#dcfce7', '#15803d')}</>
}

function O14FinRes({ results, N, myTeam }) {
  const teams = Object.keys(results.fin).sort((a, b) => results.fin[b].p1 - results.fin[a].p1).filter(t => results.fin[t].appear / N > 0.02)
  return (
    <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(HF)</th><th>P(finale)</th><th>P(🥇)</th><th>P(🥈)</th><th>P(🥉)</th><th>P(podium)</th></tr></thead><tbody>
      {teams.map(t => { const s = results.fin[t], pSF = pct(s.sfReach, N), pFin = pct(s.finalist, N), p1 = pct(s.p1, N), p2 = pct(s.p2, N), p3 = pct(s.p3, N), pPod = p1 + p2 + p3, isMy = t === myTeam; return <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td><td className={pc(pSF, 20, 10)}>{pSF}%</td><td className={pc(pFin, 15, 8)}>{pFin}%</td><td><Bar p={p1} col="#f59e0b" /></td><td><Bar p={p2} col="#94a3b8" /></td><td><Bar p={p3} col="#cd7c2f" /></td><td className={pc(pPod, 25, 12)}>{pPod}%</td></tr> })}
    </tbody></table></div>
  )
}

// ══════════════════════════════════════
// O16 DETAIL TABLES
// ══════════════════════════════════════
function O16PouleRes({ data, ss, N, myTeam }) {
  const pk = POULE_ORDER_16.filter(id => data[id])
  return pk.map(id => {
    const poule = data[id], pa = ss[id]
    const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])
    return (
      <div key={id}>
        <div className="poule-sim-label">Poule {id}<span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{poule.remaining.length} wedstr. rest</span></div>
        <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>#</th><th>Team</th><th>PT</th><th>DS</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
          {order.map((idx, rank) => {
            const p1 = pct(pa[idx][0], N), p2 = pct(pa[idx][1], N), top2 = p1 + p2, isMy = poule.teams[idx] === myTeam
            return <tr key={idx} className={isMy ? 'row-my' : p1 > 50 ? 'row-gold' : ''}><td style={{ color: '#aaa', fontSize: 11 }}>{rank + 1}</td><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{poule.teams[idx]}</td><td style={{ textAlign: 'right', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{poule.pts[idx]}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: poule.ds[idx] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[idx] >= 0 ? '+' : ''}{poule.ds[idx]}</td><td className={pc(p1, 50, 20)}>{p1}%</td><td className={pc(p2, 40, 20)}>{p2}%</td><td className={pc(top2, 60, 30)}>{top2}%</td></tr>
          })}
        </tbody></table></div>
      </div>
    )
  })
}

function O16FinRes({ results, N, myTeam }) {
  return (
    <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(KF)</th><th>P(HF)</th><th>P(finale)</th><th>P(1e 🥇)</th><th>P(2e 🥈)</th></tr></thead><tbody>
      {Object.keys(results.fin).sort((a, b) => results.fin[b].p1 - results.fin[a].p1).filter(t => results.fin[t].kf / N > 0.02).map(t => {
        const s = results.fin[t], pKF = pct(s.kf, N), pHF = pct(s.hf, N), pFin = pct(s.finalist, N), p1 = pct(s.p1, N), p2 = pct(s.p2, N), isMy = t === myTeam
        return <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td><td className={pc(pKF, 30, 15)}>{pKF}%</td><td className={pc(pHF, 20, 10)}>{pHF}%</td><td className={pc(pFin, 15, 8)}>{pFin}%</td><td><Bar p={p1} col="#f59e0b" /></td><td><Bar p={p2} col="#94a3b8" /></td></tr>
      })}
    </tbody></table></div>
  )
}

// ══════════════════════════════════════
// MAIN: unified SimTab
// ══════════════════════════════════════
export default function SimTab({ data, myTeam, effectiveComp }) {
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14
  const myMatches = useMemo(() => myTeam ? findMyMatches(data, myTeam, pouleOrder) : [], [data, myTeam, pouleOrder])

  const [N, setN] = useState(20000)
  const [locks, setLocks] = useState({})
  const [results, setResults] = useState(null)
  const [baseResults, setBaseResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [simNote, setSimNote] = useState('')
  const [subTab, setSubTab] = useState(o16 ? 'poules' : 'super')

  const hasLocks = Object.keys(locks).length > 0

  function run(currentLocks) {
    const simLocks = currentLocks !== undefined ? currentLocks : buildSimLocks(myMatches, locks)
    setRunning(true)
    setTimeout(() => {
      const r = o16 ? runSimO16(data, N, 0, simLocks) : runSimO14(data, N, 0, simLocks)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

  // Run baseline + initial on mount
  useEffect(() => {
    const base = o16 ? runSimO16(data, N, 0) : runSimO14(data, N, 0)
    setBaseResults(base)
    setResults(base)
    setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
  }, [])

  function onToggle(lockKey, outcome) {
    const newLocks = { ...locks }
    if (outcome === null || locks[lockKey] === outcome) delete newLocks[lockKey]
    else newLocks[lockKey] = outcome
    setLocks(newLocks)
    // Auto-run with new locks
    const simLocks = buildSimLocks(myMatches, newLocks)
    setRunning(true)
    setTimeout(() => {
      const r = o16 ? runSimO16(data, N, 0, simLocks) : runSimO14(data, N, 0, simLocks)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

  function onSetAll(outcome) {
    const newLocks = {}
    if (outcome !== null) { for (const m of myMatches) newLocks[m.lockKey] = outcome }
    setLocks(newLocks)
    const simLocks = buildSimLocks(myMatches, newLocks)
    setRunning(true)
    setTimeout(() => {
      const r = o16 ? runSimO16(data, N, 0, simLocks) : runSimO14(data, N, 0, simLocks)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

  const subTabs = o16
    ? [['poules', 'Poules'], ['eindkansen', 'Eindkansen']]
    : [['super', 'Super-poules'], ['nk', 'NK Poulefase'], ['eindkansen', 'Eindkansen']]

  return (
    <div>
      {/* What-if panel */}
      <WhatIfPanel myTeam={myTeam} myMatches={myMatches} locks={locks} onToggle={onToggle} onSetAll={onSetAll} />

      {/* NK chances for focus club */}
      <NKChances myTeam={myTeam} results={results} baseResults={baseResults} N={N} o16={o16} hasLocks={hasLocks} />

      {/* Controls */}
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value, 10))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <button className="run-btn" onClick={() => run()} disabled={running}>{running ? 'Bezig...' : 'Herbereken'}</button>
      </div>

      {/* Detail sub-tabs */}
      <div className="sub-tabs">
        {subTabs.map(([id, lbl]) => (
          <button key={id} className={`sub-tab ${subTab === id ? 'active' : ''}`} onClick={() => setSubTab(id)}>{lbl}</button>
        ))}
      </div>

      {results && <>
        {!o16 && subTab === 'super' && <O14SuperRes data={data} ss={results.ss} N={N} myTeam={myTeam} />}
        {!o16 && subTab === 'nk' && <O14NKRes results={results} N={N} myTeam={myTeam} />}
        {!o16 && subTab === 'eindkansen' && <O14FinRes results={results} N={N} myTeam={myTeam} />}
        {o16 && subTab === 'poules' && <O16PouleRes data={data} ss={results.ss} N={N} myTeam={myTeam} />}
        {o16 && subTab === 'eindkansen' && <O16FinRes results={results} N={N} myTeam={myTeam} />}
      </>}

      {simNote && <div className="sim-note">{simNote}</div>}
    </div>
  )
}
