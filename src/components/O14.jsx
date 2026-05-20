import React, { useState, useEffect, useCallback } from 'react'
import { NK14_SLOTS, POULE_ORDER_14, POS_COLORS } from '../constants'
import { NK_SCHEDULES } from '../data/nk-schedules'
import { runSimO14 } from '../simulation'
import { PouleCard, pct, pc, Bar } from './Shared'

export function O14OverzichtTab({ data, filteredData, myTeam, nkSchedule }) {
  const pk = POULE_ORDER_14.filter(k => data[k])
  const displayPk = filteredData ? POULE_ORDER_14.filter(k => filteredData[k]) : pk
  const nkA = [], nkB = []
  for (const id of pk) {
    const sl = NK14_SLOTS[id], t1 = data[id].teams[0], t2 = data[id].teams[1];
    (sl[0] === 'A' ? nkA : nkB).push({ team: t1, origin: `${id} nr 1` });
    (sl[1] === 'A' ? nkA : nkB).push({ team: t2, origin: `${id} nr 2` })
  }
  const slot2t = {}
  for (const id of pk) { slot2t[`${id} nr 1`] = data[id].teams[0]; slot2t[`${id} nr 2`] = data[id].teams[1] }

  let myNKPoule = null
  if (filteredData && myTeam) {
    for (const e of nkA) { if (e.team === myTeam) myNKPoule = 'A' }
    for (const e of nkB) { if (e.team === myTeam) myNKPoule = 'B' }
  }
  const showA = !filteredData || myNKPoule === 'A'
  const showB = !filteredData || myNKPoule === 'B'

  const MR = ({ m }) => {
    const hT = slot2t[m.home] || m.home, aT = slot2t[m.away] || m.away
    const hMy = hT === myTeam, aMy = aT === myTeam
    return (
      <div className="match-row" style={(hMy || aMy) ? { background: '#eff6ff' } : {}}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{m.time}</div>
        <div className="match-teams">
          <div className="match-team right" style={hMy ? { fontWeight: 600, color: '#1d4ed8' } : {}}>{hT}<span className="origin"> {m.home}</span></div>
          <div className="match-vs">vs</div>
          <div className="match-team" style={aMy ? { fontWeight: 600, color: '#1d4ed8' } : {}}>{aT}<span className="origin"> {m.away}</span></div>
        </div>
        {m.field && <span className="origin" style={{ flexShrink: 0 }}>{m.field}</span>}
      </div>
    )
  }

  const sA = (nkSchedule && nkSchedule.schedA) || [], sB = (nkSchedule && nkSchedule.schedB) || []
  const tA = (nkSchedule && nkSchedule.timesA) || [], tB = (nkSchedule && nkSchedule.timesB) || []
  const fins = (nkSchedule && nkSchedule.finales) || []
  const pD = (nkSchedule && nkSchedule.poulefaseDate) || '', fD = (nkSchedule && nkSchedule.finaleDate) || ''

  const SC = ({ schedule, times, hc, lbl }) => {
    let fs = schedule, ft = times
    if (filteredData && myTeam) {
      fs = schedule.filter(m => { const hT = slot2t[m.home] || m.home, aT = slot2t[m.away] || m.away; return hT === myTeam || aT === myTeam })
      ft = [...new Set(fs.map(m => m.time))]
    }
    const timeToRound = {}; times.forEach((t, i) => { timeToRound[t] = i + 1 })
    return (
      <div className="card"><div className={`card-header ${hc}`}>{lbl}</div>
        {ft.map((time, ri) => {
          const ms = fs.filter(m => m.time === time); if (!ms.length) return null
          return (
            <div key={ri}>
              <div style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono',monospace", color: '#555', background: '#f0ede8', borderBottom: '1px solid #e0ddd8', borderTop: ri > 0 ? '1px solid #e0ddd8' : 'none', letterSpacing: '.5px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Ronde {timeToRound[time] || ri + 1}</span><span style={{ fontWeight: 400, color: '#999' }}>{time}</span>
              </div>
              {ms.map((m, i) => <MR key={i} m={m} />)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Super — huidige stand</div>
      <div className={displayPk.length <= 2 ? 'grid-2' : displayPk.length <= 4 ? 'grid-4' : 'grid-5'}>
        {displayPk.map(id => <PouleCard key={id} id={id} poule={data[id]} myTeam={myTeam} slots={NK14_SLOTS[id]} />)}
      </div>
      <div className="section-label">NK Poulefase — verwachte indeling</div>
      <div className={showA && showB ? 'grid-2' : ''}>
        {showA && <div className="card"><div className="card-header card-header-a">Poulefase A{pD && ` · ${pD}`}</div><table><tbody>{nkA.map((e, i) => <tr key={i} style={e.team === myTeam ? { background: '#eff6ff' } : {}}><td className="td-rank">{i + 1}</td><td style={e.team === myTeam ? { fontWeight: 600 } : {}}>{e.team}<span className="origin"> {e.origin}</span></td></tr>)}</tbody></table></div>}
        {showB && <div className="card"><div className="card-header card-header-b">Poulefase B{pD && ` · ${pD}`}</div><table><tbody>{nkB.map((e, i) => <tr key={i} style={e.team === myTeam ? { background: '#eff6ff' } : {}}><td className="td-rank">{i + 1}</td><td style={e.team === myTeam ? { fontWeight: 600 } : {}}>{e.team}<span className="origin"> {e.origin}</span></td></tr>)}</tbody></table></div>}
      </div>
      {sA.length > 0 && <>
        <div className="section-label">NK Speelschema{pD && ` · ${pD}`}</div>
        <div className={showA && showB ? 'grid-2' : ''}>
          {showA && <SC schedule={sA} times={tA} hc="card-header-a" lbl="Poule A" />}
          {showB && <SC schedule={sB} times={tB} hc="card-header-b" lbl="Poule B" />}
        </div>
      </>}
      {fins.length > 0 && <>
        <div className="section-label">NK Finales{fD && ` · ${fD}`}</div>
        <div className="card" style={{ maxWidth: 500 }}><div className="card-header">Halve finales & Finale</div>
          {fins.map((f, i) => (
            <div key={i} className="match-row" style={f.type === 'Finale' ? { borderTop: '1px solid #e0ddd8' } : {}}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{f.time}</div>
              <div className="match-teams"><div className="match-team right"><strong>{f.home}</strong></div><div className="match-vs">vs</div><div className="match-team"><strong>{f.away}</strong></div></div>
              <span className="origin">{f.type === 'Halve Finales' ? 'HF' : f.type === '3e/4e plaats' ? '3e/4e' : '🏆'}</span>
              {f.field && <span className="origin">{f.field}</span>}
            </div>
          ))}
        </div>
      </>}
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

  useEffect(() => { run() }, [])

  return (
    <div>
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <div className="divider-v"></div>
        <span className="ctrl-label">Thuisvoordeel:</span>
        <input type="range" min="0" max="40" step="1" value={ha} onChange={e => setHa(parseInt(e.target.value))} style={{ width: 140 }} />
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
  const pk = POULE_ORDER_14.filter(k => data[k])
  return pk.map(id => {
    const poule = data[id], pa = ss[id], sl = NK14_SLOTS[id]
    const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])
    return (
      <div key={id}>
        <div className="poule-sim-label">Poule {id}<span className={`nk-badge nk-${sl[0].toLowerCase()}`}>#1→NK {sl[0]}</span><span className={`nk-badge nk-${sl[1].toLowerCase()}`}>#2→NK {sl[1]}</span></div>
        <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>#</th><th>Team</th><th>PT</th><th>DS</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
          {order.map((idx, rank) => {
            const p1 = pct(pa[idx][0], N), p2 = pct(pa[idx][1], N), top2 = p1 + p2, isMy = poule.teams[idx] === myTeam
            return (
              <tr key={idx} className={isMy ? 'row-my' : p1 > 50 ? 'row-gold' : ''}>
                <td style={{ color: '#aaa', fontSize: 11 }}>{rank + 1}</td>
                <td className="team" style={isMy ? { fontWeight: 700 } : {}}>{poule.teams[idx]}</td>
                <td style={{ textAlign: 'right', color: '#888', fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{poule.pts[idx]}</td>
                <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 11, color: poule.ds[idx] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[idx] >= 0 ? '+' : ''}{poule.ds[idx]}</td>
                <td className={pc(p1, 50, 20)}>{p1}%</td><td className={pc(p2, 40, 20)}>{p2}%</td><td className={pc(top2, 60, 30)}>{top2}%</td>
              </tr>
            )
          })}
        </tbody></table></div>
      </div>
    )
  })
}

function NKRes({ data, results, N, myTeam }) {
  const { nkAp, nkBp, nkAa, nkBa } = results
  const rp = (w, pm, am) => {
    const teams = Object.keys(pm).sort((a, b) => (am[b] || 0) - (am[a] || 0)).filter(t => (am[t] || 0) / N > 0.01)
    return (
      <div key={w}>
        <div className="poule-sim-label"><span style={{ background: w === 'A' ? '#dbeafe' : '#dcfce7', color: w === 'A' ? '#1d4ed8' : '#15803d', padding: '2px 10px', borderRadius: 99, fontSize: 11 }}>NK Poulefase {w}</span></div>
        <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(1e)</th><th>P(2e)</th><th>P(top2)</th></tr></thead><tbody>
          {teams.map(t => {
            const app = am[t] || 0, pos = pm[t] || Array(5).fill(0), p1 = pct(pos[0], N), p2 = pct(pos[1], N), top2 = p1 + p2, isMy = t === myTeam
            return (
              <tr key={t} className={isMy ? 'row-my' : p1 >= 15 ? 'row-gold' : ''}>
                <td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}{pct(app, N) < 99 && <span className="origin"> kwal.{pct(app, N)}%</span>}</td>
                <td className={pc(p1, 15, 8)}>{p1}%</td><td className={pc(p2, 15, 8)}>{p2}%</td><td className={pc(top2, 30, 15)}>{top2}%</td>
              </tr>
            )
          })}
        </tbody></table></div>
      </div>
    )
  }
  return <>{rp('A', nkAp, nkAa)}{rp('B', nkBp, nkBa)}</>
}

function FinRes({ data, results, N, myTeam }) {
  const { fin } = results
  const teams = Object.keys(fin).sort((a, b) => fin[b].p1 - fin[a].p1).filter(t => fin[t].appear / N > 0.02)
  return (
    <div className="sim-table-wrap"><table className="sim-table"><thead><tr><th>Team</th><th>P(HF)</th><th>P(finale)</th><th>P(🥇)</th><th>P(🥈)</th><th>P(🥉)</th><th>P(podium)</th></tr></thead><tbody>
      {teams.map(t => {
        const s = fin[t], pSF = pct(s.sfReach, N), pFin = pct(s.finalist, N), p1 = pct(s.p1, N), p2 = pct(s.p2, N), p3 = pct(s.p3, N), pPod = p1 + p2 + p3, isMy = t === myTeam
        return (
          <tr key={t} className={isMy ? 'row-my' : p1 >= 10 ? 'row-gold' : ''}>
            <td className="team" style={isMy ? { fontWeight: 700 } : {}}>{t}</td>
            <td className={pc(pSF, 20, 10)}>{pSF}%</td><td className={pc(pFin, 15, 8)}>{pFin}%</td>
            <td><Bar p={p1} col="#f59e0b" /></td><td><Bar p={p2} col="#94a3b8" /></td><td><Bar p={p3} col="#cd7c2f" /></td>
            <td className={pc(pPod, 25, 12)}>{pPod}%</td>
          </tr>
        )
      })}
    </tbody></table></div>
  )
}
