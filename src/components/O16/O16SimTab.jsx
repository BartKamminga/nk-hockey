import React, { useState, useEffect, useMemo } from 'react'
import { POULE_ORDER_16 } from '../../constants'
import { runSimO16 } from '../../simulation'
import { pct, pc, Bar } from '../Shared'

export function O16SimTab({ data, myTeam }) {
  const [N, setN] = useState(20000)
  const [ha, setHa] = useState(0)
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [simNote, setSimNote] = useState('')

  function run() {
    setRunning(true)
    setTimeout(() => {
      const r = runSimO16(data, N, ha)
      setResults(r)
      setSimNote(`${N.toLocaleString('nl-NL')} sim · ${new Date().toLocaleString('nl-NL')}`)
      setRunning(false)
    }, 20)
  }

  useEffect(() => { run() }, [])

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
