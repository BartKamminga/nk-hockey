import React, { useState } from 'react'
import { VERSION, COMP_LABELS, getSavedForm, saveForm, getSavedPlayed, savePlayed } from './constants'
import { ChangelogContent } from './changelog'
import { NK_SCHEDULES } from './lib/nk-schedules'
import { SchemaTab } from './components/Speelschema'
import { O14OverzichtTab, O16OverzichtTab } from './components/Overzicht'
import SimTab from './components/SimTab'
import { useCompetitionData } from './dataloader/useCompetitionData'
import Popup from './components/common/Popup'
import Toggle from './components/common/Toggle'
import DisclaimerPopup from './components/popups/DisclaimerPopup'
import FeedbackPopup from './components/popups/FeedbackPopup'

export default function App() {
  const [mainTab, setMainTab] = useState('overzicht')
  const [showVersion, setShowVersion] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    try { return localStorage.getItem('nk_disclaimer_seen') !== 'true' } catch { return true }
  })
  const [showForm, setShowForm] = useState(getSavedForm)
  const [showPlayed, setShowPlayed] = useState(getSavedPlayed)
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem('nk_dark_mode'); return s === 'true' || (s === null && window.matchMedia('(prefers-color-scheme: dark)').matches) } catch { return false }
  })

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    try { localStorage.setItem('nk_dark_mode', darkMode ? 'true' : 'false') } catch {}
  }, [darkMode])

  function dismissDisclaimer() {
    setShowDisclaimer(false)
    try { localStorage.setItem('nk_disclaimer_seen', 'true') } catch {}
  }

  const {
    comps, loading, dataSource, focusClub, focusMode, effectiveComp, data, filteredData,
    label, myTeam, allClubs, visibleTypes, pouleOrder, o16,
    setFocusClub, setFocusMode, setActiveCompetition, fetchFromServer
  } = useCompetitionData()

  if (loading) return <div className="loading">Laden...</div>
  if (!comps) return (
    <div className="loading">
      <p>Geen data beschikbaar.</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gebruik de Chrome extensie om data te laden, of controleer of de data bestanden beschikbaar zijn.</p>
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
              {focusClub || 'Kies club'}{focusMode && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 4 }}>focus</span>}
            </div>
          </div>
          <div className="top-end">
            <button className="reload-btn" onClick={() => setShowSettings(!showSettings)} title="Instellingen">⚙️</button>
            <button className="reload-btn" onClick={() => setShowVersion(!showVersion)} title="Menu">v{VERSION}</button>
          </div>
        </div>
        <div className="top-comp-row">
          {visibleTypes.map(t => <button key={t} className={`top-comp-btn ${effectiveComp === t ? 'active' : ''}`}
            onClick={() => setActiveCompetition(t)}>{COMP_LABELS[t] || t}</button>)}
        </div>
      </div>

      {/* Menu popup */}
      {showVersion && <Popup title={`🏑 NK Hockey v${VERSION}`} onClose={() => setShowVersion(false)}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
          <button className="reload-btn" onClick={() => { fetchFromServer(); setShowVersion(false) }} style={{ fontSize: 12, padding: '6px 12px' }}>↻ Herlaad</button>
          <button className="reload-btn" onClick={() => { setShowVersion(false); setShowDisclaimer(true) }} style={{ fontSize: 12, padding: '6px 12px' }}>ℹ️ Over</button>
          <button className="reload-btn" onClick={() => { setShowVersion(false); setShowFeedback(true) }} style={{ fontSize: 12, padding: '6px 12px' }}>💬 Feedback</button>
        </div>
        <ChangelogContent />
      </Popup>}

      {/* Disclaimer */}
      {showDisclaimer && <DisclaimerPopup onClose={dismissDisclaimer} />}

      {/* Feedback */}
      {showFeedback && <FeedbackPopup onClose={() => setShowFeedback(false)} />}

      {/* Settings */}
      {showSettings && <Popup title="⚙️ Instellingen" onClose={() => setShowSettings(false)} maxWidth={400}>
        <div style={{ padding: '12px 16px' }}>
          <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} label="🌙 Dark mode" hint="donker thema" />
          <Toggle checked={showForm} onChange={() => { const v = !showForm; setShowForm(v); saveForm(v) }} label="🔥 Vorm-badges" hint="laatste 5 wedstrijden" />
          <Toggle checked={showPlayed} onChange={() => { const v = !showPlayed; setShowPlayed(v); savePlayed(v) }} label="🎮 Gespeeld" hint="W-G-V per team" />
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 12 }}>
            <Toggle checked={focusMode} onChange={() => setFocusMode(!focusMode)} label="🏑 Focus mode" hint="alleen poule van club" />
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Club</div>
              <div className="club-list" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                {allClubs.map(club => (
                  <div key={club} className={'club-item' + (club === focusClub ? ' club-active' : '')}
                    onClick={() => setFocusClub(club)}>
                    {club === focusClub && <span style={{ color: 'var(--accent)', marginRight: 6 }}>✓</span>}{club}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Popup>}

      <div className="main-tabs">
        {[['overzicht', '📋 Overzicht'], ['schema', '📅 Speelschema'], ['sim', '🎲 Simulaties']].map(([id, lbl]) =>
          <button key={id} className={`main-tab ${mainTab === id ? 'active' : ''}`} onClick={() => setMainTab(id)}>{lbl}</button>)}
      </div>

      {mainTab === 'overzicht' && (o16
        ? <O16OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} showForm={showForm} showPlayed={showPlayed} />
        : <O14OverzichtTab data={data} filteredData={focusMode ? filteredData : null} myTeam={myTeam} nkSchedule={NK_SCHEDULES[effectiveComp]} showForm={showForm} showPlayed={showPlayed} />
      )}
      {mainTab === 'schema' && <SchemaTab data={focusMode ? filteredData : data} myTeam={myTeam} pouleOrder={pouleOrder} />}
      {mainTab === 'sim' && <SimTab data={data} myTeam={myTeam} effectiveComp={effectiveComp} showForm={showForm} showPlayed={showPlayed} key={effectiveComp + '_sim'} />}
    </>
  )
}
