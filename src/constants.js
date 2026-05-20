export const NK14_SLOTS = { A: ['A', 'B'], B: ['B', 'A'], C: ['A', 'B'], D: ['B', 'A'], E: ['A', 'B'] }
export const POULE_ORDER_14 = ['A', 'B', 'C', 'D', 'E']
export const POULE_ORDER_16 = ['A', 'B', 'C', 'D']
export const POS_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f87171', '#c084fc', '#94a3b8']
export const COMP_ORDER = ['MO14', 'JO14', 'MO16', 'JO16']
export const COMP_LABELS = { MO14: 'MO14', JO14: 'JO14', MO16: 'MO16', JO16: 'JO16' }
export const COMP_LABELS_LONG = { MO14: 'Meisjes O14', JO14: 'Jongens O14', MO16: 'Meisjes O16', JO16: 'Jongens O16' }
export const IS_O16 = t => t === 'MO16' || t === 'JO16'

export const DEFAULT_CLUB = 'Victoria'
export const STORAGE_KEY_CLUB = 'nk_focus_club'
export const STORAGE_KEY_COMP = 'nk_active_comp'

export function getSavedClub() { try { return localStorage.getItem(STORAGE_KEY_CLUB) || DEFAULT_CLUB } catch { return DEFAULT_CLUB } }
export function saveClub(name) { try { localStorage.setItem(STORAGE_KEY_CLUB, name) } catch {} }
export function getSavedComp() { try { return localStorage.getItem(STORAGE_KEY_COMP) || null } catch { return null } }
export function saveComp(name) { try { localStorage.setItem(STORAGE_KEY_COMP, name) } catch {} }

export const DATA_URLS = ['data/mo14.json', 'data/jo14.json', 'data/mo16.json', 'data/jo16.json']

export const VERSION = '5.0'
export const CHANGELOG = [
  { version: '5.0', date: '20 mei 2026', changes: [
    'Migratie naar Vite + React — snellere builds, betere code-structuur',
    'Componenten opgesplitst in aparte bestanden',
    'GitHub Actions: automatische build en deploy bij elke push',
    'Geen Babel-in-browser meer — pre-compiled JavaScript',
    'VS Code ondersteuning: syntax highlighting, IntelliSense, hot-reload',
  ]},
  { version: '4.13', date: '19 mei 2026', changes: ['Gekozen competitie onthouden via localStorage'] },
  { version: '4.12.2', date: '19 mei 2026', changes: ['Discontinued wedstrijden uitgefilterd'] },
  { version: '4.12', date: '19 mei 2026', changes: ['Header 2-regelig'] },
  { version: '4.9', date: '19 mei 2026', changes: ['Focus mode filtert NK indeling/speelschema'] },
  { version: '4.8', date: '19 mei 2026', changes: ['Focus mode toggle'] },
  { version: '4.7', date: '19 mei 2026', changes: ['Focus club kiesbaar'] },
  { version: '4.0', date: '19 mei 2026', changes: ['O16 support met KF/HF/Finale simulatie'] },
  { version: '3.0', date: '19 mei 2026', changes: ['Auto-load data van server'] },
  { version: '2.0', date: '19 mei 2026', changes: ['Multi-competitie MO14+JO14'] },
  { version: '1.0', date: '19 mei 2026', changes: ['Eerste dynamische versie'] },
]
