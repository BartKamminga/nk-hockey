// Simulation core — shared by O14 and O16

export const simMatch = (ha) => {
  const a = (ha || 0) / 100
  const rW = 0.38 + a, rD = 0.23, rL = Math.max(0.39 - a, 0.05)
  const t = rW + rD + rL, pW = rW / t, pD = rD / t, r = Math.random()
  return r < pW ? [3, 0] : r < pW + pD ? [1, 1] : [0, 3]
}

export const simGD = () => 1 + Math.floor(Math.random() * 4)
export const simKO = () => Math.random() < 0.5 ? 'home' : 'away'

// Predict most likely outcomes for a set of matches based on team strength
// Uses current standings (points/DS) as strength proxy
export function predictMatches(matches, poule) {
  const N = 1000
  const results = {}
  for (const m of matches) {
    const hi = poule.teams.indexOf(m.h)
    const ai = poule.teams.indexOf(m.a)
    if (hi < 0 || ai < 0) { results[m.lockKey] = null; continue }
    // Strength advantage: difference in points normalized
    const ptsH = poule.pts[hi] || 0, ptsA = poule.pts[ai] || 0
    const dsH = poule.ds[hi] || 0, dsA = poule.ds[ai] || 0
    const advantage = ((ptsH - ptsA) * 2 + (dsH - dsA) * 0.5) / 20
    // Clamp to reasonable range
    const ha = Math.max(-30, Math.min(30, advantage * 100))
    let wCount = 0, dCount = 0, lCount = 0
    for (let i = 0; i < N; i++) {
      const [hp, ap] = simMatch(ha)
      if (hp > ap) wCount++
      else if (hp === ap) dCount++
      else lCount++
    }
    if (wCount >= dCount && wCount >= lCount) results[m.lockKey] = 'W'
    else if (lCount >= dCount && lCount >= wCount) results[m.lockKey] = 'L'
    else results[m.lockKey] = 'D'
  }
  return results
}

export function simPoule(poule, ha, locks) {
  const pts = [...poule.pts], ds = [...poule.ds]
  for (let mi = 0; mi < poule.remaining.length; mi++) {
    const [h, a] = poule.remaining[mi]
    const hi = poule.teams.indexOf(h), ai = poule.teams.indexOf(a)
    if (hi < 0 || ai < 0) continue
    const lockKey = `${h}_${a}`
    const locked = locks && locks[lockKey]
    let hp, ap, gd
    if (locked) {
      // locked: 'W' (home wins), 'D' (draw), 'L' (home loses)
      hp = locked === 'W' ? 3 : locked === 'D' ? 1 : 0
      ap = locked === 'W' ? 0 : locked === 'D' ? 1 : 3
      gd = locked === 'D' ? 0 : simGD()
    } else {
      ;[hp, ap] = simMatch(ha)
      gd = simGD()
    }
    pts[hi] += hp; pts[ai] += ap
    if (hp > ap) { ds[hi] += gd; ds[ai] -= gd }
    else if (ap > hp) { ds[ai] += gd; ds[hi] -= gd }
  }
  return pts.map((_, i) => i).sort((a, b) => pts[b] !== pts[a] ? pts[b] - pts[a] : ds[b] - ds[a])
}

export function simNKPoule(names, nkLocks, slotNames) {
  const n = names.length, pts = Array(n).fill(0), ds = Array(n).fill(0)
  // If we have locks and slot names, check each match pair
  if (nkLocks && slotNames) {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      // Find the lock for this match (try both orderings)
      const lockKey1 = nkLocks[`${slotNames[i]}_${slotNames[j]}`]
      const lockKey2 = nkLocks[`${slotNames[j]}_${slotNames[i]}`]
      const lock = lockKey1 || (lockKey2 ? (lockKey2 === 'W' ? 'L' : lockKey2 === 'L' ? 'W' : 'D') : null)
      let hp, ap, gd
      if (lock) {
        hp = lock === 'W' ? 3 : lock === 'D' ? 1 : 0
        ap = lock === 'W' ? 0 : lock === 'D' ? 1 : 3
        gd = lock === 'D' ? 0 : simGD()
      } else {
        ;[hp, ap] = simMatch(0)
        gd = simGD()
      }
      pts[i] += hp; pts[j] += ap
      if (hp > ap) { ds[i] += gd; ds[j] -= gd }
      else if (ap > hp) { ds[j] += gd; ds[i] -= gd }
    }
  } else {
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const [hp, ap] = simMatch(0)
      pts[i] += hp; pts[j] += ap
      const gd = simGD()
      if (hp > ap) { ds[i] += gd; ds[j] -= gd }
      else if (ap > hp) { ds[j] += gd; ds[i] -= gd }
    }
  }
  return pts.map((_, i) => i).sort((a, b) => pts[b] !== pts[a] ? pts[b] - pts[a] : ds[b] - ds[a])
}

// Resolve a KO match with optional lock
function simKOWithLock(locks, lockKey, home, away) {
  const lock = locks && locks[lockKey]
  if (lock === 'W') return home
  if (lock === 'L') return away
  return simKO() === 'home' ? home : away
}

export function runSimO14(data, N, ha, locks, nkSchedule) {
  const NK14_SLOTS = { A: ['A', 'B'], B: ['B', 'A'], C: ['A', 'B'], D: ['B', 'A'], E: ['A', 'B'] }
  const POULE_ORDER = ['A', 'B', 'C', 'D', 'E']
  const ss = {}
  for (const id of Object.keys(data)) ss[id] = data[id].teams.map(() => Array(6).fill(0))
  const nkAp = {}, nkBp = {}, nkAa = {}, nkBa = {}, fin = {}
  const ensF = t => { if (!fin[t]) fin[t] = { appear: 0, sfReach: 0, finalist: 0, p1: 0, p2: 0, p3: 0, p4: 0 } }
  const pk = POULE_ORDER.filter(k => data[k])

  // Build NK poulefase lock maps from UI lock keys
  // UI keys: nk_A_${slotHome}_${slotAway} → W/D/L (home perspective)
  const nkLocksA = {}, nkLocksB = {}
  if (locks && nkSchedule) {
    const { schedA, schedB } = nkSchedule
    if (schedA) for (const m of schedA) {
      const key = `nk_A_${m.home}_${m.away}`
      if (locks[key]) nkLocksA[`${m.home}_${m.away}`] = locks[key]
    }
    if (schedB) for (const m of schedB) {
      const key = `nk_B_${m.home}_${m.away}`
      if (locks[key]) nkLocksB[`${m.home}_${m.away}`] = locks[key]
    }
  }
  const hasNKLocks = Object.keys(nkLocksA).length > 0 || Object.keys(nkLocksB).length > 0

  for (let s = 0; s < N; s++) {
    const st = {}
    for (const id of pk) { const o = simPoule(data[id], ha, locks); st[id] = o.map(i => data[id].teams[i]); for (let r = 0; r < data[id].teams.length; r++) ss[id][o[r]][r]++ }
    const nkA = pk.filter(k => NK14_SLOTS[k][0] === 'A').map(k => st[k][0]).concat(pk.filter(k => NK14_SLOTS[k][1] === 'A').map(k => st[k][1]))
    const nkB = pk.filter(k => NK14_SLOTS[k][0] === 'B').map(k => st[k][0]).concat(pk.filter(k => NK14_SLOTS[k][1] === 'B').map(k => st[k][1]))

    // Build slot name arrays matching nkA/nkB order
    const slotA = pk.filter(k => NK14_SLOTS[k][0] === 'A').map(k => `${k} nr 1`).concat(pk.filter(k => NK14_SLOTS[k][1] === 'A').map(k => `${k} nr 2`))
    const slotB = pk.filter(k => NK14_SLOTS[k][0] === 'B').map(k => `${k} nr 1`).concat(pk.filter(k => NK14_SLOTS[k][1] === 'B').map(k => `${k} nr 2`))

    for (const t of nkA) { nkAa[t] = (nkAa[t] || 0) + 1; if (!nkAp[t]) nkAp[t] = Array(5).fill(0); ensF(t); fin[t].appear++ }
    for (const t of nkB) { nkBa[t] = (nkBa[t] || 0) + 1; if (!nkBp[t]) nkBp[t] = Array(5).fill(0); ensF(t); fin[t].appear++ }

    const oA = hasNKLocks ? simNKPoule(nkA, nkLocksA, slotA) : simNKPoule(nkA)
    const oB = hasNKLocks ? simNKPoule(nkB, nkLocksB, slotB) : simNKPoule(nkB)

    for (let r = 0; r < nkA.length; r++) nkAp[nkA[oA[r]]][r]++
    for (let r = 0; r < nkB.length; r++) nkBp[nkB[oB[r]]][r]++
    const [a1, a2, b1, b2] = [nkA[oA[0]], nkA[oA[1]], nkB[oB[0]], nkB[oB[1]]]
    for (const t of [a1, a2, b1, b2]) fin[t].sfReach++

    // HF: A1 vs B2, B1 vs A2 — with locks
    const w1 = simKOWithLock(locks, 'nk_hf1', a1, b2), l1 = w1 === a1 ? b2 : a1
    const w2 = simKOWithLock(locks, 'nk_hf2', b1, a2), l2 = w2 === b1 ? a2 : b1
    fin[w1].finalist++; fin[w2].finalist++

    // Finale + 3e/4e — with locks
    const fW = simKOWithLock(locks, 'nk_finale', w1, w2), fL = fW === w1 ? w2 : w1
    const tW = simKOWithLock(locks, 'nk_3e4e', l1, l2), tL = tW === l1 ? l2 : l1
    fin[fW].p1++; fin[fL].p2++; fin[tW].p3++; fin[tL].p4++
  }
  return { ss, nkAp, nkBp, nkAa, nkBa, fin }
}

export function runSimO16(data, N, ha, locks) {
  const POULE_ORDER = ['A', 'B', 'C', 'D']
  const ss = {}
  for (const id of Object.keys(data)) ss[id] = data[id].teams.map(() => Array(6).fill(0))
  const fin = {}
  const ensF = t => { if (!fin[t]) fin[t] = { appear: 0, kf: 0, hf: 0, finalist: 0, p1: 0, p2: 0 } }
  const pk = POULE_ORDER.filter(k => data[k])
  for (let s = 0; s < N; s++) {
    const st = {}
    for (const id of pk) { const o = simPoule(data[id], ha, locks); st[id] = o.map(i => data[id].teams[i]); for (let r = 0; r < data[id].teams.length; r++) ss[id][o[r]][r]++ }
    const nr1s = pk.map(k => ({ team: st[k][0], pts: data[k].pts[data[k].teams.indexOf(st[k][0])] || 0, ds: data[k].ds[data[k].teams.indexOf(st[k][0])] || 0 }))
    const nr2s = pk.map(k => ({ team: st[k][1], pts: data[k].pts[data[k].teams.indexOf(st[k][1])] || 0, ds: data[k].ds[data[k].teams.indexOf(st[k][1])] || 0 }))
    nr1s.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds !== a.ds ? b.ds - a.ds : Math.random() - 0.5)
    nr2s.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.ds !== a.ds ? b.ds - a.ds : Math.random() - 0.5)
    const kf = [[nr1s[0].team, nr2s[3].team], [nr1s[1].team, nr2s[2].team], [nr1s[2].team, nr2s[1].team], [nr1s[3].team, nr2s[0].team]]
    for (const [h, a] of kf) { ensF(h); ensF(a); fin[h].appear++; fin[a].appear++; fin[h].kf++; fin[a].kf++ }

    // KF with locks
    const kfW = kf.map(([h, a], i) => simKOWithLock(locks, `nk_kf${i + 1}`, h, a))
    for (const t of kfW) fin[t].hf++

    // HF with locks: W(KF1) vs W(KF4), W(KF2) vs W(KF3)
    const hf1w = simKOWithLock(locks, 'nk_hf1', kfW[0], kfW[3])
    const hf2w = simKOWithLock(locks, 'nk_hf2', kfW[1], kfW[2])
    fin[hf1w].finalist++; fin[hf2w].finalist++

    // Finale with lock
    const fW = simKOWithLock(locks, 'nk_finale', hf1w, hf2w), fL = fW === hf1w ? hf2w : hf1w
    fin[fW].p1++; fin[fL].p2++
  }
  return { ss, fin }
}
