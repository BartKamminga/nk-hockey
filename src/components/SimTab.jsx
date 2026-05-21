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
// SECTION HEADER with predict + reset buttons
// ══════════════════════════════════════
function SectionLabel({ label, style, onPredict, onReset }) {
  return (
    <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...style }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {onPredict && <div className="whatif-preset-sm" onClick={onPredict} title="Voorspel alle resterende" style={{ background: '#dbeafe', color: '#2563eb', fontStyle: 'italic' }}>✦</div>}
        {onReset && <div className="whatif-preset-sm" onClick={onReset} title="Reset alles" style={{ background: '#f0ede8', color: '#888' }}>?</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════
// SHARED: SimPouleCard — stand + remaining rounds with outcome picker
// Used for both Super poules and NK Poulefase
// ══════════════════════════════════════
function SimPouleCard({ title, headerClass, teams, basePts, baseDs, rounds, locks, myTeam, onToggle, onSetRound, onPredict, onPredictAll, hideStandings }) {
  // Calculate standings from base + locks
  const pts = {}, ds = {}
  teams.forEach((t, i) => { pts[t] = basePts[i] || 0; ds[t] = baseDs[i] || 0 })
  for (const round of rounds) {
    for (const m of round.matches) {
      const lock = locks[m.lockKey]
      if (!lock) continue
      if (lock === 'W') pts[m.h] = (pts[m.h] || 0) + 3
      else if (lock === 'D') { pts[m.h] = (pts[m.h] || 0) + 1; pts[m.a] = (pts[m.a] || 0) + 1 }
      else if (lock === 'L') pts[m.a] = (pts[m.a] || 0) + 3
    }
  }
  const standings = teams.map((t, i) => ({ team: t, pts: pts[t] || 0, ds: ds[t] || 0, origRank: i }))
    .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds !== a.ds ? b.ds - a.ds : a.origRank - b.origRank)
  const hasAnyBase = basePts.some(p => p > 0)

  const totalRounds = rounds.length
  const completedRounds = rounds.filter(r => r.matches.every(m => locks[m.lockKey])).length
  const openRounds = totalRounds - completedRounds

  return (
    <div className="card">
      <div className={`card-header ${headerClass || ''}`} style={{ justifyContent: 'space-between' }}>
        <span>{title}<span className="played-count" style={{ marginLeft: 8 }}>{openRounds > 0 ? `nog ${openRounds} ronde${openRounds > 1 ? 's' : ''}` : '✓ klaar'}</span></span>
        {openRounds > 0 && <div className="whatif-preset-sm" onClick={onPredictAll} title="Voorspel alle resterende wedstrijden" style={{ background: '#dbeafe', color: '#2563eb', fontStyle: 'italic' }}>✦</div>}
      </div>

      {/* Standings (hidden for KO phases) */}
      {!hideStandings && <table><tbody>
        {standings.map((s, i) => {
          const isMy = s.team === myTeam
          return (
            <tr key={s.team} style={isMy ? { background: '#eff6ff' } : {}}>
              <td className="td-rank">{i + 1}</td>
              <td style={{ padding: '5px 12px', fontSize: 12.5, fontWeight: isMy ? 600 : 400 }}>{s.team}</td>
              <td className="td-pts">{s.pts > 0 ? s.pts : hasAnyBase ? '0' : '-'}</td>
              <td className="td-ds" style={{ color: s.ds >= 0 ? '#16a34a' : '#dc2626' }}>{hasAnyBase ? (s.ds >= 0 ? '+' : '') + s.ds : ''}</td>
            </tr>
          )
        })}
      </tbody></table>}

      {/* Rounds */}
      {rounds.map(round => {
        const dateStr = fmtMatchDate(round.date)
        const timeStr = round.time || ''
        return (
          <div key={round.roundNum}>
            <div style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace",
              color: '#854d0e', background: '#fef9c3', borderBottom: '1px solid #fde68a', borderTop: '1px solid #fde68a',
              letterSpacing: '.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>Ronde {round.roundNum}{dateStr ? ` · ${dateStr}` : ''}{timeStr ? ` · ${timeStr}` : ''}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <div className="whatif-preset-sm" onClick={() => onPredict(round)} title="Voorspel deze ronde" style={{ background: '#dbeafe', color: '#2563eb', fontStyle: 'italic' }}>✦</div>
                <div className="whatif-preset-sm" onClick={() => onSetRound(round, null)} title="Reset ronde" style={{ background: '#f0ede8', color: '#888' }}>?</div>
              </div>
            </div>
            {round.matches.map(m => {
              const locked = locks[m.lockKey] || null
              const isMy = m.h === myTeam || m.a === myTeam
              const ko = m.isKO
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
                    {ko ? (
                      <div style={{
                        padding: '5px 10px', fontSize: 10, color: '#ccc',
                        cursor: locked ? 'pointer' : 'default', fontWeight: 700, textAlign: 'center', minWidth: 30,
                      }} onClick={() => { if (locked) onToggle(m.lockKey, null) }} title={locked ? 'Reset' : ''}>
                        vs
                      </div>
                    ) : (
                      <div style={{
                        padding: '5px 10px', fontSize: 10, color: locked === 'D' ? '#b45309' : '#ccc',
                        background: locked === 'D' ? '#fef3c7' : 'transparent',
                        cursor: 'pointer', fontWeight: 700, textAlign: 'center', minWidth: 30,
                      }} onClick={() => onToggle(m.lockKey, locks[m.lockKey] === 'D' ? null : 'D')}>
                        {locked === 'D' ? 'G' : 'vs'}
                      </div>
                    )}
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
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════
// SUPER POULE CARDS: use SimPouleCard for remaining matches
// ══════════════════════════════════════
function RemainingPouleCards({ data, pouleIds, myTeam, locks, onToggle, onSetRound, onPredict, onPredictAllRounds, onResetAll, onPredictSection, onResetSection }) {
  const gridCls = pouleIds.length <= 2 ? 'grid-2' : pouleIds.length <= 4 ? 'grid-4' : 'grid-5'

  return (
    <div>
      <SectionLabel label="Resterende wedstrijden" style={{ marginTop: 0 }}
        onPredict={onPredictSection} onReset={onResetSection} />
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
          return <SimPouleCard key={pouleId} title={`Poule ${pouleId}`} teams={poule.teams} basePts={poule.pts} baseDs={poule.ds}
            rounds={rounds} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredict}
            onPredictAll={() => onPredictAllRounds(rounds, poule)} />
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
      team, pts: poule.pts[i], ds: poule.ds[i], delta: 0, origRank: i
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
    adjusted.sort((a, b) => b.newPts !== a.newPts ? b.newPts - a.newPts : b.ds !== a.ds ? b.ds - a.ds : a.origRank - b.origRank)
    result[pouleId] = adjusted
  }
  return result
}

// ══════════════════════════════════════
// O14 NK PHASE: Poulefase matches with real team names
// ══════════════════════════════════════
function O14NKPhaseCards({ data, locks, myTeam, nkSchedule, effectiveComp, onToggle, onSetRound, onPredict, onPredictAll, onPredictSection, onResetSection }) {
  const expected = useMemo(() => getExpectedStandings(data, locks, POULE_ORDER_14), [data, locks])
  if (!nkSchedule) return null

  // Build slot→team mapping from expected standings using NK14_SLOTS
  const slot2t = {}
  for (const id of POULE_ORDER_14) {
    if (!expected[id]) continue
    // expected[id] is sorted by points, [0] = nr 1, [1] = nr 2
    slot2t[`${id} nr 1`] = expected[id][0]?.team || `${id} nr 1`
    slot2t[`${id} nr 2`] = expected[id][1]?.team || `${id} nr 2`
  }

  const { schedA, schedB, timesA, timesB, poulefaseDate, finaleDate } = nkSchedule

  // Collect teams per NK poule using NK14_SLOTS mapping
  // NK14_SLOTS[A] = ['A','B'] means: A nr 1 → NK Poule A, A nr 2 → NK Poule B
  const nkTeamsA = [], nkTeamsB = []
  for (const id of POULE_ORDER_14) {
    if (!expected[id]) continue
    const [slot1, slot2] = NK14_SLOTS[id]
    const t1 = expected[id][0]?.team, t2 = expected[id][1]?.team
    if (t1) (slot1 === 'A' ? nkTeamsA : nkTeamsB).push(t1)
    if (t2) (slot2 === 'A' ? nkTeamsA : nkTeamsB).push(t2)
  }

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

  // Calculate NK Poulefase standings from locks to determine HF teams
  function calcNKStandings(teams, rounds) {
    const pts = {}, ds = {}
    teams.forEach(t => { pts[t] = 0; ds[t] = 0 })
    for (const round of rounds) {
      for (const m of round.matches) {
        const lock = locks[m.lockKey]
        if (!lock) continue
        if (lock === 'W') pts[m.h] = (pts[m.h] || 0) + 3
        else if (lock === 'D') { pts[m.h] = (pts[m.h] || 0) + 1; pts[m.a] = (pts[m.a] || 0) + 1 }
        else if (lock === 'L') pts[m.a] = (pts[m.a] || 0) + 3
      }
    }
    return [...teams].sort((a, b) => (pts[b] || 0) !== (pts[a] || 0) ? (pts[b] || 0) - (pts[a] || 0) : (ds[b] || 0) - (ds[a] || 0))
  }

  const allARoundsFilled = roundsA.every(r => r.matches.every(m => locks[m.lockKey]))
  const allBRoundsFilled = roundsB.every(r => r.matches.every(m => locks[m.lockKey]))
  const showHF = allARoundsFilled && allBRoundsFilled

  const stA = showHF ? calcNKStandings(nkTeamsA, roundsA) : []
  const stB = showHF ? calcNKStandings(nkTeamsB, roundsB) : []

  // HF: A nr 1 vs B nr 2, B nr 1 vs A nr 2
  const winner = (lockKey, h, a) => { const l = locks[lockKey]; return l === 'W' ? h : l === 'L' ? a : null }
  const hf1h = showHF ? stA[0] : 'NK A nr 1', hf1a = showHF ? stB[1] : 'NK B nr 2'
  const hf2h = showHF ? stB[0] : 'NK B nr 1', hf2a = showHF ? stA[1] : 'NK A nr 2'
  const hfMatches = [
    { h: hf1h, a: hf1a, lockKey: 'nk_hf1', isKO: true },
    { h: hf2h, a: hf2a, lockKey: 'nk_hf2', isKO: true },
  ]
  const hfTeams = [...new Set(hfMatches.flatMap(m => [m.h, m.a]))]
  const hfRounds = [{ roundNum: 1, date: finaleDate || '', time: '', matches: hfMatches }]

  // Finale + 3e/4e
  const hfW1 = winner('nk_hf1', hf1h, hf1a)
  const hfL1 = winner('nk_hf1', hf1h, hf1a) ? (hfW1 === hf1h ? hf1a : hf1h) : null
  const hfW2 = winner('nk_hf2', hf2h, hf2a)
  const hfL2 = winner('nk_hf2', hf2h, hf2a) ? (hfW2 === hf2h ? hf2a : hf2h) : null
  const showFin = hfW1 && hfW2
  const finMatches = [
    { h: hfW1 || 'Winnaar HF1', a: hfW2 || 'Winnaar HF2', lockKey: 'nk_finale', isKO: true },
  ]
  const fin34Matches = [
    { h: hfL1 || 'Verliezer HF1', a: hfL2 || 'Verliezer HF2', lockKey: 'nk_3e4e', isKO: true },
  ]

  return (
    <div>
      <SectionLabel label="NK Poulefase"
        onPredict={() => onPredictSection([...roundsA, ...roundsB])}
        onReset={() => onResetSection([...roundsA, ...roundsB])} />
      <div className="grid-2">
        <SimPouleCard title={`NK Poulefase A${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} headerClass="card-header-a"
          teams={nkTeamsA} basePts={nkTeamsA.map(() => 0)} baseDs={nkTeamsA.map(() => 0)}
          rounds={roundsA} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredict}
          onPredictAll={() => onPredictAll(roundsA)} />
        <SimPouleCard title={`NK Poulefase B${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} headerClass="card-header-b"
          teams={nkTeamsB} basePts={nkTeamsB.map(() => 0)} baseDs={nkTeamsB.map(() => 0)}
          rounds={roundsB} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredict}
          onPredictAll={() => onPredictAll(roundsB)} />
      </div>

      {showHF && <>
        <SectionLabel label={`NK Halve Finales${finaleDate ? ` · ${finaleDate}` : ''}`}
          onPredict={() => onPredictSection(hfRounds)}
          onReset={() => onResetSection(hfRounds)} />
        <SimPouleCard title="Halve Finales" hideStandings teams={hfTeams} basePts={hfTeams.map(() => 0)} baseDs={hfTeams.map(() => 0)}
          rounds={hfRounds} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
          onPredict={onSetRound} onPredictAll={() => onPredictAll(hfRounds)} />
      </>}

      {showFin && <>
        <SectionLabel label={`NK Finale 🏆${finaleDate ? ` · ${finaleDate}` : ''}`}
          onPredict={() => onPredictSection([{ matches: [...finMatches, ...fin34Matches] }])}
          onReset={() => onResetSection([{ matches: [...finMatches, ...fin34Matches] }])} />
        <div className="grid-2">
          <SimPouleCard title="3e/4e plaats" hideStandings teams={[...new Set(fin34Matches.flatMap(m => [m.h, m.a]))]}
            basePts={[0, 0]} baseDs={[0, 0]}
            rounds={[{ roundNum: 1, date: finaleDate || '', time: '', matches: fin34Matches }]}
            locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
            onPredict={onSetRound} onPredictAll={() => {}} />
          <SimPouleCard title="Finale 🏆" hideStandings teams={[...new Set(finMatches.flatMap(m => [m.h, m.a]))]}
            basePts={[0, 0]} baseDs={[0, 0]}
            rounds={[{ roundNum: 1, date: finaleDate || '', time: '', matches: finMatches }]}
            locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
            onPredict={onSetRound} onPredictAll={() => {}} />
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════
// O16 NK PHASE: KF matches with real team names
// ══════════════════════════════════════
function O16KFPhaseCard({ data, locks, myTeam, onToggle, onSetRound, onPredictAll, onPredictSection, onResetSection }) {
  const expected = useMemo(() => getExpectedStandings(data, locks, POULE_ORDER_16), [data, locks])
  const pk = POULE_ORDER_16.filter(id => expected[id])
  if (pk.length < 4) return null

  const nr1s = pk.map(k => ({ team: expected[k][0]?.team, poule: k, pts: expected[k][0]?.newPts || 0, ds: expected[k][0]?.ds || 0 }))
    .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds - a.ds)
  const nr2s = pk.map(k => ({ team: expected[k][1]?.team, poule: k, pts: expected[k][1]?.newPts || 0, ds: expected[k][1]?.ds || 0 }))
    .sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds - a.ds)

  // KF matches
  const kf = [
    { h: nr1s[0].team, a: nr2s[3].team, lockKey: 'nk_kf1', isKO: true },
    { h: nr1s[1].team, a: nr2s[2].team, lockKey: 'nk_kf2', isKO: true },
    { h: nr1s[2].team, a: nr2s[1].team, lockKey: 'nk_kf3', isKO: true },
    { h: nr1s[3].team, a: nr2s[0].team, lockKey: 'nk_kf4', isKO: true },
  ]
  const kfTeams = [...new Set(kf.flatMap(m => [m.h, m.a]))]
  const kfRounds = [{ roundNum: 1, date: '', time: '', matches: kf }]

  // Resolve KF winners → HF
  const winner = (lockKey, h, a) => { const l = locks[lockKey]; return l === 'W' ? h : l === 'L' ? a : null }
  const kfW1 = winner('nk_kf1', kf[0].h, kf[0].a)
  const kfW2 = winner('nk_kf2', kf[1].h, kf[1].a)
  const kfW3 = winner('nk_kf3', kf[2].h, kf[2].a)
  const kfW4 = winner('nk_kf4', kf[3].h, kf[3].a)

  // HF: W1 vs W4, W2 vs W3
  const hf1h = kfW1 || 'Winnaar KF1', hf1a = kfW4 || 'Winnaar KF4'
  const hf2h = kfW2 || 'Winnaar KF2', hf2a = kfW3 || 'Winnaar KF3'
  const hfMatches = [
    { h: hf1h, a: hf1a, lockKey: 'nk_hf1', isKO: true },
    { h: hf2h, a: hf2a, lockKey: 'nk_hf2', isKO: true },
  ]
  const hfTeams = [...new Set(hfMatches.flatMap(m => [m.h, m.a]))]
  const hfRounds = [{ roundNum: 1, date: '', time: '', matches: hfMatches }]
  const showHF = kfW1 && kfW2 && kfW3 && kfW4

  // Finale: W(HF1) vs W(HF2)
  const hfW1 = winner('nk_hf1', hf1h, hf1a)
  const hfW2 = winner('nk_hf2', hf2h, hf2a)
  const finH = hfW1 || 'Winnaar HF1', finA = hfW2 || 'Winnaar HF2'
  const finMatches = [{ h: finH, a: finA, lockKey: 'nk_finale', isKO: true }]
  const finTeams = [...new Set(finMatches.flatMap(m => [m.h, m.a]))]
  const finRounds = [{ roundNum: 1, date: '', time: '', matches: finMatches }]
  const showFin = hfW1 && hfW2

  return (
    <div>
      <SectionLabel label="NK Kwartfinales"
        onPredict={() => onPredictSection(kfRounds)}
        onReset={() => onResetSection(kfRounds)} />
      <SimPouleCard title="Kwartfinales" hideStandings teams={kfTeams} basePts={kfTeams.map(() => 0)} baseDs={kfTeams.map(() => 0)}
        rounds={kfRounds} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
        onPredict={onSetRound} onPredictAll={() => onPredictAll(kfRounds)} />

      {showHF && <>
        <SectionLabel label="NK Halve Finales"
          onPredict={() => onPredictSection(hfRounds)}
          onReset={() => onResetSection(hfRounds)} />
        <SimPouleCard title="Halve Finales" hideStandings teams={hfTeams} basePts={hfTeams.map(() => 0)} baseDs={hfTeams.map(() => 0)}
          rounds={hfRounds} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
          onPredict={onSetRound} onPredictAll={() => onPredictAll(hfRounds)} />
      </>}

      {showFin && <>
        <SectionLabel label="NK Finale 🏆"
          onPredict={() => onPredictSection(finRounds)}
          onReset={() => onResetSection(finRounds)} />
        <SimPouleCard title="Finale" hideStandings teams={finTeams} basePts={finTeams.map(() => 0)} baseDs={finTeams.map(() => 0)}
          rounds={finRounds} locks={locks} myTeam={myTeam} onToggle={onToggle} onSetRound={onSetRound}
          onPredict={onSetRound} onPredictAll={() => onPredictAll(finRounds)} />
      </>}
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
// ══════════════════════════════════════
// MAIN: unified SimTab
// ══════════════════════════════════════
export default function SimTab({ data, myTeam, effectiveComp }) {
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14

  // Find which poule the team is in (for highlighting only)
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

  const hasLocks = Object.keys(locks).filter(k => locks[k]).length > 0

  function doSim(currentLocks) {
    const simLocks = buildAllSimLocks(currentLocks || locks)
    setRunning(true)
    setTimeout(() => {
      const nkSched = o16 ? null : NK_SCHEDULES[effectiveComp]
      const r = o16 ? runSimO16(data, N, 0, simLocks) : runSimO14(data, N, 0, simLocks, nkSched)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

  useEffect(() => {
    const nkSched = o16 ? null : NK_SCHEDULES[effectiveComp]
    const base = o16 ? runSimO16(data, N, 0) : runSimO14(data, N, 0, null, nkSched)
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

  // Always show all poules (no focus filtering in SimTab)
  const timelinePouleIds = useMemo(() => {
    return pouleOrder.filter(id => data[id])
  }, [pouleOrder, data])

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

  // Predict all unlocked matches across multiple rounds for a poule
  function onPredictAllRounds(rounds, poule) {
    const newLocks = { ...locks }
    for (const round of rounds) {
      const unlocked = round.matches.filter(m => !newLocks[m.lockKey])
      if (unlocked.length === 0) continue
      const predicted = predictMatches(unlocked, poule)
      for (const [key, val] of Object.entries(predicted)) {
        if (val) newLocks[key] = val
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Predict all unlocked NK rounds (equal strength)
  function onPredictAllNK(rounds) {
    const newLocks = { ...locks }
    for (const round of rounds) {
      for (const m of round.matches) {
        if (newLocks[m.lockKey]) continue
        if (m.isKO) {
          newLocks[m.lockKey] = Math.random() < 0.5 ? 'W' : 'L'
        } else {
          const r = Math.random()
          newLocks[m.lockKey] = r < 0.4 ? 'W' : r < 0.65 ? 'D' : 'L'
        }
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Predict for NK rounds — teams start at equal strength
  function onPredictNK(round) {
    const newLocks = { ...locks }
    for (const m of round.matches) {
      if (m.isKO) {
        newLocks[m.lockKey] = Math.random() < 0.5 ? 'W' : 'L'
      } else {
        const r = Math.random()
        newLocks[m.lockKey] = r < 0.4 ? 'W' : r < 0.65 ? 'D' : 'L'
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Section-level predict: predict all unlocked matches in given rounds
  function onPredictSectionNK(rounds) {
    const newLocks = { ...locks }
    for (const round of rounds) {
      for (const m of round.matches) {
        if (newLocks[m.lockKey]) continue
        if (m.isKO) {
          newLocks[m.lockKey] = Math.random() < 0.5 ? 'W' : 'L'
        } else {
          const r = Math.random()
          newLocks[m.lockKey] = r < 0.4 ? 'W' : r < 0.65 ? 'D' : 'L'
        }
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Section-level predict for poule matches (uses team strength)
  function onPredictSectionPoules() {
    const newLocks = { ...locks }
    for (const pouleId of timelinePouleIds) {
      const poule = data[pouleId]
      if (!poule) continue
      const mpr = Math.floor(poule.teams.length / 2)
      const ma = poule.matches_played || []
      const lr = ma.length > 0 ? Math.max(...ma.map(m => parseInt(m.round) || 0)) : 0
      const allMatches = []
      if (mpr > 0) {
        for (let i = 0; i < poule.remaining.length; i++) {
          const [h, a] = poule.remaining[i]
          allMatches.push({ h, a, lockKey: `${h}_${a}` })
        }
      }
      const unlocked = allMatches.filter(m => !newLocks[m.lockKey])
      if (unlocked.length === 0) continue
      const predicted = predictMatches(unlocked, poule)
      for (const [key, val] of Object.entries(predicted)) {
        if (val) newLocks[key] = val
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Section-level reset: clear all locks in given rounds
  function onResetSectionRounds(rounds) {
    const newLocks = { ...locks }
    for (const round of rounds) {
      for (const m of round.matches) {
        delete newLocks[m.lockKey]
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  // Reset all poule locks
  function onResetPoules() {
    const newLocks = { ...locks }
    for (const pouleId of timelinePouleIds) {
      const poule = data[pouleId]
      if (!poule) continue
      for (const [h, a] of poule.remaining) {
        delete newLocks[`${h}_${a}`]
      }
    }
    setLocks(newLocks)
    doSim(newLocks)
  }

  return (
    <div>
      {/* Remaining matches with outcome picker — per poule card */}
      <RemainingPouleCards data={data} pouleIds={timelinePouleIds} myTeam={myTeam} locks={locks}
        onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredict} onPredictAllRounds={onPredictAllRounds}
        onResetAll={() => onSetAll(null)} onPredictSection={onPredictSectionPoules} onResetSection={onResetPoules} />

      {/* NK Phase: Poulefase (O14) or KF (O16) with clickable matches */}
      {!o16 && <O14NKPhaseCards data={data} locks={locks} myTeam={myTeam}
        nkSchedule={NK_SCHEDULES[effectiveComp]} effectiveComp={effectiveComp}
        onToggle={onToggle} onSetRound={onSetRound} onPredict={onPredictNK} onPredictAll={onPredictAllNK}
        onPredictSection={onPredictSectionNK} onResetSection={onResetSectionRounds} />}
      {o16 && <O16KFPhaseCard data={data} locks={locks} myTeam={myTeam}
        onToggle={onToggle} onSetRound={onSetRound} onPredictAll={onPredictAllNK}
        onPredictSection={onPredictSectionNK} onResetSection={onResetSectionRounds} />}

      {/* NK chances for focus club */}
      <NKChances myTeam={myTeam} results={results} baseResults={baseResults} N={N} o16={o16} hasLocks={hasLocks} />

      {/* Controls */}
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value, 10))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <button className="run-btn" onClick={() => doSim()} disabled={running}>{running ? 'Bezig...' : 'Herbereken'}</button>
      </div>

      {/* Eindkansen */}
      {simNote && <div className="sim-note">{simNote}</div>}
    </div>
  )
}
