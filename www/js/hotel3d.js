// ========================================================
// VELVET SECRETS — GOSSIP HARBOR STYLE HOTEL RENOVATION ENGINE
// Independent Multi-Task Area Progression, Clear Room Environments,
// 3 Distinct Design Choices & Real In-Scene Transformations
// ========================================================

class Hotel3DSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.state = {
            coins: 1600,
            stars: 6,
            hotelStars: 3,
            reputation: 120,
            incomePerMin: 45,
            uncollectedIncome: 0,
            lastIncomeTick: Date.now(),
            renovations: {}
        };

        // Default primary focus is the Riviera Restaurant as requested
        this.currentRoom = 'restaurant';
        this.isMapMode = false;
        this.selectedAreaId = 'restaurant_tables';
        this.selectedOptionIndex = 0;
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;
        this.notifiedAffordable = new Set();

        // Smooth pan & zoom state for room panorama
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.isDraggingStage = false;

        this.setupRoomDefinitions();
        this.setupRenovationDefinitions();
        this.loadState();

        // Default active task selection for current room
        const activeTask = this.getAreaActiveTask(this.currentRoom);
        if (activeTask) {
            this.selectedAreaId = activeTask.id;
        }

        this.initAudio();
        this.initStageInteractions();
        this.closeBottomDesignDock();
        this.renderStage();
        this.updateHUD();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        if (window.GameEconomy) {
            window.GameEconomy.subscribe(() => {
                this.state.coins = window.GameEconomy.getBalance();
                this.state.stars = window.GameEconomy.getStars();
                this.updateHUD();
                this.checkAffordableNotifications();
                if (this.isRenovationDockOpen) {
                    this.renderBottomDesignDock();
                }
                this.updateProximityPanel();
                this.renderStage();
                this.renderHotelAreaCards();
            });
            setTimeout(() => this.checkAffordableNotifications(true), 800);
        }

        // Passive income loop
        setInterval(() => {
            this.updateEconomy();
        }, 1000);
    }

    // ----------------------------------------------------
    // 1. HOTEL ROOM / AREA DEFINITIONS (INDEPENDENT PROGRESSION)
    // ----------------------------------------------------
    setupRoomDefinitions() {
        this.rooms = {
            restaurant: {
                id: 'restaurant',
                name: 'Riviera Gurme Restoran & Şampanya Barı',
                shortName: '🍷 Riviera Restoran',
                floorLabel: 'Zemin Kat · Doğu Terası',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                mapPos: { x: 80, y: 60 },
                description: 'Monako yat limanı manzaralı açık hava lüks gurme restoranı.',
                dialogue: 'Riviera Restoran: Gurme yemek masalarını kurup şampanya barı ve teras aydınlatmasıyla mekanı dönüştürün!',
                tasks: ['restaurant_tables', 'restaurant_bar', 'restaurant_lighting', 'restaurant_terrace']
            },
            lobby: {
                id: 'lobby',
                name: 'Aurelia Palace Büyük Lobi & Resepsiyon',
                shortName: '🏛️ Büyük Lobi',
                floorLabel: 'Zemin Kat · Merkez Kanat',
                bgImg: 'assets/scene_lobby_reception.jpg',
                mapPos: { x: 50, y: 66 },
                description: 'Kraliyet karşılamasının ve otel ihtişamının mermer salonu.',
                dialogue: 'Büyük Lobi: Resepsiyon bankosu, Bohemya avizesi ve ipek halılarla otelimize layık bir karşılama salonu yaratın!',
                tasks: ['reception_desk', 'lobby_chandelier', 'lobby_carpet', 'lobby_columns']
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz Manzaralı Suit (Oda 101)',
                shortName: '🛏️ Suit 101',
                floorLabel: '1. Kat · Batı Kanadı',
                bgImg: 'assets/scene_presidential_suite.jpg',
                mapPos: { x: 20, y: 60 },
                description: 'Panoramik Akdeniz manzaralı ultra-lüks VIP konuk suiti.',
                dialogue: 'Deluxe Suit 101: Dört direkli kraliyet yatağı ve manzara balkonuyla Monako sosyetesine layık bir suit hazırlayın.',
                tasks: ['room101_bed', 'room101_decor', 'room101_lounge']
            },
            pool: {
                id: 'pool',
                name: 'Aurelia Sonsuzluk Havuzu & Güneş Terası',
                shortName: '🏊 Sonsuzluk Havuzu',
                floorLabel: 'Kuzey Sahil Terası',
                bgImg: 'assets/scene_infinity_pool.jpg',
                mapPos: { x: 50, y: 36 },
                description: 'Monako körfezini tepeden gören altın mozaikli sonsuzluk havuzu.',
                dialogue: 'Sonsuzluk Havuzu: Havuzu yenileyin, VIP locaları ve akşam ateş çukurunu kurarak muhteşem bir teras oluşturun.',
                tasks: ['swimming_pool', 'pool_cabanas', 'pool_lounge']
            },
            spa: {
                id: 'spa',
                name: 'Aurelia Zen Termal Spa & Jakuzi',
                shortName: '♨️ Zen Spa',
                floorLabel: 'Kuzeydoğu Mermer Pavyonu',
                bgImg: 'assets/scene_spa_wellness.jpg',
                mapPos: { x: 80, y: 32 },
                description: 'Doğal sıcak mineralli kaynak suyu ve masaj pavyonu.',
                dialogue: 'Zen Termal Spa: Mermer jakuzi ve dinlenme yataklarıyla huzur dolu bir şifa merkezi inşa edin.',
                tasks: ['spa_jacuzzi', 'spa_beds', 'spa_waterfall']
            },
            garden: {
                id: 'garden',
                name: 'Akdeniz Botanik Bahçesi & Çeşme',
                shortName: '🌹 Botanik Bahçe',
                floorLabel: 'Kuzeybatı Kraliyet Avlusu',
                bgImg: 'assets/scene_garden_terrace.jpg',
                mapPos: { x: 20, y: 32 },
                description: 'Nadir güller, mermer saray çeşmesi ve gölgeli pergolalar.',
                dialogue: 'Botanik Bahçe: 3 katlı saray çeşmesini onarın, sarmaşık güllü pergolayla avluyu canlandırın.',
                tasks: ['garden_courtyard', 'garden_pergola', 'garden_pavilion']
            },
            penthouse: {
                id: 'penthouse',
                name: '2. Kat Başkanlık Penthouse & Piyano Salonu',
                shortName: '👑 2. Kat Penthouse',
                floorLabel: '2. Kat · Çatı Katı Suiti',
                bgImg: 'assets/scene_penthouse_piano.jpg',
                mapPos: { x: 50, y: 14 },
                description: 'Çatı katı suitinde kuyruklu konser piyanosu ve şömine salonu.',
                dialogue: '2. Kat Penthouse: Konser piyanosu ve mermer şömineli salonu kurarak en seçkin gala süitini tamamlayın.',
                tasks: ['penthouse_suite', 'penthouse_fireplace', 'penthouse_terrace']
            }
        };
    }

    // ----------------------------------------------------
    // 2. RENOVATION TASK DEFINITIONS WITH 3 DISTINCT CHOICES
    // ----------------------------------------------------
    setupRenovationDefinitions() {
        this.renovationDefs = {
            // === RIVIERA RESTORAN TASKS ===
            restaurant_tables: {
                id: 'restaurant_tables',
                room: 'restaurant',
                order: 1,
                name: 'Riviera Yemek Masalarını Değiştir',
                area: 'Riviera Restoran · Görev 1/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.20, 0.46, 0.60, 0.44],
                pinX: 48,
                pinY: 64,
                defaultDesc: 'Örtüsüz eski ahşap masalar ve sade sandalyeler (Yenilenmedi)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & Açık Meşe',
                        style: 'Modern Zarafet',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: '🍽️',
                        desc: 'Açık meşe ahşap ayaklar, İtalyan Carrara mermeri masa tablası ve fırçalanmış pirinç detaylar.',
                        previewImg: 'assets/designs/restaurant_tables_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Nero Marquina & Bordo Kadife',
                        style: 'Kraliyet Kadife',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🌹',
                        desc: 'Derin siyah İspanyol mermeri gövde, bordo kapitone kadife koltuklar ve altın şamdanlar.',
                        previewImg: 'assets/designs/restaurant_tables_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Koyu Maun Ahşap & Akdeniz Riviera',
                        style: 'Klasik Premium',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🍷',
                        desc: 'Doğal koyu maun masif ahşap, turkuaz ipek yastıklar ve Akdeniz ferforje sandalyeler.',
                        previewImg: 'assets/designs/restaurant_tables_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_c.png'
                    }
                ]
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                room: 'restaurant',
                order: 2,
                name: 'Oniks Şampanya & Kokteyl Barı',
                area: 'Riviera Restoran · Görev 2/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.55, 0.28, 0.42, 0.45],
                pinX: 78,
                pinY: 45,
                defaultDesc: 'Boş raflı, ışıksız eski içecek tezgâhı (Yenilenmedi)',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Arkadan Aydınlatmalı Amber Oniks & Altın Bar',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🍸',
                        desc: 'Sıcak amber ışıltılı bal oniksi bar tezgâhı, altın fırçalanmış pirinç bar tabureleri ve kristal raflar.',
                        previewImg: 'assets/designs/restaurant_bar_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Yeşili Mermer & Siyah Kadife Bar',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '🍾',
                        desc: 'Nadir zümrüt damarlı mermer ön panel, siyah kadife oturma grubu ve konyak vitrini.',
                        previewImg: 'assets/designs/restaurant_bar_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Beyaz Carrara Mermeri & Akdeniz Mozaik Bar',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: '🥂',
                        desc: 'Beyaz Carrara mermeri, Akdeniz mavisi cam mozaikler ve tik ağacı ada bar tabureleri.',
                        previewImg: 'assets/designs/restaurant_bar_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_c.png'
                    }
                ]
            },
            restaurant_lighting: {
                id: 'restaurant_lighting',
                room: 'restaurant',
                order: 3,
                name: 'Teras Avizeleri & Sıcak Aydınlatma',
                area: 'Riviera Restoran · Görev 3/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.15, 0.10, 0.35, 0.35],
                pinX: 30,
                pinY: 28,
                defaultDesc: 'Sönük eski fenerler ve yetersiz gece ışıklandırması',
                baseCost: 1500,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Geometrik Altın Halkalı Kristal Sarkıtlar',
                        style: 'Modern Zarafet',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '✨',
                        desc: 'Altın kaplama iç içe geçen geometrik halkalar ve sıcak ışık saçan elmas kristaller.',
                        previewImg: 'assets/designs/restaurant_tables_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Mum Işıklı 3 Kollu Pirinç Kraliyet Şamdanları',
                        style: 'Kraliyet Kadife',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 68,
                        icon: '🕯️',
                        desc: 'Bordo mumlu, antika pirinçten dövülmüş masif kraliyet masa şamdanları.',
                        previewImg: 'assets/designs/restaurant_tables_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Asma Bohemya Cam Fenerler & Sıcak LED Işıklar',
                        style: 'Klasik Premium',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🏮',
                        desc: 'El yapımı turkuaz Bohemya cam fenerler ve pergoladan sarkan yıldız LED zincirleri.',
                        previewImg: 'assets/designs/restaurant_tables_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_c.png'
                    }
                ]
            },
            restaurant_terrace: {
                id: 'restaurant_terrace',
                room: 'restaurant',
                order: 4,
                name: 'Mermer Teras Zemini & Gala Dekoru',
                area: 'Riviera Restoran · Görev 4/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.05, 0.38, 0.35, 0.45],
                pinX: 20,
                pinY: 56,
                defaultDesc: 'Yıpranmış taş zemin ve sade teras korkulukları',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Fildişi Mermer Zemin & Beyaz Orkide Aranjmanları',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: '🌸',
                        desc: 'Parlak fildişi cilalı İtalyan mermer zemin ve 24K altın ayaklıklı beyaz orkideler.',
                        previewImg: 'assets/designs/restaurant_bar_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Halı Yolu & Kırmızı Kadife Güller',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 100,
                        icon: '🌹',
                        desc: 'Özel dokuma bordo kadife protokol halısı ve kristal vazolarda kırmızı taze güller.',
                        previewImg: 'assets/designs/restaurant_bar_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik Ağacı Güverte & Monako Limon Ağaçları',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 110,
                        icon: '🍋',
                        desc: 'Yat güvertesi tarzı doğal masif tik zemin ve pişmiş toprak saksılarda Akdeniz limon ağaçları.',
                        previewImg: 'assets/designs/restaurant_bar_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_c.png'
                    }
                ]
            },

            // === BÜYÜK LOBİ & RESEPSİYON TASKS ===
            reception_desk: {
                id: 'reception_desk',
                room: 'lobby',
                order: 1,
                name: 'Mermer Resepsiyon Bankosu',
                area: 'Büyük Lobi · Görev 1/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.33, 0.49, 0.33, 0.27],
                pinX: 50,
                pinY: 56,
                defaultDesc: 'Eski, yıpranmış ahşap resepsiyon bankosu (Yenilenmedi)',
                baseCost: 1500,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & 24K Altın Banko',
                        style: 'Modern Zarafet',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🏛️',
                        desc: 'Parlak beyaz İtalyan Carrara mermeri, 24 ayar altın sütun şeritleri ve sıcak karşılama ışığı.',
                        previewImg: 'assets/designs/reception_desk_opt_a.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kraliyet Kadifesi & Siyah Mermer Banko',
                        style: 'Kraliyet Kadife',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '🌹',
                        desc: 'Kapitone bordo kraliyet kadifesi, siyah Nero mermer gövde ve pembe-altın LED aydınlatma.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz-Zümrüt Damarlı Mermer & Maun Banko',
                        style: 'Klasik Premium',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '💎',
                        desc: 'Akdeniz turkuazı ve zümrüt damarlı nadir mermer gövde, fırçalanmış pirinç detaylar.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_c.png'
                    }
                ]
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                room: 'lobby',
                order: 2,
                name: 'Büyük Lobi Kristal Avizesi',
                area: 'Büyük Lobi · Görev 2/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.37, 0.00, 0.26, 0.41],
                pinX: 50,
                pinY: 22,
                defaultDesc: 'Tozlu, sönük eski tavan avizesi (Yenilenmedi)',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Elmas & 24K Altın Saray Avizesi',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '✨',
                        desc: '3 katlı elmas kesim beyaz Bohemya kristalleri ve 24 ayar altın mum kolları.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_a.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Yakut Kırmızısı & Pembe Altın İmparatorluk Avizesi',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌺',
                        desc: 'Kızıl yakut kristal damlalar ve sıcak romantik gala aydınlatması.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_b.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Venedik Murano Turkuaz & Zümrüt Kristal Avize',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: '💎',
                        desc: 'El üflemesi turkuaz ve zümrüt Venedik Murano kristalleriyle deniz ışıltısı.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_c.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_c.png'
                    }
                ]
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                room: 'lobby',
                order: 3,
                name: 'Lobi Kraliyet Halısı & Koltukları',
                area: 'Büyük Lobi · Görev 3/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.22, 0.62, 0.56, 0.36],
                pinX: 50,
                pinY: 78,
                defaultDesc: 'Soluk koridor halısı ve eski koltuklar (Yenilenmedi)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem İpek Halı & İnci Beyazı Berjer Koltuklar',
                        style: 'Modern Zarafet',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 25,
                        repBoost: 40,
                        icon: '🛋️',
                        desc: 'Fildişi-altın dokuma saray halısı ve inci beyazı lüks dinlenme berjerleri.',
                        previewImg: 'assets/designs/lobby_carpet_opt_a.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kraliyet Madalyon Halı & Kadife Kanepeler',
                        style: 'Kraliyet Kadife',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 50,
                        icon: '👑',
                        desc: 'Koyu bordo saray halısı, altın saçaklar ve bordo kraliyet kadife kanepeleri.',
                        previewImg: 'assets/designs/lobby_carpet_opt_b.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & Zümrüt Riviera Halı & Maun Koltuklar',
                        style: 'Klasik Premium',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 60,
                        icon: '🌊',
                        desc: 'Zümrüt ve turkuaz Akdeniz motifli halı ve oymalı masif maun koltuklar.',
                        previewImg: 'assets/designs/lobby_carpet_opt_c.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_c.png'
                    }
                ]
            },
            lobby_columns: {
                id: 'lobby_columns',
                room: 'lobby',
                order: 4,
                name: 'Saray Karşılama Sütunları & Kemeri',
                area: 'Büyük Lobi · Görev 4/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.72, 0.25, 0.24, 0.55],
                pinX: 82,
                pinY: 50,
                defaultDesc: 'Sade sıvalı giriş kapısı',
                baseCost: 1700,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'İyonik Beyaz Mermer Sütunlar & Altın Işık',
                        style: 'Modern Zarafet',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '🏛️',
                        desc: 'Klasik İyonik beyaz mermer sütunlar ve gizli altın LED aydınlatma.',
                        previewImg: 'assets/designs/reception_desk_opt_a.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Nero Sütunlar & Bordo Yaldızlı Kemer',
                        style: 'Kraliyet Kadife',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 75,
                        icon: '🌹',
                        desc: 'Siyah mermer gövde, bordo yaldızlı saray kemeri ve altın arma.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Oymalı Maun & Turkuaz Mozaik Sütun',
                        style: 'Klasik Premium',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 85,
                        icon: '💎',
                        desc: 'Nadir maun oymalar ve turkuaz-zümrüt cam mozaikli sütun başlıkları.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_c.png'
                    }
                ]
            },

            // === DELUXE SUIT 101 TASKS ===
            room101_bed: {
                id: 'room101_bed',
                room: 'room101',
                order: 1,
                name: 'Deluxe Suit Kraliyet Yatağı',
                area: 'Suit 101 · Görev 1/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.18, 0.38, 0.64, 0.48],
                pinX: 50,
                pinY: 55,
                defaultDesc: 'Standart eski karyola ve sade başlık (Yenilenmedi)',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz İpek ve 24K Altın Dört Direkli Yatak',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🛏️',
                        desc: 'Bembeyaz ipek çarşaflar, 24K altın direkli saray yatak başlığı ve ortopedik kral yatak.',
                        previewImg: 'assets/designs/room101_bed_opt_a.jpg',
                        stageImg: 'assets/designs/stage_room101_bed_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kraliyet Kadifesi ve Siyah Karyola',
                        style: 'Kraliyet Kadife',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '👑',
                        desc: 'Koyu bordo kapitone kadife yatak başlığı, siyah lake gövde ve kaz tüyü yastıklar.',
                        previewImg: 'assets/designs/room101_bed_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_bed_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz Tül Cibinlikli ve Masif Maun Yatak',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌊',
                        desc: 'Doğal maun ağacı oymalı yatak, deniz esintili turkuaz tül cibinlik ve keten örtüler.',
                        previewImg: 'assets/designs/room101_bed_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_bed_opt_c.png'
                    }
                ]
            },
            room101_decor: {
                id: 'room101_decor',
                room: 'room101',
                order: 2,
                name: 'Panoramik Deniz Balkonu & Şezlonglar',
                area: 'Suit 101 · Görev 2/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.65, 0.30, 0.32, 0.45],
                pinX: 82,
                pinY: 52,
                defaultDesc: 'Boş pencere önü ve eski sehpa (Yenilenmedi)',
                baseCost: 1400,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Deri Şezlonglar & Cam Şampanya Sehpası',
                        style: 'Modern Zarafet',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: '🥂',
                        desc: 'Modern beyaz deri teras şezlongları ve krom şampanya kovası masası.',
                        previewImg: 'assets/designs/room101_decor_opt_a.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Kadife Koltuk & Şömineli Teras Masası',
                        style: 'Kraliyet Kadife',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🔥',
                        desc: 'Zümrüt yeşili kadife berjerler ve mini bio-etanol ateş masası.',
                        previewImg: 'assets/designs/room101_decor_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik Ağacı Akdeniz Teras Takımı & Begonviller',
                        style: 'Klasik Premium',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🌺',
                        desc: 'Masif tik ağacı oturma grubu ve deniz manzaralı canlı begonvil saksıları.',
                        previewImg: 'assets/designs/room101_decor_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_c.png'
                    }
                ]
            },
            room101_lounge: {
                id: 'room101_lounge',
                room: 'room101',
                order: 3,
                name: 'Mermer Şömine & Gece Aydınlatması',
                area: 'Suit 101 · Görev 3/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.08, 0.40, 0.30, 0.42],
                pinX: 22,
                pinY: 55,
                defaultDesc: 'Boş oda köşesi',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Mermer Elektrikli Şömine & Altın Ayna',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🔥',
                        desc: 'İtalyan mermeri şömine, 24K altın varaklı boy aynası ve kristal abajurlar.',
                        previewImg: 'assets/designs/room101_decor_opt_a.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Granit Şömine & Bordo Puf Alanı',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌹',
                        desc: 'Cilalı siyah granit şömine, bordo kapitone kadife puflar ve şamdanlar.',
                        previewImg: 'assets/designs/room101_decor_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Doğal Taş Şömine & Masif Paravan',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: '💎',
                        desc: 'Akdeniz kalker taşı şömine, oyma ahşap giyinme paravanı ve deniz kabuğu aplikler.',
                        previewImg: 'assets/designs/room101_decor_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_c.png'
                    }
                ]
            },

            // === MONAKO SONSUZLUK HAVUZU TASKS ===
            swimming_pool: {
                id: 'swimming_pool',
                room: 'pool',
                order: 1,
                name: 'Sonsuzluk Havuzu & Mozaik Zemin',
                area: 'Sonsuzluk Havuzu · Görev 1/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.12, 0.42, 0.76, 0.52],
                pinX: 48,
                pinY: 64,
                defaultDesc: 'Bakımsız havuz ve boş teras (Yenilenmedi)',
                baseCost: 3500,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Işıltılı Beyaz & Altın Mozaikli Sonsuzluk Havuzu',
                        style: 'Modern Zarafet',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 110,
                        icon: '🏊',
                        desc: 'Bembeyaz cam mozaikler, 24K altın su tahliye bordürü ve Monako koyuna taşan ufuk çizgisi.',
                        previewImg: 'assets/designs/swimming_pool_opt_a.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Laciverti & Yakut Işıklı Gece Havuzu',
                        style: 'Kraliyet Kadife',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 120,
                        icon: '✨',
                        desc: 'Derin kobalt mavisi mozaikler, gece yakut ışıltısı yayan LED havuz lambaları.',
                        previewImg: 'assets/designs/swimming_pool_opt_b.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz-Zümrüt Lagün Havuzu & Doğal Taş',
                        style: 'Klasik Premium',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 135,
                        icon: '🌴',
                        desc: 'Parlak turkuaz zümrüt lagün suyu, traverten taş kenarlar ve sahil taşları.',
                        previewImg: 'assets/designs/swimming_pool_opt_c.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_c.png'
                    }
                ]
            },
            pool_cabanas: {
                id: 'pool_cabanas',
                room: 'pool',
                order: 2,
                name: 'VIP Güneşlenme Locaları & Şemsiyeler',
                area: 'Sonsuzluk Havuzu · Görev 2/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.65, 0.30, 0.32, 0.45],
                pinX: 80,
                pinY: 46,
                defaultDesc: 'Eski plastik şezlonglar',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz İpek Tüllü 24K Altın Detaylı VIP Localar',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '⛱️',
                        desc: 'Rüzgarda salınan beyaz ipek perdeler, kraliyet minderleri ve altın tavan pervanesi.',
                        previewImg: 'assets/designs/swimming_pool_opt_a.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Minderli Güneşlenme Köşkleri',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '👑',
                        desc: 'Güneşe dayanıklı bordo kadife yataklar ve siyah güneşlikler.',
                        previewImg: 'assets/designs/swimming_pool_opt_b.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik Ağacı Riviera Şezlongları & Çizgili Şemsiyeler',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: '🏖️',
                        desc: 'Masif tik ağacı çift kişilik şezlonglar ve sarı-beyaz çizgili Riviera şemsiyeleri.',
                        previewImg: 'assets/designs/swimming_pool_opt_c.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_c.png'
                    }
                ]
            },
            pool_lounge: {
                id: 'pool_lounge',
                room: 'pool',
                order: 3,
                name: 'Havuz Başı Ateş Çukuru & Su Barı',
                area: 'Sonsuzluk Havuzu · Görev 3/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.08, 0.36, 0.32, 0.45],
                pinX: 20,
                pinY: 52,
                defaultDesc: 'Boş beton teras kenarı',
                baseCost: 2400,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Gömme Mermer Ateş Çukuru & Su Barı',
                        style: 'Modern Zarafet',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: '🔥',
                        desc: 'Su seviyesinde gömme dairesel mermer oturma grubu ve ortasında gazlı ateş çukuru.',
                        previewImg: 'assets/designs/swimming_pool_opt_a.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Bazalt Ateş Kasesi & Kadife Koltuklar',
                        style: 'Kraliyet Kadife',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 100,
                        icon: '🍸',
                        desc: 'Siyah bazalt taştan oyulmuş lav taşı ateşliği ve su geçirmez bordo koltuklar.',
                        previewImg: 'assets/designs/swimming_pool_opt_b.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Doğal Kaya Ateş Pavyonu & Fenerli Teras',
                        style: 'Klasik Premium',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 110,
                        icon: '🍹',
                        desc: 'Akdeniz kayalarından örülmüş şömine pavyonu ve asma deniz fenerleri.',
                        previewImg: 'assets/designs/swimming_pool_opt_c.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_c.png'
                    }
                ]
            },

            // === ZEN TERMAL SPA TASKS ===
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                room: 'spa',
                order: 1,
                name: 'Aurelia Termal Jakuzi Havuzu',
                area: 'Zen Spa · Görev 1/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.30, 0.54, 0.62, 0.42],
                pinX: 56,
                pinY: 68,
                defaultDesc: 'Sönük, bakımsız taş jakuzi havuzu (Yenilenmedi)',
                baseCost: 2800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & Altın Mozaik Roma Jakuzisi',
                        style: 'Modern Zarafet',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '♨️',
                        desc: 'Bembeyaz İtalyan mermeri jakuzi gövdesi, 24K altın mozaik iç havuz ve aromaterapi buharı.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Gül Suyu & Yakut Mumlu Romantik Termal Spa',
                        style: 'Kraliyet Kadife',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 62,
                        repBoost: 95,
                        icon: '🌺',
                        desc: 'Pembe-kızıl gül terapili termal kaynak suyu ve yakut ışıltılı mermer jakuzi.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt-Turkuaz Mineral Havuz & Zen Taş Jakuzisi',
                        style: 'Klasik Premium',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 68,
                        repBoost: 105,
                        icon: '🎋',
                        desc: 'Derin turkuaz ve zümrüt mineralli şifalı kaplıca suyu, nehir taşları ve bambu süslemeleri.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_c.png'
                    }
                ]
            },
            spa_beds: {
                id: 'spa_beds',
                room: 'spa',
                order: 2,
                name: 'Aromaterapi Dinlenme Yatakları',
                area: 'Zen Spa · Görev 2/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.10, 0.42, 0.35, 0.40],
                pinX: 22,
                pinY: 55,
                defaultDesc: 'Boş dinlenme köşesi',
                baseCost: 1800,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Isıtmalı Beyaz Seramik Yataklar & İpek Perdeler',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🛏️',
                        desc: 'Vücut ısısına duyarlı seramik şezlonglar, beyaz keten yastıklar ve lavanta buharı.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Şezlonglar & Masaj İstasyonu',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '💆',
                        desc: 'Suya dayanıklı bordo kadife yataklar, sıcak bazalt taş masaj seti ve tütsülük.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Doğal Bambu Dinlenme Sedirleri & Şifalı Çay Barı',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🍵',
                        desc: 'Masif bambu sedirler, Akdeniz bitki çayları sunum masası ve turkuaz yastıklar.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_c.png'
                    }
                ]
            },
            spa_waterfall: {
                id: 'spa_waterfall',
                room: 'spa',
                order: 3,
                name: 'Zen Şelalesi & Himalaya Tuz Duvarı',
                area: 'Zen Spa · Görev 3/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.68, 0.22, 0.28, 0.50],
                pinX: 80,
                pinY: 40,
                defaultDesc: 'Sade taş duvar',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Işıklı Kristal Cam Su Duvarı & Beyaz Mermer',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '💧',
                        desc: 'Cam arkasından süzülen su perdesi ve altın LED aydınlatmalı beyaz mermer havuz.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kehribar Işıklı Pembe Himalaya Tuzu Taş Duvarı',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '🧱',
                        desc: 'Arkadan ışıklandırılmış hakiki pembe kaya tuzu blokları ve bronz fıskiye.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Doğal Nehir Taşlı Çağlayan & Bambu Süsleri',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: '🎋',
                        desc: 'Yuvarlak çakıl taşları üzerinden akan mini şelale ve yeşil bonsai saksıları.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_c.png'
                    }
                ]
            },

            // === AKDENİZ BOTANİK BAHÇESİ TASKS ===
            garden_courtyard: {
                id: 'garden_courtyard',
                room: 'garden',
                order: 1,
                name: '3 Katlı Mermer Saray Çeşmesi',
                area: 'Botanik Bahçe · Görev 1/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.31, 0.33, 0.38, 0.62],
                pinX: 50,
                pinY: 58,
                defaultDesc: 'Susuz, yosun tutmuş eski taş çeşme (Yenilenmedi)',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '3 Katlı Beyaz Carrara Mermeri & Altın Çeşme',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '⛲',
                        desc: 'Parlak fildişi-beyaz mermerden 3 katlı saray çeşmesi ve altın su aydınlatması.',
                        previewImg: 'assets/designs/garden_courtyard_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Gül Yapraklı & Yakut Işıklı Romantik Çeşme',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 78,
                        icon: '🌹',
                        desc: 'Kırmızı gül yapraklarıyla dolu yakut ve pembe mermer kraliyet çeşmesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz Mozaik & Zümrüt Havuzlu Riviera Çeşmesi',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 56,
                        repBoost: 86,
                        icon: '🌴',
                        desc: 'Parlayan turkuaz-zümrüt mozaik havuzlu Akdeniz avlu çeşmesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_c.png'
                    }
                ]
            },
            garden_pergola: {
                id: 'garden_pergola',
                room: 'garden',
                order: 2,
                name: 'Kraliyet Gül Pergolası & Yürüyüş Yolu',
                area: 'Botanik Bahçe · Görev 2/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.65, 0.30, 0.32, 0.50],
                pinX: 80,
                pinY: 48,
                defaultDesc: 'Bakımsız toprak patika',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Sarmaşık Güllü Ferforje Pergola & Taş Yol',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '🌿',
                        desc: 'Beyaz güllerle sarılı ferforje kemer tüneli ve beyaz kireçtaşı yürüyüş yolu.',
                        previewImg: 'assets/designs/garden_courtyard_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Güllü Kemerler & Fenerli Mermer Yol',
                        style: 'Kraliyet Kadife',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '🌺',
                        desc: 'Derin kırmızı güller ve akşamları parıldayan pirinç bahçe fenerleri.',
                        previewImg: 'assets/designs/garden_courtyard_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Doğal Ahşap Pergola, Begonviller & Mozaik Kaldırım',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 75,
                        icon: '🌸',
                        desc: 'Akdeniz sedir ağacı kemerler, pembe begonviller ve renkli taş mozaik yol.',
                        previewImg: 'assets/designs/garden_courtyard_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_c.png'
                    }
                ]
            },
            garden_pavilion: {
                id: 'garden_pavilion',
                room: 'garden',
                order: 3,
                name: 'Akdeniz Çay Pavyonu & Fenerler',
                area: 'Botanik Bahçe · Görev 3/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.08, 0.32, 0.32, 0.48],
                pinX: 20,
                pinY: 50,
                defaultDesc: 'Boş çim alan',
                baseCost: 2100,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Neoklasik Beyaz Mermer Pavyon & Altın Süs Havuzu',
                        style: 'Modern Zarafet',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 48,
                        repBoost: 72,
                        icon: '🏛️',
                        desc: 'Kubbe tavanlı beyaz mermer dinlenme köşkü ve mermer çay masası.',
                        previewImg: 'assets/designs/garden_courtyard_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Tenteli Gala Köşkü & Bronz Aslan Heykelleri',
                        style: 'Kraliyet Kadife',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '🦁',
                        desc: 'Bordo kumaş tenteli kraliyet çardağı ve koruyucu bronz heykeller.',
                        previewImg: 'assets/designs/garden_courtyard_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Sarmaşıklı Çay Çardağı & Antik Taş Banklar',
                        style: 'Klasik Premium',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 58,
                        repBoost: 90,
                        icon: '☕',
                        desc: 'Yeşillikler içinde gizli çay çardağı ve gölgeli antik Akdeniz taş bankları.',
                        previewImg: 'assets/designs/garden_courtyard_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_c.png'
                    }
                ]
            },

            // === 2. KAT BAŞKANLIK PENTHOUSE TASKS ===
            penthouse_suite: {
                id: 'penthouse_suite',
                room: 'penthouse',
                order: 1,
                name: 'Kuyruklu Konser Piyanosu',
                area: '2. Kat Penthouse · Görev 1/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.20, 0.32, 0.32, 0.54],
                pinX: 36,
                pinY: 56,
                defaultDesc: 'Matlaşmış, akortsuz eski piyano (Yenilenmedi)',
                baseCost: 5000,
                starsNeeded: 3,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Fildişi Beyaz & 24K Altın Kraliyet Konser Piyanosu',
                        style: 'Modern Zarafet',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 120,
                        repBoost: 180,
                        icon: '🎹',
                        desc: 'Sedefli fildişi-beyaz gövdeli, 24 ayar altın telli ve parlak cilalı konser piyanosu.',
                        previewImg: 'assets/designs/penthouse_suite_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kızıl Lake & Altın Filigranlı Gala Piyanosu',
                        style: 'Kraliyet Kadife',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 135,
                        repBoost: 200,
                        icon: '👑',
                        desc: 'Parlak bordo-kızıl lake kaplama, kadife tabure ve altın işlemeli konser piyanosu.',
                        previewImg: 'assets/designs/penthouse_suite_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt-Turkuaz Sedef & Maun Özel Koleksiyon Piyano',
                        style: 'Klasik Premium',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 150,
                        repBoost: 220,
                        icon: '💎',
                        desc: 'Zümrüt ve turkuaz sedef kakmalı, Monako yat limanı manzaralı özel kuyruklu piyano.',
                        previewImg: 'assets/designs/penthouse_suite_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_c.png'
                    }
                ]
            },
            penthouse_fireplace: {
                id: 'penthouse_fireplace',
                room: 'penthouse',
                order: 2,
                name: 'Mermer Şömine & Dairesel Kadife Salon',
                area: '2. Kat Penthouse · Görev 2/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.52, 0.36, 0.44, 0.50],
                pinX: 68,
                pinY: 58,
                defaultDesc: 'Kullanılmayan soğuk şömine',
                baseCost: 3200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem Deri Dairesel Koltuk & Beyaz Mermer Şömine',
                        style: 'Modern Zarafet',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 105,
                        icon: '🛋️',
                        desc: 'Şöminenin etrafını saran geniş krem İtalyan deri koltuk ve altın ayna.',
                        previewImg: 'assets/designs/penthouse_suite_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Derin Bordo Kadife Oturma Grubu & Siyah Granit Şömine',
                        style: 'Kraliyet Kadife',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 120,
                        icon: '🔥',
                        desc: 'Monako geceleri için romantik bordo kadife koltuklar ve çıtırdayan şömine ateşi.',
                        previewImg: 'assets/designs/penthouse_suite_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt İpek Koltuklar & Oyma Ahşap Şömine Başlığı',
                        style: 'Klasik Premium',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 135,
                        icon: '💎',
                        desc: 'Akdeniz zümrüt ipek kumaş kaplı geniş salon berjerleri ve ceviz ağacı şömine.',
                        previewImg: 'assets/designs/penthouse_suite_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_c.png'
                    }
                ]
            },
            penthouse_terrace: {
                id: 'penthouse_terrace',
                room: 'penthouse',
                order: 3,
                name: 'Monako Körfezi Özel Manzara Terası Barı',
                area: '2. Kat Penthouse · Görev 3/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.70, 0.20, 0.28, 0.45],
                pinX: 82,
                pinY: 40,
                defaultDesc: 'Boş teras korkuluğu',
                baseCost: 3800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Aydınlatmalı Kristal Bar & Altın Bar Tabureleri',
                        style: 'Modern Zarafet',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        icon: '🍸',
                        desc: 'Büyüleyici gece manzarasına bakan arkadan ışıklı kristal kokteyl barı.',
                        previewImg: 'assets/designs/penthouse_suite_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Yakut Aynalı Şampanya Barı & Bordo Deri Koltuklar',
                        style: 'Kraliyet Kadife',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 95,
                        repBoost: 140,
                        icon: '🍾',
                        desc: 'Özel vintage şampanyaların sergilendiği yakut aynalı VIP bar köşesi.',
                        previewImg: 'assets/designs/penthouse_suite_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Yat Güvertesi Tarzı Tik Bar & Akdeniz Manzarası',
                        style: 'Klasik Premium',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 105,
                        repBoost: 155,
                        icon: '⛵',
                        desc: 'Süperyat güvertesi işçiliğinde doğal tik ağacı açık hava teras barı.',
                        previewImg: 'assets/designs/penthouse_suite_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_c.png'
                    }
                ]
            }
        };
    }

    // ----------------------------------------------------
    // 3. AREA & TASK PROGRESSION QUERY METHODS
    // ----------------------------------------------------
    getAreaTasks(roomKey) {
        const rm = this.rooms[roomKey || this.currentRoom];
        if (!rm || !rm.tasks) return [];
        return rm.tasks.map(id => this.renovationDefs[id]).filter(Boolean);
    }

    isTaskCompleted(taskId) {
        if (this.state.renovations && this.state.renovations[taskId] && this.state.renovations[taskId].completed) {
            return true;
        }
        if (window.GameEconomy && window.GameEconomy.data && window.GameEconomy.data.renovations && window.GameEconomy.data.renovations[taskId] && window.GameEconomy.data.renovations[taskId].completed) {
            return true;
        }
        return false;
    }

    isAreaCompleted(taskId) {
        return this.isTaskCompleted(taskId);
    }

    getInstalledOption(taskId) {
        if (this.state.renovations && this.state.renovations[taskId] && this.state.renovations[taskId].completed) {
            return this.state.renovations[taskId];
        }
        if (window.GameEconomy && window.GameEconomy.data && window.GameEconomy.data.renovations && window.GameEconomy.data.renovations[taskId] && window.GameEconomy.data.renovations[taskId].completed) {
            return window.GameEconomy.data.renovations[taskId];
        }
        return null;
    }

    getAreaCompletedTasks(roomKey) {
        const tasks = this.getAreaTasks(roomKey);
        return tasks.filter(t => this.isTaskCompleted(t.id));
    }

    getAreaActiveTask(roomKey) {
        const tasks = this.getAreaTasks(roomKey);
        return tasks.find(t => !this.isTaskCompleted(t.id)) || null;
    }

    getAreaLevel(roomKey) {
        const done = this.getAreaCompletedTasks(roomKey).length;
        return done + 1;
    }

    getAreaProgress(roomKey) {
        const tasks = this.getAreaTasks(roomKey);
        if (!tasks.length) return 0;
        const done = this.getAreaCompletedTasks(roomKey).length;
        return Math.round((done / tasks.length) * 100);
    }

    getCurrentSequentialAreaId() {
        const active = this.getAreaActiveTask(this.currentRoom);
        return active ? active.id : null;
    }

    getNextUpgradeCost(taskId) {
        if (this.isTaskCompleted(taskId)) return 0;
        const def = this.renovationDefs[taskId];
        return def ? def.baseCost : 1200;
    }

    getNextUpgradeStars(taskId) {
        if (this.isTaskCompleted(taskId)) return 0;
        const def = this.renovationDefs[taskId];
        return def ? def.starsNeeded : 1;
    }

    // ----------------------------------------------------
    // 4. STATE PERSISTENCE
    // ----------------------------------------------------
    loadState() {
        try {
            if (window.GameEconomy) {
                this.state.coins = window.GameEconomy.getBalance();
                this.state.stars = window.GameEconomy.getStars();
                if (window.GameEconomy.data && window.GameEconomy.data.renovations) {
                    this.state.renovations = { ...window.GameEconomy.data.renovations };
                }
            }
            const raw = localStorage.getItem('velvetSecretsGossipHarborHotel_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                this.state = { ...this.state, ...parsed };
                if (window.GameEconomy) {
                    this.state.coins = window.GameEconomy.getBalance();
                    this.state.stars = window.GameEconomy.getStars();
                    const econRenos = (window.GameEconomy.data && window.GameEconomy.data.renovations) || {};
                    this.state.renovations = { ...this.state.renovations, ...econRenos };
                }
            }
            this.recalcHotelStats();
        } catch (e) {}
    }

    saveState() {
        try {
            localStorage.setItem('velvetSecretsGossipHarborHotel_v1', JSON.stringify(this.state));
            if (window.GameEconomy && window.GameEconomy.data) {
                window.GameEconomy.data.renovations = { ...window.GameEconomy.data.renovations, ...this.state.renovations };
                window.GameEconomy.save();
            }
        } catch (e) {}
    }

    recalcHotelStats() {
        let baseIncome = 45;
        let baseRep = 120;
        let completedCount = 0;

        Object.keys(this.renovationDefs).forEach((taskId) => {
            const def = this.renovationDefs[taskId];
            const installed = this.getInstalledOption(taskId);
            if (def && installed) {
                const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
                if (opt) {
                    baseIncome += opt.incomeBoost;
                    baseRep += opt.repBoost;
                    completedCount++;
                }
            }
        });

        this.state.incomePerMin = baseIncome;
        this.state.reputation = baseRep;
        this.state.hotelStars = Math.min(5, 3 + Math.floor(completedCount / 3));
        this.updateHUD();
    }

    // ----------------------------------------------------
    // 5. AFFORDABILITY NOTIFICATION FOR ACTIVE TASK
    // ----------------------------------------------------
    checkAffordableNotifications(silentFirstLoad = false) {
        const activeTask = this.getAreaActiveTask(this.currentRoom);
        if (!activeTask) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const cost = activeTask.baseCost;
        const starsReq = activeTask.starsNeeded;
        const notifyKey = `${activeTask.id}_ready`;

        if (balance >= cost && stars >= starsReq) {
            if (!this.notifiedAffordable.has(notifyKey)) {
                this.notifiedAffordable.add(notifyKey);
                if (!silentFirstLoad) {
                    this.showAffordabilityToast(activeTask, cost);
                }
            }
        } else {
            this.notifiedAffordable.delete(notifyKey);
        }
    }

    showAffordabilityToast(task, cost) {
        this.playSound('chime');
        let toast = document.getElementById('budgetAlertToast');
        if (!toast) return;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        toast.innerHTML = `
            <div class="budget-toast-inner">
                <div class="bt-icon">🔔</div>
                <div class="bt-content">
                    <strong>BÜTÇENİZ HAZIR! (${task.name})</strong>
                    <p>Mevcut kasanız ($${balance}) bu restorasyon için yeterli ($${cost})! Şimdi 3 farklı lüks tasarımdan birini seçip mekana kurun.</p>
                </div>
                <div class="bt-actions">
                    <button class="bt-go-btn" onclick="hotel3D.openBottomDesignDock('${task.id}', true)">🎨 3 Tasarımdan Seç</button>
                    <button class="bt-close-btn" onclick="document.getElementById('budgetAlertToast').style.display='none'">&times;</button>
                </div>
            </div>
        `;
        toast.style.display = 'block';
        clearTimeout(this.affordToastTimer);
        this.affordToastTimer = setTimeout(() => {
            toast.style.display = 'none';
        }, 8000);
    }

    // ----------------------------------------------------
    // 6. AUDIO SYNTHESIZER
    // ----------------------------------------------------
    initAudio() {
        this.audioCtx = null;
    }

    playSound(type) {
        try {
            const AudioClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioClass) return;
            if (!this.audioCtx) this.audioCtx = new AudioClass();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const ctx = this.audioCtx;
            const now = ctx.currentTime;

            if (type === 'step') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(55, now + 0.06);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'renovate') {
                [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.18, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.45);
                });
            } else if (type === 'door') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'cash') {
                [880, 1320].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                    gain.gain.setValueAtTime(0.15, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.3);
                });
            } else if (type === 'chime') {
                [659.25, 880, 1174.66].forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                    gain.gain.setValueAtTime(0.11, now + idx * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.1);
                    osc.stop(now + idx * 0.1 + 0.35);
                });
            }
        } catch (e) {}
    }

    // ----------------------------------------------------
    // 7. PAN & ZOOM INTERACTIONS
    // ----------------------------------------------------
    initStageInteractions() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage) return;

        let startX = 0;
        let startY = 0;
        let initialPanX = 0;
        let initialPanY = 0;

        stage.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || e.target.closest('.gh-stage-pin-btn') || e.target.closest('.gh-map-room-node')) {
                return;
            }
            this.isDraggingStage = true;
            startX = e.clientX;
            startY = e.clientY;
            initialPanX = this.panX;
            initialPanY = this.panY;
            stage.setPointerCapture(e.pointerId);
        });

        stage.addEventListener('pointermove', (e) => {
            if (!this.isDraggingStage) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            this.panX = Math.max(-90, Math.min(90, initialPanX + dx * 0.6));
            this.panY = Math.max(-45, Math.min(45, initialPanY + dy * 0.5));
            this.applyCameraTransform();
        });

        const endDrag = () => {
            this.isDraggingStage = false;
        };

        stage.addEventListener('pointerup', endDrag);
        stage.addEventListener('pointercancel', endDrag);
    }

    applyCameraTransform() {
        const inner = document.querySelector('#ghSceneStage .gh-room-canvas');
        if (!inner) return;
        inner.style.transform = `translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.zoom})`;
    }

    focusCameraOnPin(pinX, pinY) {
        this.panX = Math.max(-65, Math.min(65, (50 - pinX) * 1.2));
        this.panY = Math.max(-30, Math.min(30, (50 - pinY) * 0.8));
        this.zoom = 1.04;
        this.applyCameraTransform();
    }

    resetCameraView() {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.applyCameraTransform();
        this.closeBottomDesignDock();
    }

    // ----------------------------------------------------
    // 8. RENDER CRYSTAL-CLEAR ROOM PANORAMA OR RESORT MAP
    // ----------------------------------------------------
    toggleMapMode(forceState) {
        if (typeof forceState === 'boolean') {
            this.isMapMode = forceState;
        } else {
            this.isMapMode = !this.isMapMode;
        }
        this.playSound('door');
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        if (this.isMapMode) {
            this.closeBottomDesignDock();
        }
        this.renderStage();
        this.updateCurrentLocationTag();
    }

    renderStage() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage) return;

        const mapBtn = document.getElementById('ghToggleMapBtn');
        if (mapBtn) {
            mapBtn.innerHTML = this.isMapMode ? '🏠 Odaya Dön' : '🗺️ Harita';
        }

        if (this.isMapMode) {
            this.renderIsometricResortMap(stage);
        } else {
            this.renderRoomPanorama(stage);
        }
        this.updateCurrentLocationTag();
    }

    renderIsometricResortMap(stage) {
        let nodesHtml = '';
        Object.keys(this.rooms).forEach((roomKey) => {
            const rm = this.rooms[roomKey];
            const tasks = rm.tasks || [];
            let completedInRoom = 0;
            tasks.forEach(tId => {
                if (this.isTaskCompleted(tId)) completedInRoom++;
            });

            const allDone = (completedInRoom >= tasks.length);
            const isActiveRoom = (this.currentRoom === roomKey);
            const activeTask = this.getAreaActiveTask(roomKey);

            nodesHtml += `
                <div class="gh-map-room-node ${isActiveRoom ? 'current-room' : ''} ${activeTask ? 'has-ready' : ''}"
                     style="left: ${rm.mapPos.x}%; top: ${rm.mapPos.y}%;"
                     onclick="hotel3D.jumpTo('${roomKey}')">
                    <div class="gh-map-thumb" style="background-image: url('${rm.bgImg}');">
                        <span class="gh-map-lv-pill">${completedInRoom}/${tasks.length} Görev</span>
                        ${activeTask ? `<span class="gh-map-ready-hammer">🔨 Restorasyon</span>` : ''}
                    </div>
                    <div class="gh-map-node-body">
                        <strong>${rm.shortName}</strong>
                        <small>${allDone ? '✅ Tamamlandı' : (activeTask ? `🎯 ${activeTask.name}` : 'İlerlemede')}</small>
                    </div>
                </div>
            `;
        });

        stage.innerHTML = `
            <div class="gh-room-canvas gh-isometric-map-canvas" style="background-image: linear-gradient(180deg, rgba(10,14,24,0.35), rgba(10,14,24,0.68)), url('assets/scene_hotel_exterior.jpg');">
                <div class="gh-map-header-banner">
                    <span>✦ AURELIA PALACE OTEL HARİTASI — Gitmek istediğiniz alana dokunun!</span>
                </div>
                <svg class="gh-map-paths" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="50" y1="66" x2="20" y2="60" stroke="rgba(255,215,0,0.55)" stroke-width="0.9" stroke-dasharray="2,1.5" />
                    <line x1="50" y1="66" x2="80" y2="60" stroke="rgba(255,215,0,0.55)" stroke-width="0.9" stroke-dasharray="2,1.5" />
                    <line x1="50" y1="66" x2="50" y2="36" stroke="rgba(255,215,0,0.55)" stroke-width="0.9" stroke-dasharray="2,1.5" />
                    <line x1="50" y1="36" x2="20" y2="32" stroke="rgba(255,215,0,0.55)" stroke-width="0.9" stroke-dasharray="2,1.5" />
                    <line x1="50" y1="36" x2="80" y2="32" stroke="rgba(255,215,0,0.55)" stroke-width="0.9" stroke-dasharray="2,1.5" />
                    <line x1="50" y1="66" x2="50" y2="14" stroke="rgba(0,240,255,0.65)" stroke-width="0.9" stroke-dasharray="1.5,1.5" />
                </svg>
                ${nodesHtml}
            </div>
        `;
    }

    renderRoomPanorama(stage) {
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const activeTask = this.getAreaActiveTask(this.currentRoom);
        const activeTaskId = activeTask ? activeTask.id : null;

        // Update character dialogue banner below the stage
        const dlgEl = document.getElementById('hotelDialogueText');
        if (dlgEl) {
            if (activeTask) {
                dlgEl.textContent = `${rm.shortName} Sıradaki Görev: "${activeTask.name}" ($${activeTask.baseCost}) — 3 farklı lüks tasarımdan beğendiğinizi seçip mekana kurun!`;
            } else {
                dlgEl.textContent = `👑 Tebrikler! ${rm.shortName} tüm restorasyon görevleri başarıyla tamamlandı!`;
            }
        }

        let furnitureLayersHtml = '';
        let pinsHtml = '';

        const taskList = rm.tasks || [];
        taskList.forEach((tId) => {
            const def = this.renovationDefs[tId];
            if (!def) return;

            const installed = this.getInstalledOption(tId);
            const isCompleted = Boolean(installed);
            const isActive = (tId === activeTaskId);
            const isPreviewingThis = (this.previewingRenovation && this.previewingRenovation.id === tId);

            // Determine visual state:
            // 1. Previewing option in bottom dock: show chosen preview option
            // 2. Already installed & completed: permanently show installed option
            // 3. Otherwise: show worn old state ('old')
            const stateKey = isPreviewingThis
                ? this.previewingRenovation.optionId
                : (installed ? installed.optionId : 'old');

            const sBox = def.stageBox || [0.30, 0.40, 0.40, 0.35];
            const leftPct = (sBox[0] * 100).toFixed(2);
            const topPct = (sBox[1] * 100).toFixed(2);
            const widthPct = (sBox[2] * 100).toFixed(2);
            const heightPct = (sBox[3] * 100).toFixed(2);

            furnitureLayersHtml += `
                <img class="gh-seamless-stage-furniture ${isPreviewingThis ? 'is-previewing-layer' : ''}"
                     src="assets/designs/stage_${tId}_${stateKey}.png"
                     onerror="this.style.display='none'"
                     alt="${def.name}"
                     style="left:${leftPct}%; top:${topPct}%; width:${widthPct}%; height:${heightPct}%;" />
            `;

            // Clean action hotspot ONLY for the active unrenovated task in this room
            if (!isCompleted && isActive) {
                const cost = def.baseCost;
                const starsReq = def.starsNeeded;
                const canAfford = (balance >= cost && stars >= starsReq);

                if (isPreviewingThis) {
                    const optObj = def.options[this.selectedOptionIndex] || def.options[0];
                    pinsHtml += `
                        <button class="gh-stage-pin-btn pin-previewing"
                                style="left: ${def.pinX}%; top: ${Math.max(12, def.pinY - 14)}%;"
                                onclick="hotel3D.openBottomDesignDock('${tId}', true)">
                            👁️ ${optObj.style} Önizleniyor
                        </button>
                    `;
                } else {
                    pinsHtml += `
                        <button class="gh-stage-pin-btn ${canAfford ? 'pin-active-ready' : 'pin-active-saving'}"
                                style="left: ${def.pinX}%; top: ${def.pinY}%;"
                                onclick="hotel3D.openBottomDesignDock('${tId}', true)">
                            🔨 Görev ${def.order}: ${def.name} ($${cost})
                        </button>
                    `;
                }
            }
        });

        stage.innerHTML = `
            <div class="gh-room-canvas" style="background-image: url('${rm.bgImg}'); background-size: 100% 100%; transform: translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.zoom});">
                ${furnitureLayersHtml}
                ${pinsHtml}
            </div>
        `;
    }

    // ----------------------------------------------------
    // 9. GOSSIP HARBOR AREA RENOVATION HUB / TASK SHEET (#renovationProximityPanel)
    // ----------------------------------------------------
    updateProximityPanel() {
        const proxPanel = document.getElementById('renovationProximityPanel');
        if (!proxPanel) return;

        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        const tasks = this.getAreaTasks(this.currentRoom);
        const completedTasks = this.getAreaCompletedTasks(this.currentRoom);
        const activeTask = this.getAreaActiveTask(this.currentRoom);
        const areaLevel = this.getAreaLevel(this.currentRoom);
        const progressPct = this.getAreaProgress(this.currentRoom);

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;

        // Build list of all tasks for this area
        let tasksListHtml = '';
        tasks.forEach((t) => {
            const installed = this.getInstalledOption(t.id);
            const isCompleted = Boolean(installed);
            const isActive = (activeTask && t.id === activeTask.id);
            const isLocked = (!isCompleted && !isActive);

            let rowClass = 'task-row-locked';
            let badgeClass = 'badge-locked';
            let badgeText = `🔒 Görev ${t.order}`;
            let descText = t.defaultDesc;

            if (isCompleted) {
                const opt = t.options.find(o => o.id === installed.optionId) || t.options[0];
                rowClass = 'task-row-completed';
                badgeClass = 'badge-done';
                badgeText = '✅ TAMAMLANDI';
                descText = `Kuruldu: <b>${opt.name}</b> (${opt.style})`;
            } else if (isActive) {
                const canAfford = (balance >= t.baseCost && stars >= t.starsNeeded);
                rowClass = 'task-row-active';
                badgeClass = canAfford ? 'badge-ready' : 'badge-saving';
                badgeText = canAfford ? `🟢 HAZIR ($${t.baseCost})` : `🎯 AKTİF GÖREV ($${t.baseCost})`;
                descText = t.shortDesc || t.defaultDesc;
            } else {
                descText = `Önceki görev tamamlandığında açılır ($${t.baseCost})`;
            }

            tasksListHtml += `
                <div class="gh-area-task-item ${rowClass}">
                    <div class="task-item-left">
                        <span class="task-order-pill ${badgeClass}">${badgeText}</span>
                        <div class="task-item-text">
                            <strong>${t.order}. ${t.name}</strong>
                            <small>${descText}</small>
                        </div>
                    </div>
                    <div class="task-item-right">
                        ${isCompleted ? `
                            <span class="task-check-mark">✓</span>
                        ` : (isActive ? `
                            <button class="task-action-btn ${balance >= t.baseCost ? 'btn-green' : 'btn-gold'}"
                                    onclick="hotel3D.openBottomDesignDock('${t.id}', true)">
                                ${balance >= t.baseCost ? '3 Tasarımdan Seç ➔' : `Maliyet: $${t.baseCost}`}
                            </button>
                        ` : `
                            <span class="task-locked-icon">🔒</span>
                        `)}
                    </div>
                </div>
            `;
        });

        // Exact requirements layout inspired by Gossip Harbour
        let activeCardHtml = '';
        if (activeTask) {
            const cost = activeTask.baseCost;
            const canAfford = (balance >= cost && stars >= activeTask.starsNeeded);
            const stillNeeded = Math.max(0, cost - balance);
            const taskThumb = `assets/designs/${activeTask.id}_opt_a.jpg`;

            activeCardHtml = `
                <div class="gh-gossip-task-card ${canAfford ? 'card-ready' : 'card-saving'}">
                    <div class="gh-gt-header">
                        <span class="gh-gt-tag ${canAfford ? 'tag-ready' : 'tag-saving'}">
                            ${canAfford ? '🟢 BÜTÇE HAZIR! TASARIM SEÇEBİLİRSİNİZ' : '⏳ BÜTÇE BİRİKTİRİLİYOR (IN PROGRESS)'}
                        </span>
                        <span class="gh-gt-step">GÖREV ${activeTask.order} / ${tasks.length}</span>
                    </div>

                    <div class="gh-gt-body">
                        <div class="gh-gt-thumb" style="background-image: url('${taskThumb}');">
                            <span class="gh-gt-thumb-badge">${activeTask.order}</span>
                        </div>
                        <div class="gh-gt-info">
                            <h4>${activeTask.name}</h4>
                            <p>${activeTask.shortDesc || activeTask.defaultDesc}</p>
                            <div class="gh-gt-reward-pills">
                                <span class="rw-pill income">+$${activeTask.incomeBoost}/dk Gelir</span>
                                <span class="rw-pill rep">+${activeTask.repBoost} Prestij</span>
                            </div>
                        </div>
                    </div>

                    <!-- 4 Clear Metrics: Cost, Balance, Still Needed, Status -->
                    <div class="gh-gt-metrics-grid">
                        <div class="gt-metric-box">
                            <label>Görev Maliyeti</label>
                            <b class="text-gold">$${cost}</b>
                        </div>
                        <div class="gt-metric-box">
                            <label>Mevcut Kasa</label>
                            <b>$${balance}</b>
                        </div>
                        <div class="gt-metric-box highlight">
                            <label>${canAfford ? 'Kalan Bütçe' : 'Kalan İhtiyaç'}</label>
                            <b class="${canAfford ? 'text-green' : 'text-danger'}">
                                ${canAfford ? '+$' + (balance - cost) : '-$' + stillNeeded}
                            </b>
                        </div>
                        <div class="gt-metric-box">
                            <label>Durum</label>
                            <b class="${canAfford ? 'text-green' : 'text-warn'}">
                                ${canAfford ? 'Hazır!' : 'İlerlemede'}
                            </b>
                        </div>
                    </div>

                    <!-- Prominent Action Buttons -->
                    <div class="gh-gt-action-bar">
                        ${canAfford ? `
                            <button class="gh-gt-btn-renovate pulse" onclick="hotel3D.openBottomDesignDock('${activeTask.id}', true)">
                                🔨 3 FARKLI TASARIMDAN BİRİNİ SEÇ &amp; KUR ($${cost})
                            </button>
                        ` : `
                            <button class="gh-gt-btn-earn" onclick="hotel3D.goToMergeBoardForFunds('${activeTask.id}', ${stillNeeded})">
                                ⚡ Birleştirme Masasında Kazan ($${stillNeeded} Eksik)
                            </button>
                        `}
                    </div>
                </div>
            `;
        } else {
            activeCardHtml = `
                <div class="gh-area-completed-banner">
                    <div class="completed-icon">👑</div>
                    <div class="completed-text">
                        <h4>${rm.name.toUpperCase()} TAMAMEN RESTORE EDİLDİ!</h4>
                        <p>Bu alandaki tüm lüks mobilyalar ve dekorasyonlar kalıcı olarak kuruldu. Otelinizin prestiji en üst seviyeye ulaştı!</p>
                    </div>
                </div>
            `;
        }

        proxPanel.innerHTML = `
            <div class="gh-area-hub-wrapper">
                <div class="gh-hub-header">
                    <div class="gh-hub-title-box">
                        <span class="gh-hub-crest">✦ AURELIA PALACE RESTORASYON MERKEZİ</span>
                        <h3>${rm.name.toUpperCase()}</h3>
                        <p>${rm.description}</p>
                    </div>
                    <div class="gh-hub-lvl-badge">
                        <span class="gh-hub-lvl-num">SEVİYE ${areaLevel}</span>
                        <span class="gh-hub-lvl-pct">%${progressPct} (${completedTasks.length}/${tasks.length} Görev)</span>
                    </div>
                </div>

                <div class="gh-hub-progress-track">
                    <div class="gh-hub-progress-bar" style="width: ${progressPct}%;"></div>
                </div>

                ${activeCardHtml}

                <div class="gh-area-tasks-section">
                    <h4 class="gh-tasks-sec-title">📋 ${rm.shortName} Tüm Restorasyon Görevleri (${tasks.length} Aşama)</h4>
                    <div class="gh-area-task-list">
                        ${tasksListHtml}
                    </div>
                </div>
            </div>
        `;
        proxPanel.style.display = 'block';
    }

    goToMergeBoardForFunds(taskId, neededAmount) {
        if (window.switchMainPage) {
            window.switchMainPage('pageBoard');
        }
        const noticeEl = document.getElementById('notice');
        if (noticeEl) {
            noticeEl.innerHTML = `🎯 <b>Restoran Görevi İçin:</b> Masadaki siparişleri hazırlayıp teslim ederek eksik <b>$${neededAmount}</b> altın kazanın!`;
        }
        this.showBanner(`🧩 Masadaki siparişleri teslim ederek eksik $${neededAmount} kazanın!`);
    }

    // ----------------------------------------------------
    // 10. GOSSIP HARBOR 3-DESIGN SELECTION DOCK (#ghBottomDesignDock)
    // ----------------------------------------------------
    openBottomDesignDock(taskId, scrollAndPulse = false) {
        const dock = document.getElementById('ghBottomDesignDock');
        if (!dock) return;
        const targetId = taskId || this.getCurrentSequentialAreaId();
        const def = this.renovationDefs[targetId];
        if (!def) return;

        this.selectedAreaId = targetId;
        this.isRenovationDockOpen = true;

        if (!this.previewingRenovation || this.previewingRenovation.id !== targetId) {
            this.selectedOptionIndex = 0;
        }

        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];
        this.previewingRenovation = { id: targetId, optionId: chosenOpt.id };

        dock.style.display = 'block';
        this.renderBottomDesignDock();
        this.updateProximityPanel();
        this.renderStage();

        if (scrollAndPulse) {
            dock.classList.remove('dock-pulse-highlight');
            void dock.offsetWidth;
            dock.classList.add('dock-pulse-highlight');
            clearTimeout(this.dockPulseTimer);
            this.dockPulseTimer = setTimeout(() => {
                dock.classList.remove('dock-pulse-highlight');
            }, 2200);

            setTimeout(() => {
                if (dock.scrollIntoView) {
                    dock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 60);
        }
    }

    closeBottomDesignDock() {
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        const dock = document.getElementById('ghBottomDesignDock');
        if (dock) {
            dock.classList.remove('dock-pulse-highlight');
            dock.style.display = 'none';
            dock.innerHTML = '';
        }
        this.updateProximityPanel();
        this.renderStage();
    }

    selectBottomDockOption(taskId, idx) {
        const def = this.renovationDefs[taskId];
        if (!def || !def.options[idx]) return;
        this.selectedAreaId = taskId;
        this.selectedOptionIndex = idx;
        const opt = def.options[idx];
        this.previewingRenovation = { id: taskId, optionId: opt.id };
        this.playSound('chime');
        this.renderBottomDesignDock();
        this.updateProximityPanel();
        this.renderStage();
        this.showBanner(`👁️ ${opt.name} (${opt.style}) sahnede önizleniyor!`);
    }

    renderBottomDesignDock() {
        const dock = document.getElementById('ghBottomDesignDock');
        if (!dock) return;
        if (!this.isRenovationDockOpen) {
            dock.style.display = 'none';
            return;
        }

        const activeId = this.selectedAreaId || this.getCurrentSequentialAreaId();
        const def = this.renovationDefs[activeId];
        if (!def || this.isTaskCompleted(activeId)) {
            this.closeBottomDesignDock();
            return;
        }

        dock.style.display = 'block';
        const cost = def.baseCost;
        const starsNeeded = def.starsNeeded;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = (balance >= cost && stars >= starsNeeded);
        const stillNeeded = Math.max(0, cost - balance);

        let cardsHtml = '';
        def.options.forEach((opt, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            const thumbSrc = opt.previewImg || `assets/designs/${def.id}_${opt.id}.jpg`;

            cardsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${def.id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}');">
                        <span class="gh-dock-opt-num">${idx + 1}. ${opt.style}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ SEÇİLİ</span>' : '<span class="gh-dock-lock-tag">👁️ Önizle</span>'}
                    </div>
                    <div class="gh-dock-opt-meta">
                        <strong>${opt.icon} ${opt.name}</strong>
                        <p class="opt-desc-snippet">${opt.desc}</p>
                        <small>+$${opt.incomeBoost}/dk Gelir · +${opt.repBoost} Prestij</small>
                    </div>
                </div>
            `;
        });

        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];

        dock.innerHTML = `
            <div class="gh-dock-header">
                <div class="gh-dock-title-wrap">
                    <span class="gh-dock-lvl-badge">🎨 GÖREV ${def.order} · 3 FARKLI TASARIM VE RENK SEÇENEĞİ</span>
                    <h4>${def.name} — Beğendiğiniz Tasarımı Seçip Onaylayın:</h4>
                </div>
                <div class="gh-dock-header-right">
                    <button class="gh-dock-close-btn" onclick="hotel3D.closeBottomDesignDock()">&times;</button>
                </div>
            </div>

            <div class="gh-dock-options-grid">
                ${cardsHtml}
            </div>

            <div class="gh-dock-footer">
                <div class="gh-dock-budget-info">
                    <span>Maliyet: <b class="text-gold">$${cost}</b></span>
                    <span>Kasanız: <b>$${balance}</b></span>
                    <span class="${canAfford ? 'text-green' : 'text-warn'}">
                        ${canAfford ? `🟢 Bütçe Hazır! (Kalan: $${balance - cost})` : `⏳ $${stillNeeded} Daha Gerekli`}
                    </span>
                </div>
                <div class="gh-dock-action-btns">
                    ${canAfford ? `
                        <button class="gh-dock-confirm-btn ready" onclick="hotel3D.executePurchase('${def.id}', '${chosenOpt.id}')">
                            ✓ Seçimi Onayla &amp; Mekana Kur ($${cost})
                        </button>
                    ` : `
                        <button class="gh-dock-confirm-btn locked" onclick="hotel3D.goToMergeBoardForFunds('${def.id}', ${stillNeeded})">
                            ⚡ Masada Kazan ($${stillNeeded} Eksik)
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 11. CONFIRMATION & PERMANENT ONE-TIME PURCHASE
    // ----------------------------------------------------
    executePurchase(taskId, optionId) {
        const def = this.renovationDefs[taskId];
        if (!def) return;

        if (this.isTaskCompleted(taskId)) {
            this.closeBottomDesignDock();
            this.showBanner('✅ Bu görev zaten tamamlandı!');
            return;
        }

        const opt = def.options.find(o => o.id === optionId) || def.options[0];
        if (!opt) return;

        const costCoins = def.baseCost;
        const costStars = def.starsNeeded;

        if (window.GameEconomy) {
            const res = window.GameEconomy.purchaseRenovation(
                taskId,
                optionId,
                costCoins,
                costStars,
                `${def.name} (${opt.name})`
            );
            if (!res.success) {
                this.showBanner('Yetersiz bakiye! Masadan sipariş teslim edin.');
                return;
            }
            this.state.coins = res.remainingBalance;
        } else {
            if (this.state.coins < costCoins) {
                this.showBanner('Yetersiz bakiye!');
                return;
            }
            this.state.coins -= costCoins;
        }

        // Permanently record completed task with chosen design
        this.state.renovations[taskId] = { optionId: optionId, completed: true, timestamp: Date.now() };
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.closeBottomDesignDock();

        // Update selectedAreaId to the next available task in this area
        const nextTask = this.getAreaActiveTask(this.currentRoom);
        if (nextTask) {
            this.selectedAreaId = nextTask.id;
        }

        this.renderStage();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        const stageEl = document.getElementById('ghSceneStage');
        if (stageEl && stageEl.scrollIntoView) {
            setTimeout(() => {
                stageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 60);
        }

        if (nextTask) {
            this.showBanner(`✅ "${opt.name}" mekana kalıcı olarak kuruldu! Sıradaki görev açıldı: "${nextTask.name}"`);
        } else {
            const rm = this.rooms[this.currentRoom];
            this.showBanner(`👑 Tebrikler! "${rm.shortName}" tüm restorasyon görevleri başarıyla tamamlandı!`);
        }
    }

    // ----------------------------------------------------
    // 12. ROOM JUMP & NAVIGATION
    // ----------------------------------------------------
    jumpTo(roomKey) {
        if (!this.rooms[roomKey]) return;

        this.isMapMode = false;
        this.currentRoom = roomKey;
        const rm = this.rooms[roomKey];

        const activeTask = this.getAreaActiveTask(roomKey);
        if (activeTask) {
            this.selectedAreaId = activeTask.id;
        }

        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;

        this.playSound('door');

        document.querySelectorAll('.room-jump-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.room-jump-btn[onclick*="${roomKey}"]`);
        if (btn) btn.classList.add('active');

        this.closeBottomDesignDock();
        this.renderStage();
        this.updateProximityPanel();
        this.showBanner(`📍 ${rm.name} sahnesine geçildi.`);
    }

    // ----------------------------------------------------
    // 13. PASSIVE INCOME & HUD
    // ----------------------------------------------------
    updateEconomy() {
        const now = Date.now();
        const elapsedSeconds = (now - this.state.lastIncomeTick) / 1000;

        if (elapsedSeconds >= 3) {
            const gained = Math.floor((this.state.incomePerMin / 60) * elapsedSeconds);
            if (gained > 0) {
                this.state.uncollectedIncome += gained;
                this.state.lastIncomeTick = now;
                this.updateHUD();
            }
        }
    }

    collectIncome() {
        if (this.state.uncollectedIncome <= 0) {
            this.showBanner('Henüz toplanacak otel geliri birikmedi.');
            return;
        }

        const amt = this.state.uncollectedIncome;
        this.state.uncollectedIncome = 0;
        this.playSound('cash');
        if (window.GameEconomy) {
            window.GameEconomy.addHotelIncome(amt, 'Otel Kasası Toplanan Pasif Gelir');
        } else {
            this.state.coins += amt;
            this.saveState();
        }
        this.checkAffordableNotifications();
        this.showBanner(`💰 +$${amt} Otel Geliri Kasaya Eklendi!`);
    }

    updateHUD() {
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const coinEl = document.getElementById('hudCoins');
        const starEl = document.getElementById('hudStars');
        const rateEl = document.getElementById('hudRate');
        const uncollectedEl = document.getElementById('hudUncollected');
        const hotelStarsEl = document.getElementById('hudHotelStars');

        if (coinEl) coinEl.innerText = `$${balance}`;
        if (starEl) starEl.innerText = stars;
        if (rateEl) rateEl.innerText = `+$${this.state.incomePerMin}/dk`;
        if (uncollectedEl) uncollectedEl.innerText = `$${this.state.uncollectedIncome}`;
        if (hotelStarsEl) {
            hotelStarsEl.innerHTML = '⭐'.repeat(Math.max(1, this.state.hotelStars));
        }
    }

    updateCurrentLocationTag() {
        const tag = document.getElementById('hudLocationTag');
        if (!tag) return;
        if (this.isMapMode) {
            tag.innerText = '🗺️ Aurelia Palace — Otel Haritası';
            return;
        }
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        tag.innerText = `📍 ${rm.name}`;
    }

    showBanner(msg) {
        let el = document.getElementById('hudNotification');
        if (!el) return;
        el.innerText = msg;
        el.style.display = 'block';
        clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
            el.style.display = 'none';
        }, 3200);
    }

    // ----------------------------------------------------
    // 14. AREA SHOWCASE GALLERY CARDS (#hotelAreasVisualGrid)
    // ----------------------------------------------------
    renderHotelAreaCards() {
        const grid = document.getElementById('hotelAreasVisualGrid');
        if (!grid) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        let cardsHtml = '';
        Object.keys(this.rooms).forEach((roomKey) => {
            const rm = this.rooms[roomKey];
            const tasks = rm.tasks || [];
            const completedCount = this.getAreaCompletedTasks(roomKey).length;
            const activeTask = this.getAreaActiveTask(roomKey);
            const level = this.getAreaLevel(roomKey);
            const progress = this.getAreaProgress(roomKey);

            let statusLabel = `SEVİYE ${level} (${progress}%)`;
            let statusClass = 'badge-saving';

            if (completedCount >= tasks.length) {
                statusLabel = '✅ TAMAMLANDI';
                statusClass = 'badge-max';
            } else if (activeTask && balance >= activeTask.baseCost) {
                statusLabel = '🟢 GÖREV HAZIR!';
                statusClass = 'badge-ready';
            }

            cardsHtml += `
                <div class="hotel-visual-area-card ${completedCount >= tasks.length ? 'area-upgraded' : ''}"
                     onclick="hotel3D.jumpTo('${roomKey}')">
                    <div class="hotel-area-img-box" style="background-image: url('${rm.bgImg}')">
                        <div class="hotel-area-top-badges">
                            <span class="hotel-area-cat">${rm.floorLabel}</span>
                            <span class="hotel-area-status ${statusClass}">${statusLabel}</span>
                        </div>
                        <div class="hotel-area-bottom-overlay">
                            <h4>${rm.shortName}</h4>
                        </div>
                    </div>
                    <div class="hotel-area-body">
                        <div class="area-cond-line">
                            <small>Sıradaki Adım:</small>
                            <b>${activeTask ? `${activeTask.order}. ${activeTask.name} ($${activeTask.baseCost})` : 'Tüm Görevler Tamamlandı!'}</b>
                        </div>
                        <div class="area-card-actions">
                            <button class="area-walk-btn" onclick="hotel3D.jumpTo('${roomKey}')">
                                📍 Mekana Git &amp; Restore Et ➔
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = cardsHtml;
    }

    openProjectPlanModal() {
        let modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        let rowsHtml = '';
        Object.keys(this.rooms).forEach(roomKey => {
            const rm = this.rooms[roomKey];
            const tasks = rm.tasks || [];
            const completedTasks = this.getAreaCompletedTasks(roomKey);
            const activeTask = this.getAreaActiveTask(roomKey);
            const level = this.getAreaLevel(roomKey);
            const progress = this.getAreaProgress(roomKey);

            rowsHtml += `
                <div class="proj-area-row" style="margin-bottom:12px; background:#161924; border:1px solid rgba(255,215,0,0.2); border-radius:12px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h4 style="margin:0; color:#fff; font-size:13px;">${rm.shortName}</h4>
                        <span style="font-size:10px; font-weight:800; color:#ffd700; background:rgba(255,215,0,0.15); padding:2px 8px; border-radius:6px;">SEVİYE ${level} (%${progress})</span>
                    </div>
                    <p style="margin:0 0 8px; font-size:11px; color:#cbd5e1;">${activeTask ? `Sıradaki: <b>${activeTask.name}</b> (Maliyet: $${activeTask.baseCost})` : '✅ Tüm görevler tamamlandı'}</p>
                    <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.jumpTo('${roomKey}')">
                        📍 Mekana Git &amp; Görevi Gör
                    </button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div>
                        <span class="proj-crest">✦ AURELIA PALACE RESTORASYON PLANI</span>
                        <h3>Tüm Otel Alanları &amp; Seviyeleri</h3>
                    </div>
                    <button class="reno-close-btn" onclick="document.getElementById('projectPlanModal').style.display='none'">&times;</button>
                </div>
                <div class="proj-list-scroll">
                    ${rowsHtml}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    onResize() {
        this.renderStage();
        if (this.isRenovationDockOpen) {
            this.renderBottomDesignDock();
        }
    }
}

window.Hotel3DSimulator = Hotel3DSimulator;

window.jumpToRoom = function(room) {
    if (window.hotel3D) window.hotel3D.jumpTo(room);
};

window.initHotel3D = function() {
    if (!window.hotel3D && document.getElementById('hotel3DContainer')) {
        window.hotel3D = new Hotel3DSimulator('hotel3DContainer');
    } else if (window.hotel3D) {
        window.hotel3D.renderStage();
        window.hotel3D.renderBottomDesignDock();
        window.hotel3D.updateProximityPanel();
        window.hotel3D.renderHotelAreaCards();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.initHotel3D();
    }, 150);
});
