(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_ENERGY = 500;
  const ENERGY_INTERVAL = 60000;

  // Web Audio Synthesizer (Realistic Game Sounds)
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
        osc.frequency.setValueAtTime(460, ctx.currentTime);
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

  // 3 Luxury Merge Item Chains (6 levels each) with High-Res Painted Artwork
  const itemChains = [
    // 0: Kraliyet Gülleri & Parfümeri
    [
      { name: 'Kırmızı Kadife Gül', icon: '🌹', img: 'assets/items/item_0_1.jpg' },
      { name: 'Altın Kurdeleli Çift Gül', icon: '🥀', img: 'assets/items/item_0_2.jpg' },
      { name: 'Kraliyet Gül Buketi', icon: '💐', img: 'assets/items/item_0_3.jpg' },
      { name: 'Safir Kristal Parfüm', icon: '💎', img: 'assets/items/item_0_4.jpg' },
      { name: 'Yakut İksir Şişesi', icon: '✨', img: 'assets/items/item_0_5.jpg' },
      { name: 'İmparatorluk Elmas Tacı', icon: '👑', img: 'assets/items/item_0_6.jpg' }
    ],
    // 1: Couture & Mücevherat
    [
      { name: 'Siyah & Altın Hediye Kutusu', icon: '🎁', img: 'assets/items/item_1_1.jpg' },
      { name: 'Elmas Stiletto Topuklu', icon: '👠', img: 'assets/items/item_1_2.jpg' },
      { name: 'Zümrüt & İnci Gerdanlık', icon: '📿', img: 'assets/items/item_1_3.jpg' },
      { name: 'Kraliyet Deri Valiz', icon: '🧳', img: 'assets/items/item_1_4.jpg' },
      { name: 'Altın Zafer Kupası', icon: '🏆', img: 'assets/items/item_1_5.jpg' },
      { name: 'Monako Kraliyet Tacı', icon: '👑', img: 'assets/items/item_1_6.jpg' }
    ],
    // 2: Riviera Gala & Gurme
    [
      { name: 'Altın Yaldızlı Espresso', icon: '☕', img: 'assets/items/item_2_1.jpg' },
      { name: 'Kristal & Altın Çaydanlık', icon: '🫖', img: 'assets/items/item_2_2.jpg' },
      { name: 'Fransız Güllü Pasta', icon: '🎂', img: 'assets/items/item_2_3.jpg' },
      { name: 'Kristal Şampanya Kadehi', icon: '🥂', img: 'assets/items/item_2_4.jpg' },
      { name: 'Buz Kovasında Şampanya', icon: '🍾', img: 'assets/items/item_2_5.jpg' },
      { name: 'Aurelia Altın Kadeh Ödülü', icon: '🏆', img: 'assets/items/item_2_6.jpg' }
    ]
  ];

  function getItemMeta(type, level) {
    const t = type % itemChains.length;
    const chain = itemChains[t];
    const lvlIdx = Math.max(0, Math.min(chain.length - 1, (level || 1) - 1));
    const item = chain[lvlIdx];
    const imgUrl = (window.LuxuryArt && window.LuxuryArt.getItemImage)
      ? window.LuxuryArt.getItemImage(t, lvlIdx + 1)
      : item.img;
    return { ...item, img: imgUrl };
  }

  // 4 Main Characters from Concept Art with Real Photo Avatars
  const customerPool = [
    {
      name: 'Adrian Vale',
      role: 'Gizemli Milyarder',
      avatarImg: 'assets/avatar_adrian.jpg',
      quotes: ['Bu akşamki gizli davet için bunu arıyordum.', 'Isabella, bu otelin sırları düşündüğünden derin...']
    },
    {
      name: 'Isabella Laurent',
      role: 'Otel Varisi',
      avatarImg: 'assets/avatar_isabella.jpg',
      quotes: ['Aurelia Oteli eski görkemine kavuşacak!', 'Babamın mirasını kimseye bırakmam.']
    },
    {
      name: 'Leon Marchand',
      role: 'Otelin Sahibi',
      avatarImg: 'assets/avatar_leon.jpg',
      quotes: ['Her şeyin kontrolü benim elimde Isabella.', 'Bu otelde hiçbir şey göründüğü gibi değildir.']
    },
    {
      name: 'Serena Black',
      role: 'Sosyetenin Gözdesi',
      avatarImg: 'assets/avatar_serena.jpg',
      quotes: ['Sosyete bu geceyi konuşacak!', 'Bana yardım et, senin tarafında olayım tatlım.']
    }
  ];

  const tasks = [
    { id: 'merge', name: 'Kusursuz Birleşim', desc: 'Masanızdaki objeleri birleştirin', goal: 4, reward: 50, metric: 'merges' },
    { id: 'orders', name: 'Sipariş Teslimatı', desc: 'Müşteri siparişlerini teslim edin', goal: 2, reward: 80, metric: 'ordersCompleted' },
    { id: 'hotel', name: 'Otel Restorasyonu', desc: 'Otelde bir bölümü yenileyin', goal: 1, reward: 100, metric: 'hotelUpgrades' }
  ];

  // Storage helper
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

    const itemCount = Math.random() > 0.65 ? 2 : 1;
    const reqItems = [];

    for (let k = 0; k < itemCount; k++) {
      const type = Math.floor(Math.random() * itemChains.length);
      const level = Math.min(4, 1 + Math.floor(Math.random() * 3));
      reqItems.push({ type, level });
    }

    const totalLvl = reqItems.reduce((acc, item) => acc + item.level, 0);
    const rewardCoins = 80 + totalLvl * 60;
    const rewardStars = totalLvl >= 3 ? 2 : 1;

    return {
      id: id || Date.now() + Math.random(),
      customer: cust.name,
      role: cust.role,
      avatarImg: cust.avatarImg,
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
      gems: 25,
      stars: 2,
      playerLevel: 1,
      xp: 0,
      board,
      selected: null,
      merges: 0,
      ordersCompleted: 0,
      hotelUpgrades: 0,
      area1Progress: 35,
      area2Progress: 20,
      claimedTasks: [],
      storyChoiceMade: null,
      orders: initialOrders,
      notice: 'Hoş geldin! Üstteki karakter siparişlerini tamamla, Yıldızları (⭐) topla ve oteli yenile!'
    };
  }

  function load() {
    try {
      const raw = safeStorage.getItem('velvetSecretsGossipV4');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.board) && s.board.length === 25) {
          state = { ...initialState(), ...s };
          if (window.GameEconomy) {
            state.prestige = window.GameEconomy.getBalance();
            state.stars = window.GameEconomy.getStars();
          }
          return;
        }
      }
    } catch (e) {}
    state = initialState();
    if (window.GameEconomy) {
      state.prestige = window.GameEconomy.getBalance();
      state.stars = window.GameEconomy.getStars();
    }
  }

  // Reactive listener to GameEconomy
  if (window.GameEconomy) {
    window.GameEconomy.subscribe((econ) => {
      if (typeof state !== 'undefined' && state) {
        state.prestige = econ.getBalance();
        state.stars = econ.getStars();
        renderStats();
      }
    });
  }

  function save() {
    try {
      safeStorage.setItem('velvetSecretsGossipV4', JSON.stringify(state));
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
      notify('Enerjin bitti! "+" butonuna basarak reklam izleyebilir veya çarkı çevirebilirsin.');
      return false;
    }
    state.energy -= n;
    if (state.energy < MAX_ENERGY && state.energyUpdated > Date.now()) {
      state.energyUpdated = Date.now();
    }
    return true;
  }

  /* ================= GOSSIP HARBOR ORDER TRAY ================= */
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
        boardCopy[foundIdx] = null;
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
          <div class="req-pill ${it.ready ? 'ready' : ''}" title="${meta.name}">
            <img src="${meta.img}" alt="${meta.name}" class="req-item-img">
            <span class="req-level">LV.${it.level}</span>
            ${it.ready ? '<span class="req-check-badge">✓</span>' : ''}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="order-customer-head">
          <img src="${ord.avatarImg}" alt="${ord.customer}" class="order-photo-avatar">
          <div class="order-customer-meta">
            <span class="order-name-text">${ord.customer}</span>
            <small class="order-role-text">${ord.role || ''}</small>
          </div>
        </div>
        <div class="order-speech-bubble">"${ord.quote}"</div>
        <div class="order-req-items">${itemsHtml}</div>
        <div class="order-rewards-bar">
          <span>💰 +$${ord.rewardCoins}</span>
          <span class="stars-num">⭐ +${ord.rewardStars}</span>
        </div>
        <button class="serve-action-btn ${allReady ? 'can-serve' : ''}" ${!allReady ? 'disabled' : ''}>
          ${allReady ? 'TESLİM ET' : 'HAZIRLA'}
        </button>
      `;

      const serveBtn = card.querySelector('.serve-action-btn');
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
    for (const req of order.items) {
      for (let i = 0; i < state.board.length; i++) {
        if (state.board[i] && state.board[i].type === req.type && state.board[i].level === req.level) {
          state.board[i] = null;
          break;
        }
      }
    }

    if (window.GameEconomy) {
      window.GameEconomy.completeCustomerOrder(orderIdx, order.rewardCoins, order.rewardStars, order.customer);
      state.prestige = window.GameEconomy.getBalance();
      state.stars = window.GameEconomy.getStars();
    } else {
      state.prestige += order.rewardCoins;
      state.stars += order.rewardStars;
    }
    state.ordersCompleted++;

    if (window.hotel3D) {
      window.hotel3D.state.coins = state.prestige;
      window.hotel3D.state.stars = state.stars;
      window.hotel3D.saveState();
      window.hotel3D.checkAffordableNotifications();
      if (window.hotel3D.updateProximityPanel) window.hotel3D.updateProximityPanel();
      if (window.hotel3D.renderHotelAreaCards) window.hotel3D.renderHotelAreaCards();
    }

    sfx.coin();
    if (clientX && clientY) {
      showFloatingText(`⭐ +${order.rewardStars} Yıldız!`, clientX, clientY);
      showFloatingText(`💰 +$${order.rewardCoins}`, clientX, clientY - 30);
    }

    addXP(35);
    state.orders[orderIdx] = generateRandomOrder();

    notify(`Sipariş teslim edildi! ${order.customer} çok memnun kaldı. +$${order.rewardCoins} ve +⭐${order.rewardStars} Yıldız kazandın!`);
    renderAll();
  }

  /* ================= HOTEL RENOVATION (PAGE 2) ================= */
  function renderHotelPage() {
    let canUp = 0;
    if (window.GameEconomy && window.GameEconomy.renovationCosts) {
      const bal = window.GameEconomy.getBalance();
      const st = window.GameEconomy.getStars();
      Object.keys(window.GameEconomy.renovationCosts).forEach((id) => {
        const curLvl = window.GameEconomy.getAreaLevel(id);
        if (curLvl < 4) {
          const nextCost = window.GameEconomy.getNextUpgradeCost(id);
          const nextStars = window.GameEconomy.getNextUpgradeStars(id);
          if (bal >= nextCost && st >= nextStars) canUp++;
        }
      });
    }

    const badge = $('hotelBadgeCount');
    if (badge) {
      badge.textContent = canUp;
      badge.style.display = canUp > 0 ? 'inline-block' : 'none';
    }

    if (window.hotel3D && window.hotel3D.renderHotelAreaCards) {
      window.hotel3D.renderHotelAreaCards();
    }
  }

  function upgradeArea1(clientX, clientY) {
    if (state.area1Progress >= 100) return;

    if (state.stars >= 1) {
      state.stars -= 1;
    } else if (state.prestige >= 300) {
      state.prestige -= 300;
    } else {
      notify('Yeterli Yıldız veya Prestij yok! Siparişleri tamamlayarak toplayabilirsin.');
      return;
    }

    state.area1Progress = Math.min(100, state.area1Progress + 25);
    state.hotelUpgrades++;
    sfx.fanfare();

    if (clientX && clientY) {
      showFloatingText('✨ ALAN YENİLENDİ!', clientX, clientY);
    }
    addXP(50);

    const txt = $('hotelDialogueText');
    if (txt) {
      txt.textContent = `"Isabella: Mermer fıskiye ve palmiyeler pırıl pırıl oldu! Otelimizin meydanı körfezin gözdesi haline geldi."`;
    }

    notify(`Aurelia Meydanı yenilendi! İlerleme: %${state.area1Progress}`);
    renderAll();
  }

  function upgradeArea2(clientX, clientY) {
    if (state.area2Progress >= 100) return;

    if (state.stars >= 2) {
      state.stars -= 2;
    } else if (state.prestige >= 600) {
      state.prestige -= 600;
    } else {
      notify('Yeterli Yıldız veya Prestij yok!');
      return;
    }

    state.area2Progress = Math.min(100, state.area2Progress + 25);
    state.hotelUpgrades++;
    sfx.fanfare();

    if (clientX && clientY) {
      showFloatingText('🌟 SÜİT YENİLENDİ!', clientX, clientY);
    }
    addXP(70);

    const txt = $('hotelDialogueText');
    if (txt) {
      txt.textContent = `"Adrian Vale: Başkanlık Süiti'nin manzarası nefes kesici Isabella... Burada konuşacak çok özel şeylerimiz var."`;
    }

    notify(`Başkanlık Süiti yenilendi! İlerleme: %${state.area2Progress}`);
    renderAll();
  }

  /* ================= STORY INTERACTIVE DECISIONS (PAGE 3) ================= */
  function initStoryChoices() {
    const choiceBtns = document.querySelectorAll('.story-choice-btn');
    const logBox = $('storyDecisionLog');

    choiceBtns.forEach((btn) => {
      btn.onclick = () => {
        const choice = btn.dataset.choice;
        state.storyChoiceMade = choice;
        sfx.fanfare();

        if (choice === 'accept') {
          state.prestige += 150;
          if (logBox) {
            logBox.innerHTML = `<strong>💛 Seçim Yapıldı: Daveti Kabul Ettin!</strong><br>"Adrian gülümsedi: 'Doğru seçimi yaptın Isabella. Bu gece Monako'nun en derin sırlarını öğreneceksin.' (+150 Prestij)"`;
          }
        } else if (choice === 'decline') {
          state.gems += 3;
          if (logBox) {
            logBox.innerHTML = `<strong>💎 Seçim Yapıldı: Mesafeli Kaldın!</strong><br>"Adrian şaşırdı ama saygı duydu: 'Gizemli ve temkinli duruşun seni daha da çekici kılıyor.' (+3 Elmas)"`;
          }
        } else {
          state.stars += 1;
          if (logBox) {
            logBox.innerHTML = `<strong>🔍 Seçim Yapıldı: Otel Arşivini Araştırdın!</strong><br>"Eski bir kasada gizli bir ortaklık sözleşmesi buldun: Leon Marchand ile Adrian geçmişte ortaktı! (+1 Yıldız ⭐)"`;
          }
        }

        addXP(40);
        choiceBtns.forEach((b) => (b.disabled = true));
        notify('Kritik kararın hikâyeyi ve ilişkileri değiştirdi!');
        renderAll();
      };
    });

    if (state.storyChoiceMade) {
      choiceBtns.forEach((b) => (b.disabled = true));
    }
  }

  /* ================= LUCKY WHEEL (PAGE 4) ================= */
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
      { name: '10 Elmas', reward: () => { state.gems += 10; } },
      { name: '1 Yenileme Yıldızı', reward: () => { state.stars += 1; } },
      { name: '50 Enerji', reward: () => { state.energy = Math.min(MAX_ENERGY, state.energy + 50); } },
      { name: 'VIP Sürpriz Obje', reward: () => { spawnItem(); state.prestige += 200; } }
    ];

    function runSpin() {
      if (isSpinning) return;
      isSpinning = true;
      sfx.pop();

      const chosenIndex = Math.floor(Math.random() * segments.length);
      const randomExtraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
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
        notify(`Şans Çarkından ödül: ${prize.name}!`);
        renderAll();
      }, 4200);
    }

    if (spinBtn) spinBtn.onclick = () => runSpin();
    if (spinAdBtn) spinAdBtn.onclick = () => openAdModal(() => runSpin());
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
        claimBtn.textContent = '🎁 Ödülü Al (+50 Enerji & 200 Prestij)';
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
      state.energy += 1;
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
    notify(`Yeni obje masaya eklendi: ${meta.icon} ${meta.name}`);
  }

  function sortBoard() {
    const filled = state.board.filter(Boolean);
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
        ghost.innerHTML = `<img src="${meta.img}" alt="${meta.name}" class="tile-item-img"><span class="lv">LV.${item.level}</span>`;
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
            notify(`${meta.name} (LV.${it.level}) seçildi. Eşleşen bir objeye sürükle veya dokun.`);
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
        b.innerHTML = `<img src="${meta.img}" alt="${meta.name}" class="tile-item-img"><span class="lv">LV.${it.level}</span>`;
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
      const count = t.metric === 'merges' ? state.merges : t.metric === 'ordersCompleted' ? state.ordersCompleted : state.hotelUpgrades;
      const done = count >= t.goal;
      const claimed = state.claimedTasks.includes(t.id);
      const pct = Math.min(100, (count / t.goal) * 100);

      const d = document.createElement('div');
      d.className = 'task-item';
      d.innerHTML = `
        <div class="t-top">
          <span class="t-name">${t.name}</span>
          <span class="t-reward">⚡ +${t.reward}</span>
        </div>
        <div class="t-desc">${t.desc}</div>
        <div class="t-bar"><div style="width:${pct}%"></div></div>
        <div class="t-foot">
          <span>${Math.min(count, t.goal)} / ${t.goal}${claimed ? ' · Alındı' : ''}</span>
          <button class="t-claim-btn" ${!done || claimed ? 'disabled' : ''}>${claimed ? 'ALINDI' : done ? 'ÖDÜLÜ AL' : 'DEVAM ET'}</button>
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
          notify(`Görev ödülü alındı! +${t.reward} Enerji kazandın.`);
          addXP(25);
          renderAll();
        };
      }
      el.appendChild(d);
    });
  }

  function renderStats() {
    tick();
    if (window.GameEconomy) {
      state.prestige = window.GameEconomy.getBalance();
      state.stars = window.GameEconomy.getStars();
    }
    if ($('energy')) $('energy').textContent = state.energy;
    if ($('coins')) $('coins').textContent = `$${state.prestige}`;
    if ($('gems')) $('gems').textContent = state.gems;
    if ($('stars')) $('stars').textContent = state.stars;

    const left = state.energy >= MAX_ENERGY ? 60 : 60 - Math.floor((Date.now() - state.energyUpdated) / 1000) % 60;
    if ($('timer')) $('timer').textContent = '00:' + String(left).padStart(2, '0');

    if ($('levelBadge')) $('levelBadge').textContent = `LV.${state.playerLevel}`;
    const xpNeeded = state.playerLevel * 60;
    const pct = Math.min(100, (state.xp / xpNeeded) * 100);
    if ($('xpBar')) $('xpBar').style.width = `${pct}%`;
  }

  function renderAll() {
    renderStats();
    renderOrders();
    renderBoard();
    renderHotelPage();
    renderTasks();
    save();
  }

  /* ================= GOSSIP HARBOR BOTTOM NAVIGATION ================= */
  function switchMainPage(targetId) {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach((t) => {
      if (t.dataset.target === targetId) t.classList.add('active');
      else t.classList.remove('active');
    });

    document.querySelectorAll('.game-page').forEach((page) => {
      page.classList.remove('active-page');
    });
    const targetPage = $(targetId);
    if (targetPage) targetPage.classList.add('active-page');

    if (targetId === 'pageHotel') {
      if (window.initHotel3D) window.initHotel3D();
      if (window.hotel3D) {
        setTimeout(() => window.hotel3D.onResize(), 50);
        if (window.GameEconomy) {
          window.hotel3D.state.coins = window.GameEconomy.getBalance();
          window.hotel3D.state.stars = window.GameEconomy.getStars();
        }
        window.hotel3D.updateHUD();
        if (window.hotel3D.updateProximityPanel) window.hotel3D.updateProximityPanel();
        if (window.hotel3D.renderHotelAreaCards) window.hotel3D.renderHotelAreaCards();
      }
    }

    sfx.pop();
    renderAll();
  }
  window.switchMainPage = switchMainPage;

  function initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach((tab) => {
      tab.onclick = () => {
        switchMainPage(tab.dataset.target);
      };
    });
  }

  function initUI() {
    const spawnBtn = $('spawnBtn');
    if (spawnBtn) spawnBtn.onclick = () => spawnItem();

    const sortBtn = $('sortBoardBtn');
    if (sortBtn) sortBtn.onclick = () => sortBoard();

    const addEnergyBtn = $('addEnergyBtn');
    if (addEnergyBtn) addEnergyBtn.onclick = () => openAdModal();

    // Click on Prestige wallet pill to view authoritative Financial Ledger
    const coinsBox = document.querySelector('.currency-strip .curr-box:nth-child(2)');
    if (coinsBox) {
      coinsBox.style.cursor = 'pointer';
      coinsBox.title = 'Kasa Defteri ve Finans Raporunu Aç';
      coinsBox.onclick = () => {
        if (window.GameEconomy) window.GameEconomy.openLedgerModal();
      };
    }

    const upgrade1 = $('upgradeArea1Btn');
    if (upgrade1) upgrade1.onclick = (e) => upgradeArea1(e.clientX, e.clientY);

    const upgrade2 = $('upgradeArea2Btn');
    if (upgrade2) upgrade2.onclick = (e) => upgradeArea2(e.clientX, e.clientY);

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
    initNavigation();
    initDragAndDrop();
    initStoryChoices();
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