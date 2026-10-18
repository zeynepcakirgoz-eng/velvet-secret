(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_ENERGY = 500;
  const ENERGY_INTERVAL = 60000;

  // Web Audio Synthesizer (High quality chime, pop, fanfare)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const sfx = {
    pop() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (e) {}
    },
    merge() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.06 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.22);
        });
      } catch (e) {}
    },
    coin() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime);
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    },
    fanfare() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
        chords.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.45);
        });
      } catch (e) {}
    }
  };

  // 3 Item Chains (6 levels each)
  const itemChains = [
    // 0: Kozmetik
    [
      { name: 'Nemlendirici', icon: '🧴' },
      { name: 'Mat Ruj', icon: '💄' },
      { name: 'Kırmızı Oje', icon: '💅' },
      { name: 'Lüks Parfüm', icon: '✨' },
      { name: 'Altın Ayna', icon: '🪞' },
      { name: 'Elmas Kozmetik Seti', icon: '💖' }
    ],
    // 1: Mücevher
    [
      { name: 'Gümüş Yüzük', icon: '💍' },
      { name: 'İnci Kolye', icon: '📿' },
      { name: 'Zümrüt Broş', icon: '💎' },
      { name: 'Kraliçe Tacı', icon: '👑' },
      { name: 'Zümrüt Kupa', icon: '🏆' },
      { name: 'Kraliyet Asası', icon: '⚜️' }
    ],
    // 2: Lüks Sosyete
    [
      { name: 'Mühürlü Davet', icon: '💌' },
      { name: 'Kristal Kadeh', icon: '🥂' },
      { name: 'Eski Şampanya', icon: '🍾' },
      { name: 'İpek Topuklu', icon: '👠' },
      { name: 'Spor Araba', icon: '🏎️' },
      { name: 'Mega Yat', icon: '🛥️' }
    ]
  ];

  function getItemMeta(type, level) {
    const chain = itemChains[type % itemChains.length];
    const lvlIdx = Math.max(0, Math.min(chain.length - 1, (level || 1) - 1));
    return chain[lvlIdx];
  }

  // Gossip Harbor Characters Pool
  const customerPool = [
    { name: 'Adrian Vale', role: 'Gizemli Milyarder', avatar: '🤵', quotes: ['Bu akşamki gizli davet için arıyordum.', 'Isabella, bu otelin sırları derin...'] },
    { name: 'Olivia Sterling', role: 'Magazin Muhabiri', avatar: '🕵️‍♀️', quotes: ['Sosyete bu haberi konuşacak!', 'Körfez fısıltıları asla susmaz.'] },
    { name: 'Isabella Laurent', role: 'Otel Sahibi', avatar: '👑', quotes: ['Aurelia Oteli eski görkemine kavuşacak.', 'Babamın mirasını kimseye bırakmam.'] },
    { name: 'Harrison Vance', role: 'Aile Avukatı', avatar: '🎩', quotes: ['Vasiyetnamenin şartları yerine gelmeli.', 'Resmi kayıtlar tamamlanıyor.'] },
    { name: 'Madame Vivienne', role: 'Antika Koleksiyoneri', avatar: '💎', quotes: ['Zarafet asla tesadüf değildir sevgilim.', 'Lüks, detaylarda gizlidir.'] }
  ];

  // Renovation Storyline Tasks (Cost in ⭐ Stars)
  const defaultRenovations = [
    {
      id: 'floor',
      name: 'Lobi Mermerlerini Temizle & Parlat',
      cost: 1,
      done: false,
      desc: 'Yılların tozunu temizle, İtalyan mermerlerini pırıl pırıl parlat.',
      dialogueChar: 'Isabella Laurent',
      dialogueAvatar: '👑',
      dialogueText: '"Zemindeki mermerler pırıl pırıl oldu! Zemin temizlenirken altında mühürlü eski bir plaka fark ettim..."',
      roomVisual: '✨🏨'
    },
    {
      id: 'desk',
      name: 'Altın Varaklı Resepsiyon Bankosu',
      cost: 1,
      done: false,
      desc: 'Konukları büyüleyecek gösterişli altın bankoyu kur.',
      dialogueChar: 'Adrian Vale',
      dialogueAvatar: '🤵',
      dialogueText: '"Bu banko babanın dönemindeki ihtişamı yansıtıyor. Eski konuk kayıt defterleri buraya saklanmış olabilir."',
      roomVisual: '🛎️🏨'
    },
    {
      id: 'chandelier',
      name: 'Kristal Aurelia Avizesi',
      cost: 2,
      done: false,
      desc: 'Tavana körfezin en görkemli Bohemya kristal avizesini as.',
      dialogueChar: 'Isabella Laurent',
      dialogueAvatar: '👑',
      dialogueText: '"Tavandaki avizenin ışıkları tüm körfezden görünüyor! Otelimiz yeniden hayat buluyor."',
      roomVisual: '💎🏨'
    },
    {
      id: 'sofas',
      name: 'Bordo Kadife VIP Köşesi',
      cost: 2,
      done: false,
      desc: 'Şöminenin etrafına konforlu kadife koltukları yerleştir.',
      dialogueChar: 'Olivia Sterling',
      dialogueAvatar: '🕵️‍♀️',
      dialogueText: '"Sosyete fısıltıları başladı bile. Bu koltuklarda kim bilir hangi entrikalar konuşulacak..."',
      roomVisual: '🛋️🏨'
    },
    {
      id: 'safe',
      name: 'Mühürlü Duvar Kasasını Açığa Çıkar',
      cost: 3,
      done: false,
      desc: 'Resepsiyonun arkasındaki gizli duvar kasasının şifresini çöz.',
      dialogueChar: 'Harrison Vance',
      dialogueAvatar: '🎩',
      dialogueText: '"Kasanın içinden eski bir vasiyetname çıktı... Isabella, bu otel sandığından çok daha büyük sırlar saklıyor!"',
      roomVisual: '🗝️🏨'
    },
    {
      id: 'terrace',
      name: 'Panoramik Teras Barı & Işıklar',
      cost: 3,
      done: false,
      desc: 'Körfez manzaralı lüks teras barını ve ışıklandırmayı tamamla.',
      dialogueChar: 'Isabella Laurent',
      dialogueAvatar: '👑',
      dialogueText: '"Aurelia Terası açıldı! Yıldızların ve körfezin ışıkları altında yeni bir çağ başlıyor."',
      roomVisual: '🌅🏨'
    }
  ];

  const tasks = [
    { id: 'merge', name: 'Kusursuz Birleşim', desc: 'Masanızdaki objeleri birleştirin', goal: 4, reward: 50, metric: 'merges' },
    { id: 'orders', name: 'Sipariş Teslimatı', desc: 'Müşteri siparişlerini teslim edin', goal: 2, reward: 80, metric: 'ordersCompleted' },
    { id: 'stars', name: 'Otel Yenileme', desc: 'Bir yenileme görevi tamamlayın', goal: 1, reward: 100, metric: 'renovationsDone' }
  ];

  // Safe storage helper
  const memoryStore = {};
  const safeStorage = {
    getItem(k) {
      try { return window.localStorage.getItem(k); } catch (e) { return memoryStore[k] || null; }
    },
    setItem(k, v) {
      try { window.localStorage.setItem(k, v); } catch (e) { memoryStore[k] = String(v); }
    }
  };

  let state;

  function generateRandomOrder(id) {
    const cust = customerPool[Math.floor(Math.random() * customerPool.length)];
    const quote = cust.quotes[Math.floor(Math.random() * cust.quotes.length)];

    // 1 or 2 items
    const itemCount = Math.random() > 0.6 ? 2 : 1;
    const reqItems = [];

    for (let k = 0; k < itemCount; k++) {
      const type = Math.floor(Math.random() * itemChains.length);
      // levels 1 to 4 for orders
      const level = Math.min(4, 1 + Math.floor(Math.random() * 3));
      reqItems.push({ type, level });
    }

    const totalLvl = reqItems.reduce((acc, item) => acc + item.level, 0);
    const rewardCoins = 80 + totalLvl * 50;
    const rewardStars = totalLvl >= 3 ? 2 : 1;

    return {
      id: id || Date.now() + Math.random(),
      customer: cust.name,
      role: cust.role,
      avatar: cust.avatar,
      quote: quote,
      items: reqItems,
      rewardCoins,
      rewardStars
    };
  }

  function initialState() {
    const board = Array.from({ length: 25 }, (_, i) => {
      if (i % 4 === 0 || i % 6 === 0) {
        return { type: Math.floor(Math.random() * itemChains.length), level: 1 };
      }
      return null;
    });

    const initialOrders = [
      generateRandomOrder(1),
      generateRandomOrder(2),
      generateRandomOrder(3)
    ];

    return {
      energy: 500,
      energyUpdated: Date.now(),
      prestige: 1200,
      gems: 15,
      stars: 2,
      playerLevel: 1,
      xp: 0,
      board,
      selected: null,
      merges: 0,
      ordersCompleted: 0,
      renovationsDone: 0,
      claimedTasks: [],
      orders: initialOrders,
      renovations: JSON.parse(JSON.stringify(defaultRenovations)),
      activeDialogue: {
        character: 'Isabella Laurent',
        avatar: '👑',
        text: '"Aurelia Oteli eski görkemine kavuşacak. Masadaki siparişleri hazırlayıp Yıldız (⭐) toplayarak lobiyi yenilemeye başlayalım!"'
      },
      notice: 'Hoş geldin! Üstteki siparişleri tamamla, Yıldızları (⭐) topla ve oteli yenile.'
    };
  }

  function load() {
    try {
      const raw = safeStorage.getItem('velvetSecretsGossipV3');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.board) && s.board.length === 25) {
          state = { ...initialState(), ...s };
          return;
        }
      }
    } catch (e) {}
    state = initialState();
  }

  function save() {
    try {
      safeStorage.setItem('velvetSecretsGossipV3', JSON.stringify(state));
    } catch (e) {}
  }

  function tick() {
    const now = Date.now();
    const elapsed = Math.max(0, now - (state.energyUpdated || now));
    const gained = Math.floor(elapsed / ENERGY_INTERVAL);
    if (gained > 0) {
      state.energy = Math.min(MAX_ENERGY, state.energy + gained);
      state.energyUpdated = state.energy >= MAX_ENERGY ? now : state.energyUpdated + gained * ENERGY_INTERVAL;
    }
    if (state.energy >= MAX_ENERGY) {
      state.energyUpdated = now;
    }
  }

  function notify(s) {
    state.notice = s;
    const el = $('notice');
    if (el) el.textContent = s;
    save();
  }

  function showFloatingText(text, x, y) {
    const layer = $('fxLayer');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 850);
  }

  function addXP(amount, clientX, clientY) {
    state.xp += amount;
    const needed = state.playerLevel * 60;
    if (clientX && clientY) {
      showFloatingText(`+${amount} XP`, clientX, clientY);
    }
    if (state.xp >= needed) {
      state.xp -= needed;
      state.playerLevel++;
      state.energy = Math.min(MAX_ENERGY, state.energy + 100);
      state.gems += 5;
      state.stars += 1;
      sfx.fanfare();
      triggerLevelUpModal();
    }
  }

  function triggerLevelUpModal() {
    const modal = $('levelUpModal');
    const sub = $('levelUpSubtitle');
    if (modal && sub) {
      sub.textContent = `Seviye ${state.playerLevel}'e Ulaştın!`;
      modal.style.display = 'flex';
    }
  }

  function spend(n) {
    tick();
    if (state.energy < n) {
      notify('Enerjin bitti! Reklam izleyerek veya şans çarkını çevirerek anında enerji kazanabilirsin.');
      return false;
    }
    state.energy -= n;
    if (state.energy < MAX_ENERGY && state.energyUpdated > Date.now()) {
      state.energyUpdated = Date.now();
    }
    return true;
  }

  /* ================= GOSSIP HARBOR ORDERS LOGIC ================= */
  // Check if player has the items on the board
  function checkOrderFulfillment(order) {
    const boardCopy = state.board.map((x) => (x ? { ...x } : null));
    const itemsStatus = [];
    let allReady = true;

    for (const req of order.items) {
      let foundIdx = -1;
      for (let i = 0; i < boardCopy.length; i++) {
        if (boardCopy[i] && boardCopy[i].type === req.type && boardCopy[i].level === req.level) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx !== -1) {
        itemsStatus.push({ ...req, ready: true });
        boardCopy[foundIdx] = null; // simulate consumed
      } else {
        itemsStatus.push({ ...req, ready: false });
        allReady = false;
      }
    }

    return { allReady, itemsStatus };
  }

  function renderOrders() {
    const tray = $('orderTray');
    if (!tray) return;
    tray.innerHTML = '';

    state.orders.forEach((ord, index) => {
      const { allReady, itemsStatus } = checkOrderFulfillment(ord);

      const card = document.createElement('div');
      card.className = 'order-card' + (allReady ? ' ready-to-serve' : '');

      let itemsHtml = '';
      itemsStatus.forEach((it) => {
        const meta = getItemMeta(it.type, it.level);
        itemsHtml += `
          <div class="req-item-pill ${it.ready ? 'ready' : ''}">
            <span class="req-item-emoji">${meta.icon}</span>
            <span class="req-item-lv">LV.${it.level}</span>
            ${it.ready ? '<span class="req-status-check">✓</span>' : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="order-customer">
          <span class="order-avatar">${ord.avatar}</span>
          <div>
            <div class="order-c-name">${ord.customer}</div>
          </div>
        </div>
        <div class="order-quote">"${ord.quote}"</div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-rewards">
          <span>◆ +${ord.rewardCoins}</span>
          <span class="reward-stars">⭐ +${ord.rewardStars}</span>
        </div>
        <button class="serve-btn ${allReady ? 'can-serve' : ''}" ${!allReady ? 'disabled' : ''}>
          ${allReady ? 'TESLİM ET' : 'HAZIRLA'}
        </button>
      `;

      const serveBtn = card.querySelector('.serve-btn');
      if (serveBtn && allReady) {
        serveBtn.onclick = (e) => {
          e.preventDefault();
          serveOrder(index, ord, e.clientX, e.clientY);
        };
      }

      tray.appendChild(card);
    });
  }

  function serveOrder(orderIdx, order, clientX, clientY) {
    // Actually remove the items from board
    for (const req of order.items) {
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] && state.board[i].type === req.type && state.board[i].level === req.level) {
          state.board[i] = null;
          break;
        }
      }
    }

    state.prestige += order.rewardCoins;
    state.stars += order.rewardStars;
    state.ordersCompleted++;

    sfx.coin();
    if (clientX && clientY) {
      showFloatingText(`⭐ +${order.rewardStars} Yıldız!`, clientX, clientY);
      showFloatingText(`◆ +${order.rewardCoins}`, clientX, clientY - 30);
    }

    addXP(30);

    // Replace order with fresh one
    state.orders[orderIdx] = generateRandomOrder();

    // Update active dialogue
    state.activeDialogue = {
      character: order.customer,
      avatar: order.avatar,
      text: `"${order.customer}: Teşekkürler Isabella! Bu tam da ihtiyacım olan şeydi. Otelin için yıldızlarını (⭐) iyi kullan!"`
    };

    notify(`Sipariş tamamlandı! +${order.rewardCoins} Prestij ve +${order.rewardStars} Yenileme Yıldızı kazandın!`);
    renderAll();
  }

  /* ================= HOTEL RENOVATIONS (GOSSIP HARBOR STYLE) ================= */
  function renderHotelStudio() {
    const list = $('renovationList');
    if (!list) return;
    list.innerHTML = '';

    let availableCount = 0;
    let completedCount = 0;

    state.renovations.forEach((renov) => {
      if (renov.done) {
        completedCount++;
      } else if (state.stars >= renov.cost) {
        availableCount++;
      }

      const item = document.createElement('div');
      item.className = 'renovation-item' + (renov.done ? ' done' : '');

      item.innerHTML = `
        <div class="renov-item-info">
          <strong>${renov.name}</strong>
          <p>${renov.desc}</p>
        </div>
        ${
          renov.done
            ? '<span class="renov-done-badge">✓ TAMAMLANDI</span>'
            : `<button class="renov-action-btn" ${state.stars < renov.cost ? 'disabled' : ''}>
                <span>⭐ ${renov.cost}</span>
                <span>YENİLE</span>
              </button>`
        }
      `;

      const btn = item.querySelector('.renov-action-btn');
      if (btn && !renov.done) {
        btn.onclick = (e) => {
          e.preventDefault();
          executeRenovation(renov, e.clientX, e.clientY);
        };
      }

      list.appendChild(item);
    });

    // Badge on tab
    const badge = $('hotelTaskBadge');
    if (badge) {
      badge.textContent = availableCount;
      badge.style.display = availableCount > 0 ? 'inline-block' : 'none';
    }

    // Room progress & visual
    const pct = Math.round((completedCount / state.renovations.length) * 100);
    if ($('renovationBar')) $('renovationBar').style.width = `${pct}%`;
    if ($('renovationPercent')) $('renovationPercent').textContent = `Tamamlanma: %${pct}`;

    const lastDone = [...state.renovations].reverse().find((r) => r.done);
    if (lastDone && $('roomVisual')) {
      $('roomVisual').textContent = lastDone.roomVisual;
    }

    // Dialogue bubble
    if ($('dialogueAvatar')) $('dialogueAvatar').textContent = state.activeDialogue.avatar;
    if ($('dialogueCharacter')) $('dialogueCharacter').textContent = state.activeDialogue.character;
    if ($('dialogueText')) $('dialogueText').textContent = state.activeDialogue.text;
  }

  function executeRenovation(renov, clientX, clientY) {
    if (state.stars < renov.cost) return;

    state.stars -= renov.cost;
    renov.done = true;
    state.renovationsDone++;

    sfx.fanfare();
    if (clientX && clientY) {
      showFloatingText(`🛠️ YENİLENDİ!`, clientX, clientY);
    }

    addXP(40);

    // Dialogue update
    state.activeDialogue = {
      character: renov.dialogueChar,
      avatar: renov.dialogueAvatar,
      text: renov.dialogueText
    };

    notify(`Tebrikler! "${renov.name}" başarıyla tamamlandı ve otel güzelleşti!`);
    renderAll();
  }

  /* ================= LUCKY WHEEL ================= */
  function initLuckyWheel() {
    const wheel = $('luckyWheel');
    const spinBtn = $('spinBtn');
    const spinAdBtn = $('spinAdBtn');
    const resultNotice = $('wheelResultNotice');

    let isSpinning = false;
    let currentDegree = 0;

    const segments = [
      { name: '100 Enerji', reward: () => { state.energy = Math.min(MAX_ENERGY, state.energy + 100); } },
      { name: '500 Prestij', reward: () => { state.prestige += 500; } },
      { name: '10 Mücevher', reward: () => { state.gems += 10; } },
      { name: '1 Yenileme Yıldızı', reward: () => { state.stars += 1; } },
      { name: '50 Enerji', reward: () => { state.energy = Math.min(MAX_ENERGY, state.energy + 50); } },
      { name: 'VIP Sandık (Nadir Obje)', reward: () => { spawnItem(); state.prestige += 150; } }
    ];

    function runSpin() {
      if (isSpinning) return;
      isSpinning = true;
      sfx.pop();

      const chosenIndex = Math.floor(Math.random() * segments.length);
      const randomExtraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
      // segment angle
      const targetDeg = randomExtraRotations + (360 - chosenIndex * 60 - 30);
      currentDegree += targetDeg;

      if (wheel) wheel.style.transform = `rotate(${currentDegree}deg)`;
      if (resultNotice) resultNotice.textContent = 'Çark dönüyor... Şans seninle olsun!';

      setTimeout(() => {
        isSpinning = false;
        const prize = segments[chosenIndex];
        prize.reward();
        sfx.fanfare();
        if (resultNotice) resultNotice.textContent = `🎉 TEBRİKLER! "${prize.name}" KAZANDIN!`;
        notify(`Şans Çarkından ödül kazanıldı: ${prize.name}!`);
        renderAll();
      }, 4200);
    }

    if (spinBtn) {
      spinBtn.onclick = () => runSpin();
    }
    if (spinAdBtn) {
      spinAdBtn.onclick = () => {
        openAdModal(() => runSpin());
      };
    }
  }

  /* ================= REWARDED AD MODAL ================= */
  let adCallback = null;
  function openAdModal(cb) {
    adCallback = cb;
    const modal = $('adModal');
    const countdownEl = $('adCountdown');
    const claimBtn = $('adClaimBtn');

    if (!modal || !countdownEl || !claimBtn) return;

    modal.style.display = 'flex';
    let sec = 5;
    claimBtn.disabled = true;
    claimBtn.textContent = `Ödül İçin Bekleyin (${sec})`;
    countdownEl.textContent = `${sec} sn`;

    const timer = setInterval(() => {
      sec--;
      if (sec > 0) {
        countdownEl.textContent = `${sec} sn`;
        claimBtn.textContent = `Ödül İçin Bekleyin (${sec})`;
      } else {
        clearInterval(timer);
        countdownEl.textContent = 'Tamamlandı!';
        claimBtn.disabled = false;
        claimBtn.textContent = '🎁 Ödülünü Al!';
        sfx.fanfare();
      }
    }, 1000);

    claimBtn.onclick = () => {
      modal.style.display = 'none';
      if (adCallback) {
        adCallback();
      } else {
        state.energy = Math.min(MAX_ENERGY, state.energy + 50);
        state.prestige += 200;
        sfx.coin();
        notify('VIP Reklam ödülü hesabına aktarıldı: +50 Enerji ve +200 Prestij!');
        renderAll();
      }
      adCallback = null;
    };
  }

  /* ================= BOARD & SPAWNER ================= */
  function spawnItem() {
    if (!spend(1)) return;

    const emptySlots = [];
    state.board.forEach((it, idx) => {
      if (!it) emptySlots.push(idx);
    });

    if (emptySlots.length === 0) {
      state.energy += 1; // refund
      notify('Masa tamamen dolu! İki aynı objeyi birleştirerek yer açın.');
      return;
    }

    const targetIdx = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    const randomType = Math.floor(Math.random() * itemChains.length);
    state.board[targetIdx] = { type: randomType, level: 1 };
    sfx.pop();

    const spawnBtn = $('spawnBtn');
    if (spawnBtn) {
      const rect = spawnBtn.getBoundingClientRect();
      showFloatingText('🎁 +1 Obje', rect.left + rect.width / 2, rect.top);
    }

    renderAll();
    const meta = getItemMeta(randomType, 1);
    notify(`Yeni obje üretildi: ${meta.icon} ${meta.name}`);
  }

  function sortBoard() {
    const filled = state.board.filter(Boolean);
    // Sort by type then level so matching items sit side-by-side
    filled.sort((a, b) => a.type - b.type || a.level - b.level);

    let k = 0;
    state.board = state.board.map((x) => (x ? filled[k++] : null));
    state.selected = null;
    sfx.pop();
    renderAll();
    notify('Masa düzenlendi! Eşleşen objeler yan yana getirildi.');
  }

  function handleMergeOrMove(fromIdx, toIdx, clientX, clientY) {
    if (fromIdx === toIdx) {
      state.selected = null;
      renderBoard();
      return;
    }

    const source = state.board[fromIdx];
    const target = state.board[toIdx];

    if (!source) {
      state.selected = null;
      renderBoard();
      return;
    }

    // Move to empty
    if (!target) {
      state.board[toIdx] = source;
      state.board[fromIdx] = null;
      state.selected = null;
      sfx.pop();
      renderAll();
      notify('Obje yeni alana taşındı.');
      return;
    }

    // Same type & level -> MERGE!
    if (source.type === target.type && source.level === target.level) {
      const newLevel = target.level + 1;
      state.board[toIdx] = { type: target.type, level: newLevel };
      state.board[fromIdx] = null;
      state.selected = null;
      state.merges++;

      sfx.merge();
      const meta = getItemMeta(target.type, newLevel);
      if (clientX && clientY) {
        showFloatingText(`✨ ${meta.name} (LV.${newLevel})`, clientX, clientY);
      }
      addXP(15 * newLevel, clientX, clientY);

      renderAll();
      notify(`Muhteşem birleşim! ${meta.icon} ${meta.name} (Seviye ${newLevel}) üretildi!`);
      return;
    }

    // Different item -> SWAP
    state.board[toIdx] = source;
    state.board[fromIdx] = target;
    state.selected = null;
    sfx.pop();
    renderAll();
    notify('Objelerin yerleri değiştirildi.');
  }

  /* ================= DRAG & DROP CONTROLLER ================= */
  function initDragAndDrop() {
    const board = $('board');
    const ghost = $('dragGhost');
    if (!board || !ghost) return;

    let dragSourceIdx = null;
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let currentHoverTile = null;

    board.addEventListener('pointerdown', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      const idx = parseInt(tile.dataset.index, 10);
      if (isNaN(idx)) return;

      const item = state.board[idx];

      if (state.selected !== null && idx !== state.selected) {
        handleMergeOrMove(state.selected, idx, e.clientX, e.clientY);
        return;
      }

      if (!item) return;

      dragSourceIdx = idx;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      tile.setPointerCapture(e.pointerId);
    });

    board.addEventListener('pointermove', (e) => {
      if (dragSourceIdx === null) return;

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const item = state.board[dragSourceIdx];
      if (!item) return;

      if (dist > 8) {
        isDragging = true;
        const meta = getItemMeta(item.type, item.level);
        ghost.innerHTML = `<span class="emoji">${meta.icon}</span><span class="lv">LV.${item.level}</span>`;
        ghost.style.display = 'flex';
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;

        const sourceEl = board.querySelector(`[data-index="${dragSourceIdx}"]`);
        if (sourceEl) sourceEl.classList.add('drag-source');

        ghost.style.pointerEvents = 'none';
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        const overTile = elemBelow ? elemBelow.closest('.tile') : null;

        if (currentHoverTile && currentHoverTile !== overTile) {
          currentHoverTile.classList.remove('drag-over');
        }
        if (overTile && overTile.dataset.index !== String(dragSourceIdx)) {
          overTile.classList.add('drag-over');
          currentHoverTile = overTile;
        } else {
          currentHoverTile = null;
        }
      }
    });

    const finishDrag = (e) => {
      if (dragSourceIdx === null) return;

      ghost.style.display = 'none';
      if (currentHoverTile) {
        currentHoverTile.classList.remove('drag-over');
        currentHoverTile = null;
      }

      const sourceEl = board.querySelector(`[data-index="${dragSourceIdx}"]`);
      if (sourceEl) sourceEl.classList.remove('drag-source');

      if (isDragging) {
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        const targetTile = elemBelow ? elemBelow.closest('.tile') : null;

        if (targetTile) {
          const targetIdx = parseInt(targetTile.dataset.index, 10);
          if (!isNaN(targetIdx)) {
            handleMergeOrMove(dragSourceIdx, targetIdx, e.clientX, e.clientY);
          }
        } else {
          renderBoard();
        }
      } else {
        if (state.selected === dragSourceIdx) {
          state.selected = null;
          renderBoard();
        } else if (state.selected === null) {
          state.selected = dragSourceIdx;
          sfx.pop();
          renderBoard();
          const it = state.board[dragSourceIdx];
          if (it) {
            const meta = getItemMeta(it.type, it.level);
            notify(`${meta.icon} ${meta.name} seçildi. Eşleşen bir objeye sürükle veya dokun.`);
          }
        } else {
          handleMergeOrMove(state.selected, dragSourceIdx, e.clientX, e.clientY);
        }
      }

      dragSourceIdx = null;
      isDragging = false;
    };

    board.addEventListener('pointerup', finishDrag);
    board.addEventListener('pointercancel', finishDrag);
  }

  function renderBoard() {
    const board = $('board');
    if (!board) return;
    board.innerHTML = '';

    state.board.forEach((it, i) => {
      const b = document.createElement('div');
      b.className = 'tile' + (!it ? ' empty' : '') + (state.selected === i ? ' selected' : '');
      b.dataset.index = i;

      if (it) {
        const meta = getItemMeta(it.type, it.level);
        b.innerHTML = `<span class="emoji">${meta.icon}</span><span class="lv">LV.${it.level}</span>`;
        b.setAttribute('aria-label', `${meta.name} Seviye ${it.level}`);
      } else {
        b.innerHTML = `<span class="emoji">＋</span>`;
        b.setAttribute('aria-label', 'Boş alan');
      }

      board.appendChild(b);
    });
  }

  function renderTasks() {
    const el = $('tasks');
    if (!el) return;
    el.innerHTML = '';
    tasks.forEach((t) => {
      const count = t.metric === 'merges' ? state.merges : t.metric === 'ordersCompleted' ? state.ordersCompleted : state.renovationsDone;
      const done = count >= t.goal;
      const claimed = state.claimedTasks.includes(t.id);
      const pct = Math.min(100, (count / t.goal) * 100);

      const d = document.createElement('div');
      d.className = 'task';
      d.innerHTML = `
        <div class="tasktop">
          <span class="taskname">${t.name}</span>
          <span class="reward">⚡ +${t.reward}</span>
        </div>
        <div class="taskdesc">${t.desc}</div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="taskfoot">
          <span>${Math.min(count, t.goal)} / ${t.goal}${claimed ? ' · Alındı' : ''}</span>
          <button class="claim" ${!done || claimed ? 'disabled' : ''}>${claimed ? 'ALINDI' : done ? 'ÖDÜLÜ AL' : 'DEVAM ET'}</button>
        </div>
      `;

      const claimBtn = d.querySelector('button');
      if (claimBtn) {
        claimBtn.onclick = (e) => {
          e.preventDefault();
          if (!done || claimed) return;
          state.claimedTasks.push(t.id);
          state.energy = Math.min(MAX_ENERGY, state.energy + t.reward);
          sfx.coin();
          notify(`Görev tamamlandı! +${t.reward} Enerji kazandın.`);
          addXP(25);
          renderAll();
        };
      }
      el.appendChild(d);
    });
  }

  function renderStats() {
    tick();
    if ($('energy')) $('energy').textContent = state.energy;
    if ($('coins')) $('coins').textContent = state.prestige;
    if ($('gems')) $('gems').textContent = state.gems;
    if ($('stars')) $('stars').textContent = state.stars;

    const left = state.energy >= MAX_ENERGY ? 60 : 60 - Math.floor((Date.now() - state.energyUpdated) / 1000) % 60;
    if ($('timer')) $('timer').textContent = '00:' + String(left).padStart(2, '0');

    if ($('levelBadge')) $('levelBadge').textContent = state.playerLevel;
    const xpNeeded = state.playerLevel * 60;
    const pct = Math.min(100, (state.xp / xpNeeded) * 100);
    if ($('xpBar')) $('xpBar').style.width = `${pct}%`;
  }

  function renderAll() {
    renderStats();
    renderOrders();
    renderBoard();
    renderHotelStudio();
    renderTasks();
    save();
  }

  /* ================= TABS SETUP ================= */
  function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach((tab) => {
      tab.onclick = () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const targetId = tab.dataset.tab;
        document.querySelectorAll('.tab-content').forEach((sec) => {
          sec.classList.remove('active-tab');
        });
        const targetSec = $(targetId);
        if (targetSec) targetSec.classList.add('active-tab');

        sfx.pop();
        renderAll();
      };
    });
  }

  function initUI() {
    // Spawner
    const spawnBtn = $('spawnBtn');
    if (spawnBtn) spawnBtn.onclick = () => spawnItem();

    // Sort Board
    const sortBtn = $('sortBoardBtn');
    if (sortBtn) sortBtn.onclick = () => sortBoard();

    // Add Energy Ad Button
    const addEnergyBtn = $('addEnergyBtn');
    if (addEnergyBtn) addEnergyBtn.onclick = () => openAdModal();

    // Close Level Up Modal
    const closeLevelUpBtn = $('closeLevelUpBtn');
    if (closeLevelUpBtn) {
      closeLevelUpBtn.onclick = () => {
        const modal = $('levelUpModal');
        if (modal) modal.style.display = 'none';
        renderAll();
      };
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) save();
      else {
        tick();
        renderStats();
      }
    });

    window.addEventListener('beforeunload', save);
  }

  function init() {
    load();
    renderAll();
    initTabs();
    initDragAndDrop();
    initLuckyWheel();
    initUI();

    setInterval(renderStats, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();