import React from 'react'
import { getTeamForm } from '../../lib/utils'

function formColor(pts) {
  if (pts >= 12) return '#16a34a'
  if (pts >= 9) return '#65a30d'
  if (pts >= 5) return '#d97706'
  return '#dc2626'
}

const FormBadge = ({ form }) => {
  if (!form || form.length === 0) return null
  const pts = form.reduce((s, r) => s + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0)
  const col = formColor(pts)
  const title = form.map(r => r === 'W' ? 'W' : r === 'D' ? 'G' : 'V').join('') + ` (${pts}/${form.length * 3})`
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: '50%', background: col,
      color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace",
    }} title={title}>{pts}</span>
  )
}

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
        const form = getTeamForm(team, poule.matches_played)
        return (
          <tr key={team} style={isMy ? { background: '#eff6ff' } : {}}>
            <td className="td-rank">{rank}</td>
            <td className={is1 ? 'bold' : ''} style={{ ...(!slot ? { paddingLeft: 17 } : {}), fontWeight: isMy ? 600 : undefined }}>
              {slot && <span className={`dot dot-${slot.toLowerCase()}`} style={{ marginRight: 5 }}></span>}{team}
            </td>
            <td className="td-pts">{poule.pts[i]}</td>
            <td className="td-ds" style={{ color: poule.ds[i] >= 0 ? '#16a34a' : '#dc2626' }}>{poule.ds[i] >= 0 ? '+' : ''}{poule.ds[i]}</td>
            <td style={{ padding: '0 8px' }}><FormBadge form={form} /></td>
          </tr>
        )
      })}</tbody></table>
    </div>
  )
}
