import React, { useState } from 'react'
import { VERSION, CHANGELOG, COMP_LABELS } from './constants'
import { NK_SCHEDULES } from './data/nk-schedules'
import { SchemaTab } from './components/Shared'
import { O14OverzichtTab } from './components/O14'
import { O16OverzichtTab } from './components/O16'
import SimTab from './components/SimTab'
import { useCompetitionData } from './hooks/useCompetitionData'

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
  const [mainTab, setMainTab] = useState('overzicht')
  const [showVersion, setShowVersion] = useState(false)
  const [showClubPicker, setShowClubPicker] = useState(false)

  const {
    comps,
    loading,
    dataSource,
    focusClub,
    focusMode,
    effectiveComp,
    data,
    filteredData,
    label,
    myTeam,
    o16,
    pouleOrder,
    visibleTypes,
    allClubs,
    fetchFromServer,
    setActiveCompetition,
    setFocusClub,
    setFocusMode,
  } = useCompetitionData()

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
            onClick={() => { setActiveCompetition(t) }}>{COMP_LABELS[t] || t}</button>)}
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
              {allClubs.map(club => {
                const active = club === focusClub
                return <div key={club} className={'club-item' + (active ? ' club-active' : '')}
                  onClick={() => { setFocusClub(club); setShowClubPicker(false) }}>
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
      {mainTab === 'sim' && <SimTab data={data} myTeam={myTeam} effectiveComp={effectiveComp} key={effectiveComp + '_sim'} />}

      <footer>NK {label} · v{VERSION} · data {dataSource === 'server' ? 'van server' : 'handmatig'}</footer>
    </>
  )
}
