// ============================
//  Cookie Chaos — Game Engine
// ============================

const state = {
  cookies: 0,
  cookiesPerClick: 1,
  cookiesPerSecond: 0,
  totalEarned: 0,
  totalClicked: 0,
  ascensions: 0,
};

// ── Upgrades catalogue ──────────────────────────────────────────────────────
const UPGRADES = [
  {
    id: 'cursor',
    name: '👆 Suspicious Cursor',
    flavour: 'It just… keeps moving. You didn\'t tell it to.',
    cost: 10,
    unlockAt: 5,
    effect() { state.cookiesPerSecond += 0.1; },
  },
  {
    id: 'grandma',
    name: '👵 Nana Who Knows Too Much',
    flavour: 'She started baking in 1987. She hasn\'t stopped. She won\'t.',
    cost: 50,
    unlockAt: 20,
    effect() { state.cookiesPerSecond += 0.5; },
  },
  {
    id: 'doubleclicker',
    name: '✌️ The Second Hand',
    flavour: 'Somewhere, a version of you is also clicking. It is not okay.',
    cost: 150,
    unlockAt: 75,
    effect() { state.cookiesPerClick *= 2; },
  },
  {
    id: 'quantum',
    name: '🔮 Quantum Grief Oven',
    flavour: 'Bakes in superposition. Schrödinger\'s croissant. You are complicit.',
    cost: 200,
    unlockAt: 100,
    effect() { state.cookiesPerSecond += 2; },
  },
  {
    id: 'blackhole',
    name: '🌑 The Cookie That Dreamed It Was God',
    flavour: 'It achieved sentience on Tuesday. It has demands. You agreed to them.',
    cost: 1000,
    unlockAt: 500,
    effect() { state.cookiesPerSecond += 10; },
  },
];

const purchased = new Set();

// ── Ascension ─────────────────────────────────────────────────────────────────
function getAscensionMult() {
  return 1 + state.ascensions * 0.1;
}

function doAscend() {
  state.ascensions++;
  state.cookies = 0;
  state.cookiesPerClick = 1;
  state.cookiesPerSecond = 0;
  state.totalEarned = 0;
  state.totalClicked = 0;
  purchased.clear();
  seenMilestones.clear();
  milestoneQueue.length = 0;
  currentChaosLevel = 0;
  applyChaosLevel(0, false);
  updateDisplay();
  renderUpgrades();
  saveGame();
  showToast(`🌌 Ascended! Bonus is now +${state.ascensions * 10}%`);
}

// ── Save / Load ──────────────────────────────────────────────────────────────
const SAVE_KEY = 'cookie-chaos-v1';

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cookies:          state.cookies,
      cookiesPerClick:  state.cookiesPerClick,
      cookiesPerSecond: state.cookiesPerSecond,
      totalEarned:      state.totalEarned,
      totalClicked:     state.totalClicked,
      ascensions:       state.ascensions,
      purchased:        [...purchased],
      seenMilestones:   [...seenMilestones],
    }));
    showToast('💾 Saved');
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    state.cookies          = d.cookies          ?? 0;
    state.cookiesPerClick  = d.cookiesPerClick   ?? 1;
    state.cookiesPerSecond = d.cookiesPerSecond  ?? 0;
    state.totalEarned      = d.totalEarned       ?? 0;
    state.totalClicked     = d.totalClicked      ?? 0;
    state.ascensions       = d.ascensions        ?? 0;
    (d.purchased      ?? []).forEach(id => purchased.add(id));
    (d.seenMilestones ?? []).forEach(t  => seenMilestones.add(t));
  } catch (e) {
    console.warn('Load failed — starting fresh:', e);
  }
}

// ── Toast notification ───────────────────────────────────────────────────────
let toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('save-toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ── Ascend button visibility ─────────────────────────────────────────────────
function checkAscendButton() {
  const btn  = document.getElementById('ascend-btn');
  const info = document.getElementById('ascension-display');
  btn.style.display  = state.cookies >= 1e9 ? 'flex' : 'none';
  info.style.display = state.ascensions > 0  ? 'block' : 'none';
  if (state.ascensions > 0) {
    document.getElementById('ascension-count').textContent = state.ascensions;
    document.getElementById('ascension-bonus').textContent = `+${state.ascensions * 10}%`;
  }
}

// ── Chaos levels ─────────────────────────────────────────────────────────────
const CHAOS_LEVELS = [
  { threshold: 0,    level: 0, emoji: '🍪', tagline: 'It starts with one cookie. It never ends there.' },
  { threshold: 100,  level: 1, emoji: '🍪', tagline: 'Something has been set in motion.' },
  { threshold: 1e4,  level: 2, emoji: '🔥', tagline: 'The cookies outnumber any reasonable amount.' },
  { threshold: 1e6,  level: 3, emoji: '🌀', tagline: 'You have become something the universe didn\'t plan for.' },
  { threshold: 1e9,  level: 4, emoji: '🌑', tagline: 'There is no word for what you are now.' },
  { threshold: 1e12, level: 5, emoji: '👁️', tagline: 'THE COOKIES HAVE ACHIEVED CONSENSUS.' },
];

let currentChaosLevel = 0;

// ── Tiered ticker quotes ─────────────────────────────────────────────────────
const TICKER_TIERS = [
  // Tier 0 — mildly weird (< 100)
  [
    'The cookie watches you back.',
    'Your mouse has started keeping a diary.',
    'Scientists say clicking is healthy. Scientists are not here right now.',
    'The cookie smells like Tuesday.',
    'You are doing great. Probably.',
    'Something about this feels productive.',
  ],
  // Tier 1 — concerning (100 – 10k)
  [
    'Scientists baffled by infinite cookie supply.',
    'Your grandma keeps calling. The cookies keep coming.',
    'Economists declare cookies the new reserve currency.',
    'Warning: cookies may cause mild transcendence.',
    'The cursor has developed opinions.',
    'Baking laws suspended in 7 states.',
    'Cookie-to-human ratio now statistically concerning.',
    'The oven refuses to turn off. This is fine.',
  ],
  // Tier 2 — alarming (10k – 1M)
  [
    'The cookies are aware of your schedule.',
    'A congressional hearing on the cookie situation has been quietly cancelled.',
    'Quantum entanglement smells like brown butter.',
    'The concept of "full" no longer applies to you.',
    'Time is a flat circle. The circle is a cookie.',
    'Your shadow has started baking independently.',
    'Three world leaders have asked what you\'re doing. You haven\'t replied.',
    'The upgrades are watching you back.',
    'Cookie futures are up 40,000%. Nobody is laughing.',
  ],
  // Tier 3 — full eldritch (1M+)
  [
    'The upgrades are also cookies. You just can\'t see them yet.',
    'The stars are rearranging themselves into a recipe.',
    'You don\'t click the cookie. The cookie allows itself to be clicked.',
    'THE DOUGH REMEMBERS.',
    'A new dimension has been discovered. It is made of shortbread.',
    'Something behind the universe just said "oh no."',
    'The cookie is not a metaphor. The cookie was never a metaphor.',
    'Your hands are not your hands. But they keep clicking.',
    'Every cookie contains a message. You already ate it.',
    'The number you have reached is not in service. Please bake more cookies.',
    'You asked for cookies. The universe said yes. The universe regrets this.',
    'Reality has submitted a formal complaint. It was denied.',
  ],
];

function getTickerTier() {
  const n = state.totalEarned;
  if (n >= 1e6) return 3;
  if (n >= 1e4) return 2;
  if (n >= 100) return 1;
  return 0;
}

// ── Milestones ───────────────────────────────────────────────────────────────
const MILESTONES = [
  { threshold: 100,  title: 'THE FIRST HUNDRED',    sub: 'It begins. The cookie is pleased.' },
  { threshold: 1e3,  title: 'ONE THOUSAND COOKIES', sub: 'There is no going back. There is only forward, into the dough.' },
  { threshold: 1e4,  title: 'TEN THOUSAND',         sub: 'Local economists are "baffled and afraid."' },
  { threshold: 1e5,  title: 'ONE HUNDRED THOUSAND', sub: 'You have exceeded the recommended daily intake by a measurable percentage of infinity.' },
  { threshold: 1e6,  title: 'A MILLION COOKIES',    sub: 'The economy has noticed. The economy is concerned.' },
  { threshold: 1e9,  title: 'ONE BILLION',          sub: 'History will call this "The Event." Historians are already missing.' },
  { threshold: 1e12, title: 'A TRILLION',           sub: 'The concept of "enough" has filed for bankruptcy.' },
];

const seenMilestones = new Set();
const milestoneQueue = [];
let milestoneShowing = false;

function checkMilestones() {
  for (const m of MILESTONES) {
    if (!seenMilestones.has(m.threshold) && state.totalEarned >= m.threshold) {
      seenMilestones.add(m.threshold);
      milestoneQueue.push(m);
    }
  }
  if (!milestoneShowing && milestoneQueue.length > 0) {
    showMilestone(milestoneQueue.shift());
  }
}

function showMilestone(m) {
  milestoneShowing = true;
  const overlay = document.getElementById('milestone-overlay');
  document.getElementById('milestone-title').textContent = m.title;
  document.getElementById('milestone-sub').textContent = m.sub;
  overlay.classList.add('visible');
  setTimeout(() => {
    overlay.classList.remove('visible');
    // Wait for fade-out transition before allowing next milestone
    setTimeout(() => { milestoneShowing = false; }, 600);
  }, 3000);
}

// ── Visual chaos escalation ──────────────────────────────────────────────────
function checkChaosLevel() {
  let newLevel = 0;
  for (const cl of CHAOS_LEVELS) {
    if (state.totalEarned >= cl.threshold) newLevel = cl.level;
  }
  if (newLevel !== currentChaosLevel) {
    currentChaosLevel = newLevel;
    applyChaosLevel(newLevel);
  }
}

function applyChaosLevel(level, animate = true) {
  document.body.className = document.body.className.replace(/\bchaos-\d+\b/g, '').trim();
  document.body.classList.add(`chaos-${level}`);

  if (animate && level > 0) {
    document.body.classList.add('chaos-transitioning');
    setTimeout(() => document.body.classList.remove('chaos-transitioning'), 900);
  }

  const chaosData = CHAOS_LEVELS.find(cl => cl.level === level);
  document.getElementById('cookie-emoji').textContent = chaosData.emoji;
  document.getElementById('tagline').textContent = chaosData.tagline;
}

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

// ── Click handler ───────────────────────────────────────────────────────────
bigCookie.addEventListener('click', (e) => {
  const gained = state.cookiesPerClick * getAscensionMult();
  state.cookies += gained;
  state.totalEarned += gained;
  state.totalClicked++;
  triggerBounce();
  spawnFloater(e.clientX, e.clientY, gained);
  showFeedback();
});

const FEEDBACK_LINES = [
  'nom nom', 'yes more', 'unstoppable', 'the prophecy continues',
  'cookie obtained', 'chaos +1', 'delicious', 'more', 'inevitable',
  'as foretold', 'there is no stopping this', 'good good',
];

function showFeedback() {
  clickFeedback.textContent = FEEDBACK_LINES[Math.floor(Math.random() * FEEDBACK_LINES.length)];
}

// ── Button bounce animation ─────────────────────────────────────────────────
function triggerBounce() {
  bigCookie.classList.remove('clicking');
  void bigCookie.offsetWidth;
  bigCookie.classList.add('clicking');
  bigCookie.addEventListener('animationend', () => bigCookie.classList.remove('clicking'), { once: true });
}

// ── Floating +N with arc ────────────────────────────────────────────────────
function spawnFloater(x, y, count) {
  const el = document.createElement('span');
  el.className = 'floater';
  el.textContent = `+${formatCount(count)}`;
  const drift = (Math.random() - 0.5) * 80;
  el.style.cssText = `left:${x}px;top:${y}px;--drift:${drift}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

// ── Passive income tick (50ms = 20fps smooth) ────────────────────────────────
setInterval(() => {
  if (state.cookiesPerSecond > 0) {
    const gained = (state.cookiesPerSecond * getAscensionMult()) / 20;
    state.cookies += gained;
    state.totalEarned += gained;
  }
}, 50);

// ── Display + state checks (250ms) ──────────────────────────────────────────
setInterval(() => {
  updateDisplay();
  checkMilestones();
  checkChaosLevel();
}, 250);

function updateDisplay() {
  cookieCountEl.textContent = formatCount(state.cookies);
  cpsEl.textContent = formatCount(state.cookiesPerSecond * getAscensionMult());
  cpcEl.textContent = formatCount(state.cookiesPerClick  * getAscensionMult());
  checkAscendButton();
}

// ── Upgrade rendering (500ms) ───────────────────────────────────────────────
setInterval(renderUpgrades, 500);

function renderUpgrades() {
  const visible = UPGRADES.filter(u => !purchased.has(u.id) && state.totalEarned >= u.unlockAt * 0.5);
  shopEmpty.style.display = visible.length === 0 ? 'block' : 'none';

  const existingIds = [...upgradeList.querySelectorAll('.upgrade-item')].map(el => el.dataset.id);
  const visibleIds = visible.map(u => u.id);
  const sameSet = existingIds.length === visibleIds.length && visibleIds.every((id, i) => id === existingIds[i]);

  if (sameSet) {
    upgradeList.querySelectorAll('.upgrade-item').forEach(li => {
      const upgrade = UPGRADES.find(u => u.id === li.dataset.id);
      const canAfford = state.cookies >= upgrade.cost;
      li.classList.toggle('locked', !canAfford);
      li.classList.toggle('affordable', canAfford);
      li.onclick = canAfford ? () => buyUpgrade(upgrade) : null;
    });
    return;
  }

  upgradeList.innerHTML = '';
  visible.forEach(upgrade => {
    const canAfford = state.cookies >= upgrade.cost;
    const li = document.createElement('li');
    li.className = `upgrade-item ${canAfford ? 'affordable' : 'locked'}`;
    li.dataset.id = upgrade.id;
    li.innerHTML = `
      <div class="upgrade-name">${upgrade.name}</div>
      <div class="upgrade-cost">🍪 ${formatCount(upgrade.cost)} cookies</div>
      <div class="upgrade-flavour">${upgrade.flavour}</div>
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
  const tier = getTickerTier();
  const lines = TICKER_TIERS[tier];
  tickerText.style.opacity = '0';
  setTimeout(() => {
    tickerText.textContent = lines[Math.floor(Math.random() * lines.length)];
    tickerText.style.opacity = '1';
  }, 400);
}

setInterval(rotateTicker, 5000);

// ── Auto-save (30s) ──────────────────────────────────────────────────────────
setInterval(saveGame, 30_000);

// ── Init ─────────────────────────────────────────────────────────────────────
loadGame();

// Apply chaos level silently from loaded state (no flash)
const _initLevel = CHAOS_LEVELS.reduce((lvl, cl) => state.totalEarned >= cl.threshold ? cl.level : lvl, 0);
currentChaosLevel = _initLevel;
applyChaosLevel(_initLevel, false);

document.getElementById('ascend-btn').addEventListener('click', doAscend);

updateDisplay();
renderUpgrades();

