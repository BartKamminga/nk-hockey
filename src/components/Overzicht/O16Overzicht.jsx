import React, { useMemo } from 'react'
import { POULE_ORDER_16 } from '../../constants'
import { PouleCard } from './PouleCard'

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

export function O16OverzichtTab({ data, filteredData, myTeam, showForm }) {
  const pk = useMemo(() => POULE_ORDER_16.filter(id => data[id]), [data])
  const displayPk = useMemo(() => filteredData ? POULE_ORDER_16.filter(id => filteredData[id]) : pk, [filteredData, pk])
  const nr1s = useMemo(() => sortRanking(pk.map(id => ({ team: data[id].teams[0], poule: id, pts: data[id].pts[0], ds: data[id].ds[0] }))), [pk, data])
  const nr2s = useMemo(() => sortRanking(pk.map(id => ({ team: data[id].teams[1], poule: id, pts: data[id].pts[1], ds: data[id].ds[1] }))), [pk, data])

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Landelijk — huidige stand</div>
      <div className={displayPk.length <= 2 ? 'grid-2' : 'grid-4'}>
        {displayPk.map(id => <PouleCard key={id} id={id} poule={data[id]} myTeam={myTeam} showForm={showForm} />)}
      </div>
      {nr1s.length >= 4 && <KnockoutPreview nr1s={nr1s} nr2s={nr2s} myTeam={myTeam} />}
    </div>
  )
}
