import React from 'react'
import { NK14_SLOTS } from '../constants'

export const pct = (c, N) => Math.round(c / N * 100)
export const pc = (p, hi, mid) => p >= hi ? 'prob-hi' : p >= mid ? 'prob-mid' : 'prob-low'
export function fmtMatchDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) } catch { return '' } }

export function PouleCard({ id, poule, myTeam, slots }) {
  const mpr = Math.floor(poule.teams.length / 2)
  const remR = mpr > 0 ? Math.round(poule.remaining.length / mpr) : 0
  return (
    <div className="card">
      <div className="card-header">Poule {id}<span className="played-count">{remR > 0 ? `nog ${remR} ronde${remR > 1 ? 's' : ''}` : '✓ klaar'}</span></div>
      <table><tbody>{poule.teams.map((team, i) => {
        const rank = i + 1, is1 = rank === 1, is2 = rank === 2
        const slot = slots ? (is1 ? slots[0] : is2 ? slots[1] : null) : null
        const isMy = team === myTeam
        return (
          <tr key={team} style={isMy ? { background: '#eff6ff' } : {}}>
            <td className="td-rank">{rank}</td>
            <td className={is1 ? 'bold' : ''} style={{ ...(!slot ? { paddingLeft: 17 } : {}), fontWeight: isMy ? 600 : undefined }}>
              {slot && <span className={`dot dot-${slot.toLowerCase()}`} style={{ marginRight: 5 }}></span>}{team}
            </td>
            <td className="td-pts">{poule.pts[i]}</td>
            <td className="td-ds" style={{ color: poule.ds[i] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[i] >= 0 ? '+' : ''}{poule.ds[i]}</td>
          </tr>
        )
      })}</tbody></table>
    </div>
  )
}

export function SchemaTab({ data, myTeam, pouleOrder }) {
  const pk = pouleOrder.filter(k => data[k])
  const gridCls = pk.length <= 4 ? 'grid-4' : 'grid-5'
  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Resterende wedstrijden</div>
      <div className={gridCls}>{pk.map(id => <RemainingCard key={id} id={id} poule={data[id]} myTeam={myTeam} />)}</div>
      <div className="section-label">Gespeelde wedstrijden</div>
      <div className={gridCls}>{pk.map(id => <PlayedCard key={id} id={id} poule={data[id]} myTeam={myTeam} />)}</div>
    </div>
  )
}

function PlayedCard({ id, poule, myTeam }) {
  const ma = poule.matches_played || []
  const rounds = {}
  ma.forEach(m => { const r = m.round || '?'; if (!rounds[r]) rounds[r] = []; rounds[r].push(m) })
  const sorted = Object.keys(rounds).sort((a, b) => parseInt(b) - parseInt(a))
  return (
    <div className="card">
      <div className="card-header">Poule {id}<span className="played-count">{ma.length} gespeeld</span></div>
      {ma.length === 0 && <div style={{ padding: 12, color: '#aaa', fontSize: 12 }}>Geen data</div>}
      {sorted.map(r => {
        const dateStr = fmtMatchDate(rounds[r][0] && rounds[r][0].date)
        return (
          <div key={r}>
            <div className="round-header round-header-played">
              <span>Ronde {r}</span>{dateStr && <span style={{ fontWeight: 400, color: '#999' }}>{dateStr}</span>}
            </div>
            {rounds[r].map((m, i) => {
              const isMy = m.home === myTeam || m.away === myTeam
              return (
                <div className="match-row played" key={i} style={isMy ? { background: '#eff6ff' } : {}}>
                  <div className="match-teams">
                    <div className="match-team right" style={m.home === myTeam ? { fontWeight: 600 } : {}}>{m.home}</div>
                    <div className="match-score">{m.score}</div>
                    <div className="match-team" style={m.away === myTeam ? { fontWeight: 600 } : {}}>{m.away}</div>
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

function RemainingCard({ id, poule, myTeam }) {
  const mpr = Math.floor(poule.teams.length / 2)
  const lr = poule.matches_played && poule.matches_played.length > 0 ? Math.max(...poule.matches_played.map(m => parseInt(m.round) || 0)) : 0
  const rounds = []
  if (mpr > 0) for (let i = 0; i < poule.remaining.length; i += mpr) rounds.push(poule.remaining.slice(i, i + mpr))
  return (
    <div className="card">
      <div className="card-header">Poule {id}<span className="played-count">{rounds.length > 0 ? `nog ${rounds.length} ronde${rounds.length > 1 ? 's' : ''}` : '✓ klaar'}</span></div>
      {rounds.length === 0 && <div style={{ padding: 12, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>✓ Afgerond</div>}
      {rounds.map((ms, ri) => {
        const rn = lr + ri + 1
        const dateStr = fmtMatchDate(ms[0] && ms[0][2])
        return (
          <div key={ri}>
            <div className="round-header round-header-remaining">
              <span>Ronde {rn}</span>{dateStr && <span style={{ fontWeight: 400, color: '#766a3a' }}>{dateStr}</span>}
            </div>
            {ms.map((m, mi) => {
              const h = m[0], a = m[1], isMy = h === myTeam || a === myTeam
              return (
                <div className="match-row" key={mi} style={isMy ? { background: '#eff6ff' } : {}}>
                  <div className="match-teams">
                    <div className="match-team right" style={h === myTeam ? { fontWeight: 600 } : {}}>{h}</div>
                    <div className="match-vs">vs</div>
                    <div className="match-team" style={a === myTeam ? { fontWeight: 600 } : {}}>{a}</div>
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

export const Bar = ({ p, col }) => (
  <div className="bar-wrap">
    <div className="bar-track"><div className="bar-fill" style={{ width: `${p}%`, background: col }}></div></div>
    <span className="bar-val">{p}%</span>
  </div>
)
