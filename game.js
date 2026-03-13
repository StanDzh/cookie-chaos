// ============================
//  Cookie Chaos — Game Engine
// ============================

const state = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  totalEarned: 0,   // all-time earned — used for unlock thresholds
  totalClicked: 0,
};

// ── Upgrades catalogue ──────────────────────────────────────────────────────
// unlockAt: total cookies ever earned before this upgrade becomes visible
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
    description: 'She bakes. She judges. She\'s always watching.',
    cost: 50,
    unlockAt: 20,
    effect() { state.cookiesPerSecond += 0.5; },
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
    id: 'quantum',
    name: '🔮 Quantum Oven',
    description: 'Bakes cookies in parallel universes and bills you for all of them.',
    cost: 200,
    unlockAt: 100,
    effect() { state.cookiesPerSecond += 2; },
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
const cookieCountEl  = document.getElementById('cookie-count');
const cpsEl          = document.getElementById('cps');
const cpcEl          = document.getElementById('cpc');
const bigCookie      = document.getElementById('big-cookie');
const clickFeedback  = document.getElementById('click-feedback');
const upgradeList    = document.getElementById('upgrade-list');
const shopEmpty      = document.getElementById('shop-empty');
const tickerText     = document.getElementById('ticker-text');

// ── Number formatting ───────────────────────────────────────────────────────
function formatCount(n) {
  if (n >= 1e15) return (n / 1e15).toFixed(2) + 'Q';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return (n / 1e3).toFixed(1) + 'k';
  return Math.floor(n).toLocaleString();
}

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

const FEEDBACK_LINES = [
  'nom nom', 'yes more', 'unstoppable', 'the prophecy continues',
  'cookie obtained', 'chaos +1', 'delicious', 'more', 'inevitable',
];

// ── Click handler ───────────────────────────────────────────────────────────
bigCookie.addEventListener('click', (e) => {
  const gained = state.cookiesPerClick;
  state.cookies += gained;
  state.totalEarned += gained;
  state.totalClicked++;

  triggerBounce();
  spawnFloater(e.clientX, e.clientY, gained);
  showFeedback();
});

function showFeedback() {
  clickFeedback.textContent = FEEDBACK_LINES[Math.floor(Math.random() * FEEDBACK_LINES.length)];
}

// ── Button bounce animation ─────────────────────────────────────────────────
function triggerBounce() {
  bigCookie.classList.remove('clicking');
  // Force reflow so removing+adding the class always restarts the animation
  void bigCookie.offsetWidth;
  bigCookie.classList.add('clicking');
  bigCookie.addEventListener('animationend', () => bigCookie.classList.remove('clicking'), { once: true });
}

// ── Floating +N with arc ────────────────────────────────────────────────────
function spawnFloater(x, y, count) {
  const el = document.createElement('span');
  el.className = 'floater';
  el.textContent = `+${formatCount(count)}`;
  // Random horizontal drift for arc effect: -40px to +40px
  const drift = (Math.random() - 0.5) * 80;
  el.style.cssText = `left:${x}px;top:${y}px;--drift:${drift}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ── Passive income tick (50ms = 20fps, smooth accumulation) ─────────────────
setInterval(() => {
  if (state.cookiesPerSecond > 0) {
    const gained = state.cookiesPerSecond / 20;
    state.cookies += gained;
    state.totalEarned += gained;
  }
}, 50);

// ── Display update (250ms — readable, not flickery) ─────────────────────────
setInterval(updateDisplay, 250);

function updateDisplay() {
  cookieCountEl.textContent = formatCount(state.cookies);
  cpsEl.textContent = formatCount(state.cookiesPerSecond);
  cpcEl.textContent = formatCount(state.cookiesPerClick);
}

// ── Upgrade rendering (500ms — no need to rebuild every frame) ──────────────
setInterval(renderUpgrades, 500);

function renderUpgrades() {
  const visible = UPGRADES.filter(u => !purchased.has(u.id) && state.totalEarned >= u.unlockAt * 0.5);
  shopEmpty.style.display = visible.length === 0 ? 'block' : 'none';

  // Update existing items' affordability classes without full DOM rebuild
  // when the visible set is the same as last render
  const existingIds = [...upgradeList.querySelectorAll('.upgrade-item')].map(el => el.dataset.id);
  const visibleIds = visible.map(u => u.id);
  const sameSet = existingIds.length === visibleIds.length && visibleIds.every((id, i) => id === existingIds[i]);

  if (sameSet) {
    // Just update affordability classes and cost color
    upgradeList.querySelectorAll('.upgrade-item').forEach(li => {
      const upgrade = UPGRADES.find(u => u.id === li.dataset.id);
      const canAfford = state.cookies >= upgrade.cost;
      li.classList.toggle('locked', !canAfford);
      li.classList.toggle('affordable', canAfford);
      li.onclick = canAfford ? () => buyUpgrade(upgrade) : null;
    });
    return;
  }

  // Full rebuild only when the visible set changes
  upgradeList.innerHTML = '';
  visible.forEach(upgrade => {
    const canAfford = state.cookies >= upgrade.cost;
    const li = document.createElement('li');
    li.className = `upgrade-item ${canAfford ? 'affordable' : 'locked'}`;
    li.dataset.id = upgrade.id;
    li.innerHTML = `
      <div class="upgrade-name">${upgrade.name}</div>
      <div class="upgrade-cost">🍪 ${formatCount(upgrade.cost)} cookies</div>
      <div class="upgrade-desc">${upgrade.description}</div>
    `;
    if (canAfford) li.onclick = () => buyUpgrade(upgrade);
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

// ── Chaos ticker ────────────────────────────────────────────────────────────
tickerText.style.transition = 'opacity 0.4s';

function rotateTicker() {
  tickerText.style.opacity = '0';
  setTimeout(() => {
    tickerText.textContent = TICKER_LINES[Math.floor(Math.random() * TICKER_LINES.length)];
    tickerText.style.opacity = '1';
  }, 400);
}

setInterval(rotateTicker, 6000);

// ── Init ─────────────────────────────────────────────────────────────────────
updateDisplay();
renderUpgrades();

