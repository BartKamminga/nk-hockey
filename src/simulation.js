// Simulation core — shared by O14 and O16

export const simMatch = (ha) => {
  const a = (ha || 0) / 100
  const rW = 0.38 + a, rD = 0.23, rL = Math.max(0.39 - a, 0.05)
  const t = rW + rD + rL, pW = rW / t, pD = rD / t, r = Math.random()
  return r < pW ? [3, 0] : r < pW + pD ? [1, 1] : [0, 3]
}

export const simGD = () => 1 + Math.floor(Math.random() * 4)
export const simKO = () => Math.random() < 0.5 ? 'home' : 'away'

export function simPoule(poule, ha) {
  const pts = [...poule.pts], ds = [...poule.ds]
  for (const [h, a] of poule.remaining) {
    const hi = poule.teams.indexOf(h), ai = poule.teams.indexOf(a)
    if (hi < 0 || ai < 0) continue
    const [hp, ap] = simMatch(ha)
    pts[hi] += hp; pts[ai] += ap
    const gd = simGD()
    if (hp > ap) { ds[hi] += gd; ds[ai] -= gd }
    else if (ap > hp) { ds[ai] += gd; ds[hi] -= gd }
  }
  return pts.map((_, i) => i).sort((a, b) => pts[b] !== pts[a] ? pts[b] - pts[a] : ds[b] - ds[a])
}

export function simNKPoule(names) {
  const n = names.length, pts = Array(n).fill(0), ds = Array(n).fill(0)
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const [hp, ap] = simMatch(0)
    pts[i] += hp; pts[j] += ap
    const gd = simGD()
    if (hp > ap) { ds[i] += gd; ds[j] -= gd }
    else if (ap > hp) { ds[j] += gd; ds[i] -= gd }
  }
  return pts.map((_, i) => i).sort((a, b) => pts[b] !== pts[a] ? pts[b] - pts[a] : ds[b] - ds[a])
}

export function runSimO14(data, N, ha) {
  const NK14_SLOTS = { A: ['A', 'B'], B: ['B', 'A'], C: ['A', 'B'], D: ['B', 'A'], E: ['A', 'B'] }
  const POULE_ORDER = ['A', 'B', 'C', 'D', 'E']
  const ss = {}
  for (const id of Object.keys(data)) ss[id] = data[id].teams.map(() => Array(6).fill(0))
  const nkAp = {}, nkBp = {}, nkAa = {}, nkBa = {}, fin = {}
  const ensF = t => { if (!fin[t]) fin[t] = { appear: 0, sfReach: 0, finalist: 0, p1: 0, p2: 0, p3: 0, p4: 0 } }
  const pk = POULE_ORDER.filter(k => data[k])
  for (let s = 0; s < N; s++) {
    const st = {}
    for (const id of pk) { const o = simPoule(data[id], ha); st[id] = o.map(i => data[id].teams[i]); for (let r = 0; r < data[id].teams.length; r++) ss[id][o[r]][r]++ }
    const nkA = pk.filter(k => NK14_SLOTS[k][0] === 'A').map(k => st[k][0]).concat(pk.filter(k => NK14_SLOTS[k][1] === 'A').map(k => st[k][1]))
    const nkB = pk.filter(k => NK14_SLOTS[k][0] === 'B').map(k => st[k][0]).concat(pk.filter(k => NK14_SLOTS[k][1] === 'B').map(k => st[k][1]))
    for (const t of nkA) { nkAa[t] = (nkAa[t] || 0) + 1; if (!nkAp[t]) nkAp[t] = Array(5).fill(0); ensF(t); fin[t].appear++ }
    for (const t of nkB) { nkBa[t] = (nkBa[t] || 0) + 1; if (!nkBp[t]) nkBp[t] = Array(5).fill(0); ensF(t); fin[t].appear++ }
    const oA = simNKPoule(nkA), oB = simNKPoule(nkB)
    for (let r = 0; r < nkA.length; r++) nkAp[nkA[oA[r]]][r]++
    for (let r = 0; r < nkB.length; r++) nkBp[nkB[oB[r]]][r]++
    const [a1, a2, b1, b2] = [nkA[oA[0]], nkA[oA[1]], nkB[oB[0]], nkB[oB[1]]]
    for (const t of [a1, a2, b1, b2]) fin[t].sfReach++
    const w1 = simKO() === 'home' ? a1 : b2, l1 = w1 === a1 ? b2 : a1
    const w2 = simKO() === 'home' ? b1 : a2, l2 = w2 === b1 ? a2 : b1
    fin[w1].finalist++; fin[w2].finalist++
    const fW = Math.random() < 0.5 ? w1 : w2, fL = fW === w1 ? w2 : w1
    const tW = Math.random() < 0.5 ? l1 : l2, tL = tW === l1 ? l2 : l1
    fin[fW].p1++; fin[fL].p2++; fin[tW].p3++; fin[tL].p4++
  }
  return { ss, nkAp, nkBp, nkAa, nkBa, fin }
}

export function runSimO16(data, N, ha) {
  const POULE_ORDER = ['A', 'B', 'C', 'D']
  const ss = {}
  for (const id of Object.keys(data)) ss[id] = data[id].teams.map(() => Array(6).fill(0))
  const fin = {}
  const ensF = t => { if (!fin[t]) fin[t] = { appear: 0, kf: 0, hf: 0, finalist: 0, p1: 0, p2: 0 } }
  const pk = POULE_ORDER.filter(k => data[k])
  for (let s = 0; s < N; s++) {
    const st = {}
    for (const id of pk) { const o = simPoule(data[id], ha); st[id] = o.map(i => data[id].teams[i]); for (let r = 0; r < data[id].teams.length; r++) ss[id][o[r]][r]++ }
    const nr1s = pk.map(k => ({ team: st[k][0], pts: data[k].pts[data[k].teams.indexOf(st[k][0])] || 0 }))
    const nr2s = pk.map(k => ({ team: st[k][1], pts: data[k].pts[data[k].teams.indexOf(st[k][1])] || 0 }))
    nr1s.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : Math.random() - 0.5)
    nr2s.sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : Math.random() - 0.5)
    const kf = [[nr1s[0].team, nr2s[3].team], [nr1s[1].team, nr2s[2].team], [nr1s[2].team, nr2s[1].team], [nr1s[3].team, nr2s[0].team]]
    for (const [h, a] of kf) { ensF(h); ensF(a); fin[h].appear++; fin[a].appear++; fin[h].kf++; fin[a].kf++ }
    const kfW = kf.map(([h, a]) => simKO() === 'home' ? h : a)
    for (const t of kfW) fin[t].hf++
    const hf1w = simKO() === 'home' ? kfW[0] : kfW[3]
    const hf2w = simKO() === 'home' ? kfW[1] : kfW[2]
    fin[hf1w].finalist++; fin[hf2w].finalist++
    const fW = Math.random() < 0.5 ? hf1w : hf2w, fL = fW === hf1w ? hf2w : hf1w
    fin[fW].p1++; fin[fL].p2++
  }
  return { ss, fin }
}
