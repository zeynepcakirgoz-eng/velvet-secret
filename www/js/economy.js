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

        // Gossip Harbour Multi-Task Hotel Area Restoration Structure
        this.hotelAreas = {
            restaurant: {
                id: 'restaurant',
                name: 'Riviera Gurme Restoran & Teras',
                shortName: '🍷 Riviera Restoran',
                room: 'restaurant',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                description: 'Monako yat limanı manzaralı açık hava lüks gurme restoranı.',
                tasks: [
                    {
                        id: 'restaurant_tables',
                        order: 1,
                        name: 'Riviera Yemek Masalarını Değiştir',
                        shortDesc: 'Örtüsüz eski masaları kaldırıp şık yemek masaları yerleştirin.',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        hotspot: { x: 48, y: 64 },
                        stageBox: [0.20, 0.46, 0.60, 0.44],
                        defaultDesc: 'Örtüsüz eski ahşap masalar ve sade sandalyeler'
                    },
                    {
                        id: 'restaurant_bar',
                        order: 2,
                        name: 'Oniks Şampanya & Kokteyl Barı',
                        shortDesc: 'Işıksız eski tezgâh yerine göz alıcı bir şampanya barı kurun.',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        hotspot: { x: 78, y: 45 },
                        stageBox: [0.55, 0.28, 0.42, 0.45],
                        defaultDesc: 'Boş raflı, ışıksız eski içecek tezgâhı'
                    },
                    {
                        id: 'restaurant_lighting',
                        order: 3,
                        name: 'Teras Avizeleri & Sıcak Aydınlatma',
                        shortDesc: 'Akşam yemekleri için terası romantik sıcak ışıklarla donatın.',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        hotspot: { x: 30, y: 28 },
                        stageBox: [0.15, 0.10, 0.35, 0.35],
                        defaultDesc: 'Sönük eski fenerler ve yetersiz ışıklandırma'
                    },
                    {
                        id: 'restaurant_terrace',
                        order: 4,
                        name: 'Mermer Teras Zemini & Gala Dekoru',
                        shortDesc: 'Yat limanı manzaralı terası lüks çiçek aranjmanları ve mermer zeminle tamamlayın.',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        hotspot: { x: 20, y: 56 },
                        stageBox: [0.05, 0.38, 0.35, 0.45],
                        defaultDesc: 'Yıpranmış taş zemin ve sade teras'
                    }
                ]
            },
            lobby: {
                id: 'lobby',
                name: 'Aurelia Palace Büyük Lobi & Resepsiyon',
                shortName: '🏛️ Büyük Lobi',
                room: 'lobby',
                bgImg: 'assets/scene_lobby_reception.jpg',
                description: 'Kraliyet karşılamasının ve otel ihtişamının kalbi.',
                tasks: [
                    {
                        id: 'lobby_floor_walls',
                        order: 1,
                        name: 'Lobi Zemin Temizliği, Cilalı Mermer & Panoramik Tül Perdeler',
                        shortDesc: 'Tozlu/lekeli beton zemini temizleyip ayna parlaklığında mermer döşeyin.',
                        cost: 900,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 50,
                        hotspot: { x: 50, y: 70 },
                        stageBox: [0.10, 0.50, 0.80, 0.45],
                        defaultDesc: 'Kirli, tozlu beton zemin, boya kovaları ve çıplak pencereler'
                    },
                    {
                        id: 'reception_desk',
                        order: 2,
                        name: 'Sol Cephe Mermer Resepsiyon Bankosu, 3 iMac, Lambalar & Raflar',
                        shortDesc: 'Sol duvara damarlı mermer-ceviz banko, 3 iMac, masa lambaları ve ışıklı raflar kurun.',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        hotspot: { x: 22, y: 56 },
                        stageBox: [0.05, 0.35, 0.38, 0.45],
                        defaultDesc: 'Boş, tozlu sol duvar, karton kutular ve moloz yığını'
                    },
                    {
                        id: 'lobby_chandelier',
                        order: 3,
                        name: '4 Kademeli Halka LED Avizeler & Ray Spot Aydınlatma',
                        shortDesc: 'Tavan havuzuna 4 kademeli ışıklı halka avize ve 16 ray spot yerleştirin.',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        hotspot: { x: 50, y: 22 },
                        stageBox: [0.30, 0.00, 0.40, 0.38],
                        defaultDesc: 'Tavandan sarkan çıplak kablolar ve sönük şantiye duyu'
                    },
                    {
                        id: 'lobby_carpet',
                        order: 4,
                        name: 'Ön Sağ Lobi Lounge Grubu, Halı, Sehpa Seti & Palmiyeler',
                        shortDesc: 'Ön sağ cam kenarına dalgalı halı, yastıklı kanepe, 2 berjer, mermer sehpa ve palmiyeler kurun.',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        hotspot: { x: 72, y: 74 },
                        stageBox: [0.45, 0.52, 0.50, 0.42],
                        defaultDesc: 'Boş ve kirli sağ ön zemin, tahta kalaslar ve boya kovası'
                    },
                    {
                        id: 'lobby_columns',
                        order: 5,
                        name: 'Orta Sağ 2. Lounge Oturma Grubu, Mermer Sütunlar & Palmiyeler',
                        shortDesc: 'Orta sağ bölüme ikinci lüks oturma grubunu, sehpayı ve palmiyeleri yerleştirin.',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        hotspot: { x: 75, y: 50 },
                        stageBox: [0.50, 0.35, 0.45, 0.38],
                        defaultDesc: 'Boş ve tozlu orta koridor alanı, inşaat malzemeleri'
                    },
                    {
                        id: 'lobby_back_vista',
                        order: 6,
                        name: 'Arka Galeri: Yüzer Merdiven, Asma Kat, Dresuar & Tablolar',
                        shortDesc: 'Arka bölüme yüzer merdiven, cam korkuluklu asma kat, lambalı dresuar ve tablolar kurun.',
                        cost: 1900,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        hotspot: { x: 55, y: 42 },
                        stageBox: [0.25, 0.25, 0.55, 0.35],
                        defaultDesc: 'Karanlık, boş ve kirli arka hol ile tamamlanmamış merdiven'
                    }
                ]
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz Manzaralı Suit (Oda 101)',
                shortName: '🛏️ Suit 101',
                room: 'room101',
                bgImg: 'assets/scene_presidential_suite.jpg',
                description: 'Panoramik Akdeniz manzaralı VIP konuk suiti.',
                tasks: [
                    {
                        id: 'room101_bed',
                        order: 1,
                        name: 'Deluxe Suit Kraliyet Yatağı',
                        shortDesc: 'Dört direkli altın varaklı ipek kral yatağı kurun.',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        hotspot: { x: 50, y: 55 },
                        stageBox: [0.18, 0.38, 0.64, 0.48],
                        defaultDesc: 'Standart eski karyola ve sade başlık'
                    },
                    {
                        id: 'room101_decor',
                        order: 2,
                        name: 'Panoramik Deniz Balkonu & Şezlonglar',
                        shortDesc: 'Geniş cam balkon terasına lüks şezlong ve şampanya sehpası koyun.',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        hotspot: { x: 82, y: 52 },
                        stageBox: [0.65, 0.30, 0.32, 0.45],
                        defaultDesc: 'Boş pencere önü ve eski sehpa'
                    },
                    {
                        id: 'room101_lounge',
                        order: 3,
                        name: 'Mermer Şömine & Gece Aydınlatması',
                        shortDesc: 'Suite sıcak mermer şömine ve abajurlar ekleyin.',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        hotspot: { x: 22, y: 55 },
                        stageBox: [0.08, 0.40, 0.30, 0.42],
                        defaultDesc: 'Boş oda köşesi'
                    }
                ]
            },
            pool: {
                id: 'pool',
                name: 'Aurelia Sonsuzluk Havuzu & Güneş Terası',
                shortName: '🏊 Sonsuzluk Havuzu',
                room: 'pool',
                bgImg: 'assets/scene_infinity_pool.jpg',
                description: 'Monako körfezini tepeden gören altın mozaikli sonsuzluk havuzu.',
                tasks: [
                    {
                        id: 'swimming_pool',
                        order: 1,
                        name: 'Sonsuzluk Havuzu & Mozaik Zemin',
                        shortDesc: 'Işıltılı altın mozaik kenarlı sonsuzluk havuzunu inşa edin.',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 110,
                        hotspot: { x: 48, y: 64 },
                        stageBox: [0.12, 0.42, 0.76, 0.52],
                        defaultDesc: 'Bakımsız havuz ve boş teras'
                    },
                    {
                        id: 'pool_cabanas',
                        order: 2,
                        name: 'VIP Güneşlenme Locaları & Şemsiyeler',
                        shortDesc: 'Havuz kenarına beyaz ipek tüllü lüks gölgelik localar yerleştirin.',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        hotspot: { x: 80, y: 46 },
                        stageBox: [0.65, 0.30, 0.32, 0.45],
                        defaultDesc: 'Eski plastik şezlonglar'
                    },
                    {
                        id: 'pool_lounge',
                        order: 3,
                        name: 'Havuz Başı Ateş Çukuru & Su Barı',
                        shortDesc: 'Akşam partileri için gömme ateş çukuru ve kokteyl barı ekleyin.',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        hotspot: { x: 20, y: 52 },
                        stageBox: [0.08, 0.36, 0.32, 0.45],
                        defaultDesc: 'Boş beton teras kenarı'
                    }
                ]
            },
            spa: {
                id: 'spa',
                name: 'Aurelia Zen Termal Spa & Jakuzi',
                shortName: '♨️ Zen Spa',
                room: 'spa',
                bgImg: 'assets/scene_spa_wellness.jpg',
                description: 'Doğal sıcak mineralli kaynak suyu ve masaj pavyonu.',
                tasks: [
                    {
                        id: 'spa_jacuzzi',
                        order: 1,
                        name: 'Aurelia Termal Jakuzi Havuzu',
                        shortDesc: 'İtalyan mermeri ve altın mozaikli sıcak termal jakuzi kurun.',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        hotspot: { x: 56, y: 68 },
                        stageBox: [0.30, 0.54, 0.62, 0.42],
                        defaultDesc: 'Henüz termal jakuzi kurulumu yapılmamış'
                    },
                    {
                        id: 'spa_beds',
                        order: 2,
                        name: 'Aromaterapi Dinlenme Yatakları',
                        shortDesc: 'Isıtmalı seramik yataklar ve aromatik tütsü köşesi hazırlayın.',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        hotspot: { x: 22, y: 55 },
                        stageBox: [0.10, 0.42, 0.35, 0.40],
                        defaultDesc: 'Boş dinlenme köşesi'
                    },
                    {
                        id: 'spa_waterfall',
                        order: 3,
                        name: 'Zen Şelalesi & Himalaya Tuz Duvarı',
                        shortDesc: 'Huzur veren su çağıltısı ve pembe tuz duvarıyla ortamı zenginleştirin.',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        hotspot: { x: 80, y: 40 },
                        stageBox: [0.68, 0.22, 0.28, 0.50],
                        defaultDesc: 'Sade taş duvar'
                    }
                ]
            },
            garden: {
                id: 'garden',
                name: 'Akdeniz Botanik Bahçesi & Çeşme',
                shortName: '🌹 Botanik Bahçe',
                room: 'garden',
                bgImg: 'assets/scene_garden_terrace.jpg',
                description: 'Nadir güller, mermer saray çeşmesi ve gölgeli pergolalar.',
                tasks: [
                    {
                        id: 'garden_courtyard',
                        order: 1,
                        name: '3 Katlı Mermer Saray Çeşmesi',
                        shortDesc: 'Avlunun merkezine 3 katlı fıskiyeli beyaz mermer çeşme kurun.',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        hotspot: { x: 50, y: 58 },
                        stageBox: [0.31, 0.33, 0.38, 0.62],
                        defaultDesc: 'Kurumuş çalılar ve çalışmayan taş çeşme'
                    },
                    {
                        id: 'garden_pergola',
                        order: 2,
                        name: 'Kraliyet Gül Pergolası & Yürüyüş Yolu',
                        shortDesc: 'Sarmaşık güllerle kaplı kemerli gölgelik pergola ve taş yol döşeyin.',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        hotspot: { x: 80, y: 48 },
                        stageBox: [0.65, 0.30, 0.32, 0.50],
                        defaultDesc: 'Bakımsız toprak patika'
                    },
                    {
                        id: 'garden_pavilion',
                        order: 3,
                        name: 'Akdeniz Çay Pavyonu & Fenerler',
                        shortDesc: 'Bahçeye dinlendirici bir çay köşesi ve pirinç fenerler ekleyin.',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 48,
                        repBoost: 72,
                        hotspot: { x: 20, y: 50 },
                        stageBox: [0.08, 0.32, 0.32, 0.48],
                        defaultDesc: 'Boş çim alan'
                    }
                ]
            },
            penthouse: {
                id: 'penthouse',
                name: '2. Kat Başkanlık Penthouse & Piyano Salonu',
                shortName: '👑 2. Kat Penthouse',
                room: 'penthouse',
                bgImg: 'assets/scene_penthouse_piano.jpg',
                description: 'Çatı katı suitinde konser piyanosu ve şömine salonu.',
                tasks: [
                    {
                        id: 'penthouse_suite',
                        order: 1,
                        name: 'Kuyruklu Konser Piyanosu',
                        shortDesc: 'Salona altın telli kraliyet kuyruklu konser piyanosu kurun.',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 120,
                        repBoost: 180,
                        hotspot: { x: 36, y: 56 },
                        stageBox: [0.20, 0.32, 0.32, 0.54],
                        defaultDesc: 'Üstü örtülü eşyalar, boş teras katı'
                    },
                    {
                        id: 'penthouse_fireplace',
                        order: 2,
                        name: 'Mermer Şömine & Dairesel Kadife Salon',
                        shortDesc: 'Şöminenin önüne dairesel lüks kadife oturma grubu yerleştirin.',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 105,
                        hotspot: { x: 68, y: 58 },
                        stageBox: [0.52, 0.36, 0.44, 0.50],
                        defaultDesc: 'Kullanılmayan soğuk şömine'
                    },
                    {
                        id: 'penthouse_terrace',
                        order: 3,
                        name: 'Monako Körfezi Özel Manzara Terası',
                        shortDesc: 'Penthouse balkonuna özel yat limanı manzaralı VIP teras barı kurun.',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        hotspot: { x: 82, y: 40 },
                        stageBox: [0.70, 0.20, 0.28, 0.45],
                        defaultDesc: 'Boş teras korkuluğu'
                    }
                ]
            }
        };

        // Flat lookup of all tasks across all areas
        this.renovationCosts = {};
        this.sequentialOrder = [];
        Object.keys(this.hotelAreas).forEach(areaKey => {
            const area = this.hotelAreas[areaKey];
            area.tasks.forEach(t => {
                this.sequentialOrder.push(t.id);
                this.renovationCosts[t.id] = {
                    id: t.id,
                    areaId: areaKey,
                    seqOrder: t.order,
                    name: t.name,
                    area: area.name,
                    cost: t.cost,
                    stars: t.stars,
                    jumpRoom: areaKey,
                    sceneImg: area.bgImg,
                    defaultDesc: t.defaultDesc
                };
            });
        });

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

    // ----------------------------------------------------
    // GOSSIP HARBOR AREA-BASED PROGRESSION HELPERS
    // ----------------------------------------------------
    getArea(areaId) {
        return this.hotelAreas[areaId] || null;
    }

    getAreaTasks(areaId) {
        const area = this.hotelAreas[areaId];
        return area ? area.tasks : [];
    }

    isTaskCompleted(taskId) {
        if (window.hotel3D && typeof window.hotel3D.isTaskCompleted === 'function') {
            return window.hotel3D.isTaskCompleted(taskId);
        }
        return Boolean(this.data.renovations && this.data.renovations[taskId] && this.data.renovations[taskId].completed);
    }

    isAreaCompleted(taskId) {
        return this.isTaskCompleted(taskId);
    }

    getAreaCompletedTasks(areaId) {
        const tasks = this.getAreaTasks(areaId);
        return tasks.filter(t => this.isTaskCompleted(t.id));
    }

    getAreaActiveTask(areaId) {
        const tasks = this.getAreaTasks(areaId);
        return tasks.find(t => !this.isTaskCompleted(t.id)) || null;
    }

    getAreaLevel(areaId) {
        const area = this.hotelAreas[areaId];
        if (!area) return 1;
        const done = this.getAreaCompletedTasks(areaId).length;
        return Math.min(area.tasks.length + 1, done + 1);
    }

    getAreaProgressPercent(areaId) {
        const tasks = this.getAreaTasks(areaId);
        if (!tasks.length) return 0;
        const done = this.getAreaCompletedTasks(areaId).length;
        return Math.round((done / tasks.length) * 100);
    }

    getCurrentSequentialAreaId(areaId) {
        if (areaId) {
            const task = this.getAreaActiveTask(areaId);
            return task ? task.id : null;
        }
        if (window.hotel3D && window.hotel3D.currentArea) {
            const t = this.getAreaActiveTask(window.hotel3D.currentArea);
            if (t) return t.id;
        }
        return this.sequentialOrder.find(id => !this.isTaskCompleted(id)) || null;
    }

    getNextUpgradeCost(id) {
        if (this.isTaskCompleted(id)) return 0;
        const item = this.renovationCosts[id];
        return item ? item.cost : 1200;
    }

    getNextUpgradeStars(id) {
        if (this.isTaskCompleted(id)) return 0;
        const item = this.renovationCosts[id];
        return item ? item.stars : 1;
    }

    getTargetRenovation(areaId) {
        return this.getCurrentSequentialAreaId(areaId) || 'restaurant_tables';
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

        if (!this.data.renovations) this.data.renovations = {};
        this.data.renovations[areaId] = {
            optionId: optionId,
            completed: true,
            timestamp: Date.now()
        };

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
