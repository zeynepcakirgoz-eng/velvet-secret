// ========================================================
// VELVET SECRETS - CENTRAL AUTHORITATIVE GAME ECONOMY
// Shared Wallet, Dual Income Engine, 4-Level Area Progression
// & Transaction Ledger
// ========================================================

class GameEconomyManager {
    constructor() {
        this.storageKey = 'velvet_authoritative_economy_v4';
        this.listeners = [];

        this.levelTitles = {
            1: 'Seviye 1: Başlangıç Durumu (Eski)',
            2: 'Seviye 2: Modern Yenileme',
            3: 'Seviye 3: Premium Tasarım',
            4: 'Seviye 4: Kraliyet Lüksü (MAX)'
        };

        // All 11 hotel renovation areas & multi-level costs visible from day 1
        this.renovationCosts = {
            reception_desk: {
                id: 'reception_desk',
                name: 'Otel Girişi & Resepsiyon Masası',
                area: 'Giriş & Resepsiyon',
                cost: 1500,
                levelCosts: { 2: 1500, 3: 2400, 4: 3600 },
                stars: 2,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                defaultDesc: 'Seviye 1: Eski ve Yıpranmış Ahşap Resepsiyon Masası'
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                name: 'Lobi & Lounge Protokol Halısı',
                area: 'Büyük Lobi & Lounge',
                cost: 600,
                levelCosts: { 2: 600, 3: 1100, 4: 1800 },
                stars: 2,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_carpet.jpg',
                defaultDesc: 'Seviye 1: Yıpranmış Ham Mermer Zemin'
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                name: 'Büyük Lobi Kristal Tavan Avizesi',
                area: 'Büyük Lobi & Lounge',
                cost: 1000,
                levelCosts: { 2: 1000, 3: 1700, 4: 2600 },
                stars: 3,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_chandelier.jpg',
                defaultDesc: 'Seviye 1: Çıplak Sarkıt Ampul'
            },
            room101_bed: {
                id: 'room101_bed',
                name: 'Misafir Suiti Kraliyet Yatak Takımı',
                area: 'Misafir Odaları & Suitler (Oda 101)',
                cost: 1800,
                levelCosts: { 2: 1800, 3: 2900, 4: 4200 },
                stars: 4,
                jumpRoom: 'room101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                defaultDesc: 'Seviye 1: Eski Gıcırdayan Demir Karyola'
            },
            room101_decor: {
                id: 'room101_decor',
                name: 'Suit 101 Panoramik Teras & Lounge',
                area: 'Misafir Odaları & Suitler (Oda 101)',
                cost: 900,
                levelCosts: { 2: 900, 3: 1500, 4: 2300 },
                stars: 3,
                jumpRoom: 'room101',
                sceneImg: 'assets/scene_suite_terrace.jpg',
                defaultDesc: 'Seviye 1: Boş ve Bakımsız Teras Köşesi'
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                name: 'Restoran & Mutfak Gurme Masaları',
                area: 'Riviera Restoran & Mutfak',
                cost: 1200,
                levelCosts: { 2: 1200, 3: 1950, 4: 2900 },
                stars: 3,
                jumpRoom: 'restaurant',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                defaultDesc: 'Seviye 1: Eski ve Çizik Ahşap Masalar'
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                name: 'Riviera Kokteyl & Şampanya Barı',
                area: 'Riviera Restoran & Mutfak',
                cost: 1400,
                levelCosts: { 2: 1400, 3: 2200, 4: 3300 },
                stars: 4,
                jumpRoom: 'restaurant',
                sceneImg: 'assets/scene_restaurant_bar.jpg',
                defaultDesc: 'Seviye 1: Terk Edilmiş Eski Bar Tezgahı'
            },
            swimming_pool: {
                id: 'swimming_pool',
                name: 'Aurelia Sonsuzluk Havuzu & Kabanalar',
                area: 'Yüzme Havuzu & Güneş Terası',
                cost: 5000,
                levelCosts: { 2: 5000, 3: 7500, 4: 10500 },
                stars: 5,
                jumpRoom: 'pool',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                defaultDesc: 'Seviye 1: Kuru ve Bakımsız Havuz Çukuru'
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                name: 'Zen Termal Spa & Mermer Jakuzi',
                area: 'Spa & Wellness Merkezi',
                cost: 2800,
                levelCosts: { 2: 2800, 3: 4400, 4: 6400 },
                stars: 4,
                jumpRoom: 'spa',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                defaultDesc: 'Seviye 1: Hizmet Dışı Eski Termal Havuz'
            },
            garden_courtyard: {
                id: 'garden_courtyard',
                name: 'Akdeniz Botanik Bahçesi & Mermer Çeşme',
                area: 'Bahçe & Açık Alanlar',
                cost: 3000,
                levelCosts: { 2: 3000, 3: 4600, 4: 6800 },
                stars: 4,
                jumpRoom: 'garden',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                defaultDesc: 'Seviye 1: Kurumuş Bahçe Avlusu ve Susuz Çeşme'
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                name: '2. Kat Kraliyet Penthouse & Piyano Salonu',
                area: 'Başkanlık Çatı Suiti',
                cost: 6500,
                levelCosts: { 2: 6500, 3: 9800, 4: 14000 },
                stars: 6,
                jumpRoom: 'penthouse',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                defaultDesc: 'Seviye 1: Terk Edilmiş Tozlu Çatı Katı'
            }
        };

        this.load();
        this.initHotelOperationsLoop();
    }

    load() {
        const defaultData = {
            balance: 750,
            stars: 6,
            hotelRevenuePerMin: 45,
            totalHotelIncome: 450,
            totalOrderIncome: 300,
            totalRenovationSpent: 0,
            targetRenovationId: 'restaurant_tables',
            notifiedRenovations: {},
            transactions: [
                {
                    id: 'tx_init_1',
                    type: 'hotel_income',
                    amount: 450,
                    source: 'Otel Operasyonları',
                    desc: 'Deluxe Suit oda rezervasyonu ve lobi başlangıç fonu',
                    timestamp: Date.now() - 3600000
                },
                {
                    id: 'tx_init_2',
                    type: 'order_reward',
                    amount: 300,
                    source: 'Müşteri Siparişi',
                    desc: 'Adrian Vale açılış gecesi sipariş teslimatı (+⭐2)',
                    timestamp: Date.now() - 1800000
                }
            ]
        };

        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
            try {
                this.data = Object.assign(defaultData, JSON.parse(raw));
                if (!this.data.notifiedRenovations) this.data.notifiedRenovations = {};
            } catch (e) {
                this.data = defaultData;
            }
        } else {
            this.data = defaultData;
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {}
        this.notifyListeners();
    }

    notifyListeners() {
        this.listeners.forEach(fn => {
            try { fn(this); } catch (e) { console.error('Economy listener error:', e); }
        });
        this.updateGlobalHUD();
    }

    subscribe(fn) {
        this.listeners.push(fn);
        fn(this);
    }

    getBalance() {
        return this.data.balance;
    }

    getStars() {
        return this.data.stars;
    }

    // Returns current level (1..4) of an area independently
    getAreaLevel(id) {
        if (window.hotel3D && window.hotel3D.getAreaLevel) {
            return window.hotel3D.getAreaLevel(id);
        }
        return 1;
    }

    // Returns exact cost for the area's NEXT upgrade level (Level 1->2, 2->3, 3->4)
    getNextUpgradeCost(id) {
        const item = this.renovationCosts[id];
        if (!item) return 1200;
        const currentLvl = this.getAreaLevel(id);
        const nextLvl = Math.min(4, currentLvl + 1);
        if (item.levelCosts && item.levelCosts[nextLvl]) {
            return item.levelCosts[nextLvl];
        }
        return item.cost;
    }

    getNextUpgradeStars(id) {
        const item = this.renovationCosts[id];
        if (!item) return 2;
        const currentLvl = this.getAreaLevel(id);
        return item.stars + Math.max(0, currentLvl - 1);
    }

    getTargetRenovation() {
        return this.data.targetRenovationId || 'restaurant_tables';
    }

    setTargetRenovation(id) {
        if (!this.renovationCosts[id]) return;
        this.data.targetRenovationId = id;
        this.save();
        this.showIncomeToast('🎯 Yeni Hedef Belirlendi', this.renovationCosts[id].name);
    }

    canAfford(costCoins, costStars = 0) {
        return (this.data.balance >= costCoins && this.data.stars >= costStars);
    }

    // ----------------------------------------------------
    // INCOME SOURCE 1: HOTEL OPERATIONAL INCOME
    // ----------------------------------------------------
    addHotelIncome(amount, description, guestName = 'Otel Misafiri') {
        if (amount <= 0) return;
        this.data.balance += amount;
        this.data.totalHotelIncome += amount;

        const tx = {
            id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: 'hotel_income',
            amount: amount,
            source: 'Otel Operasyonu',
            desc: description || `${guestName} konaklama & servis geliri`,
            timestamp: Date.now()
        };
        this.data.transactions.unshift(tx);
        if (this.data.transactions.length > 60) this.data.transactions.pop();

        this.save();
        this.showIncomeToast(`🏨 Otel Geliri: +$${amount}`, tx.desc);
        this.checkAffordableThresholds();
    }

    // ----------------------------------------------------
    // INCOME SOURCE 2: CUSTOMER ORDERS (GOSSIP HARBOR MERGE)
    // ----------------------------------------------------
    completeCustomerOrder(orderId, rewardCash, rewardStars, customerName) {
        if (rewardCash <= 0 && rewardStars <= 0) return;
        this.data.balance += rewardCash;
        this.data.stars += rewardStars;
        this.data.totalOrderIncome += rewardCash;

        const tx = {
            id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: 'order_reward',
            amount: rewardCash,
            source: 'Müşteri Siparişi',
            desc: `${customerName} sosyete siparişi teslim edildi (+⭐${rewardStars})`,
            timestamp: Date.now()
        };
        this.data.transactions.unshift(tx);
        if (this.data.transactions.length > 60) this.data.transactions.pop();

        this.save();
        this.showIncomeToast(`🛍️ Sipariş Teslimi: +$${rewardCash}`, `${customerName} memnun kaldı (+⭐${rewardStars})`);
        this.checkAffordableThresholds();
    }

    // ----------------------------------------------------
    // RENOVATION EXPENDITURE (EXACT SINGLE DEDUCTION)
    // ----------------------------------------------------
    purchaseRenovation(areaId, optionId, costCash, costStars, optionName) {
        if (this.data.balance < costCash || this.data.stars < costStars) {
            return { success: false, reason: 'insufficient_funds' };
        }

        this.data.balance -= costCash;
        this.data.stars -= costStars;
        this.data.totalRenovationSpent += costCash;

        const tx = {
            id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: 'renovation_expense',
            amount: -costCash,
            source: 'Otel Restorasyonu',
            desc: `${optionName} satın alımı & montajı tamamlandı`,
            timestamp: Date.now()
        };
        this.data.transactions.unshift(tx);
        if (this.data.transactions.length > 60) this.data.transactions.pop();

        this.save();
        return { success: true, remainingBalance: this.data.balance };
    }

    // ----------------------------------------------------
    // AUTOMATIC HOTEL OPERATIONS SIMULATION TICK
    // ----------------------------------------------------
    initHotelOperationsLoop() {
        setInterval(() => {
            this.simulateGuestActivity();
        }, 24000);
    }

    simulateGuestActivity() {
        const events = [
            { desc: 'Suit 101 konaklama ve oda servisi faturası ödendi', minAmt: 140, maxAmt: 260 },
            { desc: 'Riviera Restoran gurme akşam yemeği & şampanya hesabı', minAmt: 95, maxAmt: 200 },
            { desc: 'Aurelia Resepsiyon VIP misafir check-in ödemesi', minAmt: 120, maxAmt: 220 },
            { desc: 'Sonsuzluk Havuzu & Bahçe Terası kokteyl satışı', minAmt: 75, maxAmt: 150 },
            { desc: 'Zen Spa & Termal Jakuzi masaj seansı paketi', minAmt: 105, maxAmt: 190 }
        ];

        const ev = events[Math.floor(Math.random() * events.length)];
        const amt = Math.floor(Math.random() * (ev.maxAmt - ev.minAmt + 1)) + ev.minAmt;
        this.addHotelIncome(amt, ev.desc);
    }

    // ----------------------------------------------------
    // AUTOMATIC NOTIFICATION ENGINE (WHEN MONEY IS ENOUGH)
    // ----------------------------------------------------
    checkAffordableThresholds() {
        Object.keys(this.renovationCosts).forEach(id => {
            const item = this.renovationCosts[id];
            const currentLvl = this.getAreaLevel(id);
            if (currentLvl >= 4) return; // Max level reached

            const nextLvl = currentLvl + 1;
            const nextCost = this.getNextUpgradeCost(id);
            const nextStars = this.getNextUpgradeStars(id);
            const notifyKey = `${id}_lv${nextLvl}`;

            if (this.canAfford(nextCost, nextStars)) {
                if (!this.data.notifiedRenovations[notifyKey]) {
                    this.data.notifiedRenovations[notifyKey] = true;
                    this.save();
                    this.showCelebrationAlert(id, item, nextLvl, nextCost);
                }
            }
        });
    }

    showIncomeToast(title, subtitle) {
        const el = document.getElementById('incomeToast');
        if (!el) return;
        el.innerHTML = `
            <div class="toast-icon">💰</div>
            <div class="toast-body">
                <strong>${title}</strong>
                <small>${subtitle || 'Kasaya aktarıldı'}</small>
            </div>
            <span class="toast-bal">$${this.data.balance}</span>
        `;
        el.style.display = 'flex';
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            el.style.display = 'none';
        }, 4000);
    }

    showCelebrationAlert(targetId, target, nextLvl = 2, nextCost = 1200) {
        const banner = document.getElementById('budgetAlertToast');
        if (!banner) return;
        banner.innerHTML = `
            <div class="alert-content">
                <span class="alert-sparkle">🎉 3 TASARIM KİLİDİ AÇILDI! (SEVİYE ${nextLvl})</span>
                <p>Birikiminiz <b>${target.name}</b> (Seviye ${nextLvl} — $${nextCost}) için yeterli! 3 farklı lüks tasarımdan favorinizi seçin.</p>
            </div>
            <button class="alert-action-btn" onclick="hotel3D.goToAndOpenRenovation('${targetId}')">
                3 Tasarımı Gör ➔
            </button>
        `;
        banner.style.display = 'flex';
        clearTimeout(this.alertTimer);
        this.alertTimer = setTimeout(() => {
            banner.style.display = 'none';
        }, 8500);
    }

    updateGlobalHUD() {
        const coinsEl = document.getElementById('coins');
        const starsEl = document.getElementById('stars');
        const hudCoinsEl = document.getElementById('hudCoins');
        const hudStarsEl = document.getElementById('hudStars');

        if (coinsEl) coinsEl.innerText = `$${this.data.balance}`;
        if (starsEl) starsEl.innerText = this.data.stars;
        if (hudCoinsEl) hudCoinsEl.innerText = `$${this.data.balance}`;
        if (hudStarsEl) hudStarsEl.innerText = this.data.stars;

        // Target renovation widget
        const targetBadge = document.getElementById('hudTargetBadge');
        if (targetBadge && this.renovationCosts[this.data.targetRenovationId]) {
            const id = this.data.targetRenovationId;
            const t = this.renovationCosts[id];
            const curLvl = this.getAreaLevel(id);
            const nextLvl = Math.min(4, curLvl + 1);
            const cost = this.getNextUpgradeCost(id);
            const def = Math.max(0, cost - this.data.balance);
            const pct = curLvl >= 4 ? 100 : Math.min(100, Math.round((this.data.balance / cost) * 100));
            targetBadge.innerHTML = `
                <div class="target-head">
                    <span>🎯 Hedef: <b>${t.name}</b> (Lv.${curLvl}➔Lv.${nextLvl} · $${cost})</span>
                    <b>%${pct}</b>
                </div>
                <div class="target-track"><div class="target-bar" style="width: ${pct}%;"></div></div>
                <small>${curLvl >= 4 ? '👑 MAKSİMUM SEVİYE (Lv.4)' : (def > 0 ? `🔒 $${def} daha gerekli (3 Tasarım Kilitli)` : '🟢 BÜTÇE HAZIR! 3 TASARIM AÇIK')}</small>
            `;
        }

        if (window.hotel3D && window.hotel3D.renderHotelAreaCards) {
            window.hotel3D.renderHotelAreaCards();
        }
    }

    // ----------------------------------------------------
    // FINANCIAL LEDGER MODAL (KASA DEFTERİ)
    // ----------------------------------------------------
    openLedgerModal() {
        const modal = document.getElementById('financialLedgerModal');
        if (!modal) return;

        const totalEarned = this.data.totalHotelIncome + this.data.totalOrderIncome;
        const hotelRatio = totalEarned > 0 ? Math.round((this.data.totalHotelIncome / totalEarned) * 100) : 50;
        const orderRatio = 100 - hotelRatio;

        let txRows = '';
        if (this.data.transactions.length === 0) {
            txRows = '<div class="tx-empty">Henüz kaydedilmiş finansal hareket bulunmuyor.</div>';
        } else {
            this.data.transactions.forEach(tx => {
                const dateStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isPositive = tx.amount > 0;
                const sign = isPositive ? '+' : '';
                const amtClass = isPositive ? 'pos' : 'neg';
                const tagClass = tx.type === 'hotel_income' ? 'tag-hotel' : (tx.type === 'order_reward' ? 'tag-order' : 'tag-reno');
                
                txRows += `
                    <div class="tx-row">
                        <div class="tx-meta">
                            <span class="tx-time">${dateStr}</span>
                            <span class="tx-tag ${tagClass}">${tx.source}</span>
                        </div>
                        <div class="tx-desc">${tx.desc}</div>
                        <div class="tx-amount ${amtClass}">${sign}$${Math.abs(tx.amount)}</div>
                    </div>
                `;
            });
        }

        modal.innerHTML = `
            <div class="ledger-modal-card">
                <div class="ledger-header">
                    <div class="ledger-title-box">
                        <span class="ledger-crest">✦ AURELIA PALACE MERKEZİ KASA</span>
                        <h3>Finans ve Hesap Defteri</h3>
                    </div>
                    <button class="reno-close-btn" onclick="document.getElementById('financialLedgerModal').style.display='none'">&times;</button>
                </div>

                <!-- 4 MAIN KPI CARDS -->
                <div class="ledger-kpi-grid">
                    <div class="kpi-card balance-card">
                        <span class="kpi-label">Kullanılabilir Bakiye</span>
                        <b class="kpi-val">$${this.data.balance}</b>
                        <small class="kpi-sub">⭐ ${this.data.stars} Prestij Yıldızı</small>
                    </div>

                    <div class="kpi-card">
                        <span class="kpi-label">🏨 Otel Operasyonları</span>
                        <b class="kpi-val text-green">+$${this.data.totalHotelIncome}</b>
                        <small class="kpi-sub">Oda &amp; Servis Gelirleri</small>
                    </div>

                    <div class="kpi-card">
                        <span class="kpi-label">🛍️ Sosyete Siparişleri</span>
                        <b class="kpi-val text-gold">+$${this.data.totalOrderIncome}</b>
                        <small class="kpi-sub">Masa Teslimatları</small>
                    </div>

                    <div class="kpi-card">
                        <span class="kpi-label">🛠️ Restorasyon Gideri</span>
                        <b class="kpi-val text-red">-$${this.data.totalRenovationSpent}</b>
                        <small class="kpi-sub">Otel İyileştirmeleri</small>
                    </div>
                </div>

                <!-- INCOME RATIO BAR -->
                <div class="ledger-ratio-box">
                    <div class="ratio-labels">
                        <span>🏨 Otel Gelir Payı (%${hotelRatio})</span>
                        <span>🛍️ Sipariş Gelir Payı (%${orderRatio})</span>
                    </div>
                    <div class="ratio-bar-track">
                        <div class="ratio-fill-hotel" style="width: ${hotelRatio}%;"></div>
                        <div class="ratio-fill-order" style="width: ${orderRatio}%;"></div>
                    </div>
                </div>

                <div class="ledger-tx-header">
                    <h4>Son Finansal Hareketler (Canlı Kasa Kaydı)</h4>
                    <button class="sim-guest-btn" onclick="window.GameEconomy.simulateGuestActivity(); window.GameEconomy.openLedgerModal();">
                        🛎️ Misafir Ödemesi Tahsil Et
                    </button>
                </div>

                <div class="ledger-tx-list">
                    ${txRows}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

window.GameEconomy = new GameEconomyManager();
