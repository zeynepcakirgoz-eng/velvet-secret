(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_ENERGY = 500;
  const ENERGY_INTERVAL = 60000;
  const MAX_ITEM_LEVEL = 5;
  const ACTIVE_ORDER_CAPACITY = 5;
  const ORDER_SET_TARGET = 5;
  const DAILY_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 saatte 1 ücretsiz hak
  const MAX_SPAWNER_CHARGES = 15;
  const SPAWNER_COOLDOWN_MS = 90 * 1000; // 90 sn üretim sandığı yenilenme süresi

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
    reject() {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        [210, 155].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.16, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + idx * 0.09 + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.12);
        });
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

  // 4 Core Merge Item Chains (matching Reference Props Sheet: Rose, Box & Crown, 'M' Hotel Key, Ornate Chalice) + 1 Seasonal Live-Ops Chain
  const itemChainNames = [
    '🌹 Kraliyet Gülleri (Gül Seti)',
    '👑 Mücevher Kutusu & Kraliyet Tacı',
    '🔑 Otel Odası Anahtarı & VIP Kutu',
    '🍷 İşlemeli Kraliyet Kadehi Seti',
    '🎃 Özel Etkinlik Koleksiyonu'
  ];

  const itemChains = [
    // 0: Kraliyet Gülleri (Gül Goncası -> Tek Kadife Gül -> Kraliyet Gül Buketi -> Kristal Kutuda Gül -> Kraliyet Gül & Taç Çelengi)
    [
      { name: 'Gül Goncası', icon: '🌱', img: 'assets/items/item_0_1.png' },
      { name: 'Tek Kadife Gül', icon: '🌹', img: 'assets/items/item_0_2.png' },
      { name: 'Kraliyet Gül Buketi', icon: '💐', img: 'assets/items/item_0_3.png' },
      { name: 'Kristal Kutuda Gül Aranjmanı', icon: '🥀', img: 'assets/items/item_0_4.png' },
      { name: 'Aurelia Kraliyet Gül & Taç Çelengi', icon: '🌺', img: 'assets/items/item_0_5.png' }
    ],
    // 1: Mücevher Kutusu & Kraliyet Tacı (Kristal Mücevher Kutusu -> Güllü Kadife Kutu -> Prenses Diademi -> Kraliyet Tacı -> Hazine Tacı & Kutu Seti)
    [
      { name: 'Kristal Kadife Mücevher Kutusu', icon: '💎', img: 'assets/items/item_1_1.png' },
      { name: 'Güllü Kadife Mücevher Kutusu', icon: '💍', img: 'assets/items/item_1_2.png' },
      { name: 'Gümüş İşlemeli Prenses Diademi', icon: '⚜️', img: 'assets/items/item_1_3.png' },
      { name: 'Monako Kraliyet Tacı', icon: '👑', img: 'assets/items/item_1_4.png' },
      { name: 'İmparatorluk Hazine Tacı & Kutu Seti', icon: '👑', img: 'assets/items/item_1_5.png' }
    ],
    // 2: Otel Odası Anahtarı & VIP Kutu (Klasik 'M' Anahtar -> Püsküllü 'M' Anahtar -> Çift VIP Anahtar -> Kutuda VIP Anahtar -> Taçlı Kral Dairesi Anahtarı)
    [
      { name: 'Klasik Otel Odası Anahtarı (M)', icon: '🗝️', img: 'assets/items/item_2_1.png' },
      { name: 'Altın Püsküllü Otel Anahtarı (M)', icon: '🔑', img: 'assets/items/item_2_2.png' },
      { name: 'Çift VIP Süit Anahtar Seti', icon: '🔐', img: 'assets/items/item_2_3.png' },
      { name: 'Kristal Kutuda VIP Süit Anahtarı', icon: '🎁', img: 'assets/items/item_2_4.png' },
      { name: 'Kral Dairesi Taçlı Anahtar & Kutu Seti', icon: '👑', img: 'assets/items/item_2_5.png' }
    ],
    // 3: İşlemeli Kraliyet Kadehi Seti (Zarif Kristal Kadeh -> Altın İşlemeli Kadeh -> İkili Kraliyet Kadehi -> Kadeh & Gül Seti -> İmparatorluk Kadeh & Taç Seti)
    [
      { name: 'Zarif Kristal Kadeh', icon: '🍷', img: 'assets/items/item_3_1.png' },
      { name: 'Altın İşlemeli Kraliyet Kadehi', icon: '🍷', img: 'assets/items/item_3_2.png' },
      { name: 'İkili Kraliyet Kadeh Seti', icon: '🥂', img: 'assets/items/item_3_3.png' },
      { name: 'Kraliyet Kadehi & Kadife Gül Seti', icon: '🍾', img: 'assets/items/item_3_4.png' },
      { name: 'Aurelia İmparatorluk Kadeh & Taç Seti', icon: '🏆', img: 'assets/items/item_3_5.png' }
    ],
    // 4: Canlı Etkinlik / Mevsimsel Özel Koleksiyon (Cadılar Bayramı, Sevgililer Günü, Kış Galası)
    [
      { name: 'Mistik Balkabağı Tohumu', icon: '🎃', img: 'assets/items/item_0_1.png' },
      { name: 'Altın İşlemeli Balkabağı', icon: '🎃', img: 'assets/items/item_0_2.png' },
      { name: 'Gotik Kristal Fener', icon: '🏮', img: 'assets/items/item_0_3.png' },
      { name: 'Cadı İksiri & Kazan Seti', icon: '🧪', img: 'assets/items/item_0_4.png' },
      { name: 'Aurelia Kraliyet Balkabağı Tacı', icon: '👑', img: 'assets/items/item_0_5.png' }
    ]
  ];

  function getActiveChainCount() {
    if (window.ThemeManager && window.ThemeManager.getActiveTheme().id !== 'default') {
      return 5;
    }
    return 4;
  }

  function getItemMeta(type, level) {
    const t = Math.abs(type || 0) % itemChains.length;
    const clampedLevel = Math.max(1, Math.min(MAX_ITEM_LEVEL, level || 1));
    const lvlIdx = clampedLevel - 1;
    let item = itemChains[t][lvlIdx];
    let chainTitle = itemChainNames[t];
    let themeKey = 'default';

    if (window.ThemeManager) {
      const activeTheme = window.ThemeManager.getActiveTheme();
      themeKey = activeTheme.id;
      if (t === 4 && activeTheme.eventChain && activeTheme.eventChain[lvlIdx]) {
        item = {
          name: activeTheme.eventChain[lvlIdx].name,
          icon: activeTheme.eventChain[lvlIdx].icon,
          img: item.img
        };
        chainTitle = activeTheme.eventChainName || itemChainNames[4];
      }
    }

    const imgUrl = (window.LuxuryArt && window.LuxuryArt.getItemImage)
      ? window.LuxuryArt.getItemImage(t, clampedLevel, themeKey)
      : item.img;
    return {
      ...item,
      img: imgUrl,
      type: t,
      level: clampedLevel,
      isMax: clampedLevel >= MAX_ITEM_LEVEL,
      chainName: chainTitle
    };
  }

  // 6 VIP Characters for 5 Simultaneous Customer Orders
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
    },
    {
      name: 'Kontes Viktoria',
      role: 'Monako Kraliyet Vakfı',
      avatarImg: 'assets/avatar_serena.jpg',
      sceneBg: 'assets/scene_garden_terrace.jpg',
      quotes: [
        'Kraliyet Botanik Bahçesi müzayedesi için en nadide parçaları talep ediyorum.',
        'Aurelia Palace’ın zarafeti bu özel seçimlerle taçlanacak.'
      ]
    },
    {
      name: 'Kaptan Matteo',
      role: 'Süperyat Filosu Sahibi',
      avatarImg: 'assets/avatar_adrian.jpg',
      sceneBg: 'assets/scene_restaurant_pool.jpg',
      quotes: [
        'Riviera limanındaki VIP yat resepsiyonu için bu siparişi acilen bekliyorum.',
        'Denizden gelen konuklarımız yalnızca en yüksek kaliteyi kabul eder!'
      ]
    }
  ];

  // 5 Topic-Matched Photorealistic Quests with Multi-Currency Visual Rewards
  const tasks = [
    {
      id: 'quest_garden_roses',
      name: 'Akdeniz Gül Bahçesi & Çiçek Atölyesi',
      areaTag: '🌹 Botanik Bahçe & Atölye',
      desc: 'Bahçe terasındaki gül goncalarını, buketleri ve lüks objeleri masada birleştirerek yeni eserler üretin.',
      bgImg: 'assets/scene_garden_terrace.jpg',
      subjectImg: 'assets/items/item_0_3.jpg',
      baseGoal: 4,
      metric: 'merges',
      rewards: { energy: 60, coins: 250, gems: 2, stars: 0 }
    },
    {
      id: 'quest_vip_orders',
      name: 'Riviera Gala & 5 VIP Konuk Servisi',
      areaTag: '🥂 Riviera Restoran & Bar',
      desc: 'Sipariş panosundaki 5 VIP konuğun siparişlerini hazırlayıp zamanında teslim edin.',
      bgImg: 'assets/scene_restaurant_pool.jpg',
      subjectImg: 'assets/items/item_2_5.jpg',
      baseGoal: 2,
      metric: 'ordersCompleted',
      rewards: { energy: 45, coins: 400, gems: 2, stars: 1 }
    },
    {
      id: 'quest_hotel_reno',
      name: 'Aurelia Palace 3D Mimari Restorasyonu',
      areaTag: '🏛️ 3D Otel Restorasyonu',
      desc: '3D Otelde serbestçe dolaşarak herhangi bir alanı 3 farklı tasarım seçeneğinden biriyle restore edin.',
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
      desc: 'Masada Seviye 3 veya üzeri nadir bir mücevher, gül buketi, pasta ya da şampanya seti sentezleyin.',
      bgImg: 'assets/scene_penthouse_piano.jpg',
      subjectImg: 'assets/items/item_1_5.jpg',
      baseGoal: 2,
      metric: 'highLevelMerges',
      rewards: { energy: 75, coins: 450, gems: 6, stars: 1 }
    },
    {
      id: 'quest_spa_serenity',
      name: 'Termal Spa & Kraliyet Sandığı Üretimi',
      areaTag: '♨️ Zen Termal Spa & Havuz',
      desc: 'Kraliyet Üretim Sandığından veya Obje Mağazasından masaya yeni lüks objeler çıkararak koleksiyonu genişletin.',
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

  // Dynamic Difficulty Order Generator (scales with playerLevel and keeps 5 distinct customers)
  function getOrderDifficultySpec(playerLevel) {
    const lvl = Math.max(1, playerLevel || 1);
    if (lvl === 1) {
      return { minLv: 1, maxLv: 2, maxItems: 2, label: 'Kademe 1 · Başlangıç' };
    }
    if (lvl === 2) {
      return { minLv: 1, maxLv: 3, maxItems: 2, label: 'Kademe 2 · Orta' };
    }
    if (lvl === 3) {
      return { minLv: 2, maxLv: 4, maxItems: 2, label: 'Kademe 3 · İleri' };
    }
    if (lvl === 4) {
      return { minLv: 2, maxLv: 5, maxItems: 2, label: 'Kademe 4 · Uzman' };
    }
    return { minLv: 3, maxLv: 5, maxItems: 3, label: `Kademe ${lvl} · Kraliyet Ustası` };
  }

  function generateRandomOrder(id, excludeCustomers = [], playerLevelOverride = null) {
    const pLevel = playerLevelOverride || (state ? state.playerLevel : 1) || 1;
    const diff = getOrderDifficultySpec(pLevel);

    const availableCustomers = customerPool.filter((c) => !excludeCustomers.includes(c.name));
    const pool = availableCustomers.length > 0 ? availableCustomers : customerPool;
    const cust = pool[Math.floor(Math.random() * pool.length)];
    const quote = cust.quotes[Math.floor(Math.random() * cust.quotes.length)];

    let itemCount = 1;
    if (diff.maxItems >= 3 && Math.random() > 0.65) {
      itemCount = 3;
    } else if (Math.random() > 0.42) {
      itemCount = 2;
    }

    const reqItems = [];
    const chainLimit = getActiveChainCount();
    for (let k = 0; k < itemCount; k++) {
      const type = Math.floor(Math.random() * chainLimit);
      // First item can scale up to diff.maxLv; additional items slightly lower so orders remain balanced
      const capLv = k === 0 ? diff.maxLv : Math.max(diff.minLv, diff.maxLv - 1);
      const level = Math.min(
        MAX_ITEM_LEVEL,
        diff.minLv + Math.floor(Math.random() * (capLv - diff.minLv + 1))
      );
      reqItems.push({ type, level });
    }

    // Exponential reward scaling for higher-level items
    const totalValue = reqItems.reduce((acc, item) => acc + Math.pow(2, item.level - 1) * 65, 0);
    const rewardCoins = Math.round(90 + totalValue + pLevel * 20);
    const maxItemLv = Math.max(...reqItems.map((i) => i.level));
    const rewardStars = maxItemLv >= 4 ? 3 : (maxItemLv >= 3 || reqItems.length >= 2 ? 2 : 1);
    const rewardGems = maxItemLv >= 4 ? 2 : (maxItemLv === 3 && Math.random() > 0.5 ? 1 : 0);

    return {
      id: id || Date.now() + Math.random(),
      customer: cust.name,
      role: cust.role,
      avatarImg: cust.avatarImg,
      sceneBg: cust.sceneBg,
      quote,
      items: reqItems,
      rewardCoins,
      rewardStars,
      rewardGems,
      difficultyLabel: diff.label
    };
  }

  function ensureFiveOrders() {
    if (!state) return;
    if (!Array.isArray(state.orders)) state.orders = [];

    // Sanitize existing orders to valid chain types & levels (1..5)
    state.orders.forEach((ord) => {
      if (ord && Array.isArray(ord.items)) {
        ord.items.forEach((it) => {
          it.type = Math.abs(it.type || 0) % itemChains.length;
          it.level = Math.max(1, Math.min(MAX_ITEM_LEVEL, it.level || 1));
        });
      }
    });

    while (state.orders.length < ACTIVE_ORDER_CAPACITY) {
      const usedNames = state.orders.map((o) => o.customer);
      state.orders.push(generateRandomOrder(Date.now() + state.orders.length, usedNames, state.playerLevel));
    }
    if (state.orders.length > ACTIVE_ORDER_CAPACITY) {
      state.orders = state.orders.slice(0, ACTIVE_ORDER_CAPACITY);
    }
  }

  function initialState() {
    const board = Array.from({ length: 25 }, (_, i) => {
      if (i % 4 === 0 || i % 6 === 0) {
        return { type: i % itemChains.length, level: 1 };
      }
      return null;
    });

    const initialOrders = [];
    for (let i = 0; i < ACTIVE_ORDER_CAPACITY; i++) {
      const used = initialOrders.map((o) => o.customer);
      initialOrders.push(generateRandomOrder(i + 1, used, 1));
    }

    return {
      energy: 500,
      energyUpdated: Date.now(),
      prestige: 1200,
      gems: 35,
      stars: 2,
      playerLevel: 1,
      xp: 0,
      board,
      selected: null,
      merges: 0,
      highLevelMerges: 1,
      itemsSpawned: 2,
      ordersCompleted: 0,
      orderSetProgress: 0,
      orderSetsCompleted: 0,
      rewardQueue: [],
      spawnerCharges: MAX_SPAWNER_CHARGES,
      spawnerCooldownUntil: 0,
      lastFreeSpinTime: 0,
      lastAdSpinTime: 0,
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
      notice: 'Hoş geldin! 5 VIP müşterinin siparişlerini tamamla, 5/5 sette özel Nadir Obje & 3D Hazine Sandığı kazan!'
    };
  }

  function load() {
    try {
      const raw = safeStorage.getItem('velvetSecretsGossipV4');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.board) && s.board.length === 25) {
          state = { ...initialState(), ...s };
          // Clamp all board items to MAX_ITEM_LEVEL (5) and 4 chains
          state.board = state.board.map((it) => {
            if (!it) return null;
            return {
              type: Math.abs(it.type || 0) % itemChains.length,
              level: Math.max(1, Math.min(MAX_ITEM_LEVEL, it.level || 1))
            };
          });
          if (!state.questStages) state.questStages = {};
          if (typeof state.highLevelMerges !== 'number') state.highLevelMerges = 1;
          if (typeof state.itemsSpawned !== 'number') state.itemsSpawned = 2;
          if (typeof state.totalQuestsClaimed !== 'number') state.totalQuestsClaimed = 0;
          if (typeof state.chestClaims !== 'number') state.chestClaims = 0;
          if (typeof state.orderSetProgress !== 'number') state.orderSetProgress = (state.ordersCompleted || 0) % ORDER_SET_TARGET;
          if (typeof state.orderSetsCompleted !== 'number') state.orderSetsCompleted = Math.floor((state.ordersCompleted || 0) / ORDER_SET_TARGET);
          if (!Array.isArray(state.rewardQueue)) state.rewardQueue = [];
          if (typeof state.spawnerCharges !== 'number') state.spawnerCharges = MAX_SPAWNER_CHARGES;
          if (typeof state.spawnerCooldownUntil !== 'number') state.spawnerCooldownUntil = 0;
          if (typeof state.lastFreeSpinTime !== 'number') state.lastFreeSpinTime = 0;
          if (typeof state.lastAdSpinTime !== 'number') state.lastAdSpinTime = 0;
          ensureFiveOrders();
          if (window.GameEconomy) {
            state.prestige = window.GameEconomy.getBalance();
            state.stars = window.GameEconomy.getStars();
          }
          return;
        }
      }
    } catch (e) {}
    state = initialState();
    ensureFiveOrders();
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
      const econUpgrades = Object.keys(renos).filter((k) => Boolean(renos[k])).length;
      count = Math.max(count, econUpgrades);
    }
    if (window.hotel3D && window.hotel3D.state && window.hotel3D.state.renovations) {
      const hRenos = window.hotel3D.state.renovations;
      const hCount = Object.keys(hRenos).filter((k) => Boolean(hRenos[k])).length;
      count = Math.max(count, hCount);
    }
    return count;
  }

  function addCurrencyRewards({ energy = 0, coins = 0, gems = 0, stars = 0 }, sourceLabel = 'Görev Ödülü') {
    if (energy > 0) {
      state.energy = Math.min(MAX_ENERGY + 500, state.energy + energy);
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

  function spendCoins(amount, reasonLabel = 'Mağaza Satın Alımı') {
    const currentBal = window.GameEconomy ? window.GameEconomy.getBalance() : state.prestige;
    if (currentBal < amount) {
      notify(`⚠️ Yetersiz Prestij ($)! Bu işlem için $${amount} gerekiyor.`);
      sfx.reject();
      return false;
    }
    if (window.GameEconomy) {
      window.GameEconomy.state.balance = Math.max(0, window.GameEconomy.state.balance - amount);
      window.GameEconomy.state.totalSpent = (window.GameEconomy.state.totalSpent || 0) + amount;
      window.GameEconomy.recordTransaction('SHOP', -amount, reasonLabel);
      window.GameEconomy.save();
      window.GameEconomy.notifyListeners();
      state.prestige = window.GameEconomy.getBalance();
    } else {
      state.prestige -= amount;
    }
    if (window.hotel3D) {
      window.hotel3D.state.coins = state.prestige;
      window.hotel3D.saveState();
    }
    return true;
  }

  function spendGems(amount, reasonLabel = 'Elmas Harcaması') {
    if ((state.gems || 0) < amount) {
      notify(`⚠️ Yetersiz Elmas (💎)! Bu işlem için ${amount} 💎 gerekiyor. Yüksek seviye birleştirmelerden veya görevlerden Elmas kazanabilirsin.`);
      sfx.reject();
      return false;
    }
    state.gems -= amount;
    save();
    renderStats();
    return true;
  }

  // Place a reward or purchased object onto the board (or queue it if full)
  function giveItemToPlayer(type, level, sourceText = 'Özel Ödül') {
    const cleanType = Math.abs(type || 0) % itemChains.length;
    const cleanLevel = Math.max(1, Math.min(MAX_ITEM_LEVEL, level || 1));
    const meta = getItemMeta(cleanType, cleanLevel);

    const emptySlots = [];
    state.board.forEach((it, idx) => {
      if (!it) emptySlots.push(idx);
    });

    if (emptySlots.length > 0) {
      const targetIdx = emptySlots[Math.floor(Math.random() * emptySlots.length)];
      state.board[targetIdx] = { type: cleanType, level: cleanLevel };
      save();
      renderBoard();
      renderOrders();
      return { placed: true, slot: targetIdx, meta };
    } else {
      if (!Array.isArray(state.rewardQueue)) state.rewardQueue = [];
      state.rewardQueue.push({ type: cleanType, level: cleanLevel, sourceText });
      save();
      renderRewardQueueBanner();
      return { placed: false, queued: true, meta };
    }
  }

  function claimQueuedRewardItem() {
    if (!Array.isArray(state.rewardQueue) || state.rewardQueue.length === 0) return;
    const emptyIdx = state.board.findIndex((x) => !x);
    if (emptyIdx === -1) {
      sfx.reject();
      notify('⚠️ Masada boş yer yok! Ödül objeyi yerleştirmek için iki aynı objeyi birleştirin.');
      return;
    }
    const nextItem = state.rewardQueue.shift();
    state.board[emptyIdx] = { type: nextItem.type, level: nextItem.level };
    const meta = getItemMeta(nextItem.type, nextItem.level);
    sfx.fanfare();
    notify(`🎁 Bekleyen ödül masaya yerleştirildi: ${meta.icon} ${meta.name} (LV.${meta.level})!`);
    renderAll();
  }

  function renderRewardQueueBanner() {
    const banner = $('rewardQueueBanner');
    if (!banner) return;
    if (!Array.isArray(state.rewardQueue) || state.rewardQueue.length === 0) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }
    const first = state.rewardQueue[0];
    const meta = getItemMeta(first.type, first.level);
    banner.style.display = 'flex';
    banner.innerHTML = `
      <div class="rq-left">
        <img src="${meta.img}" alt="${meta.name}" class="rq-thumb">
        <div>
          <strong>🎁 Bekleyen Ödül Objesi (${state.rewardQueue.length} Adet)</strong>
          <small>${meta.icon} ${meta.name} (LV.${meta.level}) masaya yerleştirilmeyi bekliyor</small>
        </div>
      </div>
      <button id="claimQueueBtn" class="rq-claim-btn">MASAYA KOY</button>
    `;
    const btn = $('claimQueueBtn');
    if (btn) btn.onclick = () => claimQueuedRewardItem();
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

    // Check Spawner Cooldown recovery
    if (state.spawnerCooldownUntil && now >= state.spawnerCooldownUntil) {
      state.spawnerCooldownUntil = 0;
      state.spawnerCharges = MAX_SPAWNER_CHARGES;
      renderSpawnerControls();
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
    el.style.left = `${Math.max(40, Math.min(window.innerWidth - 120, x || window.innerWidth / 2))}px`;
    el.style.top = `${Math.max(50, Math.min(window.innerHeight - 80, y || window.innerHeight / 2))}px`;
    layer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 950);
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
      addCurrencyRewards({ energy: 100, coins: 200, gems: 5, stars: 1 }, `Seviye ${state.playerLevel} Ödülü`);
      sfx.fanfare();
      triggerLevelUpModal();
    }
  }

  function triggerLevelUpModal() {
    const diff = getOrderDifficultySpec(state.playerLevel);
    if (window.RewardChest3D && typeof window.RewardChest3D.open === 'function') {
      window.RewardChest3D.open({
        title: `SEVİYE ${state.playerLevel} KRALİYET SANDIĞI!`,
        subtitle: `Tebrikler! Sipariş zorluk kademesi yükseldi (${diff.label}) ve yeni ödüllerin açıldı!`,
        rewards: [
          { icon: '⚡', label: '+100 Enerji', img: 'assets/rewards/reward_energy.jpg', color: '#38bdf8' },
          { icon: '💰', label: '+$200 Prestij', img: 'assets/rewards/reward_prestige.jpg', color: '#fbbf24' },
          { icon: '💎', label: '+5 Elmas', img: 'assets/rewards/reward_gems.jpg', color: '#ec4899' },
          { icon: '⭐', label: '+1 Yıldız', img: 'assets/rewards/reward_star.jpg', color: '#f59e0b' }
        ]
      });
      return;
    }
    const modal = $('levelUpModal');
    const sub = $('levelUpSubtitle');
    if (modal && sub) {
      sub.textContent = `Seviye ${state.playerLevel}'e Ulaştın! (${diff.label})`;
      modal.style.display = 'flex';
    }
  }

  function spend(n) {
    tick();
    if (state.energy < n) {
      notify('Enerjin bitti! "+" butonuna basarak veya Obje Mağazasından Elmas ile enerji doldurabilirsin.');
      return false;
    }
    state.energy -= n;
    if (state.energy < MAX_ENERGY && state.energyUpdated > Date.now()) {
      state.energyUpdated = Date.now();
    }
    return true;
  }

  /* ================= 5-CUSTOMER ORDER SYSTEM, SET COMPLETION CHEST & DYNAMIC DIFFICULTY ================= */
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

  function renderOrderSetBanner() {
    const setEl = $('orderSetBanner');
    if (!setEl) return;

    const prog = Math.min(ORDER_SET_TARGET, Math.max(0, state.orderSetProgress || 0));
    const pct = Math.round((prog / ORDER_SET_TARGET) * 100);
    const diff = getOrderDifficultySpec(state.playerLevel);

    // Preview of the next rare object reward for completing the 5/5 set
    const nextRareType = (state.orderSetsCompleted || 0) % itemChains.length;
    const nextRareLevel = Math.min(MAX_ITEM_LEVEL, state.playerLevel >= 3 ? 4 : 3);
    const rareMeta = getItemMeta(nextRareType, nextRareLevel);

    let pipsHtml = '';
    for (let i = 0; i < ORDER_SET_TARGET; i++) {
      const done = i < prog;
      pipsHtml += `<span class="set-pip ${done ? 'done' : ''}">${done ? '✓' : i + 1}</span>`;
    }

    setEl.innerHTML = `
      <div class="order-set-top">
        <div class="order-set-title-group">
          <span class="order-set-badge">🎁 5 MÜŞTERİ SET ÖDÜLÜ (${prog}/${ORDER_SET_TARGET})</span>
          <span class="order-diff-pill">⚡ ${diff.label}</span>
        </div>
        <div class="order-set-pips">${pipsHtml}</div>
      </div>
      <div class="order-set-bar-wrap">
        <div class="order-set-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="order-set-reward-row">
        <img src="${rareMeta.img}" alt="${rareMeta.name}" class="order-set-rare-thumb">
        <div class="order-set-reward-text">
          <strong>5/5 Sipariş Seti Tamamlama Ödülü:</strong>
          <span>Nadir <b>${rareMeta.icon} ${rareMeta.name} (LV.${rareMeta.level})</b> + <b>+$450</b> + <b>+6 💎</b> (3D Hazine Sandığı)</span>
        </div>
      </div>
    `;
  }

  function renderOrders() {
    ensureFiveOrders();
    renderOrderSetBanner();

    const tray = $('orderTray');
    if (!tray) return;
    tray.innerHTML = '';

    const customerBgMap = {
      'Adrian Vale': 'assets/scene_romance_gala.jpg',
      'Isabella Laurent': 'assets/scene_lobby_reception.jpg',
      'Leon Marchand': 'assets/scene_penthouse_piano.jpg',
      'Serena Black': 'assets/scene_spa_wellness.jpg',
      'Kontes Viktoria': 'assets/scene_garden_terrace.jpg',
      'Kaptan Matteo': 'assets/scene_restaurant_pool.jpg'
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
          <div class="req-pill ${it.ready ? 'ready' : ''}" data-req-type="${it.type}" data-req-lv="${it.level}" title="${meta.name} (LV.${it.level}) — Üretim Ağacını Görmek İçin Dokun">
            <img src="${meta.img}" alt="${meta.name}" class="req-item-img">
            <div class="req-pill-info">
              <span class="req-item-name">${meta.name}</span>
              <span class="req-level">LV.${it.level} · 🔍 Tarif</span>
            </div>
            ${it.ready ? '<span class="req-check-badge">✓</span>' : '<span class="req-info-badge">ℹ️</span>'}
          </div>
        `;
      });

      const gemBadgeHtml = ord.rewardGems
        ? `<span class="reward-badge-card compact gem"><img src="assets/rewards/reward_gems.jpg" alt="Elmas"><b>+${ord.rewardGems} 💎</b></span>`
        : '';

      card.innerHTML = `
        <div class="order-customer-head" style="background-image: linear-gradient(90deg, rgba(14,17,27,0.9) 25%, rgba(14,17,27,0.45) 100%), url('${bgImg}');">
          <span class="order-slot-num">#${index + 1}/5</span>
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
            <b>+${ord.rewardStars} ⭐</b>
          </span>
          ${gemBadgeHtml}
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

      card.querySelectorAll('.req-pill[data-req-type]').forEach((pill) => {
        pill.style.cursor = 'pointer';
        pill.onclick = (e) => {
          e.stopPropagation();
          const t = parseInt(pill.dataset.reqType, 10);
          const lv = parseInt(pill.dataset.reqLv, 10);
          openMergeTreeModal(t, lv, ord.customer);
        };
      });

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

    if (order.rewardGems) {
      state.gems += order.rewardGems;
    }

    state.ordersCompleted++;
    state.orderSetProgress = (state.orderSetProgress || 0) + 1;

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
      showFloatingText(`💰 +$${order.rewardCoins}`, clientX, clientY - 28);
    }

    addXP(35, clientX, clientY);

    // Replace with a new order from a customer not currently in the other 4 slots
    const otherCustomers = state.orders
      .filter((_, idx) => idx !== orderIdx)
      .map((o) => o.customer);
    state.orders[orderIdx] = generateRandomOrder(Date.now(), otherCustomers, state.playerLevel);

    // Check if the 5-customer set (5/5) is completed!
    if (state.orderSetProgress >= ORDER_SET_TARGET) {
      state.orderSetProgress = 0;
      const completedSetIndex = state.orderSetsCompleted || 0;
      state.orderSetsCompleted = completedSetIndex + 1;

      const rareType = completedSetIndex % itemChains.length;
      const rareLevel = Math.min(MAX_ITEM_LEVEL, state.playerLevel >= 3 ? 4 : 3);
      const giveRes = giveItemToPlayer(rareType, rareLevel, '5/5 Müşteri Set Ödülü');
      addCurrencyRewards(
        { energy: 60, coins: 450, gems: 6, stars: 2 },
        `5/5 Müşteri Sipariş Seti #${state.orderSetsCompleted} Tamamlama Ödülü`
      );
      sfx.fanfare();

      const placementNote = giveRes.placed
        ? `${giveRes.meta.icon} ${giveRes.meta.name} (LV.${giveRes.meta.level}) doğrudan masaya yerleştirildi!`
        : `${giveRes.meta.icon} ${giveRes.meta.name} (LV.${giveRes.meta.level}) ödül kuyruğuna eklendi!`;

      notify(`🎉 5/5 MÜŞTERİ SETİ TAMAMLANDI! Özel Nadir Obje: ${placementNote}`);

      if (window.RewardChest3D && typeof window.RewardChest3D.open === 'function') {
        window.RewardChest3D.open({
          title: '5/5 SİPARİŞ SETİ KRALİYET SANDIĞI!',
          subtitle: `5 müşterinin tüm siparişlerini tamamladın! Nadir ${giveRes.meta.name} (LV.${giveRes.meta.level}) ve hazine ödüllerin hazır:`,
          rewards: [
            { icon: giveRes.meta.icon, label: `Nadir: ${giveRes.meta.name} (LV.${giveRes.meta.level})`, img: giveRes.meta.img, color: '#fbbf24' },
            { icon: '💰', label: '+$450 Prestij', img: 'assets/rewards/reward_prestige.jpg', color: '#f59e0b' },
            { icon: '💎', label: '+6 Elmas', img: 'assets/rewards/reward_gems.jpg', color: '#ec4899' },
            { icon: '⭐', label: '+2 Yıldız & +60⚡', img: 'assets/rewards/reward_star.jpg', color: '#38bdf8' }
          ]
        });
      }
    } else {
      notify(`Sipariş teslim edildi (${state.orderSetProgress}/${ORDER_SET_TARGET} Set)! ${order.customer} çok memnun kaldı: +$${order.rewardCoins} ve +${order.rewardStars} Yıldız!`);
    }

    renderAll();
  }

  /* ================= OBJECT SHOP & GEM TIME-SKIP MARKET (#shopModal) ================= */
  let currentShopChainFilter = 'all';

  function openShopModal() {
    const modal = $('shopModal');
    if (!modal) return;
    sfx.pop();
    renderShopModal();
    modal.style.display = 'flex';
  }
  window.openShopModal = openShopModal;

  function closeShopModal() {
    const modal = $('shopModal');
    if (modal) modal.style.display = 'none';
  }
  window.closeShopModal = closeShopModal;

  function getItemShopPrice(level) {
    // Lv.1 and Lv.2 purchasable with Gold ($), Lv.3 and Lv.4 purchasable with Gems (💎) or Gold ($)
    if (level === 1) return { coins: 65, gems: 2 };
    if (level === 2) return { coins: 140, gems: 4 };
    if (level === 3) return { coins: 310, gems: 7 };
    if (level === 4) return { coins: 650, gems: 14 };
    return { coins: 1350, gems: 28 };
  }

  function buyShopItem(type, level, currencyType) {
    const emptyIdx = state.board.findIndex((x) => !x);
    if (emptyIdx === -1) {
      sfx.reject();
      notify('⚠️ Masada boş yer yok! Satın almadan önce iki aynı objeyi birleştirerek yer açın.');
      return;
    }

    const price = getItemShopPrice(level);
    const meta = getItemMeta(type, level);

    if (currencyType === 'gems') {
      if (!spendGems(price.gems, `Mağaza: ${meta.name} (LV.${level})`)) return;
    } else {
      if (!spendCoins(price.coins, `Mağaza: ${meta.name} (LV.${level})`)) return;
    }

    state.board[emptyIdx] = { type, level };
    state.itemsSpawned = (state.itemsSpawned || 0) + 1;
    sfx.fanfare();
    notify(`🛍️ Mağazadan satın alındı: ${meta.icon} ${meta.name} (LV.${level}) masaya yerleştirildi!`);
    renderAll();
    renderShopModal();
  }

  function buyRoyal3DChestFromShop() {
    if (!spendGems(12, 'Mağaza: 3D Kraliyet Nadir Obje Sandığı')) return;
    const t1 = Math.floor(Math.random() * itemChains.length);
    const t2 = (t1 + 1 + Math.floor(Math.random() * (itemChains.length - 1))) % itemChains.length;
    const r1 = giveItemToPlayer(t1, 3, 'Kraliyet Sandığı');
    const r2 = giveItemToPlayer(t2, 4, 'Kraliyet Sandığı');
    addCurrencyRewards({ energy: 60, coins: 300, gems: 0, stars: 1 }, 'Mağaza: 3D Kraliyet Sandığı');
    sfx.fanfare();
    closeShopModal();
    renderAll();

    if (window.RewardChest3D && typeof window.RewardChest3D.open === 'function') {
      window.RewardChest3D.open({
        title: '3D KRALİYET HAZİNE SANDIĞI!',
        subtitle: 'Mağazadan aldığın lüks sandık açıldı! İçinden 2 nadir obje ve kraliyet ödülleri yükseliyor:',
        rewards: [
          { icon: r2.meta.icon, label: `${r2.meta.name} (LV.4)`, img: r2.meta.img, color: '#fbbf24' },
          { icon: r1.meta.icon, label: `${r1.meta.name} (LV.3)`, img: r1.meta.img, color: '#ec4899' },
          { icon: '💰', label: '+$300 Prestij', img: 'assets/rewards/reward_prestige.jpg', color: '#f59e0b' },
          { icon: '⚡', label: '+60 Enerji & +1 ⭐', img: 'assets/rewards/reward_energy.jpg', color: '#38bdf8' }
        ]
      });
    }
  }

  function renderShopModal() {
    const content = $('shopModalContent');
    if (!content) return;

    // Gather needed items across active 5 orders that aren't fulfilled yet
    const neededMap = new Map();
    state.orders.forEach((ord) => {
      const { itemsStatus } = checkOrderFulfillment(ord);
      itemsStatus.forEach((it) => {
        if (!it.ready) {
          const key = `${it.type}_${it.level}`;
          if (!neededMap.has(key)) {
            neededMap.set(key, { type: it.type, level: it.level, customer: ord.customer });
          }
        }
      });
    });

    let neededHtml = '';
    if (neededMap.size === 0) {
      neededHtml = `<div class="shop-empty-note">✅ Tüm aktif siparişlerdeki objeler masada hazır!</div>`;
    } else {
      neededMap.forEach((req) => {
        const meta = getItemMeta(req.type, req.level);
        const price = getItemShopPrice(req.level);
        neededHtml += `
          <div class="shop-item-card highlight-needed">
            <span class="shop-needed-tag">🔥 ${req.customer} İstiyor</span>
            <img src="${meta.img}" alt="${meta.name}" class="shop-item-img">
            <strong>${meta.name}</strong>
            <span class="shop-lv-pill">SEVİYE ${req.level}</span>
            <div class="shop-buy-btns">
              <button class="shop-buy-btn coin" data-buy-type="${req.type}" data-buy-lv="${req.level}" data-buy-curr="coins">$${price.coins}</button>
              <button class="shop-buy-btn gem" data-buy-type="${req.type}" data-buy-lv="${req.level}" data-buy-curr="gems">💎 ${price.gems}</button>
            </div>
          </div>
        `;
      });
    }

    // Filterable catalog of basic (Lv.1-2) and intermediate (Lv.3-4) items across all 4 chains
    let catalogHtml = '';
    for (let t = 0; t < itemChains.length; t++) {
      if (currentShopChainFilter !== 'all' && Number(currentShopChainFilter) !== t) continue;
      for (let lv = 1; lv <= 4; lv++) {
        const meta = getItemMeta(t, lv);
        const price = getItemShopPrice(lv);
        catalogHtml += `
          <div class="shop-item-card">
            <span class="shop-chain-tag">${itemChainNames[t].split(' ')[0]} LV.${lv}</span>
            <img src="${meta.img}" alt="${meta.name}" class="shop-item-img">
            <strong>${meta.name}</strong>
            <span class="shop-lv-pill">${lv <= 2 ? 'Temel Obje' : 'Ara Seviye Nadir'}</span>
            <div class="shop-buy-btns">
              <button class="shop-buy-btn coin" data-buy-type="${t}" data-buy-lv="${lv}" data-buy-curr="coins">$${price.coins}</button>
              <button class="shop-buy-btn gem" data-buy-type="${t}" data-buy-lv="${lv}" data-buy-curr="gems">💎 ${price.gems}</button>
            </div>
          </div>
        `;
      }
    }

    const spawnerOnCooldown = state.spawnerCooldownUntil && Date.now() < state.spawnerCooldownUntil;
    const wheelOnCooldown = state.lastFreeSpinTime && (Date.now() - state.lastFreeSpinTime < DAILY_SPIN_COOLDOWN_MS);

    content.innerHTML = `
      <div class="shop-modal-header">
        <div>
          <h3>🛍️ AURELIA OBJE MAĞAZASI &amp; ZAMAN ATLAMA</h3>
          <p>Tahtada ihtiyaç duyduğun temel ve ara seviye objeleri doğrudan satın al veya Elmas (💎) ile bekleme sürelerini hızlandır!</p>
        </div>
        <button id="closeShopModalBtn" class="shop-close-btn">✕</button>
      </div>

      <div class="shop-wallet-bar">
        <span>💰 Prestij: <b>$${state.prestige}</b></span>
        <span>💎 Elmas: <b>${state.gems}</b></span>
        <span>⚡ Enerji: <b>${state.energy}/${MAX_ENERGY}</b></span>
      </div>

      <div class="shop-section">
        <h4>🔥 AKTİF SİPARİŞLERDE ARANAN OBJELER (HIZLI TEDARİK)</h4>
        <div class="shop-grid">${neededHtml}</div>
      </div>

      <div class="shop-section">
        <div class="shop-filter-head">
          <h4>📦 TEMEL (LV.1-2) &amp; ARA SEVİYE (LV.3-4) OBJE MARKETİ</h4>
          <div class="shop-filter-pills">
            <button class="shop-filter-btn ${currentShopChainFilter === 'all' ? 'active' : ''}" data-chain="all">Tümü</button>
            <button class="shop-filter-btn ${currentShopChainFilter === '0' ? 'active' : ''}" data-chain="0">🌹 Çiçek</button>
            <button class="shop-filter-btn ${currentShopChainFilter === '1' ? 'active' : ''}" data-chain="1">💎 Mücevher</button>
            <button class="shop-filter-btn ${currentShopChainFilter === '2' ? 'active' : ''}" data-chain="2">🎂 Pastane</button>
            <button class="shop-filter-btn ${currentShopChainFilter === '3' ? 'active' : ''}" data-chain="3">🥂 Şampanya</button>
          </div>
        </div>
        <div class="shop-grid">${catalogHtml}</div>
      </div>

      <div class="shop-section">
        <h4>⚡ MÜCEVHER (💎) İLE ZAMAN ATLAMA &amp; 3D HAZİNE SANDIKLARI</h4>
        <div class="shop-special-grid">
          <div class="shop-special-card">
            <img src="assets/rewards/reward_chest.jpg" alt="3D Kraliyet Sandığı">
            <div>
              <strong>3D Kraliyet Nadir Obje Sandığı</strong>
              <small>3D açılış animasyonu ile 1x LV.4 Nadir Obje + 1x LV.3 Obje + $300 + 60⚡</small>
            </div>
            <button id="shopBuy3DChestBtn" class="shop-buy-btn gem">💎 12 Elmas</button>
          </div>

          <div class="shop-special-card">
            <img src="assets/rewards/reward_spawner.jpg" alt="Üretim Hızlandır">
            <div>
              <strong>Üretim Sandığı Zaman Atlama</strong>
              <small>${spawnerOnCooldown ? 'Bekleme süresini anında sıfırla ve 15 üretim hakkını doldur!' : `Üretim sandığını tam kapasiteye (${MAX_SPAWNER_CHARGES}/${MAX_SPAWNER_CHARGES}) yenile`}</small>
            </div>
            <button id="shopSkipSpawnerBtn" class="shop-buy-btn gem">💎 3 Elmas</button>
          </div>

          <div class="shop-special-card">
            <img src="assets/rewards/reward_energy.jpg" alt="Enerji Doldur">
            <div>
              <strong>Anında +250 Enerji Paketi</strong>
              <small>Bekleme süresini atla ve masada kesintisiz birleştirmeye devam et!</small>
            </div>
            <button id="shopBuyEnergyBtn" class="shop-buy-btn gem">💎 5 Elmas</button>
          </div>

          <div class="shop-special-card">
            <img src="assets/rewards/reward_star.jpg" alt="Şans Çarkı Zaman Atla">
            <div>
              <strong>Şans Çarkı 24 Saat Süreyi Atla</strong>
              <small>${wheelOnCooldown ? '24 saatlik bekleme süresini sıfırla ve ücretsiz hakkı hemen aç!' : 'Şans çarkında ekstra çevirme hakkı aç'}</small>
            </div>
            <button id="shopSkipWheelBtn" class="shop-buy-btn gem">💎 15 Elmas</button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = $('closeShopModalBtn');
    if (closeBtn) closeBtn.onclick = () => closeShopModal();

    content.querySelectorAll('.shop-filter-btn').forEach((btn) => {
      btn.onclick = () => {
        currentShopChainFilter = btn.dataset.chain;
        renderShopModal();
      };
    });

    content.querySelectorAll('[data-buy-type]').forEach((btn) => {
      btn.onclick = () => {
        const t = parseInt(btn.dataset.buyType, 10);
        const lv = parseInt(btn.dataset.buyLv, 10);
        const curr = btn.dataset.buyCurr;
        buyShopItem(t, lv, curr);
      };
    });

    const chestBtn = $('shopBuy3DChestBtn');
    if (chestBtn) chestBtn.onclick = () => buyRoyal3DChestFromShop();

    const skipSpawnerBtn = $('shopSkipSpawnerBtn');
    if (skipSpawnerBtn) {
      skipSpawnerBtn.onclick = () => {
        if (!spendGems(3, 'Zaman Atlama: Üretim Sandığı Süre Sıfırlama')) return;
        state.spawnerCooldownUntil = 0;
        state.spawnerCharges = MAX_SPAWNER_CHARGES;
        sfx.fanfare();
        notify('⚡ Zaman Atlama başarılı! Kraliyet Üretim Sandığı bekleme süresi sıfırlandı (15/15 Hak Hazır)!');
        renderAll();
        renderShopModal();
      };
    }

    const buyEnergyBtn = $('shopBuyEnergyBtn');
    if (buyEnergyBtn) {
      buyEnergyBtn.onclick = () => {
        if (!spendGems(5, 'Mağaza: +250 Enerji Paketi')) return;
        addCurrencyRewards({ energy: 250 }, 'Mağaza Enerji Paketi');
        sfx.fanfare();
        notify('⚡ +250 Enerji anında hesabına eklendi!');
        renderAll();
        renderShopModal();
      };
    }

    const skipWheelBtn = $('shopSkipWheelBtn');
    if (skipWheelBtn) {
      skipWheelBtn.onclick = () => {
        if (!spendGems(15, 'Zaman Atlama: Şans Çarkı 24s Süre Sıfırlama')) return;
        state.lastFreeSpinTime = 0;
        sfx.fanfare();
        notify('🎡 Şans Çarkı 24 saatlik bekleme süresi Elmas ile sıfırlandı! Hemen çevirebilirsin.');
        closeShopModal();
        switchMainPage('pageWheel');
        renderWheelCooldownUI();
      };
    }
  }

  /* ================= HOTEL RENOVATION (PAGE 2) ================= */
  function renderHotelPage() {
    let canUp = 0;
    if (window.hotel3D && typeof window.hotel3D.getCurrentSequentialAreaId === 'function') {
      const nextId = window.hotel3D.getCurrentSequentialAreaId();
      if (nextId && window.hotel3D.renovationDefs[nextId]) {
        const bal = window.GameEconomy ? window.GameEconomy.getBalance() : window.hotel3D.state.coins;
        const st = window.GameEconomy ? window.GameEconomy.getStars() : window.hotel3D.state.stars;
        const cost = window.hotel3D.getNextUpgradeCost(nextId);
        const starsReq = window.hotel3D.getNextUpgradeStars(nextId);
        if (bal >= cost && st >= starsReq) canUp = 1;
      }
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

  /* ================= LUCKY WHEEL WITH 24-HOUR LIMIT & GEM TIME-SKIP (PAGE 4) ================= */
  let isWheelSpinning = false;
  let currentWheelDegree = 0;

  function formatDurationHMS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderWheelCooldownUI() {
    const spinBtn = $('spinBtn');
    const spinGemBtn = $('spinGemBtn');
    const spinAdBtn = $('spinAdBtn');
    const resultNotice = $('wheelResultNotice');
    if (!spinBtn) return;

    const now = Date.now();
    const elapsedFree = now - (state.lastFreeSpinTime || 0);
    const freeReady = elapsedFree >= DAILY_SPIN_COOLDOWN_MS;
    const remFreeMs = Math.max(0, DAILY_SPIN_COOLDOWN_MS - elapsedFree);

    if (freeReady) {
      spinBtn.disabled = isWheelSpinning;
      spinBtn.classList.remove('on-cooldown');
      spinBtn.innerHTML = `
        <span>🎡 GÜNLÜK ÜCRETSİZ ÇEVİR (1/1)</span>
        <small>24 Saatte 1 Ücretsiz Hak Hazır!</small>
      `;
      if (spinGemBtn) spinGemBtn.style.display = 'none';
    } else {
      spinBtn.disabled = true;
      spinBtn.classList.add('on-cooldown');
      const timeStr = formatDurationHMS(remFreeMs);
      spinBtn.innerHTML = `
        <span>⏳ GÜNLÜK HAK KULLANILDI</span>
        <small>Sonraki Ücretsiz Hak: ${timeStr}</small>
      `;
      if (spinGemBtn) {
        spinGemBtn.style.display = 'flex';
        spinGemBtn.disabled = isWheelSpinning;
        spinGemBtn.innerHTML = `
          <span>💎 15 ELMAS İLE HEMEN ÇEVİR (ZAMAN ATLA)</span>
          <small>24 Saatlik Bekleme Süresini Atla</small>
        `;
      }
      if (resultNotice && !isWheelSpinning && resultNotice.textContent.includes('hazır')) {
        resultNotice.textContent = `⏳ Günlük ücretsiz çevirme hakkın ${timeStr} sonra yenilenecek. Elmas ile beklemeden çevirebilirsin!`;
      }
    }

    if (spinAdBtn) {
      const elapsedAd = now - (state.lastAdSpinTime || 0);
      const adReady = elapsedAd >= DAILY_SPIN_COOLDOWN_MS;
      if (adReady) {
        spinAdBtn.disabled = isWheelSpinning;
        spinAdBtn.innerHTML = `<span>📺 GÜNLÜK BONUS ÇEVİRME HAKKI (1/1)</span>`;
      } else {
        const remAdStr = formatDurationHMS(DAILY_SPIN_COOLDOWN_MS - elapsedAd);
        spinAdBtn.disabled = true;
        spinAdBtn.innerHTML = `<span>⏳ BONUS HAK BEKLEMEDE (${remAdStr})</span>`;
      }
    }
  }

  function initLuckyWheel() {
    const wheel = $('luckyWheel');
    const spinBtn = $('spinBtn');
    const spinGemBtn = $('spinGemBtn');
    const spinAdBtn = $('spinAdBtn');
    const resultNotice = $('wheelResultNotice');

    const segments = [
      {
        name: '+100 Enerji',
        reward: () => addCurrencyRewards({ energy: 100 }, 'Şans Çarkı')
      },
      {
        name: '+$500 Prestij',
        reward: () => addCurrencyRewards({ coins: 500 }, 'Şans Çarkı')
      },
      {
        name: '+10 Elmas',
        reward: () => addCurrencyRewards({ gems: 10 }, 'Şans Çarkı')
      },
      {
        name: '+1 Yenileme Yıldızı',
        reward: () => addCurrencyRewards({ stars: 1 }, 'Şans Çarkı')
      },
      {
        name: '+50 Enerji & +2 Elmas',
        reward: () => addCurrencyRewards({ energy: 50, gems: 2 }, 'Şans Çarkı')
      },
      {
        name: '3D VIP Kraliyet Sandığı (+$300, +5 💎 & Nadir Obje)',
        reward: () => {
          const rareType = Math.floor(Math.random() * itemChains.length);
          const giveRes = giveItemToPlayer(rareType, 3, 'Şans Çarkı VIP Sandığı');
          addCurrencyRewards({ coins: 300, gems: 5, energy: 40 }, 'Şans Çarkı VIP Sandığı');
          if (window.RewardChest3D && typeof window.RewardChest3D.open === 'function') {
            window.RewardChest3D.open({
              title: 'ŞANS ÇARKI 3D VIP HAZİNE SANDIĞI!',
              subtitle: 'VIP dilimini tutturdun! 3D Kraliyet Sandığından çıkan ödüllerin:',
              rewards: [
                { icon: giveRes.meta.icon, label: `${giveRes.meta.name} (LV.3)`, img: giveRes.meta.img, color: '#fbbf24' },
                { icon: '💰', label: '+$300 Prestij', img: 'assets/rewards/reward_prestige.jpg', color: '#f59e0b' },
                { icon: '💎', label: '+5 Elmas', img: 'assets/rewards/reward_gems.jpg', color: '#ec4899' },
                { icon: '⚡', label: '+40 Enerji', img: 'assets/rewards/reward_energy.jpg', color: '#38bdf8' }
              ]
            });
          }
        }
      }
    ];

    function runSpin(sourceType) {
      if (isWheelSpinning) return;

      const now = Date.now();
      if (sourceType === 'free') {
        if (now - (state.lastFreeSpinTime || 0) < DAILY_SPIN_COOLDOWN_MS) {
          sfx.reject();
          notify('⏳ Günlük ücretsiz çevirme hakkın henüz dolmadı! 24 saatte 1 kez ücretsiz çevirebilir veya Elmas ile zaman atlayabilirsin.');
          renderWheelCooldownUI();
          return;
        }
        state.lastFreeSpinTime = now;
        save();
      } else if (sourceType === 'gem') {
        if (!spendGems(15, 'Şans Çarkı: Zaman Atlama & Ekstra Çevirme')) return;
      } else if (sourceType === 'ad') {
        if (now - (state.lastAdSpinTime || 0) < DAILY_SPIN_COOLDOWN_MS) {
          sfx.reject();
          notify('⏳ Günlük bonus çevirme hakkın 24 saatte 1 kez kullanılabilir.');
          renderWheelCooldownUI();
          return;
        }
        state.lastAdSpinTime = now;
        save();
      }

      isWheelSpinning = true;
      renderWheelCooldownUI();
      sfx.pop();

      const chosenIndex = Math.floor(Math.random() * segments.length);
      const randomExtraRotations = (5 + Math.floor(Math.random() * 3)) * 360;
      const targetDeg = randomExtraRotations + (360 - chosenIndex * 60 - 30);
      currentWheelDegree += targetDeg;

      if (wheel) wheel.style.transform = `rotate(${currentWheelDegree}deg)`;
      if (resultNotice) resultNotice.textContent = '🎡 Çark dönüyor... Şans seninle olsun!';

      setTimeout(() => {
        isWheelSpinning = false;
        const prize = segments[chosenIndex];
        prize.reward();
        sfx.fanfare();
        if (resultNotice) resultNotice.textContent = `🎉 TEBRİKLER! "${prize.name}" KAZANDIN!`;
        notify(`Şans Çarkından ödül: ${prize.name}!`);
        renderAll();
        renderWheelCooldownUI();
      }, 4200);
    }

    if (spinBtn) spinBtn.onclick = () => runSpin('free');
    if (spinGemBtn) spinGemBtn.onclick = () => runSpin('gem');
    if (spinAdBtn) {
      spinAdBtn.onclick = () => {
        const now = Date.now();
        if (now - (state.lastAdSpinTime || 0) < DAILY_SPIN_COOLDOWN_MS) {
          sfx.reject();
          notify('⏳ Günlük bonus çevirme hakkın 24 saatte 1 kez kullanılabilir.');
          return;
        }
        openAdModal(() => runSpin('ad'));
      };
    }

    renderWheelCooldownUI();
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

  /* ================= BOARD, SPAWNER WITH COOLDOWN & MAX-LEVEL MERGE LOCK ================= */
  function renderSpawnerControls() {
    const spawnBtn = $('spawnBtn');
    const skipBtn = $('skipSpawnerCooldownBtn');
    const chargesLabel = $('spawnerChargesLabel');
    if (!spawnBtn) return;

    const now = Date.now();
    const onCooldown = state.spawnerCooldownUntil && now < state.spawnerCooldownUntil;

    if (onCooldown) {
      const remSec = Math.max(1, Math.ceil((state.spawnerCooldownUntil - now) / 1000));
      const m = Math.floor(remSec / 60);
      const s = remSec % 60;
      const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      spawnBtn.disabled = true;
      spawnBtn.classList.add('spawner-cooling');
      spawnBtn.innerHTML = `
        <div class="spawn-btn-top">
          <span>⏳ ${timeStr}</span>
        </div>
        <small>Yenileniyor</small>
      `;
      if (skipBtn) {
        skipBtn.style.display = 'inline-flex';
      }
      if (chargesLabel) {
        chargesLabel.textContent = `⏳ Sandık yenileniyor (${timeStr}) · Elmas ile süreyi atla!`;
      }
    } else {
      spawnBtn.disabled = false;
      spawnBtn.classList.remove('spawner-cooling');
      const charges = typeof state.spawnerCharges === 'number' ? state.spawnerCharges : MAX_SPAWNER_CHARGES;
      spawnBtn.innerHTML = `
        <div class="spawn-btn-top">
          <img src="assets/rewards/reward_energy.jpg" alt="Enerji" class="btn-inline-icon">
          <span>ÜRET (${charges})</span>
        </div>
        <small>-1 Enerji</small>
      `;
      if (skipBtn) {
        skipBtn.style.display = 'none';
      }
      if (chargesLabel) {
        chargesLabel.textContent = `Masaya temel obje çıkarır (${charges}/${MAX_SPAWNER_CHARGES} Hak)`;
      }
    }
  }

  function skipSpawnerCooldownWithGems() {
    if (!spendGems(3, 'Zaman Atlama: Üretim Sandığı Süre Sıfırlama')) return;
    state.spawnerCooldownUntil = 0;
    state.spawnerCharges = MAX_SPAWNER_CHARGES;
    sfx.fanfare();
    notify('⚡ Zaman Atlama! 3 💎 ile Kraliyet Üretim Sandığı bekleme süresi sıfırlandı!');
    renderAll();
  }

  function spawnItem() {
    const now = Date.now();
    if (state.spawnerCooldownUntil && now < state.spawnerCooldownUntil) {
      sfx.reject();
      notify('⏳ Üretim Sandığı şu an yenileniyor! 💎 3 Elmas ile bekleme süresini hemen atlayabilirsin.');
      renderSpawnerControls();
      return;
    }

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

    if (typeof state.spawnerCharges !== 'number') state.spawnerCharges = MAX_SPAWNER_CHARGES;
    state.spawnerCharges = Math.max(0, state.spawnerCharges - 1);
    if (state.spawnerCharges <= 0) {
      state.spawnerCooldownUntil = Date.now() + SPAWNER_COOLDOWN_MS;
    }

    sfx.pop();

    const spawnBtn = $('spawnBtn');
    if (spawnBtn) {
      const rect = spawnBtn.getBoundingClientRect();
      showFloatingText('🎁 +1 Lüks Obje', rect.left + rect.width / 2, rect.top);
    }

    renderAll();
    const meta = getItemMeta(randomType, 1);
    notify(`Yeni obje masaya eklendi: ${meta.icon} ${meta.name} (LV.1)`);
  }

  function sortBoard() {
    const filled = state.board.filter(Boolean);
    filled.sort((a, b) => a.type - b.type || a.level - b.level);

    let k = 0;
    state.board = state.board.map((x) => (x ? filled[k++] : null));
    state.selected = null;
    sfx.pop();
    renderAll();
    notify('Masa düzenlendi! Aynı temadaki objeler yan yana sıralandı.');
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

    // Move to empty slot
    if (!target) {
      state.board[toIdx] = source;
      state.board[fromIdx] = null;
      state.selected = null;
      sfx.pop();
      renderAll();
      notify('Obje yeni alana taşındı.');
      return;
    }

    // Same type & same level -> Check MAX_ITEM_LEVEL lock first!
    if (source.type === target.type && source.level === target.level) {
      // MAX LEVEL LOCK & BUG FIX: Prevent max-level items from swallowing/destroying each other!
      if (source.level >= MAX_ITEM_LEVEL || target.level >= MAX_ITEM_LEVEL) {
        state.selected = null;
        sfx.reject();
        const maxMeta = getItemMeta(source.type, source.level);
        if (clientX && clientY) {
          showFloatingText('🔒 MAKS SEVİYE! BİRLEŞTİRİLEMEZ', clientX, clientY);
        }
        renderBoard();
        // Trigger bounce-back shake animation on both tiles at their original grid positions
        const boardEl = $('board');
        if (boardEl) {
          const fromTile = boardEl.querySelector(`[data-index="${fromIdx}"]`);
          const toTile = boardEl.querySelector(`[data-index="${toIdx}"]`);
          if (fromTile) fromTile.classList.add('reject-shake');
          if (toTile) toTile.classList.add('reject-shake');
        }
        notify(`⚠️ Maksimum seviyedeki (${maxMeta.icon} ${maxMeta.name} - LV.${MAX_ITEM_LEVEL} MAKS) iki obje birleştirilemez! Objeler kendi konumlarına geri döndü.`);
        return;
      }

      // Valid thematic merge (Lv.1 -> Lv.2 -> Lv.3 -> Lv.4 -> Lv.5 MAKS)
      const newLevel = target.level + 1;
      state.board[toIdx] = { type: target.type, level: newLevel };
      state.board[fromIdx] = null;
      state.selected = null;
      state.merges++;
      if (newLevel >= 3) {
        state.highLevelMerges = (state.highLevelMerges || 0) + 1;
      }

      // Rare Gem (💎) drop on the board during high-level merges (Requirement 4.2)
      let bonusGemText = '';
      if (newLevel === 4 && Math.random() < 0.55) {
        state.gems += 1;
        bonusGemText = ' (+1 💎 Nadir Elmas Bulundu!)';
        if (clientX && clientY) showFloatingText('💎 +1 ELMAS!', clientX, clientY - 30);
      } else if (newLevel === MAX_ITEM_LEVEL) {
        state.gems += 3;
        bonusGemText = ' (+3 💎 Maksimum Seviye Elmas Ödülü!)';
        if (clientX && clientY) showFloatingText('💎 +3 ELMAS!', clientX, clientY - 30);
      }

      sfx.merge();
      const meta = getItemMeta(target.type, newLevel);
      if (clientX && clientY) {
        showFloatingText(`✨ ${meta.name} (LV.${newLevel})`, clientX, clientY);
      }
      addXP(15 * newLevel, clientX, clientY);

      renderAll();
      const maxTag = newLevel >= MAX_ITEM_LEVEL ? ' [MAKS SEVİYE]' : '';
      notify(`Muhteşem birleşim! ${meta.icon} ${meta.name} (Seviye ${newLevel}${maxTag}) üretildi!${bonusGemText}`);
      return;
    }

    // Different item or different level -> SWAP positions safely
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
      const infoBtn = e.target.closest('.tile-info-btn');
      if (infoBtn) {
        e.stopPropagation();
        const infoIdx = parseInt(infoBtn.dataset.infoIdx, 10);
        if (!isNaN(infoIdx) && state.board[infoIdx]) {
          openMergeTreeModal(state.board[infoIdx].type, state.board[infoIdx].level);
        }
        return;
      }

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
      try { tile.setPointerCapture(e.pointerId); } catch (err) {}
    });

    board.addEventListener('pointermove', (e) => {
      if (dragSourceIdx === null) return;

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const item = state.board[dragSourceIdx];
      if (!item) return;

      if (dist > 8) {
        isDragging = true;
        const meta = getItemMeta(item.type, item.level);
        const lvBadge = meta.isMax ? '🔒 MAKS' : `LV.${item.level}`;
        ghost.innerHTML = `<img src="${meta.img}" alt="${meta.name}" class="tile-item-img"><span class="lv ${meta.isMax ? 'max-lv' : ''}">${lvBadge}</span>`;
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
            if (meta.isMax) {
              notify(`👑 ${meta.name} (LV.${MAX_ITEM_LEVEL} MAKS SEVİYE) seçildi. Son seviye objeler birleştirilemez, siparişlerde kullanılabilir veya taşınabilir.`);
            } else {
              const nextMeta = getItemMeta(it.type, it.level + 1);
              notify(`${meta.icon} ${meta.name} (LV.${it.level}) seçildi. Birleştirince: ${nextMeta.icon} ${nextMeta.name} (LV.${it.level + 1}).`);
            }
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

  // Compute active order highlight hints for the merge board (Exact matches & Ingredient parts)
  function getBoardOrderHighlightMap() {
    const exactMatchMap = new Map();      // tileIdx -> { customer, type, level }
    const ingredientMatchMap = new Map(); // tileIdx -> { customer, targetLevel }

    if (!state || !Array.isArray(state.orders) || !Array.isArray(state.board)) {
      return { exactMatchMap, ingredientMatchMap };
    }

    const unfulfilledTargets = [];
    state.orders.forEach((ord) => {
      if (!ord || !Array.isArray(ord.items)) return;
      ord.items.forEach((req) => {
        let matchedIdx = -1;
        for (let i = 0; i < state.board.length; i++) {
          const it = state.board[i];
          if (it && it.type === req.type && it.level === req.level && !exactMatchMap.has(i)) {
            matchedIdx = i;
            break;
          }
        }
        if (matchedIdx !== -1) {
          exactMatchMap.set(matchedIdx, { customer: ord.customer, type: req.type, level: req.level });
        } else {
          unfulfilledTargets.push({ customer: ord.customer, type: req.type, level: req.level });
        }
      });
    });

    // Any remaining board tile that shares a chain with an unfulfilled higher-level order item is an ingredient part
    state.board.forEach((it, idx) => {
      if (!it || exactMatchMap.has(idx)) return;
      const neededTarget = unfulfilledTargets.find((u) => u.type === it.type && u.level > it.level);
      if (neededTarget) {
        ingredientMatchMap.set(idx, { customer: neededTarget.customer, targetLevel: neededTarget.level });
      }
    });

    return { exactMatchMap, ingredientMatchMap };
  }

  function renderBoard() {
    const board = $('board');
    if (!board) return;
    board.innerHTML = '';

    const { exactMatchMap, ingredientMatchMap } = getBoardOrderHighlightMap();

    state.board.forEach((it, i) => {
      const b = document.createElement('div');
      const isMax = it && it.level >= MAX_ITEM_LEVEL;
      const exactInfo = exactMatchMap.get(i);
      const partInfo = ingredientMatchMap.get(i);

      b.className = 'tile'
        + (!it ? ' empty' : '')
        + (state.selected === i ? ' selected' : '')
        + (isMax ? ' max-level-tile' : '')
        + (exactInfo ? ' order-needed-exact' : (partInfo ? ' order-needed-part' : ''));
      b.dataset.index = i;

      if (it) {
        const meta = getItemMeta(it.type, it.level);
        const badgeText = meta.isMax ? '🔒 MAKS' : `LV.${meta.level}`;
        let orderIndicatorHtml = '';
        if (exactInfo) {
          orderIndicatorHtml = `<span class="order-match-badge" title="${exactInfo.customer} Siparişinde İsteniyor!">✓ SİPARİŞ</span>`;
        } else if (partInfo) {
          orderIndicatorHtml = `<span class="order-part-badge" title="${partInfo.customer} İçin Üretim Parçası (Hedef LV.${partInfo.targetLevel})">⚡ PARÇA</span>`;
        }

        b.innerHTML = `
          ${orderIndicatorHtml}
          <button type="button" class="tile-info-btn" data-info-idx="${i}" title="${meta.name} Evrim Ağacını &amp; Tarifini Gör">ℹ️</button>
          <img src="${meta.img}" alt="${meta.name}" class="tile-item-img">
          <span class="tile-item-title">${meta.name}</span>
          <span class="lv ${meta.isMax ? 'max-lv' : ''}">${badgeText}</span>
        `;
        b.setAttribute('aria-label', `${meta.name} Seviye ${meta.level}${meta.isMax ? ' Maksimum Seviye' : ''}`);
      } else {
        b.innerHTML = `<span class="emoji">＋</span>`;
        b.setAttribute('aria-label', 'Boş alan');
      }

      board.appendChild(b);
    });

    renderBoardRecipeStrip();
  }

  /* ================= MERGE TREE / RECIPE TOOLTIP & MODAL (#boardRecipeStrip & #mergeTreeModal) ================= */
  function getChainBoardCounts(type) {
    const counts = [0, 0, 0, 0, 0];
    if (!state || !Array.isArray(state.board)) return counts;
    state.board.forEach((it) => {
      if (it && it.type === type && it.level >= 1 && it.level <= MAX_ITEM_LEVEL) {
        counts[it.level - 1]++;
      }
    });
    return counts;
  }

  function renderBoardRecipeStrip() {
    const strip = $('boardRecipeStrip');
    if (!strip) return;

    let activeType = 0;
    let activeLevel = 1;
    let contextLabel = 'Seçili Obje Evrim Zinciri';

    if (state.selected !== null && state.board[state.selected]) {
      activeType = state.board[state.selected].type;
      activeLevel = state.board[state.selected].level;
      const selMeta = getItemMeta(activeType, activeLevel);
      contextLabel = `Seçili: ${selMeta.name} (LV.${activeLevel})`;
    } else if (state.orders && state.orders.length > 0 && state.orders[0].items && state.orders[0].items[0]) {
      activeType = state.orders[0].items[0].type;
      activeLevel = state.orders[0].items[0].level;
      const ordMeta = getItemMeta(activeType, activeLevel);
      contextLabel = `Sipariş Hedefi: ${ordMeta.name} (LV.${activeLevel})`;
    }

    const chainMeta = getItemMeta(activeType, activeLevel);
    const counts = getChainBoardCounts(activeType);

    let stepsHtml = '';
    for (let lv = 1; lv <= MAX_ITEM_LEVEL; lv++) {
      const m = getItemMeta(activeType, lv);
      const isCurrent = lv === activeLevel;
      const cnt = counts[lv - 1];
      stepsHtml += `
        <div class="recipe-strip-step ${isCurrent ? 'active-step' : ''}" data-recipe-type="${activeType}" data-recipe-lv="${lv}" title="${m.name} (LV.${lv}) — Detaylı Üretim Ağacı İçin Dokun">
          <img src="${m.img}" alt="${m.name}">
          <span class="rs-lv">LV.${lv}${lv === MAX_ITEM_LEVEL ? '👑' : ''}</span>
          ${cnt > 0 ? `<span class="rs-cnt">${cnt}x</span>` : ''}
        </div>
        ${lv < MAX_ITEM_LEVEL ? '<span class="recipe-strip-arrow">➔</span>' : ''}
      `;
    }

    strip.innerHTML = `
      <div class="recipe-strip-top">
        <div class="recipe-strip-title">
          <span class="rs-chain-badge">${chainMeta.chainName}</span>
          <strong>${contextLabel}</strong>
        </div>
        <button type="button" id="openFullRecipeBtn" class="recipe-strip-btn">🔍 Evrim Ağacı Kartı</button>
      </div>
      <div class="recipe-strip-chain">
        ${stepsHtml}
      </div>
    `;

    const openBtn = $('openFullRecipeBtn');
    if (openBtn) {
      openBtn.onclick = () => openMergeTreeModal(activeType, activeLevel);
    }
    strip.querySelectorAll('.recipe-strip-step').forEach((stepEl) => {
      stepEl.onclick = () => {
        const t = parseInt(stepEl.dataset.recipeType, 10);
        const lv = parseInt(stepEl.dataset.recipeLv, 10);
        openMergeTreeModal(t, lv);
      };
    });
  }

  function openMergeTreeModal(type = 0, targetLevel = 1, customerName = null) {
    const modal = $('mergeTreeModal');
    const content = $('mergeTreeModalContent');
    if (!modal || !content) return;
    sfx.pop();

    const cleanType = Math.abs(type || 0) % itemChains.length;
    const cleanLevel = Math.max(1, Math.min(MAX_ITEM_LEVEL, targetLevel || 1));
    const targetMeta = getItemMeta(cleanType, cleanLevel);
    const lv1Meta = getItemMeta(cleanType, 1);
    const counts = getChainBoardCounts(cleanType);
    const totalLv1Required = Math.pow(2, cleanLevel - 1);

    let chainTabsHtml = '';
    const totalChains = getActiveChainCount();
    for (let c = 0; c < totalChains; c++) {
      const cMeta = getItemMeta(c, 2);
      chainTabsHtml += `
        <button type="button" class="mt-chain-tab ${c === cleanType ? 'active' : ''}" data-mt-chain="${c}">
          ${cMeta.icon} ${cMeta.chainName.replace(/^[^\s]+\s/, '')}
        </button>
      `;
    }

    let treeNodesHtml = '';
    for (let lv = 1; lv <= MAX_ITEM_LEVEL; lv++) {
      const m = getItemMeta(cleanType, lv);
      const isTarget = lv === cleanLevel;
      const prevMeta = lv > 1 ? getItemMeta(cleanType, lv - 1) : null;
      const formulaText = lv === 1
        ? 'Üretim Sandığından veya Mağazadan çıkar (Temel Obje)'
        : `2× <b>${prevMeta.name} (LV.${lv - 1})</b> birleşimiyle üretilir (${Math.pow(2, lv - 1)}× LV.1)`;
      const boardCount = counts[lv - 1];

      treeNodesHtml += `
        <div class="mt-step-card ${isTarget ? 'target-highlight' : ''} ${lv === MAX_ITEM_LEVEL ? 'max-tier' : ''}" data-select-lv="${lv}">
          <div class="mt-step-left">
            <div class="mt-thumb-box">
              <img src="${m.img}" alt="${m.name}" class="mt-step-img">
              <span class="mt-lv-pill">LV.${lv}${lv === MAX_ITEM_LEVEL ? ' · MAKS' : ''}</span>
            </div>
            <div class="mt-step-info">
              <div class="mt-step-title-row">
                <strong>${m.icon} ${m.name}</strong>
                ${isTarget ? `<span class="mt-target-badge">${customerName ? `🎯 ${customerName} İstiyor` : '👁️ Seçili Kademe'}</span>` : ''}
              </div>
              <small class="mt-formula-line">${formulaText}</small>
            </div>
          </div>
          <div class="mt-step-right">
            <span class="mt-board-count ${boardCount > 0 ? 'has-item' : ''}">
              Masada: <b>${boardCount}</b>
            </span>
          </div>
        </div>
        ${lv < MAX_ITEM_LEVEL ? `<div class="mt-connector-arrow"><span>⬇ 2 Adet Birleştir ⬇</span></div>` : ''}
      `;
    }

    content.innerHTML = `
      <div class="mt-modal-header">
        <div>
          <span class="mt-eyebrow">✦ OBJE EVRİM &amp; ÜRETİM AĞACI (RECIPE TREE)</span>
          <h3>${targetMeta.chainName}</h3>
        </div>
        <button type="button" id="closeMergeTreeBtn" class="shop-close-btn">✕</button>
      </div>

      <div class="mt-chain-tabs">${chainTabsHtml}</div>

      <div class="mt-target-summary">
        <img src="${targetMeta.img}" alt="${targetMeta.name}" class="mt-hero-img">
        <div class="mt-hero-meta">
          <span class="mt-hero-lv">HEDEF OBJE · SEVİYE ${cleanLevel}${cleanLevel === MAX_ITEM_LEVEL ? ' (MAKSİMUM SEVİYE)' : ''}</span>
          <h4>${targetMeta.icon} ${targetMeta.name}</h4>
          <p>
            ${cleanLevel === 1
              ? `Bu temel obje doğrudan <b>Üretim Sandığından (-1⚡)</b> veya <b>Obje Mağazasından</b> elde edilir.`
              : `Bu objeyi üretmek için Seviye 1'den itibaren toplam <b>${totalLv1Required}× ${lv1Meta.name} (LV.1)</b> adım adım birleştirilmelidir.`}
          </p>
        </div>
      </div>

      <div class="mt-steps-scroll">
        ${treeNodesHtml}
      </div>

      <div class="mt-modal-footer">
        <button type="button" id="mtOpenShopBtn" class="mt-action-btn shop">🛍️ Ara Objeleri Mağazadan Al</button>
        <button type="button" id="mtCloseFooterBtn" class="mt-action-btn close">Tamam</button>
      </div>
    `;

    modal.style.display = 'flex';

    const closeBtn = $('closeMergeTreeBtn');
    if (closeBtn) closeBtn.onclick = () => closeMergeTreeModal();
    const closeFooterBtn = $('mtCloseFooterBtn');
    if (closeFooterBtn) closeFooterBtn.onclick = () => closeMergeTreeModal();
    const shopBtn = $('mtOpenShopBtn');
    if (shopBtn) {
      shopBtn.onclick = () => {
        closeMergeTreeModal();
        currentShopChainFilter = String(cleanType < 4 ? cleanType : 'all');
        openShopModal();
      };
    }

    content.querySelectorAll('.mt-chain-tab').forEach((tab) => {
      tab.onclick = () => {
        const nextChain = parseInt(tab.dataset.mtChain, 10);
        openMergeTreeModal(nextChain, cleanLevel, null);
      };
    });

    content.querySelectorAll('.mt-step-card').forEach((cardEl) => {
      cardEl.onclick = () => {
        const lv = parseInt(cardEl.dataset.selectLv, 10);
        openMergeTreeModal(cleanType, lv, null);
      };
    });
  }
  window.openMergeTreeModal = openMergeTreeModal;

  function closeMergeTreeModal() {
    const modal = $('mergeTreeModal');
    if (modal) modal.style.display = 'none';
  }
  window.closeMergeTreeModal = closeMergeTreeModal;

  /* ================= SEASONAL LIVE-OPS & THEME MANAGER UI (#seasonalEventBanner & #seasonalModal) ================= */
  function renderSeasonalEventBanner() {
    const banner = $('seasonalEventBanner');
    if (!banner || !window.ThemeManager) return;

    const theme = window.ThemeManager.getActiveTheme();
    const lv5Meta = getItemMeta(4, 5);
    const lv1Meta = getItemMeta(4, 1);

    const topBtn = $('seasonalThemeBtn');
    if (topBtn) {
      topBtn.innerHTML = `${theme.badge} <span>${theme.id === 'default' ? 'Etkinlik' : theme.shortName}</span>`;
    }

    banner.innerHTML = `
      <div class="seb-left" onclick="window.openSeasonalEventModal && window.openSeasonalEventModal()">
        <div class="seb-icon-wrap">
          <img src="${lv5Meta.img}" alt="${lv5Meta.name}" class="seb-thumb">
          <span class="seb-badge-dot">${theme.badge}</span>
        </div>
        <div class="seb-info">
          <div class="seb-tags">
            <span class="seb-live-pill">${theme.id === 'default' ? '🎭 CANLI ETKİNLİK MERKEZİ' : '🔥 AKTİF SEZON ETKİNLİĞİ'}</span>
            <span class="seb-3d-pill">🏛️ 3D Lobi Dekoru Aktif</span>
          </div>
          <strong>${theme.name}</strong>
          <small>${theme.description}</small>
        </div>
      </div>
      <div class="seb-actions">
        <button type="button" id="spawnSeasonalItemBtn" class="seb-spawn-btn" title="Tahtaya sınırlı süreli etkinlik objesi çıkar">
          ${lv1Meta.icon} Etkinlik Objesi Üret (-2⚡)
        </button>
        <button type="button" id="openSeasonalModalBtn" class="seb-theme-btn">
          🎨 Tema Değiştir
        </button>
      </div>
    `;

    const spawnEvBtn = $('spawnSeasonalItemBtn');
    if (spawnEvBtn) {
      spawnEvBtn.onclick = (e) => {
        e.stopPropagation();
        spawnSeasonalEventItem();
      };
    }
    const openEvBtn = $('openSeasonalModalBtn');
    if (openEvBtn) {
      openEvBtn.onclick = (e) => {
        e.stopPropagation();
        openSeasonalEventModal();
      };
    }
  }

  function spawnSeasonalEventItem() {
    if (!spend(2)) return;
    const emptySlots = [];
    state.board.forEach((it, idx) => {
      if (!it) emptySlots.push(idx);
    });
    if (emptySlots.length === 0) {
      state.energy += 2;
      sfx.reject();
      notify('⚠️ Masada boş yer yok! Etkinlik objesi çıkarmak için iki aynı objeyi birleştirin.');
      return;
    }
    const targetIdx = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    state.board[targetIdx] = { type: 4, level: 1 };
    state.itemsSpawned = (state.itemsSpawned || 0) + 1;
    state.selected = targetIdx;
    sfx.fanfare();
    const meta = getItemMeta(4, 1);
    renderAll();
    notify(`🎃 Özel Etkinlik Objesi masaya eklendi: ${meta.icon} ${meta.name} (LV.1)! Birleştirerek Seviye 5'e ulaştırın.`);
  }
  window.spawnSeasonalEventItem = spawnSeasonalEventItem;

  function openSeasonalEventModal() {
    const modal = $('seasonalModal');
    const content = $('seasonalModalContent');
    if (!modal || !content || !window.ThemeManager) return;
    sfx.pop();

    const activeTheme = window.ThemeManager.getActiveTheme();
    const allThemes = window.ThemeManager.getAllThemes();

    let themesHtml = '';
    allThemes.forEach((th) => {
      const isSelected = th.id === activeTheme.id;
      const previewImg = window.LuxuryArt ? window.LuxuryArt.getItemImage(4, 5, th.id) : 'assets/items/item_0_5.jpg';
      let chainPreviewPills = '';
      if (th.eventChain) {
        th.eventChain.forEach((cItem, idx) => {
          const cImg = window.LuxuryArt ? window.LuxuryArt.getItemImage(4, idx + 1, th.id) : '';
          chainPreviewPills += `
            <span class="sm-chain-mini" title="LV.${idx + 1}: ${cItem.name}">
              <img src="${cImg}" alt="${cItem.name}">
              <small>LV.${idx + 1}</small>
            </span>
          `;
        });
      }

      themesHtml += `
        <div class="sm-theme-card ${isSelected ? 'active' : ''}" data-theme-id="${th.id}">
          <div class="sm-card-top">
            <img src="${previewImg}" alt="${th.name}" class="sm-theme-hero">
            <div class="sm-card-titles">
              <div class="sm-badge-row">
                <span class="sm-theme-badge">${th.badge} ${th.shortName}</span>
                ${isSelected ? '<span class="sm-active-tag">✓ AKTİF TEMA</span>' : ''}
              </div>
              <h4>${th.name}</h4>
              <p>${th.description}</p>
            </div>
          </div>
          <div class="sm-chain-preview-row">
            <span class="sm-chain-label">Özel Etkinlik Evrim Zinciri (5 Kademe):</span>
            <div class="sm-chain-minis">${chainPreviewPills}</div>
          </div>
          <button type="button" class="sm-select-btn ${isSelected ? 'selected' : ''}" data-apply-theme="${th.id}">
            ${isSelected ? '✓ Şu An Aktif (3D Otel & Tahta)' : `✨ ${th.shortName} Temasını Etkinleştir`}
          </button>
        </div>
      `;
    });

    content.innerHTML = `
      <div class="mt-modal-header">
        <div>
          <span class="mt-eyebrow">✦ MERKEZİ TEMA YÖNETİCİSİ &amp; CANLI ETKİNLİKLER (SEASONAL LIVE-OPS)</span>
          <h3>🎭 Mevsimsel Etkinlik &amp; 3D Atmosfer Seçimi</h3>
        </div>
        <button type="button" id="closeSeasonalModalBtn" class="shop-close-btn">✕</button>
      </div>

      <p class="sm-intro-note">
        Seçtiğiniz özel gün teması; <b>3D Otel Lobisi dekorasyonlarını</b> (Cadılar Bayramı balkabağı aranjmanları, Sevgililer Günü çiçek kemerleri, Kış Galası kristal çamları), <b>arayüz atmosferini</b> ve <b>Merge Tahtasındaki sınırlı süreli özel etkinlik objelerini</b> anında günceller!
      </p>

      <div class="sm-themes-list">
        ${themesHtml}
      </div>

      <div class="mt-modal-footer">
        <button type="button" id="smSpawnEventBtn" class="mt-action-btn shop">${activeTheme.badge} Masaya Etkinlik Objesi Çıkar (-2⚡)</button>
        <button type="button" id="smGo3DLobbyBtn" class="mt-action-btn close">🏛️ 3D Otel Lobisinde Dekorları Gör</button>
      </div>
    `;

    modal.style.display = 'flex';

    const closeBtn = $('closeSeasonalModalBtn');
    if (closeBtn) closeBtn.onclick = () => closeSeasonalEventModal();

    const spawnBtn = $('smSpawnEventBtn');
    if (spawnBtn) {
      spawnBtn.onclick = () => {
        closeSeasonalEventModal();
        switchMainPage('pageBoard');
        spawnSeasonalEventItem();
      };
    }

    const goLobbyBtn = $('smGo3DLobbyBtn');
    if (goLobbyBtn) {
      goLobbyBtn.onclick = () => {
        closeSeasonalEventModal();
        switchMainPage('pageHotel');
        if (window.hotel3D) {
          window.hotel3D.jumpTo('lobby');
        }
      };
    }

    content.querySelectorAll('[data-apply-theme]').forEach((btn) => {
      btn.onclick = () => {
        const themeId = btn.dataset.applyTheme;
        window.ThemeManager.setTheme(themeId);
        sfx.fanfare();
        const newTheme = window.ThemeManager.getActiveTheme();
        notify(`${newTheme.badge} "${newTheme.name}" etkinleştirildi! 3D Otel Lobisi dekorasyonları ve özel etkinlik objeleri güncellendi.`);
        renderAll();
        openSeasonalEventModal();
      };
    });
  }
  window.openSeasonalEventModal = openSeasonalEventModal;

  function closeSeasonalEventModal() {
    const modal = $('seasonalModal');
    if (modal) modal.style.display = 'none';
  }
  window.closeSeasonalEventModal = closeSeasonalEventModal;

  /* ================= PHOTOREALISTIC QUESTS & 3D GRAND CHEST SHOWCASE ================= */
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
              <span class="chest-eyebrow">✦ 3D BÜYÜK KRALİYET HAZİNE SANDIĞI</span>
              <h5>3 Görev Tamamla, 3D Sandığı Aç! (${progressInCycle}/${chestGoal})</h5>
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
            ${chestReady ? '🎁 3D SANDIĞI AÇ' : `${progressInCycle}/${chestGoal} GÖREV`}
          </button>
        </div>
      `;

      const chestBtn = $('claimGrandChestBtn');
      if (chestBtn && chestReady) {
        chestBtn.onclick = (e) => {
          e.preventDefault();
          state.chestClaims = (state.chestClaims || 0) + 1;
          const bonusType = state.chestClaims % itemChains.length;
          const giveRes = giveItemToPlayer(bonusType, 3, 'Büyük Kraliyet Görev Sandığı');
          sfx.fanfare();
          addCurrencyRewards({ energy: 120, coins: 750, gems: 10, stars: 2 }, 'Büyük Kraliyet Görev Sandığı');
          addXP(80, e.clientX, e.clientY);
          notify('🎉 3D BÜYÜK KRALİYET SANDIĞI AÇILDI! +$750 Prestij, +120 Enerji, +10 Elmas, +2 Yıldız ve Nadir Obje kazandın!');
          renderAll();

          if (window.RewardChest3D && typeof window.RewardChest3D.open === 'function') {
            window.RewardChest3D.open({
              title: 'BÜYÜK KRALİYET HAZİNE SANDIĞI!',
              subtitle: '3 görevi başarıyla tamamladın! 3D Hazine Sandığından yükselen ödüllerin:',
              rewards: [
                { icon: '💰', label: '+$750 Prestij', img: 'assets/rewards/reward_prestige.jpg', color: '#fbbf24' },
                { icon: '💎', label: '+10 Elmas', img: 'assets/rewards/reward_gems.jpg', color: '#ec4899' },
                { icon: giveRes.meta.icon, label: `${giveRes.meta.name} (LV.3)`, img: giveRes.meta.img, color: '#a855f7' },
                { icon: '⭐', label: '+2 Yıldız & +120⚡', img: 'assets/rewards/reward_star.jpg', color: '#38bdf8' }
              ]
            });
          }
        };
      }
    }

    // 2. Render Strictly Sequential Photorealistic Quest Chain (Sıra 1 -> Sıra 2 -> Sıra 3 -> Sıra 4 -> Sıra 5)
    if (typeof state.activeQuestSeqIndex !== 'number') {
      state.activeQuestSeqIndex = 0;
    }
    if (typeof state.questCycle !== 'number' || state.questCycle < 1) {
      state.questCycle = 1;
    }

    const activeSeqIdx = Math.max(0, Math.min(tasks.length - 1, state.activeQuestSeqIndex));
    const cycle = state.questCycle;

    tasks.forEach((t, idx) => {
      const isCompletedInCycle = idx < activeSeqIdx;
      const isActiveQuest = idx === activeSeqIdx;
      const isLockedQuest = idx > activeSeqIdx;

      const cumulativeGoal = t.baseGoal * cycle;
      const rawCount = getTaskMetricValue(t.metric);
      const done = isActiveQuest && rawCount >= cumulativeGoal;
      const pct = isCompletedInCycle
        ? 100
        : (isLockedQuest ? 0 : Math.min(100, Math.round((rawCount / cumulativeGoal) * 100)));

      // Scale rewards with cycle
      const scale = 1 + (cycle - 1) * 0.35;
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

      const seqStatusPill = isCompletedInCycle
        ? `<span class="quest-stage-pill" style="background:rgba(16,185,129,0.25);border-color:#10b981;color:#6ee7b7;">✅ SIRA ${idx + 1}/${tasks.length} TAMAMLANDI</span>`
        : (isActiveQuest
            ? `<span class="quest-stage-pill" style="background:rgba(245,158,11,0.28);border-color:#ffd700;color:#fde68a;">🎯 AKTİF GÖREV · SIRA ${idx + 1}/${tasks.length}</span>`
            : `<span class="quest-stage-pill" style="background:rgba(100,116,139,0.25);border-color:#64748b;color:#cbd5e1;">🔒 SIRADAKİ · SIRA ${idx + 1}/${tasks.length}</span>`);

      const progTextHtml = isCompletedInCycle
        ? `<span class="quest-prog-text" style="color:#6ee7b7;"><b>✅ Bu görev tamamlandı!</b></span>`
        : (isActiveQuest
            ? `<span class="quest-prog-text">İlerleme: <b>${Math.min(rawCount, cumulativeGoal)} / ${cumulativeGoal}</b> (%${pct})</span>`
            : `<span class="quest-prog-text" style="color:#94a3b8;">🔒 Önce <b>Sıra ${activeSeqIdx + 1}</b> görevini tamamlayın</span>`);

      const btnLabel = isCompletedInCycle
        ? '✓ TAMAMLANDI'
        : (isActiveQuest
            ? (done ? '🎁 ÖDÜLÜ AL & SIRADAKİNE GEÇ' : `DEVAM EDİYOR (${Math.min(rawCount, cumulativeGoal)}/${cumulativeGoal})`)
            : `🔒 SIRA #${idx + 1} KİLİTLİ`);

      const d = document.createElement('div');
      d.className = `task-item photoreal-quest-card ${done ? 'quest-ready' : ''} ${isLockedQuest ? 'quest-seq-locked' : ''} ${isCompletedInCycle ? 'quest-seq-done' : ''}`;
      if (isLockedQuest) {
        d.style.opacity = '0.68';
      }
      d.innerHTML = `
        <div class="quest-banner-top" style="background-image: linear-gradient(90deg, rgba(11,14,22,0.92) 22%, rgba(11,14,22,0.35) 100%), url('${t.bgImg}');">
          <img src="${t.subjectImg}" alt="${t.name}" class="quest-subject-thumb">
          <div class="quest-banner-titles">
            <div class="quest-tags-row">
              <span class="quest-area-pill">${t.areaTag}</span>
              ${seqStatusPill}
            </div>
            <h5 class="t-name">${idx + 1}. ${t.name}</h5>
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
            ${progTextHtml}
            <button class="t-claim-btn ${done ? 'ready-pulse' : ''}" ${!done ? 'disabled' : ''}>
              ${btnLabel}
            </button>
          </div>
        </div>
      `;

      const claimBtn = d.querySelector('.t-claim-btn');
      if (claimBtn && done) {
        claimBtn.onclick = (e) => {
          e.preventDefault();
          state.totalQuestsClaimed = (state.totalQuestsClaimed || 0) + 1;

          // Advance strictly to the next quest in sequence!
          if (state.activeQuestSeqIndex + 1 < tasks.length) {
            state.activeQuestSeqIndex = state.activeQuestSeqIndex + 1;
          } else {
            state.activeQuestSeqIndex = 0;
            state.questCycle = (state.questCycle || 1) + 1;
          }

          addCurrencyRewards(
            { energy: rEnergy, coins: rCoins, gems: rGems, stars: rStars },
            `Sıralı Görev #${idx + 1} Tamamlandı: ${t.name}`
          );
          sfx.fanfare();
          if (e.clientX && e.clientY) {
            showFloatingText(`🎁 +$${rCoins} & +${rEnergy}⚡`, e.clientX, e.clientY);
          }
          addXP(40, e.clientX, e.clientY);
          const nextQuestName = tasks[state.activeQuestSeqIndex] ? tasks[state.activeQuestSeqIndex].name : '';
          notify(`🎉 Görev #${idx + 1} ("${t.name}") tamamlandı! Sıradaki görev açıldı: "${nextQuestName}"`);
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

    renderSpawnerControls();
    renderWheelCooldownUI();
  }

  function renderAll() {
    renderStats();
    renderSeasonalEventBanner();
    renderRewardQueueBanner();
    renderOrders();
    renderBoard();
    renderHotelPage();
    renderTasks();
    save();
  }

  /* ================= IMMERSIVE FULLSCREEN & PORTRAIT ORIENTATION LOCK ================= */
  function enterImmersiveMode(fromButton = false) {
    try {
      const docEl = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else if (fromButton) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) {}
  }
  window.enterImmersiveMode = enterImmersiveMode;

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
        if (tab.dataset.action === 'openShop') {
          openShopModal();
          return;
        }
        switchMainPage(tab.dataset.target);
      };
    });
  }

  function initUI() {
    const spawnBtn = $('spawnBtn');
    if (spawnBtn) spawnBtn.onclick = () => spawnItem();

    const skipSpawnerBtn = $('skipSpawnerCooldownBtn');
    if (skipSpawnerBtn) skipSpawnerBtn.onclick = () => skipSpawnerCooldownWithGems();

    const sortBtn = $('sortBoardBtn');
    if (sortBtn) sortBtn.onclick = () => sortBoard();

    const openShopBtn = $('openShopBtn');
    if (openShopBtn) openShopBtn.onclick = () => openShopModal();

    const seasonalThemeBtn = $('seasonalThemeBtn');
    if (seasonalThemeBtn) seasonalThemeBtn.onclick = () => openSeasonalEventModal();

    const addEnergyBtn = $('addEnergyBtn');
    if (addEnergyBtn) addEnergyBtn.onclick = () => openAdModal();

    const fullscreenBtn = $('fullscreenBtn');
    if (fullscreenBtn) fullscreenBtn.onclick = () => enterImmersiveMode(true);

    // Auto-request immersive portrait mode on first touch on mobile/tablet
    let firstTouchDone = false;
    window.addEventListener('pointerdown', () => {
      if (!firstTouchDone) {
        firstTouchDone = true;
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
          enterImmersiveMode(false);
        }
      }
    }, { passive: true });

    // Click on Prestige wallet pill to view authoritative Financial Ledger
    const coinsBox = document.querySelector('.currency-strip .curr-box:nth-child(2)');
    if (coinsBox) {
      coinsBox.style.cursor = 'pointer';
      coinsBox.title = 'Kasa Defteri ve Finans Raporunu Aç';
      coinsBox.onclick = () => {
        if (window.GameEconomy) window.GameEconomy.openLedgerModal();
      };
    }

    // Click on Gems wallet pill to open Object & Gem Time-Skip Shop
    const gemsBox = document.querySelector('.currency-strip .curr-box:nth-child(3)');
    if (gemsBox) {
      gemsBox.style.cursor = 'pointer';
      gemsBox.title = 'Obje Mağazası ve Zaman Atlama Marketini Aç';
      gemsBox.onclick = () => openShopModal();
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
