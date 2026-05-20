import React, { useState, useEffect, useRef } from 'react'
import { VERSION, CHANGELOG, COMP_ORDER, COMP_LABELS, COMP_LABELS_LONG, IS_O16, POULE_ORDER_14, POULE_ORDER_16, NK14_SLOTS, DATA_URLS, getSavedClub, saveClub, getSavedComp, saveComp } from './constants'
import { NK_SCHEDULES } from './data/nk-schedules'
import { parseO14, parseO16, findMyTeam, getAllClubs } from './parsers'
import { SchemaTab } from './components/Shared'
import { O14OverzichtTab, O14SimTab } from './components/O14'
import { O16OverzichtTab, O16SimTab } from './components/O16'

function ImportScreen({ onImport }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState([])
  const fileRef = useRef(null)
  const mergedRef = useRef({})

  function mergeInto(raw, filename) {
    try {
      const comps = mergedRef.current
      const o14 = parseO14(raw); for (const t in o14) { if (!comps[t]) comps[t] = {}; Object.assign(comps[t], o14[t]) }
      const o16 = parseO16(raw); for (const t in o16) { if (!comps[t]) comps[t] = {}; Object.assign(comps[t], o16[t]) }
      mergedRef.current = comps
      const summary = Object.entries(comps).map(([type, d]) => `${type}: ${Object.keys(d).length} poules`)
      setLoaded(prev => [...prev, { name: filename, status: '✅', detail: summary.join(', ') }])
      setError('')
      return true
    } catch (e) {
      setLoaded(prev => [...prev, { name: filename, status: '❌', detail: e.message }])
      return false
    }
  }

  function handleFiles(e) {
    for (const file of e.target.files) {
      const reader = new FileReader()
      reader.onload = ev => mergeInto(ev.target.result, file.name)
      reader.readAsText(file)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    for (const file of e.dataTransfer.files) {
      const reader = new FileReader()
      reader.onload = ev => mergeInto(ev.target.result, file.name)
      reader.readAsText(file)
    }
  }

  const totalComps = Object.keys(mergedRef.current).length
  const totalPoules = Object.values(mergedRef.current).reduce((s, d) => s + Object.keys(d).length, 0)

  return (
    <div className="import-screen">
      <h2>🏑 NK Simulatie</h2>
      <p>Ondersteunt MO14, JO14, MO16, JO16. Upload meerdere bestanden — ze worden samengevoegd.</p>
      <div style={{ border: '2px dashed #ccc', borderRadius: 10, padding: 20, background: '#fff', marginBottom: 12, cursor: 'pointer', textAlign: 'center' }}
        onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current.click()}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
        <div style={{ fontSize: 13, color: '#888' }}>Sleep bestanden hierheen of klik om te selecteren</div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Meerdere bestanden tegelijk mogelijk</div>
      </div>
      <input type="file" accept=".json" multiple ref={fileRef} onChange={handleFiles} style={{ display: 'none' }} />
      {loaded.length > 0 && (
        <div style={{ textAlign: 'left', marginBottom: 12 }}>
          {loaded.map((f, i) => <div key={i} style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", padding: '3px 0', color: f.status === '✅' ? '#16a34a' : '#dc2626' }}>{f.status} {f.name} — {f.detail}</div>)}
          {totalComps > 0 && <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: '#1a1a1a' }}>Totaal: {totalComps} competities · {totalPoules} poules</div>}
        </div>
      )}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Of plak JSON:</div>
        <textarea className="import-area" style={{ minHeight: 80 }} value={text} onChange={e => setText(e.target.value)}
          onPaste={e => { setTimeout(() => { const v = e.target.value; if (v.trim().startsWith('{')) { mergeInto(v, 'clipboard'); setText(v) } }, 50) }}
          placeholder="Plak JSON hier..." />
        {text && <button className="demo-btn" style={{ marginTop: 6 }} onClick={() => mergeInto(text, 'textarea')}>+ Toevoegen</button>}
      </div>
      {error && <div className="import-error">{error}</div>}
      <br />
      <button className="import-btn" onClick={() => { const c = mergedRef.current; if (Object.keys(c).length === 0) { setError('Geen data'); return }; onImport(c) }} disabled={totalComps === 0}>
        {totalComps > 0 ? `Start met ${totalPoules} poules` : 'Laad eerst data'}
      </button>
    </div>
  )
}

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

  function fetchFromServer() {
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
  }

  useEffect(() => { fetchFromServer() }, [])

  const handleImport = c => {
    setComps(c)
    const saved = getSavedComp()
    const first = saved && c[saved] ? saved : COMP_ORDER.find(k => c[k])
    setActiveComp(first || Object.keys(c)[0])
    saveComp(first || Object.keys(c)[0])
    setDataSource('manual')
  }

  if (loading) return <div className="import-screen"><h2>🏑 NK Simulatie</h2><p>Data laden...</p></div>
  if (!comps) return <ImportScreen onImport={handleImport} />

  const types = COMP_ORDER.filter(k => comps[k])
  const visibleTypes = focusMode && focusClub
    ? types.filter(t => { const d = comps[t]; for (const p in d) { if (d[p].teams && d[p].teams.indexOf(focusClub) >= 0) return true } return false })
    : types
  const effectiveComp = focusMode && visibleTypes.indexOf(activeComp) < 0 && visibleTypes.length > 0 ? visibleTypes[0] : activeComp
  const data = comps[effectiveComp] || {}
  let filteredData = data
  if (focusMode && focusClub) {
    filteredData = {}
    for (const pk in data) { if (data[pk].teams && data[pk].teams.indexOf(focusClub) >= 0) filteredData[pk] = data[pk] }
  }
  const label = COMP_LABELS_LONG[effectiveComp] || effectiveComp
  const myTeam = focusClub && findMyTeam(comps, focusClub) ? focusClub : null
  const o16 = IS_O16(effectiveComp)
  const pouleOrder = o16 ? POULE_ORDER_16 : POULE_ORDER_14

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
        {[['overzicht', '📋 Overzicht'], ['schema', '📅 Speelschema'], ['sim', '🎲 Simulaties']].map(([id, lbl]) =>
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

      <footer>NK {label} · v{VERSION} · data {dataSource === 'server' ? 'van server' : 'handmatig'}</footer>
    </>
  )
}
