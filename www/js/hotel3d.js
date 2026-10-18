// ========================================================
// VELVET SECRETS — GOSSIP HARBOR STYLE PHOTOREALISTIC
// SEQUENTIAL SINGLE-PLACEMENT HOTEL RENOVATION ENGINE
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

        this.currentRoom = 'lobby';
        this.isMapMode = false;
        this.selectedAreaId = 'reception_desk';
        this.selectedOptionIndex = 0;
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;
        this.activeModalPoint = null;
        this.notifiedAffordable = new Set();

        // Smooth pan & zoom state for Gossip Harbor room stage
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.isDraggingStage = false;

        this.setupRenovationDefinitions();
        this.setupRoomDefinitions();
        this.loadState();

        // Default selection is always the current active sequential renovation item
        const activeSeq = this.getCurrentSequentialAreaId();
        if (activeSeq && this.renovationDefs[activeSeq]) {
            this.selectedAreaId = activeSeq;
            this.currentRoom = this.renovationDefs[activeSeq].room || 'lobby';
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
                if (this.activeModalPoint) {
                    this.renderModalContent(this.activeModalPoint);
                }
            });
            setTimeout(() => this.checkAffordableNotifications(true), 800);
        }

        // Passive income loop
        setInterval(() => {
            this.updateEconomy();
        }, 1000);
    }

    // ----------------------------------------------------
    // ROOM & ISOMETRIC RESORT MAP DEFINITIONS
    // ----------------------------------------------------
    setupRoomDefinitions() {
        this.rooms = {
            lobby: {
                id: 'lobby',
                name: 'Aurelia Palace Büyük Lobi & Resepsiyon',
                shortName: '🏛️ Büyük Lobi',
                floorLabel: 'Zemin Kat · Merkez Kanat (Sıra 1–3)',
                bgImg: 'assets/scene_lobby_reception.jpg',
                mapPos: { x: 50, y: 66 },
                areas: ['reception_desk', 'lobby_chandelier', 'lobby_carpet'],
                dialogue: 'Büyük Lobi: Sırayla Mermer Resepsiyon Bankosu (Sıra 1), Kristal Avize (Sıra 2) ve Kraliyet Halısı & Koltuklarını (Sıra 3) kurun.'
            },
            restaurant: {
                id: 'restaurant',
                name: 'Riviera Gurme Restoran & Şampanya Barı',
                shortName: '🍷 Riviera Restoran',
                floorLabel: 'Zemin Kat · Doğu Terası (Sıra 4–5)',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                mapPos: { x: 80, y: 60 },
                areas: ['restaurant_tables', 'restaurant_bar'],
                dialogue: 'Riviera Restoran: Sıra 4 Gurme Masaları ve Sıra 5 Şampanya & Kokteyl Barı burada kurulur.'
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz Manzaralı Suit (Oda 101)',
                shortName: '🛏️ Suit 101',
                floorLabel: 'Zemin Kat · Batı Kanadı (Sıra 6–7)',
                bgImg: 'assets/scene_presidential_suite.jpg',
                mapPos: { x: 20, y: 60 },
                areas: ['room101_bed', 'room101_decor'],
                dialogue: 'Deluxe Suit 101: Sıra 6 Kraliyet Yatağı & Lounge ve Sıra 7 Panoramik Deniz Terası burada yer alır.'
            },
            pool: {
                id: 'pool',
                name: 'Aurelia Sonsuzluk Havuzu & Güneş Terası',
                shortName: '🏊 Sonsuzluk Havuzu',
                floorLabel: 'Kuzey Sahil Terası (Sıra 8)',
                bgImg: 'assets/scene_infinity_pool.jpg',
                mapPos: { x: 50, y: 36 },
                areas: ['swimming_pool'],
                dialogue: 'Sonsuzluk Havuzu: Sıra 8 Güneşlenme Locaları & Havuz tasarımı burada seçilir.'
            },
            spa: {
                id: 'spa',
                name: 'Aurelia Zen Termal Spa & Jakuzi Pavyonu',
                shortName: '♨️ Zen Spa',
                floorLabel: 'Kuzeydoğu Mermer Pavyonu (Sıra 9)',
                bgImg: 'assets/scene_spa_wellness.jpg',
                mapPos: { x: 80, y: 32 },
                areas: ['spa_jacuzzi'],
                dialogue: 'Zen Termal Spa: Sıra 9 Mermer Termal Jakuzi kurulumu burada yapılır.'
            },
            garden: {
                id: 'garden',
                name: 'Akdeniz Botanik Gül Bahçesi & Mermer Çeşme',
                shortName: '🌹 Botanik Bahçe',
                floorLabel: 'Kuzeybatı Kraliyet Avlusu (Sıra 10)',
                bgImg: 'assets/scene_garden_terrace.jpg',
                mapPos: { x: 20, y: 32 },
                areas: ['garden_courtyard'],
                dialogue: 'Botanik Bahçe: Sıra 10 Mermer Kraliyet Çeşmesi burada kurulur.'
            },
            penthouse: {
                id: 'penthouse',
                name: '2. Kat Kraliyet Penthouse & Piyano Salonu',
                shortName: '👑 2. Kat Penthouse',
                floorLabel: '2. Kat · Çatı Katı Suiti (Sıra 11)',
                bgImg: 'assets/scene_penthouse_piano.jpg',
                mapPos: { x: 50, y: 14 },
                areas: ['penthouse_suite'],
                dialogue: '2. Kat Penthouse: Sıra 11 Kuyruklu Konser Piyanosu & Şömine Salonu final adımıdır.'
            }
        };
    }

    // ----------------------------------------------------
    // 11 SEQUENTIAL SINGLE-PLACEMENT FURNITURE DEFINITIONS
    // ----------------------------------------------------
    setupRenovationDefinitions() {
        this.renovationDefs = {
            reception_desk: {
                id: 'reception_desk',
                seqOrder: 1,
                room: 'lobby',
                name: 'Mermer Resepsiyon Bankosu',
                area: 'Sıra 1/11 · Büyük Lobi',
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
                        style: 'Beyaz Mermer & Altın',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🏛️',
                        desc: 'Parlak beyaz İtalyan Carrara mermeri, 24 ayar altın sütun şeritleri ve sıcak karşılama ışığı.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kraliyet Kadifesi & Siyah Mermer Banko',
                        style: 'Bordo Kadife & Siyah',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '🌹',
                        desc: 'Kapitone bordo kraliyet kadifesi, siyah Nero mermer gövde ve pembe-altın LED aydınlatma.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz-Zümrüt Damarlı Mermer & Maun Banko',
                        style: 'Turkuaz & Zümrüt Riviera',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '💎',
                        desc: 'Akdeniz turkuazı ve zümrüt damarlı nadir mermer gövde, fırçalanmış pirinç detaylar.'
                    }
                ]
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                seqOrder: 2,
                room: 'lobby',
                name: 'Büyük Lobi Kristal Avizesi',
                area: 'Sıra 2/11 · Büyük Lobi',
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
                        style: 'Elmas Beyaz & Altın',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '✨',
                        desc: '3 katlı elmas kesim beyaz Bohemya kristalleri ve 24 ayar altın mum kolları.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Yakut Kırmızısı & Pembe Altın İmparatorluk Avizesi',
                        style: 'Yakut Kırmızısı & Altın',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌺',
                        desc: 'Kızıl yakut kristal damlalar ve sıcak romantik gala aydınlatması.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Venedik Murano Turkuaz & Zümrüt Kristal Avize',
                        style: 'Turkuaz Murano Cam',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: '💎',
                        desc: 'El üflemesi turkuaz ve zümrüt Venedik Murano kristalleriyle deniz ışıltısı.'
                    }
                ]
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                seqOrder: 3,
                room: 'lobby',
                name: 'Lobi Kraliyet Halısı & Dinlenme Koltukları',
                area: 'Sıra 3/11 · Büyük Lobi',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                stageBox: [0.66, 0.46, 0.32, 0.34],
                pinX: 80,
                pinY: 58,
                defaultDesc: 'Soluk halı ve yıpranmış eski koltuklar (Yenilenmedi)',
                baseCost: 950,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem İpek Halı & İnci Beyazı Berjer Koltuklar',
                        style: 'Krem İpek & Altın',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 22,
                        repBoost: 35,
                        icon: '🛋️',
                        desc: 'Fildişi-altın dokuma saray halısı ve inci beyazı lüks dinlenme berjerleri.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Bordo Kadife Koltuklar & Kraliyet Halısı',
                        style: 'Bordo Kraliyet Kadifesi',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 26,
                        repBoost: 40,
                        icon: '🌹',
                        desc: 'Derin bordo kadife berjer koltuklar, altın sehpa ve kızıl ipek halı.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & Zümrüt İpek Riviera Lounge Takımı',
                        style: 'Turkuaz & Zümrüt',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🦚',
                        desc: 'Zümrüt ve turkuaz kadife koltuklar ile Akdeniz motifli ipek halı.'
                    }
                ]
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                seqOrder: 4,
                room: 'restaurant',
                name: 'Riviera Restoran Yemek Masaları',
                area: 'Sıra 4/11 · Restoran',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.28, 0.62, 0.70, 0.38],
                pinX: 58,
                pinY: 74,
                defaultDesc: 'Örtüsüz eski masalar ve sade sandalyeler (Yenilenmedi)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Yuvarlak Beyaz İpek & Altın Fenerli Gala Masası',
                        style: 'Beyaz İpek & Altın',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🥂',
                        desc: 'Beyaz ipek örtülü yuvarlak masa, altın fener ve kraliyet mavisi-altın koltuklar.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo-Kızıl Mum Işıklı Romantik Oval Masa',
                        style: 'Bordo Romantik Gala',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 52,
                        icon: '🕯️',
                        desc: 'Kızıl-bordo mum ışığı ambiyanslı oval VIP masa ve kadife sandalyeler.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz Lagün Işıklı Kare Akdeniz Masası',
                        style: 'Turkuaz Akdeniz',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 38,
                        repBoost: 58,
                        icon: '🌊',
                        desc: 'Havuz kenarı turkuaz aydınlatmalı kare gurme masa ve tik ağacı sandalyeler.'
                    }
                ]
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                seqOrder: 5,
                room: 'restaurant',
                name: 'Şampanya & Kokteyl Barı',
                area: 'Sıra 5/11 · Restoran & Bar',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                stageBox: [0.00, 0.44, 0.36, 0.52],
                pinX: 20,
                pinY: 64,
                defaultDesc: 'Işıksız eski teras bar köşesi (Yenilenmedi)',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Fildişi Mermer Kemerli & Altın Şampanya Barı',
                        style: 'Beyaz Mermer & Altın',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🍾',
                        desc: 'Aydınlık fildişi taş kemerler altında altın fenerli VIP şampanya locası.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Yakut Işıklı Gece Kokteyl Barı',
                        style: 'Bordo & Yakut Lounge',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 68,
                        icon: '🍸',
                        desc: 'Bordo-kızıl ambiyans aydınlatmalı romantik teras kokteyl barı.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & Zümrüt Esintili Riviera Barı',
                        style: 'Turkuaz Riviera Bar',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🥃',
                        desc: 'Turkuaz ve zümrüt aydınlatmalı Akdeniz sahil kulübü barı.'
                    }
                ]
            },
            room101_bed: {
                id: 'room101_bed',
                seqOrder: 6,
                room: 'room101',
                name: 'Deluxe Suit Kraliyet Yatağı & Lounge (Oda 101)',
                area: 'Sıra 6/11 · Suit 101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.01, 0.48, 0.46, 0.46],
                pinX: 26,
                pinY: 66,
                defaultDesc: 'Soluk ve yıpranmış eski suit mobilyası (Yenilenmedi)',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'İnci Beyazı Kaşmir & 24K Altın Suit Takımı',
                        style: 'Beyaz Kaşmir & Altın',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 36,
                        repBoost: 52,
                        icon: '🛏️',
                        desc: 'İnci beyazı kaşmir döşeme, ipek yastıklar ve 24 ayar altın mermer orta sehpa.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Bordo Kadife & Pembe Altın Balayı Takımı',
                        style: 'Bordo Kadife Suit',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 58,
                        icon: '🌹',
                        desc: 'Derin bordo kraliyet kadifesi, kırmızı ipek yastıklar ve pembe-altın sehpa.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & Zümrüt İpek Körfez Suit Takımı',
                        style: 'Turkuaz & Zümrüt',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 44,
                        repBoost: 64,
                        icon: '💎',
                        desc: 'Zümrüt-turkuaz kadife döşeme, turkuaz ipek yastıklar ve gümüş-mermer sehpa.'
                    }
                ]
            },
            room101_decor: {
                id: 'room101_decor',
                seqOrder: 7,
                room: 'room101',
                name: 'Suit 101 Şömine & Panoramik Deniz Köşesi',
                area: 'Sıra 7/11 · Suit 101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                stageBox: [0.48, 0.34, 0.50, 0.54],
                pinX: 72,
                pinY: 56,
                defaultDesc: 'Bakımsız şömine ve sönük pencere köşesi (Yenilenmedi)',
                baseCost: 1400,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermer Şömine & Altın Köşe',
                        style: 'Beyaz Mermer & Altın',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🔥',
                        desc: 'Parlak beyaz İtalyan mermeri şömine ve altın kristal aplikler.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo & Kırmızı Kehribar Romantik Şömine Köşesi',
                        style: 'Bordo & Kızıl Kehribar',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 34,
                        repBoost: 50,
                        icon: '🕯️',
                        desc: 'Kızıl mermer şömine ve sıcak romantik akşam aydınlatması.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz & Zümrüt Mermer Deniz Köşesi',
                        style: 'Turkuaz & Zümrüt',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 38,
                        repBoost: 56,
                        icon: '🌊',
                        desc: 'Turkuaz damarlı mermer şömine ve Akdeniz esintili dekorasyon.'
                    }
                ]
            },
            swimming_pool: {
                id: 'swimming_pool',
                seqOrder: 8,
                room: 'pool',
                name: 'Sonsuzluk Havuzu & Güneşlenme Locaları',
                area: 'Sıra 8/11 · Havuz & Teras',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                stageBox: [0.02, 0.36, 0.90, 0.62],
                pinX: 48,
                pinY: 62,
                defaultDesc: 'Soluk, bakımsız şezlonglar ve havuz kenarı (Yenilenmedi)',
                baseCost: 3500,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz İpek Kabanalar & 24K Altın Mozaik Havuz',
                        style: 'Beyaz İpek & Altın',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 100,
                        icon: '🏊',
                        desc: 'Fildişi-beyaz ipek kabanalar, altın mozaik havuz kenarı ve tik şezlonglar.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Kırmızısı & Bordo VIP Günbatımı Locaları',
                        style: 'Kızıl Kraliyet Locaları',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 115,
                        icon: '☀️',
                        desc: 'Bordo-kızıl minderli VIP şezlonglar ve sıcak yakut havuz aydınlatması.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt-Turkuaz Lagün Havuzu & Sahil Locaları',
                        style: 'Turkuaz Lagün VIP',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 130,
                        icon: '🌴',
                        desc: 'Parlak turkuaz-zümrüt lagün havuzu ve Akdeniz mavisi güneşlenme yatakları.'
                    }
                ]
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                seqOrder: 9,
                room: 'spa',
                name: 'Aurelia Zen Spa & Termal Jakuzi',
                area: 'Sıra 9/11 · Zen Spa',
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
                        style: 'Beyaz Mermer & Altın',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '♨️',
                        desc: 'Bembeyaz İtalyan mermeri jakuzi, 24K altın mozaik iç havuz ve sıcak mumlar.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Gül Suyu & Yakut Mumlu Romantik Termal Spa',
                        style: 'Kızıl Gül & Yakut',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 62,
                        repBoost: 95,
                        icon: '🌺',
                        desc: 'Pembe-kızıl gül terapili termal su ve yakut ışıltılı mermer jakuzi.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt-Turkuaz Mineral Havuz & Zen Terapisi',
                        style: 'Turkuaz & Zümrüt Zen',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 68,
                        repBoost: 105,
                        icon: '🎋',
                        desc: 'Derin turkuaz ve zümrüt mineralli sıcak kaynak suyu jakuzisi.'
                    }
                ]
            },
            garden_courtyard: {
                id: 'garden_courtyard',
                seqOrder: 10,
                room: 'garden',
                name: 'Akdeniz Botanik Bahçesi & Mermer Çeşme',
                area: 'Sıra 10/11 · Botanik Bahçe',
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
                        style: 'Beyaz Mermer & Altın',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '⛲',
                        desc: 'Parlak fildişi-beyaz mermerden 3 katlı saray çeşmesi ve altın su aydınlatması.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Gül Yapraklı & Yakut Işıklı Romantik Çeşme',
                        style: 'Kızıl Gül & Yakut',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 78,
                        icon: '🌹',
                        desc: 'Kırmızı gül yapraklarıyla dolu yakut ve pembe mermer kraliyet çeşmesi.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Turkuaz Mozaik & Zümrüt Su Havuzlu Riviera Çeşmesi',
                        style: 'Turkuaz & Zümrüt',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 56,
                        repBoost: 86,
                        icon: '🌴',
                        desc: 'Parlayan turkuaz-zümrüt mozaik havuzlu Akdeniz avlu çeşmesi.'
                    }
                ]
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                seqOrder: 11,
                room: 'penthouse',
                name: 'Başkanlık Penthouse Kuyruklu Piyanosu',
                area: 'Sıra 11/11 · 2. Kat Penthouse',
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
                        style: 'Fildişi Beyaz & Altın',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 120,
                        repBoost: 180,
                        icon: '🎹',
                        desc: 'Sedefli fildişi-beyaz gövdeli, 24 ayar altın telli kraliyet konser piyanosu.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kızıl Lake & Altın Filigranlı Gala Piyanosu',
                        style: 'Bordo Kızıl & Altın',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 135,
                        repBoost: 200,
                        icon: '👑',
                        desc: 'Parlak bordo-kızıl lake kaplama, kadife tabure ve altın işlemeli konser piyanosu.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt-Turkuaz Kristal & Maun Özel Koleksiyon Piyano',
                        style: 'Turkuaz & Zümrüt',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 150,
                        repBoost: 220,
                        icon: '💎',
                        desc: 'Zümrüt ve turkuaz sedef kakmalı, Monako yat limanı manzaralı özel piyano.'
                    }
                ]
            }
        };
    }

    // ----------------------------------------------------
    // STATE PERSISTENCE & SEQUENTIAL SINGLE-PLACEMENT HELPERS
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
            const raw = localStorage.getItem('velvetSecrets3DHotelV3');
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
            localStorage.setItem('velvetSecrets3DHotelV3', JSON.stringify(this.state));
            if (window.GameEconomy && window.GameEconomy.data) {
                window.GameEconomy.data.renovations = { ...this.state.renovations };
                window.GameEconomy.save();
            }
        } catch (e) {}
    }

    getInstalledOption(id) {
        const entry = this.state.renovations[id];
        if (!entry) return null;
        if (typeof entry === 'string') {
            return { optionId: entry, completed: true };
        }
        if (entry && entry.optionId) {
            return { optionId: entry.optionId, completed: true };
        }
        return null;
    }

    isAreaCompleted(id) {
        return Boolean(this.getInstalledOption(id));
    }

    getCurrentSequentialAreaId() {
        return this.sequentialOrder.find(id => !this.isAreaCompleted(id)) || null;
    }

    getAreaLevel(id) {
        return this.isAreaCompleted(id) ? 2 : 1;
    }

    getNextUpgradeCost(id) {
        if (this.isAreaCompleted(id)) return 0;
        const def = this.renovationDefs[id];
        return def ? def.baseCost : 1500;
    }

    getNextUpgradeStars(id) {
        if (this.isAreaCompleted(id)) return 0;
        const def = this.renovationDefs[id];
        return def ? (def.starsNeeded || 1) : 1;
    }

    recalcHotelStats() {
        let baseIncome = 45;
        let baseRep = 120;
        let completedCount = 0;

        this.sequentialOrder.forEach(key => {
            const def = this.renovationDefs[key];
            const installed = this.getInstalledOption(key);
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
        this.state.hotelStars = Math.min(5, 3 + Math.floor(completedCount / 4));
        this.updateHUD();
    }

    // ----------------------------------------------------
    // AUTOMATIC AFFORDABILITY NOTIFICATIONS (ACTIVE SEQUENTIAL ITEM ONLY)
    // ----------------------------------------------------
    checkAffordableNotifications(silentFirstLoad = false) {
        const activeId = this.getCurrentSequentialAreaId();
        if (!activeId) return;
        const def = this.renovationDefs[activeId];
        if (!def || this.isAreaCompleted(activeId)) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const cost = this.getNextUpgradeCost(activeId);
        const starsReq = this.getNextUpgradeStars(activeId);
        const notifyKey = `${activeId}_seq`;

        if (balance >= cost && stars >= starsReq) {
            if (!this.notifiedAffordable.has(notifyKey)) {
                this.notifiedAffordable.add(notifyKey);
                if (!silentFirstLoad) {
                    this.showAffordabilityToast(def, cost);
                }
            }
        } else {
            this.notifiedAffordable.delete(notifyKey);
        }
    }

    showAffordabilityToast(def, cost = 1500) {
        this.playSound('chime');
        let toast = document.getElementById('budgetAlertToast');
        if (!toast) return;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        toast.innerHTML = `
            <div class="budget-toast-inner">
                <div class="bt-icon">🔔</div>
                <div class="bt-content">
                    <strong>SIRA #${def.seqOrder} İÇİN BÜTÇENİZ HAZIR! ($${balance})</strong>
                    <p>Birikiminiz <b>${def.name}</b> ($${cost}) için yeterli! Şimdi 3 farklı tasarımdan birini seçip kalıcı olarak kurun.</p>
                </div>
                <div class="bt-actions">
                    <button class="bt-go-btn" onclick="hotel3D.goToAndOpenRenovation('${def.id}')">🛠️ 3 Tasarımdan Seç</button>
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

    goToAndOpenRenovation(id) {
        const toast = document.getElementById('budgetAlertToast');
        if (toast) toast.style.display = 'none';

        if (window.switchMainPage) {
            window.switchMainPage('pageHotel');
        }

        const def = this.renovationDefs[id];
        if (!def) return;

        this.isMapMode = false;
        this.currentRoom = def.room || 'lobby';
        this.selectedAreaId = id;

        // If this furniture item is already placed once, selection right has ended!
        if (this.isAreaCompleted(id)) {
            this.closeBottomDesignDock();
            this.renderStage();
            this.updateProximityPanel();
            this.showBanner(`✅ "${def.name}" kalıcı olarak kuruldu ve seçim tamamlandı!`);
            return;
        }

        // Strict sequential check: only the current active sequential item can open the 3-design selector!
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (activeSeqId && id !== activeSeqId) {
            const activeDef = this.renovationDefs[activeSeqId];
            this.closeBottomDesignDock();
            this.renderStage();
            this.updateProximityPanel();
            this.showBanner(`🔒 Sıralı Görev: Önce Sıra #${activeDef.seqOrder} (${activeDef.name}) tamamlanmalı!`);
            return;
        }

        this.focusCameraOnPin(def.pinX, def.pinY);
        this.openBottomDesignDock(id, true);
        this.updateProximityPanel();
        this.renderStage();
    }

    // ----------------------------------------------------
    // AUDIO SYNTHESIZER
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
    // PAN & ZOOM INTERACTION FOR CRYSTAL-CLEAR ROOM STAGE
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
    // RENDER CRYSTAL-CLEAR ROOM STAGE OR ISOMETRIC RESORT MAP
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
        const activeSeqId = this.getCurrentSequentialAreaId();

        let nodesHtml = '';
        Object.keys(this.rooms).forEach((roomKey) => {
            const rm = this.rooms[roomKey];
            let completedInRoom = 0;
            let hasActiveSeq = false;

            rm.areas.forEach((aId) => {
                if (this.isAreaCompleted(aId)) completedInRoom++;
                if (aId === activeSeqId) hasActiveSeq = true;
            });

            const allDone = (completedInRoom >= rm.areas.length);
            const isActiveRoom = (this.currentRoom === roomKey);

            nodesHtml += `
                <div class="gh-map-room-node ${isActiveRoom ? 'current-room' : ''} ${hasActiveSeq ? 'has-ready' : ''}"
                     style="left: ${rm.mapPos.x}%; top: ${rm.mapPos.y}%;"
                     onclick="hotel3D.jumpTo('${roomKey}')">
                    <div class="gh-map-thumb" style="background-image: url('${rm.bgImg}');">
                        <span class="gh-map-lv-pill">${completedInRoom}/${rm.areas.length} Mobilya</span>
                        ${hasActiveSeq ? `<span class="gh-map-ready-hammer">🔨 Sıradaki Görev!</span>` : ''}
                    </div>
                    <div class="gh-map-node-body">
                        <strong>${rm.shortName}</strong>
                        <small>${allDone ? '✅ Tamamlandı' : (hasActiveSeq ? '🎯 Aktif Sıra Burada' : '🔒 Sıra Bekliyor')}</small>
                    </div>
                </div>
            `;
        });

        stage.innerHTML = `
            <div class="gh-room-canvas gh-isometric-map-canvas" style="background-image: linear-gradient(180deg, rgba(10,14,24,0.35), rgba(10,14,24,0.68)), url('assets/scene_hotel_exterior.jpg');">
                <div class="gh-map-header-banner">
                    <span>✦ AURELIA PALACE OTEL HARİTASI — Gitmek istediğiniz odaya dokunun!</span>
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
        const rm = this.rooms[this.currentRoom] || this.rooms.lobby;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const activeSeqId = this.getCurrentSequentialAreaId();

        // Update character dialogue banner below the stage
        const dlgEl = document.getElementById('hotelDialogueText');
        if (dlgEl) {
            if (activeSeqId && this.renovationDefs[activeSeqId]) {
                const aDef = this.renovationDefs[activeSeqId];
                dlgEl.textContent = `Sıradaki Aktif Görev (Sıra #${aDef.seqOrder}/11): ${aDef.name} — Her mobilya 1 kez seçilir ve kalıcı olarak mekana yerleşir!`;
            } else {
                dlgEl.textContent = rm.dialogue || 'Tüm otel mobilyaları kalıcı olarak kuruldu!';
            }
        }

        // 1. Render Seamless Alpha-Feathered Furniture Layers + Clean Action Pin ONLY for unrenovated items
        let furnitureLayersHtml = '';
        let pinsHtml = '';

        rm.areas.forEach((areaId) => {
            const def = this.renovationDefs[areaId];
            if (!def) return;

            const installed = this.getInstalledOption(areaId);
            const isCompleted = Boolean(installed);
            const isCurrentSeq = (areaId === activeSeqId);
            const isPreviewingThis = (this.previewingRenovation && this.previewingRenovation.id === areaId);

            // Determine exact visual state for this furniture piece in the room scene:
            // - If previewing an option in the bottom bar: show that option ('opt_a', 'opt_b', or 'opt_c')
            // - If already completed & confirmed: permanently show the installed option ('opt_a', 'opt_b', or 'opt_c')
            // - Otherwise: show the worn unrenovated state ('old')
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
                     src="assets/designs/stage_${areaId}_${stateKey}.png"
                     alt="${def.name}"
                     style="left:${leftPct}%; top:${topPct}%; width:${widthPct}%; height:${heightPct}%;" />
            `;

            // Pin logic:
            // - Once a furniture item is completed (isCompleted === true), NO pin or box covers the scene!
            //   Its chosen visual stays permanently fixed and crystal clear in the room.
            // - For the current active sequential item: show a clean Gossip Harbor hammer button (hidden while previewing so the furniture is 100% unobstructed!).
            // - For future sequential items in the same room: show a subtle small lock badge.
            if (!isCompleted) {
                const cost = this.getNextUpgradeCost(areaId);
                const starsReq = this.getNextUpgradeStars(areaId);
                const canAfford = (balance >= cost && stars >= starsReq);

                if (isCurrentSeq) {
                    if (isPreviewingThis) {
                        const optObj = def.options[this.selectedOptionIndex] || def.options[0];
                        pinsHtml += `
                            <button class="gh-stage-pin-btn pin-previewing"
                                    style="left: ${def.pinX}%; top: ${Math.max(10, def.pinY - 16)}%;"
                                    onclick="hotel3D.selectFurnitureOnStage('${areaId}', event)">
                                👁️ ${optObj.style}
                            </button>
                        `;
                    } else {
                        pinsHtml += `
                            <button class="gh-stage-pin-btn ${canAfford ? 'pin-active-ready' : 'pin-active-saving'}"
                                    style="left: ${def.pinX}%; top: ${def.pinY}%;"
                                    onclick="hotel3D.selectFurnitureOnStage('${areaId}', event)">
                                🔨 Sıra #${def.seqOrder}: ${def.name} ($${cost})
                            </button>
                        `;
                    }
                } else {
                    pinsHtml += `
                        <button class="gh-stage-pin-btn pin-seq-locked"
                                style="left: ${def.pinX}%; top: ${def.pinY}%;"
                                onclick="hotel3D.selectFurnitureOnStage('${areaId}', event)">
                            🔒 Sıra #${def.seqOrder}
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

    selectFurnitureOnStage(areaId, e) {
        if (e) e.stopPropagation();
        const def = this.renovationDefs[areaId];
        if (!def) return;

        this.playSound('step');

        // 1. If already renovated once, selection right has ended!
        if (this.isAreaCompleted(areaId)) {
            this.selectedAreaId = areaId;
            this.closeBottomDesignDock();
            this.updateProximityPanel();
            this.renderStage();
            this.showBanner(`✅ "${def.name}" kalıcı olarak kuruldu. Seçim hakkı tamamlandı!`);
            return;
        }

        // 2. Strict sequential order check:
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (activeSeqId && areaId !== activeSeqId) {
            const activeDef = this.renovationDefs[activeSeqId];
            this.selectedAreaId = areaId;
            this.closeBottomDesignDock();
            this.updateProximityPanel();
            this.renderStage();
            this.showBanner(`🔒 Sıralı Görev: Önce Sıra #${activeDef.seqOrder} ("${activeDef.name}") kurulmalıdır!`);
            return;
        }

        // 3. Current active sequential furniture item -> open the 3-design bottom dock!
        this.selectedAreaId = areaId;
        this.focusCameraOnPin(def.pinX, def.pinY);
        this.openBottomDesignDock(areaId, true);
        this.updateProximityPanel();
        this.renderStage();
    }

    // ----------------------------------------------------
    // GOSSIP HARBOR SIGNATURE BOTTOM 3-OPTION DESIGN DOCK
    // ----------------------------------------------------
    openBottomDesignDock(areaId, scrollAndPulse = false) {
        const dock = document.getElementById('ghBottomDesignDock');
        if (!dock) return;
        const targetId = areaId || this.selectedAreaId || this.getCurrentSequentialAreaId();
        const def = this.renovationDefs[targetId];
        if (!def) return;

        // Never open design selector for an already-placed furniture item or out-of-sequence item!
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (this.isAreaCompleted(targetId) || (activeSeqId && targetId !== activeSeqId)) {
            this.closeBottomDesignDock();
            return;
        }

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

    selectBottomDockOption(areaId, idx) {
        if (this.isAreaCompleted(areaId)) return;
        const def = this.renovationDefs[areaId];
        if (!def || !def.options[idx]) return;
        this.selectedAreaId = areaId;
        this.selectedOptionIndex = idx;
        this.isRenovationDockOpen = true;
        const opt = def.options[idx];
        this.previewingRenovation = { id: areaId, optionId: opt.id };
        this.playSound('chime');
        this.renderBottomDesignDock();
        this.updateProximityPanel();
        this.renderStage();
        this.showBanner(`👁️ Seçenek ${idx + 1} (${opt.style}) sahnede önizleniyor!`);
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
        if (!def || this.isAreaCompleted(activeId)) {
            this.closeBottomDesignDock();
            return;
        }

        dock.style.display = 'block';
        const id = def.id;
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = (balance >= cost && stars >= starsNeeded);
        const stillNeeded = Math.max(0, cost - balance);

        let cardsHtml = '';
        def.options.forEach((opt, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            const thumbSrc = `assets/designs/${id}_${opt.id}.jpg`;

            cardsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}');">
                        <span class="gh-dock-opt-num">${idx + 1}. ${opt.style}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ SEÇİLİ</span>' : '<span class="gh-dock-lock-tag">👁️ Dene</span>'}
                    </div>
                    <div class="gh-dock-opt-meta">
                        <strong>${opt.icon} ${opt.name}</strong>
                        <small>+$${opt.incomeBoost}/dk · +${opt.repBoost} Prestij</small>
                    </div>
                </div>
            `;
        });

        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];

        dock.innerHTML = `
            <div class="gh-dock-header">
                <div class="gh-dock-title-wrap">
                    <span class="gh-dock-lvl-badge">🔨 SIRA #${def.seqOrder}/11 · TEK SEFERLİK KALICI KURULUM</span>
                    <h4>${def.name} — 3 Farklı Tasarım ve Renkten Birini Seçin:</h4>
                </div>
                <div class="gh-dock-header-right" style="display:flex; gap:6px; align-items:center;">
                    <button class="gh-dock-detail-btn" onclick="hotel3D.closeBottomDesignDock()" style="background: rgba(239,68,68,0.22); border-color: rgba(239,68,68,0.65); color: #fecaca;">✕ Kapat</button>
                </div>
            </div>

            <div class="gh-dock-options-grid">
                ${cardsHtml}
            </div>

            <div class="gh-dock-footer">
                <div class="gh-dock-budget-info">
                    <span>Maliyet: <b class="text-gold">$${cost} & ⭐${starsNeeded}</b></span>
                    <span>Kasanız: <b>$${balance} & ⭐${stars}</b></span>
                    <span class="${canAfford ? 'text-green' : 'text-warn'}">
                        ${canAfford ? `🟢 Bütçe Hazır! (Kalan: +$${balance - cost})` : `⏳ $${stillNeeded} Daha Gerekli`}
                    </span>
                </div>
                <div class="gh-dock-action-btns">
                    ${canAfford ? `
                        <button class="gh-dock-confirm-btn ready" onclick="hotel3D.executePurchase('${id}', '${chosenOpt.id}')">
                            ✓ Seçimi Onayla & Kalıcı Kur ($${cost})
                        </button>
                    ` : `
                        <button class="gh-dock-confirm-btn locked" onclick="hotel3D.closeBottomDesignDock(); window.switchMainPage && window.switchMainPage('pageBoard')">
                            🧩 Masada Sipariş Tamamla ($${stillNeeded} Eksik)
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------
    // FULL RENOVATION MODAL & ONE-TIME PURCHASE EXECUTION
    // ----------------------------------------------------
    openRenovationModal(id) {
        if (this.isAreaCompleted(id)) {
            this.showBanner('✅ Bu mobilya kalıcı olarak kuruldu ve seçim tamamlandı.');
            return;
        }
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (activeSeqId && id !== activeSeqId) {
            const activeDef = this.renovationDefs[activeSeqId];
            this.showBanner(`🔒 Sıralı Görev: Önce Sıra #${activeDef.seqOrder} (${activeDef.name}) tamamlanmalı!`);
            return;
        }
        this.goToAndOpenRenovation(id);
    }

    cancelPreviewAndClose() {
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
        this.activeModalPoint = null;
    }

    renderModalContent() {}

    executePurchase(id, optionId) {
        const def = this.renovationDefs[id];
        if (!def) return;

        // Prevent duplicate placement: each furniture item can only be placed ONCE!
        if (this.isAreaCompleted(id)) {
            this.closeBottomDesignDock();
            this.showBanner('✅ Bu mobilya zaten kalıcı olarak kuruldu!');
            return;
        }

        // Enforce strict sequential order
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (activeSeqId && id !== activeSeqId) {
            const activeDef = this.renovationDefs[activeSeqId];
            this.showBanner(`🔒 Önce Sıra #${activeDef.seqOrder} (${activeDef.name}) kurulmalıdır!`);
            return;
        }

        const opt = def.options.find(o => o.id === optionId) || def.options[0];
        if (!opt) return;

        const costCoins = this.getNextUpgradeCost(id);
        const costStars = this.getNextUpgradeStars(id);

        if (window.GameEconomy) {
            const res = window.GameEconomy.purchaseRenovation(
                id,
                optionId,
                costCoins,
                costStars,
                `Sıra #${def.seqOrder}: ${def.name} (${opt.name})`
            );
            if (!res.success) {
                this.showBanner('Yetersiz bakiye! Masadan sipariş tamamlayın veya otel gelirini toplayın.');
                return;
            }
            this.state.coins = res.remainingBalance;
        } else {
            if (this.state.coins < costCoins || this.state.stars < costStars) {
                this.showBanner('Yetersiz bakiye! Masadan sipariş tamamlayın.');
                return;
            }
            this.state.coins -= costCoins;
            this.state.stars -= costStars;
        }

        // Permanently lock the chosen furniture visual & end selection right for this item!
        this.state.renovations[id] = { optionId: optionId, completed: true, level: 2 };
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.cancelPreviewAndClose();
        this.closeBottomDesignDock();

        // Advance selectedAreaId to the next sequential furniture item
        const nextSeqId = this.getCurrentSequentialAreaId();
        if (nextSeqId) {
            this.selectedAreaId = nextSeqId;
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

        const nextDef = nextSeqId ? this.renovationDefs[nextSeqId] : null;
        if (nextDef) {
            this.showBanner(`✅ "${opt.name}" kalıcı olarak kuruldu! Sıradaki görev açıldı: Sıra #${nextDef.seqOrder} ${nextDef.name}`);
        } else {
            this.showBanner(`👑 Tebrikler! "${opt.name}" kuruldu ve oteldeki tüm 11 mobilya tamamlandı!`);
        }
    }

    goToNextUnrenovatedArea() {
        const nextSeqId = this.getCurrentSequentialAreaId();
        if (nextSeqId) {
            this.goToAndOpenRenovation(nextSeqId);
        } else {
            this.showBanner('👑 Oteldeki tüm 11 mobilya kalıcı olarak kuruldu!');
        }
    }

    // ----------------------------------------------------
    // VISUAL HOTEL AREA SHOWCASE CARDS (#hotelAreasVisualGrid)
    // ----------------------------------------------------
    renderHotelAreaCards() {
        const grid = document.getElementById('hotelAreasVisualGrid');
        if (!grid || !this.renovationDefs) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const activeSeqId = this.getCurrentSequentialAreaId();

        let cardsHtml = '';
        this.sequentialOrder.forEach((id) => {
            const def = this.renovationDefs[id];
            if (!def) return;

            const installed = this.getInstalledOption(id);
            const isCompleted = Boolean(installed);
            const isCurrentSeq = (id === activeSeqId);
            const isLockedFuture = (!isCompleted && !isCurrentSeq);

            const cost = this.getNextUpgradeCost(id);
            const starsNeeded = this.getNextUpgradeStars(id);
            const stillNeeded = Math.max(0, cost - balance);
            const canAfford = (balance >= cost && stars >= starsNeeded);

            const installedOpt = installed ? (def.options.find(o => o.id === installed.optionId) || def.options[0]) : null;
            const conditionText = installedOpt
                ? `✅ Kalıcı Kuruldu: ${installedOpt.name} (${installedOpt.style})`
                : (isCurrentSeq ? `🎯 Aktif Sıra #${def.seqOrder}: ${def.defaultDesc}` : `🔒 Sıra #${def.seqOrder} Kilitli (Önce Sıra #${this.renovationDefs[activeSeqId]?.seqOrder || 1} tamamlanmalı)`);

            const cardImgUrl = installedOpt
                ? `assets/designs/${id}_${installedOpt.id}.jpg`
                : `assets/designs/${id}_old.jpg`;

            const statusClass = isCompleted ? 'badge-max' : (isCurrentSeq ? (canAfford ? 'badge-ready' : 'badge-saving') : 'badge-saving');
            const statusLabel = isCompleted
                ? `✅ KURULDU (SEÇİM BİTTİ)`
                : (isCurrentSeq
                    ? (canAfford ? `🟢 SIRA #${def.seqOrder} HAZIR ($${cost})` : `🎯 SIRA #${def.seqOrder} (-$${stillNeeded})`)
                    : `🔒 SIRA #${def.seqOrder} KİLİTLİ`);

            cardsHtml += `
                <div class="hotel-visual-area-card ${isCompleted ? 'area-upgraded' : ''} ${isCurrentSeq ? 'area-target' : ''}" style="${isLockedFuture ? 'opacity:0.72;' : ''}">
                    <div class="hotel-area-img-box" style="background-image: url('${cardImgUrl}')"
                         onclick="hotel3D.walkToArea('${id}')">
                        <div class="hotel-area-top-badges">
                            <span class="hotel-area-cat">${def.area}</span>
                            <span class="hotel-area-status ${statusClass}">${statusLabel}</span>
                        </div>
                        <div class="hotel-area-bottom-overlay">
                            <h4>${def.seqOrder}. ${def.name}</h4>
                        </div>
                    </div>

                    <div class="hotel-area-body">
                        <div class="area-cond-line">
                            <small>Durum:</small>
                            <b>${conditionText}</b>
                        </div>

                        <div class="area-cost-metrics">
                            <div class="area-metric">
                                <span>${isCompleted ? 'Kurulum' : 'Maliyet'}</span>
                                <b class="text-gold">${isCompleted ? 'TAMAMLANDI' : '$' + cost}</b>
                            </div>
                            <div class="area-metric">
                                <span>Mevcut Kasa</span>
                                <b>$${balance}</b>
                            </div>
                            <div class="area-metric">
                                <span>Seçim Hakkı</span>
                                <b class="${isCompleted ? 'text-green' : (isCurrentSeq && canAfford ? 'text-green' : 'text-warn')}">
                                    ${isCompleted ? '🔒 SABİTLENDİ' : (isCurrentSeq ? '🔓 3 TASARIM' : '🔒 SIRADA')}
                                </b>
                            </div>
                        </div>

                        <div class="area-card-actions">
                            <button class="area-walk-btn" onclick="hotel3D.walkToArea('${id}')">
                                📍 Sahnede Gör
                            </button>
                            ${isCompleted ? `
                                <button class="area-reno-btn locked" disabled style="opacity:0.75; cursor:default;">
                                    ✅ Kuruldu (Sabit)
                                </button>
                            ` : (isCurrentSeq ? `
                                <button class="area-reno-btn ${canAfford ? 'unlocked' : 'locked'}" onclick="hotel3D.goToAndOpenRenovation('${id}')">
                                    🔨 3 Tasarımdan Seç ($${cost})
                                </button>
                            ` : `
                                <button class="area-reno-btn locked" disabled style="opacity:0.65; cursor:not-allowed;">
                                    🔒 Sıra #${def.seqOrder} Bekliyor
                                </button>
                            `)}
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = cardsHtml;
    }

    walkToArea(id) {
        const def = this.renovationDefs[id];
        if (!def) return;
        this.isMapMode = false;
        this.currentRoom = def.room || 'lobby';
        this.selectedAreaId = id;
        this.playSound('door');

        const activeSeqId = this.getCurrentSequentialAreaId();
        if (!this.isAreaCompleted(id) && id === activeSeqId) {
            this.focusCameraOnPin(def.pinX, def.pinY);
            this.openBottomDesignDock(id, true);
        } else {
            this.closeBottomDesignDock();
            this.renderStage();
            this.updateProximityPanel();
        }
        const stageEl = document.getElementById('ghSceneStage');
        if (stageEl && stageEl.scrollIntoView) {
            stageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // ----------------------------------------------------
    // PROJECT PLAN & SEQUENTIAL BUDGET OVERVIEW MODAL
    // ----------------------------------------------------
    openProjectPlanModal() {
        let modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        const totalItems = this.sequentialOrder.length;
        let completedCount = 0;
        this.sequentialOrder.forEach(id => {
            if (this.isAreaCompleted(id)) completedCount++;
        });
        const progressPct = Math.round((completedCount / totalItems) * 100);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const activeSeqId = this.getCurrentSequentialAreaId();

        let listHtml = '';
        this.sequentialOrder.forEach((id) => {
            const def = this.renovationDefs[id];
            const installed = this.getInstalledOption(id);
            const isCompleted = Boolean(installed);
            const isCurrentSeq = (id === activeSeqId);

            const cost = this.getNextUpgradeCost(id);
            const starsNeeded = this.getNextUpgradeStars(id);
            const canAfford = (balance >= cost && stars >= starsNeeded);
            const defCoins = Math.max(0, cost - balance);

            let statusClass = 'waiting';
            let statusText = `🔒 SIRA #${def.seqOrder} BEKLİYOR`;
            let currentCondition = def.defaultDesc;

            if (installed) {
                const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
                currentCondition = `✅ Kalıcı Kuruldu: ${opt.name} (${opt.style})`;
                statusClass = 'done';
                statusText = `✅ KURULDU — SEÇİM TAMAMLANDI`;
            } else if (isCurrentSeq) {
                statusClass = canAfford ? 'ready' : 'waiting';
                statusText = canAfford ? `🟢 AKTİF SIRA #${def.seqOrder} — BÜTÇE HAZIR!` : `🎯 AKTİF SIRA #${def.seqOrder} ($${defCoins} Eksik)`;
            }

            listHtml += `
                <div class="proj-area-row ${isCompleted ? 'done-row' : ''} ${isCurrentSeq ? 'target-row' : ''}">
                    <div class="proj-area-info">
                        <div class="proj-row-header">
                            <span class="proj-stage">SIRA ${def.seqOrder}/11 · ${def.area}</span>
                            <span class="proj-badge ${statusClass}">${statusText}</span>
                        </div>
                        <h4>${def.seqOrder}. ${def.name}</h4>
                        <div class="proj-condition-line">
                            <small>Durum: <b>${currentCondition}</b></small>
                        </div>
                        <div class="proj-fin-calc-line">
                            <span>${isCompleted ? 'Maliyet: <b>ÖDENDİ</b>' : `Kurulum Maliyeti: <b>$${cost}</b>`}</span> &nbsp;•&nbsp;
                            <span>Kasa: <b>$${balance}</b></span> &nbsp;•&nbsp;
                            <span class="${isCompleted || canAfford ? 'text-green' : 'text-warn'}">${isCompleted ? '🔒 Sabitlendi' : (isCurrentSeq ? (canAfford ? '🔓 3 Tasarım Açık!' : `Eksik: -$${defCoins}`) : '🔒 Sıra Bekliyor')}</span>
                        </div>
                    </div>
                    <div class="proj-row-actions">
                        ${isCompleted ? `
                            <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.walkToArea('${id}')">
                                📍 Sahnede Gör
                            </button>
                        ` : (isCurrentSeq ? `
                            <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.goToAndOpenRenovation('${id}')">
                                🔨 3 Tasarımdan Seç ➔
                            </button>
                        ` : `
                            <button class="proj-go-btn" disabled style="opacity:0.55; cursor:not-allowed;">
                                🔒 Sıra #${def.seqOrder} Kilitli
                            </button>
                        `)}
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div class="proj-title-box">
                        <span class="proj-crest">✦ AURELIA PALACE SIRALI MOBİLYA &amp; MALİYET DEFTERİ</span>
                        <h3>Sıralı Otel Kurulum Planı (Sıra 1 ➔ Sıra 11)</h3>
                    </div>
                    <button class="reno-close-btn" onclick="document.getElementById('projectPlanModal').style.display='none'">&times;</button>
                </div>

                <div class="proj-summary-strip">
                    <div class="proj-sum-item">
                        <label>Sıralı Kurulum İlerlemesi</label>
                        <b>%${progressPct} (${completedCount}/${totalItems} Mobilya)</b>
                    </div>
                    <div class="proj-sum-item">
                        <label>Mevcut Kasa</label>
                        <b>💰 $${balance} | ⭐ ${stars}</b>
                    </div>
                    <div class="proj-sum-item">
                        <label>Pasif Otel Geliri</label>
                        <b class="positive">+$${this.state.incomePerMin}/dk</b>
                    </div>
                </div>

                <div class="proj-progress-track">
                    <div class="proj-progress-bar" style="width: ${progressPct}%;"></div>
                </div>

                <div class="proj-list-scroll">
                    ${listHtml}
                </div>

                <div class="proj-footer-bar" style="margin-top: 10px; display: flex; justify-content: space-between;">
                    <button class="ledger-btn" style="flex: 1;" onclick="document.getElementById('projectPlanModal').style.display='none'; window.GameEconomy && window.GameEconomy.openLedgerModal();">
                        💼 Finans ve Kasa Defterini Aç
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    // ----------------------------------------------------
    // PASSIVE INCOME & HUD UPDATES
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
        const rm = this.rooms[this.currentRoom] || this.rooms.lobby;
        tag.innerText = `📍 ${rm.name}`;
    }

    updateProximityPanel() {
        const proxPanel = document.getElementById('renovationProximityPanel');
        if (!proxPanel) return;

        const activeSeqId = this.getCurrentSequentialAreaId();
        const id = this.selectedAreaId || activeSeqId || 'reception_desk';
        const def = this.renovationDefs[id];
        if (!def) {
            proxPanel.style.display = 'none';
            return;
        }

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const installed = this.getInstalledOption(id);
        const isCompleted = Boolean(installed);
        const isCurrentSeq = (id === activeSeqId);
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const canAfford = (balance >= cost && stars >= starsNeeded);

        const installedOpt = installed ? (def.options.find(o => o.id === installed.optionId) || def.options[0]) : null;

        // 1. If this item is ALREADY COMPLETED: show permanently locked confirmation card (NO "Tasarımı Değiştir" button!)
        if (isCompleted && installedOpt) {
            const installedThumb = `assets/designs/${id}_${installedOpt.id}.jpg`;
            const nextDef = activeSeqId ? this.renovationDefs[activeSeqId] : null;
            proxPanel.innerHTML = `
                <div class="prox-card-inner" style="border-color: rgba(16, 185, 129, 0.55);">
                    <div class="prox-top-row">
                        <span class="prox-area-badge">${def.area}</span>
                        <span class="prox-status-badge status-completed">✅ KALICI OLARAK KURULDU (SEÇİM BİTTİ)</span>
                    </div>
                    <h3 class="prox-title">${def.seqOrder}. ${def.name.toUpperCase()}</h3>
                    <div style="display:flex; gap:12px; align-items:center; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); border-radius:12px; padding:10px; margin:8px 0;">
                        <div style="width:104px; height:64px; border-radius:8px; background-image:url('${installedThumb}'); background-size:cover; background-position:center; flex-shrink:0; border:1.5px solid #ffd700;"></div>
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:0.74rem; color:#6ee7b7; font-weight:700;">SABİTLENEN MOBİLYA TASARIMI:</div>
                            <div style="font-size:0.9rem; color:#fff; font-weight:800;">${installedOpt.icon} ${installedOpt.name}</div>
                            <div style="font-size:0.74rem; color:#cbd5e1;">Renk &amp; Stil: ${installedOpt.style} · +$${installedOpt.incomeBoost}/dk Gelir</div>
                        </div>
                    </div>
                    ${nextDef ? `
                        <div class="prox-actions-row">
                            <button class="prox-btn-view-designs pulse" onclick="hotel3D.goToAndOpenRenovation('${nextDef.id}')">
                                ➡️ Sıradaki Göreve Geç: Sıra #${nextDef.seqOrder} ${nextDef.name} ($${nextDef.baseCost})
                            </button>
                        </div>
                    ` : `
                        <div style="text-align:center; color:#fde68a; font-weight:700; font-size:0.84rem; padding:4px 0;">
                            👑 Oteldeki tüm 11 mobilya kalıcı olarak kuruldu!
                        </div>
                    `}
                </div>
            `;
            proxPanel.style.display = 'block';
            return;
        }

        // 2. If this item is a FUTURE LOCKED sequential item (not its turn yet):
        if (!isCurrentSeq && activeSeqId) {
            const activeDef = this.renovationDefs[activeSeqId];
            proxPanel.innerHTML = `
                <div class="prox-card-inner" style="border-color: rgba(100, 116, 139, 0.55);">
                    <div class="prox-top-row">
                        <span class="prox-area-badge">${def.area}</span>
                        <span class="prox-status-badge status-saving">🔒 SIRA #${def.seqOrder} KİLİTLİ</span>
                    </div>
                    <h3 class="prox-title">${def.seqOrder}. ${def.name.toUpperCase()} ($${cost})</h3>
                    <p style="font-size:0.82rem; color:#cbd5e1; margin:6px 0 10px;">
                        Oteldeki mobilyalar sırayla kurulur. Bu mobilyayı yenilemek için önce <b>Sıra #${activeDef.seqOrder}: ${activeDef.name}</b> görevini tamamlamalısınız.
                    </p>
                    <div class="prox-actions-row">
                        <button class="prox-btn-view-designs pulse" onclick="hotel3D.goToAndOpenRenovation('${activeDef.id}')">
                            🎯 Aktif Göreve Git: Sıra #${activeDef.seqOrder} ${activeDef.name} ($${activeDef.baseCost})
                        </button>
                    </div>
                </div>
            `;
            proxPanel.style.display = 'block';
            return;
        }

        // 3. Current active sequential item when dock is CLOSED:
        if (!this.isRenovationDockOpen) {
            const stillNeeded = Math.max(0, cost - balance);
            const remainingAfter = Math.max(0, balance - cost);
            proxPanel.innerHTML = `
                <div class="prox-card-inner">
                    <div class="prox-top-row">
                        <span class="prox-area-badge">🎯 AKTİF GÖREV · ${def.area}</span>
                        <span class="prox-status-badge ${canAfford ? 'status-ready' : 'status-saving'}">${canAfford ? '🟢 BÜTÇE HAZIR' : '⏳ BİRİKTİRİLİYOR'}</span>
                    </div>
                    <h3 class="prox-title">SIRA #${def.seqOrder}: ${def.name.toUpperCase()}</h3>
                    <div class="prox-condition-row">
                        <span class="prox-cond-label">Mevcut Durum:</span>
                        <b class="prox-cond-val">${def.defaultDesc}</b>
                    </div>
                    <div class="prox-fin-grid">
                        <div class="prox-fin-box">
                            <label>Kurulum Maliyeti</label>
                            <b class="prox-cost">$${cost}</b>
                        </div>
                        <div class="prox-fin-box">
                            <label>Mevcut Bakiye</label>
                            <b class="prox-bal">$${balance}</b>
                        </div>
                        <div class="prox-fin-box highlight">
                            <label>${canAfford ? 'Kalan Bakiye' : 'Gereken Para'}</label>
                            <b class="${canAfford ? 'text-green' : 'text-warn'}">${canAfford ? '+$' + remainingAfter : '-$' + stillNeeded}</b>
                        </div>
                    </div>
                    <div class="prox-actions-row">
                        <button class="prox-btn-view-designs pulse" onclick="hotel3D.selectFurnitureOnStage('${def.id}')">
                            🔨 3 Farklı Mobilya Tasarımını Gör &amp; Seç
                        </button>
                    </div>
                </div>
            `;
            proxPanel.style.display = 'block';
            return;
        }

        // 4. Current active sequential item when dock IS OPEN:
        const stillNeeded = Math.max(0, cost - balance);
        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];

        let inlineOptionsHtml = '';
        def.options.forEach((opt, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            const thumbSrc = `assets/designs/${id}_${opt.id}.jpg`;

            inlineOptionsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}');">
                        <span class="gh-dock-opt-num">${idx + 1}. ${opt.style}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ SEÇİLİ</span>' : '<span class="gh-dock-lock-tag">👁️ Seç</span>'}
                    </div>
                    <div class="gh-dock-opt-meta">
                        <strong>${opt.icon} ${opt.name}</strong>
                        <small>+$${opt.incomeBoost}/dk · +${opt.repBoost} Prestij</small>
                    </div>
                </div>
            `;
        });

        proxPanel.innerHTML = `
            <div class="prox-card-inner">
                <div class="prox-top-row">
                    <span class="prox-area-badge">🔨 SIRA #${def.seqOrder}/11 · MOBİLYA SEÇİMİ AÇIK</span>
                    <button class="gh-dock-detail-btn" onclick="hotel3D.closeBottomDesignDock()" style="background: rgba(239,68,68,0.22); border-color: rgba(239,68,68,0.65); color: #fecaca; padding: 3px 10px; font-size: 0.75rem;">✕ Kapat</button>
                </div>
                <h3 class="prox-title">${def.name.toUpperCase()} — 3 TASARIMDAN SEÇİP ONAYLAYIN</h3>

                <div class="gh-dock-options-grid" style="margin: 10px 0;">
                    ${inlineOptionsHtml}
                </div>

                <div class="prox-actions-row">
                    ${canAfford ? `
                        <button class="prox-btn-view-designs pulse" onclick="hotel3D.executePurchase('${def.id}', '${chosenOpt.id}')">
                            ✓ Seçimi Onayla &amp; Kalıcı Kur ($${cost})
                        </button>
                    ` : `
                        <button class="prox-btn-locked" onclick="hotel3D.closeBottomDesignDock(); window.switchMainPage && window.switchMainPage('pageBoard');">
                            🧩 Masada Sipariş Tamamla ($${stillNeeded} eksik · Maliyet: $${cost})
                        </button>
                    `}
                    <button class="prox-btn-set-target" onclick="hotel3D.closeBottomDesignDock()">
                        ✕ Vazgeç
                    </button>
                </div>
            </div>
        `;
        proxPanel.style.display = 'block';
    }

    setTargetRenovation(id) {
        const activeSeqId = this.getCurrentSequentialAreaId();
        const target = activeSeqId || id;
        if (window.GameEconomy) {
            window.GameEconomy.setTargetRenovation(target);
        }
        const name = this.renovationDefs[target] ? this.renovationDefs[target].name : target;
        this.showBanner(`🎯 Aktif Sıralı Görev: ${name}`);
        this.updateProximityPanel();
        this.renderHotelAreaCards();
    }

    showBanner(msg) {
        const banner = document.getElementById('hudNotification');
        if (!banner) return;
        banner.innerText = msg;
        banner.style.display = 'block';
        clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
            banner.style.display = 'none';
        }, 3400);
    }

    jumpTo(roomKey, e) {
        if (e) e.stopPropagation();
        if (!this.rooms[roomKey]) return;

        this.isMapMode = false;
        this.currentRoom = roomKey;
        const rm = this.rooms[roomKey];
        const activeSeqId = this.getCurrentSequentialAreaId();
        if (activeSeqId && rm.areas.includes(activeSeqId)) {
            this.selectedAreaId = activeSeqId;
        } else {
            this.selectedAreaId = rm.areas[0] || this.selectedAreaId;
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
