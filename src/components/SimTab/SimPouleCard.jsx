import React from 'react'
import { fmtMatchDate, getTeamForm } from '../../lib/utils'

const FORM_COLORS = { W: '#16a34a', D: '#817e7b', L: '#dc2626' }
const FormDots = ({ form }) => {
  if (!form || form.length === 0) return null
  return (
    <span style={{ display: 'inline-flex', gap: 2, marginLeft: 4 }}>
      {form.map((r, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: FORM_COLORS[r], display: 'inline-block' }} title={r === 'W' ? 'Winst' : r === 'D' ? 'Gelijk' : 'Verlies'} />)}
    </span>
  )
}

export default function SimPouleCard({ title, headerClass, teams, basePts, baseDs, rounds, locks, myTeam, onToggle, onSetRound, onPredict, onPredictAll, hideStandings, matchesPlayed }) {
  const pts = {}, ds = {}
  teams.forEach((t, i) => { pts[t] = basePts[i] || 0; ds[t] = baseDs[i] || 0 })
  for (const round of rounds) {
    for (const m of round.matches) {
      const raw = locks[m.lockKey]
      if (!raw) continue
      const lock = typeof raw === 'string' ? { result: raw } : raw
      if (lock.result === 'W') pts[m.h] = (pts[m.h] || 0) + 3
      else if (lock.result === 'D') { pts[m.h] = (pts[m.h] || 0) + 1; pts[m.a] = (pts[m.a] || 0) + 1 }
      else if (lock.result === 'L') pts[m.a] = (pts[m.a] || 0) + 3
      if (lock.scoreH != null && lock.scoreA != null) {
        ds[m.h] = (ds[m.h] || 0) + lock.scoreH - lock.scoreA
        ds[m.a] = (ds[m.a] || 0) + lock.scoreA - lock.scoreH
      }
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
          const form = matchesPlayed ? getTeamForm(s.team, matchesPlayed) : []
          return (
            <tr key={s.team} style={isMy ? { background: '#eff6ff' } : {}}>
              <td className="td-rank">{i + 1}</td>
              <td style={{ padding: '5px 12px', fontSize: 12.5, fontWeight: isMy ? 600 : 400 }}>{s.team}</td>
              <td className="td-pts">{s.pts > 0 ? s.pts : hasAnyBase ? '0' : '-'}</td>
              <td className="td-ds" style={{ color: s.ds >= 0 ? '#16a34a' : '#dc2626' }}>{hasAnyBase ? (s.ds >= 0 ? '+' : '') + s.ds : ''}</td>
              {form.length > 0 && <td style={{ padding: '0 8px' }}><FormDots form={form} /></td>}
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
              const raw = locks[m.lockKey] || null
              const lock = raw ? (typeof raw === 'string' ? { result: raw } : raw) : null
              const result = lock ? lock.result : null
              const hasScore = lock && lock.scoreH != null && lock.scoreA != null
              const isMy = m.h === myTeam || m.a === myTeam
              const ko = m.isKO
              return (
                <div key={m.lockKey} className="match-row" style={{ background: isMy && !lock ? '#eff6ff' : 'transparent', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      flex: 1, textAlign: 'right', padding: '5px 8px', fontSize: 12,
                      fontWeight: m.h === myTeam ? 600 : 400,
                      background: result === 'W' ? '#dcfce7' : 'transparent',
                      borderRadius: '4px 0 0 4px', cursor: 'pointer',
                    }} onClick={() => onToggle(m.lockKey, result === 'W' ? null : 'W')}>
                      {m.h}
                    </div>
                    {hasScore ? (
                      <div className="match-score" style={{ cursor: 'pointer', minWidth: 36 }}
                        onClick={() => { if (ko) onToggle(m.lockKey, null); else onToggle(m.lockKey, result === 'D' ? null : 'D') }}
                        title={ko ? 'Reset' : (result === 'D' ? 'Reset' : 'Gelijk')}>
                        {lock.scoreH}-{lock.scoreA}
                      </div>
                    ) : ko ? (
                      <div style={{
                        padding: '5px 10px', fontSize: 10, color: '#ccc',
                        cursor: lock ? 'pointer' : 'default', fontWeight: 700, textAlign: 'center', minWidth: 30,
                      }} onClick={() => { if (lock) onToggle(m.lockKey, null) }} title={lock ? 'Reset' : ''}>
                        vs
                      </div>
                    ) : (
                      <div style={{
                        padding: '5px 10px', fontSize: 10, color: result === 'D' ? '#b45309' : '#ccc',
                        background: result === 'D' ? '#fef3c7' : 'transparent',
                        cursor: 'pointer', fontWeight: 700, textAlign: 'center', minWidth: 30,
                      }} onClick={() => onToggle(m.lockKey, result === 'D' ? null : 'D')}>
                        {result === 'D' ? 'G' : 'vs'}
                      </div>
                    )}
                    <div style={{
                      flex: 1, textAlign: 'left', padding: '5px 8px', fontSize: 12,
                      fontWeight: m.a === myTeam ? 600 : 400,
                      background: result === 'L' ? '#dcfce7' : 'transparent',
                      borderRadius: '0 4px 4px 0', cursor: 'pointer',
                    }} onClick={() => onToggle(m.lockKey, result === 'L' ? null : 'L')}>
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
