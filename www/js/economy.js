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

        this.sequentialOrder = [
            'reception_desk',
            'lobby_chandelier',
            'lobby_carpet',
            'restaurant_tables',
            'restaurant_bar',
            'room101_bed',
            'room101_decor',
            'swimming_pool',
            'spa_jacuzzi',
            'garden_courtyard',
            'penthouse_suite'
        ];

        // All 11 hotel renovation furniture items (each placed ONCE in strict sequence!)
        this.renovationCosts = {
            reception_desk: {
                id: 'reception_desk',
                seqOrder: 1,
                name: 'Mermer Resepsiyon Bankosu',
                area: '1. Büyük Lobi & Resepsiyon',
                cost: 1500,
                stars: 1,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                defaultDesc: 'Eski, yıpranmış ahşap resepsiyon bankosu'
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                seqOrder: 2,
                name: 'Büyük Lobi Kristal Avizesi',
                area: '2. Lobi Tavanı',
                cost: 2200,
                stars: 2,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                defaultDesc: 'Sönük eski demir tavan lambası'
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                seqOrder: 3,
                name: 'Lobi Kraliyet Halısı & Koltukları',
                area: '3. Lobi & Lounge',
                cost: 950,
                stars: 1,
                jumpRoom: 'lobby',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                defaultDesc: 'Soluk koridor halısı ve eski koltuklar'
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                seqOrder: 4,
                name: 'Riviera Restoran Yemek Masaları',
                area: '4. Restoran & Teras',
                cost: 1200,
                stars: 1,
                jumpRoom: 'restaurant',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                defaultDesc: 'Örtüsüz ahşap masalar ve sade sandalyeler'
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                seqOrder: 5,
                name: 'Şampanya & Kokteyl Barı',
                area: '5. Restoran & Bar',
                cost: 1800,
                stars: 2,
                jumpRoom: 'restaurant',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                defaultDesc: 'Boş raflı, ışıksız eski içecek tezgâhı'
            },
            room101_bed: {
                id: 'room101_bed',
                seqOrder: 6,
                name: 'Deluxe Suit Kraliyet Yatağı (Oda 101)',
                area: '6. Misafir Suiti 101',
                cost: 1600,
                stars: 1,
                jumpRoom: 'room101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                defaultDesc: 'Standart eski karyola ve sade başlık'
            },
            room101_decor: {
                id: 'room101_decor',
                seqOrder: 7,
                name: 'Suit 101 Panoramik Deniz Terası',
                area: '7. Misafir Suiti 101',
                cost: 1400,
                stars: 1,
                jumpRoom: 'room101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                defaultDesc: 'Boş pencere önü ve eski sehpa'
            },
            swimming_pool: {
                id: 'swimming_pool',
                seqOrder: 8,
                name: 'Sonsuzluk Havuzu & Güneşlenme Locaları',
                area: '8. Havuz & Teras',
                cost: 3500,
                stars: 2,
                jumpRoom: 'pool',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                defaultDesc: 'Bakımsız havuz ve boş teras'
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                seqOrder: 9,
                name: 'Aurelia Zen Spa & Termal Jakuzi',
                area: '9. Spa & Wellness',
                cost: 2800,
                stars: 2,
                jumpRoom: 'spa',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                defaultDesc: 'Henüz termal jakuzi kurulumu yapılmamış'
            },
            garden_courtyard: {
                id: 'garden_courtyard',
                seqOrder: 10,
                name: 'Akdeniz Botanik Bahçesi & Mermer Çeşme',
                area: '10. Bahçe & Avlu',
                cost: 2000,
                stars: 1,
                jumpRoom: 'garden',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                defaultDesc: 'Kurumuş çalılar ve çalışmayan taş çeşme'
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                seqOrder: 11,
                name: 'Başkanlık Penthouse & Kuyruklu Piyano',
                area: '11. 2. Kat Penthouse',
                cost: 5000,
                stars: 3,
                jumpRoom: 'penthouse',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                defaultDesc: 'Üstü örtülü eşyalar, boş teras katı'
            }
        };

        this.load();
        this.initHotelOperationsLoop();
    }

    load() {
        const defaultData = {
            balance: 1600,
            stars: 6,
            hotelRevenuePerMin: 45,
            totalHotelIncome: 950,
            totalOrderIncome: 650,
            totalRenovationSpent: 0,
            targetRenovationId: 'reception_desk',
            notifiedRenovations: {},
            renovations: {},
            transactions: [
                {
                    id: 'tx_init_1',
                    type: 'hotel_income',
                    amount: 950,
                    source: 'Otel Operasyonları',
                    desc: 'Deluxe Suit oda rezervasyonu ve lobi başlangıç fonu',
                    timestamp: Date.now() - 3600000
                },
                {
                    id: 'tx_init_2',
                    type: 'order_reward',
                    amount: 650,
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
                if (!this.data.renovations) this.data.renovations = {};
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

    isAreaCompleted(id) {
        if (window.hotel3D && typeof window.hotel3D.isAreaCompleted === 'function') {
            return window.hotel3D.isAreaCompleted(id);
        }
        return Boolean(this.data.renovations && this.data.renovations[id]);
    }

    getAreaLevel(id) {
        return this.isAreaCompleted(id) ? 2 : 1;
    }

    getCurrentSequentialAreaId() {
        if (window.hotel3D && typeof window.hotel3D.getCurrentSequentialAreaId === 'function') {
            return window.hotel3D.getCurrentSequentialAreaId();
        }
        return this.sequentialOrder.find(id => !this.isAreaCompleted(id)) || null;
    }

    getNextUpgradeCost(id) {
        if (this.isAreaCompleted(id)) return 0;
        const item = this.renovationCosts[id];
        return item ? item.cost : 1200;
    }

    getNextUpgradeStars(id) {
        if (this.isAreaCompleted(id)) return 0;
        const item = this.renovationCosts[id];
        return item ? item.stars : 1;
    }

    getTargetRenovation() {
        return this.getCurrentSequentialAreaId() || 'penthouse_suite';
    }

    setTargetRenovation(id) {
        if (!this.renovationCosts[id]) return;
        this.data.targetRenovationId = id;
        this.save();
        this.showIncomeToast('🎯 Sıradaki Görev', this.renovationCosts[id].name);
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
        const nextId = this.getCurrentSequentialAreaId();
        if (!nextId) return;
        const item = this.renovationCosts[nextId];
        if (!item || this.isAreaCompleted(nextId)) return;

        const nextCost = this.getNextUpgradeCost(nextId);
        const nextStars = this.getNextUpgradeStars(nextId);
        const notifyKey = `${nextId}_once`;

        if (this.canAfford(nextCost, nextStars)) {
            if (!this.data.notifiedRenovations[notifyKey]) {
                this.data.notifiedRenovations[notifyKey] = true;
                this.save();
                this.showCelebrationAlert(nextId, item, nextCost);
            }
        }
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

    showCelebrationAlert(targetId, target, nextCost = 1500) {
        const banner = document.getElementById('budgetAlertToast');
        if (!banner) return;
        banner.innerHTML = `
            <div class="alert-content">
                <span class="alert-sparkle">🎉 SIRA #${target.seqOrder || 1} MOBİLYA SEÇİMİ HAZIR!</span>
                <p>Birikiminiz <b>${target.name}</b> ($${nextCost}) kurulumu için yeterli! 3 farklı tasarımdan birini seçip kalıcı olarak yerleştirin.</p>
            </div>
            <button class="alert-action-btn" onclick="hotel3D.goToAndOpenRenovation('${targetId}')">
                3 Tasarımdan Seç ➔
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

        // Target renovation widget (always shows current active sequential step)
        const targetBadge = document.getElementById('hudTargetBadge');
        const activeId = this.getCurrentSequentialAreaId();
        if (targetBadge) {
            if (!activeId) {
                targetBadge.innerHTML = `
                    <div class="target-head">
                        <span>👑 <b>Tüm Otel Mobilyaları Kuruldu! (11/11)</b></span>
                        <b>%100</b>
                    </div>
                    <div class="target-track"><div class="target-bar" style="width: 100%;"></div></div>
                    <small>✅ Aurelia Palace tüm alanlarıyla kalıcı olarak tamamlandı!</small>
                `;
            } else if (this.renovationCosts[activeId]) {
                const t = this.renovationCosts[activeId];
                const cost = this.getNextUpgradeCost(activeId);
                const def = Math.max(0, cost - this.data.balance);
                const pct = Math.min(100, Math.round((this.data.balance / cost) * 100));
                targetBadge.innerHTML = `
                    <div class="target-head">
                        <span>🎯 Sıra #${t.seqOrder}/11: <b>${t.name}</b> ($${cost})</span>
                        <b>%${pct}</b>
                    </div>
                    <div class="target-track"><div class="target-bar" style="width: ${pct}%;"></div></div>
                    <small>${def > 0 ? `🔒 $${def} daha gerekli (Sıradaki Mobilya)` : '🟢 BÜTÇE HAZIR! 3 TASARIMDAN SEÇİN'}</small>
                `;
            }
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
