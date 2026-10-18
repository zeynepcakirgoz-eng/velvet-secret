// ========================================================
// VELVET SECRETS — GOSSIP HARBOR STYLE 2.5D PHOTOREALISTIC
// & ISOMETRIC INTERACTIVE HOTEL RENOVATION ENGINE
// ========================================================

class Hotel3DSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.state = {
            coins: 1200,
            stars: 2,
            hotelStars: 3,
            reputation: 120,
            incomePerMin: 45,
            uncollectedIncome: 0,
            lastIncomeTick: Date.now(),
            renovations: {}
        };

        this.currentRoom = 'lobby';
        this.isMapMode = false;
        this.selectedAreaId = 'reception_desk';
        this.selectedOptionIndex = 0;
        this.previewingRenovation = null;
        this.activeModalPoint = null;
        this.notifiedAffordable = new Set();

        // Smooth pan & zoom state for Gossip Harbor room stage
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.isDraggingStage = false;
        this.dragStart = { x: 0, y: 0 };

        // Isabella's walkable position inside the current room (in percentage 0..100)
        this.characterPos = { x: 24, y: 78, walking: false, speech: 'Otelimizin yenilenecek eşyalarına (🔨) dokunarak alt çubuktaki 3 lüks tasarımı canlı dene!' };

        this.setupRenovationDefinitions();
        this.setupRoomDefinitions();
        this.loadState();
        this.initAudio();
        this.initStageInteractions();
        this.renderStage();
        this.openBottomDesignDock(this.selectedAreaId, false);
        this.updateHUD();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        if (window.GameEconomy) {
            window.GameEconomy.subscribe(() => {
                this.state.coins = window.GameEconomy.getBalance();
                this.state.stars = window.GameEconomy.getStars();
                this.updateHUD();
                this.checkAffordableNotifications();
                this.renderBottomDesignDock();
                this.updateProximityPanel();
                this.renderStage();
                this.renderHotelAreaCards();
                if (this.activeModalPoint) {
                    this.renderModalContent(this.activeModalPoint);
                }
            });
            setTimeout(() => this.checkAffordableNotifications(true), 800);
        }

        // Passive income & ambient sparkle loop
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
                floorLabel: 'Zemin Kat · Merkez Kanat',
                bgImg: 'assets/scene_lobby_reception.jpg',
                mapPos: { x: 50, y: 66 },
                areas: ['reception_desk', 'lobby_chandelier', 'lobby_carpet'],
                guest: {
                    name: 'Adrian Vale',
                    role: 'Gizemli Milyarder',
                    avatar: 'assets/avatar_adrian.jpg',
                    x: 78,
                    y: 72,
                    quote: 'Isabella, Büyük Lobi yenilendikçe Aurelia Palace eski kraliyet ihtişamına kavuşuyor!'
                },
                doors: [
                    { target: 'room101', label: '⬅️ Suit 101', x: 11, y: 54 },
                    { target: 'restaurant', label: '➡️ Riviera Restoran', x: 89, y: 54 },
                    { target: 'pool', label: '⬆️ Sonsuzluk Havuzu', x: 30, y: 34 },
                    { target: 'penthouse', label: '🛗 2. Kat Penthouse', x: 72, y: 34 }
                ]
            },
            restaurant: {
                id: 'restaurant',
                name: 'Riviera Gurme Restoran & Şampanya Barı',
                shortName: '🍷 Riviera Restoran',
                floorLabel: 'Zemin Kat · Doğu Terası',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                mapPos: { x: 80, y: 60 },
                areas: ['restaurant_tables', 'restaurant_bar'],
                guest: {
                    name: 'Adrian Vale',
                    role: 'VIP Konuk',
                    avatar: 'assets/avatar_adrian.jpg',
                    x: 64,
                    y: 74,
                    quote: 'Bu akşamki gala yemeği için masaların ve barın yeni tasarımı muhteşem görünüyor.'
                },
                doors: [
                    { target: 'lobby', label: '⬅️ Büyük Lobi', x: 12, y: 56 },
                    { target: 'spa', label: '⬆️ Zen Termal Spa', x: 85, y: 38 }
                ]
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz Manzaralı Suit (Oda 101)',
                shortName: '🛏️ Suit 101',
                floorLabel: 'Zemin Kat · Batı Kanadı',
                bgImg: 'assets/scene_presidential_suite.jpg',
                mapPos: { x: 20, y: 60 },
                areas: ['room101_bed', 'room101_decor'],
                guest: null,
                doors: [
                    { target: 'lobby', label: '➡️ Büyük Lobi', x: 88, y: 58 },
                    { target: 'garden', label: '⬆️ Botanik Bahçe', x: 18, y: 38 }
                ]
            },
            pool: {
                id: 'pool',
                name: 'Aurelia Sonsuzluk Havuzu & Güneş Terası',
                shortName: '🏊 Sonsuzluk Havuzu',
                floorLabel: 'Kuzey Sahil Terası',
                bgImg: 'assets/scene_infinity_pool.jpg',
                mapPos: { x: 50, y: 36 },
                areas: ['swimming_pool'],
                guest: {
                    name: 'Serena Black',
                    role: 'Sosyetenin Gözdesi',
                    avatar: 'assets/avatar_serena.jpg',
                    x: 74,
                    y: 74,
                    quote: 'Tatlım, Monako yat limanına bakan bu sonsuzluk havuzu sosyetenin yeni buluşma noktası!'
                },
                doors: [
                    { target: 'lobby', label: '⬇️ Büyük Lobiye Dön', x: 50, y: 86 },
                    { target: 'garden', label: '⬅️ Botanik Bahçe', x: 14, y: 52 },
                    { target: 'spa', label: '➡️ Zen Termal Spa', x: 86, y: 52 }
                ]
            },
            spa: {
                id: 'spa',
                name: 'Aurelia Zen Termal Spa & Jakuzi Pavyonu',
                shortName: '♨️ Zen Spa',
                floorLabel: 'Kuzeydoğu Mermer Pavyonu',
                bgImg: 'assets/scene_spa_wellness.jpg',
                mapPos: { x: 80, y: 32 },
                areas: ['spa_jacuzzi'],
                guest: {
                    name: 'Serena Black',
                    role: 'VIP Konuk',
                    avatar: 'assets/avatar_serena.jpg',
                    x: 26,
                    y: 74,
                    quote: 'Altın mozaikli termal jakuzi ve mum ışıkları... Tam aradığım kraliyet huzuru!'
                },
                doors: [
                    { target: 'pool', label: '⬅️ Sonsuzluk Havuzu', x: 14, y: 55 },
                    { target: 'restaurant', label: '⬇️ Riviera Restoran', x: 84, y: 78 }
                ]
            },
            garden: {
                id: 'garden',
                name: 'Akdeniz Botanik Gül Bahçesi & Mermer Çeşme',
                shortName: '🌹 Botanik Bahçe',
                floorLabel: 'Kuzeybatı Kraliyet Avlusu',
                bgImg: 'assets/scene_garden_terrace.jpg',
                mapPos: { x: 20, y: 32 },
                areas: ['garden_courtyard'],
                guest: null,
                doors: [
                    { target: 'pool', label: '➡️ Sonsuzluk Havuzu', x: 86, y: 54 },
                    { target: 'lobby', label: '⬇️ Büyük Lobi', x: 50, y: 86 }
                ]
            },
            penthouse: {
                id: 'penthouse',
                name: '2. Kat Kraliyet Penthouse & Piyano Salonu',
                shortName: '👑 2. Kat Penthouse',
                floorLabel: '2. Kat · Çatı Katı Suiti',
                bgImg: 'assets/scene_penthouse_piano.jpg',
                mapPos: { x: 50, y: 14 },
                areas: ['penthouse_suite'],
                guest: {
                    name: 'Leon Marchand',
                    role: 'Yönetim Kurulu Üyesi',
                    avatar: 'assets/avatar_leon.jpg',
                    x: 76,
                    y: 72,
                    quote: 'Penthouse salonundaki kuyruklu piyanonun içinde Aurelia ailesinin en büyük sırrı saklı...'
                },
                doors: [
                    { target: 'lobby', label: '🛗 Asansörle Lobiye İn', x: 16, y: 64 }
                ]
            }
        };
    }

    // ----------------------------------------------------
    // 11 RENOVATION AREAS WITH EXACT ON-SCENE PIN COORDINATES
    // ----------------------------------------------------
    setupRenovationDefinitions() {
        this.renovationDefs = {
            reception_desk: {
                id: 'reception_desk',
                room: 'lobby',
                name: 'Mermer Resepsiyon Bankosu',
                area: 'Lobi & Resepsiyon',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                pinX: 52,
                pinY: 56,
                cardW: 165,
                cardH: 96,
                defaultDesc: 'Eski, çizilmiş ahşap banko ve soluk pirinç tabela (Seviye 1)',
                baseCost: 1500,
                levelCosts: [0, 1500, 2400, 3600],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'İtalyan Carrara Mermeri & Altın Banko',
                        style: 'Klasik Lüks',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 25,
                        repBoost: 35,
                        icon: '🏛️',
                        desc: 'Beyaz İtalyan Carrara mermeri, 24 ayar altın kakma sütunlar ve kristal karşılama lambaları.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Nero Marquina Siyah Mermer & LED Banko',
                        style: 'Modern VIP',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 45,
                        icon: '🖤',
                        desc: 'Siyah damarlı Nero Marquina mermeri, gizli sıcak LED aydınlatma ve fırçalanmış bronz detaylar.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Kraliyet Ceviz & Zümrüt Kadife Banko',
                        style: 'Saray Stili',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '👑',
                        desc: 'El oyması Fransız cevizi, zümrüt yeşili kapitone kadife panel ve altın kraliyet arması.'
                    }
                ]
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                room: 'lobby',
                name: 'Büyük Lobi Kristal Avizesi',
                area: 'Lobi Tavanı',
                sceneImg: 'assets/scene_lobby_chandelier.jpg',
                pinX: 50,
                pinY: 22,
                cardW: 150,
                cardH: 88,
                defaultDesc: 'Tozlu, sönük eski demir tavan lambası (Seviye 1)',
                baseCost: 2200,
                levelCosts: [0, 2200, 3300, 4800],
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Bohemya Kristal Saray Avizesi',
                        style: 'Kraliyet Kristali',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '💎',
                        desc: '3 katlı Bohemya kristalleri ve sıcak altın mum efektli görkemli tavan avizesi.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Modern Altın Halka Halo Avize',
                        style: 'Çağdaş Lüks',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '✨',
                        desc: 'İç içe geçmiş 3 adet 24K altın LED halka ve sarkan kristal damlalar.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Murano Kehribar Cam Yıldız Avize',
                        style: 'Venedik Sanatı',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌟',
                        desc: 'El üflemesi Venedik Murano kehribar cam kollar ve sıcak gün batımı ışıltısı.'
                    }
                ]
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                room: 'lobby',
                name: 'Lobi Kraliyet Halısı & Dinlenme Koltukları',
                area: 'Lobi & Lounge',
                sceneImg: 'assets/scene_lobby_carpet.jpg',
                pinX: 25,
                pinY: 72,
                cardW: 155,
                cardH: 90,
                defaultDesc: 'Yıpranmış soluk koridor halısı ve eski koltuklar (Seviye 1)',
                baseCost: 950,
                levelCosts: [0, 950, 1500, 2200],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Kızıl Kadife & Altın Bordürlü Saray Halısı',
                        style: 'Kraliyet Kırmızısı',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 18,
                        repBoost: 25,
                        icon: '🟥',
                        desc: 'Aurelia armalı kızıl ipek halı ve altın varaklı berjer dinlenme koltukları.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Yeşili & Krem Mermer Lounge',
                        style: 'Riviera Esintisi',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 22,
                        repBoost: 30,
                        icon: '🟩',
                        desc: 'Zümrüt yeşili kadife kanepeler, altın sehpalar ve geometrik İran halısı.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Gece Mavisi & Gümüş İpek Halı',
                        style: 'Monako Gece',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 25,
                        repBoost: 35,
                        icon: '🟦',
                        desc: 'Safir mavisi ipek dokuma halı ve beyaz deri VIP dinlenme koltukları.'
                    }
                ]
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                room: 'restaurant',
                name: 'Riviera Restoran Yemek Masaları',
                area: 'Restoran & Teras',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                pinX: 34,
                pinY: 66,
                cardW: 162,
                cardH: 94,
                defaultDesc: 'Örtüsüz ahşap masalar ve sade sandalyeler (Seviye 1)',
                baseCost: 1200,
                levelCosts: [0, 1200, 1900, 2800],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Mum Işıklı Bordo Kadife Gala Masaları',
                        style: 'Romantik Gala',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 28,
                        repBoost: 40,
                        icon: '🕯️',
                        desc: 'Bordo kadife sandalyeler, altın şamdanlar ve gül yapraklarıyla süslü VIP masalar.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Beyaz İpek & Altın Riviera Masaları',
                        style: 'Akdeniz Şıklığı',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 32,
                        repBoost: 45,
                        icon: '🥂',
                        desc: 'Krem ipek örtülü mermer masalar, kristal şampanya kadehleri ve altın sandalyeler.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Koyu Ceviz & Zümrüt Gurme locaları',
                        style: 'Michelin VIP',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 36,
                        repBoost: 55,
                        icon: '🍽️',
                        desc: 'Özel ceviz ağacı masalar, zümrüt yeşili deri koltuklar ve gümüş servis takımları.'
                    }
                ]
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                room: 'restaurant',
                name: 'Şampanya & Kokteyl Barı',
                area: 'Restoran & Bar',
                sceneImg: 'assets/scene_restaurant_bar.jpg',
                pinX: 72,
                pinY: 46,
                cardW: 162,
                cardH: 94,
                defaultDesc: 'Boş raflı, ışıksız eski içecek tezgâhı (Seviye 1)',
                baseCost: 1800,
                levelCosts: [0, 1800, 2700, 3900],
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Altın Onyx & Kristal Şampanya Barı',
                        style: 'Altın Onyx',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 38,
                        repBoost: 50,
                        icon: '🍾',
                        desc: 'Arkadan aydınlatmalı kehribar onyx taş tezgâh, altın bar tabureleri ve yıllanmış şampanya mahzeni.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Safir Cam & Gümüş Kokteyl Lounge',
                        style: 'Gece Kulübü',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 42,
                        repBoost: 60,
                        icon: '🍸',
                        desc: 'Safir mavi LED aydınlatmalı kristal bar, krom tabureler ve moleküler kokteyl istasyonu.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Klasik Maun & Pirinç Centilmen Barı',
                        style: 'Monte Carlo',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 46,
                        repBoost: 65,
                        icon: '🥃',
                        desc: 'Parlak maun ağacı, pirinç ayaklıklar ve nadir kristal konyak şişeleriyle dolu vitrin.'
                    }
                ]
            },
            room101_bed: {
                id: 'room101_bed',
                room: 'room101',
                name: 'Deluxe Suit Kraliyet Yatağı (Oda 101)',
                area: 'Misafir Suiti 101',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                pinX: 35,
                pinY: 60,
                cardW: 162,
                cardH: 94,
                defaultDesc: 'Standart tek katlı yatak ve sade başlık (Seviye 1)',
                baseCost: 1600,
                levelCosts: [0, 1600, 2500, 3700],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Sayvanlı Altın & Beyaz İpek Kraliyet Yatağı',
                        style: 'Kraliyet Suiti',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 34,
                        repBoost: 48,
                        icon: '🛏️',
                        desc: 'Dört sütunlu altın sayvan, Mısır ipeği çarşaflar ve kadife yatak ucu pufu.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kızıl Kadife & Gül Yapraklı Romantik Yatak',
                        style: 'Balayı Suiti',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 38,
                        repBoost: 52,
                        icon: '🌹',
                        desc: 'Kapitone bordo kadife başlık, kırmızı gül yaprakları ve sıcak başucu abajurları.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Modern İskandinav Ceviz & Kaşmir Yatak',
                        style: 'Modern Suit',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 58,
                        icon: '✨',
                        desc: 'Geniş ceviz platform yatak, bej kaşmir örtüler ve entegre okuma ışıkları.'
                    }
                ]
            },
            room101_decor: {
                id: 'room101_decor',
                room: 'room101',
                name: 'Suit 101 Panoramik Deniz Terası & Lounge',
                area: 'Misafir Suiti 101',
                sceneImg: 'assets/scene_suite_terrace.jpg',
                pinX: 74,
                pinY: 48,
                cardW: 158,
                cardH: 92,
                defaultDesc: 'Boş pencere önü ve eski sehpa (Seviye 1)',
                baseCost: 1400,
                levelCosts: [0, 1400, 2100, 3100],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Zümrüt Kadife Berjerler & Mermer Sehpa',
                        style: 'Körfez Manzarası',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 26,
                        repBoost: 38,
                        icon: '🛋️',
                        desc: 'Akdeniz manzarasına karşı iki adet zümrüt berjer, altın sehpa ve şampanya kovası.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Krem Deri Şezlong & Kristal Dekor',
                        style: 'Güneş Terası',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 42,
                        icon: '🌅',
                        desc: 'Yumuşak krem deri uzanma koltuğu, altın teleskop ve taze orkide vazosu.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Kraliyet Çalışma Masası & Sanat Köşesi',
                        style: 'Diplomatik Suit',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 33,
                        repBoost: 46,
                        icon: '🖼️',
                        desc: 'Fransız antika çalışma masası, altın çerçeveli yağlıboya tablolar ve ipek perdeler.'
                    }
                ]
            },
            swimming_pool: {
                id: 'swimming_pool',
                room: 'pool',
                name: 'Sonsuzluk Havuzu & Güneşlenme Locaları',
                area: 'Havuz & Teras',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                pinX: 50,
                pinY: 56,
                cardW: 174,
                cardH: 98,
                defaultDesc: 'Bakımsız, ışıksız havuz ve boş teras (Seviye 1)',
                baseCost: 3500,
                levelCosts: [0, 3500, 5200, 7500],
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Turkuaz Mozaik Sonsuzluk Havuzu & Beyaz Localar',
                        style: 'Monako Riviera',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 95,
                        icon: '🏊',
                        desc: 'Altın bordürlü turkuaz mozaik havuz, tik ağacı şezlonglar, beyaz ipek kabanalar ve palmiyeler.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Yansımalı Kraliyet Havuzu & Kızıl Şemsiyeler',
                        style: 'İmparatorluk',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 110,
                        icon: '☀️',
                        desc: 'Su altı altın LED aydınlatma, mermer güneşlenme yatakları ve kraliyet kırmızısı şemsiyeler.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Gece Safiri LED Havuz & VIP Parti Locaları',
                        style: 'Yat Kulübü',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        icon: '🌊',
                        desc: 'Fiberoptik yıldız tabanlı havuz, yüzen ateş çukurları ve özel şampanya servisli localar.'
                    }
                ]
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                room: 'spa',
                name: 'Aurelia Zen Spa & Termal Jakuzi',
                area: 'Spa & Wellness',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                pinX: 50,
                pinY: 58,
                cardW: 170,
                cardH: 96,
                defaultDesc: 'Standart taş zemin, henüz spa kurulumu yapılmamış (Seviye 1)',
                baseCost: 2800,
                levelCosts: [0, 2800, 4200, 6000],
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Carrara Mermer Termal Jakuzi & Mum Terapisi',
                        style: 'Kraliyet Hamamı',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '♨️',
                        desc: 'Sıcak buharlı mermer jakuzi, altın su jetleri, kokulu mumlar ve masaj yatakları.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bambu & Siyah Bazalt Taş Zen Spa',
                        style: 'Uzakdoğu Zen',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 58,
                        repBoost: 88,
                        icon: '🎋',
                        desc: 'Siyah volkanik bazalt taş havuz, sıcak taş terapi istasyonu ve orkide bahçesi.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Altın Mozaik & Gül Suyu Kraliyet Terapisi',
                        style: 'Aurelia VIP Spa',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 64,
                        repBoost: 96,
                        icon: '🌺',
                        desc: '24 ayar altın mozaik kaplı jakuzi, taze gül yaprakları ve aromaterapi buhar kubbesi.'
                    }
                ]
            },
            garden_courtyard: {
                id: 'garden_courtyard',
                room: 'garden',
                name: 'Akdeniz Botanik Bahçesi & Mermer Çeşme',
                area: 'Bahçe & Avlu',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                pinX: 50,
                pinY: 56,
                cardW: 170,
                cardH: 96,
                defaultDesc: 'Kurumuş çalılar ve çalışmayan taş çeşme (Seviye 1)',
                baseCost: 2000,
                levelCosts: [0, 2000, 3000, 4400],
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '3 Katlı Mermer Kraliyet Çeşmesi & Gül Kemerleri',
                        style: 'Fransız Bahçesi',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 42,
                        repBoost: 65,
                        icon: '⛲',
                        desc: 'Su fışkırtan 3 katlı beyaz mermer çeşme, kırmızı gül kemerleri ve altın bahçe fenerleri.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Heykelli Havuz & Akdeniz Palmiyeleri',
                        style: 'Monte Carlo Avlusu',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 48,
                        repBoost: 72,
                        icon: '🌴',
                        desc: 'Altın kuğu heykelli süs havuzu, ışıklandırılmış palmiyeler ve mermer oturma bankları.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Işıklı Kristal Çardak & Gece Yasemin Bahçesi',
                        style: 'Romantik Bahçe',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 54,
                        repBoost: 80,
                        icon: '🌸',
                        desc: 'Peri ışıklarıyla sarılı ferforje altın çardak, yasemin ağaçları ve romantik yürüyüş yolu.'
                    }
                ]
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                room: 'penthouse',
                name: 'Başkanlık Penthouse Suiti & Kuyruklu Piyano',
                area: '2. Kat Penthouse',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                pinX: 50,
                pinY: 56,
                cardW: 178,
                cardH: 100,
                defaultDesc: 'Üstü örtülü eşyalar, boş teras katı (Seviye 1)',
                baseCost: 5000,
                levelCosts: [0, 5000, 7500, 10500],
                starsNeeded: 3,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Altın Kuyruklu Piyano & Kraliyet Penthouse Salonu',
                        style: 'İmparatorluk',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 110,
                        repBoost: 160,
                        icon: '🎹',
                        desc: 'Parlak siyah-altın konser piyanosu, dairesel kadife kanepe, mermer şömine ve özel şampanya barı.'
                    },
                    {
                        id: 'opt_b',
                        name: 'Milyarder Çatı Katı & Kristal Jakuzi Terası',
                        style: 'Ultra Modern',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 125,
                        repBoost: 180,
                        icon: '👑',
                        desc: 'Panoramik cam tavan altı beyaz deri salon, altın heykel koleksiyonu ve VIP teras.'
                    },
                    {
                        id: 'opt_c',
                        name: 'Aurelia Miras Salonu & Antika Kütüphane',
                        style: 'Asil Miras',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 140,
                        repBoost: 200,
                        icon: '🏛️',
                        desc: 'Maun kitaplıklar, bordo kadife chesterfield koltuklar, altın avize ve gizli kasa bölmesi.'
                    }
                ]
            }
        };
    }

    // ----------------------------------------------------
    // STATE PERSISTENCE & LEVEL HELPERS
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
            const raw = localStorage.getItem('velvetSecrets3DHotelV2');
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
            localStorage.setItem('velvetSecrets3DHotelV2', JSON.stringify(this.state));
            if (window.GameEconomy && window.GameEconomy.data) {
                window.GameEconomy.data.renovations = { ...this.state.renovations };
                window.GameEconomy.save();
            }
        } catch (e) {}
    }

    getAreaLevel(id) {
        const entry = this.state.renovations[id];
        if (!entry) return 1;
        if (typeof entry === 'string') return 2;
        return Math.max(1, Math.min(4, entry.level || 2));
    }

    getInstalledOption(id) {
        const entry = this.state.renovations[id];
        if (!entry) return null;
        if (typeof entry === 'string') {
            return { optionId: entry, level: 2 };
        }
        return entry;
    }

    getNextUpgradeCost(id) {
        const def = this.renovationDefs[id];
        if (!def) return 1000;
        const curLvl = this.getAreaLevel(id);
        if (curLvl >= 4) return 0;
        if (def.levelCosts && def.levelCosts[curLvl]) {
            return def.levelCosts[curLvl];
        }
        return Math.round(def.baseCost * (1 + (curLvl - 1) * 0.55));
    }

    getNextUpgradeStars(id) {
        const def = this.renovationDefs[id];
        if (!def) return 1;
        const curLvl = this.getAreaLevel(id);
        if (curLvl >= 4) return 0;
        return (def.starsNeeded || 1) + (curLvl - 1);
    }

    recalcHotelStats() {
        let baseIncome = 45;
        let baseRep = 120;
        let totalUpgradedLevels = 0;

        Object.keys(this.state.renovations).forEach(key => {
            const def = this.renovationDefs[key];
            const installed = this.getInstalledOption(key);
            if (def && installed) {
                const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
                const lvl = installed.level || 2;
                const lvlMultiplier = 1 + (lvl - 2) * 0.55;
                if (opt) {
                    baseIncome += Math.round(opt.incomeBoost * lvlMultiplier);
                    baseRep += Math.round(opt.repBoost * lvlMultiplier);
                    totalUpgradedLevels += (lvl - 1);
                }
            }
        });

        this.state.incomePerMin = baseIncome;
        this.state.reputation = baseRep;
        this.state.hotelStars = Math.min(5, 3 + Math.floor(totalUpgradedLevels / 5));
        this.updateHUD();
    }

    // ----------------------------------------------------
    // AUTOMATIC AFFORDABILITY NOTIFICATIONS
    // ----------------------------------------------------
    checkAffordableNotifications(silentFirstLoad = false) {
        if (!this.renovationDefs) return;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;

        let newlyAffordable = null;
        Object.keys(this.renovationDefs).forEach(id => {
            const curLvl = this.getAreaLevel(id);
            if (curLvl >= 4) return;
            const def = this.renovationDefs[id];
            const cost = this.getNextUpgradeCost(id);
            const starsReq = this.getNextUpgradeStars(id);
            const notifyKey = `${id}_lv${curLvl + 1}`;
            if (balance >= cost && stars >= starsReq) {
                if (!this.notifiedAffordable.has(notifyKey)) {
                    this.notifiedAffordable.add(notifyKey);
                    if (!newlyAffordable) newlyAffordable = { def, nextLvl: curLvl + 1, cost };
                }
            } else {
                this.notifiedAffordable.delete(notifyKey);
            }
        });

        if (newlyAffordable && !silentFirstLoad) {
            this.showAffordabilityToast(newlyAffordable.def, newlyAffordable.nextLvl, newlyAffordable.cost);
        }
    }

    showAffordabilityToast(def, nextLvl = 2, cost = 1500) {
        this.playSound('chime');
        let toast = document.getElementById('budgetAlertToast');
        if (!toast) return;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        toast.innerHTML = `
            <div class="budget-toast-inner">
                <div class="bt-icon">🔔</div>
                <div class="bt-content">
                    <strong>BÜTÇENİZ YETERLİ! ($${balance})</strong>
                    <p>Birikiminiz <b>${def.name} (Seviye ${nextLvl})</b> (${def.area} — <b>$${cost}</b>) yenilemesi için yeterli! Şimdi 3 tasarımdan birini seçin.</p>
                </div>
                <div class="bt-actions">
                    <button class="bt-go-btn" onclick="hotel3D.goToAndOpenRenovation('${def.id}')">🛠️ Tasarımları Gör</button>
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
        this.walkCharacterTo(Math.max(18, Math.min(82, def.pinX - 18)), Math.min(84, def.pinY + 14), `${def.name} için 3 lüks tasarımı alt çubuktan seçebilirsin!`);
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
    // PAN & ZOOM INTERACTION FOR GOSSIP HARBOR STAGE
    // ----------------------------------------------------
    initStageInteractions() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage) return;

        let startX = 0;
        let startY = 0;
        let initialPanX = 0;
        let initialPanY = 0;
        let moved = false;

        stage.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button') || e.target.closest('.gh-furniture-node') || e.target.closest('.gh-door-pin') || e.target.closest('.gh-map-room-node') || e.target.closest('.gh-guest-token')) {
                return;
            }
            this.isDraggingStage = true;
            moved = false;
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
            if (Math.hypot(dx, dy) > 6) moved = true;

            this.panX = Math.max(-110, Math.min(110, initialPanX + dx * 0.65));
            this.panY = Math.max(-55, Math.min(55, initialPanY + dy * 0.55));
            this.applyCameraTransform();
        });

        const endDrag = (e) => {
            if (!this.isDraggingStage) return;
            this.isDraggingStage = false;
            // If user tapped on the floor without dragging, walk Isabella to that spot!
            if (!moved && !this.isMapMode) {
                const rect = stage.getBoundingClientRect();
                const clickX = Math.max(14, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                const clickY = Math.max(46, Math.min(86, ((e.clientY - rect.top) / rect.height) * 100));
                this.walkCharacterTo(clickX, clickY, 'Buradan odanın tüm detayları harika görünüyor!');
            }
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
        // Gently shift pan toward the selected object and zoom slightly like Gossip Harbor
        this.panX = Math.max(-85, Math.min(85, (50 - pinX) * 1.6));
        this.panY = Math.max(-40, Math.min(40, (50 - pinY) * 1.1));
        this.zoom = 1.08;
        this.applyCameraTransform();
    }

    resetCameraView() {
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;
        this.applyCameraTransform();
        this.closeBottomDesignDock();
    }

    walkCharacterTo(targetX, targetY, speechText) {
        this.playSound('step');
        this.characterPos = {
            x: Math.max(14, Math.min(86, targetX)),
            y: Math.max(48, Math.min(86, targetY)),
            walking: true,
            speech: speechText || this.characterPos.speech
        };

        const charEl = document.getElementById('ghIsabellaToken');
        const speechEl = document.getElementById('ghIsabellaSpeech');
        if (charEl) {
            charEl.classList.add('walking');
            charEl.style.left = `${this.characterPos.x}%`;
            charEl.style.top = `${this.characterPos.y}%`;
            if (speechEl && speechText) {
                speechEl.textContent = speechText;
            }
            clearTimeout(this.walkTimer);
            this.walkTimer = setTimeout(() => {
                charEl.classList.remove('walking');
            }, 650);
        }
    }

    // ----------------------------------------------------
    // RENDER GOSSIP HARBOR ROOM STAGE OR ISOMETRIC RESORT MAP
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
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;

        let nodesHtml = '';
        Object.keys(this.rooms).forEach((roomKey) => {
            const rm = this.rooms[roomKey];
            let totalLvl = 0;
            let maxLvl = rm.areas.length * 4;
            let readyCount = 0;
            let minNextCost = Infinity;

            rm.areas.forEach((aId) => {
                const cur = this.getAreaLevel(aId);
                totalLvl += cur;
                if (cur < 4) {
                    const c = this.getNextUpgradeCost(aId);
                    const s = this.getNextUpgradeStars(aId);
                    if (c < minNextCost) minNextCost = c;
                    if (balance >= c && stars >= s) readyCount++;
                }
            });

            const allMax = (totalLvl >= maxLvl);
            const isActiveRoom = (this.currentRoom === roomKey);

            nodesHtml += `
                <div class="gh-map-room-node ${isActiveRoom ? 'current-room' : ''} ${readyCount > 0 ? 'has-ready' : ''}"
                     style="left: ${rm.mapPos.x}%; top: ${rm.mapPos.y}%;"
                     onclick="hotel3D.jumpTo('${roomKey}')">
                    <div class="gh-map-thumb" style="background-image: url('${rm.bgImg}');">
                        <span class="gh-map-lv-pill">Lv.${totalLvl}/${maxLvl}</span>
                        ${readyCount > 0 ? `<span class="gh-map-ready-hammer">🔨 ${readyCount} Hazır!</span>` : ''}
                    </div>
                    <div class="gh-map-node-body">
                        <strong>${rm.shortName}</strong>
                        <small>${allMax ? '👑 Tamamlandı' : `Sonraki: $${minNextCost}`}</small>
                    </div>
                </div>
            `;
        });

        stage.innerHTML = `
            <div class="gh-room-canvas gh-isometric-map-canvas" style="background-image: linear-gradient(180deg, rgba(10,14,24,0.35), rgba(10,14,24,0.68)), url('assets/scene_hotel_exterior.jpg');">
                <div class="gh-map-header-banner">
                    <span>✦ AURELIA PALACE İZOMETRİK OTEL HARİTASI — Gitmek istediğiniz odaya dokunun!</span>
                </div>
                <!-- Isometric SVG Golden Pathways connecting the 7 hotel wings -->
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

        // If an area in this room is being previewed or upgraded, check its background/lighting tint
        let roomTintStyle = '';
        if (this.previewingRenovation) {
            const pDef = this.renovationDefs[this.previewingRenovation.id];
            if (pDef && pDef.room === rm.id) {
                if (this.previewingRenovation.optionId === 'opt_a') {
                    roomTintStyle = 'filter: brightness(1.06) contrast(1.05);';
                } else if (this.previewingRenovation.optionId === 'opt_b') {
                    roomTintStyle = 'filter: contrast(1.12) saturate(1.22);';
                } else {
                    roomTintStyle = 'filter: sepia(0.1) saturate(1.25) brightness(1.04);';
                }
            }
        }

        // 1. Render Interactive Renovation Furniture Nodes inside this room
        let furnitureNodesHtml = '';
        rm.areas.forEach((areaId) => {
            const def = this.renovationDefs[areaId];
            if (!def) return;

            const curLvl = this.getAreaLevel(areaId);
            const isMax = (curLvl >= 4);
            const nextLvl = Math.min(4, curLvl + 1);
            const cost = this.getNextUpgradeCost(areaId);
            const starsReq = this.getNextUpgradeStars(areaId);
            const canAfford = isMax || (balance >= cost && stars >= starsReq);
            const isSelected = (this.selectedAreaId === areaId);

            // Check if currently previewing an option on this furniture piece
            const isPreviewingThis = (this.previewingRenovation && this.previewingRenovation.id === areaId);
            const installed = this.getInstalledOption(areaId);
            const activeOptId = isPreviewingThis
                ? this.previewingRenovation.optionId
                : (installed ? installed.optionId : null);
            const displayLvl = isPreviewingThis ? nextLvl : curLvl;

            let visualThumbUrl = def.sceneImg;
            try {
                if (activeOptId && window.LuxuryArt && window.LuxuryArt.getDesignPreview) {
                    visualThumbUrl = window.LuxuryArt.getDesignPreview(areaId, activeOptId, displayLvl) || def.sceneImg;
                }
            } catch (e) {}
            const patchFilterStyle = (activeOptId && window.LuxuryArt && window.LuxuryArt.getDesignCssFilter)
                ? `filter: ${window.LuxuryArt.getDesignCssFilter(activeOptId)};`
                : '';

            const activeOptObj = activeOptId ? (def.options.find(o => o.id === activeOptId) || def.options[0]) : null;
            const styleBadgeText = isPreviewingThis
                ? `👁️ ÖNİZLEME: ${activeOptObj ? activeOptObj.style : 'Yeni Tasarım'}`
                : (installed && activeOptObj ? `✨ Lv.${curLvl} · ${activeOptObj.style}` : `🕸️ Seviye 1 (Eski Hali)`);

            const pinClass = isMax ? 'pin-max' : (canAfford ? 'pin-ready' : 'pin-saving');
            const pinBadgeHtml = isMax
                ? `<span class="gh-pin-bubble ${pinClass}">👑 MAX (Lv.4)</span>`
                : (canAfford
                    ? `<span class="gh-pin-bubble ${pinClass}">🔨 YENİLE! ($${cost})</span>`
                    : `<span class="gh-pin-bubble ${pinClass}">🔨 $${cost} (Lv.${nextLvl})</span>`);

            furnitureNodesHtml += `
                <div class="gh-furniture-node ${curLvl > 1 || isPreviewingThis ? 'is-upgraded' : 'is-unrenovated'} ${isSelected ? 'is-selected' : ''} ${isPreviewingThis ? 'is-previewing' : ''}"
                     style="left: ${def.pinX}%; top: ${def.pinY}%; width: ${def.cardW || 160}px;"
                     onclick="hotel3D.selectFurnitureOnStage('${areaId}', event)">
                    
                    <!-- Floating Gossip Harbor Hammer/Star Pin -->
                    <div class="gh-pin-anchor">
                        ${pinBadgeHtml}
                    </div>

                    <!-- Furniture Visual Showcase Patch on the Room Stage -->
                    <div class="gh-furniture-visual-patch" style="background-image: url('${visualThumbUrl}'); ${patchFilterStyle}">
                        <div class="gh-patch-top-row">
                            <span class="gh-patch-lv">Lv.${displayLvl}/4</span>
                            ${curLvl > 1 || isPreviewingThis ? '<span class="gh-patch-sparkle">✦</span>' : '<span class="gh-patch-cobweb">🕸️</span>'}
                        </div>
                        <div class="gh-patch-bottom-label">
                            <strong>${def.name}</strong>
                            <small>${styleBadgeText}</small>
                        </div>
                    </div>
                </div>
            `;
        });

        // 2. Render Connected Doorway Navigation Pins
        let doorsHtml = '';
        (rm.doors || []).forEach((d) => {
            doorsHtml += `
                <button class="gh-door-pin" style="left: ${d.x}%; top: ${d.y}%;"
                        onclick="hotel3D.jumpTo('${d.target}', event)">
                    <span>${d.label}</span>
                </button>
            `;
        });

        // 3. Render Guest Character Token (if present in this room)
        let guestHtml = '';
        if (rm.guest) {
            guestHtml = `
                <div class="gh-guest-token" style="left: ${rm.guest.x}%; top: ${rm.guest.y}%;"
                     onclick="hotel3D.talkToGuest(event)">
                    <div class="gh-char-avatar-ring guest">
                        <img src="${rm.guest.avatar}" alt="${rm.guest.name}">
                        <span class="gh-char-chat-dot">💬</span>
                    </div>
                    <span class="gh-char-name-tag">${rm.guest.name}</span>
                </div>
            `;
        }

        // 4. Render Isabella's Walkable Character Token on the Room Floor
        const isabellaHtml = `
            <div id="ghIsabellaToken" class="gh-isabella-token"
                 style="left: ${this.characterPos.x}%; top: ${this.characterPos.y}%;">
                <div id="ghIsabellaSpeech" class="gh-char-speech-bubble">${this.characterPos.speech}</div>
                <div class="gh-char-avatar-ring isabella">
                    <img src="assets/avatar_isabella.jpg" alt="Isabella Laurent">
                </div>
                <span class="gh-char-name-tag gold">Isabella Laurent</span>
                <div class="gh-char-floor-shadow"></div>
            </div>
        `;

        stage.innerHTML = `
            <div class="gh-room-canvas" style="background-image: url('${rm.bgImg}'); ${roomTintStyle}; transform: translate3d(${this.panX}px, ${this.panY}px, 0) scale(${this.zoom});">
                <div class="gh-ambient-sunbeams"></div>
                <div class="gh-room-vignette"></div>
                ${doorsHtml}
                ${furnitureNodesHtml}
                ${guestHtml}
                ${isabellaHtml}
            </div>
        `;
    }

    talkToGuest(e) {
        if (e) e.stopPropagation();
        const rm = this.rooms[this.currentRoom];
        if (!rm || !rm.guest) return;
        this.playSound('chime');
        this.walkCharacterTo(Math.max(20, rm.guest.x - 16), rm.guest.y, `"${rm.guest.quote}"`);
        const dlg = document.getElementById('hotelDialogueText');
        if (dlg) {
            dlg.textContent = `${rm.guest.name}: "${rm.guest.quote}"`;
        }
        this.showBanner(`💬 ${rm.guest.name}: "${rm.guest.quote}"`);
    }

    selectFurnitureOnStage(areaId, e) {
        if (e) e.stopPropagation();
        const def = this.renovationDefs[areaId];
        if (!def) return;

        this.selectedAreaId = areaId;
        this.playSound('step');

        const curLvl = this.getAreaLevel(areaId);
        const nextLvl = Math.min(4, curLvl + 1);
        const cost = this.getNextUpgradeCost(areaId);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;

        const speech = curLvl >= 4
            ? `${def.name} maksimum seviyede (Lv.4)! Alt çubuktan 3 tasarım arasında geçiş yapabilirsin.`
            : (balance >= cost
                ? `Harika! $${balance} bakiyemiz var. ${def.name} için alt çubuktan 3 tasarımdan birini seçip onaylayalım!`
                : `${def.name} Seviye ${nextLvl} için $${cost} gerekiyor. Aşağıdaki 3 tasarımı şimdiden canlı deneyebilirsin!`);

        this.walkCharacterTo(Math.max(18, Math.min(82, def.pinX - 18)), Math.min(84, def.pinY + 14), speech);
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
        const targetId = areaId || this.selectedAreaId || 'reception_desk';
        const def = this.renovationDefs[targetId];
        if (!def) return;

        this.selectedAreaId = targetId;
        const installed = this.getInstalledOption(targetId);
        if (installed && (!this.previewingRenovation || this.previewingRenovation.id !== targetId)) {
            const idx = def.options.findIndex(o => o.id === installed.optionId);
            this.selectedOptionIndex = idx >= 0 ? idx : 0;
        } else if (!this.previewingRenovation || this.previewingRenovation.id !== targetId) {
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
        this.previewingRenovation = null;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.renderBottomDesignDock();
        this.renderStage();
    }

    selectBottomDockOption(areaId, idx) {
        const def = this.renovationDefs[areaId];
        if (!def || !def.options[idx]) return;
        this.selectedAreaId = areaId;
        this.selectedOptionIndex = idx;
        const opt = def.options[idx];
        this.previewingRenovation = { id: areaId, optionId: opt.id };
        this.playSound('chime');
        this.renderBottomDesignDock();
        this.updateProximityPanel();
        this.renderStage();
        this.showBanner(`👁️ Seçenek ${idx + 1}: "${opt.name}" oda sahnesinde canlı önizleniyor!`);
    }

    renderBottomDesignDock() {
        const dock = document.getElementById('ghBottomDesignDock');
        if (!dock) return;
        const activeId = this.selectedAreaId || 'reception_desk';
        const def = this.renovationDefs[activeId];
        if (!def) return;

        dock.style.display = 'block';
        const id = def.id;
        const curLvl = this.getAreaLevel(id);
        const isMax = (curLvl >= 4);
        const nextLvl = Math.min(4, curLvl + 1);
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = isMax || (balance >= cost && stars >= starsNeeded);
        const stillNeeded = Math.max(0, cost - balance);

        const styleNames = ['1. Modern Zarafet', '2. Kraliyet Kadife', '3. Akdeniz Riviera'];
        let cardsHtml = '';

        def.options.forEach((opt, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            let thumbSrc = def.sceneImg || 'assets/scene_lobby_reception.jpg';
            try {
                if (window.LuxuryArt && window.LuxuryArt.getDesignPreview) {
                    thumbSrc = window.LuxuryArt.getDesignPreview(id, opt.id, nextLvl) || thumbSrc;
                }
            } catch (e) {}
            const cssFilter = (window.LuxuryArt && window.LuxuryArt.getDesignCssFilter)
                ? window.LuxuryArt.getDesignCssFilter(opt.id)
                : '';

            cardsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}'); filter: ${cssFilter};">
                        <span class="gh-dock-opt-num">${styleNames[idx]}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ SEÇİLİ</span>' : (!canAfford && !isMax ? '<span class="gh-dock-lock-tag">👁️ Dene</span>' : '<span class="gh-dock-check-tag">Seç</span>')}
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
                    <span class="gh-dock-lvl-badge">🔨 ${def.area} · Seviye ${curLvl} ➔ Seviye ${nextLvl}</span>
                    <h4>${def.name} — 3 Lüks Tasarım Seçeneğinden Birini Seçin:</h4>
                </div>
                <div class="gh-dock-header-right">
                    <button class="gh-dock-detail-btn" onclick="hotel3D.openRenovationModal('${id}')">📋 Tam Ekran İncele</button>
                </div>
            </div>

            <div class="gh-dock-options-grid">
                ${cardsHtml}
            </div>

            <div class="gh-dock-footer">
                <div class="gh-dock-budget-info">
                    <span>Maliyet: <b class="text-gold">${isMax ? 'KURULU (MAX)' : '$' + cost + ' & ⭐' + starsNeeded}</b></span>
                    <span>Kasanız: <b>$${balance} & ⭐${stars}</b></span>
                    <span class="${canAfford ? 'text-green' : 'text-warn'}">
                        ${isMax ? '👑 Tüm Tasarımlar Açık' : (canAfford ? `🟢 Bütçe Hazır! (Kalan: +$${balance - cost})` : `⏳ $${stillNeeded} Daha Gerekli`)}
                    </span>
                </div>
                <div class="gh-dock-action-btns">
                    ${canAfford ? `
                        <button class="gh-dock-confirm-btn ready" onclick="hotel3D.executePurchase('${id}', '${chosenOpt.id}')">
                            ✓ ${isMax ? 'Bu Tasarımı Uygula (Ücretsiz)' : `Seçimi Onayla & Kur ($${cost})`}
                        </button>
                    ` : `
                        <button class="gh-dock-target-btn" onclick="hotel3D.setTargetRenovation('${id}')">
                            🎯 Hedef Yap
                        </button>
                        <button class="gh-dock-confirm-btn locked" onclick="window.switchMainPage && window.switchMainPage('pageBoard')">
                            🧩 Masada Sipariş Tamamla ($${stillNeeded} Eksik)
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------
    // FULL RENOVATION MODAL & PURCHASE EXECUTION
    // ----------------------------------------------------
    openRenovationModal(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        this.activeModalPoint = id;
        this.selectedAreaId = id;
        const installed = this.getInstalledOption(id);

        if (installed) {
            const idx = def.options.findIndex(o => o.id === installed.optionId);
            this.selectedOptionIndex = idx >= 0 ? idx : 0;
        } else if (typeof this.selectedOptionIndex !== 'number') {
            this.selectedOptionIndex = 0;
        }

        const modal = document.getElementById('renoModal');
        if (!modal) return;

        this.renderModalContent(id);
        modal.style.display = 'flex';
    }

    selectDesignTab(idx) {
        this.selectedOptionIndex = idx;
        if (this.activeModalPoint) {
            const def = this.renovationDefs[this.activeModalPoint];
            if (def && def.options[idx]) {
                this.previewingRenovation = { id: this.activeModalPoint, optionId: def.options[idx].id };
            }
            this.renderModalContent(this.activeModalPoint);
            this.renderBottomDesignDock();
            this.updateProximityPanel();
            this.renderStage();
        }
    }

    previewDesignInWorld(optionId) {
        if (!this.activeModalPoint) return;
        const def = this.renovationDefs[this.activeModalPoint];
        if (def) {
            this.isMapMode = false;
            this.currentRoom = def.room || 'lobby';
        }
        this.previewingRenovation = { id: this.activeModalPoint, optionId };
        this.playSound('chime');
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
        this.openBottomDesignDock(this.activeModalPoint, true);
        this.showBanner('👁️ Tasarım oda sahnesinde canlı önizleniyor! Alt çubuktan onaylayabilirsiniz.');
    }

    cancelPreviewAndClose() {
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
        this.activeModalPoint = null;
    }

    renderModalContent(id) {
        const def = this.renovationDefs[id];
        const modalContent = document.getElementById('renoModalContent');
        if (!def || !modalContent) return;

        const curLvl = this.getAreaLevel(id);
        const isMaxLevel = (curLvl >= 4);
        const nextLvl = Math.min(4, curLvl + 1);
        const installed = this.getInstalledOption(id);
        const opt = def.options[this.selectedOptionIndex] || def.options[0];
        const isPreviewing = this.previewingRenovation && this.previewingRenovation.optionId === opt.id;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const canAfford = isMaxLevel || (balance >= cost && stars >= starsNeeded);
        const deficitCoins = Math.max(0, cost - balance);
        const deficitStars = Math.max(0, starsNeeded - stars);

        const optionStyleLabels = [
            'Seçenek 1 — Modern Zarafet',
            'Seçenek 2 — Kadife Lüks',
            'Seçenek 3 — Akdeniz Suiti'
        ];

        let levelStepsHtml = '';
        for (let lv = 1; lv <= 4; lv++) {
            const stepState = lv < curLvl ? 'lv-done' : (lv === curLvl ? 'lv-current' : (lv === nextLvl ? 'lv-next' : 'lv-locked'));
            const stepTitle = lv === 1 ? 'Lv.1 Başlangıç' : `Lv.${lv} Lüks`;
            levelStepsHtml += `<div class="reno-lv-step ${stepState}"><span>${stepTitle}</span></div>`;
        }

        let optionsTabsHtml = '';
        def.options.forEach((o, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            const isInstalled = (installed && (installed === o.id || installed.optionId === o.id));
            optionsTabsHtml += `
                <button class="design-tab-btn ${isSelected ? 'active' : ''} ${isInstalled ? 'installed' : ''}" 
                    onclick="hotel3D.selectDesignTab(${idx})">
                    <span class="tab-icon">${o.icon}</span>
                    <div class="tab-text">
                        <b>Seçenek ${idx + 1}</b>
                        <small>${optionStyleLabels[idx].split('— ')[1]}</small>
                    </div>
                    ${isInstalled ? `<span class="installed-tag">Lv.${curLvl}</span>` : ''}
                </button>
            `;
        });

        let previewImgSrc = def.sceneImg || 'assets/scene_lobby_reception.jpg';
        try {
            if (window.LuxuryArt && window.LuxuryArt.getDesignPreview) {
                previewImgSrc = window.LuxuryArt.getDesignPreview(id, opt.id, nextLvl) || previewImgSrc;
            }
        } catch (e) {}
        const cssFilter = (window.LuxuryArt && window.LuxuryArt.getDesignCssFilter)
            ? window.LuxuryArt.getDesignCssFilter(opt.id)
            : '';

        const lvlMultiplier = 1 + (nextLvl - 2) * 0.55;
        const boostedIncome = Math.round(opt.incomeBoost * lvlMultiplier);
        const boostedRep = Math.round(opt.repBoost * lvlMultiplier);

        modalContent.innerHTML = `
            <div class="reno-card-header">
                <div class="header-left">
                    <span class="reno-badge">${def.area} · Seviye ${curLvl} ➔ Seviye ${nextLvl}</span>
                    <h3 class="reno-title">${def.name}</h3>
                </div>
                <button class="reno-close-btn" onclick="hotel3D.cancelPreviewAndClose()">&times;</button>
            </div>

            <div class="reno-lv-stepper">${levelStepsHtml}</div>

            <div class="design-tabs-row">
                ${optionsTabsHtml}
            </div>

            <div class="design-detail-card">
                <div class="design-visual-preview-wrap">
                    <img src="${previewImgSrc}" alt="${opt.name}" class="design-visual-preview-img" style="filter: ${cssFilter};" />
                    <span class="design-preview-badge">${canAfford ? '🔓' : '👁️'} ${optionStyleLabels[this.selectedOptionIndex]}</span>
                </div>

                <div class="design-head-row">
                    <div class="design-title-box">
                        <span class="opt-badge">${optionStyleLabels[this.selectedOptionIndex]}</span>
                        <h4>${opt.name}</h4>
                    </div>
                    <div class="design-price-tag">
                        <span>💰 ${isMaxLevel ? 'KURULU' : '$' + cost}</span>
                        <span class="star-pill">⭐ ${starsNeeded}</span>
                    </div>
                </div>

                <p class="design-desc">${opt.desc}</p>

                <div class="design-stats-strip">
                    <div class="stat-pill">
                        <label>Seviye ${nextLvl} Pasif Geliri</label>
                        <b class="positive">+$${boostedIncome}/dk</b>
                    </div>
                    <div class="stat-pill">
                        <label>Seviye ${nextLvl} Prestiji</label>
                        <b class="rep">+${boostedRep} Rep</b>
                    </div>
                </div>

                <div class="budget-breakdown-card">
                    <div class="budget-row">
                        <span>Seviye ${nextLvl} Yenileme Maliyeti:</span>
                        <b class="text-gold">💰 $${cost} &nbsp;|&nbsp; ⭐ ${starsNeeded} Yıldız</b>
                    </div>
                    <div class="budget-row">
                        <span>Mevcut Kasanız:</span>
                        <b>💰 $${balance} &nbsp;|&nbsp; ⭐ ${stars} Yıldız</b>
                    </div>
                    ${canAfford ? `
                        <div class="budget-sufficient-box">
                            <span>✅ ${isMaxLevel ? 'Maksimum Seviye (Lv.4) tamamlandı! Tasarımlar arasında ücretsiz geçiş yapabilirsiniz.' : `Bütçeniz Seviye ${nextLvl} yükseltmesi için yeterli! İşlem sonrası kalan: +$${balance - cost}`}</span>
                        </div>
                    ` : `
                        <div class="budget-deficit-box">
                            <span class="deficit-title">⏳ DURUM: BİRİKTİRİLİYOR (3 Tasarımı Yukarıdan Önizleyebilirsiniz)</span>
                            <div class="deficit-pills">
                                ${deficitCoins > 0 ? `<span class="def-tag coin">$${deficitCoins} daha gerekli</span>` : ''}
                                ${deficitStars > 0 ? `<span class="def-tag star">${deficitStars} ⭐ daha gerekli</span>` : ''}
                            </div>
                        </div>
                    `}
                </div>
            </div>

            <div class="reno-actions-footer">
                <button class="preview-3d-btn ${isPreviewing ? 'active-preview' : ''}" 
                    onclick="hotel3D.previewDesignInWorld('${opt.id}')">
                    👁️ Oda Sahnesinde Canlı Gör
                </button>

                ${canAfford ? `
                    <button class="purchase-confirm-btn btn-ready"
                        onclick="hotel3D.executePurchase('${id}', '${opt.id}')">
                        ${isMaxLevel
                            ? `🎨 Bu Tasarımı Uygula (Ücretsiz)`
                            : `🛠️ Seviye ${nextLvl}'e Yükselt & Uygula ($${cost})`}
                    </button>
                ` : `
                    <button class="purchase-confirm-btn btn-disabled" onclick="hotel3D.cancelPreviewAndClose(); window.switchMainPage && window.switchMainPage('pageBoard');">
                        🧩 Masada Sipariş Tamamla ($${deficitCoins} Eksik)
                    </button>
                `}
            </div>
        `;
    }

    executePurchase(id, optionId) {
        const def = this.renovationDefs[id];
        if (!def) return;
        const opt = def.options.find(o => o.id === optionId) || def.options[0];
        if (!opt) return;

        const curLvl = this.getAreaLevel(id);
        const isMaxLevel = (curLvl >= 4);
        const nextLvl = Math.min(4, curLvl + 1);
        const costCoins = isMaxLevel ? 0 : this.getNextUpgradeCost(id);
        const costStars = isMaxLevel ? 0 : this.getNextUpgradeStars(id);

        if (!isMaxLevel) {
            if (window.GameEconomy) {
                const res = window.GameEconomy.purchaseRenovation(
                    id,
                    optionId,
                    costCoins,
                    costStars,
                    `${def.name} (Seviye ${nextLvl}: ${opt.name})`
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
        }

        // Advance ONLY this area's level (1 -> 2 -> 3 -> 4)
        this.state.renovations[id] = { optionId: optionId, level: nextLvl };
        this.previewingRenovation = null;

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.cancelPreviewAndClose();
        this.closeBottomDesignDock();

        this.walkCharacterTo(def.pinX, Math.min(84, def.pinY + 14), `Harika! ${def.name} (${opt.name}) Seviye ${nextLvl} olarak odaya kuruldu!`);
        this.renderStage();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        const nextUpgradeMsg = nextLvl < 4
            ? `Sonraki Seviye (Lv.${nextLvl + 1}) Kilidi Açıldı!`
            : `👑 Maksimum Seviye (Lv.4 Kraliyet Lüksü) Tamamlandı!`;
        this.showBanner(`🎉 ${def.name} Seviye ${nextLvl} (${opt.name}) Tamamlandı! ${nextUpgradeMsg}`);
    }

    // ----------------------------------------------------
    // VISUAL HOTEL AREA SHOWCASE CARDS (#hotelAreasVisualGrid)
    // ----------------------------------------------------
    renderHotelAreaCards() {
        const grid = document.getElementById('hotelAreasVisualGrid');
        if (!grid || !this.renovationDefs) return;

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const targetId = window.GameEconomy ? window.GameEconomy.getTargetRenovation() : 'restaurant_tables';

        let cardsHtml = '';
        Object.keys(this.renovationDefs).forEach((id) => {
            const def = this.renovationDefs[id];
            const curLvl = this.getAreaLevel(id);
            const isMax = (curLvl >= 4);
            const nextLvl = Math.min(4, curLvl + 1);
            const cost = this.getNextUpgradeCost(id);
            const starsNeeded = this.getNextUpgradeStars(id);
            const stillNeeded = Math.max(0, cost - balance);
            const canAfford = isMax || (balance >= cost && stars >= starsNeeded);
            const isTarget = (id === targetId);

            const installed = this.getInstalledOption(id);
            const installedOpt = installed ? (def.options.find(o => o.id === installed.optionId) || def.options[0]) : null;
            const conditionText = installedOpt
                ? `Seviye ${curLvl}: ${installedOpt.name} (${installedOpt.style})`
                : (def.defaultDesc || 'Seviye 1: Başlangıç Durumu');

            const statusClass = isMax ? 'badge-max' : (canAfford ? 'badge-ready' : 'badge-saving');
            const statusLabel = isMax
                ? '👑 SEVİYE 4 (MAKSİMUM)'
                : (canAfford ? `🟢 BÜTÇE HAZIR (Lv.${nextLvl})` : `⏳ $${stillNeeded} EKSİK`);

            let lvDots = '';
            for (let l = 1; l <= 4; l++) {
                lvDots += `<span class="area-lv-segment ${l <= curLvl ? 'filled' : ''}">Lv.${l}</span>`;
            }

            cardsHtml += `
                <div class="hotel-visual-area-card ${curLvl > 1 ? 'area-upgraded' : ''} ${isTarget ? 'area-target' : ''}">
                    <div class="hotel-area-img-box" style="background-image: url('${def.sceneImg || 'assets/scene_lobby_reception.jpg'}')"
                         onclick="hotel3D.goToAndOpenRenovation('${id}')">
                        <div class="hotel-area-top-badges">
                            <span class="hotel-area-cat">${def.area}</span>
                            <span class="hotel-area-status ${statusClass}">${statusLabel}</span>
                        </div>
                        <div class="hotel-area-bottom-overlay">
                            <h4>${def.name}</h4>
                            <div class="area-lv-bar">${lvDots}</div>
                        </div>
                    </div>

                    <div class="hotel-area-body">
                        <div class="area-cond-line">
                            <small>Mevcut Durum:</small>
                            <b>${conditionText}</b>
                        </div>

                        <div class="area-cost-metrics">
                            <div class="area-metric">
                                <span>${isMax ? 'Durum' : `Seviye ${nextLvl} Maliyeti`}</span>
                                <b class="text-gold">${isMax ? 'TAMAMLANDI' : '$' + cost}</b>
                            </div>
                            <div class="area-metric">
                                <span>Mevcut Kasa</span>
                                <b>$${balance}</b>
                            </div>
                            <div class="area-metric">
                                <span>${canAfford ? '3 Tasarım' : 'Gereken Para'}</span>
                                <b class="${canAfford ? 'text-green' : 'text-warn'}">${canAfford ? '🔓 AÇIK' : '-$' + stillNeeded}</b>
                            </div>
                        </div>

                        <div class="area-card-actions">
                            <button class="area-walk-btn" onclick="hotel3D.walkToArea('${id}')">
                                📍 Odaya Git &amp; Sahnede Gör
                            </button>
                            <button class="area-reno-btn ${canAfford ? 'unlocked' : 'locked'}" onclick="hotel3D.goToAndOpenRenovation('${id}')">
                                ${isMax
                                    ? '🎨 Tasarım Değiştir'
                                    : (canAfford ? `✨ 3 Tasarımı Dene (Lv.${nextLvl})` : `🔒 Maliyet &amp; Önizleme ($${cost})`)}
                            </button>
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
        this.walkCharacterTo(Math.max(18, Math.min(82, def.pinX - 18)), Math.min(84, def.pinY + 14), `${def.name} (${def.area}) yanındayız. 3 lüks tasarımı alt çubuktan seçebilirsin!`);
        this.focusCameraOnPin(def.pinX, def.pinY);
        this.openBottomDesignDock(id, true);
        this.updateProximityPanel();
        this.showBanner(`📍 ${def.name} (${def.area}) sahnesine geçildi.`);
    }

    // ----------------------------------------------------
    // PROJECT PLAN & BUDGET OVERVIEW MODAL
    // ----------------------------------------------------
    openProjectPlanModal() {
        let modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        const allIds = Object.keys(this.renovationDefs);
        const totalMaxLevels = allIds.length * 3;
        let completedUpgrades = 0;
        allIds.forEach(id => {
            completedUpgrades += Math.max(0, this.getAreaLevel(id) - 1);
        });
        const progressPct = Math.round((completedUpgrades / totalMaxLevels) * 100);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const targetId = window.GameEconomy ? window.GameEconomy.getTargetRenovation() : 'restaurant_tables';

        let listHtml = '';
        allIds.forEach((id, idx) => {
            const def = this.renovationDefs[id];
            const curLvl = this.getAreaLevel(id);
            const isMax = (curLvl >= 4);
            const nextLvl = Math.min(4, curLvl + 1);
            const installed = this.getInstalledOption(id);
            const isTarget = (id === targetId);

            const cost = this.getNextUpgradeCost(id);
            const starsNeeded = this.getNextUpgradeStars(id);
            const canAfford = isMax || (balance >= cost && stars >= starsNeeded);
            const defCoins = Math.max(0, cost - balance);

            let statusClass = 'waiting';
            let statusText = `🔒 $${defCoins} Eksik (BİRİKTİRİLİYOR)`;
            let currentCondition = def.defaultDesc || 'Seviye 1: Başlangıç Durumu';

            if (installed) {
                const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
                currentCondition = `Seviye ${curLvl}: ${opt.name} (${opt.style})`;
            }

            if (isMax) {
                statusClass = 'done';
                statusText = `👑 SEVİYE 4 TAMAMLANDI (MAX)`;
            } else if (canAfford) {
                statusClass = 'ready';
                statusText = `🟢 BÜTÇE HAZIR! (Lv.${nextLvl}: $${cost})`;
            }

            listHtml += `
                <div class="proj-area-row ${isMax ? 'done-row' : ''} ${isTarget ? 'target-row' : ''}">
                    <div class="proj-area-info">
                        <div class="proj-row-header">
                            <span class="proj-stage">ALAN ${idx + 1} · ${def.area} · [Seviye ${curLvl}/4]</span>
                            <span class="proj-badge ${statusClass}">${statusText}</span>
                        </div>
                        <h4>${def.name}</h4>
                        <div class="proj-condition-line">
                            <small>Mevcut Durum: <b>${currentCondition}</b></small>
                        </div>
                        <div class="proj-fin-calc-line">
                            <span>${isMax ? 'Sonraki Seviye: <b>MAX</b>' : `Seviye ${nextLvl} Maliyeti: <b>$${cost}</b>`}</span> &nbsp;•&nbsp; 
                            <span>Kasa: <b>$${balance}</b></span> &nbsp;•&nbsp; 
                            <span class="${canAfford ? 'text-green' : 'text-warn'}">${isMax ? '👑 Tamamlandı' : (canAfford ? '🔓 3 Tasarım Açık!' : `Eksik: -$${defCoins}`)}</span>
                        </div>
                    </div>
                    <div class="proj-row-actions">
                        <button class="proj-target-btn ${isTarget ? 'active-target' : ''}" 
                            onclick="hotel3D.setTargetRenovation('${id}'); hotel3D.openProjectPlanModal();">
                            ${isTarget ? '🎯 Hedef' : '🎯 Hedef Yap'}
                        </button>
                        <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.goToAndOpenRenovation('${id}')">
                            ${isMax ? '🎨 Tasarım Değiştir' : (canAfford ? `🛠️ Lv.${nextLvl} Tasarla ➔` : '📍 Sahnede Gör & İncele ➔')}
                        </button>
                    </div>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div class="proj-title-box">
                        <span class="proj-crest">✦ AURELIA PALACE 4-SEVİYELİ RESTORASYON &amp; MALİYET DEFTERİ</span>
                        <h3>Tüm Otel Alanları ve Seviye Maliyetleri (Lv.1 ➔ Lv.4)</h3>
                    </div>
                    <button class="reno-close-btn" onclick="document.getElementById('projectPlanModal').style.display='none'">&times;</button>
                </div>

                <div class="proj-summary-strip">
                    <div class="proj-sum-item">
                        <label>Toplam Seviye İlerlemesi</label>
                        <b>%${progressPct} (${completedUpgrades}/${totalMaxLevels} Yükseltme)</b>
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
            tag.innerText = '🗺️ Aurelia Palace — İzometrik Otel Haritası';
            return;
        }
        const rm = this.rooms[this.currentRoom] || this.rooms.lobby;
        tag.innerText = `📍 ${rm.name}`;
    }

    updateProximityPanel() {
        const proxPanel = document.getElementById('renovationProximityPanel');
        if (!proxPanel) return;

        const id = this.selectedAreaId || 'reception_desk';
        const def = this.renovationDefs[id];
        if (!def) {
            proxPanel.style.display = 'none';
            return;
        }

        const curLvl = this.getAreaLevel(id);
        const isMax = (curLvl >= 4);
        const nextLvl = Math.min(4, curLvl + 1);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const installed = this.getInstalledOption(id);
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const canAfford = isMax || (balance >= cost && stars >= starsNeeded);

        let statusClass = 'status-saving';
        let statusText = 'BİRİKTİRİLİYOR';
        let currentCondition = def.defaultDesc || 'Seviye 1: Başlangıç Durumu';

        if (installed) {
            const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
            currentCondition = `Seviye ${curLvl}: ${opt.name} (${opt.style})`;
        }

        if (isMax) {
            statusClass = 'status-completed';
            statusText = 'SEVİYE 4 (MAKSİMUM)';
        } else if (canAfford) {
            statusClass = 'status-ready';
            statusText = `SEVİYE ${nextLvl} HAZIR!`;
        }

        const stillNeeded = Math.max(0, cost - balance);
        const remainingAfter = Math.max(0, balance - cost);
        const chosenOpt = def.options[this.selectedOptionIndex] || def.options[0];
        const styleNames = ['1. Modern Zarafet', '2. Kraliyet Kadife', '3. Akdeniz Riviera'];

        let inlineOptionsHtml = '';
        def.options.forEach((opt, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            let thumbSrc = def.sceneImg || 'assets/scene_lobby_reception.jpg';
            try {
                if (window.LuxuryArt && window.LuxuryArt.getDesignPreview) {
                    thumbSrc = window.LuxuryArt.getDesignPreview(id, opt.id, nextLvl) || thumbSrc;
                }
            } catch (e) {}
            const cssFilter = (window.LuxuryArt && window.LuxuryArt.getDesignCssFilter)
                ? window.LuxuryArt.getDesignCssFilter(opt.id)
                : '';

            inlineOptionsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}'); filter: ${cssFilter};">
                        <span class="gh-dock-opt-num">${styleNames[idx]}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ SEÇİLİ</span>' : '<span class="gh-dock-lock-tag">👁️ Dene</span>'}
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
                    <span class="prox-area-badge">${def.area} · Seviye ${curLvl}/4</span>
                    <span class="prox-status-badge ${statusClass}">${statusText}</span>
                </div>
                <h3 class="prox-title">${def.name.toUpperCase()}</h3>
                <div class="prox-condition-row">
                    <span class="prox-cond-label">Mevcut Durum:</span>
                    <b class="prox-cond-val">${currentCondition}</b>
                </div>
                
                <div class="prox-fin-grid">
                    <div class="prox-fin-box">
                        <label>${isMax ? 'Durum' : `Seviye ${nextLvl} Maliyeti`}</label>
                        <b class="prox-cost">${isMax ? 'MAX' : '$' + cost}</b>
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

                <!-- 3 Tasarım Seçeneği Doğrudan Burada da Görünür ve Tıklanabilir -->
                <div class="gh-dock-options-grid" style="margin: 10px 0;">
                    ${inlineOptionsHtml}
                </div>
                
                <div class="prox-actions-row">
                    ${canAfford ? `
                        <button class="prox-btn-view-designs pulse" onclick="hotel3D.executePurchase('${def.id}', '${chosenOpt.id}')">
                            ✓ ${isMax ? 'Seçili Tasarımı Uygula (Ücretsiz)' : `Seçili Tasarımı Onayla & Seviye ${nextLvl}'e Yükselt ($${cost})`}
                        </button>
                    ` : `
                        <button class="prox-btn-locked" onclick="hotel3D.openRenovationModal('${def.id}')">
                            📋 Detaylı İncele ($${stillNeeded} eksik · Maliyet: $${cost})
                        </button>
                    `}
                    <button class="prox-btn-set-target" onclick="hotel3D.setTargetRenovation('${def.id}')">
                        🎯 Hedef Yap
                    </button>
                </div>
            </div>
        `;
        proxPanel.style.display = 'block';
    }

    setTargetRenovation(id) {
        if (window.GameEconomy) {
            window.GameEconomy.setTargetRenovation(id);
        }
        const name = this.renovationDefs[id] ? this.renovationDefs[id].name : id;
        this.showBanner(`🎯 Yeni Hedef Belirlendi: ${name}`);
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
        }, 3200);
    }

    jumpTo(roomKey, e) {
        if (e) e.stopPropagation();
        if (!this.rooms[roomKey]) return;

        this.isMapMode = false;
        this.currentRoom = roomKey;
        const rm = this.rooms[roomKey];
        this.selectedAreaId = rm.areas[0] || this.selectedAreaId;
        this.previewingRenovation = null;
        this.panX = 0;
        this.panY = 0;
        this.zoom = 1.0;

        this.playSound('door');
        this.characterPos = {
            x: 24,
            y: 78,
            walking: false,
            speech: `${rm.name} odasındayız! Alt çubuktan 3 lüks tasarımı canlı deneyebilirsin.`
        };

        document.querySelectorAll('.room-jump-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.room-jump-btn[onclick*="${roomKey}"]`);
        if (btn) btn.classList.add('active');

        this.openBottomDesignDock(this.selectedAreaId, false);
        this.renderStage();
        this.updateProximityPanel();
        this.showBanner(`📍 ${rm.name} sahnesine geçildi.`);
    }

    onResize() {
        this.renderStage();
        this.renderBottomDesignDock();
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
