// ========================================================
// VELVET SECRETS - CENTRAL AUTHORITATIVE GAME ECONOMY
// Shared Wallet, Dual Income Engine, and Transaction Ledger
// ========================================================

class GameEconomyManager {
    constructor() {
        this.storageKey = 'velvet_authoritative_economy_v4';
        this.listeners = [];

        // All 10 hotel renovation costs visible from day 1
        this.renovationCosts = {
            reception_desk: {
                id: 'reception_desk',
                name: 'Lobi Resepsiyon Masası',
                area: 'Büyük Lobi',
                cost: 1500,
                stars: 2,
                jumpRoom: 'lobby',
                defaultDesc: 'Eski ve Yıpranmış Ahşap Resepsiyon Masası'
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                name: 'Giriş Protokol Halısı & Mermer',
                area: 'Büyük Lobi',
                cost: 600,
                stars: 2,
                jumpRoom: 'lobby',
                defaultDesc: 'Yıpranmış Ham Zemin'
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                name: 'Büyük Lobi Kristal Tavan Avizesi',
                area: 'Büyük Lobi',
                cost: 1000,
                stars: 3,
                jumpRoom: 'lobby',
                defaultDesc: 'Çıplak Sarkıt Ampul'
            },
            room101_bed: {
                id: 'room101_bed',
                name: 'Suit 101 Kraliyet Yatak Takımı',
                area: 'Deluxe Suit (Oda 101)',
                cost: 1800,
                stars: 4,
                jumpRoom: 'room101',
                defaultDesc: 'Eski Gıcırdayan Demir Karyola'
            },
            room101_decor: {
                id: 'room101_decor',
                name: 'Suit 101 Panoramik Teras Mobilyası',
                area: 'Deluxe Suit (Oda 101)',
                cost: 900,
                stars: 3,
                jumpRoom: 'room101',
                defaultDesc: 'Boş ve Bakımsız Teras'
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                name: 'Riviera Kokteyl & Şampanya Barı',
                area: 'Riviera Restoran',
                cost: 1400,
                stars: 4,
                jumpRoom: 'restaurant',
                defaultDesc: 'Terk Edilmiş Eski Bar Tezgahı'
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                name: 'Gourmet Yemek Salonu Masaları',
                area: 'Riviera Restoran',
                cost: 1200,
                stars: 3,
                jumpRoom: 'restaurant',
                defaultDesc: 'Eski ve Çizik Ahşap Masalar'
            },
            swimming_pool: {
                id: 'swimming_pool',
                name: 'Aurelia Sonsuzluk Havuzu & Şezlonglar',
                area: 'Açık Güneş Terası',
                cost: 5000,
                stars: 5,
                jumpRoom: 'pool',
                defaultDesc: 'Kuru ve Boş Havuz Çukuru'
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                name: 'Zen Termal Jakuzi & Masaj Alanı',
                area: 'Aurelia Spa & Sağlık',
                cost: 2800,
                stars: 4,
                jumpRoom: 'pool',
                defaultDesc: 'Kapalı ve Hizmet Dışı Spa Alanı'
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                name: '2. Kat Başkanlık Penthouse Suiti',
                area: 'Aurelia Çatı Katı',
                cost: 6500,
                stars: 6,
                jumpRoom: 'penthouse',
                defaultDesc: 'Terk Edilmiş Tozlu Çatı Katı'
            }
        };

        this.load();
        this.initHotelOperationsLoop();
    }

    load() {
        // Initial setup aligns with prompt scenario: balance $750, target Restaurant Tables ($1,200) -> needed $450
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

        // Exact deduction once
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
            { desc: 'Riviera Restoran gurme akşam yemeği & şampanya hesabı', minAmt: 85, maxAmt: 190 },
            { desc: 'Aurelia Resepsiyon VIP misafir check-in ödemesi', minAmt: 110, maxAmt: 210 },
            { desc: 'Sonsuzluk Havuzu kokteyl barı satışı', minAmt: 60, maxAmt: 130 },
            { desc: 'Zen Spa & Termal Jakuzi masaj seansı paketi', minAmt: 95, maxAmt: 180 }
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
            // Check if already renovated in hotel3D
            const isInstalled = window.hotel3D && window.hotel3D.getInstalledOption && window.hotel3D.getInstalledOption(id);
            if (isInstalled && !isInstalled.isPreview) return;

            if (this.canAfford(item.cost, item.stars)) {
                if (!this.data.notifiedRenovations[id]) {
                    this.data.notifiedRenovations[id] = true;
                    this.save();
                    this.showCelebrationAlert(id, item);
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

    showCelebrationAlert(targetId, target) {
        const banner = document.getElementById('budgetAlertToast');
        if (!banner) return;
        banner.innerHTML = `
            <div class="alert-content">
                <span class="alert-sparkle">🎉 BİRİKİM TAMAMLANDI!</span>
                <p>Birikiminiz <b>${target.name}</b> ($${target.cost}) restorasyonu için yeterli! Şimdi favori tasarımınızı seçebilirsiniz.</p>
            </div>
            <button class="alert-action-btn" onclick="hotel3D.goToAndOpenRenovation('${targetId}')">
                Tasarımı Seç ➔
            </button>
        `;
        banner.style.display = 'flex';
        clearTimeout(this.alertTimer);
        this.alertTimer = setTimeout(() => {
            banner.style.display = 'none';
        }, 8000);
    }

    updateGlobalHUD() {
        // Top currency strip
        const coinsEl = document.getElementById('coins');
        const starsEl = document.getElementById('stars');
        const hudCoinsEl = document.getElementById('hudCoins');
        const hudStarsEl = document.getElementById('hudStars');

        if (coinsEl) coinsEl.innerText = `$${this.data.balance}`;
        if (starsEl) starsEl.innerText = this.data.stars;
        if (hudCoinsEl) hudCoinsEl.innerText = `$${this.data.balance}`;
        if (hudStarsEl) hudStarsEl.innerText = this.data.stars;

        // Target renovation widget if exists
        const targetBadge = document.getElementById('hudTargetBadge');
        if (targetBadge && this.renovationCosts[this.data.targetRenovationId]) {
            const t = this.renovationCosts[this.data.targetRenovationId];
            const def = Math.max(0, t.cost - this.data.balance);
            const pct = Math.min(100, Math.round((this.data.balance / t.cost) * 100));
            targetBadge.innerHTML = `
                <div class="target-head">
                    <span>🎯 Hedef: <b>${t.name}</b> ($${t.cost})</span>
                    <b>%${pct}</b>
                </div>
                <div class="target-track"><div class="target-bar" style="width: ${pct}%;"></div></div>
                <small>${def > 0 ? `$${def} daha gerekli` : '🟢 BÜTÇE HAZIR! TASARLA'}</small>
            `;
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

                <!-- DUAL INCOME RATIO STRIP -->
                <div class="dual-income-ratio-box">
                    <div class="ratio-labels">
                        <span>🏨 Otel Operasyonları (%${hotelRatio})</span>
                        <span>🛍️ Sipariş Teslimatları (%${orderRatio})</span>
                    </div>
                    <div class="ratio-track">
                        <div class="ratio-bar-hotel" style="width: ${hotelRatio}%;"></div>
                        <div class="ratio-bar-order" style="width: ${orderRatio}%;"></div>
                    </div>
                </div>

                <!-- LIVE TRANSACTION HISTORY -->
                <div class="ledger-history-head">
                    <h4>Canlı Kasa Hareketleri (Son İşlemler)</h4>
                    <span class="tx-count">${this.data.transactions.length} Kayıt</span>
                </div>

                <div class="tx-scroll-list">
                    ${txRows}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

// Instantiate global authoritative economy
window.GameEconomy = new GameEconomyManager();
