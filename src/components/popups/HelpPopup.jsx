import React from 'react'
import Popup from '../common/Popup'

const HELP = {
  overzicht: {
    title: '❓ Overzicht',
    content: (
      <div>
        <p>Hier zie je de <strong>huidige stand</strong> per poule, direct van hockey.nl.</p>
        <ul>
          <li>Stand met punten, doelsaldo en vorm</li>
          <li><span style={{ color: '#2563eb' }}>●</span> <span style={{ color: '#16a34a' }}>●</span> NK-slot indicators — welk team naar NK Poule A of B gaat (O14)</li>
          <li>Verwachte NK indeling op basis van de huidige stand</li>
          <li>NK Speelschema met tijden en velden</li>
        </ul>
        <p className="help-tip">💡 Klik op 🏑 om alleen jouw poule te zien (focus mode)</p>
      </div>
    )
  },
  schema: {
    title: '❓ Speelschema',
    content: (
      <div>
        <p>Alle <strong>wedstrijden per poule</strong> op een rij.</p>
        <ul>
          <li>Resterende wedstrijden met datums</li>
          <li>Gespeelde wedstrijden met scores</li>
          <li>Jouw club is gemarkeerd met een accent-rand</li>
        </ul>
        <p className="help-tip">💡 In focus mode zie je alleen de poule van jouw club</p>
      </div>
    )
  },
  sim: {
    title: '❓ Simulaties',
    content: (
      <div>
        <p>Voorspel uitslagen en bekijk hoe de <strong>NK-kansen</strong> veranderen.</p>
        <p style={{ fontWeight: 600, marginTop: 12 }}>Wedstrijden invullen</p>
        <ul>
          <li>Klik op een <strong>teamnaam</strong> → dat team wint</li>
          <li>Klik op <strong>vs</strong> → gelijkspel (alleen bij poule-wedstrijden)</li>
          <li>Klik nogmaals → reset die wedstrijd</li>
        </ul>
        <p style={{ fontWeight: 600, marginTop: 12 }}>Snelknoppen</p>
        <ul>
          <li><strong>✦</strong> = automatische voorspelling (Monte Carlo)</li>
          <li><strong>?</strong> = reset ronde of sectie</li>
          <li>✦ bovenaan een card = voorspel alle wedstrijden in die poule</li>
          <li>✦ naast sectie-titel = voorspel hele fase in één klik</li>
        </ul>
        <p style={{ fontWeight: 600, marginTop: 12 }}>NK fases</p>
        <ul>
          <li>NK Poulefase / Kwartfinales verschijnen altijd</li>
          <li>Halve finales verschijnen zodra de vorige fase is ingevuld</li>
          <li>Finale verschijnt zodra de halve finales zijn ingevuld</li>
          <li>Scores en doelsaldo worden meegenomen in de stand</li>
        </ul>
        <p className="help-tip">💡 De NK-kansen bovenaan updaten automatisch bij elke wijziging. Alle ingevulde resultaten worden meegenomen in de Monte Carlo simulatie.</p>
      </div>
    )
  }
}

export default function HelpPopup({ tab, onClose }) {
  const help = HELP[tab] || HELP.overzicht
  return (
    <Popup title={help.title} onClose={onClose} maxWidth={520}>
      <div className="help-content">
        {help.content}
      </div>
    </Popup>
  )
}
