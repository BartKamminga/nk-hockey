import React, { useState } from 'react'
import { VERSION, COMP_LABELS, getSavedForm, saveForm, getSavedPlayed, savePlayed } from './constants'
import { ChangelogContent } from './changelog'
import { NK_SCHEDULES } from './lib/nk-schedules'
import { SchemaTab } from './components/Speelschema'
import { O14OverzichtTab } from './components/Overzicht'
import { O16OverzichtTab } from './components/Overzicht'
import SimTab from './components/SimTab'
import { useCompetitionData } from './dataloader/useCompetitionData'

export default function App() {
  const [mainTab, setMainTab] = useState('overzicht')
  const [showVersion, setShowVersion] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    try { return localStorage.getItem('nk_disclaimer_seen') !== 'true' } catch { return true }
  })
  const [showForm, setShowForm] = useState(getSavedForm)
  const [showPlayed, setShowPlayed] = useState(getSavedPlayed)

  function dismissDisclaimer() {
    setShowDisclaimer(false)
    try { localStorage.setItem('nk_disclaimer_seen', 'true') } catch {}
  }

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
            <div className="top-team-name" onClick={() => setShowSettings(true)} style={{ cursor: 'pointer' }} title="Instellingen">
              {focusClub || 'Kies club'}{focusMode && <span style={{ fontSize: 10, color: '#3b82f6', marginLeft: 4 }}>focus</span>}
            </div>
          </div>
          <div className="top-end">
            <button className="reload-btn" onClick={() => setShowSettings(!showSettings)} title="Instellingen">⚙️</button>
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
          <div className="version-popup-body">
            <div style={{ marginBottom: 12 }}>
              <button className="reload-btn" onClick={() => { setShowVersion(false); setShowDisclaimer(true) }} style={{ fontSize: 12, padding: '6px 12px' }}>ℹ️ Over deze website</button>
            </div>
            <ChangelogContent />
          </div>
        </div>
      </>}

      {showDisclaimer && <>
        <div className="version-overlay" onClick={dismissDisclaimer}></div>
        <div className="version-popup" style={{ maxWidth: 520 }}>
          <div className="version-popup-header"><span>ℹ️ Over deze website</span><button className="version-close" onClick={dismissDisclaimer}>✕</button></div>
          <div className="version-popup-body" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: '#333' }}>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Onafhankelijk hobbyproject</p>
              <p>Deze website is een persoonlijk hobbyproject en is op geen enkele wijze verbonden aan, goedgekeurd door, of geassocieerd met de Koninklijke Nederlandse Hockey Bond (KNHB) of hockey.nl.</p>
              <p style={{ marginTop: 10 }}>De wedstrijddata die op deze website wordt getoond is afkomstig van publiek beschikbare informatie op hockey.nl. Er is op dit moment geen officieel akkoord of licentieovereenkomst met de KNHB voor het gebruik van deze data.</p>
              <p style={{ marginTop: 10 }}>De op deze website getoonde simulaties, voorspellingen en scenario-analyses zijn puur indicatief en gebaseerd op statistische modellen (Monte Carlo simulatie). Aan de uitkomsten kunnen geen rechten worden ontleend.</p>
              <p style={{ marginTop: 10 }}>De maker van deze website aanvaardt geen aansprakelijkheid voor de juistheid, volledigheid of actualiteit van de getoonde informatie. Raadpleeg altijd hockey.nl voor officiële standen en uitslagen.</p>
              <p style={{ marginTop: 10, fontSize: 12, color: '#888' }}>Mocht de KNHB bezwaar hebben tegen het gebruik van de data, dan zal de website onmiddellijk worden aangepast of verwijderd.</p>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button className="run-btn" onClick={dismissDisclaimer} style={{ padding: '8px 24px' }}>Begrepen</button>
            </div>
          </div>
        </div>
      </>}

      {showSettings && <>
        <div className="version-overlay" onClick={() => setShowSettings(false)}></div>
        <div className="version-popup" style={{ maxWidth: 400 }}>
          <div className="version-popup-header"><span>⚙️ Instellingen</span><button className="version-close" onClick={() => setShowSettings(false)}>✕</button></div>
          <div className="version-popup-body" style={{ padding: '12px 16px' }}>
            {/* Display toggles */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}
              onClick={() => { const v = !showForm; setShowForm(v); saveForm(v) }}>
              <span style={{ width: 32, height: 18, borderRadius: 9, background: showForm ? '#3b82f6' : '#ccc', position: 'relative', display: 'inline-block', transition: 'background .2s', flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: showForm ? 16 : 2, transition: 'left .2s' }} />
              </span>
              <span>🔥 Vorm-badges</span>
              <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>laatste 5 wedstrijden</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}
              onClick={() => { const v = !showPlayed; setShowPlayed(v); savePlayed(v) }}>
              <span style={{ width: 32, height: 18, borderRadius: 9, background: showPlayed ? '#3b82f6' : '#ccc', position: 'relative', display: 'inline-block', transition: 'background .2s', flexShrink: 0 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: showPlayed ? 16 : 2, transition: 'left .2s' }} />
              </span>
              <span>🎮 Gespeeld</span>
              <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>W-G-V per team</span>
            </label>

            {/* Focus + Club */}
            <div style={{ borderTop: '1px solid #e0ddd8', marginTop: 8, paddingTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', fontSize: 13 }}
                onClick={() => setFocusMode(!focusMode)}>
                <span style={{ width: 32, height: 18, borderRadius: 9, background: focusMode ? '#3b82f6' : '#ccc', position: 'relative', display: 'inline-block', transition: 'background .2s', flexShrink: 0 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: focusMode ? 16 : 2, transition: 'left .2s' }} />
                </span>
                <span>🏑 Focus mode</span>
                <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>alleen poule van club</span>
              </label>
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Club</div>
                <div className="club-list" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0ddd8', borderRadius: 8 }}>
                  {allClubs.map(club => {
                    const active = club === focusClub
                    return <div key={club} className={'club-item' + (active ? ' club-active' : '')}
                      onClick={() => setFocusClub(club)}>
                      {active && <span style={{ color: '#3b82f6', marginRight: 6 }}>✓</span>}{club}
                    </div>
                  })}
                </div>
              </div>
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
        ? <O16OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} showForm={showForm} showPlayed={showPlayed} />
        : <O14OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} nkSchedule={NK_SCHEDULES[effectiveComp]} showForm={showForm} showPlayed={showPlayed} />
      )}
      {mainTab === 'schema' && <SchemaTab data={focusMode ? filteredData : data} myTeam={myTeam} pouleOrder={pouleOrder} />}
      {mainTab === 'sim' && <SimTab data={data} myTeam={myTeam} effectiveComp={effectiveComp} showForm={showForm} showPlayed={showPlayed} key={effectiveComp + '_sim'} />}

      <footer>NK {label} · v{VERSION} · data {dataSource === 'server' ? 'van server' : 'handmatig'}</footer>
    </>
  )
}
