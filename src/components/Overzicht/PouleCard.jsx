import React from 'react'
import { getTeamForm } from '../../lib/utils'
import FormBadge from '../common/FormBadge'

export function PouleCard({ id, poule, myTeam, slots, showForm, showPlayed }) {
  const mpr = Math.floor(poule.teams.length / 2)
  const remR = mpr > 0 ? Math.round(poule.remaining.length / mpr) : 0
  return (
    <div className="card">
      <div className="card-header">Poule {id}<span className="played-count">{remR > 0 ? `nog ${remR} ronde${remR > 1 ? 's' : ''}` : '✓ klaar'}</span></div>
      <table><tbody>{poule.teams.map((team, i) => {
        const rank = i + 1, is1 = rank === 1, is2 = rank === 2
        const slot = slots ? (is1 ? slots[0] : is2 ? slots[1] : null) : null
        const isMy = team === myTeam
        const form = getTeamForm(team, poule.matches_played)
        return (
          <tr key={team} className={isMy ? 'row-my' : ''}>
            <td className="td-rank">{rank}</td>
            <td className="td-name" style={{ fontWeight: (is1 || isMy) ? 600 : 400, paddingLeft: slot ? undefined : 8 }}>
              {slot && <span className={`dot dot-${slot.toLowerCase()}`} style={{ marginRight: 4 }}></span>}{team}
            </td>
            <td className="td-pts">{poule.pts[i]}</td>
            <td className="td-ds" style={{ color: poule.ds[i] >= 0 ? 'var(--win)' : 'var(--lose)' }}>{poule.ds[i] >= 0 ? '+' : ''}{poule.ds[i]}</td>
            {showPlayed && poule.standings && poule.standings[i] && <td className="td-wdl">{poule.standings[i].wins}-{poule.standings[i].draws}-{poule.standings[i].losses}</td>}
            {showForm && <td className="td-form"><FormBadge form={form} /></td>}
          </tr>
        )
      })}</tbody></table>
    </div>
  )
}
