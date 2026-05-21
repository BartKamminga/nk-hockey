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
export const STORAGE_KEY_FORM = 'nk_show_form'

export function getSavedClub() { try { return localStorage.getItem(STORAGE_KEY_CLUB) || DEFAULT_CLUB } catch { return DEFAULT_CLUB } }
export function saveClub(name) { try { localStorage.setItem(STORAGE_KEY_CLUB, name) } catch {} }
export function getSavedComp() { try { return localStorage.getItem(STORAGE_KEY_COMP) || null } catch { return null } }
export function saveComp(name) { try { localStorage.setItem(STORAGE_KEY_COMP, name) } catch {} }
export function getSavedForm() { try { return localStorage.getItem(STORAGE_KEY_FORM) !== 'false' } catch { return true } }
export function saveForm(v) { try { localStorage.setItem(STORAGE_KEY_FORM, v ? 'true' : 'false') } catch {} }

export const DATA_URLS = ['data/mo14.json', 'data/jo14.json', 'data/mo16.json', 'data/jo16.json']


export { VERSION, CHANGELOG } from './changelog'
