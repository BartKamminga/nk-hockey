import { POULE_ORDER_14, POULE_ORDER_16 } from '../../constants'

// Build simLocks from UI locks (home perspective, no transformation needed)
export function buildAllSimLocks(uiLocks) {
  const simLocks = {}
  for (const [key, val] of Object.entries(uiLocks)) {
    if (val) simLocks[key] = val
  }
  return simLocks
}

// Calculate expected standings per poule with locks applied
export function getExpectedStandings(data, locks, pouleOrder) {
  const result = {}
  for (const pouleId of pouleOrder) {
    const poule = data[pouleId]
    if (!poule) continue
    const adjusted = poule.teams.map((team, i) => ({
      team, pts: poule.pts[i], ds: poule.ds[i], delta: 0, origRank: i
    }))
    for (const [h, a] of poule.remaining) {
      const lock = locks[`${h}_${a}`]
      if (!lock) continue
      const hi = poule.teams.indexOf(h), ai = poule.teams.indexOf(a)
      if (hi < 0 || ai < 0) continue
      if (lock === 'W') adjusted[hi].delta += 3
      else if (lock === 'D') { adjusted[hi].delta += 1; adjusted[ai].delta += 1 }
      else if (lock === 'L') adjusted[ai].delta += 3
    }
    adjusted.forEach(s => { s.newPts = s.pts + s.delta })
    adjusted.sort((a, b) => b.newPts !== a.newPts ? b.newPts - a.newPts : b.ds !== a.ds ? b.ds - a.ds : a.origRank - b.origRank)
    result[pouleId] = adjusted
  }
  return result
}
