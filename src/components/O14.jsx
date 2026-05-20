import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { NK14_SLOTS, POULE_ORDER_14 } from '../constants'
import { runSimO14 } from '../simulation'
import { PouleCard, pct, pc, Bar } from './Shared'

const resolveMatchTeam = (slot2t, teamRef) => slot2t[teamRef] || teamRef

const buildNkPhase = (data, pk) => {
  const nkA = []
  const nkB = []
  const slot2t = {}

  pk.forEach(id => {
    const [team1, team2] = data[id].teams
    const [slot1, slot2] = NK14_SLOTS[id]
    const origin1 = `${id} nr 1`
    const origin2 = `${id} nr 2`

    ;(slot1 === 'A' ? nkA : nkB).push({ team: team1, origin: origin1 })
    ;(slot2 === 'A' ? nkA : nkB).push({ team: team2, origin: origin2 })

    slot2t[origin1] = team1
    slot2t[origin2] = team2
  })

  return { nkA, nkB, slot2t }
}

function MatchRow({ match, slot2t, myTeam }) {
  const home = resolveMatchTeam(slot2t, match.home)
  const away = resolveMatchTeam(slot2t, match.away)
  const isMyHome = home === myTeam
  const isMyAway = away === myTeam

  return (
    <div className="match-row" style={(isMyHome || isMyAway) ? { background: '#eff6ff' } : {}}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{match.time}</div>
      <div className="match-teams">
        <div className="match-team right" style={isMyHome ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
          {home}<span className="origin"> {match.home}</span>
        </div>
        <div className="match-vs">vs</div>
        <div className="match-team" style={isMyAway ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
          {away}<span className="origin"> {match.away}</span>
        </div>
      </div>
      {match.field && <span className="origin" style={{ flexShrink: 0 }}>{match.field}</span>}
    </div>
  )
}

function ScheduleSection({ schedule, times, headerClass, label, slot2t, myTeam, filterMyTeam }) {
  const filtered = filterMyTeam && myTeam
    ? schedule.filter(match => {
        const home = resolveMatchTeam(slot2t, match.home)
        const away = resolveMatchTeam(slot2t, match.away)
        return home === myTeam || away === myTeam
      })
    : schedule

  const roundTimes = [...new Set(filtered.map(m => m.time))]
  const timeToRound = Object.fromEntries((times || []).map((time, index) => [time, index + 1]))

  return (
    <div className="card">
      <div className={`card-header ${headerClass}`}>{label}</div>
      {roundTimes.map((time, index) => {
        const matches = filtered.filter(m => m.time === time)
        return (
          <div key={time}>
            <div style={{
              padding: '5px 12px',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'DM Mono',monospace",
              color: '#555',
              background: '#f0ede8',
              borderBottom: '1px solid #e0ddd8',
              borderTop: index > 0 ? '1px solid #e0ddd8' : 'none',
              letterSpacing: '.5px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Ronde {timeToRound[time] || index + 1}</span>
              <span style={{ fontWeight: 400, color: '#999' }}>{time}</span>
            </div>
            {matches.map((match, i) => <MatchRow key={i} match={match} slot2t={slot2t} myTeam={myTeam} />)}
          </div>
        )
      })}
    </div>
  )
}

function NkPhaseTable({ label, entries, headerClass, myTeam }) {
  return (
    <div className="card">
      <div className={`card-header ${headerClass}`}>{label}</div>
      <table>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} style={entry.team === myTeam ? { background: '#eff6ff' } : {}}>
              <td className="td-rank">{i + 1}</td>
              <td style={entry.team === myTeam ? { fontWeight: 600 } : {}}>
                {entry.team}<span className="origin"> {entry.origin}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function finalTypeLabel(type) {
  if (type === 'Halve Finales') return 'HF'
  if (type === '3e/4e plaats') return '3e/4e'
  return '🏆'
}

export function O14OverzichtTab({ data, filteredData, myTeam, nkSchedule }) {
  const pk = useMemo(() => POULE_ORDER_14.filter(id => data[id]), [data])
  const displayPk = useMemo(() => filteredData ? POULE_ORDER_14.filter(id => filteredData[id]) : pk, [filteredData, pk])
  const { nkA, nkB, slot2t } = useMemo(() => buildNkPhase(data, pk), [data, pk])
  const myNKPoule = myTeam
    ? nkA.some(e => e.team === myTeam)
      ? 'A'
      : nkB.some(e => e.team === myTeam)
        ? 'B'
        : null
    : null
  const showA = !filteredData || myNKPoule === 'A'
  const showB = !filteredData || myNKPoule === 'B'
  const gridClass = showA && showB ? 'grid-2' : ''
  const {
    schedA = [],
    schedB = [],
    timesA = [],
    timesB = [],
    finales = [],
    poulefaseDate = '',
    finaleDate = ''
  } = nkSchedule || {}

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Super — huidige stand</div>
      <div className={displayPk.length <= 2 ? 'grid-2' : displayPk.length <= 4 ? 'grid-4' : 'grid-5'}>
        {displayPk.map(id => <PouleCard key={id} id={id} poule={data[id]} myTeam={myTeam} slots={NK14_SLOTS[id]} />)}
      </div>

      <div className="section-label">NK Poulefase — verwachte indeling</div>
      <div className={gridClass}>
        {showA && <NkPhaseTable label={`Poulefase A${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} entries={nkA} headerClass="card-header-a" myTeam={myTeam} />}
        {showB && <NkPhaseTable label={`Poulefase B${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} entries={nkB} headerClass="card-header-b" myTeam={myTeam} />}
      </div>

      {schedA.length > 0 && (
        <>
          <div className="section-label">NK Speelschema{poulefaseDate ? ` · ${poulefaseDate}` : ''}</div>
          <div className={gridClass}>
            {showA && <ScheduleSection schedule={schedA} times={timesA} headerClass="card-header-a" label="Poule A" slot2t={slot2t} myTeam={myTeam} filterMyTeam={Boolean(filteredData && myTeam)} />}
            {showB && <ScheduleSection schedule={schedB} times={timesB} headerClass="card-header-b" label="Poule B" slot2t={slot2t} myTeam={myTeam} filterMyTeam={Boolean(filteredData && myTeam)} />}
          </div>
        </>
      )}

      {finales.length > 0 && (
        <>
          <div className="section-label">NK Finales{finaleDate ? ` · ${finaleDate}` : ''}</div>
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="card-header">Halve finales & Finale</div>
            {finales.map((finale, i) => (
              <div key={i} className="match-row" style={finale.type === 'Finale' ? { borderTop: '1px solid #e0ddd8' } : {}}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{finale.time}</div>
                <div className="match-teams">
                  <div className="match-team right"><strong>{finale.home}</strong></div>
                  <div className="match-vs">vs</div>
                  <div className="match-team"><strong>{finale.away}</strong></div>
                </div>
                <span className="origin">{finalTypeLabel(finale.type)}</span>
                {finale.field && <span className="origin">{finale.field}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function O14SimTab({ data, myTeam }) {
  const [N, setN] = useState(20000)
  const [ha, setHa] = useState(0)
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [simNote, setSimNote] = useState('')
  const [subTab, setSubTab] = useState('super')

  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const r = runSimO14(data, N, ha)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${ha === 0 ? 'geen thuisvoordeel' : `thuis ${ha}%`} · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }, [data, N, ha])

  useEffect(() => { run() }, [run])

  return (
    <div>
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value, 10))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <div className="divider-v"></div>
        <span className="ctrl-label">Thuisvoordeel:</span>
        <input type="range" min="0" max="40" step="1" value={ha} onChange={e => setHa(parseInt(e.target.value, 10))} style={{ width: 140 }} />
        <span className="ctrl-val">{ha}%</span>
        <button className="run-btn" onClick={run} disabled={running}>{running ? 'Bezig...' : 'Herbereken'}</button>
      </div>
      <div className="sub-tabs">
        {['super', 'nk', 'finales'].map(t => (
          <button key={t} className={`sub-tab ${subTab === t ? 'active' : ''}`} onClick={() => setSubTab(t)}>
            {t === 'super' ? 'Super-poules' : t === 'nk' ? 'NK Poulefase' : 'Eindkansen'}
          </button>
        ))}
      </div>
      {results && subTab === 'super' && <SuperRes data={data} ss={results.ss} N={N} myTeam={myTeam} />}
      {results && subTab === 'nk' && <NKRes data={data} results={results} N={N} myTeam={myTeam} />}
      {results && subTab === 'finales' && <FinRes data={data} results={results} N={N} myTeam={myTeam} />}
      {simNote && <div className="sim-note">{simNote}</div>}
    </div>
  )
}

function SuperRes({ data, ss, N, myTeam }) {
  const pk = POULE_ORDER_14.filter(id => data[id])

  return pk.map(id => {
    const poule = data[id]
    const pa = ss[id]
    const sl = NK14_SLOTS[id]
    const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])

    return (
      <div key={id}>
        <div className="poule-sim-label">
          Poule {id}
          <span className={`nk-badge nk-${sl[0].toLowerCase()}`}>#1→NK {sl[0]}</span>
          <span className={`nk-badge nk-${sl[1].toLowerCase()}`}>#2→NK {sl[1]}</span>
        </div>
        <div className="sim-table-wrap">
          <table className="sim-table">
            <thead>
              <tr><th>#</th><th>Team</th><th>PT</th><th>DS</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr>
            </thead>
            <tbody>
              {order.map((idx, rank) => {
                const p1 = pct(pa[idx][0], N)
                const p2 = pct(pa[idx][1], N)
                const top2 = p1 + p2
                const isMy = poule.teams[idx] === myTeam
                return (
                  <tr key={idx} className={isMy ? 'row-my' : p1 > 50 ? 'row-gold' : ''}>
                    <td style={{ color: '#aaa', fontSize: 11 }}>{rank + 1}</td>
                    <td className="team" style={isMy ? { fontWeight: 700 } : {}}>{poule.teams[idx]}</td>
                    <td style={{ textAlign: 'right', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{poule.pts[idx]}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: poule.ds[idx] >= 0 ? '#16a34a' : '#dc2626' }}>
                      {poule.ds[idx] >= 0 ? '+' : ''}{poule.ds[idx]}
                    </td>
                    <td className={pc(p1, 50, 20)}>{p1}%</td>
                    <td className={pc(p2, 40, 20)}>{p2}%</td>
                    <td className={pc(top2, 60, 30)}>{top2}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  })
}

function NKRes({ results, N, myTeam }) {
  const { nkAp, nkBp, nkAa, nkBa } = results

  const renderGroup = (label, pm, am, badgeBg, badgeColor) => {
    const teams = Object.keys(pm)
      .sort((a, b) => (am[b] || 0) - (am[a] || 0))
      .filter(t => (am[t] || 0) / N > 0.01)

    return (
      <div key={label}>
        <div className="poule-sim-label">
          <span style={{ background: badgeBg, color: badgeColor, padding: '2px 10px', borderRadius: 99, fontSize: 11 }}>
            NK Poulefase {label}
          </span>
        </div>
        <div className="sim-table-wrap">
          <table className="sim-table">
            <thead>
              <tr><th>Team</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr>
            </thead>
            <tbody>
              {teams.map(t => {
                const app = am[t] || 0
                const pos = pm[t] || Array(5).fill(0)
                const p1 = pct(pos[0], N)
                const p2 = pct(pos[1], N)
                const top2 = p1 + p2
                const isMy = t === myTeam
                return (
                  <tr key={t} className={isMy ? 'row-my' : p1 >= 15 ? 'row-gold' : ''}>
                    <td className="team" style={isMy ? { fontWeight: 700 } : {}}>
                      {t}{pct(app, N) < 99 && <span className="origin"> kwal.{pct(app, N)}%</span>}
                    </td>
                    <td className={pc(p1, 15, 8)}>{p1}%</td>
                    <td className={pc(p2, 15, 8)}>{p2}%</td>
                    <td className={pc(top2, 30, 15)}>{top2}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <>
      {renderGroup('A', nkAp, nkAa, '#dbeafe', '#1d4ed8')}
      {renderGroup('B', nkBp, nkBa, '#dcfce7', '#15803d')}
    </>
  )
}

function FinRes({ results, N, myTeam }) {
  const teams = Object.keys(results.fin)
    .sort((a, b) => results.fin[b].p1 - results.fin[a].p1)
    .filter(t => results.fin[t].kf / N > 0.02)

  return (
    <div className="sim-table-wrap">
      <table className="sim-table">
        <thead>
          <tr><th>Team</th><th>P(KF)</th><th>P(HF)</th><th>P(finale)</th><th>P(1e 🥇)</th><th>P(2e 🥈)</th></tr>
        </thead>
        <tbody>
          {teams.map(t => {
            const s = results.fin[t]
            const pKF = pct(s.kf, N)
            const pHF = pct(s.hf, N)
            const pFin = pct(s.finalist, N)
            const p1 = pct(s.p1, N)
            const p2 = pct(s.p2, N)
            const isMy = t === myTeam

            return (
              <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}>
                <td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td>
                <td className={pc(pKF, 30, 15)}>{pKF}%</td>
                <td className={pc(pHF, 20, 10)}>{pHF}%</td>
                <td className={pc(pFin, 15, 8)}>{pFin}%</td>
                <td><Bar p={p1} col="#f59e0b" /></td>
                <td><Bar p={p2} col="#94a3b8" /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}