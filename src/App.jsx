import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { VERSION, CHANGELOG, COMP_ORDER, COMP_LABELS, COMP_LABELS_LONG, IS_O16, POULE_ORDER_14, POULE_ORDER_16, NK14_SLOTS, DATA_URLS, getSavedClub, saveClub, getSavedComp, saveComp } from './constants'
import { NK_SCHEDULES } from './data/nk-schedules'
import { parseO14, parseO16, findMyTeam, getAllClubs } from './parsers'
import { SchemaTab } from './components/Shared'
import { O14OverzichtTab, O14SimTab } from './components/O14'
import { O16OverzichtTab, O16SimTab } from './components/O16'
import WhatIfTab from './components/WhatIf'

function ChangelogContent() {
  return (
    <div style={{ maxWidth: 700 }}>
      {CHANGELOG.map(e => (
        <div key={e.version} className="card" style={{ marginBottom: 12 }}>
          <div className="card-header" style={{ justifyContent: 'space-between' }}><span>v{e.version}</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: '#888', fontWeight: 400 }}>{e.date}</span></div>
          <div style={{ padding: '10px 14px' }}>{e.changes.map((c, i) => <div key={i} style={{ fontSize: 12.5, color: '#444', padding: '3px 0', display: 'flex', gap: 8 }}><span style={{ color: '#16a34a', flexShrink: 0 }}>+</span><span>{c}</span></div>)}</div>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [comps, setComps] = useState(null)
  const [activeComp, setActiveComp] = useState(null)
  const [mainTab, setMainTab] = useState('overzicht')
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState(null)
  const [showVersion, setShowVersion] = useState(false)
  const [focusClub, setFocusClub] = useState(getSavedClub)
  const [showClubPicker, setShowClubPicker] = useState(false)
  const [focusMode, setFocusMode] = useState(false)

  const fetchFromServer = useCallback(() => {
    setLoading(true)
    const merged = {}
    const promises = DATA_URLS.map(url =>
      fetch(url + '?t=' + Date.now()).then(r => r.ok ? r.text() : null).then(raw => {
        if (!raw) return
        let parsed = parseO16(raw); if (Object.keys(parsed).length === 0) parsed = parseO14(raw)
        for (const t in parsed) { if (!merged[t]) merged[t] = {}; Object.assign(merged[t], parsed[t]) }
      }).catch(() => {})
    )
    Promise.all(promises).then(() => {
      if (Object.keys(merged).length > 0) {
        setComps(merged)
        const saved = getSavedComp()
        const first = saved && merged[saved] ? saved : COMP_ORDER.find(k => merged[k])
        setActiveComp(prev => first || (prev && merged[prev] ? prev : Object.keys(merged)[0]))
        if (first) saveComp(first)
        setDataSource('server')
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => { fetchFromServer() }, [fetchFromServer])

  const types = useMemo(() => comps ? COMP_ORDER.filter(k => comps[k]) : [], [comps])

  const visibleTypes = useMemo(() => {
    if (!comps || !focusMode || !focusClub) return types
    return types.filter(t => {
      const d = comps[t]
      for (const p in d) {
        if (d[p].teams && d[p].teams.indexOf(focusClub) >= 0) return true
      }
      return false
    })
  }, [focusMode, focusClub, types, comps])

  const effectiveComp = useMemo(() => {
    if (!comps) return null
    if (focusMode && visibleTypes.indexOf(activeComp) < 0 && visibleTypes.length > 0) return visibleTypes[0]
    return activeComp
  }, [focusMode, visibleTypes, activeComp, comps])

  const data = useMemo(() => (effectiveComp ? comps[effectiveComp] || {} : {}), [comps, effectiveComp])

  const filteredData = useMemo(() => {
    if (!focusMode || !focusClub) return data
    const filtered = {}
    for (const pk in data) {
      if (data[pk].teams && data[pk].teams.indexOf(focusClub) >= 0) filtered[pk] = data[pk]
    }
    return filtered
  }, [focusMode, focusClub, data])

  const label = useMemo(() => effectiveComp ? COMP_LABELS_LONG[effectiveComp] || effectiveComp : '', [effectiveComp])

  const myTeam = useMemo(() => (focusClub && comps && findMyTeam(comps, focusClub)) ? focusClub : null, [comps, focusClub])

  const o16 = useMemo(() => IS_O16(effectiveComp), [effectiveComp])

  const pouleOrder = useMemo(() => (o16 ? POULE_ORDER_16 : POULE_ORDER_14), [o16])

  if (loading) return <div className="import-screen"><h2>🏑 NK Simulatie</h2><p>Data laden...</p></div>
  if (!comps) return (
    <div className="import-screen">
      <h2>🏑 NK Simulatie</h2>
      <p>Kon de data niet laden vanaf de server.</p>
      <button className="reload-btn" onClick={fetchFromServer}>Opnieuw proberen</button>
    </div>
  )

  return (
    <>
      <div className="top-bar">
        <div className="top-row">
          <div className="top-team">
            <div className="top-team-icon" onClick={() => { if (focusClub) setFocusMode(!focusMode) }}
              style={{ cursor: 'pointer', border: focusMode ? '2px solid #3b82f6' : '2px solid transparent', borderRadius: '50%' }}
              title={focusMode ? 'Toon alles' : 'Toon alleen ' + focusClub}>🏑</div>
            <div className="top-team-name" onClick={() => setShowClubPicker(true)} style={{ cursor: 'pointer' }} title="Kies focus club">
              {focusClub || 'Kies club'}{focusMode && <span style={{ fontSize: 10, color: '#3b82f6', marginLeft: 4 }}>focus</span>}
            </div>
          </div>
          <div className="top-end">
            <button className="reload-btn" onClick={() => fetchFromServer()} title="Herlaad data">↻</button>
            <button className="reload-btn" onClick={() => setShowVersion(!showVersion)} title="Versiegeschiedenis">v{VERSION}</button>
          </div>
        </div>
        <div className="top-comp-row">
          {visibleTypes.map(t => <button key={t} className={`top-comp-btn ${effectiveComp === t ? 'active' : ''}`}
            onClick={() => { setActiveComp(t); saveComp(t); setMainTab('overzicht') }}>{COMP_LABELS[t] || t}</button>)}
        </div>
      </div>

      {showVersion && <>
        <div className="version-overlay" onClick={() => setShowVersion(false)}></div>
        <div className="version-popup">
          <div className="version-popup-header"><span>Versiegeschiedenis</span><button className="version-close" onClick={() => setShowVersion(false)}>✕</button></div>
          <div className="version-popup-body"><ChangelogContent /></div>
        </div>
      </>}

      {showClubPicker && <>
        <div className="version-overlay" onClick={() => setShowClubPicker(false)}></div>
        <div className="version-popup" style={{ maxWidth: 400 }}>
          <div className="version-popup-header"><span>🏑 Kies focus club</span><button className="version-close" onClick={() => setShowClubPicker(false)}>✕</button></div>
          <div className="version-popup-body">
            <div className="club-list">
              {getAllClubs(comps).map(club => {
                const active = club === focusClub
                return <div key={club} className={'club-item' + (active ? ' club-active' : '')}
                  onClick={() => { setFocusClub(club); saveClub(club); setShowClubPicker(false) }}>
                  {active && <span style={{ color: '#3b82f6', marginRight: 6 }}>✓</span>}{club}
                </div>
              })}
            </div>
          </div>
        </div>
      </>}

      <div className="main-tabs">
        {[['overzicht', '📋 Overzicht'], ['schema', '📅 Speelschema'], ['sim', '🎲 Simulaties'], ['whatif', '🔮 What-if']].map(([id, lbl]) =>
          <button key={id} className={`main-tab ${mainTab === id ? 'active' : ''}`} onClick={() => setMainTab(id)}>{lbl}</button>
        )}
      </div>

      {mainTab === 'overzicht' && (o16
        ? <O16OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} />
        : <O14OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} nkSchedule={NK_SCHEDULES[effectiveComp]} />
      )}
      {mainTab === 'schema' && <SchemaTab data={focusMode ? filteredData : data} myTeam={myTeam} pouleOrder={pouleOrder} />}
      {mainTab === 'sim' && (o16
        ? <O16SimTab data={data} myTeam={myTeam} key={effectiveComp} />
        : <O14SimTab data={data} myTeam={myTeam} key={effectiveComp} />
      )}
      {mainTab === 'whatif' && <WhatIfTab data={data} myTeam={myTeam} effectiveComp={effectiveComp} key={effectiveComp + '_whatif'} />}

      <footer>NK {label} · v{VERSION} · data {dataSource === 'server' ? 'van server' : 'handmatig'}</footer>
    </>
  )
}
