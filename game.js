// ============================
//  Cookie Chaos — Game Engine
// ============================

const state = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  totalClicked: 0,
};

// ── Upgrades catalogue ──────────────────────────────────────────────────────
// Each upgrade: { id, name, description, cost, effect(), unlockAt }
const UPGRADES = [
  {
    id: 'cursor',
    name: '👆 Sentient Cursor',
    description: 'The cursor clicks on its own. Slightly unsettling.',
    cost: 10,
    unlockAt: 5,
    effect() { state.cookiesPerSecond += 0.1; },
  },
  {
    id: 'grandma',
    name: '👵 Chaos Grandma',
    description: 'She bakes. She judges. She's always watching.',
    cost: 50,
    unlockAt: 20,
    effect() { state.cookiesPerSecond += 0.5; },
  },
  {
    id: 'quantum',
    name: '🔮 Quantum Oven',
    description: 'Bakes cookies in parallel universes and bills you for all of them.',
    cost: 200,
    unlockAt: 100,
    effect() { state.cookiesPerSecond += 2; },
  },
  {
    id: 'doubleclicker',
    name: '✌️ Double Knuckle Technique',
    description: 'Two fingers. Twice the chaos.',
    cost: 150,
    unlockAt: 75,
    effect() { state.cookiesPerClick *= 2; },
  },
  {
    id: 'blackhole',
    name: '🌑 Cookie Black Hole',
    description: 'Pulls cookies in from nearby galaxies. Side effects include existential dread.',
    cost: 1000,
    unlockAt: 500,
    effect() { state.cookiesPerSecond += 10; },
  },
];

const purchased = new Set();

// ── DOM refs ────────────────────────────────────────────────────────────────
const cookieCountEl   = document.getElementById('cookie-count');
const cpsEl           = document.getElementById('cps');
const bigCookie       = document.getElementById('big-cookie');
const clickFeedback   = document.getElementById('click-feedback');
const upgradeList     = document.getElementById('upgrade-list');
const shopEmpty       = document.getElementById('shop-empty');
const tickerText      = document.getElementById('ticker-text');

// ── Flavor / ticker text ────────────────────────────────────────────────────
const TICKER_LINES = [
  'The cookie watches you back.',
  'Scientists baffled by infinite cookie supply.',
  'Your grandma keeps calling. The cookies keep coming.',
  'Economists declare cookies the new reserve currency.',
  'Warning: cookies may cause mild transcendence.',
  'The cursor has developed opinions.',
  'Baking laws suspended in 7 states.',
  'Cookie-to-human ratio now statistically concerning.',
  'Quantum entanglement smells like brown butter.',
  'The upgrades are also cookies. You just can\'t see them yet.',
];

// ── Click handler ───────────────────────────────────────────────────────────
bigCookie.addEventListener('click', (e) => {
  state.cookies += state.cookiesPerClick;
  state.totalClicked++;
  updateDisplay();
  renderUpgrades();
  spawnFloater(e.clientX, e.clientY, `+${state.cookiesPerClick}`);
  showFeedback();
});

function showFeedback() {
  const lines = [
    'nom nom',
    'yes more',
    'unstoppable',
    'the prophecy continues',
    'cookie obtained',
    'chaos +1',
  ];
  clickFeedback.textContent = lines[Math.floor(Math.random() * lines.length)];
}

// ── Floating +N animation ───────────────────────────────────────────────────
function spawnFloater(x, y, text) {
  const el = document.createElement('span');
  el.className = 'floater';
  el.textContent = text;
  el.style.cssText = `left:${x}px;top:${y}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── Passive income tick ─────────────────────────────────────────────────────
setInterval(() => {
  if (state.cookiesPerSecond > 0) {
    state.cookies += state.cookiesPerSecond / 20; // runs 20x/sec → smooth
    updateDisplay();
  }
}, 50);

// ── Upgrade rendering ───────────────────────────────────────────────────────
function renderUpgrades() {
  const visible = UPGRADES.filter(u => !purchased.has(u.id) && state.cookies >= u.unlockAt * 0.5);
  shopEmpty.style.display = visible.length === 0 ? 'block' : 'none';
  upgradeList.innerHTML = '';

  visible.forEach(upgrade => {
    const li = document.createElement('li');
    const canAfford = state.cookies >= upgrade.cost;
    li.className = `upgrade-item ${canAfford ? '' : 'locked'}`;
    li.innerHTML = `
      <div class="upgrade-name">${upgrade.name}</div>
      <div class="upgrade-cost">🍪 ${upgrade.cost.toLocaleString()} cookies</div>
      <div class="upgrade-desc">${upgrade.description}</div>
    `;
    if (canAfford) {
      li.addEventListener('click', () => buyUpgrade(upgrade));
    }
    upgradeList.appendChild(li);
  });
}

function buyUpgrade(upgrade) {
  if (state.cookies < upgrade.cost) return;
  state.cookies -= upgrade.cost;
  purchased.add(upgrade.id);
  upgrade.effect();
  updateDisplay();
  renderUpgrades();
}

// ── Display update ──────────────────────────────────────────────────────────
function updateDisplay() {
  cookieCountEl.textContent = formatCount(state.cookies);
  cpsEl.textContent = state.cookiesPerSecond.toFixed(1);
}

function formatCount(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + ' trillion';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + ' billion';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + ' million';
  return Math.floor(n).toLocaleString();
}

// ── Chaos ticker ────────────────────────────────────────────────────────────
function rotateTicker() {
  tickerText.style.opacity = '0';
  setTimeout(() => {
    tickerText.textContent = TICKER_LINES[Math.floor(Math.random() * TICKER_LINES.length)];
    tickerText.style.opacity = '1';
  }, 400);
}

tickerText.style.transition = 'opacity 0.4s';
setInterval(rotateTicker, 6000);

// ── Init ─────────────────────────────────────────────────────────────────────
updateDisplay();
renderUpgrades();
