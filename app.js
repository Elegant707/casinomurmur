/* ===== Moori Устяшкинс Casino ===== */

const STORAGE_KEY = 'moori_ustyashkins_users';
const SESSION_KEY = 'moori_ustyashkins_session';
const SETTINGS_KEY = 'moori_ustyashkins_settings';

// State
let currentUser = null;
let balance = 0;
let settings = {
  sound: true,
  flicker: true,
  particles: true,
  theme: 'neon',
  volume: 70
};

// ===== Utilities =====
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSession(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function updateBalanceDisplay() {
  document.getElementById('balanceValue').textContent = balance.toLocaleString('ru-RU');
}

function saveBalance() {
  if (!currentUser) return;
  const users = getUsers();
  if (users[currentUser]) {
    users[currentUser].balance = balance;
    saveUsers(users);
  }
}

function requireAuth() {
  if (!currentUser) {
    toast('Сначала войдите или зарегистрируйтесь');
    openAuth();
    return false;
  }
  return true;
}

// ===== Particles =====
let particleAnim = null;
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function createParticles() {
    particles = [];
    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }
  createParticles();

  function draw() {
    if (!settings.particles) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particleAnim = requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--primary').trim() || '#b026ff';

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = primary;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    particleAnim = requestAnimationFrame(draw);
  }
  draw();
}

// ===== Navigation =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (btn) btn.classList.add('active');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

document.querySelectorAll('.game-card').forEach(card => {
  card.addEventListener('click', () => showPage(card.dataset.goto));
});

// ===== Auth =====
function openAuth() {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('loginMsg').textContent = '';
  document.getElementById('regMsg').textContent = '';
}

function closeAuth() {
  document.getElementById('authModal').classList.remove('open');
}

document.getElementById('authBtn').addEventListener('click', () => {
  if (currentUser) {
    toast(`Вы вошли как ${currentUser}`);
  } else {
    openAuth();
  }
});

document.getElementById('authClose').addEventListener('click', closeAuth);
document.getElementById('promoRegBtn').addEventListener('click', openAuth);

document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
  });
});

// Login
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const msg = document.getElementById('loginMsg');
  const users = getUsers();

  if (!users[user]) {
    msg.textContent = 'Пользователь не найден';
    msg.className = 'auth-msg error';
    return;
  }
  if (users[user].pass !== pass) {
    msg.textContent = 'Неверный пароль';
    msg.className = 'auth-msg error';
    return;
  }

  currentUser = user;
  balance = users[user].balance;
  saveSession(user);
  updateBalanceDisplay();
  updateAuthUI();
  msg.textContent = 'Успешный вход!';
  msg.className = 'auth-msg success';
  setTimeout(closeAuth, 800);
  toast(`Добро пожаловать, ${user}!`);
});

// Register
document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const user = document.getElementById('regUser').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  const msg = document.getElementById('regMsg');
  const users = getUsers();

  if (user.length < 3) {
    msg.textContent = 'Логин минимум 3 символа';
    msg.className = 'auth-msg error';
    return;
  }
  if (pass.length < 4) {
    msg.textContent = 'Пароль минимум 4 символа';
    msg.className = 'auth-msg error';
    return;
  }
  if (pass !== pass2) {
    msg.textContent = 'Пароли не совпадают';
    msg.className = 'auth-msg error';
    return;
  }
  if (users[user]) {
    msg.textContent = 'Такой логин уже занят';
    msg.className = 'auth-msg error';
    return;
  }

  users[user] = { pass, balance: 5000 };
  saveUsers(users);
  currentUser = user;
  balance = 5000;
  saveSession(user);
  updateBalanceDisplay();
  updateAuthUI();
  msg.textContent = 'Аккаунт создан! +5000 ◆';
  msg.className = 'auth-msg success';
  setTimeout(closeAuth, 1000);
  toast('Регистрация успешна! Бонус 5000 ◆ начислен');
});

function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  const logout = document.getElementById('logoutBtn');
  if (currentUser) {
    btn.textContent = currentUser;
    logout.style.display = 'block';
  } else {
    btn.textContent = 'Войти';
    logout.style.display = 'none';
  }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  balance = 0;
  clearSession();
  updateBalanceDisplay();
  updateAuthUI();
  document.getElementById('settingsModal').classList.remove('open');
  toast('Вы вышли из аккаунта');
});

// ===== Withdraw (RU cards demo) =====
function openWithdraw() {
  if (!requireAuth()) return;
  document.getElementById('withdrawAvail').textContent = balance.toLocaleString('ru-RU');
  document.getElementById('withdrawAmount').value = '';
  document.getElementById('withdrawBank').value = '';
  document.getElementById('withdrawCard').value = '';
  document.getElementById('withdrawFio').value = '';
  document.getElementById('withdrawMsg').textContent = '';
  document.getElementById('withdrawMsg').className = 'auth-msg';
  document.getElementById('withdrawModal').classList.add('open');
}

function closeWithdraw() {
  document.getElementById('withdrawModal').classList.remove('open');
}

document.getElementById('withdrawBtn').addEventListener('click', openWithdraw);
document.getElementById('withdrawClose').addEventListener('click', closeWithdraw);

// Маска карты: 1234 5678 9012 3456
document.getElementById('withdrawCard').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) parts.push(v.slice(i, i + 4));
  this.value = parts.join(' ');
});

// Проверка Luhn (демо)
function luhnCheck(num) {
  const digits = num.replace(/\D/g, '');
  if (digits.length !== 16) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function detectCardType(num) {
  const d = num.replace(/\D/g, '');
  if (/^2/.test(d)) return 'МИР';
  if (/^4/.test(d)) return 'Visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'Mastercard';
  return 'Карта';
}

document.getElementById('withdrawConfirm').addEventListener('click', () => {
  if (!requireAuth()) return;

  const amount = Math.floor(+document.getElementById('withdrawAmount').value);
  const bank = document.getElementById('withdrawBank').value;
  const cardRaw = document.getElementById('withdrawCard').value;
  const cardDigits = cardRaw.replace(/\D/g, '');
  const fio = document.getElementById('withdrawFio').value.trim();
  const msg = document.getElementById('withdrawMsg');

  if (!amount || amount < 100) {
    msg.textContent = 'Минимум 100 ◆';
    msg.className = 'auth-msg error';
    return;
  }
  if (amount > balance) {
    msg.textContent = 'Недостаточно средств на балансе';
    msg.className = 'auth-msg error';
    return;
  }
  if (!bank) {
    msg.textContent = 'Выберите банк';
    msg.className = 'auth-msg error';
    return;
  }
  if (cardDigits.length !== 16) {
    msg.textContent = 'Номер карты должен быть 16 цифр';
    msg.className = 'auth-msg error';
    return;
  }
  if (!luhnCheck(cardDigits)) {
    msg.textContent = 'Некорректный номер карты (проверьте цифры)';
    msg.className = 'auth-msg error';
    return;
  }
  if (fio.length < 5 || !fio.includes(' ')) {
    msg.textContent = 'Укажите ФИО полностью (Имя Фамилия)';
    msg.className = 'auth-msg error';
    return;
  }

  balance -= amount;
  updateBalanceDisplay();
  saveBalance();
  document.getElementById('withdrawAvail').textContent = balance.toLocaleString('ru-RU');

  const bankNames = {
    sber: 'Сбербанк',
    tinkoff: 'Тинькофф',
    alfa: 'Альфа-Банк',
    vtb: 'ВТБ',
    mir: 'МИР',
    other: 'банк РФ'
  };
  const type = detectCardType(cardDigits);
  const masked = cardDigits.slice(0, 4) + ' •••• •••• ' + cardDigits.slice(-4);

  msg.textContent = `✓ ${amount.toLocaleString('ru-RU')} ◆ → ${bankNames[bank]} (${type} ${masked})`;
  msg.className = 'auth-msg success';
  toast(`Вывод ${amount.toLocaleString('ru-RU')} ◆ на карту оформлен`, 'win');
  setTimeout(closeWithdraw, 1500);
});

// ===== Settings =====
function openSettings() {
  document.getElementById('settingsModal').classList.add('open');
  document.getElementById('soundToggle').classList.toggle('active', settings.sound);
  document.getElementById('soundToggle').textContent = settings.sound ? 'ВКЛ' : 'ВЫКЛ';
  document.getElementById('flickerToggle').classList.toggle('active', settings.flicker);
  document.getElementById('flickerToggle').textContent = settings.flicker ? 'ВКЛ' : 'ВЫКЛ';
  document.getElementById('particlesToggle').classList.toggle('active', settings.particles);
  document.getElementById('particlesToggle').textContent = settings.particles ? 'ВКЛ' : 'ВЫКЛ';
  document.getElementById('themeSelect').value = settings.theme;
  document.getElementById('volumeSlider').value = settings.volume;
}

document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('settingsClose').addEventListener('click', () => {
  document.getElementById('settingsModal').classList.remove('open');
});

document.getElementById('soundToggle').addEventListener('click', function () {
  settings.sound = !settings.sound;
  this.classList.toggle('active', settings.sound);
  this.textContent = settings.sound ? 'ВКЛ' : 'ВЫКЛ';
});

document.getElementById('flickerToggle').addEventListener('click', function () {
  settings.flicker = !settings.flicker;
  this.classList.toggle('active', settings.flicker);
  this.textContent = settings.flicker ? 'ВКЛ' : 'ВЫКЛ';
  applyFlicker();
});

document.getElementById('particlesToggle').addEventListener('click', function () {
  settings.particles = !settings.particles;
  this.classList.toggle('active', settings.particles);
  this.textContent = settings.particles ? 'ВКЛ' : 'ВЫКЛ';
});

document.getElementById('saveSettings').addEventListener('click', () => {
  settings.theme = document.getElementById('themeSelect').value;
  settings.volume = +document.getElementById('volumeSlider').value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyTheme();
  applyFlicker();
  document.getElementById('settingsModal').classList.remove('open');
  toast('Настройки сохранены');
});

function applyTheme() {
  document.body.classList.remove('theme-cyan', 'theme-gold', 'theme-red');
  if (settings.theme === 'cyan') document.body.classList.add('theme-cyan');
  if (settings.theme === 'gold') document.body.classList.add('theme-gold');
  if (settings.theme === 'red') document.body.classList.add('theme-red');
}

function applyFlicker() {
  document.body.classList.toggle('flicker-on', settings.flicker);
}

// ===== SLOTS =====
const SLOT_SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣'];
const SLOT_PAYS = { '🍒': 5, '🍋': 8, '🔔': 15, '💎': 50, '7️⃣': 100 };
let slotBet = 50;
let spinning = false;

function buildReel(reelEl) {
  const symbolsEl = reelEl.querySelector('.symbols');
  symbolsEl.innerHTML = '';
  // Many symbols for spinning effect
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('div');
    s.className = 'symbol';
    s.textContent = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    symbolsEl.appendChild(s);
  }
}

function initSlots() {
  ['reel1', 'reel2', 'reel3'].forEach(id => buildReel(document.getElementById(id)));
}

document.getElementById('betMinus').addEventListener('click', () => {
  if (slotBet > 10) {
    slotBet -= 10;
    document.getElementById('slotBet').textContent = slotBet;
  }
});
document.getElementById('betPlus').addEventListener('click', () => {
  if (slotBet < 500) {
    slotBet += 10;
    document.getElementById('slotBet').textContent = slotBet;
  }
});

document.getElementById('spinBtn').addEventListener('click', () => {
  if (!requireAuth()) return;
  if (spinning) return;
  if (balance < slotBet) {
    toast('Недостаточно средств', 'lose');
    return;
  }

  balance -= slotBet;
  updateBalanceDisplay();
  saveBalance();
  spinning = true;
  document.getElementById('spinBtn').disabled = true;
  document.getElementById('lastWin').textContent = 'Крутим...';

  const results = [];
  const reels = ['reel1', 'reel2', 'reel3'];

  reels.forEach((id, idx) => {
    const reel = document.getElementById(id);
    const symbolsEl = reel.querySelector('.symbols');
    buildReel(reel);

    const finalSymbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    results.push(finalSymbol);

    // Put final symbol near the end
    const children = symbolsEl.children;
    const stopIndex = 20 + idx * 2;
    if (children[stopIndex]) children[stopIndex].textContent = finalSymbol;

    const offset = stopIndex * 120;
    symbolsEl.style.transition = 'none';
    symbolsEl.style.transform = 'translateY(0)';
    void symbolsEl.offsetWidth;
    symbolsEl.style.transition = `transform ${1.8 + idx * 0.5}s cubic-bezier(0.15, 0.85, 0.25, 1)`;
    symbolsEl.style.transform = `translateY(-${offset}px)`;
  });

  setTimeout(() => {
    spinning = false;
    document.getElementById('spinBtn').disabled = false;

    let win = 0;
    if (results[0] === results[1] && results[1] === results[2]) {
      win = slotBet * (SLOT_PAYS[results[0]] || 5);
    }

    if (win > 0) {
      balance += win;
      updateBalanceDisplay();
      saveBalance();
      document.getElementById('lastWin').textContent = `Выигрыш: ${win} ◆`;
      toast(`ДЖЕКПОТ! +${win} ◆`, 'win');
    } else {
      document.getElementById('lastWin').textContent = 'Выигрыш: 0';
      toast('Попробуйте ещё раз', 'lose');
    }
  }, 3200);
});

// ===== ROULETTE =====
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
let rouletteBet = 100;
let selectedBetType = null;
let rouletteSpinning = false;

document.getElementById('rBetMinus').addEventListener('click', () => {
  if (rouletteBet > 20) {
    rouletteBet -= 20;
    document.getElementById('rouletteBet').textContent = rouletteBet;
  }
});
document.getElementById('rBetPlus').addEventListener('click', () => {
  if (rouletteBet < 1000) {
    rouletteBet += 20;
    document.getElementById('rouletteBet').textContent = rouletteBet;
  }
});

document.querySelectorAll('.r-bet').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.r-bet').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedBetType = btn.dataset.type;
  });
});

document.getElementById('spinRoulette').addEventListener('click', () => {
  if (!requireAuth()) return;
  if (rouletteSpinning) return;
  if (!selectedBetType) {
    toast('Выберите тип ставки');
    return;
  }
  if (balance < rouletteBet) {
    toast('Недостаточно средств', 'lose');
    return;
  }

  balance -= rouletteBet;
  updateBalanceDisplay();
  saveBalance();
  rouletteSpinning = true;
  document.getElementById('spinRoulette').disabled = true;
  document.getElementById('rouletteResult').textContent = 'Крутим...';

  const number = Math.floor(Math.random() * 37); // 0-36
  const isRed = RED_NUMBERS.includes(number);
  const isGreen = number === 0;
  const isEven = number !== 0 && number % 2 === 0;
  const isOdd = number !== 0 && number % 2 === 1;

  // Spin animation
  const wheel = document.getElementById('wheel');
  const extraSpins = 5 + Math.floor(Math.random() * 3);
  const angle = extraSpins * 360 + (number / 37) * 360;
  wheel.style.transform = `rotate(${angle}deg)`;

  setTimeout(() => {
    rouletteSpinning = false;
    document.getElementById('spinRoulette').disabled = false;

    let win = 0;
    let mult = 0;
    if (selectedBetType === 'red' && isRed) mult = 2;
    if (selectedBetType === 'black' && !isRed && !isGreen) mult = 2;
    if (selectedBetType === 'green' && isGreen) mult = 14;
    if (selectedBetType === 'even' && isEven) mult = 2;
    if (selectedBetType === 'odd' && isOdd) mult = 2;

    if (mult > 0) {
      win = rouletteBet * mult;
      balance += win;
      updateBalanceDisplay();
      saveBalance();
    }

    const colorName = isGreen ? 'Зелёное' : isRed ? 'Красное' : 'Чёрное';
    document.getElementById('rouletteResult').textContent =
      `Выпало: ${number} (${colorName})` + (win > 0 ? ` | +${win} ◆` : '');

    if (win > 0) toast(`Победа! +${win} ◆`, 'win');
    else toast(`Выпало ${number}. Попробуйте ещё`, 'lose');
  }, 4200);
});

// ===== BLACKJACK =====
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
let bjBet = 100;
let deck = [];
let playerHand = [];
let dealerHand = [];
let bjInGame = false;

document.getElementById('bjBetMinus').addEventListener('click', () => {
  if (!bjInGame && bjBet > 20) {
    bjBet -= 20;
    document.getElementById('bjBet').textContent = bjBet;
  }
});
document.getElementById('bjBetPlus').addEventListener('click', () => {
  if (!bjInGame && bjBet < 1000) {
    bjBet += 20;
    document.getElementById('bjBet').textContent = bjBet;
  }
});

function createDeck() {
  deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ rank: r, suit: s });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

function handScore(hand) {
  let score = 0;
  let aces = 0;
  hand.forEach(c => {
    score += cardValue(c);
    if (c.rank === 'A') aces++;
  });
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function renderCard(card, hidden = false) {
  const el = document.createElement('div');
  el.className = 'card' + (hidden ? ' back' : '');
  if (!hidden) {
    const isRed = card.suit === '♥' || card.suit === '♦';
    if (isRed) el.classList.add('red');
    el.innerHTML = `<span>${card.rank}</span><span style="font-size:1.1rem">${card.suit}</span>`;
  }
  return el;
}

function renderHands(hideDealer = true) {
  const pEl = document.getElementById('playerCards');
  const dEl = document.getElementById('dealerCards');
  pEl.innerHTML = '';
  dEl.innerHTML = '';

  playerHand.forEach(c => pEl.appendChild(renderCard(c)));
  dealerHand.forEach((c, i) => {
    dEl.appendChild(renderCard(c, hideDealer && i === 1));
  });

  document.getElementById('playerScore').textContent = `(${handScore(playerHand)})`;
  document.getElementById('dealerScore').textContent = hideDealer
    ? ''
    : `(${handScore(dealerHand)})`;
}

function setBjButtons(deal, hit, stand, double) {
  document.getElementById('bjDeal').disabled = !deal;
  document.getElementById('bjHit').disabled = !hit;
  document.getElementById('bjStand').disabled = !stand;
  document.getElementById('bjDouble').disabled = !double;
}

document.getElementById('bjDeal').addEventListener('click', () => {
  if (!requireAuth()) return;
  if (balance < bjBet) {
    toast('Недостаточно средств', 'lose');
    return;
  }

  balance -= bjBet;
  updateBalanceDisplay();
  saveBalance();
  bjInGame = true;
  createDeck();
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  renderHands(true);
  setBjButtons(false, true, true, true);
  document.getElementById('bjResult').textContent = 'Ваш ход';

  // Blackjack check
  if (handScore(playerHand) === 21) {
    endBlackjack('blackjack');
  }
});

document.getElementById('bjHit').addEventListener('click', () => {
  playerHand.push(deck.pop());
  renderHands(true);
  setBjButtons(false, true, true, false);
  if (handScore(playerHand) > 21) {
    endBlackjack('bust');
  }
});

document.getElementById('bjStand').addEventListener('click', () => {
  dealerPlay();
});

document.getElementById('bjDouble').addEventListener('click', () => {
  if (balance < bjBet) {
    toast('Недостаточно для удвоения');
    return;
  }
  balance -= bjBet;
  bjBet *= 2;
  document.getElementById('bjBet').textContent = bjBet;
  updateBalanceDisplay();
  saveBalance();
  playerHand.push(deck.pop());
  renderHands(true);
  if (handScore(playerHand) > 21) {
    endBlackjack('bust');
  } else {
    dealerPlay();
  }
});

function dealerPlay() {
  renderHands(false);
  while (handScore(dealerHand) < 17) {
    dealerHand.push(deck.pop());
    renderHands(false);
  }
  const p = handScore(playerHand);
  const d = handScore(dealerHand);
  if (d > 21) endBlackjack('dealer_bust');
  else if (p > d) endBlackjack('win');
  else if (p < d) endBlackjack('lose');
  else endBlackjack('push');
}

function endBlackjack(result) {
  bjInGame = false;
  renderHands(false);
  setBjButtons(true, false, false, false);

  let msg = '';
  let win = 0;
  if (result === 'blackjack') {
    win = Math.floor(bjBet * 2.5);
    msg = `Блэкджек! +${win} ◆`;
  } else if (result === 'win' || result === 'dealer_bust') {
    win = bjBet * 2;
    msg = `Победа! +${win} ◆`;
  } else if (result === 'push') {
    win = bjBet;
    msg = 'Ничья. Ставка возвращена';
  } else if (result === 'bust') {
    msg = 'Перебор! Вы проиграли';
  } else {
    msg = 'Дилер победил';
  }

  if (win > 0) {
    balance += win;
    updateBalanceDisplay();
    saveBalance();
    toast(msg, 'win');
  } else {
    toast(msg, 'lose');
  }

  document.getElementById('bjResult').textContent = msg;
  // Reset bet display (in case of double)
  bjBet = Math.min(bjBet, 1000);
  if (result === 'blackjack' || result === 'win' || result === 'dealer_bust' || result === 'push' || result === 'bust' || result === 'lose') {
    // restore original bet size after double
    if (bjBet > 100 && bjBet % 20 === 0) {
      // keep as is, user can adjust
    }
  }
  document.getElementById('bjBet').textContent = bjBet > 500 ? 100 : bjBet;
  if (bjBet > 500) bjBet = 100;
}

// ===== Online counter fake =====
setInterval(() => {
  const el = document.getElementById('onlineCount');
  if (el) {
    const base = 1200 + Math.floor(Math.random() * 150);
    el.textContent = base.toLocaleString('ru-RU');
  }
}, 5000);

// ===== Init =====
function init() {
  // Load settings
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved) settings = { ...settings, ...saved };
  } catch {}

  applyTheme();
  applyFlicker();
  initParticles();
  initSlots();

  // Restore session
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
    const users = getUsers();
    if (users[session]) {
      currentUser = session;
      balance = users[session].balance;
      updateBalanceDisplay();
      updateAuthUI();
    }
  }

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });
}

init();
