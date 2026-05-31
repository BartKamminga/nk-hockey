import React from 'react'
import { NK14_SLOTS, POULE_ORDER_14, POULE_ORDER_16, IS_O16 } from '../../constants'
import { getExpectedStandings } from './helpers'
import { pct } from '../../lib/utils'

export default function TournamentPath({ data, locks, myTeam, results, N, effectiveComp }) {
  if (!myTeam || !data) return null
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14

  // Find my poule and position
  let myPoule = null
  for (const id of pouleOrder) {
    if (data[id] && data[id].teams.indexOf(myTeam) >= 0) { myPoule = id; break }
  }
  if (!myPoule) return null

  const expected = getExpectedStandings(data, locks, pouleOrder)
  const myStanding = expected[myPoule]
  const myPos = myStanding ? myStanding.findIndex(s => s.team === myTeam) + 1 : '?'

  // Determine NK poule destination
  let nkPoule = '?'
  if (!o16 && NK14_SLOTS[myPoule]) {
    nkPoule = myPos === 1 ? NK14_SLOTS[myPoule][0] : myPos === 2 ? NK14_SLOTS[myPoule][1] : '-'
  }

  // Get NK chances from results
  let pHF = null, pFin = null, pGold = null
  if (results && results.fin && results.fin[myTeam]) {
    const f = results.fin[myTeam]
    if (o16) {
      pHF = pct(f.hf || 0, N)
      pFin = pct(f.finalist || 0, N)
      pGold = pct(f.p1 || 0, N)
    } else {
      pHF = pct(f.sfReach || 0, N)
      pFin = pct(f.finalist || 0, N)
      pGold = pct(f.p1 || 0, N)
    }
  }

  // Check HF/Finale locks for my team
  const getLockResult = (key) => {
    const raw = locks[key]
    if (!raw) return null
    return typeof raw === 'string' ? raw : raw.result
  }

  let hfResult = null, finResult = null
  // Check if my team is in a locked HF
  for (const key of ['nk_hf1', 'nk_hf2']) {
    const r = getLockResult(key)
    if (r) {
      // We'd need to resolve who's in the HF to know if it's us, but that's complex
      // For now just show percentages
    }
  }

  const steps = []

  // Step 1: Poule position
  const pouleOk = myPos <= 2
  steps.push({
    label: `Poule ${myPoule}`,
    value: `#${myPos}`,
    status: pouleOk ? 'ok' : myPos <= 3 ? 'maybe' : 'out',
  })

  // Step 2: NK Poule (O14) or KF (O16)
  if (o16) {
    steps.push({
      label: 'KF',
      value: pouleOk ? `${pHF}%` : '-',
      status: pouleOk ? 'maybe' : 'out',
    })
  } else {
    steps.push({
      label: `NK ${nkPoule}`,
      value: pouleOk ? (nkPoule !== '-' ? `Poule ${nkPoule}` : '-') : '-',
      status: pouleOk && nkPoule !== '-' ? 'ok' : 'out',
    })
  }

  // Step 3: HF
  steps.push({
    label: 'HF',
    value: pHF != null ? `${pHF}%` : '?',
    status: pHF > 50 ? 'ok' : pHF > 20 ? 'maybe' : 'out',
  })

  // Step 4: Finale
  steps.push({
    label: 'Finale',
    value: pFin != null ? `${pFin}%` : '?',
    status: pFin > 30 ? 'ok' : pFin > 10 ? 'maybe' : 'out',
  })

  // Step 5: Champion
  steps.push({
    label: '🏆',
    value: pGold != null ? `${pGold}%` : '?',
    status: pGold > 20 ? 'ok' : pGold > 8 ? 'maybe' : 'out',
  })

  const statusColor = (s) => s === 'ok' ? 'var(--win)' : s === 'maybe' ? 'var(--draw-text)' : 'var(--text-faint)'

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <span>{myTeam}</span>
        <span className="played-count">pad naar het NK</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', gap: 0, overflowX: 'auto' }}>
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: statusColor(step.status), color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono',monospace",
              }}>
                {step.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap' }}>{step.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, height: 2, background: 'var(--border)', flexShrink: 0, marginBottom: 14 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
