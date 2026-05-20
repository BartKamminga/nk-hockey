import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { POULE_ORDER_16 } from '../constants'
import { runSimO16 } from '../simulation'
import { PouleCard, pct, pc, Bar } from './Shared'

const sortRanking = (items) =>
  [...items].sort((a, b) => (b.pts !== a.pts ? b.pts - a.pts : b.ds - a.ds))

const rankLabel = (index) =>
  index === 0 ? 'Beste'
  : index === 1 ? '2e'
  : index === 2 ? '3e'
  : '4e'

const renderTeamRow = (team, label, myTeam) => (
  <tr key={team.team} style={team.team === myTeam ? { background: '#eff6ff' } : {}}>
    <td className="td-rank">{label}</td>
    <td style={team.team === myTeam ? { fontWeight: 600 } : {}}>
      {team.team}
      <span className="origin"> Poule {team.poule} · {team.pts}pt · DS {team.ds >= 0 ? '+' : ''}{team.ds}</span>
    </td>
  </tr>
)

function KnockoutPreview({ nr1s, nr2s, myTeam }) {
  const matches = nr1s.length >= 4 && nr2s.length >= 4 ? [
    { label: 'KF 1', home: nr1s[0], away: nr2s[3], desc: 'Beste #1 vs 4e #2' },
    { label: 'KF 2', home: nr1s[1], away: nr2s[2], desc: '2e #1 vs 3e #2' },
    { label: 'KF 3', home: nr1s[2], away: nr2s[1], desc: '3e #1 vs 2e #2' },
    { label: 'KF 4', home: nr1s[3], away: nr2s[0], desc: '4e #1 vs Beste #2' },
  ] : []

  return (
    <>
      <div className="section-label">NK Kwartfinales — verwachte indeling</div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">Ranking #1 per poule</div>
          <table><tbody>{nr1s.map((team, index) => renderTeamRow(team, rankLabel(index), myTeam))}</tbody></table>
        </div>
        <div className="card">
          <div className="card-header">Ranking #2 per poule</div>
          <table><tbody>{nr2s.map((team, index) => renderTeamRow(team, rankLabel(index), myTeam))}</tbody></table>
        </div>
      </div>

      <div className="section-label">NK Kwartfinales — verwachte wedstrijden</div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">Kwartfinales</div>
        {matches.map((kf, i) => {
          const hMy = kf.home.team === myTeam
          const aMy = kf.away.team === myTeam
          return (
            <div key={i} className="match-row" style={hMy || aMy ? { background: '#eff6ff' } : {}}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 36 }}>{kf.label}</div>
              <div className="match-teams">
                <div className="match-team right" style={hMy ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
                  {kf.home.team}<span className="origin"> {kf.home.poule}#1</span>
                </div>
                <div className="match-vs">vs</div>
                <div className="match-team" style={aMy ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
                  {kf.away.team}<span className="origin"> {kf.away.poule}#2</span>
                </div>
              </div>
              <span className="origin">{kf.desc}</span>
            </div>
          )
        })}
        <div className="match-row" style={{ borderTop: '1px solid #e0ddd8' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 36 }}>HF 1</div>
          <div className="match-teams">
            <div className="match-team right"><strong>Winnaar KF 1</strong></div>
            <div className="match-vs">vs</div>
            <div className="match-team"><strong>Winnaar KF 4</strong></div>
          </div>
        </div>
        <div className="match-row">
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 36 }}>HF 2</div>
          <div className="match-teams">
            <div className="match-team right"><strong>Winnaar KF 2</strong></div>
            <div className="match-vs">vs</div>
            <div className="match-team"><strong>Winnaar KF 3</strong></div>
          </div>
        </div>
        <div className="match-row" style={{ borderTop: '1px solid #e0ddd8' }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 36 }}>🏆</div>
          <div className="match-teams">
            <div className="match-team right"><strong>Winnaar HF 1</strong></div>
            <div className="match-vs">vs</div>
            <div className="match-team"><strong>Winnaar HF 2</strong></div>
          </div>
        </div>
      </div>
    </>
  )
}

export function O16OverzichtTab({ data, filteredData, myTeam }) {
  const pk = useMemo(() => POULE_ORDER_16.filter(id => data[id]), [data])
  const displayPk = useMemo(() => filteredData ? POULE_ORDER_16.filter(id => filteredData[id]) : pk, [filteredData, pk])
  const nr1s = useMemo(() => sortRanking(pk.map(id => ({ team: data[id].teams[0], poule: id, pts: data[id].pts[0], ds: data[id].ds[0] }))), [pk, data])
  const nr2s = useMemo(() => sortRanking(pk.map(id => ({ team: data[id].teams[1], poule: id, pts: data[id].pts[1], ds: data[id].ds[1] }))), [pk, data])

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Landelijk — huidige stand</div>
      <div className={displayPk.length <= 2 ? 'grid-2' : 'grid-4'}>
        {displayPk.map(id => <PouleCard key={id} id={id} poule={data[id]} myTeam={myTeam} />)}
      </div>
      {nr1s.length >= 4 && <KnockoutPreview nr1s={nr1s} nr2s={nr2s} myTeam={myTeam} />}
    </div>
  )
}

export function O16SimTab({ data, myTeam }) {
  const [N, setN] = useState(20000)
  const [ha, setHa] = useState(0)
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [simNote, setSimNote] = useState('')

  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const r = runSimO16(data, N, ha)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }, [data, N, ha])

  useEffect(() => { run() }, [run])

  const pk = useMemo(() => POULE_ORDER_16.filter(id => data[id]), [data])

  return (
    <div>
      <div className="sim-controls">
        <span className="ctrl-label">Simulaties:</span>
        <input type="range" min="2000" max="500000" step="2000" value={N} onChange={e => setN(parseInt(e.target.value, 10))} style={{ width: 180 }} />
        <span className="ctrl-val">{N.toLocaleString('nl-NL')}</span>
        <button className="run-btn" onClick={run} disabled={running}>{running ? 'Bezig...' : 'Herbereken'}</button>
      </div>
      {results && (
        <>
          {pk.map(id => {
            const poule = data[id]
            const pa = results.ss[id]
            const order = poule.teams.map((_, i) => i).sort((a, b) => pa[b][0] !== pa[a][0] ? pa[b][0] - pa[a][0] : poule.pts[b] - poule.pts[a])
            return (
              <div key={id}>
                <div className="poule-sim-label">Poule {id}<span style={{ fontSize: 10, color: '#aaa', fontWeight: 400 }}>{poule.remaining.length} wedstr. rest</span></div>
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
          })}
          <div className="poule-sim-label" style={{ marginTop: 24 }}>NK Eindkansen</div>
          <div className="sim-table-wrap">
            <table className="sim-table">
              <thead>
                <tr><th>Team</th><th>P(KF)</th><th>P(HF)</th><th>P(finale)</th><th>P(1e 🥇)</th><th>P(2e 🥈)</th></tr>
              </thead>
              <tbody>
                {Object.keys(results.fin)
                  .sort((a, b) => results.fin[b].p1 - results.fin[a].p1)
                  .filter(t => results.fin[t].kf / N > 0.02)
                  .map(t => {
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
        </>
      )}
      {simNote && <div className="sim-note">{simNote}</div>}
    </div>
  )
}