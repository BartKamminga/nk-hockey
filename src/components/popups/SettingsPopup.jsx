import React from 'react'
import Popup from '../common/Popup'
import Toggle from '../common/Toggle'

export default function SettingsPopup({ onClose, theme, setTheme, showForm, setShowForm, saveForm, showPlayed, setShowPlayed, savePlayed, simCount, setSimCount, saveSimCount, focusMode, setFocusMode, focusClub, setFocusClub, allClubs }) {
  return (
    <Popup title="⚙️ Instellingen" onClose={onClose} maxWidth={400}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Thema</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['light', '☀️', 'Licht'], ['dark', '🌙', 'Donker'], ['victoria', '', 'Victoria']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTheme(id)} style={{
              flex: 1, padding: '8px 6px', borderRadius: 8, border: theme === id ? '2px solid var(--accent)' : '2px solid var(--border)',
              background: theme === id ? 'var(--accent-bg)' : 'var(--bg-card)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: theme === id ? 600 : 400,
              color: 'var(--text)', fontFamily: "'DM Sans',sans-serif",
            }}>
              {id === 'victoria' ? <img src={`${import.meta.env.BASE_URL}victoria-logo.png`} alt="Victoria" style={{ width: 20, height: 20, borderRadius: 4 }} /> : <span style={{ fontSize: 18 }}>{icon}</span>}
              <span>{label}</span>
            </button>
          ))}
        </div>
        <Toggle checked={showForm} onChange={() => { const v = !showForm; setShowForm(v); saveForm(v) }} label="🔥 Vorm-badges" hint="laatste 5 wedstrijden" />
        <Toggle checked={showPlayed} onChange={() => { const v = !showPlayed; setShowPlayed(v); savePlayed(v) }} label="🎮 Gespeeld" hint="W-G-V per team" />
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span>🎲 Simulaties</span>
            <input type="range" min="500" max="40000" step="500" value={simCount}
              onChange={e => { const v = parseInt(e.target.value); setSimCount(v); saveSimCount(v) }}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: 'var(--text-muted)', minWidth: 45, textAlign: 'right' }}>{simCount.toLocaleString('nl-NL')}</span>
          </div>
        </div>
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
    </Popup>
  )
}
