import './style.css'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
<section id="center">
  <div class="hero-badge">⚡ New repo</div>
  <h1>Pokemon Randomizer</h1>
  <p class="lead">
    Built with <code>Vite</code>, version-controlled with <code>Git</code>,
    and hosted on <code>GitHub</code>.
  </p>
  <button id="counter" type="button" class="counter"></button>
  <p class="hint">Click the button — if the count updates instantly, hot reload is working.</p>
</section>

<section id="next-steps">
  <div id="docs">
    <h2>What we set up</h2>
    <ul class="checklist">
      <li>Git for Windows — tracks file changes locally</li>
      <li>GitHub CLI (<code>gh</code>) — talks to GitHub from the terminal</li>
      <li>GitHub Desktop — visual Git client (optional GUI)</li>
      <li>Node.js + Vite — fast local dev server for web apps</li>
    </ul>
  </div>
  <div id="social">
    <h2>Try next</h2>
    <ul class="checklist">
      <li>Edit <code>src/main.js</code> and save to see live updates</li>
      <li>Run <code>npm run dev</code> in the terminal</li>
      <li>Push changes with GitHub Desktop or <code>git push</code></li>
    </ul>
  </div>
</section>
`

setupCounter(document.querySelector('#counter'))
