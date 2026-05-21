import React from 'react'
import { fmtMatchDate } from '../../lib/utils'

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
                <div className="match-row played" key={i} className={isMy ? 'row-my-match' : ''}>
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
                <div className="match-row" key={mi} className={isMy ? 'row-my-match' : ''}>
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

export default function SchemaTab({ data, myTeam, pouleOrder }) {
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
