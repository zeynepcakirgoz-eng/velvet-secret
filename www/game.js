(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const MAX_ENERGY = 500;
  const ENERGY_INTERVAL = 60000;

  // Web Audio API Synthesizer for rich sound effects (no external MP3s needed)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
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
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.08);
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
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.06 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.2);
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
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.4);
        });
      } catch (e) {}
    }
  };

  // 3 Distinct Luxury Merge Item Chains (6 levels each)
  const itemChains = [
    // Chain 0: Kozmetik & Bakım
    [
      { name: 'Nemlendirici', icon: '🧴' },
      { name: 'Mat Ruj', icon: '💄' },
      { name: 'Kırmızı Oje', icon: '💅' },
      { name: 'Lüks Parfüm', icon: '✨' },
      { name: 'Altın Ayna', icon: '🪞' },
      { name: 'Elmas Kozmetik Seti', icon: '💖' }
    ],
    // Chain 1: Mücevher & Aksesuar
    [
      { name: 'Gümüş Yüzük', icon: '💍' },
      { name: 'İnci Kolye', icon: '📿' },
      { name: 'Zümrüt Broş', icon: '💎' },
      { name: 'Kraliçe Tacı', icon: '👑' },
      { name: 'Zümrüt Kupa', icon: '🏆' },
      { name: 'Kraliyet Asası', icon: '⚜️' }
    ],
    // Chain 2: Lüks Sosyete
    [
      { name: 'Mühürlü Davet', icon: '💌' },
      { name: 'Kristal Kadeh', icon: '🥂' },
      { name: 'Eski Şampanya', icon: '🍾' },
      { name: 'İpek Topuklu', icon: '👠' },
      { name: 'Spor Araba', icon: '🏎️' },
      { name: 'Lüks Mega Yat', icon: '🛥️' }
    ]
  ];

  function getItemMeta(type, level) {
    const chain = itemChains[type % itemChains.length];
    const lvlIdx = Math.max(0, Math.min(chain.length - 1, (level || 1) - 1));
    return chain[lvlIdx];
  }

  const tasks = [
    { id: 'merge', name: 'Kusursuz Birleşim', desc: 'Masanızdaki objeleri birleştirin', goal: 4, reward: 50, metric: 'merges' },
    { id: 'jewel', name: 'Göz Alıcı Lüks', desc: 'Seviye 3 veya üstü bir obje üretin', goal: 2, reward: 80, metric: 'highLevels' },
    { id: 'order', name: 'VIP Sipariş', desc: 'Misafir siparişlerini tamamlayın', goal: 2, reward: 70, metric: 'orders' }
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

  function initialState() {
    // 5x5 board with some starting items
    const board = Array.from({ length: 25 }, (_, i) => {
      if (i % 5 === 0 || i % 7 === 0) {
        return { type: Math.floor(Math.random() * itemChains.length), level: 1 };
      }
      return null;
    });

    return {
      energy: 500,
      energyUpdated: Date.now(),
      prestige: 1200,
      gems: 10,
      playerLevel: 1,
      xp: 0,
      board,
      selected: null,
      merges: 0,
      highLevels: 0,
      orders: 0,
      claimed: [],
      storyChoice: null,
      hotel: 1,
      notice: 'Hoş geldin! İki aynı objeyi sürükleyip birleştir veya Lüks Sandık ile yeni obje üret.',
      storyTitle: 'Bir davet, bin sır…',
      storyText: 'Açılış gecesinde Isabella Laurent, masada unutulmuş mühürlü bir mektup buldu. Bu gece herkesin sakladığı bir şey var.',
      log: 'Henüz bir seçim yapmadın. Her karar hikâyenin yönünü değiştirecek.'
    };
  }

  function load() {
    try {
      const raw = safeStorage.getItem('velvetSecretsSaveV2');
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
      safeStorage.setItem('velvetSecretsSaveV2', JSON.stringify(state));
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
    const needed = state.playerLevel * 50;
    if (clientX && clientY) {
      showFloatingText(`+${amount} XP`, clientX, clientY);
    }
    if (state.xp >= needed) {
      state.xp -= needed;
      state.playerLevel++;
      state.energy = Math.min(MAX_ENERGY, state.energy + 100);
      state.gems += 5;
      state.prestige += 300;
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

  function renderStats() {
    tick();
    if ($('energy')) $('energy').textContent = state.energy;
    if ($('coins')) $('coins').textContent = state.prestige;
    if ($('gems')) $('gems').textContent = state.gems;

    const left = state.energy >= MAX_ENERGY ? 60 : 60 - Math.floor((Date.now() - state.energyUpdated) / 1000) % 60;
    if ($('timer')) $('timer').textContent = '00:' + String(left).padStart(2, '0');

    if ($('playerLevelBadge')) $('playerLevelBadge').textContent = `OYUNCU SEVİYESİ ${state.playerLevel}`;
    const xpNeeded = state.playerLevel * 50;
    const pct = Math.min(100, (state.xp / xpNeeded) * 100);
    if ($('xpBar')) $('xpBar').style.width = `${pct}%`;

    if ($('storyTitle')) $('storyTitle').textContent = state.storyTitle;
    if ($('storyText')) $('storyText').textContent = state.storyText;
    if ($('log')) $('log').textContent = state.log;

    if ($('hotelLevel')) $('hotelLevel').textContent = 'Seviye ' + state.hotel;
    if ($('hotelTitle')) {
      $('hotelTitle').textContent =
        state.hotel === 1 ? 'Lobi — ilk adım' : state.hotel === 2 ? 'Altın Salon — yenilendi' : 'Aurelia Terası — açıldı';
    }
    if ($('hotelText')) {
      $('hotelText').textContent =
        state.hotel === 1
          ? 'Prestij biriktirerek otelin yeni bölümlerini aç.'
          : state.hotel === 2
          ? 'Lobi yenilendi. Şimdi konukların gözdesi olan terasa hazırlan.'
          : 'Terasın ışıkları tüm körfezi aydınlatıyor.';
    }
    if ($('renovate')) {
      $('renovate').textContent =
        state.hotel === 1 ? 'Lobiyi yenile · 300 ◆' : state.hotel === 2 ? 'Terasa erişim aç · 500 ◆' : 'Tüm alanlar yenilendi ✦';
      $('renovate').disabled = state.hotel >= 3;
    }

    document.querySelectorAll('[data-choice]').forEach((b) => {
      b.disabled = !!state.storyChoice;
    });
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
      const count = t.metric === 'merges' ? state.merges : t.metric === 'highLevels' ? state.highLevels : state.orders;
      const done = count >= t.goal;
      const claimed = state.claimed.includes(t.id);
      const pct = Math.min(100, (count / t.goal) * 100);

      const d = document.createElement('div');
      d.className = 'task';
      d.innerHTML = `
        <div class="tasktop">
          <span class="taskname">${t.name}</span>
          <span class="reward">⚡ +${t.reward} enerji</span>
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
          state.claimed.push(t.id);
          state.energy = Math.min(MAX_ENERGY, state.energy + t.reward);
          state.prestige += 80;
          sfx.coin();
          notify(`Görev tamamlandı! +${t.reward} Enerji ve +80 Prestij kazandın.`);
          addXP(25);
          renderAll();
        };
      }
      el.appendChild(d);
    });
  }

  function renderAll() {
    renderStats();
    renderBoard();
    renderTasks();
    save();
  }

  function spend(n) {
    tick();
    if (state.energy < n) {
      notify('Enerjin bitti! Üstteki "Ücretsiz Enerji Al" butonuna basarak reklam izleyebilirsin.');
      return false;
    }
    state.energy -= n;
    if (state.energy < MAX_ENERGY && state.energyUpdated > Date.now()) {
      state.energyUpdated = Date.now();
    }
    return true;
  }

  // Spawner: Drop a new Lv 1 item on the board
  function spawnItem() {
    if (!spend(1)) return;

    // Find first empty slot
    const emptyIndices = [];
    state.board.forEach((item, idx) => {
      if (!item) emptyIndices.push(idx);
    });

    if (emptyIndices.length === 0) {
      state.energy += 1; // refund
      notify('Masa tamamen dolu! İki aynı objeyi birleştirerek yeni yer açın.');
      return;
    }

    const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
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

  // Core Merge & Move Logic
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

    // Drop on empty slot -> Move
    if (!target) {
      state.board[toIdx] = source;
      state.board[fromIdx] = null;
      state.selected = null;
      sfx.pop();
      renderAll();
      notify('Obje yeni alana taşındı.');
      return;
    }

    // Same type & same level -> MERGE!
    if (source.type === target.type && source.level === target.level) {
      const newLevel = target.level + 1;
      state.board[toIdx] = { type: target.type, level: newLevel };
      state.board[fromIdx] = null;
      state.selected = null;
      state.merges++;

      if (newLevel >= 3) state.highLevels++;
      state.prestige += newLevel * 20;

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

    // Different item -> SWAP positions
    state.board[toIdx] = source;
    state.board[fromIdx] = target;
    state.selected = null;
    sfx.pop();
    renderAll();
    notify('Objelerin yerleri değiştirildi.');
  }

  // Unified Drag-and-Drop & Tap Controller using Pointer Events
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

      // If tapping on an empty slot while an item was selected, move it
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

      // Start drag ghost once moved > 8px
      if (dist > 8) {
        isDragging = true;
        const meta = getItemMeta(item.type, item.level);
        ghost.innerHTML = `<span class="emoji">${meta.icon}</span><span class="lv">LV.${item.level}</span>`;
        ghost.style.display = 'flex';
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;

        const sourceEl = board.querySelector(`[data-index="${dragSourceIdx}"]`);
        if (sourceEl) sourceEl.classList.add('drag-source');

        // Highlight element under pointer
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
        // Dropped: find target tile under cursor
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
        // Simple TAP: toggle selection
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
            notify(`${meta.icon} ${meta.name} seçildi. Birleştirmek için eşleşen bir objeye dokun veya sürükle.`);
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

  // Rewarded Ad Simulation (5 seconds timer with rewards)
  function initRewardedAd() {
    const triggerBtn = $('watchAdBtn');
    const modal = $('adModal');
    const countdownEl = $('adCountdown');
    const claimBtn = $('adClaimBtn');

    if (!triggerBtn || !modal || !countdownEl || !claimBtn) return;

    let countdownTimer = null;

    triggerBtn.onclick = () => {
      sfx.pop();
      modal.style.display = 'flex';
      let secondsLeft = 5;
      claimBtn.disabled = true;
      claimBtn.textContent = `Ödül İçin Bekleyin (${secondsLeft})`;
      countdownEl.textContent = `${secondsLeft} sn`;

      if (countdownTimer) clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          countdownEl.textContent = `${secondsLeft} sn`;
          claimBtn.textContent = `Ödül İçin Bekleyin (${secondsLeft})`;
        } else {
          clearInterval(countdownTimer);
          countdownEl.textContent = 'Tamamlandı!';
          claimBtn.disabled = false;
          claimBtn.textContent = '🎁 50 Enerji & 200 Prestij Al!';
          sfx.fanfare();
        }
      }, 1000);
    };

    claimBtn.onclick = () => {
      modal.style.display = 'none';
      state.energy = Math.min(MAX_ENERGY, state.energy + 50);
      state.prestige += 200;
      sfx.coin();
      notify('Reklam ödülü hesabına tanımlandı: +50 Enerji ve +200 Prestij!');
      addXP(30);
      renderAll();
    };
  }

  // Setup Static UI Events
  function initUIEvents() {
    // Spawner Button
    const spawnBtn = $('spawnBtn');
    if (spawnBtn) {
      spawnBtn.onclick = (e) => {
        e.preventDefault();
        spawnItem();
      };
    }

    // Order Completion
    const orderBtn = $('order');
    if (orderBtn) {
      orderBtn.onclick = (e) => {
        e.preventDefault();
        if (state.orders >= 8) {
          notify('Bu bölümün tüm müşteri siparişleri tamamlandı! Yeni siparişler için oteli geliştir.');
          return;
        }
        if (!spend(5)) return;
        state.orders++;
        state.prestige += 150;
        state.energy = Math.min(MAX_ENERGY, state.energy + 25);
        sfx.coin();

        state.storyTitle = state.orders === 1 ? 'Gizemli Bir Misafir' : 'Gece Yarısı Gelen Mesaj';
        state.storyText =
          state.orders === 1
            ? 'Adrian Vale, Isabella’ya özel bir sipariş bıraktı. İçindeki mühürlü notta üç kelime vardı: “Ona güvenme, Isabella.”'
            : 'Bir mesaj tüm geceyi değiştirdi. Birisi otelin güvenlik kayıtlarını görmek istiyor. Kimin tarafında olacaksın?';

        addXP(25);
        renderAll();
        notify('Sipariş başarıyla teslim edildi! +150 Prestij ve +25 Enerji kazandın.');
      };
    }

    // Rearrange Board Button
    const refreshBtn = $('refresh');
    if (refreshBtn) {
      refreshBtn.onclick = (e) => {
        e.preventDefault();
        if (!spend(10)) return;
        const filled = state.board.filter(Boolean);
        for (let i = filled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filled[i], filled[j]] = [filled[j], filled[i]];
        }
        let k = 0;
        state.board = state.board.map((x) => (x ? filled[k++] : null));
        state.selected = null;
        sfx.pop();
        renderAll();
        notify('Masa yeniden düzenlendi. Yeni birleşimler oluşturmaya devam et!');
      };
    }

    // Story Choices
    document.querySelectorAll('[data-choice]').forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        if (state.storyChoice) {
          notify('Bu bölümde kararını zaten verdin. Yeni kararlar sonraki bölümlerde açılacak.');
          return;
        }
        state.storyChoice = b.dataset.choice;
        sfx.fanfare();
        if (state.storyChoice === 'love') {
          state.prestige += 100;
          state.log =
            'Isabella mektubu Adrian’a gösterdi. Adrian’ın bakışlarında hem korku hem şefkat vardı. “Sana anlatmam gereken bir şey var,” dedi. Güven bağı kuruldu (+100 Prestij).';
        } else if (state.storyChoice === 'gossip') {
          state.prestige += 200;
          state.log =
            'Isabella davetteki fısıltıların izini sürdü. Bir davetli ona gizli kasanın şifresini fısıldadı (+200 Prestij). Bu bilgi yakında büyük bir koz olacak!';
        } else {
          state.gems += 3;
          state.log =
            'Isabella acele etmedi. Mührü dikkatle inceleyince otelin gizli mahzenine ait bir işaret buldu (+3 Mücevher).';
        }
        addXP(40);
        renderAll();
        notify('Kritik kararın hikâyeyi değiştirdi!');
      };
    });

    // Hotel Renovation
    const renovateBtn = $('renovate');
    if (renovateBtn) {
      renovateBtn.onclick = (e) => {
        e.preventDefault();
        if (state.hotel >= 3) return;
        const cost = state.hotel === 1 ? 300 : 500;
        if (state.prestige < cost) {
          notify(`Yetersiz prestij! Lobiyi yenilemek için ${cost} ◆ prestij gerekiyor.`);
          return;
        }
        state.prestige -= cost;
        state.hotel++;
        sfx.fanfare();
        if (state.hotel === 2) {
          state.storyTitle = 'Altın Salon Açıldı!';
          state.storyText =
            'Lobi yenilendi ve konuklar akın etti. Açılış gecesinin davetli listesinde silinmiş bir isim ortaya çıktı: Adrian Vale.';
        } else {
          state.storyTitle = 'Terasın Ardındaki Büyük Sır';
          state.storyText =
            'Aurelia Terası ışık saçıyor. Körfeze bakan en özel masada yeni bir mühürlü zarf duruyor...';
        }
        addXP(50);
        renderAll();
        notify('Otel yeni bir seviyeye kavuştu! Yeni misafirler ve siparişler açıldı.');
      };
    }

    // Close Level Up Modal Button
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

  // Game Initializer
  function init() {
    load();
    renderAll();
    initDragAndDrop();
    initRewardedAd();
    initUIEvents();

    // Stats updater (every second without redrawing board elements)
    setInterval(renderStats, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();