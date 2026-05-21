import React from 'react'

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
