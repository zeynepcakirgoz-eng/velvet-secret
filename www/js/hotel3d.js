// ========================================================
// VELVET SECRETS â€” GOSSIP HARBOR STYLE HOTEL RENOVATION ENGINE
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
                name: 'Riviera Gurme Restoran & Åampanya BarÄ±',
                shortName: 'ğŸ· Riviera Restoran',
                floorLabel: 'Zemin Kat Â· DoÄŸu TerasÄ±',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                mapPos: { x: 80, y: 60 },
                description: 'Monako yat limanÄ± manzaralÄ± aÃ§Ä±k hava lÃ¼ks gurme restoranÄ±.',
                dialogue: 'Riviera Restoran: Gurme yemek masalarÄ±nÄ± kurup ÅŸampanya barÄ± ve teras aydÄ±nlatmasÄ±yla mekanÄ± dÃ¶nÃ¼ÅŸtÃ¼rÃ¼n!',
                tasks: ['restaurant_tables', 'restaurant_bar', 'restaurant_lighting', 'restaurant_terrace']
            },
            lobby: {
                id: 'lobby',
                name: 'Aurelia Palace BÃ¼yÃ¼k Lobi & Resepsiyon',
                shortName: 'ğŸ›ï¸ BÃ¼yÃ¼k Lobi',
                floorLabel: 'Zemin Kat Â· Merkez Kanat',
                bgImg: 'assets/scene_lobby_reception.jpg',
                mapPos: { x: 50, y: 66 },
                description: 'Kraliyet karÅŸÄ±lamasÄ±nÄ±n ve otel ihtiÅŸamÄ±nÄ±n mermer salonu.',
                dialogue: 'BÃ¼yÃ¼k Lobi: Resepsiyon bankosu, Bohemya avizesi ve ipek halÄ±larla otelimize layÄ±k bir karÅŸÄ±lama salonu yaratÄ±n!',
                tasks: ['reception_desk', 'lobby_chandelier', 'lobby_carpet', 'lobby_columns']
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz ManzaralÄ± Suit (Oda 101)',
                shortName: 'ğŸ›ï¸ Suit 101',
                floorLabel: '1. Kat Â· BatÄ± KanadÄ±',
                bgImg: 'assets/scene_presidential_suite.jpg',
                mapPos: { x: 20, y: 60 },
                description: 'Panoramik Akdeniz manzaralÄ± ultra-lÃ¼ks VIP konuk suiti.',
                dialogue: 'Deluxe Suit 101: DÃ¶rt direkli kraliyet yataÄŸÄ± ve manzara balkonuyla Monako sosyetesine layÄ±k bir suit hazÄ±rlayÄ±n.',
                tasks: ['room101_bed', 'room101_decor', 'room101_lounge']
            },
            pool: {
                id: 'pool',
                name: 'Aurelia Sonsuzluk Havuzu & GÃ¼neÅŸ TerasÄ±',
                shortName: 'ğŸŠ Sonsuzluk Havuzu',
                floorLabel: 'Kuzey Sahil TerasÄ±',
                bgImg: 'assets/scene_infinity_pool.jpg',
                mapPos: { x: 50, y: 36 },
                description: 'Monako kÃ¶rfezini tepeden gÃ¶ren altÄ±n mozaikli sonsuzluk havuzu.',
                dialogue: 'Sonsuzluk Havuzu: Havuzu yenileyin, VIP localarÄ± ve akÅŸam ateÅŸ Ã§ukurunu kurarak muhteÅŸem bir teras oluÅŸturun.',
                tasks: ['swimming_pool', 'pool_cabanas', 'pool_lounge']
            },
            spa: {
                id: 'spa',
                name: 'Aurelia Zen Termal Spa & Jakuzi',
                shortName: 'â™¨ï¸ Zen Spa',
                floorLabel: 'KuzeydoÄŸu Mermer Pavyonu',
                bgImg: 'assets/scene_spa_wellness.jpg',
                mapPos: { x: 80, y: 32 },
                description: 'DoÄŸal sÄ±cak mineralli kaynak suyu ve masaj pavyonu.',
                dialogue: 'Zen Termal Spa: Mermer jakuzi ve dinlenme yataklarÄ±yla huzur dolu bir ÅŸifa merkezi inÅŸa edin.',
                tasks: ['spa_jacuzzi', 'spa_beds', 'spa_waterfall']
            },
            garden: {
                id: 'garden',
                name: 'Akdeniz Botanik BahÃ§esi & Ã‡eÅŸme',
                shortName: 'ğŸŒ¹ Botanik BahÃ§e',
                floorLabel: 'KuzeybatÄ± Kraliyet Avlusu',
                bgImg: 'assets/scene_garden_terrace.jpg',
                mapPos: { x: 20, y: 32 },
                description: 'Nadir gÃ¼ller, mermer saray Ã§eÅŸmesi ve gÃ¶lgeli pergolalar.',
                dialogue: 'Botanik BahÃ§e: 3 katlÄ± saray Ã§eÅŸmesini onarÄ±n, sarmaÅŸÄ±k gÃ¼llÃ¼ pergolayla avluyu canlandÄ±rÄ±n.',
                tasks: ['garden_courtyard', 'garden_pergola', 'garden_pavilion']
            },
            penthouse: {
                id: 'penthouse',
                name: '2. Kat BaÅŸkanlÄ±k Penthouse & Piyano Salonu',
                shortName: 'ğŸ‘‘ 2. Kat Penthouse',
                floorLabel: '2. Kat Â· Ã‡atÄ± KatÄ± Suiti',
                bgImg: 'assets/scene_penthouse_piano.jpg',
                mapPos: { x: 50, y: 14 },
                description: 'Ã‡atÄ± katÄ± suitinde kuyruklu konser piyanosu ve ÅŸÃ¶mine salonu.',
                dialogue: '2. Kat Penthouse: Konser piyanosu ve mermer ÅŸÃ¶mineli salonu kurarak en seÃ§kin gala sÃ¼itini tamamlayÄ±n.',
                tasks: ['penthouse_suite', 'penthouse_fireplace', 'penthouse_terrace']
            }
        };
    }

    // ----------------------------------------------------
    // 2. RENOVATION TASK DEFINITIONS WITH 3 DISTINCT CHOICES
    // ----------------------------------------------------
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
                name: 'Riviera Yemek MasalarÄ±nÄ± DeÄŸiÅŸtir',
                area: 'Riviera Restoran Â· GÃ¶rev 1/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.28, 0.62, 0.70, 0.38],
                pinX: 58,
                pinY: 76,
                defaultDesc: 'Ã–rtÃ¼sÃ¼z eski ahÅŸap masalar ve sade sandalyeler (Yenilenmedi)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & AÃ§Ä±k MeÅŸe',
                        style: 'Modern Zarafet',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: 'ğŸ½ï¸',
                        desc: 'AÃ§Ä±k meÅŸe ahÅŸap ayaklar, Ä°talyan Carrara mermeri masa tablasÄ± ve fÄ±rÃ§alanmÄ±ÅŸ pirinÃ§ detaylar.',
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
                        icon: 'ğŸŒ¹',
                        desc: 'Derin siyah Ä°spanyol mermeri gÃ¶vde, bordo kapitone kadife koltuklar ve altÄ±n ÅŸamdanlar.',
                        previewImg: 'assets/designs/restaurant_tables_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Koyu Maun AhÅŸap & Akdeniz Riviera',
                        style: 'Klasik Premium',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'ğŸ·',
                        desc: 'DoÄŸal koyu maun masif ahÅŸap, turkuaz ipek yastÄ±klar ve Akdeniz ferforje sandalyeler.',
                        previewImg: 'assets/designs/restaurant_tables_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_tables_opt_c.png'
                    }
                ]
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                room: 'restaurant',
                order: 2,
                name: 'Oniks Åampanya & Kokteyl BarÄ±',
                area: 'Riviera Restoran Â· GÃ¶rev 2/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.00, 0.44, 0.36, 0.52],
                pinX: 18,
                pinY: 62,
                defaultDesc: 'BoÅŸ raflÄ±, Ä±ÅŸÄ±ksÄ±z eski iÃ§ecek tezgÃ¢hÄ± (Yenilenmedi)',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Arkadan AydÄ±nlatmalÄ± Amber Oniks & AltÄ±n Bar',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: 'ğŸ¸',
                        desc: 'SÄ±cak amber Ä±ÅŸÄ±ltÄ±lÄ± bal oniksi bar tezgÃ¢hÄ±, altÄ±n fÄ±rÃ§alanmÄ±ÅŸ pirinÃ§ bar tabureleri ve kristal raflar.',
                        previewImg: 'assets/designs/restaurant_bar_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'ZÃ¼mrÃ¼t YeÅŸili Mermer & Siyah Kadife Bar',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: 'ğŸ¾',
                        desc: 'Nadir zÃ¼mrÃ¼t damarlÄ± mermer Ã¶n panel, siyah kadife oturma grubu ve konyak vitrini.',
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
                        icon: 'ğŸ¥‚',
                        desc: 'Beyaz Carrara mermeri, Akdeniz mavisi cam mozaikler ve tik aÄŸacÄ± ada bar tabureleri.',
                        previewImg: 'assets/designs/restaurant_bar_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_bar_opt_c.png'
                    }
                ]
            },
            restaurant_lighting: {
                id: 'restaurant_lighting',
                room: 'restaurant',
                order: 3,
                name: 'Teras Avizeleri & SÄ±cak AydÄ±nlatma',
                area: 'Riviera Restoran Â· GÃ¶rev 3/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.20, 0.04, 0.60, 0.38],
                pinX: 50,
                pinY: 18,
                defaultDesc: 'SÃ¶nÃ¼k eski fenerler ve yetersiz gece Ä±ÅŸÄ±klandÄ±rmasÄ±',
                baseCost: 1500,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Geometrik AltÄ±n HalkalÄ± Kristal SarkÄ±tlar',
                        style: 'Modern Zarafet',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: 'âœ¨',
                        desc: 'AltÄ±n kaplama iÃ§ iÃ§e geÃ§en geometrik halkalar ve sÄ±cak Ä±ÅŸÄ±k saÃ§an elmas kristaller.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_lighting_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Mum IÅŸÄ±klÄ± 3 Kollu PirinÃ§ Kraliyet ÅamdanlarÄ±',
                        style: 'Kraliyet Kadife',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 68,
                        icon: 'ğŸ•¯ï¸',
                        desc: 'Bordo mumlu, antika pirinÃ§ten dÃ¶vÃ¼lmÃ¼ÅŸ masif kraliyet masa ÅŸamdanlarÄ±.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_lighting_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Asma Bohemya Cam Fenerler & SÄ±cak LED IÅŸÄ±klar',
                        style: 'Klasik Premium',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: 'ğŸ®',
                        desc: 'El yapÄ±mÄ± turkuaz Bohemya cam fenerler ve pergoladan sarkan yÄ±ldÄ±z LED zincirleri.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_lighting_opt_c.png'
                    }
                ]
            },
            restaurant_terrace: {
                id: 'restaurant_terrace',
                room: 'restaurant',
                order: 4,
                name: 'Mermer Teras Zemini & Gala Dekoru',
                area: 'Riviera Restoran Â· GÃ¶rev 4/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.58, 0.46, 0.42, 0.48],
                pinX: 78,
                pinY: 66,
                defaultDesc: 'YÄ±pranmÄ±ÅŸ taÅŸ zemin ve sade teras korkuluklarÄ±',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'FildiÅŸi Mermer Zemin & Beyaz Orkide AranjmanlarÄ±',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: 'ğŸŒ¸',
                        desc: 'Parlak fildiÅŸi cilalÄ± Ä°talyan mermer zemin ve 24K altÄ±n ayaklÄ±klÄ± beyaz orkideler.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_a.jpg',
                        stageImg: 'assets/designs/stage_restaurant_terrace_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo HalÄ± Yolu & KÄ±rmÄ±zÄ± Kadife GÃ¼ller',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 100,
                        icon: 'ğŸŒ¹',
                        desc: 'Ã–zel dokuma bordo kadife protokol halÄ±sÄ± ve kristal vazolarda kÄ±rmÄ±zÄ± taze gÃ¼ller.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_b.jpg',
                        stageImg: 'assets/designs/stage_restaurant_terrace_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik AÄŸacÄ± GÃ¼verte & Monako Limon AÄŸaÃ§larÄ±',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 110,
                        icon: 'ğŸ‹',
                        desc: 'Yat gÃ¼vertesi tarzÄ± doÄŸal masif tik zemin ve piÅŸmiÅŸ toprak saksÄ±larda Akdeniz limon aÄŸaÃ§larÄ±.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_c.jpg',
                        stageImg: 'assets/designs/stage_restaurant_terrace_opt_c.png'
                    }
                ]
            },

            // === BÃœYÃœK LOBÄ° & RESEPSÄ°YON TASKS ===
            reception_desk: {
                id: 'reception_desk',
                room: 'lobby',
                order: 1,
                name: 'Mermer Resepsiyon Bankosu',
                area: 'BÃ¼yÃ¼k Lobi Â· GÃ¶rev 1/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.33, 0.49, 0.33, 0.27],
                pinX: 50,
                pinY: 56,
                defaultDesc: 'Eski, yÄ±pranmÄ±ÅŸ ahÅŸap resepsiyon bankosu (Yenilenmedi)',
                baseCost: 1500,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & 24K AltÄ±n Banko',
                        style: 'Modern Zarafet',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: 'ğŸ›ï¸',
                        desc: 'Parlak beyaz Ä°talyan Carrara mermeri, 24 ayar altÄ±n sÃ¼tun ÅŸeritleri ve sÄ±cak karÅŸÄ±lama Ä±ÅŸÄ±ÄŸÄ±.',
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
                        icon: 'ğŸŒ¹',
                        desc: 'Kapitone bordo kraliyet kadifesi, siyah Nero mermer gÃ¶vde ve pembe-altÄ±n LED aydÄ±nlatma.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz-ZÃ¼mrÃ¼t DamarlÄ± Mermer & Maun Banko',
                        style: 'Klasik Premium',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: 'ğŸ’',
                        desc: 'Akdeniz turkuazÄ± ve zÃ¼mrÃ¼t damarlÄ± nadir mermer gÃ¶vde, fÄ±rÃ§alanmÄ±ÅŸ pirinÃ§ detaylar.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg',
                        stageImg: 'assets/designs/stage_reception_desk_opt_c.png'
                    }
                ]
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                room: 'lobby',
                order: 2,
                name: 'BÃ¼yÃ¼k Lobi Kristal Avizesi',
                area: 'BÃ¼yÃ¼k Lobi Â· GÃ¶rev 2/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.37, 0.00, 0.26, 0.41],
                pinX: 50,
                pinY: 22,
                defaultDesc: 'Tozlu, sÃ¶nÃ¼k eski tavan avizesi (Yenilenmedi)',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Elmas & 24K AltÄ±n Saray Avizesi',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'âœ¨',
                        desc: '3 katlÄ± elmas kesim beyaz Bohemya kristalleri ve 24 ayar altÄ±n mum kollarÄ±.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_a.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Yakut KÄ±rmÄ±zÄ±sÄ± & Pembe AltÄ±n Ä°mparatorluk Avizesi',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: 'ğŸŒº',
                        desc: 'KÄ±zÄ±l yakut kristal damlalar ve sÄ±cak romantik gala aydÄ±nlatmasÄ±.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_b.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Venedik Murano Turkuaz & ZÃ¼mrÃ¼t Kristal Avize',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: 'ğŸ’',
                        desc: 'El Ã¼flemesi turkuaz ve zÃ¼mrÃ¼t Venedik Murano kristalleriyle deniz Ä±ÅŸÄ±ltÄ±sÄ±.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_c.jpg',
                        stageImg: 'assets/designs/stage_lobby_chandelier_opt_c.png'
                    }
                ]
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                room: 'lobby',
                order: 3,
                name: 'Lobi Kraliyet HalÄ±sÄ± & KoltuklarÄ±',
                area: 'BÃ¼yÃ¼k Lobi Â· GÃ¶rev 3/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.66, 0.46, 0.32, 0.34],
                pinX: 78,
                pinY: 62,
                defaultDesc: 'Soluk koridor halÄ±sÄ± ve eski koltuklar (Yenilenmedi)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem Ä°pek HalÄ± & Ä°nci BeyazÄ± Berjer Koltuklar',
                        style: 'Modern Zarafet',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 25,
                        repBoost: 40,
                        icon: 'ğŸ›‹ï¸',
                        desc: 'FildiÅŸi-altÄ±n dokuma saray halÄ±sÄ± ve inci beyazÄ± lÃ¼ks dinlenme berjerleri.',
                        previewImg: 'assets/designs/lobby_carpet_opt_a.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kraliyet Madalyon HalÄ± & Kadife Kanepeler',
                        style: 'Kraliyet Kadife',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 50,
                        icon: 'ğŸ‘‘',
                        desc: 'Koyu bordo saray halÄ±sÄ±, altÄ±n saÃ§aklar ve bordo kraliyet kadife kanepeleri.',
                        previewImg: 'assets/designs/lobby_carpet_opt_b.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & ZÃ¼mrÃ¼t Riviera HalÄ± & Maun Koltuklar',
                        style: 'Klasik Premium',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 60,
                        icon: 'ğŸŒŠ',
                        desc: 'ZÃ¼mrÃ¼t ve turkuaz Akdeniz motifli halÄ± ve oymalÄ± masif maun koltuklar.',
                        previewImg: 'assets/designs/lobby_carpet_opt_c.jpg',
                        stageImg: 'assets/designs/stage_lobby_carpet_opt_c.png'
                    }
                ]
            },
            lobby_columns: {
                id: 'lobby_columns',
                room: 'lobby',
                order: 4,
                name: 'Saray KarÅŸÄ±lama SÃ¼tunlarÄ± & Kemeri',
                area: 'BÃ¼yÃ¼k Lobi Â· GÃ¶rev 4/4',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.00, 0.25, 0.28, 0.55],
                pinX: 14,
                pinY: 48,
                defaultDesc: 'Sade sÄ±valÄ± giriÅŸ kapÄ±sÄ±',
                baseCost: 1700,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Ä°yonik Beyaz Mermer SÃ¼tunlar & AltÄ±n IÅŸÄ±k',
                        style: 'Modern Zarafet',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: 'ğŸ›ï¸',
                        desc: 'Klasik Ä°yonik beyaz mermer sÃ¼tunlar ve gizli altÄ±n LED aydÄ±nlatma.',
                        previewImg: 'assets/designs/lobby_columns_opt_a.jpg',
                        stageImg: 'assets/designs/stage_lobby_columns_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Nero SÃ¼tunlar & Bordo YaldÄ±zlÄ± Kemer',
                        style: 'Kraliyet Kadife',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 75,
                        icon: 'ğŸŒ¹',
                        desc: 'Siyah mermer gÃ¶vde, bordo yaldÄ±zlÄ± saray kemeri ve altÄ±n arma.',
                        previewImg: 'assets/designs/lobby_columns_opt_b.jpg',
                        stageImg: 'assets/designs/stage_lobby_columns_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz OymalÄ± Maun & Turkuaz Mozaik SÃ¼tun',
                        style: 'Klasik Premium',
                        cost: 1700,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 85,
                        icon: 'ğŸ’',
                        desc: 'Nadir maun oymalar ve turkuaz-zÃ¼mrÃ¼t cam mozaikli sÃ¼tun baÅŸlÄ±klarÄ±.',
                        previewImg: 'assets/designs/lobby_columns_opt_c.jpg',
                        stageImg: 'assets/designs/stage_lobby_columns_opt_c.png'
                    }
                ]
            },

            // === DELUXE SUIT 101 TASKS ===
            room101_bed: {
                id: 'room101_bed',
                room: 'room101',
                order: 1,
                name: 'Deluxe Suit Kraliyet YataÄŸÄ±',
                area: 'Suit 101 Â· GÃ¶rev 1/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.01, 0.48, 0.46, 0.46],
                pinX: 25,
                pinY: 66,
                defaultDesc: 'Standart eski karyola ve sade baÅŸlÄ±k (Yenilenmedi)',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Ä°pek ve 24K AltÄ±n DÃ¶rt Direkli Yatak',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: 'ğŸ›ï¸',
                        desc: 'Bembeyaz ipek Ã§arÅŸaflar, 24K altÄ±n direkli saray yatak baÅŸlÄ±ÄŸÄ± ve ortopedik kral yatak.',
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
                        icon: 'ğŸ‘‘',
                        desc: 'Koyu bordo kapitone kadife yatak baÅŸlÄ±ÄŸÄ±, siyah lake gÃ¶vde ve kaz tÃ¼yÃ¼ yastÄ±klar.',
                        previewImg: 'assets/designs/room101_bed_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_bed_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz TÃ¼l Cibinlikli ve Masif Maun Yatak',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: 'ğŸŒŠ',
                        desc: 'DoÄŸal maun aÄŸacÄ± oymalÄ± yatak, deniz esintili turkuaz tÃ¼l cibinlik ve keten Ã¶rtÃ¼ler.',
                        previewImg: 'assets/designs/room101_bed_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_bed_opt_c.png'
                    }
                ]
            },
            room101_decor: {
                id: 'room101_decor',
                room: 'room101',
                order: 2,
                name: 'Panoramik Deniz Balkonu & Åezlonglar',
                area: 'Suit 101 Â· GÃ¶rev 2/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.48, 0.34, 0.50, 0.54],
                pinX: 72,
                pinY: 56,
                defaultDesc: 'BoÅŸ pencere Ã¶nÃ¼ ve eski sehpa (Yenilenmedi)',
                baseCost: 1400,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Deri Åezlonglar & Cam Åampanya SehpasÄ±',
                        style: 'Modern Zarafet',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: 'ğŸ¥‚',
                        desc: 'Modern beyaz deri teras ÅŸezlonglarÄ± ve krom ÅŸampanya kovasÄ± masasÄ±.',
                        previewImg: 'assets/designs/room101_decor_opt_a.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'ZÃ¼mrÃ¼t Kadife Koltuk & ÅÃ¶mineli Teras MasasÄ±',
                        style: 'Kraliyet Kadife',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: 'ğŸ”¥',
                        desc: 'ZÃ¼mrÃ¼t yeÅŸili kadife berjerler ve mini bio-etanol ateÅŸ masasÄ±.',
                        previewImg: 'assets/designs/room101_decor_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik AÄŸacÄ± Akdeniz Teras TakÄ±mÄ± & Begonviller',
                        style: 'Klasik Premium',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'ğŸŒº',
                        desc: 'Masif tik aÄŸacÄ± oturma grubu ve deniz manzaralÄ± canlÄ± begonvil saksÄ±larÄ±.',
                        previewImg: 'assets/designs/room101_decor_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_decor_opt_c.png'
                    }
                ]
            },
            room101_lounge: {
                id: 'room101_lounge',
                room: 'room101',
                order: 3,
                name: 'Mermer ÅÃ¶mine & Gece AydÄ±nlatmasÄ±',
                area: 'Suit 101 Â· GÃ¶rev 3/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.24, 0.28, 0.32, 0.44],
                pinX: 40,
                pinY: 46,
                defaultDesc: 'BoÅŸ oda kÃ¶ÅŸesi',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Mermer Elektrikli ÅÃ¶mine & AltÄ±n Ayna',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'ğŸ”¥',
                        desc: 'Ä°talyan mermeri ÅŸÃ¶mine, 24K altÄ±n varaklÄ± boy aynasÄ± ve kristal abajurlar.',
                        previewImg: 'assets/designs/room101_lounge_opt_a.jpg',
                        stageImg: 'assets/designs/stage_room101_lounge_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Granit ÅÃ¶mine & Bordo Puf AlanÄ±',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: 'ğŸŒ¹',
                        desc: 'CilalÄ± siyah granit ÅŸÃ¶mine, bordo kapitone kadife puflar ve ÅŸamdanlar.',
                        previewImg: 'assets/designs/room101_lounge_opt_b.jpg',
                        stageImg: 'assets/designs/stage_room101_lounge_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz DoÄŸal TaÅŸ ÅÃ¶mine & Masif Paravan',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: 'ğŸ’',
                        desc: 'Akdeniz kalker taÅŸÄ± ÅŸÃ¶mine, oyma ahÅŸap giyinme paravanÄ± ve deniz kabuÄŸu aplikler.',
                        previewImg: 'assets/designs/room101_lounge_opt_c.jpg',
                        stageImg: 'assets/designs/stage_room101_lounge_opt_c.png'
                    }
                ]
            },

            // === MONAKO SONSUZLUK HAVUZU TASKS ===
            swimming_pool: {
                id: 'swimming_pool',
                room: 'pool',
                order: 1,
                name: 'Sonsuzluk Havuzu & Mozaik Zemin',
                area: 'Sonsuzluk Havuzu Â· GÃ¶rev 1/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.02, 0.36, 0.90, 0.62],
                pinX: 48,
                pinY: 64,
                defaultDesc: 'BakÄ±msÄ±z havuz ve boÅŸ teras (Yenilenmedi)',
                baseCost: 3500,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'IÅŸÄ±ltÄ±lÄ± Beyaz & AltÄ±n Mozaikli Sonsuzluk Havuzu',
                        style: 'Modern Zarafet',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 110,
                        icon: 'ğŸŠ',
                        desc: 'Bembeyaz cam mozaikler, 24K altÄ±n su tahliye bordÃ¼rÃ¼ ve Monako koyuna taÅŸan ufuk Ã§izgisi.',
                        previewImg: 'assets/designs/swimming_pool_opt_a.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Laciverti & Yakut IÅŸÄ±klÄ± Gece Havuzu',
                        style: 'Kraliyet Kadife',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 120,
                        icon: 'âœ¨',
                        desc: 'Derin kobalt mavisi mozaikler, gece yakut Ä±ÅŸÄ±ltÄ±sÄ± yayan LED havuz lambalarÄ±.',
                        previewImg: 'assets/designs/swimming_pool_opt_b.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz-ZÃ¼mrÃ¼t LagÃ¼n Havuzu & DoÄŸal TaÅŸ',
                        style: 'Klasik Premium',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 135,
                        icon: 'ğŸŒ´',
                        desc: 'Parlak turkuaz zÃ¼mrÃ¼t lagÃ¼n suyu, traverten taÅŸ kenarlar ve sahil taÅŸlarÄ±.',
                        previewImg: 'assets/designs/swimming_pool_opt_c.jpg',
                        stageImg: 'assets/designs/stage_swimming_pool_opt_c.png'
                    }
                ]
            },
            pool_cabanas: {
                id: 'pool_cabanas',
                room: 'pool',
                order: 2,
                name: 'VIP GÃ¼neÅŸlenme LocalarÄ± & Åemsiyeler',
                area: 'Sonsuzluk Havuzu Â· GÃ¶rev 2/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.68, 0.24, 0.30, 0.46],
                pinX: 82,
                pinY: 42,
                defaultDesc: 'Eski plastik ÅŸezlonglar',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Ä°pek TÃ¼llÃ¼ 24K AltÄ±n DetaylÄ± VIP Localar',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: 'â›±ï¸',
                        desc: 'RÃ¼zgarda salÄ±nan beyaz ipek perdeler, kraliyet minderleri ve altÄ±n tavan pervanesi.',
                        previewImg: 'assets/designs/pool_cabanas_opt_a.jpg',
                        stageImg: 'assets/designs/stage_pool_cabanas_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Minderli GÃ¼neÅŸlenme KÃ¶ÅŸkleri',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: 'ğŸ‘‘',
                        desc: 'GÃ¼neÅŸe dayanÄ±klÄ± bordo kadife yataklar ve siyah gÃ¼neÅŸlikler.',
                        previewImg: 'assets/designs/pool_cabanas_opt_b.jpg',
                        stageImg: 'assets/designs/stage_pool_cabanas_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik AÄŸacÄ± Riviera ÅezlonglarÄ± & Ã‡izgili Åemsiyeler',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: 'ğŸ–ï¸',
                        desc: 'Masif tik aÄŸacÄ± Ã§ift kiÅŸilik ÅŸezlonglar ve sarÄ±-beyaz Ã§izgili Riviera ÅŸemsiyeleri.',
                        previewImg: 'assets/designs/pool_cabanas_opt_c.jpg',
                        stageImg: 'assets/designs/stage_pool_cabanas_opt_c.png'
                    }
                ]
            },
            pool_lounge: {
                id: 'pool_lounge',
                room: 'pool',
                order: 3,
                name: 'Havuz BaÅŸÄ± AteÅŸ Ã‡ukuru & Su BarÄ±',
                area: 'Sonsuzluk Havuzu Â· GÃ¶rev 3/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.00, 0.48, 0.34, 0.48],
                pinX: 18,
                pinY: 66,
                defaultDesc: 'BoÅŸ beton teras kenarÄ±',
                baseCost: 2400,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'GÃ¶mme Mermer AteÅŸ Ã‡ukuru & Su BarÄ±',
                        style: 'Modern Zarafet',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: 'ğŸ”¥',
                        desc: 'Su seviyesinde gÃ¶mme dairesel mermer oturma grubu ve ortasÄ±nda gazlÄ± ateÅŸ Ã§ukuru.',
                        previewImg: 'assets/designs/pool_lounge_opt_a.jpg',
                        stageImg: 'assets/designs/stage_pool_lounge_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Bazalt AteÅŸ Kasesi & Kadife Koltuklar',
                        style: 'Kraliyet Kadife',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 100,
                        icon: 'ğŸ¸',
                        desc: 'Siyah bazalt taÅŸtan oyulmuÅŸ lav taÅŸÄ± ateÅŸliÄŸi ve su geÃ§irmez bordo koltuklar.',
                        previewImg: 'assets/designs/pool_lounge_opt_b.jpg',
                        stageImg: 'assets/designs/stage_pool_lounge_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'DoÄŸal Kaya AteÅŸ Pavyonu & Fenerli Teras',
                        style: 'Klasik Premium',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 110,
                        icon: 'ğŸ¹',
                        desc: 'Akdeniz kayalarÄ±ndan Ã¶rÃ¼lmÃ¼ÅŸ ÅŸÃ¶mine pavyonu ve asma deniz fenerleri.',
                        previewImg: 'assets/designs/pool_lounge_opt_c.jpg',
                        stageImg: 'assets/designs/stage_pool_lounge_opt_c.png'
                    }
                ]
            },

            // === ZEN TERMAL SPA TASKS ===
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                room: 'spa',
                order: 1,
                name: 'Aurelia Termal Jakuzi Havuzu',
                area: 'Zen Spa Â· GÃ¶rev 1/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.30, 0.54, 0.62, 0.42],
                pinX: 62,
                pinY: 72,
                defaultDesc: 'SÃ¶nÃ¼k, bakÄ±msÄ±z taÅŸ jakuzi havuzu (Yenilenmedi)',
                baseCost: 2800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri & AltÄ±n Mozaik Roma Jakuzisi',
                        style: 'Modern Zarafet',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: 'â™¨ï¸',
                        desc: 'Bembeyaz Ä°talyan mermeri jakuzi gÃ¶vdesi, 24K altÄ±n mozaik iÃ§ havuz ve aromaterapi buharÄ±.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'KÄ±zÄ±l GÃ¼l Suyu & Yakut Mumlu Romantik Termal Spa',
                        style: 'Kraliyet Kadife',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 62,
                        repBoost: 95,
                        icon: 'ğŸŒº',
                        desc: 'Pembe-kÄ±zÄ±l gÃ¼l terapili termal kaynak suyu ve yakut Ä±ÅŸÄ±ltÄ±lÄ± mermer jakuzi.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'ZÃ¼mrÃ¼t-Turkuaz Mineral Havuz & Zen TaÅŸ Jakuzisi',
                        style: 'Klasik Premium',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 68,
                        repBoost: 105,
                        icon: 'ğŸ‹',
                        desc: 'Derin turkuaz ve zÃ¼mrÃ¼t mineralli ÅŸifalÄ± kaplÄ±ca suyu, nehir taÅŸlarÄ± ve bambu sÃ¼slemeleri.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_jacuzzi_opt_c.png'
                    }
                ]
            },
            spa_beds: {
                id: 'spa_beds',
                room: 'spa',
                order: 2,
                name: 'Aromaterapi Dinlenme YataklarÄ±',
                area: 'Zen Spa Â· GÃ¶rev 2/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.02, 0.44, 0.38, 0.48],
                pinX: 20,
                pinY: 64,
                defaultDesc: 'BoÅŸ dinlenme kÃ¶ÅŸesi',
                baseCost: 1800,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'IsÄ±tmalÄ± Beyaz Seramik Yataklar & Ä°pek Perdeler',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: 'ğŸ›ï¸',
                        desc: 'VÃ¼cut Ä±sÄ±sÄ±na duyarlÄ± seramik ÅŸezlonglar, beyaz keten yastÄ±klar ve lavanta buharÄ±.',
                        previewImg: 'assets/designs/spa_beds_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_beds_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Åezlonglar & Masaj Ä°stasyonu',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'ğŸ’†',
                        desc: 'Suya dayanÄ±klÄ± bordo kadife yataklar, sÄ±cak bazalt taÅŸ masaj seti ve tÃ¼tsÃ¼lÃ¼k.',
                        previewImg: 'assets/designs/spa_beds_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_beds_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'DoÄŸal Bambu Dinlenme Sedirleri & ÅifalÄ± Ã‡ay BarÄ±',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: 'ğŸµ',
                        desc: 'Masif bambu sedirler, Akdeniz bitki Ã§aylarÄ± sunum masasÄ± ve turkuaz yastÄ±klar.',
                        previewImg: 'assets/designs/spa_beds_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_beds_opt_c.png'
                    }
                ]
            },
            spa_waterfall: {
                id: 'spa_waterfall',
                room: 'spa',
                order: 3,
                name: 'Zen Åelalesi & Himalaya Tuz DuvarÄ±',
                area: 'Zen Spa Â· GÃ¶rev 3/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                stageBox: [0.40, 0.16, 0.48, 0.44],
                pinX: 64,
                pinY: 34,
                defaultDesc: 'Sade taÅŸ duvar',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'IÅŸÄ±klÄ± Kristal Cam Su DuvarÄ± & Beyaz Mermer',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: 'ğŸ’§',
                        desc: 'Cam arkasÄ±ndan sÃ¼zÃ¼len su perdesi ve altÄ±n LED aydÄ±nlatmalÄ± beyaz mermer havuz.',
                        previewImg: 'assets/designs/spa_waterfall_opt_a.jpg',
                        stageImg: 'assets/designs/stage_spa_waterfall_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kehribar IÅŸÄ±klÄ± Pembe Himalaya Tuzu TaÅŸ DuvarÄ±',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: 'ğŸ§±',
                        desc: 'Arkadan Ä±ÅŸÄ±klandÄ±rÄ±lmÄ±ÅŸ hakiki pembe kaya tuzu bloklarÄ± ve bronz fÄ±skiye.',
                        previewImg: 'assets/designs/spa_waterfall_opt_b.jpg',
                        stageImg: 'assets/designs/stage_spa_waterfall_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'DoÄŸal Nehir TaÅŸlÄ± Ã‡aÄŸlayan & Bambu SÃ¼sleri',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: 'ğŸ‹',
                        desc: 'Yuvarlak Ã§akÄ±l taÅŸlarÄ± Ã¼zerinden akan mini ÅŸelale ve yeÅŸil bonsai saksÄ±larÄ±.',
                        previewImg: 'assets/designs/spa_waterfall_opt_c.jpg',
                        stageImg: 'assets/designs/stage_spa_waterfall_opt_c.png'
                    }
                ]
            },

            // === AKDENÄ°Z BOTANÄ°K BAHÃ‡ESÄ° TASKS ===
            garden_courtyard: {
                id: 'garden_courtyard',
                room: 'garden',
                order: 1,
                name: '3 KatlÄ± Mermer Saray Ã‡eÅŸmesi',
                area: 'Botanik BahÃ§e Â· GÃ¶rev 1/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.31, 0.33, 0.38, 0.62],
                pinX: 50,
                pinY: 58,
                defaultDesc: 'Susuz, yosun tutmuÅŸ eski taÅŸ Ã§eÅŸme (Yenilenmedi)',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '3 KatlÄ± Beyaz Carrara Mermeri & AltÄ±n Ã‡eÅŸme',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: 'â›²',
                        desc: 'Parlak fildiÅŸi-beyaz mermerden 3 katlÄ± saray Ã§eÅŸmesi ve altÄ±n su aydÄ±nlatmasÄ±.',
                        previewImg: 'assets/designs/garden_courtyard_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'KÄ±zÄ±l GÃ¼l YapraklÄ± & Yakut IÅŸÄ±klÄ± Romantik Ã‡eÅŸme',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 78,
                        icon: 'ğŸŒ¹',
                        desc: 'KÄ±rmÄ±zÄ± gÃ¼l yapraklarÄ±yla dolu yakut ve pembe mermer kraliyet Ã§eÅŸmesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz Mozaik & ZÃ¼mrÃ¼t Havuzlu Riviera Ã‡eÅŸmesi',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 56,
                        repBoost: 86,
                        icon: 'ğŸŒ´',
                        desc: 'Parlayan turkuaz-zÃ¼mrÃ¼t mozaik havuzlu Akdeniz avlu Ã§eÅŸmesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_courtyard_opt_c.png'
                    }
                ]
            },
            garden_pergola: {
                id: 'garden_pergola',
                room: 'garden',
                order: 2,
                name: 'Kraliyet GÃ¼l PergolasÄ± & YÃ¼rÃ¼yÃ¼ÅŸ Yolu',
                area: 'Botanik BahÃ§e Â· GÃ¶rev 2/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.66, 0.24, 0.33, 0.56],
                pinX: 80,
                pinY: 48,
                defaultDesc: 'BakÄ±msÄ±z toprak patika',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz SarmaÅŸÄ±k GÃ¼llÃ¼ Ferforje Pergola & TaÅŸ Yol',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: 'ğŸŒ¿',
                        desc: 'Beyaz gÃ¼llerle sarÄ±lÄ± ferforje kemer tÃ¼neli ve beyaz kireÃ§taÅŸÄ± yÃ¼rÃ¼yÃ¼ÅŸ yolu.',
                        previewImg: 'assets/designs/garden_pergola_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_pergola_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife GÃ¼llÃ¼ Kemerler & Fenerli Mermer Yol',
                        style: 'Kraliyet Kadife',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: 'ğŸŒº',
                        desc: 'Derin kÄ±rmÄ±zÄ± gÃ¼ller ve akÅŸamlarÄ± parÄ±ldayan pirinÃ§ bahÃ§e fenerleri.',
                        previewImg: 'assets/designs/garden_pergola_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_pergola_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'DoÄŸal AhÅŸap Pergola, Begonviller & Mozaik KaldÄ±rÄ±m',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 75,
                        icon: 'ğŸŒ¸',
                        desc: 'Akdeniz sedir aÄŸacÄ± kemerler, pembe begonviller ve renkli taÅŸ mozaik yol.',
                        previewImg: 'assets/designs/garden_pergola_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_pergola_opt_c.png'
                    }
                ]
            },
            garden_pavilion: {
                id: 'garden_pavilion',
                room: 'garden',
                order: 3,
                name: 'Akdeniz Ã‡ay Pavyonu & Fenerler',
                area: 'Botanik BahÃ§e Â· GÃ¶rev 3/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                stageBox: [0.02, 0.28, 0.34, 0.54],
                pinX: 18,
                pinY: 52,
                defaultDesc: 'BoÅŸ Ã§im alan',
                baseCost: 2100,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Neoklasik Beyaz Mermer Pavyon & AltÄ±n SÃ¼s Havuzu',
                        style: 'Modern Zarafet',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 48,
                        repBoost: 72,
                        icon: 'ğŸ›ï¸',
                        desc: 'Kubbe tavanlÄ± beyaz mermer dinlenme kÃ¶ÅŸkÃ¼ ve mermer Ã§ay masasÄ±.',
                        previewImg: 'assets/designs/garden_pavilion_opt_a.jpg',
                        stageImg: 'assets/designs/stage_garden_pavilion_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Tenteli Gala KÃ¶ÅŸkÃ¼ & Bronz Aslan Heykelleri',
                        style: 'Kraliyet Kadife',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: 'ğŸ¦',
                        desc: 'Bordo kumaÅŸ tenteli kraliyet Ã§ardaÄŸÄ± ve koruyucu bronz heykeller.',
                        previewImg: 'assets/designs/garden_pavilion_opt_b.jpg',
                        stageImg: 'assets/designs/stage_garden_pavilion_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'SarmaÅŸÄ±klÄ± Ã‡ay Ã‡ardaÄŸÄ± & Antik TaÅŸ Banklar',
                        style: 'Klasik Premium',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 58,
                        repBoost: 90,
                        icon: 'â˜•',
                        desc: 'YeÅŸillikler iÃ§inde gizli Ã§ay Ã§ardaÄŸÄ± ve gÃ¶lgeli antik Akdeniz taÅŸ banklarÄ±.',
                        previewImg: 'assets/designs/garden_pavilion_opt_c.jpg',
                        stageImg: 'assets/designs/stage_garden_pavilion_opt_c.png'
                    }
                ]
            },

            // === 2. KAT BAÅKANLIK PENTHOUSE TASKS ===
            penthouse_suite: {
                id: 'penthouse_suite',
                room: 'penthouse',
                order: 1,
                name: 'Kuyruklu Konser Piyanosu',
                area: '2. Kat Penthouse Â· GÃ¶rev 1/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.20, 0.32, 0.32, 0.54],
                pinX: 36,
                pinY: 56,
                defaultDesc: 'MatlaÅŸmÄ±ÅŸ, akortsuz eski piyano (Yenilenmedi)',
                baseCost: 5000,
                starsNeeded: 3,
                options: [
                    {
                        id: 'opt_a',
                        name: 'FildiÅŸi Beyaz & 24K AltÄ±n Kraliyet Konser Piyanosu',
                        style: 'Modern Zarafet',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 120,
                        repBoost: 180,
                        icon: 'ğŸ¹',
                        desc: 'Sedefli fildiÅŸi-beyaz gÃ¶vdeli, 24 ayar altÄ±n telli ve parlak cilalÄ± konser piyanosu.',
                        previewImg: 'assets/designs/penthouse_suite_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo KÄ±zÄ±l Lake & AltÄ±n FiligranlÄ± Gala Piyanosu',
                        style: 'Kraliyet Kadife',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 135,
                        repBoost: 200,
                        icon: 'ğŸ‘‘',
                        desc: 'Parlak bordo-kÄ±zÄ±l lake kaplama, kadife tabure ve altÄ±n iÅŸlemeli konser piyanosu.',
                        previewImg: 'assets/designs/penthouse_suite_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'ZÃ¼mrÃ¼t-Turkuaz Sedef & Maun Ã–zel Koleksiyon Piyano',
                        style: 'Klasik Premium',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 150,
                        repBoost: 220,
                        icon: 'ğŸ’',
                        desc: 'ZÃ¼mrÃ¼t ve turkuaz sedef kakmalÄ±, Monako yat limanÄ± manzaralÄ± Ã¶zel kuyruklu piyano.',
                        previewImg: 'assets/designs/penthouse_suite_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_suite_opt_c.png'
                    }
                ]
            },
            penthouse_fireplace: {
                id: 'penthouse_fireplace',
                room: 'penthouse',
                order: 2,
                name: 'Mermer ÅÃ¶mine & Dairesel Kadife Salon',
                area: '2. Kat Penthouse Â· GÃ¶rev 2/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.50, 0.34, 0.48, 0.52],
                pinX: 74,
                pinY: 58,
                defaultDesc: 'KullanÄ±lmayan soÄŸuk ÅŸÃ¶mine',
                baseCost: 3200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem Deri Dairesel Koltuk & Beyaz Mermer ÅÃ¶mine',
                        style: 'Modern Zarafet',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 105,
                        icon: 'ğŸ›‹ï¸',
                        desc: 'ÅÃ¶minenin etrafÄ±nÄ± saran geniÅŸ krem Ä°talyan deri koltuk ve altÄ±n ayna.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_fireplace_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Derin Bordo Kadife Oturma Grubu & Siyah Granit ÅÃ¶mine',
                        style: 'Kraliyet Kadife',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 120,
                        icon: 'ğŸ”¥',
                        desc: 'Monako geceleri iÃ§in romantik bordo kadife koltuklar ve Ã§Ä±tÄ±rdayan ÅŸÃ¶mine ateÅŸi.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_fireplace_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'ZÃ¼mrÃ¼t Ä°pek Koltuklar & Oyma AhÅŸap ÅÃ¶mine BaÅŸlÄ±ÄŸÄ±',
                        style: 'Klasik Premium',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 135,
                        icon: 'ğŸ’',
                        desc: 'Akdeniz zÃ¼mrÃ¼t ipek kumaÅŸ kaplÄ± geniÅŸ salon berjerleri ve ceviz aÄŸacÄ± ÅŸÃ¶mine.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_fireplace_opt_c.png'
                    }
                ]
            },
            penthouse_terrace: {
                id: 'penthouse_terrace',
                room: 'penthouse',
                order: 3,
                name: 'Monako KÃ¶rfezi Ã–zel Manzara TerasÄ± BarÄ±',
                area: '2. Kat Penthouse Â· GÃ¶rev 3/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                stageBox: [0.68, 0.14, 0.32, 0.46],
                pinX: 84,
                pinY: 34,
                defaultDesc: 'BoÅŸ teras korkuluÄŸu',
                baseCost: 3800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'AydÄ±nlatmalÄ± Kristal Bar & AltÄ±n Bar Tabureleri',
                        style: 'Modern Zarafet',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        icon: 'ğŸ¸',
                        desc: 'BÃ¼yÃ¼leyici gece manzarasÄ±na bakan arkadan Ä±ÅŸÄ±klÄ± kristal kokteyl barÄ±.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_a.jpg',
                        stageImg: 'assets/designs/stage_penthouse_terrace_opt_a.png'
                    },
                    {
                        id: 'opt_b',
                        name: 'Yakut AynalÄ± Åampanya BarÄ± & Bordo Deri Koltuklar',
                        style: 'Kraliyet Kadife',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 95,
                        repBoost: 140,
                        icon: 'ğŸ¾',
                        desc: 'Ã–zel vintage ÅŸampanyalarÄ±n sergilendiÄŸi yakut aynalÄ± VIP bar kÃ¶ÅŸesi.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_b.jpg',
                        stageImg: 'assets/designs/stage_penthouse_terrace_opt_b.png'
                    },
                    {
                        id: 'opt_c',
                        name: 'Yat GÃ¼vertesi TarzÄ± Tik Bar & Akdeniz ManzarasÄ±',
                        style: 'Klasik Premium',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 105,
                        repBoost: 155,
                        icon: 'â›µ',
                        desc: 'SÃ¼peryat gÃ¼vertesi iÅŸÃ§iliÄŸinde doÄŸal tik aÄŸacÄ± aÃ§Ä±k hava teras barÄ±.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_c.jpg',
                        stageImg: 'assets/designs/stage_penthouse_terrace_opt_c.png'
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
                <div class="bt-icon">ğŸ””</div>
                <div class="bt-content">
                    <strong>BÃœTÃ‡ENÄ°Z HAZIR! (${task.name})</strong>
                    <p>Mevcut kasanÄ±z ($${balance}) bu restorasyon iÃ§in yeterli ($${cost})! Åimdi 3 farklÄ± lÃ¼ks tasarÄ±mdan birini seÃ§ip mekana kurun.</p>
                </div>
                <div class="bt-actions">
                    <button class="bt-go-btn" onclick="hotel3D.openBottomDesignDock('${task.id}', true)">ğŸ¨ 3 TasarÄ±mdan SeÃ§</button>
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
            mapBtn.innerHTML = this.isMapMode ? 'ğŸ  Odaya DÃ¶n' : 'ğŸ—ºï¸ Harita';
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
                        <span class="gh-map-lv-pill">${completedInRoom}/${tasks.length} GÃ¶rev</span>
                        ${activeTask ? `<span class="gh-map-ready-hammer">ğŸ”¨ Restorasyon</span>` : ''}
                    </div>
                    <div class="gh-map-node-body">
                        <strong>${rm.shortName}</strong>
                        <small>${allDone ? 'âœ… TamamlandÄ±' : (activeTask ? `ğŸ¯ ${activeTask.name}` : 'Ä°lerlemede')}</small>
                    </div>
                </div>
            `;
        });

        stage.innerHTML = `
            <div class="gh-room-canvas gh-isometric-map-canvas" style="background-image: linear-gradient(180deg, rgba(10,14,24,0.35), rgba(10,14,24,0.68)), url('assets/scene_hotel_exterior.jpg');">
                <div class="gh-map-header-banner">
                    <span>âœ¦ AURELIA PALACE OTEL HARÄ°TASI â€” Gitmek istediÄŸiniz alana dokunun!</span>
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
                dlgEl.textContent = `${rm.shortName} SÄ±radaki GÃ¶rev: "${activeTask.name}" ($${activeTask.baseCost}) â€” 3 farklÄ± lÃ¼ks tasarÄ±mdan beÄŸendiÄŸinizi seÃ§ip mekana kurun!`;
            } else {
                dlgEl.textContent = `ğŸ‘‘ Tebrikler! ${rm.shortName} tÃ¼m restorasyon gÃ¶revleri baÅŸarÄ±yla tamamlandÄ±!`;
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
                            ğŸ‘ï¸ ${optObj.style} Ã–nizleniyor
                        </button>
                    `;
                } else {
                    pinsHtml += `
                        <button class="gh-stage-pin-btn ${canAfford ? 'pin-active-ready' : 'pin-active-saving'}"
                                style="left: ${def.pinX}%; top: ${def.pinY}%;"
                                onclick="hotel3D.openBottomDesignDock('${tId}', true)">
                            ğŸ”¨ GÃ¶rev ${def.order}: ${def.name} ($${cost})
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
            let badgeText = `ğŸ”’ GÃ¶rev ${t.order}`;
            let descText = t.defaultDesc;

            if (isCompleted) {
                const opt = t.options.find(o => o.id === installed.optionId) || t.options[0];
                rowClass = 'task-row-completed';
                badgeClass = 'badge-done';
                badgeText = 'âœ… TAMAMLANDI';
                descText = `Kuruldu: <b>${opt.name}</b> (${opt.style})`;
            } else if (isActive) {
                const canAfford = (balance >= t.baseCost && stars >= t.starsNeeded);
                rowClass = 'task-row-active';
                badgeClass = canAfford ? 'badge-ready' : 'badge-saving';
                badgeText = canAfford ? `ğŸŸ¢ HAZIR ($${t.baseCost})` : `ğŸ¯ AKTÄ°F GÃ–REV ($${t.baseCost})`;
                descText = t.shortDesc || t.defaultDesc;
            } else {
                descText = `Ã–nceki gÃ¶rev tamamlandÄ±ÄŸÄ±nda aÃ§Ä±lÄ±r ($${t.baseCost})`;
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
                            <span class="task-check-mark">âœ“</span>
                        ` : (isActive ? `
                            <button class="task-action-btn ${balance >= t.baseCost ? 'btn-green' : 'btn-gold'}"
                                    onclick="hotel3D.openBottomDesignDock('${t.id}', true)">
                                ${balance >= t.baseCost ? '3 TasarÄ±mdan SeÃ§ â”' : `Maliyet: $${t.baseCost}`}
                            </button>
                        ` : `
                            <span class="task-locked-icon">ğŸ”’</span>
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
                            ${canAfford ? 'ğŸŸ¢ BÃœTÃ‡E HAZIR! TASARIM SEÃ‡EBÄ°LÄ°RSÄ°NÄ°Z' : 'â³ BÃœTÃ‡E BÄ°RÄ°KTÄ°RÄ°LÄ°YOR (IN PROGRESS)'}
                        </span>
                        <span class="gh-gt-step">GÃ–REV ${activeTask.order} / ${tasks.length}</span>
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
                            <label>GÃ¶rev Maliyeti</label>
                            <b class="text-gold">$${cost}</b>
                        </div>
                        <div class="gt-metric-box">
                            <label>Mevcut Kasa</label>
                            <b>$${balance}</b>
                        </div>
                        <div class="gt-metric-box highlight">
                            <label>${canAfford ? 'Kalan BÃ¼tÃ§e' : 'Kalan Ä°htiyaÃ§'}</label>
                            <b class="${canAfford ? 'text-green' : 'text-danger'}">
                                ${canAfford ? '+$' + (balance - cost) : '-$' + stillNeeded}
                            </b>
                        </div>
                        <div class="gt-metric-box">
                            <label>Durum</label>
                            <b class="${canAfford ? 'text-green' : 'text-warn'}">
                                ${canAfford ? 'HazÄ±r!' : 'Ä°lerlemede'}
                            </b>
                        </div>
                    </div>

                    <!-- Prominent Action Buttons -->
                    <div class="gh-gt-action-bar">
                        ${canAfford ? `
                            <button class="gh-gt-btn-renovate pulse" onclick="hotel3D.openBottomDesignDock('${activeTask.id}', true)">
                                ğŸ”¨ 3 FARKLI TASARIMDAN BÄ°RÄ°NÄ° SEÃ‡ &amp; KUR ($${cost})
                            </button>
                        ` : `
                            <button class="gh-gt-btn-earn" onclick="hotel3D.goToMergeBoardForFunds('${activeTask.id}', ${stillNeeded})">
                                âš¡ BirleÅŸtirme MasasÄ±nda Kazan ($${stillNeeded} Eksik)
                            </button>
                        `}
                    </div>
                </div>
            `;
        } else {
            activeCardHtml = `
                <div class="gh-area-completed-banner">
                    <div class="completed-icon">ğŸ‘‘</div>
                    <div class="completed-text">
                        <h4>${rm.name.toUpperCase()} TAMAMEN RESTORE EDÄ°LDÄ°!</h4>
                        <p>Bu alandaki tÃ¼m lÃ¼ks mobilyalar ve dekorasyonlar kalÄ±cÄ± olarak kuruldu. Otelinizin prestiji en Ã¼st seviyeye ulaÅŸtÄ±!</p>
                    </div>
                </div>
            `;
        }

        proxPanel.innerHTML = `
            <div class="gh-area-hub-wrapper">
                <div class="gh-hub-header">
                    <div class="gh-hub-title-box">
                        <span class="gh-hub-crest">âœ¦ AURELIA PALACE RESTORASYON MERKEZÄ°</span>
                        <h3>${rm.name.toUpperCase()}</h3>
                        <p>${rm.description}</p>
                    </div>
                    <div class="gh-hub-lvl-badge">
                        <span class="gh-hub-lvl-num">SEVÄ°YE ${areaLevel}</span>
                        <span class="gh-hub-lvl-pct">%${progressPct} (${completedTasks.length}/${tasks.length} GÃ¶rev)</span>
                    </div>
                </div>

                <div class="gh-hub-progress-track">
                    <div class="gh-hub-progress-bar" style="width: ${progressPct}%;"></div>
                </div>

                ${activeCardHtml}

                <div class="gh-area-tasks-section">
                    <h4 class="gh-tasks-sec-title">ğŸ“‹ ${rm.shortName} TÃ¼m Restorasyon GÃ¶revleri (${tasks.length} AÅŸama)</h4>
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
            noticeEl.innerHTML = `ğŸ¯ <b>Restoran GÃ¶revi Ä°Ã§in:</b> Masadaki sipariÅŸleri hazÄ±rlayÄ±p teslim ederek eksik <b>$${neededAmount}</b> altÄ±n kazanÄ±n!`;
        }
        this.showBanner(`ğŸ§© Masadaki sipariÅŸleri teslim ederek eksik $${neededAmount} kazanÄ±n!`);
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
        this.showBanner(`ğŸ‘ï¸ ${opt.name} (${opt.style}) sahnede Ã¶nizleniyor!`);
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
                        ${isSelected ? '<span class="gh-dock-check-tag">âœ“ SEÃ‡Ä°LÄ°</span>' : '<span class="gh-dock-lock-tag">ğŸ‘ï¸ Ã–nizle</span>'}
                    </div>
                    <div class="gh-dock-opt-meta">
                        <strong>${opt.icon} ${opt.name}</strong>
                        <p class="opt-desc-snippet">${opt.desc}</p>
                        <small>+$${opt.incomeBoost}/dk Gelir Â· +${opt.repBoost} Prestij</small>
                    </div>
                </div>
            `;
        });

        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];

        dock.innerHTML = `
            <div class="gh-dock-header">
                <div class="gh-dock-title-wrap">
                    <span class="gh-dock-lvl-badge">ğŸ¨ GÃ–REV ${def.order} Â· 3 FARKLI TASARIM VE RENK SEÃ‡ENEÄÄ°</span>
                    <h4>${def.name} â€” BeÄŸendiÄŸiniz TasarÄ±mÄ± SeÃ§ip OnaylayÄ±n:</h4>
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
                    <span>KasanÄ±z: <b>$${balance}</b></span>
                    <span class="${canAfford ? 'text-green' : 'text-warn'}">
                        ${canAfford ? `ğŸŸ¢ BÃ¼tÃ§e HazÄ±r! (Kalan: $${balance - cost})` : `â³ $${stillNeeded} Daha Gerekli`}
                    </span>
                </div>
                <div class="gh-dock-action-btns">
                    ${canAfford ? `
                        <button class="gh-dock-confirm-btn ready" onclick="hotel3D.executePurchase('${def.id}', '${chosenOpt.id}')">
                            âœ“ SeÃ§imi Onayla &amp; Mekana Kur ($${cost})
                        </button>
                    ` : `
                        <button class="gh-dock-confirm-btn locked" onclick="hotel3D.goToMergeBoardForFunds('${def.id}', ${stillNeeded})">
                            âš¡ Masada Kazan ($${stillNeeded} Eksik)
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
            this.showBanner('âœ… Bu gÃ¶rev zaten tamamlandÄ±!');
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
                this.showBanner('Yetersiz bakiye! Masadan sipariÅŸ teslim edin.');
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
        this.burstConfetti();
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
            this.showBanner(`✨ "${opt.name}" mekana kalıcı olarak kuruldu! Sıradaki görev açıldı: "${nextTask.name}"`);
        } else {
            const rm = this.rooms[this.currentRoom];
            this.showBanner(`👑 Tebrikler! "${rm.shortName}" tüm restorasyon görevleri başarıyla tamamlandı!`);
        }
    }

    burstConfetti() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage) return;
        const colors = ['#ffd700', '#2ecc71', '#ff4757', '#00d2d3', '#ffffff', '#ff9f43'];
        for (let i = 0; i < 35; i++) {
            const conf = document.createElement('div');
            conf.className = 'gh-celebration-confetti';
            conf.style.left = `${40 + Math.random() * 20}%`;
            conf.style.top = `${45 + Math.random() * 20}%`;
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const tx = (Math.random() - 0.5) * 260;
            const ty = -(60 + Math.random() * 160);
            conf.style.setProperty('--tx', `${tx}px`);
            conf.style.setProperty('--ty', `${ty}px`);
            conf.style.animationDelay = `${Math.random() * 0.15}s`;
            stage.appendChild(conf);
            setTimeout(() => {
                if (conf.parentNode) conf.parentNode.removeChild(conf);
            }, 1400);
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
        this.showBanner(`ğŸ“ ${rm.name} sahnesine geÃ§ildi.`);
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
            this.showBanner('HenÃ¼z toplanacak otel geliri birikmedi.');
            return;
        }

        const amt = this.state.uncollectedIncome;
        this.state.uncollectedIncome = 0;
        this.playSound('cash');
        if (window.GameEconomy) {
            window.GameEconomy.addHotelIncome(amt, 'Otel KasasÄ± Toplanan Pasif Gelir');
        } else {
            this.state.coins += amt;
            this.saveState();
        }
        this.checkAffordableNotifications();
        this.showBanner(`ğŸ’° +$${amt} Otel Geliri Kasaya Eklendi!`);
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
            hotelStarsEl.innerHTML = 'â­'.repeat(Math.max(1, this.state.hotelStars));
        }
    }

    updateCurrentLocationTag() {
        const tag = document.getElementById('hudLocationTag');
        if (!tag) return;
        if (this.isMapMode) {
            tag.innerText = 'ğŸ—ºï¸ Aurelia Palace â€” Otel HaritasÄ±';
            return;
        }
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        tag.innerText = `ğŸ“ ${rm.name}`;
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

            let statusLabel = `SEVÄ°YE ${level} (${progress}%)`;
            let statusClass = 'badge-saving';

            if (completedCount >= tasks.length) {
                statusLabel = 'âœ… TAMAMLANDI';
                statusClass = 'badge-max';
            } else if (activeTask && balance >= activeTask.baseCost) {
                statusLabel = 'ğŸŸ¢ GÃ–REV HAZIR!';
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
                            <small>SÄ±radaki AdÄ±m:</small>
                            <b>${activeTask ? `${activeTask.order}. ${activeTask.name} ($${activeTask.baseCost})` : 'TÃ¼m GÃ¶revler TamamlandÄ±!'}</b>
                        </div>
                        <div class="area-card-actions">
                            <button class="area-walk-btn" onclick="hotel3D.jumpTo('${roomKey}')">
                                ğŸ“ Mekana Git &amp; Restore Et â”
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
                        <span style="font-size:10px; font-weight:800; color:#ffd700; background:rgba(255,215,0,0.15); padding:2px 8px; border-radius:6px;">SEVÄ°YE ${level} (%${progress})</span>
                    </div>
                    <p style="margin:0 0 8px; font-size:11px; color:#cbd5e1;">${activeTask ? `SÄ±radaki: <b>${activeTask.name}</b> (Maliyet: $${activeTask.baseCost})` : 'âœ… TÃ¼m gÃ¶revler tamamlandÄ±'}</p>
                    <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.jumpTo('${roomKey}')">
                        ğŸ“ Mekana Git &amp; GÃ¶revi GÃ¶r
                    </button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div>
                        <span class="proj-crest">âœ¦ AURELIA PALACE RESTORASYON PLANI</span>
                        <h3>TÃ¼m Otel AlanlarÄ± &amp; Seviyeleri</h3>
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
