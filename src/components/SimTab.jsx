import React, { useState, useEffect, useMemo } from 'react'
import { NK14_SLOTS, POULE_ORDER_14, POULE_ORDER_16, IS_O16 } from '../constants'
import { NK_SCHEDULES } from '../data/nk-schedules'
import { runSimO14, runSimO16, predictMatches } from '../simulation'
import { pct, pc, Bar, fmtMatchDate } from './Shared'

// ══════════════════════════════════════
// MATCH DATA HELPERS
// ══════════════════════════════════════
function findAllMatchesByRound(data, pouleOrder) {
  const rounds = {}
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    const mpr = Math.floor(poule.teams.length / 2)
    const lr = poule.matches_played && poule.matches_played.length > 0
      ? Math.max(...poule.matches_played.map(m => parseInt(m.round) || 0)) : 0
    for (let i = 0; i < poule.remaining.length; i++) {
      const [h, a, date] = poule.remaining[i]
      const roundNum = lr + Math.floor(i / mpr) + 1
      const roundKey = `${pouleId}_R${roundNum}`
      if (!rounds[roundKey]) rounds[roundKey] = { pouleId, roundNum, date, matches: [] }
      rounds[roundKey].matches.push({ h, a, date, lockKey: `${h}_${a}` })
      if (!rounds[roundKey].date && date) rounds[roundKey].date = date
    }
  }
  return Object.values(rounds).sort((a, b) => {
    if (a.pouleId !== b.pouleId) return a.pouleId.localeCompare(b.pouleId)
    return a.roundNum - b.roundNum
  })
}

// Locks are always from HOME team perspective
function buildAllSimLocks(uiLocks) {
  const simLocks = {}
  for (const [key, val] of Object.entries(uiLocks)) {
    if (val) simLocks[key] = val
  }
  return simLocks
}

// ══════════════════════════════════════
// FOCUS MODE: WhatIfPanel (compact, for focus club matches only)
// ══════════════════════════════════════
const OUTCOMES = [
  { key: null, label: '?', color: '#888', bg: '#f0ede8', title: 'Random' },
  { key: 'W', label: 'W', color: '#16a34a', bg: '#dcfce7', title: 'Winst' },
  { key: 'D', label: 'G', color: '#b45309', bg: '#fef3c7', title: 'Gelijk' },
  { key: 'L', label: 'V', color: '#dc2626', bg: '#fee2e2', title: 'Verlies' },
]

// ══════════════════════════════════════
// POULE CARDS: remaining matches with outcome picker, one card per poule
// ══════════════════════════════════════
function RemainingPouleCards({ data, pouleIds, myTeam, locks, onToggle, onSetRound, onPredict, onResetAll }) {
  const lockedCount = Object.keys(locks).filter(k => locks[k]).length
  const gridCls = pouleIds.length <= 2 ? 'grid-2' : pouleIds.length <= 4 ? 'grid-4' : 'grid-5'

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Resterende wedstrijden — klik om resultaat in te stellen</span>
        {lockedCount > 0 && <button className="whatif-preset" onClick={onResetAll} style={{ background: '#f0ede8', color: '#888', padding: '3px 8px', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>Reset alles ({lockedCount})</button>}
      </div>
      <div className={gridCls}>
        {pouleIds.map(pouleId => {
          const poule = data[pouleId]
          if (!poule || poule.remaining.length === 0) return null
          const mpr = Math.floor(poule.teams.length / 2)
          const ma = poule.matches_played || []
          const lr = ma.length > 0 ? Math.max(...ma.map(m => parseInt(m.round) || 0)) : 0
          const rounds = []
          if (mpr > 0) {
            for (let i = 0; i < poule.remaining.length; i += mpr) {
              const ms = poule.remaining.slice(i, i + mpr)
              const roundNum = lr + Math.floor(i / mpr) + 1
              rounds.push({
                pouleId, roundNum,
                date: ms[0] && ms[0][2],
                matches: ms.map(([h, a, date]) => ({ h, a, date, lockKey: `${h}_${a}` }))
              })
            }
          }

          return (
            <div key={pouleId} className="card">
              <div className="card-header">
                Poule {pouleId}
                <span className="played-count">{rounds.length > 0 ? `nog ${rounds.length} ronde${rounds.length > 1 ? 's' : ''}` : '✓ klaar'}</span>
              </div>
              {rounds.map(round => {
                const dateStr = fmtMatchDate(round.date)
                return (
                  <div key={round.roundNum}>
                    <div style={{
                      padding: '5px 12px', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace",
                      color: '#854d0e', background: '#fef9c3', borderBottom: '1px solid #fde68a', borderTop: '1px solid #fde68a',
                      letterSpacing: '.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>Ronde {round.roundNum}{dateStr ? ` · ${dateStr}` : ''}</span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'W')} title="Thuis wint" style={{ background: '#dcfce7', color: '#16a34a' }}>T</div>
                        <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'D')} title="Gelijk" style={{ background: '#fef3c7', color: '#b45309' }}>G</div>
                        <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'L')} title="Uit wint" style={{ background: '#fee2e2', color: '#dc2626' }}>U</div>
                        <div className="whatif-preset-sm" onClick={() => onSetRound(round, null)} title="Reset" style={{ background: '#f0ede8', color: '#888' }}>?</div>
                        <div className="whatif-preset-sm" onClick={() => onPredict(round)} title="Voorspel meest waarschijnlijke uitslagen" style={{ background: '#dbeafe', color: '#2563eb', fontStyle: 'italic' }}>✦</div>
                      </div>
                    </div>
                    {round.matches.map(m => {
                      const locked = locks[m.lockKey] || null
                      const isMy = m.h === myTeam || m.a === myTeam
                      return (
                        <div key={m.lockKey} className="match-row" style={{ background: isMy && !locked ? '#eff6ff' : 'transparent', padding: '4px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <div style={{
                              flex: 1, textAlign: 'right', padding: '5px 8px', fontSize: 12,
                              fontWeight: m.h === myTeam ? 600 : 400,
                              background: locked === 'W' ? '#dcfce7' : 'transparent',
                              borderRadius: '4px 0 0 4px', cursor: 'pointer',
                            }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'W' ? null : 'W')} title={`${m.h} wint`}>
                              {m.h}
                            </div>
                            <div style={{
                              padding: '5px 10px', fontSize: 10, color: locked === 'D' ? '#b45309' : '#ccc',
                              background: locked === 'D' ? '#fef3c7' : 'transparent',
                              cursor: 'pointer', fontWeight: 700, textAlign: 'center', minWidth: 30,
                            }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'D' ? null : 'D')} title="Gelijk">
                              {locked === 'D' ? 'G' : 'vs'}
                            </div>
                            <div style={{
                              flex: 1, textAlign: 'left', padding: '5px 8px', fontSize: 12,
                              fontWeight: m.a === myTeam ? 600 : 400,
                              background: locked === 'L' ? '#dcfce7' : 'transparent',
                              borderRadius: '0 4px 4px 0', cursor: 'pointer',
                            }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'L' ? null : 'L')} title={`${m.a} wint`}>
                              {m.a}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// EXPECTED STANDINGS (with locks applied)
// ══════════════════════════════════════
function getExpectedStandings(data, locks, pouleOrder) {
  const result = {}
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    const adjusted = poule.teams.map((team, i) => ({
      team, pts: poule.pts[i], ds: poule.ds[i], delta: 0
    }))
    for (const [h, a] of poule.remaining) {
      const lock = locks[`${h}_${a}`]
      if (!lock) continue
      const hi = poule.teams.indexOf(h), ai = poule.teams.indexOf(a)
      if (hi < 0 || ai < 0) continue
      if (lock === 'W') adjusted[hi].delta += 3
      else if (lock === 'D') { adjusted[hi].delta += 1; adjusted[ai].delta += 1 }
      else if (lock === 'L') adjusted[ai].delta += 3
    }
    adjusted.forEach(s => { s.newPts = s.pts + s.delta })
    adjusted.sort((a, b) => b.newPts !== a.newPts ? b.newPts - a.newPts : b.ds - a.ds)
    result[pouleId] = adjusted
  }
  return result
}

// ══════════════════════════════════════
// O14 NK PHASE: Poulefase matches with real team names
// ══════════════════════════════════════
function O14NKPhaseCards({ data, locks, myTeam, nkSchedule, effectiveComp, onToggle, onSetRound, onPredict }) {
  const expected = useMemo(() => getExpectedStandings(data, locks, POULE_ORDER_14), [data, locks])
  if (!nkSchedule) return null

  // Build slot→team mapping from expected standings
  const slot2t = {}
  for (const id of POULE_ORDER_14) {
    if (!expected[id]) continue
    slot2t[`${id} nr 1`] = expected[id][0]?.team || `${id} nr 1`
    slot2t[`${id} nr 2`] = expected[id][1]?.team || `${id} nr 2`
  }

  const { schedA, schedB, timesA, timesB, poulefaseDate } = nkSchedule

  // Collect teams per NK poule
  const nkTeamsA = [...new Set(schedA.flatMap(m => [slot2t[m.home] || m.home, slot2t[m.away] || m.away]))]
  const nkTeamsB = [...new Set(schedB.flatMap(m => [slot2t[m.home] || m.home, slot2t[m.away] || m.away]))]

  // Convert NK schedule to rounds with lockKeys
  const buildNKRounds = (schedule, times, pouleLabel) => {
    const rounds = []
    for (let ri = 0; ri < times.length; ri++) {
      const time = times[ri]
      const ms = schedule.filter(m => m.time === time)
      if (!ms.length) continue
      rounds.push({
        pouleId: 'NK' + pouleLabel, roundNum: ri + 1, date: poulefaseDate || '', time,
        matches: ms.map(m => ({
          h: slot2t[m.home] || m.home, a: slot2t[m.away] || m.away,
          lockKey: `nk_${pouleLabel}_${m.home}_${m.away}`,
          slotHome: m.home, slotAway: m.away,
        }))
      })
    }
    return rounds
  }

  const roundsA = buildNKRounds(schedA, timesA, 'A')
  const roundsB = buildNKRounds(schedB, timesB, 'B')

  // Calculate NK poule standings from locks
  function calcNKStandings(teams, rounds) {
    const pts = {}, ds = {}
    teams.forEach(t => { pts[t] = 0; ds[t] = 0 })
    for (const round of rounds) {
      for (const m of round.matches) {
        const lock = locks[m.lockKey]
        if (!lock) continue
        if (lock === 'W') { pts[m.h] = (pts[m.h] || 0) + 3 }
        else if (lock === 'D') { pts[m.h] = (pts[m.h] || 0) + 1; pts[m.a] = (pts[m.a] || 0) + 1 }
        else if (lock === 'L') { pts[m.a] = (pts[m.a] || 0) + 3 }
      }
    }
    return teams.map(t => ({ team: t, pts: pts[t] || 0, ds: ds[t] || 0 }))
      .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds - a.ds)
  }

  // Build a fake poule for predict
  function buildFakePoule(teams, rounds) {
    const remaining = []
    for (const round of rounds) {
      for (const m of round.matches) { remaining.push([m.h, m.a, '']) }
    }
    return { teams, pts: teams.map(() => 0), ds: teams.map(() => 0), remaining }
  }

  const NKPouleCard = ({ teams, rounds, label, headerClass }) => {
    const standings = calcNKStandings(teams, rounds)
    const hasNKLocks = rounds.some(r => r.matches.some(m => locks[m.lockKey]))
    const totalRounds = rounds.length

    return (
      <div className="card">
        <div className={`card-header ${headerClass}`}>
          NK Poulefase {label}{poulefaseDate ? ` · ${poulefaseDate}` : ''}
          <span className="played-count">nog {totalRounds} rondes</span>
        </div>

        {/* Standings */}
        <table><tbody>
          {standings.map((s, i) => {
            const isMy = s.team === myTeam
            return (
              <tr key={s.team} style={isMy ? { background: '#eff6ff' } : {}}>
                <td className="td-rank">{i + 1}</td>
                <td style={{ padding: '5px 12px', fontSize: 12.5, fontWeight: isMy ? 600 : 400 }}>{s.team}</td>
                <td className="td-pts">{s.pts > 0 ? s.pts : hasNKLocks ? '0' : '-'}</td>
              </tr>
            )
          })}
        </tbody></table>

        {/* Rounds */}
        {rounds.map(round => (
          <div key={round.roundNum}>
            <div style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace",
              color: '#854d0e', background: '#fef9c3', borderBottom: '1px solid #fde68a', borderTop: '1px solid #fde68a',
              letterSpacing: '.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>Ronde {round.roundNum} · {round.time}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'W')} title="Thuis wint" style={{ background: '#dcfce7', color: '#16a34a' }}>T</div>
                <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'D')} title="Gelijk" style={{ background: '#fef3c7', color: '#b45309' }}>G</div>
                <div className="whatif-preset-sm" onClick={() => onSetRound(round, 'L')} title="Uit wint" style={{ background: '#fee2e2', color: '#dc2626' }}>U</div>
                <div className="whatif-preset-sm" onClick={() => onSetRound(round, null)} title="Reset" style={{ background: '#f0ede8', color: '#888' }}>?</div>
                <div className="whatif-preset-sm" onClick={() => onPredict({ ...round, pouleId: label })} title="Voorspel" style={{ background: '#dbeafe', color: '#2563eb', fontStyle: 'italic' }}>✦</div>
              </div>
            </div>
            {round.matches.map(m => {
              const locked = locks[m.lockKey] || null
              const isMy = m.h === myTeam || m.a === myTeam
              return (
                <div key={m.lockKey} className="match-row" style={{ background: isMy && !locked ? '#eff6ff' : 'transparent', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      flex: 1, textAlign: 'right', padding: '5px 8px', fontSize: 12,
                      fontWeight: m.h === myTeam ? 600 : 400,
                      background: locked === 'W' ? '#dcfce7' : 'transparent',
                      borderRadius: '4px 0 0 4px', cursor: 'pointer',
                    }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'W' ? null : 'W')}>
                      {m.h}
                    </div>
                    <div style={{
                      padding: '5px 10px', fontSize: 10, color: locked === 'D' ? '#b45309' : '#ccc',
                      background: locked === 'D' ? '#fef3c7' : 'transparent',
                      cursor: 'pointer', fontWeight: 700, textAlign: 'center', minWidth: 30,
                    }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'D' ? null : 'D')}>
                      {locked === 'D' ? 'G' : 'vs'}
                    </div>
                    <div style={{
                      flex: 1, textAlign: 'left', padding: '5px 8px', fontSize: 12,
                      fontWeight: m.a === myTeam ? 600 : 400,
                      background: locked === 'L' ? '#dcfce7' : 'transparent',
                      borderRadius: '0 4px 4px 0', cursor: 'pointer',
                    }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'L' ? null : 'L')}>
                      {m.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="section-label">NK Poulefase — klik om uitslagen in te stellen</div>
      <div className="grid-2">
        <NKPouleCard teams={nkTeamsA} rounds={roundsA} label="A" headerClass="card-header-a" />
        <NKPouleCard teams={nkTeamsB} rounds={roundsB} label="B" headerClass="card-header-b" />
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// O16 NK PHASE: KF matches with real team names
// ══════════════════════════════════════
function O16KFPhaseCard({ data, locks, myTeam, onToggle }) {
  const expected = useMemo(() => getExpectedStandings(data, locks, POULE_ORDER_16), [data, locks])
  const pk = POULE_ORDER_16.filter(id => expected[id])
  if (pk.length < 4) return null

  const nr1s = pk.map(k => ({ team: expected[k][0]?.team, poule: k, pts: (expected[k][0]?.newPts || expected[k][0]?.pts || 0) }))
    .sort((a, b) => b.pts - a.pts)
  const nr2s = pk.map(k => ({ team: expected[k][1]?.team, poule: k, pts: (expected[k][1]?.newPts || expected[k][1]?.pts || 0) }))
    .sort((a, b) => b.pts - a.pts)

  const kfMatches = [
    { label: 'KF 1', h: nr1s[0].team, a: nr2s[3].team, desc: 'Beste #1 vs 4e #2', lockKey: 'nk_kf1' },
    { label: 'KF 2', h: nr1s[1].team, a: nr2s[2].team, desc: '2e #1 vs 3e #2', lockKey: 'nk_kf2' },
    { label: 'KF 3', h: nr1s[2].team, a: nr2s[1].team, desc: '3e #1 vs 2e #2', lockKey: 'nk_kf3' },
    { label: 'KF 4', h: nr1s[3].team, a: nr2s[0].team, desc: '4e #1 vs Beste #2', lockKey: 'nk_kf4' },
  ]

  return (
    <div>
      <div className="section-label">NK Kwartfinales — klik om uitslagen in te stellen</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">Kwartfinales (verwachte indeling)</div>
        {kfMatches.map(m => {
          const locked = locks[m.lockKey] || null
          const isMy = m.h === myTeam || m.a === myTeam
          return (
            <div key={m.lockKey} className="match-row" style={{ background: isMy && !locked ? '#eff6ff' : 'transparent', padding: '4px 0' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 36, padding: '5px 8px' }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  flex: 1, textAlign: 'right', padding: '5px 8px', fontSize: 12,
                  fontWeight: m.h === myTeam ? 600 : 400,
                  background: locked === 'W' ? '#dcfce7' : 'transparent',
                  borderRadius: '4px 0 0 4px', cursor: 'pointer',
                }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'W' ? null : 'W')}>
                  {m.h}
                </div>
                <div style={{
                  padding: '5px 10px', fontSize: 10, color: locked === 'D' ? '#b45309' : '#ccc',
                  background: locked === 'D' ? '#fef3c7' : 'transparent',
                  cursor: 'pointer', fontWeight: 700, textAlign: 'center', minWidth: 30,
                }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'D' ? null : 'D')}>
                  {locked === 'D' ? 'G' : 'vs'}
                </div>
                <div style={{
                  flex: 1, textAlign: 'left', padding: '5px 8px', fontSize: 12,
                  fontWeight: m.a === myTeam ? 600 : 400,
                  background: locked === 'L' ? '#dcfce7' : 'transparent',
                  borderRadius: '0 4px 4px 0', cursor: 'pointer',
                }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'L' ? null : 'L')}>
                  {m.a}
                </div>
              </div>
              <span className="origin" style={{ padding: '0 8px' }}>{m.desc}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function calcAdjustedStandings(data, locks, pouleOrder) {
  if (Object.keys(locks).length === 0) return null
  const results = []
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    // Check if any lock applies to this poule
    let hasLock = false
    for (const [h, a] of poule.remaining) {
      if (locks[`${h}_${a}`]) { hasLock = true; break }
    }
    if (!hasLock) continue

    const adjusted = poule.teams.map((team, i) => ({ team, pts: poule.pts[i], ds: poule.ds[i], delta: 0 }))
    for (const [h, a] of poule.remaining) {
      const lock = locks[`${h}_${a}`]
      if (!lock) continue
      const hi = poule.teams.indexOf(h), ai = poule.teams.indexOf(a)
      if (hi < 0 || ai < 0) continue
      if (lock === 'W') { adjusted[hi].delta += 3 }
      else if (lock === 'D') { adjusted[hi].delta += 1; adjusted[ai].delta += 1 }
      else if (lock === 'L') { adjusted[ai].delta += 3 }
    }
    adjusted.forEach(s => { s.newPts = s.pts + s.delta })
    adjusted.sort((a, b) => b.newPts !== a.newPts ? b.newPts - a.newPts : b.ds - a.ds)
    results.push({ pouleId, standings: adjusted })
  }
  return results.length > 0 ? results : null
}

function AdjustedStandingsCards({ data, locks, pouleOrder, myTeam }) {
  const results = useMemo(() => calcAdjustedStandings(data, locks, pouleOrder), [data, locks, pouleOrder])
  if (!results) return null
  return (
    <div className={results.length > 1 ? 'grid-2' : ''} style={{ marginBottom: 16 }}>
      {results.map(({ pouleId, standings }) => (
        <div key={pouleId} className="card">
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <span>Poule {pouleId} — stand na scenario</span>
          </div>
          <table><tbody>
            {standings.map((s, i) => {
              const isMy = s.team === myTeam
              return (
                <tr key={s.team} style={isMy ? { background: '#eff6ff' } : {}}>
                  <td className="td-rank">{i + 1}</td>
                  <td style={{ padding: '6px 12px', fontSize: 12.5, fontWeight: isMy ? 600 : 400 }}>{s.team}</td>
                  <td style={{ textAlign: 'right', padding: '6px 12px', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
                    {s.pts}
                    {s.delta > 0 && <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 600, marginLeft: 2 }}>+{s.delta}</span>}
                    {s.delta > 0 && <span style={{ color: '#555', marginLeft: 4 }}>= {s.newPts}</span>}
                  </td>
                  <td className="td-ds" style={{ color: s.ds >= 0 ? '#16a34a' : '#dc2626' }}>{s.ds >= 0 ? '+' : ''}{s.ds}</td>
                </tr>
              )
            })}
          </tbody></table>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════
// NK CHANCES (focus club summary)
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
// DETAIL TABLES (O14)
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
    return (<div key={label}><div className="poule-sim-label"><span style={{ background: badgeBg, color: badgeColor, padding: '2px 10px', borderRadius: 99, fontSize: 11 }}>NK Poulefase {label}</span></div>
      <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
        {teams.map(t => { const app = am[t] || 0, pos = pm[t] || Array(5).fill(0), p1 = pct(pos[0], N), p2 = pct(pos[1], N), top2 = p1 + p2, isMy = t === myTeam; return <tr key={t} className={isMy ? 'row-my' : p1 >= 15 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}{pct(app, N) < 99 && <span className="origin"> kwal.{pct(app, N)}%</span>}</td><td className={pc(p1, 15, 8)}>{p1}%</td><td className={pc(p2, 15, 8)}>{p2}%</td><td className={pc(top2, 30, 15)}>{top2}%</td></tr> })}
      </tbody></table></div></div>)
  }
  return <>{renderGroup('A', nkAp, nkAa, '#dbeafe', '#1d4ed8')}{renderGroup('B', nkBp, nkBa, '#dcfce7', '#15803d')}</>
}
function O14FinRes({ results, N, myTeam }) {
  const teams = Object.keys(results.fin).sort((a, b) => results.fin[b].p1 - results.fin[a].p1).filter(t => results.fin[t].appear / N > 0.02)
  return (<div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(HF)</th><th>P(finale)</th><th>P(🥇)</th><th>P(🥈)</th><th>P(🥉)</th><th>P(podium)</th></tr></thead><tbody>
    {teams.map(t => { const s = results.fin[t], pSF = pct(s.sfReach, N), pFin = pct(s.finalist, N), p1 = pct(s.p1, N), p2 = pct(s.p2, N), p3 = pct(s.p3, N), pPod = p1 + p2 + p3, isMy = t === myTeam; return <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td><td className={pc(pSF, 20, 10)}>{pSF}%</td><td className={pc(pFin, 15, 8)}>{pFin}%</td><td><Bar p={p1} col="#f59e0b" /></td><td><Bar p={p2} col="#94a3b8" /></td><td><Bar p={p3} col="#cd7c2f" /></td><td className={pc(pPod, 25, 12)}>{pPod}%</td></tr> })}
  </tbody></table></div>)
}

// ══════════════════════════════════════
// DETAIL TABLES (O16)
// ══════════════════════════════════════
function O16PouleRes({ data, ss, N, myTeam }) {
  const pk = POULE_ORDER_16.filter(id => data[id])
  return pk.map(id => {
    const poule = data[id], pa = ss[id]
    const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])
    return (<div key={id}>
      <div className="poule-sim-label">Poule {id}<span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{poule.remaining.length} wedstr. rest</span></div>
      <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>#</th><th>Team</th><th>PT</th><th>DS</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
        {order.map((idx, rank) => {
          const p1 = pct(pa[idx][0], N), p2 = pct(pa[idx][1], N), top2 = p1 + p2, isMy = poule.teams[idx] === myTeam
          return <tr key={idx} className={isMy ? 'row-my' : p1 > 50 ? 'row-gold' : ''}><td style={{ color: '#aaa', fontSize: 11 }}>{rank + 1}</td><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{poule.teams[idx]}</td><td style={{ textAlign: 'right', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{poule.pts[idx]}</td><td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: poule.ds[idx] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[idx] >= 0 ? '+' : ''}{poule.ds[idx]}</td><td className={pc(p1, 50, 20)}>{p1}%</td><td className={pc(p2, 40, 20)}>{p2}%</td><td className={pc(top2, 60, 30)}>{top2}%</td></tr>
        })}
      </tbody></table></div>
    </div>)
  })
}
function O16FinRes({ results, N, myTeam }) {
  return (<div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(KF)</th><th>P(HF)</th><th>P(finale)</th><th>P(1e 🥇)</th><th>P(2e 🥈)</th></tr></thead><tbody>
    {Object.keys(results.fin).sort((a, b) => results.fin[b].p1 - results.fin[a].p1).filter(t => results.fin[t].kf / N > 0.02).map(t => {
      const s = results.fin[t], pKF = pct(s.kf, N), pHF = pct(s.hf, N), pFin = pct(s.finalist, N), p1 = pct(s.p1, N), p2 = pct(s.p2, N), isMy = t === myTeam
      return <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}><td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td><td className={pc(pKF, 30, 15)}>{pKF}%</td><td className={pc(pHF, 20, 10)}>{pHF}%</td><td className={pc(pFin, 15, 8)}>{pFin}%</td><td><Bar p={p1} col="#f59e0b" /></td><td><Bar p={p2} col="#94a3b8" /></td></tr>
    })}
  </tbody></table></div>)
}

// ══════════════════════════════════════
// MAIN: unified SimTab
// ══════════════════════════════════════
export default function SimTab({ data, myTeam, focusMode, effectiveComp }) {
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14

  // Find which poule the team is in
  const myPouleId = useMemo(() => {
    if (!myTeam) return null
    for (const id of pouleOrder) {
      if (data[id] && data[id].teams.indexOf(myTeam) >= 0) return id
    }
    return null
  }, [data, myTeam, pouleOrder])

  const [N, setN] = useState(20000)
  const [locks, setLocks] = useState({})
  const [results, setResults] = useState(null)
  const [baseResults, setBaseResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [simNote, setSimNote] = useState('')
  const [subTab, setSubTab] = useState(o16 ? 'poules' : 'super')

  const hasLocks = Object.keys(locks).filter(k => locks[k]).length > 0

  function doSim(currentLocks) {
    const simLocks = buildAllSimLocks(currentLocks || locks)
    setRunning(true)
    setTimeout(() => {
      const r = o16 ? runSimO16(data, N, 0, simLocks) : runSimO14(data, N, 0, simLocks)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

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
    doSim(newLocks)
  }

  // Which poules to show: focus mode = only my poule, otherwise all
  const timelinePouleIds = useMemo(() => {
    if (focusMode && myPouleId) return [myPouleId]
    return pouleOrder.filter(id => data[id])
  }, [focusMode, myPouleId, pouleOrder, data])

  function onSetAll(outcome) {
    // Collect all matches from visible poules
    const allMatches = []
    for (const pouleId of timelinePouleIds) {
      const poule = data[pouleId]
      if (!poule) continue
      for (const [h, a] of poule.remaining) {
        allMatches.push({ lockKey: `${h}_${a}` })
      }
    }
    const newLocks = {}
    if (outcome !== null) { for (const m of allMatches) newLocks[m.lockKey] = outcome }
    setLocks(newLocks)
    doSim(newLocks)
  }

  function onSetRound(round, outcome) {
    const newLocks = { ...locks }
    for (const m of round.matches) {
      if (outcome === null) delete newLocks[m.lockKey]
      else newLocks[m.lockKey] = outcome
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  function onPredict(round) {
    const poule = data[round.pouleId]
    if (!poule) return
    const predicted = predictMatches(round.matches, poule)
    const newLocks = { ...locks }
    for (const [key, val] of Object.entries(predicted)) {
      if (val) newLocks[key] = val
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Predict for NK rounds — teams start at equal strength
  function onPredictNK(round) {
    // NK teams have no existing points, so predict based on equal strength
    // Just use random since we have no data — each match is roughly 50/50
    const newLocks = { ...locks }
    for (const m of round.matches) {
      const r = Math.random()
      newLocks[m.lockKey] = r < 0.4 ? 'W' : r < 0.65 ? 'D' : 'L'
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  const subTabs = o16
    ? [['poules', 'Poules'], ['eindkansen', 'Eindkansen']]
    : [['super', 'Super-poules'], ['nk', 'NK Poulefase'], ['eindkansen', 'Eindkansen']]

  return (
    <div>
      {/* Remaining matches with outcome picker — per poule card */}
      <RemainingPouleCards data={data} pouleIds={timelinePouleIds} myTeam={myTeam} locks={locks}
        onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredict} onResetAll={() => onSetAll(null)} />

      {/* Adjusted standings */}
      {hasLocks && <AdjustedStandingsCards data={data} locks={locks} pouleOrder={pouleOrder} myTeam={myTeam} />}

      {/* NK Phase: Poulefase (O14) or KF (O16) with clickable matches */}
      {!o16 && <O14NKPhaseCards data={data} locks={locks} myTeam={myTeam}
        nkSchedule={NK_SCHEDULES[effectiveComp]} effectiveComp={effectiveComp}
        onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredictNK} />}
      {o16 && <O16KFPhaseCard data={data} locks={locks} myTeam={myTeam} onToggle={onToggle} />}

      {/* NK chances for focus club */}
      <NKChances myTeam={myTeam} results={results} baseResults={baseResults} N={N} o16={o16} hasLocks={hasLocks} />

      {/* Controls */}
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value, 10))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <button className="run-btn" onClick={() => doSim()} disabled={running}>{running ? 'Bezig...' : 'Herbereken'}</button>
      </div>

      {/* Detail sub-tabs */}
      <div className="sub-tabs">
        {subTabs.map(([id, lbl]) => <button key={id} className={`sub-tab ${subTab === id ? 'active' : ''}`} onClick={() => setSubTab(id)}>{lbl}</button>)}
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
