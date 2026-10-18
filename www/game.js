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

  // 3 Luxury Merge Item Chains (6 levels each) with 18 Unique High-Res Painted Illustrations
  const itemChains = [
    // 0: Kraliyet Gülleri & Parfümeri
    [
      { name: 'Kırmızı Kadife Gül', icon: '🌹', img: 'assets/items/item_0_1.jpg' },
      { name: 'Altın Kurdeleli Çift Gül', icon: '🥀', img: 'assets/items/item_0_2.jpg' },
      { name: 'Kraliyet Gül Buketi', icon: '💐', img: 'assets/items/item_0_3.jpg' },
      { name: 'Safir Kristal Parfüm', icon: '💎', img: 'assets/items/item_0_4.jpg' },
      { name: 'Yakut İksir Şişesi', icon: '✨', img: 'assets/items/item_0_5.jpg' },
      { name: 'Aurelia Altın Gül Şamdanı', icon: '🕯️', img: 'assets/items/item_0_6.jpg' }
    ],
    // 1: Couture & Mücevherat
    [
      { name: 'Siyah & Altın Hediye Kutusu', icon: '🎁', img: 'assets/items/item_1_1.jpg' },
      { name: 'Elmas Stiletto Topuklu', icon: '👠', img: 'assets/items/item_1_2.jpg' },
      { name: 'Zümrüt & İnci Gerdanlık', icon: '📿', img: 'assets/items/item_1_3.jpg' },
      { name: 'Kraliyet Deri Valiz', icon: '🧳', img: 'assets/items/item_1_4.jpg' },
      { name: 'Elmaslı Venedik Balo Maskesi', icon: '🎭', img: 'assets/items/item_1_5.jpg' },
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

  // 4 Main Characters with Real Photo Avatars & Topic-Matched Scene Banners
  const customerPool = [
    {
      name: 'Adrian Vale',
      role: 'Gizemli Milyarder',
      avatarImg: 'assets/avatar_adrian.jpg',
      sceneBg: 'assets/scene_romance_gala.jpg',
      quotes: [
        'Terastaki gizli gala daveti için bu lüks eseri hazırlayabilir misin?',
        'Isabella, bu otelin her köşesi senin dokunuşunla yeniden parlıyor.'
      ]
    },
    {
      name: 'Isabella Laurent',
      role: 'Otel Varisi',
      avatarImg: 'assets/avatar_isabella.jpg',
      sceneBg: 'assets/scene_lobby_reception.jpg',
      quotes: [
        'Büyük Lobi ve kraliyet süitlerimiz için en seçkin objeleri birleştirelim!',
        'Babamın mirası Aurelia Palace yeniden Monako’nun incisi olacak.'
      ]
    },
    {
      name: 'Leon Marchand',
      role: 'Yönetim Kurulu Üyesi',
      avatarImg: 'assets/avatar_leon.jpg',
      sceneBg: 'assets/scene_penthouse_piano.jpg',
      quotes: [
        'Penthouse salonundaki özel koleksiyon için bu parçayı bekliyorum.',
        'Kaliteden ödün vermem Isabella, bana en iyisini getir.'
      ]
    },
    {
      name: 'Serena Black',
      role: 'Sosyetenin Gözdesi',
      avatarImg: 'assets/avatar_serena.jpg',
      sceneBg: 'assets/scene_spa_wellness.jpg',
      quotes: [
        'Termal Spa ve Sonsuzluk Havuzu partisinde herkes bunu konuşacak!',
        'Tatlım, bu siparişi tamamlarsan sosyete senin yanında yer alır.'
      ]
    }
  ];

  // 5 Topic-Matched Photorealistic Quests with Multi-Currency Visual Rewards
  const tasks = [
    {
      id: 'quest_garden_roses',
      name: 'Akdeniz Gül Bahçesi & Parfüm Atölyesi',
      areaTag: '🌹 Botanik Bahçe & Atölye',
      desc: 'Bahçe terasındaki gülleri, parfüm şişelerini ve lüks objeleri masada birleştirerek yeni eserler üretin.',
      bgImg: 'assets/scene_garden_terrace.jpg',
      subjectImg: 'assets/items/item_0_3.jpg',
      baseGoal: 4,
      metric: 'merges',
      rewards: { energy: 60, coins: 250, gems: 2, stars: 0 }
    },
    {
      id: 'quest_vip_orders',
      name: 'Riviera Gala & VIP Konuk Servisi',
      areaTag: '🥂 Riviera Restoran & Bar',
      desc: 'Adrian Vale, Serena Black ve VIP konukların siparişlerini hazırlayıp zamanında teslim edin.',
      bgImg: 'assets/scene_restaurant_bar.jpg',
      subjectImg: 'assets/items/item_2_5.jpg',
      baseGoal: 2,
      metric: 'ordersCompleted',
      rewards: { energy: 45, coins: 400, gems: 0, stars: 1 }
    },
    {
      id: 'quest_hotel_reno',
      name: 'Aurelia Palace 3D Mimari Restorasyonu',
      areaTag: '🏛️ 3D Otel Restorasyonu',
      desc: '3D Otelde herhangi bir alanı (Lobi, Suit 101, Restoran, Havuz, Spa veya Bahçe) bir üst seviyeye yükseltin.',
      bgImg: 'assets/scene_lobby_reception.jpg',
      subjectImg: 'assets/rewards/reward_chest.jpg',
      baseGoal: 1,
      metric: 'hotelUpgrades',
      rewards: { energy: 100, coins: 600, gems: 5, stars: 1 }
    },
    {
      id: 'quest_couture_craft',
      name: 'Penthouse Kraliyet Koleksiyonu Sentezi',
      areaTag: '👑 2. Kat Başkanlık Suiti',
      desc: 'Masada Seviye 3 veya üzeri nadir bir mücevher, buket ya da gurme eseri sentezleyin.',
      bgImg: 'assets/scene_penthouse_piano.jpg',
      subjectImg: 'assets/items/item_1_6.jpg',
      baseGoal: 2,
      metric: 'highLevelMerges',
      rewards: { energy: 75, coins: 450, gems: 6, stars: 1 }
    },
    {
      id: 'quest_spa_serenity',
      name: 'Termal Spa & Kraliyet Sandığı Üretimi',
      areaTag: '♨️ Zen Termal Spa & Havuz',
      desc: 'Kraliyet Üretim Sandığından masaya yeni lüks objeler çıkararak koleksiyonu genişletin.',
      bgImg: 'assets/scene_spa_wellness.jpg',
      subjectImg: 'assets/rewards/reward_spawner.jpg',
      baseGoal: 6,
      metric: 'itemsSpawned',
      rewards: { energy: 80, coins: 300, gems: 3, stars: 0 }
    }
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
    const rewardCoins = 120 + totalLvl * 75;
    const rewardStars = totalLvl >= 3 ? 2 : 1;

    return {
      id: id || Date.now() + Math.random(),
      customer: cust.name,
      role: cust.role,
      avatarImg: cust.avatarImg,
      sceneBg: cust.sceneBg,
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
      highLevelMerges: 1,
      itemsSpawned: 2,
      ordersCompleted: 0,
      hotelUpgrades: 0,
      area1Progress: 35,
      area2Progress: 20,
      claimedTasks: [],
      questStages: {},
      totalQuestsClaimed: 0,
      chestClaims: 0,
      storyChoiceMade: null,
      storyCh3Claimed: false,
      orders: initialOrders,
      notice: 'Hoş geldin! Üstteki karakter siparişlerini ve aşağıdaki foto-gerçekçi görevleri tamamlayarak 3D Oteli yenile!'
    };
  }

  function load() {
    try {
      const raw = safeStorage.getItem('velvetSecretsGossipV4');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.board) && s.board.length === 25) {
          state = { ...initialState(), ...s };
          if (!state.questStages) state.questStages = {};
          if (typeof state.highLevelMerges !== 'number') state.highLevelMerges = 1;
          if (typeof state.itemsSpawned !== 'number') state.itemsSpawned = 2;
          if (typeof state.totalQuestsClaimed !== 'number') state.totalQuestsClaimed = 0;
          if (typeof state.chestClaims !== 'number') state.chestClaims = 0;
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

  function getActualHotelUpgradesCount() {
    let count = state.hotelUpgrades || 0;
    if (window.GameEconomy && window.GameEconomy.state && window.GameEconomy.state.renovations) {
      const renos = window.GameEconomy.state.renovations;
      let econUpgrades = 0;
      Object.keys(renos).forEach((k) => {
        const entry = renos[k];
        if (entry && typeof entry === 'object' && entry.level > 1) {
          econUpgrades += (entry.level - 1);
        } else if (typeof entry === 'string') {
          econUpgrades += 1;
        }
      });
      count = Math.max(count, econUpgrades);
    }
    return count;
  }

  function addCurrencyRewards({ energy = 0, coins = 0, gems = 0, stars = 0 }, sourceLabel = 'Görev Ödülü') {
    if (energy > 0) {
      state.energy = Math.min(MAX_ENERGY + 300, state.energy + energy);
    }
    if (gems > 0) {
      state.gems += gems;
    }
    if (coins > 0 || stars > 0) {
      if (window.GameEconomy) {
        if (coins > 0) {
          window.GameEconomy.addHotelIncome(coins, sourceLabel);
        }
        if (stars > 0) {
          window.GameEconomy.state.stars = (window.GameEconomy.state.stars || 0) + stars;
          window.GameEconomy.save();
          window.GameEconomy.notifyListeners();
        }
        state.prestige = window.GameEconomy.getBalance();
        state.stars = window.GameEconomy.getStars();
      } else {
        state.prestige += coins;
        state.stars += stars;
      }
    }
    if (window.hotel3D) {
      window.hotel3D.state.coins = state.prestige;
      window.hotel3D.state.stars = state.stars;
      window.hotel3D.saveState();
      window.hotel3D.checkAffordableNotifications();
      if (window.hotel3D.updateProximityPanel) window.hotel3D.updateProximityPanel();
      if (window.hotel3D.renderHotelAreaCards) window.hotel3D.renderHotelAreaCards();
    }
  }

  function tick() {
    const now = Date.now();
    const elapsed = Math.max(0, now - (state.energyUpdated || now));
    const gained = Math.floor(elapsed / ENERGY_INTERVAL);
    if (gained > 0 && state.energy < MAX_ENERGY) {
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
      addCurrencyRewards({ energy: 100, coins: 0, gems: 5, stars: 1 }, `Seviye ${state.playerLevel} Ödülü`);
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
      notify('Enerjin bitti! "+" butonuna basarak bonus enerji alabilir veya görev ödüllerini toplayabilirsin.');
      return false;
    }
    state.energy -= n;
    if (state.energy < MAX_ENERGY && state.energyUpdated > Date.now()) {
      state.energyUpdated = Date.now();
    }
    return true;
  }

  /* ================= CUSTOMER ORDER TRAY (WITH PHOTOREALISTIC BANNERS & REWARD ICONS) ================= */
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

    const customerBgMap = {
      'Adrian Vale': 'assets/scene_romance_gala.jpg',
      'Isabella Laurent': 'assets/scene_lobby_reception.jpg',
      'Leon Marchand': 'assets/scene_penthouse_piano.jpg',
      'Serena Black': 'assets/scene_spa_wellness.jpg'
    };

    state.orders.forEach((ord, index) => {
      const { allReady, itemsStatus } = checkOrderFulfillment(ord);
      const bgImg = ord.sceneBg || customerBgMap[ord.customer] || 'assets/scene_lobby_reception.jpg';

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
        <div class="order-customer-head" style="background-image: linear-gradient(90deg, rgba(14,17,27,0.88) 25%, rgba(14,17,27,0.45) 100%), url('${bgImg}');">
          <img src="${ord.avatarImg}" alt="${ord.customer}" class="order-photo-avatar">
          <div class="order-customer-meta">
            <span class="order-name-text">${ord.customer}</span>
            <small class="order-role-text">${ord.role || 'VIP Konuk'}</small>
          </div>
        </div>
        <div class="order-speech-bubble">"${ord.quote}"</div>
        <div class="order-req-items">${itemsHtml}</div>
        <div class="order-rewards-bar">
          <span class="reward-badge-card compact">
            <img src="assets/rewards/reward_prestige.jpg" alt="Prestij">
            <b>+$${ord.rewardCoins}</b>
          </span>
          <span class="reward-badge-card compact star">
            <img src="assets/rewards/reward_star.jpg" alt="Yıldız">
            <b>+${ord.rewardStars} Yıldız</b>
          </span>
        </div>
        <button class="serve-action-btn ${allReady ? 'can-serve' : ''}" ${!allReady ? 'disabled' : ''}>
          ${allReady ? '✦ SİPARİŞİ TESLİM ET' : 'MASADA HAZIRLA'}
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

    notify(`Sipariş teslim edildi! ${order.customer} çok memnun kaldı. +$${order.rewardCoins} ve +${order.rewardStars} Yıldız kazandın!`);
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

  /* ================= STORY INTERACTIVE DECISIONS (PAGE 3) ================= */
  function initStoryChoices() {
    const choiceBtns = document.querySelectorAll('.story-choice-btn');
    const logBox = $('storyDecisionLog');

    choiceBtns.forEach((btn) => {
      btn.onclick = () => {
        if (state.storyChoiceMade) return;
        const choice = btn.dataset.choice;
        state.storyChoiceMade = choice;
        sfx.fanfare();

        if (choice === 'accept') {
          addCurrencyRewards({ energy: 30, coins: 250, gems: 0, stars: 0 }, 'Hikâye Bölüm 2: Adrian Daveti');
          if (logBox) {
            logBox.innerHTML = `<strong>💛 Seçim Yapıldı: Daveti Kabul Ettin!</strong><br>"Adrian gülümsedi: 'Doğru seçimi yaptın Isabella. Bu gece Monako'nun en derin sırlarını öğreneceksin.' (+$250 Prestij &amp; +30 Enerji)"`;
          }
        } else if (choice === 'decline') {
          addCurrencyRewards({ energy: 30, coins: 0, gems: 8, stars: 0 }, 'Hikâye Bölüm 2: Mesafeli Duruş');
          if (logBox) {
            logBox.innerHTML = `<strong>💎 Seçim Yapıldı: Mesafeli Kaldın!</strong><br>"Adrian şaşırdı ama saygı duydu: 'Gizemli ve temkinli duruşun seni daha da güçlü kılıyor.' (+8 Elmas &amp; +30 Enerji)"`;
          }
        } else {
          addCurrencyRewards({ energy: 0, coins: 150, gems: 0, stars: 2 }, 'Hikâye Bölüm 2: Otel Arşivi');
          if (logBox) {
            logBox.innerHTML = `<strong>🔍 Seçim Yapıldı: Otel Arşivini Araştırdın!</strong><br>"Eski bir kasada gizli bir ortaklık sözleşmesi buldun: Leon Marchand ile Adrian geçmişte ortaktı! (+2 Yıldız &amp; +$150 Prestij)"`;
          }
        }

        addXP(40);
        choiceBtns.forEach((b) => (b.disabled = true));
        notify('Kritik kararın hikâyeyi değiştirdi ve ödüllerin kasana eklendi!');
        renderAll();
      };
    });

    if (state.storyChoiceMade) {
      choiceBtns.forEach((b) => (b.disabled = true));
    }

    // Chapter 3 Zen Spa Vault Reward Button
    const ch3Btn = document.querySelector('.story-choice-btn-ch3');
    const ch3Log = $('storyCh3Log');
    if (ch3Btn) {
      if (state.storyCh3Claimed) {
        ch3Btn.disabled = true;
        if (ch3Log) {
          ch3Log.innerHTML = `<strong>🗝️ Gizli Kasa Anahtarı Alındı!</strong><br>Penthouse piyanosunun içindeki altın mühürlü kasa açıldı (+$300 Prestij, +50 Enerji, +1 Yıldız).`;
        }
      }
      ch3Btn.onclick = () => {
        if (state.storyCh3Claimed) return;
        state.storyCh3Claimed = true;
        sfx.fanfare();
        addCurrencyRewards({ energy: 50, coins: 300, gems: 0, stars: 1 }, 'Hikâye Bölüm 3: Zen Spa Gizli Anahtarı');
        addXP(50);
        ch3Btn.disabled = true;
        if (ch3Log) {
          ch3Log.innerHTML = `<strong>🗝️ Gizli Kasa Anahtarı Alındı!</strong><br>Penthouse piyanosunun içindeki altın mühürlü kasa açıldı (+$300 Prestij, +50 Enerji, +1 Yıldız).`;
        }
        notify('Bölüm 3 tamamlandı! +$300 Prestij, +50 Enerji ve +1 Yıldız kazandın!');
        renderAll();
      };
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
      { name: '+100 Enerji', reward: () => addCurrencyRewards({ energy: 100 }, 'Şans Çarkı') },
      { name: '+$500 Prestij', reward: () => addCurrencyRewards({ coins: 500 }, 'Şans Çarkı') },
      { name: '+10 Elmas', reward: () => addCurrencyRewards({ gems: 10 }, 'Şans Çarkı') },
      { name: '+1 Yenileme Yıldızı', reward: () => addCurrencyRewards({ stars: 1 }, 'Şans Çarkı') },
      { name: '+50 Enerji', reward: () => addCurrencyRewards({ energy: 50 }, 'Şans Çarkı') },
      { name: 'VIP Kraliyet Sandığı (+$300 & Obje)', reward: () => { spawnItem(); addCurrencyRewards({ coins: 300, gems: 3 }, 'Şans Çarkı VIP Sandığı'); } }
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
        claimBtn.textContent = '🎁 Ödülü Al (+50 Enerji & +$200 Prestij)';
        sfx.fanfare();
      }
    }, 1000);

    claimBtn.onclick = () => {
      modal.style.display = 'none';
      if (adCallback) {
        adCallback();
      } else {
        addCurrencyRewards({ energy: 50, coins: 200 }, 'VIP Sponsor Ödülü');
        sfx.coin();
        notify('VIP Sponsor ödülü hesabına aktarıldı: +50 Enerji ve +$200 Prestij!');
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
    state.itemsSpawned = (state.itemsSpawned || 0) + 1;
    sfx.pop();

    const spawnBtn = $('spawnBtn');
    if (spawnBtn) {
      const rect = spawnBtn.getBoundingClientRect();
      showFloatingText('🎁 +1 Lüks Obje', rect.left + rect.width / 2, rect.top);
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
      const newLevel = Math.min(6, target.level + 1);
      state.board[toIdx] = { type: target.type, level: newLevel };
      state.board[fromIdx] = null;
      state.selected = null;
      state.merges++;
      if (newLevel >= 3) {
        state.highLevelMerges = (state.highLevelMerges || 0) + 1;
      }

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

  /* ================= PHOTOREALISTIC QUESTS & GRAND CHEST SHOWCASE ================= */
  function getTaskMetricValue(metric) {
    if (metric === 'merges') return state.merges || 0;
    if (metric === 'ordersCompleted') return state.ordersCompleted || 0;
    if (metric === 'hotelUpgrades') return getActualHotelUpgradesCount();
    if (metric === 'highLevelMerges') return state.highLevelMerges || 0;
    if (metric === 'itemsSpawned') return state.itemsSpawned || 0;
    return 0;
  }

  function renderTasks() {
    const el = $('tasks');
    if (!el) return;
    el.innerHTML = '';

    // 1. Render Grand Royal Quest Chest Showcase (#questChestHeader)
    const chestEl = $('questChestHeader');
    if (chestEl) {
      const chestGoal = 3;
      const totalClaimed = state.totalQuestsClaimed || 0;
      const chestClaims = state.chestClaims || 0;
      const progressInCycle = Math.min(chestGoal, Math.max(0, totalClaimed - chestClaims * chestGoal));
      const chestReady = progressInCycle >= chestGoal;
      const chestPct = Math.round((progressInCycle / chestGoal) * 100);

      chestEl.innerHTML = `
        <div class="grand-chest-banner" style="background-image: linear-gradient(90deg, rgba(12,15,24,0.92) 25%, rgba(12,15,24,0.68) 100%), url('assets/scene_hotel_exterior.jpg');">
          <div class="grand-chest-left">
            <div class="grand-chest-img-wrap ${chestReady ? 'pulse-glow' : ''}">
              <img src="assets/rewards/reward_chest.jpg" alt="Kraliyet Sandığı" class="grand-chest-img">
              <span class="chest-lv-tag">SEVİYE ${chestClaims + 1}</span>
            </div>
            <div class="grand-chest-info">
              <span class="chest-eyebrow">✦ BÜYÜK KRALİYET HAZİNE SANDIĞI</span>
              <h5>3 Görev Tamamla, Büyük Sandığı Aç! (${progressInCycle}/${chestGoal})</h5>
              <div class="chest-progress-bar"><div style="width:${chestPct}%"></div></div>
              <div class="reward-pill-list">
                <span class="reward-badge-card"><img src="assets/rewards/reward_prestige.jpg" alt="Prestij"> +$750</span>
                <span class="reward-badge-card"><img src="assets/rewards/reward_energy.jpg" alt="Enerji"> +120 Enerji</span>
                <span class="reward-badge-card"><img src="assets/rewards/reward_gems.jpg" alt="Elmas"> +10 Elmas</span>
                <span class="reward-badge-card"><img src="assets/rewards/reward_star.jpg" alt="Yıldız"> +2 Yıldız</span>
              </div>
            </div>
          </div>
          <button id="claimGrandChestBtn" class="grand-chest-btn ${chestReady ? 'ready' : ''}" ${!chestReady ? 'disabled' : ''}>
            ${chestReady ? '🎁 SANDIĞI AÇ' : `${progressInCycle}/${chestGoal} GÖREV`}
          </button>
        </div>
      `;

      const chestBtn = $('claimGrandChestBtn');
      if (chestBtn && chestReady) {
        chestBtn.onclick = (e) => {
          e.preventDefault();
          state.chestClaims = (state.chestClaims || 0) + 1;
          sfx.fanfare();
          addCurrencyRewards({ energy: 120, coins: 750, gems: 10, stars: 2 }, 'Büyük Kraliyet Görev Sandığı');
          addXP(80, e.clientX, e.clientY);
          notify('🎉 BÜYÜK KRALİYET SANDIĞI AÇILDI! +$750 Prestij, +120 Enerji, +10 Elmas ve +2 Yıldız kazandın!');
          renderAll();
        };
      }
    }

    // 2. Render 5 Topic-Matched Photorealistic Quest Cards
    tasks.forEach((t) => {
      const stage = (state.questStages && state.questStages[t.id]) ? state.questStages[t.id] : 1;
      const cumulativeGoal = t.baseGoal * stage;
      const rawCount = getTaskMetricValue(t.metric);
      const done = rawCount >= cumulativeGoal;
      const pct = Math.min(100, Math.round((rawCount / cumulativeGoal) * 100));

      // Scale rewards with stage
      const scale = 1 + (stage - 1) * 0.35;
      const rEnergy = Math.round((t.rewards.energy || 0) * scale);
      const rCoins = Math.round((t.rewards.coins || 0) * scale);
      const rGems = Math.round((t.rewards.gems || 0) * scale);
      const rStars = t.rewards.stars || 0;

      let rewardBadgesHtml = '';
      if (rCoins > 0) {
        rewardBadgesHtml += `
          <span class="reward-badge-card">
            <img src="assets/rewards/reward_prestige.jpg" alt="Prestij">
            <b>+$${rCoins}</b>
          </span>`;
      }
      if (rEnergy > 0) {
        rewardBadgesHtml += `
          <span class="reward-badge-card">
            <img src="assets/rewards/reward_energy.jpg" alt="Enerji">
            <b>+${rEnergy} Enerji</b>
          </span>`;
      }
      if (rGems > 0) {
        rewardBadgesHtml += `
          <span class="reward-badge-card">
            <img src="assets/rewards/reward_gems.jpg" alt="Elmas">
            <b>+${rGems} Elmas</b>
          </span>`;
      }
      if (rStars > 0) {
        rewardBadgesHtml += `
          <span class="reward-badge-card star">
            <img src="assets/rewards/reward_star.jpg" alt="Yıldız">
            <b>+${rStars} Yıldız</b>
          </span>`;
      }

      const d = document.createElement('div');
      d.className = `task-item photoreal-quest-card ${done ? 'quest-ready' : ''}`;
      d.innerHTML = `
        <div class="quest-banner-top" style="background-image: linear-gradient(90deg, rgba(11,14,22,0.92) 22%, rgba(11,14,22,0.35) 100%), url('${t.bgImg}');">
          <img src="${t.subjectImg}" alt="${t.name}" class="quest-subject-thumb">
          <div class="quest-banner-titles">
            <div class="quest-tags-row">
              <span class="quest-area-pill">${t.areaTag}</span>
              <span class="quest-stage-pill">AŞAMA ${stage}</span>
            </div>
            <h5 class="t-name">${t.name}</h5>
          </div>
        </div>

        <div class="quest-card-body">
          <p class="t-desc">${t.desc}</p>

          <div class="quest-rewards-box">
            <span class="quest-rewards-label">KAZANIMLAR:</span>
            <div class="reward-pill-list">
              ${rewardBadgesHtml}
            </div>
          </div>

          <div class="t-bar"><div style="width:${pct}%"></div></div>

          <div class="t-foot">
            <span class="quest-prog-text">İlerleme: <b>${Math.min(rawCount, cumulativeGoal)} / ${cumulativeGoal}</b> (%${pct})</span>
            <button class="t-claim-btn ${done ? 'ready-pulse' : ''}" ${!done ? 'disabled' : ''}>
              ${done ? '🎁 KAZANIMLARI TOPLA' : 'DEVAM EDİYOR'}
            </button>
          </div>
        </div>
      `;

      const claimBtn = d.querySelector('.t-claim-btn');
      if (claimBtn && done) {
        claimBtn.onclick = (e) => {
          e.preventDefault();
          if (!state.questStages) state.questStages = {};
          state.questStages[t.id] = stage + 1;
          state.totalQuestsClaimed = (state.totalQuestsClaimed || 0) + 1;

          addCurrencyRewards(
            { energy: rEnergy, coins: rCoins, gems: rGems, stars: rStars },
            `Görev Tamamlandı: ${t.name} (Aşama ${stage})`
          );
          sfx.fanfare();
          if (e.clientX && e.clientY) {
            showFloatingText(`🎁 +$${rCoins} & +${rEnergy}⚡`, e.clientX, e.clientY);
          }
          addXP(40, e.clientX, e.clientY);
          notify(`🎉 "${t.name}" (Aşama ${stage}) ödülleri toplandı! +$${rCoins}, +${rEnergy} Enerji${rGems ? `, +${rGems} Elmas` : ''}${rStars ? `, +${rStars} Yıldız` : ''}!`);
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
    if ($('timer')) {
      $('timer').textContent = state.energy >= MAX_ENERGY ? 'MAKS 500' : ('00:' + String(left).padStart(2, '0'));
    }

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

  /* ================= BOTTOM NAVIGATION ================= */
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