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

export const VERSION = '5.9.4'
export const CHANGELOG = [
  { version: '5.9.4', date: '21 mei 2026', changes: [
    'KO-fases (KF/HF/Finale/3e4e): geen stand-tabel meer — alleen wedstrijden',
    'KO-fases: ✦ voorspelling geeft altijd een winnaar (nooit gelijkspel)',
    'KO-fases: klik op team = die wint, klik vs = reset, geen gelijkspel optie',
    'SimPouleCard: hideStandings prop voor KO-cards',
  ]},
  { version: '5.9.3', date: '21 mei 2026', changes: [
    'KO-wedstrijden: geen gelijkspel-klik meer in de interface',
  ]},
  { version: '5.9.2', date: '21 mei 2026', changes: [
    'Eindkansen tabellen verwijderd (alle teams overzicht)',
  ]},
  { version: '5.9.1', date: '21 mei 2026', changes: [
    'Eindkansen section label verwijderd',
  ]},
  { version: '5.9', date: '21 mei 2026', changes: [
    'Eindkansen verwerken nu alle ingevulde resultaten uit alle fases',
    'O14: NK Poulefase locks, HF locks en Finale locks meegerekend in Monte Carlo',
    'O16: KF locks, HF locks en Finale locks meegerekend in Monte Carlo',
    'Vastgezette NK-wedstrijden worden niet meer random gesimuleerd',
    'Simulatie-engine uitgebreid: simNKPoule accepteert locks, simKOWithLock voor KO-rondes',
  ]},
  { version: '5.8', date: '21 mei 2026', changes: [
    'NK Halve Finales en Finale cards in Simulatie tab',
    'O14: HF verschijnt zodra beide NK Poulefases volledig zijn ingevuld',
    'O14: Finale + 3e/4e plaats verschijnt zodra HF is ingevuld',
    'O16: HF verschijnt zodra alle 4 KF-winnaars bekend zijn',
    'O16: Finale verschijnt zodra HF-winnaars bekend zijn',
    'Alle cards gebruiken SimPouleCard met klik-interface',
  ]},
  { version: '5.7', date: '21 mei 2026', changes: [
    'Sub-tabs Super-poules/NK Poulefase/Poules verwijderd — alleen Eindkansen blijft',
    'O16 Kwartfinales gebruikt nu SimPouleCard (zelfde interface als poule-cards)',
    '✦ bovenaan elke SimPouleCard voorspelt alle onvoorspelde wedstrijden',
    'T/G/U ronde-knoppen verwijderd — alleen ✦ en ? per ronde',
    '"nog X rondes" telt alleen onvoorspelde rondes',
    'Herbruikbaar SimPouleCard component voor Super, NK Poulefase én Kwartfinales',
  ]},
  { version: '5.6', date: '20 mei 2026', changes: [
    'NK fase in Simulatie tab: O14 NK Poulefase en O16 Kwartfinales met klikbare wedstrijden',
    'Teams worden ingevuld op basis van huidige stand + vastgezette what-if uitslagen',
    'O14: NK Poule A en B schema met alle 10 wedstrijden per poule, met slot-labels',
    'O16: 4 KF-wedstrijden met verwachte teamindeling',
    'Wijzig poule-uitslagen → NK deelnemers updaten automatisch',
  ]},
  { version: '5.5', date: '20 mei 2026', changes: [
    '✦ Voorspel-knop per ronde: berekent meest waarschijnlijke uitslagen via Monte Carlo',
    'Teamsterkte gebaseerd op huidige punten en doelsaldo',
    '1.000 mini-simulaties per wedstrijd voor de voorspelling',
    'Klikt automatisch W/G/V in op basis van de meest voorkomende uitslag',
  ]},
  { version: '5.4', date: '20 mei 2026', changes: [
    'Simulatie tab: chronologische poule-weergave (gespeelde rondes + resterende rondes)',
    'Gespeelde wedstrijden met uitslagen (zoals Speelschema tab)',
    'Resterende wedstrijden met klik-interface: klik thuisteam/gelijk/uitteam',
    'Geen apart scenario-panel meer — alles in één tijdlijn',
    'Per ronde snelkeuze: T (thuis) / G (gelijk) / U (uit) / ? (reset)',
    'Focus mode niet meer relevant voor Simulatie tab — altijd hele poule',
  ]},
  { version: '5.3', date: '20 mei 2026', changes: [
    'Zonder focus club: alle resterende wedstrijden invulbaar per ronde',
    'Klik op thuisteam = thuis wint (groen), midden = gelijk (geel), uitteam = uit wint (groen)',
    'Per ronde snelkeuze: T (thuis wint) / G (gelijk) / U (uit wint) / ? (reset)',
    'Met focus club: compacte W/G/V knoppen (zoals voorheen)',
    'Poule-stand na scenario toont nu alle gewijzigde poules (niet alleen focus-poule)',
    'Adjusted standings werken correct in beide modes',
  ]},
  { version: '5.2.1', date: '20 mei 2026', changes: [
    'Poule-stand na scenario: toont punten met what-if resultaten verwerkt',
    'Per team: huidige punten + delta + nieuw totaal (bijv. "21 +3 = 24")',
    'Stand wordt automatisch opnieuw gesorteerd op nieuwe punten',
    'Alleen zichtbaar als er scenario\'s zijn ingesteld',
    'Opgeruimd: oude O14SimTab, O16SimTab en WhatIf bestanden verwijderd',
  ]},
  { version: '5.2', date: '20 mei 2026', changes: [
    'Simulaties en What-if samengevoegd in één tab',
    'What-if scenario-panel bovenaan met W/G/V knoppen per wedstrijd',
    'NK kansen focus club direct onder de scenario\'s met verschil t.o.v. baseline',
    'Sim-slider en detail-tabellen (Super-poules / NK Poulefase / Eindkansen) daaronder',
    'What-if tab verwijderd — alles zit nu in Simulaties',
    'What-if herberekent automatisch bij wijzigen scenario; slider alleen via knop',
    'Fix: sliders triggeren niet meer automatisch herberekening',
    'Fix: actieve tab behouden bij wisselen van competitie',
  ]},
  { version: '5.1.1', date: '20 mei 2026', changes: [
    'Fix: announced wedstrijden nu ook meegenomen als resterend (naast scheduled)',
    'Fix: What-if W/G/V nu vanuit perspectief focus club, niet thuisclub',
    'Volledige versiegeschiedenis hersteld',
  ]},
  { version: '5.1', date: '20 mei 2026', changes: [
    'What-if tab: stel resultaten in voor resterende wedstrijden van je club',
    'Klik op een wedstrijd om te wisselen: ? → W → G → V → ?',
    'NK-kansen herberekenen live met vastgezette resultaten',
    'Verschil met baseline getoond (+5%, -3%) per NK-fase',
    'Preset knoppen: Alles winst / Alles gelijk / Alles verlies / Reset',
    'Werkt voor zowel O14 als O16 competities',
  ]},
  { version: '5.0', date: '20 mei 2026', changes: [
    'Migratie naar Vite + React — snellere builds, betere code-structuur',
    'Componenten opgesplitst in aparte bestanden',
    'GitHub Actions: automatische build en deploy bij elke push',
    'Geen Babel-in-browser meer — pre-compiled JavaScript',
    'VS Code ondersteuning: syntax highlighting, IntelliSense, hot-reload',
  ]},
  { version: '4.13', date: '19 mei 2026', changes: [
    'Gekozen competitie wordt onthouden via localStorage',
    'Bij openen van de website wordt de laatst gekozen competitie weer geselecteerd',
  ]},
  { version: '4.12.2', date: '19 mei 2026', changes: [
    'Fix: afgelaste/discontinued wedstrijden worden niet meer getoond bij resterende wedstrijden',
    'Alleen wedstrijden met status "scheduled" tellen als resterend',
  ]},
  { version: '4.12.1', date: '19 mei 2026', changes: [
    'Zoekbalk verwijderd uit club picker popup',
  ]},
  { version: '4.12', date: '19 mei 2026', changes: [
    'Header 2-regelig: bovenaan 🏑 club + knoppen, onderaan competitie-tabs',
    'Stabiele layout — niets verspringt meer',
  ]},
  { version: '4.11', date: '19 mei 2026', changes: [
    'Header layout stabiel: 3 vaste secties (links: club, midden: comp-tabs, rechts: knoppen)',
    'Competitie-knoppen gecentreerd, verspringen niet meer bij focus mode toggle',
  ]},
  { version: '4.10', date: '19 mei 2026', changes: [
    '🏑 Victoria vooraan in de header, competitie-knoppen erna',
  ]},
  { version: '4.9.5', date: '19 mei 2026', changes: [
    'Speelschema: datum achter elke ronde-header (bijv. "Ronde 9 · 30 mei")',
    'Geldt voor zowel gespeelde als resterende wedstrijden',
    'Datum uit de match-data van de API',
  ]},
  { version: '4.9.4', date: '19 mei 2026', changes: [
    'O14: legend "→ NK Poulefase A / B" verwijderd',
  ]},
  { version: '4.9.3', date: '19 mei 2026', changes: [
    'O14 Focus mode: NK Speelschema toont alleen wedstrijden van focus club',
    'Ronde-nummering blijft correct (originele rondenummers behouden)',
  ]},
  { version: '4.9.2', date: '19 mei 2026', changes: [
    'O16: NK Kwartfinales indeling en wedstrijden altijd volledig zichtbaar (ook in focus mode)',
  ]},
  { version: '4.9.1', date: '19 mei 2026', changes: [
    'Focus mode: NK Poulefase toont alleen de poule waar focus club in zit (A of B)',
    'Focus mode: NK Speelschema toont alleen de relevante poule',
    'NK Finales altijd zichtbaar (focus club kan daar terechtkomen)',
  ]},
  { version: '4.9', date: '19 mei 2026', changes: [
    'Focus mode toont NK Poulefase indeling en NK Speelschema met alle data',
    'Alleen poule-kaarten (stand) worden gefilterd op focus club',
    'Grid past zich aan: 1 poule in focus → smalere layout',
  ]},
  { version: '4.8', date: '19 mei 2026', changes: [
    'Focus mode: klik op 🏑 → toont alleen de poule en competities van je focus club',
    'Klik nogmaals op 🏑 → terug naar volledig overzicht',
    'Blauwe rand om 🏑 icoon en "focus" label wanneer actief',
    'Simulaties draaien altijd op alle data (niet gefilterd)',
    'Competitie-tabs worden gefilterd in focus mode',
  ]},
  { version: '4.7', date: '19 mei 2026', changes: [
    'Focus club kiesbaar: klik op clubnaam → popup met alle clubs uit geladen data',
    'Keuze wordt onthouden via localStorage (persistent over sessies)',
    'Default: Victoria',
  ]},
  { version: '4.6', date: '19 mei 2026', changes: [
    'Header vereenvoudigd: alleen competitie-knoppen + 🏑 Victoria',
    'Versiegeschiedenis als popup (klik op versienummer) i.p.v. aparte tab',
    'Popup sluit bij klik buiten het venster',
  ]},
  { version: '4.5', date: '19 mei 2026', changes: [
    'Competitie-knoppen korter: MO14, JO14, MO16, JO16',
    'Tab "Monte Carlo" hernoemd naar "Simulaties"',
    'Tab "Changelog" hernoemd naar "Versiegeschiedenis"',
  ]},
  { version: '4.4', date: '19 mei 2026', changes: [
    '↻ knop herlaadt data van GitHub in plaats van naar import-scherm te gaan',
    'Cache-busting: ?t=timestamp aan data-URLs zodat altijd de nieuwste versie wordt geladen',
    'Behoudt actieve competitie-tab bij herladen',
  ]},
  { version: '4.3', date: '19 mei 2026', changes: [
    'GitHub Pages hosting: data-URLs relatief (werkt op GitHub Pages en lokaal)',
    'Extensie v6 pusht data direct naar GitHub repo',
  ]},
  { version: '4.2', date: '19 mei 2026', changes: [
    'NK speelschema (O14) embedded in HTML — geen aparte bestanden meer nodig',
    'NK Speelschema en Finales werken nu ook bij lokaal testen en handmatige import',
    'Pre-geparsed: 28KB raw → 2.5KB compact per schedule',
  ]},
  { version: '4.1.1', date: '19 mei 2026', changes: [
    'Fix: NK Speelschema en NK Finales worden nu ook bij handmatige import geladen',
  ]},
  { version: '4.1', date: '19 mei 2026', changes: [
    'Import: meerdere bestanden tegelijk uploaden (multi-select of drag & drop)',
    'Bestanden worden automatisch samengevoegd (MO14 + JO14 + MO16 + JO16 in één keer)',
    'Import-scherm toont per bestand status (✅/❌) en welke competities erin zitten',
  ]},
  { version: '4.0', date: '19 mei 2026', changes: [
    'O16 support: Landelijke competitie met 4 poules + KF/HF/Finale simulatie',
    'O16 Monte Carlo: Kwartfinales seeding (Beste #1 vs 4e #2, etc.), HF, Finale',
    'O16 Overzicht: 4 poule-kaarten + NK structuur uitleg',
    'Competitie-tabs: MO14, JO14, MO16, JO16 — alles in één app',
    'Parser voor /competitions/national/ format (O16) + /poules/ format (O14)',
  ]},
  { version: '3.1', date: '19 mei 2026', changes: [
    'NK speelschema dynamisch geladen uit JSON bestanden',
    'MO14 en JO14 met eigen tijden en veldnamen',
    'NK Finales met correcte tijden per competitie',
  ]},
  { version: '3.0', date: '19 mei 2026', changes: [
    'Auto-load data van server (/data/*.json)',
    'Import fallback bij geen server-data',
  ]},
  { version: '2.0', date: '19 mei 2026', changes: [
    'Multi-competitie: MO14 + JO14 in één app',
    'Mijn team sectie in de header',
  ]},
  { version: '1.0', date: '19 mei 2026', changes: [
    'Eerste dynamische versie',
    'Monte Carlo simulatie voor Super-poules en NK Poulefase',
    'Import via JSON plakken of bestand uploaden',
  ]},
]
