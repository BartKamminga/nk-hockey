import React, { useMemo } from 'react'
import { NK14_SLOTS, POULE_ORDER_14 } from '../../constants'
import { PouleCard } from './PouleCard'

const resolveMatchTeam = (slot2t, teamRef) => slot2t[teamRef] || teamRef

const buildNkPhase = (data, pk) => {
  const nkA = []
  const nkB = []
  const slot2t = {}

  pk.forEach(id => {
    const [team1, team2] = data[id].teams
    const [slot1, slot2] = NK14_SLOTS[id]
    const origin1 = `${id} nr 1`
    const origin2 = `${id} nr 2`

    ;(slot1 === 'A' ? nkA : nkB).push({ team: team1, origin: origin1 })
    ;(slot2 === 'A' ? nkA : nkB).push({ team: team2, origin: origin2 })

    slot2t[origin1] = team1
    slot2t[origin2] = team2
  })

  return { nkA, nkB, slot2t }
}

function MatchRow({ match, slot2t, myTeam }) {
  const home = resolveMatchTeam(slot2t, match.home)
  const away = resolveMatchTeam(slot2t, match.away)
  const isMyHome = home === myTeam
  const isMyAway = away === myTeam

  return (
    <div className={`match-row${(isMyHome || isMyAway) ? ' row-my-match' : ''}`}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{match.time}</div>
      <div className="match-teams">
        <div className="match-team right" style={isMyHome ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
          {home}<span className="origin"> {match.home}</span>
        </div>
        <div className="match-vs">vs</div>
        <div className="match-team" style={isMyAway ? { fontWeight: 600, color: '#1d4ed8' } : {}}>
          {away}<span className="origin"> {match.away}</span>
        </div>
      </div>
      {match.field && <span className="origin" style={{ flexShrink: 0 }}>{match.field}</span>}
    </div>
  )
}

function ScheduleSection({ schedule, times, headerClass, label, slot2t, myTeam, filterMyTeam }) {
  const filtered = filterMyTeam && myTeam
    ? schedule.filter(match => {
        const home = resolveMatchTeam(slot2t, match.home)
        const away = resolveMatchTeam(slot2t, match.away)
        return home === myTeam || away === myTeam
      })
    : schedule

  const roundTimes = [...new Set(filtered.map(m => m.time))]
  const timeToRound = Object.fromEntries((times || []).map((time, index) => [time, index + 1]))

  return (
    <div className="card">
      <div className={`card-header ${headerClass}`}>{label}</div>
      {roundTimes.map((time, index) => {
        const matches = filtered.filter(m => m.time === time)
        return (
          <div key={time}>
            <div className="round-header round-header-remaining" style={{ borderTop: index > 0 ? '1px solid var(--border-round-remaining)' : 'none' }}>
              <span>Ronde {timeToRound[time] || index + 1}</span>
              <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{time}</span>
            </div>
            {matches.map((match, i) => <MatchRow key={i} match={match} slot2t={slot2t} myTeam={myTeam} />)}
          </div>
        )
      })}
    </div>
  )
}

function NkPhaseTable({ label, entries, headerClass, myTeam }) {
  return (
    <div className="card">
      <div className={`card-header ${headerClass}`}>{label}</div>
      <table>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className={entry.team === myTeam ? 'row-my' : ''}>
              <td className="td-rank">{i + 1}</td>
              <td style={entry.team === myTeam ? { fontWeight: 600 } : {}}>
                {entry.team}<span className="origin"> {entry.origin}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function finalTypeLabel(type) {
  if (type === 'Halve Finales') return 'HF'
  if (type === '3e/4e plaats') return '3e/4e'
  return '🏆'
}

export function O14OverzichtTab({ data, filteredData, myTeam, nkSchedule, showForm, showPlayed }) {
  const pk = useMemo(() => POULE_ORDER_14.filter(id => data[id]), [data])
  const displayPk = useMemo(() => filteredData ? POULE_ORDER_14.filter(id => filteredData[id]) : pk, [filteredData, pk])
  const { nkA, nkB, slot2t } = useMemo(() => buildNkPhase(data, pk), [data, pk])
  const myNKPoule = myTeam
    ? nkA.some(e => e.team === myTeam)
      ? 'A'
      : nkB.some(e => e.team === myTeam)
        ? 'B'
        : null
    : null
  const showA = !filteredData || myNKPoule === 'A'
  const showB = !filteredData || myNKPoule === 'B'
  const gridClass = showA && showB ? 'grid-2' : ''
  const {
    schedA = [],
    schedB = [],
    timesA = [],
    timesB = [],
    finales = [],
    poulefaseDate = '',
    finaleDate = ''
  } = nkSchedule || {}

  return (
    <div>
      <div className="section-label" style={{ marginTop: 0 }}>Super — huidige stand</div>
      <div className={displayPk.length <= 2 ? 'grid-2' : displayPk.length <= 4 ? 'grid-4' : 'grid-5'}>
        {displayPk.map(id => <PouleCard key={id} id={id} poule={data[id]} myTeam={myTeam} slots={NK14_SLOTS[id]} showForm={showForm} showPlayed={showPlayed} />)}
      </div>

      <div className="section-label">NK Poulefase — verwachte indeling</div>
      <div className={gridClass}>
        {showA && <NkPhaseTable label={`Poulefase A${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} entries={nkA} headerClass="card-header-a" myTeam={myTeam} />}
        {showB && <NkPhaseTable label={`Poulefase B${poulefaseDate ? ` · ${poulefaseDate}` : ''}`} entries={nkB} headerClass="card-header-b" myTeam={myTeam} />}
      </div>

      {schedA.length > 0 && (
        <>
          <div className="section-label">NK Speelschema{poulefaseDate ? ` · ${poulefaseDate}` : ''}</div>
          <div className={gridClass}>
            {showA && <ScheduleSection schedule={schedA} times={timesA} headerClass="card-header-a" label="Poule A" slot2t={slot2t} myTeam={myTeam} filterMyTeam={Boolean(filteredData && myTeam)} />}
            {showB && <ScheduleSection schedule={schedB} times={timesB} headerClass="card-header-b" label="Poule B" slot2t={slot2t} myTeam={myTeam} filterMyTeam={Boolean(filteredData && myTeam)} />}
          </div>
        </>
      )}

      {finales.length > 0 && (
        <>
          <div className="section-label">NK Finales{finaleDate ? ` · ${finaleDate}` : ''}</div>
          <div className="card" style={{ maxWidth: 500 }}>
            <div className="card-header">Halve finales & Finale</div>
            {finales.map((finale, i) => (
              <div key={i} className="match-row" style={finale.type === 'Finale' ? { borderTop: '1px solid #e0ddd8' } : {}}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', minWidth: 38 }}>{finale.time}</div>
                <div className="match-teams">
                  <div className="match-team right"><strong>{finale.home}</strong></div>
                  <div className="match-vs">vs</div>
                  <div className="match-team"><strong>{finale.away}</strong></div>
                </div>
                <span className="origin">{finalTypeLabel(finale.type)}</span>
                {finale.field && <span className="origin">{finale.field}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
