import React from 'react'
import { fmtMatchDate } from '../Shared'

export default function SimPouleCard({ title, headerClass, teams, basePts, baseDs, rounds, locks, myTeam, onToggle, onSetRound, onPredict, onPredictAll, hideStandings }) {
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

      {rounds.map(round => {
        const dateStr = fmtMatchDate(round.date)
        const timeStr = round.time || ''
        return (
          <div key={round.roundNum}>
            <div className="round-header round-header-remaining">
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
