// ========================================================
// VELVET SECRETS - 3D REALISTIC WALKABLE HOTEL SIMULATOR
// INTERACTIVE BUDGET, 3-DESIGN SELECTION & RENOVATION SYSTEM
// Powered by Three.js (r128) - Offline WebGL 2.0 Engine
// ========================================================

class Hotel3DSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('3D container not found:', containerId);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Player & Movement state
        this.player = {
            pos: new THREE.Vector3(0, 1.7, 8),
            rot: { yaw: 0, pitch: 0 },
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 5.5,
            radius: 0.45,
            currentFloor: 1,
            isMoving: false
        };

        // Input state
        this.keys = { forward: false, backward: false, left: false, right: false, run: false };
        this.touch = {
            joystickActive: false,
            joystickOrigin: { x: 0, y: 0 },
            joystickDelta: { x: 0, y: 0 },
            lookActive: false,
            lastLook: { x: 0, y: 0 }
        };

        // World Objects & Colliders
        this.colliders = [];
        this.interactivePoints = [];
        this.upgradeMeshes = {};
        this.particles = [];
        this.activeBeacon = null;
        this.previewingRenovation = null; // { id, optionId }

        // Track budget notifications already sent to avoid spam
        this.notifiedAffordable = {};

        // Sound helper (Web Audio)
        this.initAudio();

        // Textures cache
        this.textures = {};

        // Load Save State & Renovation Catalog
        this.initCatalog();
        this.loadSaveData();

        // Initialize 3D Engine
        this.initThree();
        this.buildHotelEnvironment();
        this.setupControls();
        this.setupMinimap();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        console.log("Hotel3DSimulator 3-Design Interactive System ready!");
    }

    // ----------------------------------------------------
    // RENOVATION CATALOG WITH 3 DISTINCT DESIGNS PER AREA
    // ----------------------------------------------------
    initCatalog() {
        this.renovationDefs = {
            reception_desk: {
                id: 'reception_desk',
                stage: 1,
                name: 'Lobi Resepsiyon Masası',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 1.2, -4),
                options: [
                    {
                        id: 'opt_a',
                        name: 'İskandinav Meşe (Minimalist)',
                        style: 'Modern Minimalist',
                        costCoins: 350,
                        costStars: 2,
                        incomeBoost: 25,
                        repBoost: 40,
                        desc: 'Açık renk doğal meşe lamelleri, yüzen cam üst tabla ve gizli beyaz LED aydınlatma hattı.',
                        icon: '🪵'
                    },
                    {
                        id: 'opt_b',
                        name: 'Nero Altın Mermer (Lüks Monako)',
                        style: 'Lüks Siyah & Altın',
                        costCoins: 650,
                        costStars: 4,
                        incomeBoost: 50,
                        repBoost: 80,
                        desc: 'Siyah İtalyan Nero Marquina mermeri, dikey fırçalanmış pirinç altın kaplama ve Aurelia armalı VIP terminal.',
                        icon: '✨'
                    },
                    {
                        id: 'opt_c',
                        name: 'Carrara Neoklasik (Kraliyet Mirası)',
                        style: 'Klasik Miras',
                        costCoins: 500,
                        costStars: 3,
                        incomeBoost: 38,
                        repBoost: 60,
                        desc: 'Beyaz damarlı Carrara mermeri, oyma altın varaklar, antika şamdanlar ve maun detaylar.',
                        icon: '🏛️'
                    }
                ]
            },

            lobby_carpet: {
                id: 'lobby_carpet',
                stage: 1,
                name: 'Giriş Protokol Halısı & Zemin',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 0.4, 2),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Geometrik Altın Şerit (Modern)',
                        style: 'Modern Minimalist',
                        costCoins: 400,
                        costStars: 2,
                        incomeBoost: 20,
                        repBoost: 45,
                        desc: 'Koyu antrasit zemin üzerinde altın sarısı modern zikzak çizgiler.',
                        icon: '📐'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Bordo Kadife (Klasik Saray)',
                        style: 'Lüks Klasik',
                        costCoins: 600,
                        costStars: 3,
                        incomeBoost: 35,
                        repBoost: 75,
                        desc: 'Derin yakut kırmızısı Fransız kadife zemin ve altın damask el dokuma bordürler.',
                        icon: '👑'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt Yeşili & Altın Varak (Monako VIP)',
                        style: 'Monako Elit',
                        costCoins: 750,
                        costStars: 4,
                        incomeBoost: 48,
                        repBoost: 95,
                        desc: 'Kraliyet zümrüt kadifesi üzerine işlenmiş altın sarısı hanedan motifleri.',
                        icon: '💎'
                    }
                ]
            },

            lobby_chandelier: {
                id: 'lobby_chandelier',
                stage: 2,
                name: 'Büyük Lobi Tavan Avizesi',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 3.8, -1),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Halka LED Halo (Modern Mimari)',
                        style: 'Modern Minimalist',
                        costCoins: 550,
                        costStars: 3,
                        incomeBoost: 35,
                        repBoost: 65,
                        desc: 'İç içe geçen 3 katmanlı asimetrik altın halka LED armatürler.',
                        icon: '⭕'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bohemya 12 Kollu Kristal Avize',
                        style: 'İmparatorluk Kristal',
                        costCoins: 850,
                        costStars: 5,
                        incomeBoost: 65,
                        repBoost: 120,
                        desc: '12 kollu elmas kesim Bohemya kristalleri ve altın mumluklarla tüm lobiye ışık saçar.',
                        icon: '✨'
                    },
                    {
                        id: 'opt_c',
                        name: 'Art Deco Altın Boru Avize',
                        style: 'Art Deco Lüks',
                        costCoins: 700,
                        costStars: 4,
                        incomeBoost: 50,
                        repBoost: 90,
                        desc: 'Buzlu cam tüpler ve fırçalanmış sarı pirinç sütunlardan oluşan görkemli geometri.',
                        icon: '🌟'
                    }
                ]
            },

            room101_bed: {
                id: 'room101_bed',
                stage: 3,
                name: 'Oda 101 Kraliyet Yatak Takımı',
                area: 'Deluxe Suit (Oda 101)',
                pos: new THREE.Vector3(-19, 1.2, -12),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Yüzen Meşe Platform Yatak',
                        style: 'Modern Minimalist',
                        costCoins: 700,
                        costStars: 4,
                        incomeBoost: 55,
                        repBoost: 90,
                        desc: 'Açık meşe ahşap gövde, duvara gömme LED abajurlar ve kar beyazı keten nevresim.',
                        icon: '🛏️'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Direkli Sayvanlı Yatak (Cibinlikli)',
                        style: 'Kraliyet Lüksü',
                        costCoins: 1100,
                        costStars: 6,
                        incomeBoost: 85,
                        repBoost: 150,
                        desc: 'Dört köşesinde altın pirinç sütunlar, dökümlü ipek tül cibinlik ve saten yorgan.',
                        icon: '👑'
                    },
                    {
                        id: 'opt_c',
                        name: 'Chesterfield Bordo Kadife Başlıklı Yatak',
                        style: 'Klasik Miras',
                        costCoins: 900,
                        costStars: 5,
                        incomeBoost: 70,
                        repBoost: 115,
                        desc: 'Tavana kadar uzanan el kapitone düğmeli bordo kadife yatak başlığı ve masif ceviz baza.',
                        icon: '🍷'
                    }
                ]
            },

            room101_decor: {
                id: 'room101_decor',
                stage: 3,
                name: 'Oda 101 Panoramik Teras Mobilyaları',
                area: 'Deluxe Suit (Oda 101)',
                pos: new THREE.Vector3(-21, 1.2, -6),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krom & Cam Minimalist Berjerler',
                        style: 'Modern Minimalist',
                        costCoins: 600,
                        costStars: 3,
                        incomeBoost: 45,
                        repBoost: 75,
                        desc: 'İnce çelik ayaklı gri kumaş berjerler ve yuvarlak cam sehpa.',
                        icon: '🪑'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Yeşili Kadife & Pirinç Sehpa',
                        style: 'Lüks VIP Salon',
                        costCoins: 950,
                        costStars: 5,
                        incomeBoost: 75,
                        repBoost: 130,
                        desc: 'Zümrüt kadife döşeme berjerler, pirinç iç içe sehpalar ve gümüş kovalı şampanya standı.',
                        icon: '🍾'
                    },
                    {
                        id: 'opt_c',
                        name: 'Riviera Bambu & Keten Teras Takımı',
                        style: 'Fransız Riviera',
                        costCoins: 750,
                        costStars: 4,
                        incomeBoost: 60,
                        repBoost: 95,
                        desc: 'El örgüsü doğal bambu koltuklar ve kalın krem keten minderler.',
                        icon: '☀️'
                    }
                ]
            },

            restaurant_bar: {
                id: 'restaurant_bar',
                stage: 4,
                name: 'Riviera Kokteyl & Şampanya Barı',
                area: 'Riviera Restoran',
                pos: new THREE.Vector3(20, 1.2, -6),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Arkadan Aydınlatmalı Amber Oniks Bar',
                        style: 'Modern Işıltılı',
                        costCoins: 850,
                        costStars: 5,
                        incomeBoost: 70,
                        repBoost: 110,
                        desc: 'Yarı saydam bal rengi oniks taşından tezgah ve minimalist siyah çelik bar tabureleri.',
                        icon: '🍸'
                    },
                    {
                        id: 'opt_b',
                        name: 'Beyaz Mermer & Pirinç Varaklı Kraliyet Barı',
                        style: 'Monako Elit',
                        costCoins: 1350,
                        costStars: 7,
                        incomeBoost: 115,
                        repBoost: 190,
                        desc: 'Kabartmalı pirinç gövde, beyaz mermer üst tabla ve aynalı altın içki vitrini.',
                        icon: '✨'
                    },
                    {
                        id: 'opt_c',
                        name: 'Klasik Maun Şarap & Puro Barı',
                        style: 'Klasik Miras',
                        costCoins: 1050,
                        costStars: 6,
                        incomeBoost: 90,
                        repBoost: 145,
                        desc: 'Koyu ceviz ve maun ağacından oyma vitrin, pirinç ayak basma borusu ve deri tabureler.',
                        icon: '🍷'
                    }
                ]
            },

            restaurant_tables: {
                id: 'restaurant_tables',
                stage: 4,
                name: 'Gourmet Yemek Salonu Masaları',
                area: 'Riviera Restoran',
                pos: new THREE.Vector3(18, 1.2, 3),
                options: [
                    {
                        id: 'opt_a',
                        name: 'İskandinav Açık Meşe Masalar',
                        style: 'Modern Minimalist',
                        costCoins: 750,
                        costStars: 4,
                        incomeBoost: 65,
                        repBoost: 100,
                        desc: 'Temiz yuvarlak meşe masalar ve ergonomik İskandinav ahşap sandalyeler.',
                        icon: '🍽️'
                    },
                    {
                        id: 'opt_b',
                        name: 'Nero Siyah Mermer & Altın Şamdanlı Masalar',
                        style: 'Lüks Siyah & Altın',
                        costCoins: 1250,
                        costStars: 7,
                        incomeBoost: 110,
                        repBoost: 180,
                        desc: 'Siyah mermer tablalar, altın döküm orta ayak, zümrüt kadife koltuklar ve kristal şamdanlar.',
                        icon: '🕯️'
                    },
                    {
                        id: 'opt_c',
                        name: 'Koyu Ceviz & Bordo Kadife Masalar',
                        style: 'Klasik Miras',
                        costCoins: 950,
                        costStars: 5,
                        incomeBoost: 80,
                        repBoost: 130,
                        desc: 'Koyu ceviz ziyafet masaları, beyaz keten örtüler ve bordo kapitone sandalyeler.',
                        icon: '🌹'
                    }
                ]
            },

            swimming_pool: {
                id: 'swimming_pool',
                stage: 5,
                name: 'Aurelia Sonsuzluk Havuzu & Şezlonglar',
                area: 'Açık Güneş Terası',
                pos: new THREE.Vector3(0, 1.0, -22),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Kristal Cam Kenarlı Sonsuzluk Havuzu',
                        style: 'Modern Minimalist',
                        costCoins: 1200,
                        costStars: 6,
                        incomeBoost: 100,
                        repBoost: 160,
                        desc: 'Kenarsız şeffaf cam korkuluk, açık mavi su ve tik ağacından güneşlenme şezlongları.',
                        icon: '🌊'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Mozaikli Monako Saray Havuzu',
                        style: 'Kraliyet Lüksü',
                        costCoins: 1900,
                        costStars: 10,
                        incomeBoost: 175,
                        repBoost: 280,
                        desc: 'Tabanı 24 ayar altın yaldızlı mozaik, su altı altın ışıklandırma ve özel lüks kabanalar.',
                        icon: '🏖️'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Doğal Taş Lagün Havuzu',
                        style: 'Akdeniz Riviera',
                        costCoins: 1500,
                        costStars: 8,
                        incomeBoost: 130,
                        repBoost: 210,
                        desc: 'Doğal kireçtaşı kaplama, turkuaz termal su, hurma palmiyeleri ve çizgili şezlonglar.',
                        icon: '🌴'
                    }
                ]
            },

            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                stage: 5,
                name: 'Zen Termal Jakuzi & Masaj Alanı',
                area: 'Aurelia Spa & Sağlık',
                pos: new THREE.Vector3(18, 1.2, -22),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Sedir Ağacı Japon Onsen Jakuzisi',
                        style: 'Zen Minimalist',
                        costCoins: 1100,
                        costStars: 6,
                        incomeBoost: 95,
                        repBoost: 150,
                        desc: 'Doğal Japon sedir ağacından yuvarlak fıçı jakuzi ve nehir taşları bordürü.',
                        icon: '♨️'
                    },
                    {
                        id: 'opt_b',
                        name: 'Mermer Hidroterapi Termal Jakuzi',
                        style: 'Lüks Termal',
                        costCoins: 1750,
                        costStars: 9,
                        incomeBoost: 160,
                        repBoost: 250,
                        desc: 'Gömme Carrara mermeri, krom masaj jetleri ve su altı renk terapi aydınlatması.',
                        icon: '💎'
                    },
                    {
                        id: 'opt_c',
                        name: 'Roma Mozaikli Sıcak Hamam Jakuzisi',
                        style: 'Klasik Miras',
                        costCoins: 1400,
                        costStars: 7,
                        incomeBoost: 120,
                        repBoost: 195,
                        desc: 'Kemerli taş kubbe, aslan başlı çeşmeler ve sıcak buhar jeneratörü.',
                        icon: '🏛️'
                    }
                ]
            },

            garden_courtyard: {
                id: 'garden_courtyard',
                stage: 5,
                name: 'Akdeniz Botanik Bahçesi & Mermer Çeşme',
                area: 'Bahçe & Açık Alanlar',
                pos: new THREE.Vector3(-12, 1.0, -22),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Modern Zen Su Aynası & Bambu Bahçe',
                        style: 'Modern Elegance',
                        costCoins: 3000,
                        costStars: 4,
                        incomeBoost: 110,
                        repBoost: 170,
                        desc: 'Siyah bazalt yansıma havuzu, minimalist su fıskiyesi ve aydınlatmalı bambu yürüyüş yolu.',
                        icon: '🎋'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Gül Bahçesi & Altın Varaklı Çeşme',
                        style: 'Velvet Luxury',
                        costCoins: 3000,
                        costStars: 4,
                        incomeBoost: 145,
                        repBoost: 240,
                        desc: 'Üç katlı altın varaklı mermer çeşme, kırmızı kadife güller ve kristal bahçe fenerleri.',
                        icon: '🌹'
                    },
                    {
                        id: 'opt_c',
                        name: 'Riviera Limon & Begonvil Avlusu',
                        style: 'Mediterranean Suite',
                        costCoins: 3000,
                        costStars: 4,
                        incomeBoost: 125,
                        repBoost: 205,
                        desc: 'Klasik Akdeniz taş çeşmesi, terrakota saksılarda limon ağaçları ve mor begonvil kemerleri.',
                        icon: '🍋'
                    }
                ]
            },

            penthouse_suite: {
                id: 'penthouse_suite',
                stage: 6,
                name: '2. Kat Kraliyet Penthouse & Piyano Salonu',
                area: 'Başkanlık Çatı Suiti',
                pos: new THREE.Vector3(0, 7.2, 0),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Panoramik Şömineli Beyaz Kuyruklu Piyano Salonu',
                        style: 'Modern Elegance',
                        costCoins: 2100,
                        costStars: 12,
                        incomeBoost: 220,
                        repBoost: 350,
                        desc: 'Parlak beyaz lake kuyruklu piyano, bioetanol şömine ve alçak deri köşe salonu.',
                        icon: '🎹'
                    },
                    {
                        id: 'opt_b',
                        name: 'Monako 5 Yıldızlı Altın & Noir Çatı Suiti',
                        style: 'Velvet Luxury',
                        costCoins: 2800,
                        costStars: 15,
                        incomeBoost: 320,
                        repBoost: 500,
                        desc: 'Altın varaklı Steinway piyano, dairesel altın kadife sohbet çukuru ve 360 derece Riviera balkonu.',
                        icon: '👑'
                    },
                    {
                        id: 'opt_c',
                        name: 'Venedik Sarayı Barok Penthouse',
                        style: 'Mediterranean Suite',
                        costCoins: 2400,
                        costStars: 13,
                        incomeBoost: 260,
                        repBoost: 410,
                        desc: 'Oyma maun piyano, İtalyan damask kadife koltuklar ve altın yaldızlı şömine aynası.',
                        icon: '🎭'
                    }
                ]
            }
        };

        // Harmonize with authoritative GameEconomy definitions
        if (window.GameEconomy && window.GameEconomy.renovationCosts) {
            Object.keys(this.renovationDefs).forEach(k => {
                const econDef = window.GameEconomy.renovationCosts[k];
                if (econDef) {
                    this.renovationDefs[k].cost = econDef.cost;
                    this.renovationDefs[k].levelCosts = econDef.levelCosts || {
                        2: econDef.cost,
                        3: Math.round(econDef.cost * 1.6),
                        4: Math.round(econDef.cost * 2.4)
                    };
                    this.renovationDefs[k].stars = econDef.stars;
                    this.renovationDefs[k].defaultDesc = econDef.defaultDesc;
                    this.renovationDefs[k].name = econDef.name;
                    this.renovationDefs[k].area = econDef.area;
                    this.renovationDefs[k].sceneImg = econDef.sceneImg || 'assets/scene_lobby_reception.jpg';
                    this.renovationDefs[k].jumpRoom = econDef.jumpRoom || 'lobby';
                }
            });
        }
    }

    // ----------------------------------------------------
    // INDEPENDENT 4-LEVEL AREA PROGRESSION HELPERS
    // Level 1: Basic (Unrenovated) -> Level 2: Modern -> Level 3: Premium -> Level 4: Luxury Suite
    // ----------------------------------------------------
    getAreaLevel(id) {
        const saved = this.state && this.state.renovations ? this.state.renovations[id] : null;
        if (!saved) return 1;
        if (typeof saved === 'object' && typeof saved.level === 'number') {
            return Math.max(1, Math.min(4, saved.level));
        }
        return 2; // Legacy renovated items are at least Level 2
    }

    getLevelTitle(lvl) {
        const titles = {
            1: 'Seviye 1: Başlangıç Durumu',
            2: 'Seviye 2: Modern Yenileme',
            3: 'Seviye 3: Premium Tasarım',
            4: 'Seviye 4: Kraliyet Lüksü (MAX)'
        };
        return titles[lvl] || `Seviye ${lvl}`;
    }

    getNextUpgradeCost(id) {
        const def = this.renovationDefs[id];
        if (!def) return 1200;
        const curLvl = this.getAreaLevel(id);
        const nextLvl = Math.min(4, curLvl + 1);
        if (def.levelCosts && def.levelCosts[nextLvl]) {
            return def.levelCosts[nextLvl];
        }
        const base = def.cost || 1200;
        if (nextLvl === 2) return base;
        if (nextLvl === 3) return Math.round(base * 1.6);
        return Math.round(base * 2.4);
    }

    getNextUpgradeStars(id) {
        const def = this.renovationDefs[id];
        if (!def) return 2;
        const curLvl = this.getAreaLevel(id);
        return (def.stars || 2) + Math.max(0, curLvl - 1);
    }

    // ----------------------------------------------------
    // SAVE DATA & ECONOMY
    // ----------------------------------------------------
    loadSaveData() {
        const saved = localStorage.getItem('velvet_hotel_3d_state_v2');
        const defaultState = {
            coins: 750,
            stars: 6,
            prestige: 50,
            reputation: 250,
            hotelStars: 1,
            uncollectedIncome: 0,
            incomePerMin: 45,
            lastIncomeTick: Date.now(),
            currentStage: 1,
            // Maps renovationId -> { optionId: 'opt_b', level: 2..4 } or null (Level 1)
            renovations: {}
        };

        if (saved) {
            try {
                this.state = Object.assign(defaultState, JSON.parse(saved));
                if (this.state.renovations) {
                    Object.keys(this.state.renovations).forEach(k => {
                        const r = this.state.renovations[k];
                        if (r && typeof r === 'object' && r.level === 1 && r.optionId) {
                            // Migrate legacy level:1 installed object to Level 2 (since Level 1 is Basic/Unrenovated)
                            r.level = 2;
                        }
                    });
                }
            } catch (e) {
                this.state = defaultState;
            }
        } else {
            const legacy = localStorage.getItem('velvet_hotel_3d_state');
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    this.state = Object.assign(defaultState, parsed);
                    if (parsed.renovations) {
                        this.state.renovations = {};
                        Object.keys(parsed.renovations).forEach(k => {
                            if (parsed.renovations[k] > 0) {
                                this.state.renovations[k] = { optionId: 'opt_b', level: 2 };
                            }
                        });
                    }
                } catch (e) {
                    this.state = defaultState;
                }
            } else {
                this.state = defaultState;
            }
        }

        // Authoritative synchronization with window.GameEconomy
        if (window.GameEconomy) {
            this.state.coins = window.GameEconomy.getBalance();
            this.state.stars = window.GameEconomy.getStars();
            window.GameEconomy.subscribe((econ) => {
                this.state.coins = econ.getBalance();
                this.state.stars = econ.getStars();
                this.updateHUD();
                this.updateProximityPanel();
                this.renderHotelAreaCards();
            });
        }

        this.recalcHotelStats();
        setTimeout(() => this.renderHotelAreaCards(), 50);
    }

    saveState() {
        localStorage.setItem('velvet_hotel_3d_state_v2', JSON.stringify(this.state));
        this.updateHUD();
        this.renderHotelAreaCards();
    }

    recalcHotelStats() {
        let baseIncome = 45;
        let baseRep = 200;
        let totalLevelsGained = 0;

        Object.keys(this.state.renovations).forEach(id => {
            const reno = this.state.renovations[id];
            if (reno && reno.optionId) {
                const lvl = Math.max(2, reno.level || 2);
                const lvlMultiplier = 1 + (lvl - 2) * 0.55; // Lv2=1x, Lv3=1.55x, Lv4=2.1x
                totalLevelsGained += (lvl - 1);
                const def = this.renovationDefs[id];
                if (def) {
                    const opt = def.options.find(o => o.id === reno.optionId) || def.options[0];
                    if (opt) {
                        baseIncome += Math.round(opt.incomeBoost * lvlMultiplier);
                        baseRep += Math.round(opt.repBoost * lvlMultiplier);
                    }
                }
            }
        });

        this.state.incomePerMin = baseIncome;
        this.state.reputation = baseRep;

        if (totalLevelsGained >= 16) this.state.hotelStars = 5;
        else if (totalLevelsGained >= 10) this.state.hotelStars = 4;
        else if (totalLevelsGained >= 5) this.state.hotelStars = 3;
        else if (totalLevelsGained >= 2) this.state.hotelStars = 2;
        else this.state.hotelStars = 1;
    }

    // ----------------------------------------------------
    // WEB AUDIO SOUND EFFECTS
    // ----------------------------------------------------
    initAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    playSound(type) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        if (type === 'step') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'renovate') {
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.12, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.6);
            });
        } else if (type === 'door') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
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
                osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                gain.gain.setValueAtTime(0.1, now + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.12);
                osc.stop(now + idx * 0.12 + 0.4);
            });
        }
    }

    // ----------------------------------------------------
    // THREE.JS SETUP & REALISTIC LIGHTING
    // ----------------------------------------------------
    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c14);
        this.scene.fog = new THREE.FogExp2(0x0e1322, 0.022);

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || 520;

        this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 150);
        this.camera.position.copy(this.player.pos);
        this.camera.rotation.order = 'YXZ';

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => this.onResize());

        // Ambient Warm Luxury Interior Bounce
        const ambientLight = new THREE.AmbientLight(0xffecd2, 0.55);
        this.scene.add(ambientLight);

        // Directional Sunlight (Sunset Mediterranean glow)
        const sun = new THREE.DirectionalLight(0xffb070, 1.1);
        sun.position.set(20, 25, 15);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 70;
        const d = 30;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        this.scene.add(sun);

        // Lobby Pointlight
        this.lobbyLight = new THREE.PointLight(0xffd599, 1.4, 22);
        this.lobbyLight.position.set(0, 4.2, -1);
        this.lobbyLight.castShadow = true;
        this.scene.add(this.lobbyLight);

        // Restaurant Light
        const restLight = new THREE.PointLight(0xffae55, 1.2, 20);
        restLight.position.set(20, 3.8, -2);
        this.scene.add(restLight);

        // Suite Light
        const suiteLight = new THREE.PointLight(0xffe2b8, 1.0, 18);
        suiteLight.position.set(-18, 3.5, -10);
        this.scene.add(suiteLight);

        // Outdoor Pool Light
        const poolLight = new THREE.PointLight(0x00f0ff, 1.5, 25);
        poolLight.position.set(0, 1.5, -22);
        this.scene.add(poolLight);
    }

    // ----------------------------------------------------
    // PROCEDURAL TEXTURE GENERATORS (6 DISTINCT MATERIALS)
    // ----------------------------------------------------
    getTexture(name) {
        if (this.textures[name]) return this.textures[name];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (name === 'carrara_marble') {
            // White Carrara marble with light grey/gold veins
            ctx.fillStyle = '#f4f4f7';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(160, 165, 180, 0.3)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 7; i++) {
                ctx.beginPath();
                let x = Math.random() * 512, y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 50;
                    y += Math.random() * 60;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                let x = Math.random() * 512, y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 40;
                    y += Math.random() * 80;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (name === 'nero_marble') {
            // Nero Marquina black marble with crisp white/gold lightning veins
            ctx.fillStyle = '#0d0f14';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2.5;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                let x = Math.random() * 512, y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 70;
                    y += Math.random() * 50;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
            ctx.lineWidth = 1.8;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                let x = Math.random() * 512, y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 60;
                    y += Math.random() * 60;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (name === 'light_nordic_oak') {
            // Pale Scandinavian blond oak wood
            ctx.fillStyle = '#d8b98b';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#c7a371';
            for (let y = 0; y < 512; y += 48) {
                for (let x = 0; x < 512; x += 128) {
                    ctx.fillRect(x + ((y / 48) % 2 === 0 ? 0 : 64), y, 126, 46);
                }
            }
            ctx.strokeStyle = '#a48050';
            ctx.lineWidth = 1.5;
            for (let y = 0; y < 512; y += 48) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }
        } else if (name === 'dark_walnut') {
            // Rich espresso dark walnut wood
            ctx.fillStyle = '#3a2012';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#291409';
            for (let y = 0; y < 512; y += 64) {
                for (let x = 0; x < 512; x += 128) {
                    ctx.fillRect(x + ((y / 64) % 2 === 0 ? 0 : 64), y, 126, 62);
                }
            }
            ctx.strokeStyle = '#180a04';
            ctx.lineWidth = 2;
            for (let y = 0; y < 512; y += 64) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }
        } else if (name === 'velvet_carpet') {
            // Royal crimson red with golden borders
            ctx.fillStyle = '#7a0c1a';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 14;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.lineWidth = 4;
            ctx.strokeRect(40, 40, 432, 432);
        } else if (name === 'emerald_velvet') {
            // Deep royal emerald green with damask gold pattern
            ctx.fillStyle = '#0f3824';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 12;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.lineWidth = 4;
            ctx.strokeRect(40, 40, 432, 432);
        } else if (name === 'pool_water') {
            const grad = ctx.createLinearGradient(0, 0, 512, 512);
            grad.addColorStop(0, '#00a8cc');
            grad.addColorStop(0.5, '#007b99');
            grad.addColorStop(1, '#005b73');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 512, Math.random() * 512, 40 + Math.random() * 80, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (name === 'gold_mosaic') {
            ctx.fillStyle = '#b8860b';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#ffd700';
            for (let y = 0; y < 512; y += 32) {
                for (let x = 0; x < 512; x += 32) {
                    if ((x + y) % 64 === 0) ctx.fillRect(x + 2, y + 2, 28, 28);
                }
            }
            ctx.strokeStyle = '#664d03';
            ctx.lineWidth = 2;
            for (let i = 0; i <= 512; i += 32) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.textures[name] = texture;
        return texture;
    }

    loadPhotoTexture(url) {
        if (this.textures[url]) return this.textures[url];
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        this.textures[url] = tex;
        return tex;
    }

    // ----------------------------------------------------
    // BUILD CONNECTED HOTEL ARCHITECTURE
    // ----------------------------------------------------
    buildHotelEnvironment() {
        const marbleTex = this.getTexture('carrara_marble');
        marbleTex.repeat.set(8, 8);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.6 });
        const parquetTex = this.getTexture('light_nordic_oak');
        parquetTex.repeat.set(6, 6);

        // 1. GRAND LOBBY FLOOR
        const lobbyFloorGeo = new THREE.PlaneGeometry(24, 20);
        const lobbyFloorMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.15, metalness: 0.1 });
        const lobbyFloor = new THREE.Mesh(lobbyFloorGeo, lobbyFloorMat);
        lobbyFloor.rotation.x = -Math.PI / 2;
        lobbyFloor.position.set(0, 0, 0);
        lobbyFloor.receiveShadow = true;
        this.scene.add(lobbyFloor);

        // CEILING
        const ceilingGeo = new THREE.PlaneGeometry(24, 20);
        const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x222530, roughness: 0.9 });
        const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.set(0, 5, 0);
        this.scene.add(ceiling);

        // LOBBY WALLS with doorways
        this.createWall(0, 2.5, 10, 24, 5, 0.4, null, true, [-3, 3]); // South main door
        this.createWall(0, 2.5, -10, 24, 5, 0.4, null, true, [-2, 2]); // North door to pool
        this.createWall(-12, 2.5, 0, 0.4, 5, 20, null, true, null, [-2, 2]); // West door to rooms
        this.createWall(12, 2.5, 0, 0.4, 5, 20, null, true, null, [-3, 3]); // East arch to restaurant

        // LOBBY COLUMNS
        [[-6, -4], [6, -4], [-6, 4], [6, 4]].forEach(pos => {
            this.createColumn(pos[0], pos[1]);
        });

        // 2. WEST WING: CORRIDOR & GUEST SUITE 101
        const corridorFloorGeo = new THREE.PlaneGeometry(16, 6);
        const corridorFloor = new THREE.Mesh(corridorFloorGeo, new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.3 }));
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(-20, 0, 0);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);

        this.createWall(-20, 2.25, 3, 16, 4.5, 0.3, null);
        this.createWall(-20, 2.25, -3, 16, 4.5, 0.3, null, true, [-20, -18]); // Door to 101

        // ROOM 101 (Deluxe Ocean Suite)
        const suiteFloorGeo = new THREE.PlaneGeometry(14, 15);
        const suiteFloor = new THREE.Mesh(suiteFloorGeo, new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.25 }));
        suiteFloor.rotation.x = -Math.PI / 2;
        suiteFloor.position.set(-21, 0, -10.5);
        suiteFloor.receiveShadow = true;
        this.scene.add(suiteFloor);

        this.createWall(-28, 2.25, -10.5, 0.3, 4.5, 15, null);
        this.createWall(-14, 2.25, -10.5, 0.3, 4.5, 15, null);
        this.createWall(-21, 2.25, -18, 14, 4.5, 0.3, null, true, [-24, -18]); // Balcony doors

        const oceanTex = this.loadPhotoTexture('assets/scene_presidential_suite.jpg');
        const oceanBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: oceanTex }));
        oceanBackdrop.position.set(-21, 2.5, -18.2);
        this.scene.add(oceanBackdrop);

        // 3. EAST WING: RIVIERA RESTAURANT & BAR
        const restFloorGeo = new THREE.PlaneGeometry(18, 20);
        const restFloorMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.2 });
        const restFloor = new THREE.Mesh(restFloorGeo, restFloorMat);
        restFloor.rotation.x = -Math.PI / 2;
        restFloor.position.set(21, 0, 0);
        restFloor.receiveShadow = true;
        this.scene.add(restFloor);

        this.createWall(30, 2.5, 0, 0.4, 5, 20, null);
        this.createWall(21, 2.5, 10, 18, 5, 0.4, null);
        this.createWall(21, 2.5, -10, 18, 5, 0.4, null);

        const galaTex = this.loadPhotoTexture('assets/scene_romance_gala.jpg');
        const galaMural = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.5), new THREE.MeshStandardMaterial({ map: galaTex }));
        galaMural.position.set(29.7, 2.5, 0);
        galaMural.rotation.y = -Math.PI / 2;
        this.scene.add(galaMural);

        // 4. OUTDOOR PROMENADE & SWIMMING POOL
        const poolTerraceGeo = new THREE.PlaneGeometry(42, 22);
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.6 });
        const poolTerrace = new THREE.Mesh(poolTerraceGeo, stoneMat);
        poolTerrace.rotation.x = -Math.PI / 2;
        poolTerrace.position.set(5, 0, -21);
        poolTerrace.receiveShadow = true;
        this.scene.add(poolTerrace);

        const poolBasinGeo = new THREE.BoxGeometry(16, 2, 8);
        const poolBasinMat = new THREE.MeshStandardMaterial({ color: 0x003344, roughness: 0.1 });
        const poolBasin = new THREE.Mesh(poolBasinGeo, poolBasinMat);
        poolBasin.position.set(0, -0.8, -22);
        this.scene.add(poolBasin);

        this.createWall(5, 0.6, -32, 42, 1.2, 0.4, null, false);
        this.createWall(-16, 0.6, -21, 0.4, 1.2, 22, null, false);
        this.createWall(26, 0.6, -21, 0.4, 1.2, 22, null, false);

        const exteriorTex = this.loadPhotoTexture('assets/scene_hotel_exterior.jpg');
        const extMural = new THREE.Mesh(new THREE.PlaneGeometry(35, 14), new THREE.MeshBasicMaterial({ map: exteriorTex }));
        extMural.position.set(5, 7, -35);
        this.scene.add(extMural);

        // 5. PENTHOUSE & ELEVATOR
        this.buildPenthouseFloor();
        this.buildStairsAndElevator();

        // 6. ARTWORKS
        this.buildArtGalleries();

        // 7. INITIAL RENOVATION MESHES
        this.rebuildAllRenovations();
    }

    createWall(x, y, z, width, height, depth, texture, hasOpening = false, openXRange = null, openZRange = null) {
        const mat = new THREE.MeshStandardMaterial({
            map: texture || null,
            color: texture ? 0xffffff : 0xedebe6,
            roughness: 0.7
        });

        if (!hasOpening) {
            const geo = new THREE.BoxGeometry(width, height, depth);
            const wall = new THREE.Mesh(geo, mat);
            wall.position.set(x, y, z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            this.scene.add(wall);

            this.colliders.push({
                minX: x - width / 2, maxX: x + width / 2,
                minZ: z - depth / 2, maxZ: z + depth / 2,
                minY: y - height / 2, maxY: y + height / 2
            });
        } else if (openXRange) {
            const leftW = Math.max(0, openXRange[0] - (x - width / 2));
            const rightW = Math.max(0, (x + width / 2) - openXRange[1]);

            if (leftW > 0.1) {
                const lx = (x - width / 2) + leftW / 2;
                const lWall = new THREE.Mesh(new THREE.BoxGeometry(leftW, height, depth), mat);
                lWall.position.set(lx, y, z);
                this.scene.add(lWall);
                this.colliders.push({
                    minX: lx - leftW / 2, maxX: lx + leftW / 2,
                    minZ: z - depth / 2, maxZ: z + depth / 2,
                    minY: y - height / 2, maxY: y + height / 2
                });
            }
            if (rightW > 0.1) {
                const rx = openXRange[1] + rightW / 2;
                const rWall = new THREE.Mesh(new THREE.BoxGeometry(rightW, height, depth), mat);
                rWall.position.set(rx, y, z);
                this.scene.add(rWall);
                this.colliders.push({
                    minX: rx - rightW / 2, maxX: rx + rightW / 2,
                    minZ: z - depth / 2, maxZ: z + depth / 2,
                    minY: y - height / 2, maxY: y + height / 2
                });
            }
        } else if (openZRange) {
            const topD = Math.max(0, openZRange[0] - (z - depth / 2));
            const botD = Math.max(0, (z + depth / 2) - openZRange[1]);

            if (topD > 0.1) {
                const tz = (z - depth / 2) + topD / 2;
                const tWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, topD), mat);
                tWall.position.set(x, y, tz);
                this.scene.add(tWall);
                this.colliders.push({
                    minX: x - width / 2, maxX: x + width / 2,
                    minZ: tz - topD / 2, maxZ: tz + topD / 2,
                    minY: y - height / 2, maxY: y + height / 2
                });
            }
            if (botD > 0.1) {
                const bz = openZRange[1] + botD / 2;
                const bWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, botD), mat);
                bWall.position.set(x, y, bz);
                this.scene.add(bWall);
                this.colliders.push({
                    minX: x - width / 2, maxX: x + width / 2,
                    minZ: bz - botD / 2, maxZ: bz + botD / 2,
                    minY: y - height / 2, maxY: y + height / 2
                });
            }
        }
    }

    createColumn(x, z) {
        const marbleTex = this.getTexture('carrara_marble');
        const colGeo = new THREE.CylinderGeometry(0.4, 0.45, 5, 16);
        const colMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.2 });
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(x, 2.5, z);
        col.castShadow = true;
        this.scene.add(col);

        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
        const capGeo = new THREE.BoxGeometry(1.0, 0.25, 1.0);
        const capTop = new THREE.Mesh(capGeo, goldMat);
        capTop.position.set(x, 4.88, z);
        const capBot = new THREE.Mesh(capGeo, goldMat);
        capBot.position.set(x, 0.12, z);
        this.scene.add(capTop);
        this.scene.add(capBot);

        this.colliders.push({
            minX: x - 0.5, maxX: x + 0.5,
            minZ: z - 0.5, maxZ: z + 0.5,
            minY: 0, maxY: 5
        });
    }

    buildStairsAndElevator() {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.4 });

        const numSteps = 15;
        const stepWidth = 2.2;
        const totalHeight = 6.0;
        const totalDepth = 6.0;

        for (let i = 0; i < numSteps; i++) {
            const stepH = (totalHeight / numSteps);
            const stepD = (totalDepth / numSteps);
            const y = (i + 0.5) * stepH;
            const z = -8 + (i * stepD);
            const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepWidth, stepH, stepD + 0.05), woodMat);
            stepMesh.position.set(9.5, y, z);
            stepMesh.receiveShadow = true;
            this.scene.add(stepMesh);
        }

        const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.5);
        const rail = new THREE.Mesh(railGeo, goldMat);
        rail.position.set(8.3, 3.8, -5);
        rail.rotation.x = Math.PI / 4.2;
        this.scene.add(rail);

        const elevFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.3), goldMat);
        elevFrame.position.set(6, 1.6, -9.8);
        this.scene.add(elevFrame);

        const elevDoors = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.1), new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            metalness: 0.95,
            roughness: 0.1
        }));
        elevDoors.position.set(6, 1.5, -9.7);
        this.scene.add(elevDoors);

        this.createInteractivePoint('elevator_call', 'Asansör: Çatı Katına Çık', new THREE.Vector3(6, 1.5, -8.6), () => {
            this.toggleFloor();
        });
    }

    toggleFloor() {
        this.playSound('door');
        if (this.player.currentFloor === 1) {
            this.player.currentFloor = 2;
            this.player.pos.set(0, 7.7, 4);
            this.showBanner('🛗 Asansör: 2. Kat Başkanlık Suiti Açıldı!');
        } else {
            this.player.currentFloor = 1;
            this.player.pos.set(6, 1.7, -7);
            this.showBanner('🛗 Asansör: Zemin Kat Lobiye İndiniz.');
        }
    }

    buildPenthouseFloor() {
        const parquetTex = this.getTexture('light_nordic_oak');
        const pentFloorGeo = new THREE.PlaneGeometry(24, 24);
        const pentFloorMat = new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.2 });
        const pentFloor = new THREE.Mesh(pentFloorGeo, pentFloorMat);
        pentFloor.rotation.x = -Math.PI / 2;
        pentFloor.position.set(0, 6.0, 0);
        pentFloor.receiveShadow = true;
        this.scene.add(pentFloor);

        this.createWall(0, 6.6, 12, 24, 1.2, 0.2, null);
        this.createWall(-12, 6.6, 0, 0.2, 1.2, 24, null);
        this.createWall(12, 6.6, 0, 0.2, 1.2, 24, null);
        this.createWall(0, 8.5, -12, 24, 5.0, 0.3, null);
    }

    buildArtGalleries() {
        const characters = [
            { name: 'Isabella Laurent', file: 'assets/char_isabella.jpg', pos: new THREE.Vector3(-11.75, 2.5, -3), rotY: Math.PI / 2 },
            { name: 'Adrian Vale', file: 'assets/char_adrian.jpg', pos: new THREE.Vector3(-11.75, 2.5, 3), rotY: Math.PI / 2 },
            { name: 'Leon Marchand', file: 'assets/char_leon.jpg', pos: new THREE.Vector3(11.75, 2.5, -4), rotY: -Math.PI / 2 },
            { name: 'Serena Black', file: 'assets/char_serena.jpg', pos: new THREE.Vector3(11.75, 2.5, 4), rotY: -Math.PI / 2 }
        ];

        const goldFrameMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });

        characters.forEach(char => {
            const tex = this.loadPhotoTexture(char.file);
            const frameGroup = new THREE.Group();

            const border = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.08), goldFrameMat);
            const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), new THREE.MeshStandardMaterial({ map: tex }));
            canvas.position.z = 0.05;

            frameGroup.add(border);
            frameGroup.add(canvas);
            frameGroup.position.copy(char.pos);
            frameGroup.rotation.y = char.rotY;

            this.scene.add(frameGroup);
        });
    }

    // ----------------------------------------------------
    // DYNAMIC 3D RENOVATION BUILDERS (WITH 3 DISTINCT DESIGNS)
    // ----------------------------------------------------
    rebuildAllRenovations() {
        // Clear all previous dynamic meshes
        Object.keys(this.upgradeMeshes).forEach(key => {
            if (this.upgradeMeshes[key]) {
                this.scene.remove(this.upgradeMeshes[key]);
            }
        });
        this.upgradeMeshes = {};
        this.interactivePoints = [];

        Object.keys(this.renovationDefs).forEach(id => {
            const installed = this.getInstalledOption(id);
            this.buildObjectMesh(id, installed ? installed.optionId : null);
            this.addRenovationBeacon(id);
        });

        this.checkAffordableNotifications();
    }

    getInstalledOption(id) {
        if (this.previewingRenovation && this.previewingRenovation.id === id) {
            return {
                optionId: this.previewingRenovation.optionId,
                level: this.previewingRenovation.level || Math.min(4, this.getAreaLevel(id) + 1),
                isPreview: true
            };
        }
        const saved = this.state.renovations[id];
        if (!saved) return null;
        if (typeof saved === 'string') return { optionId: saved, level: 2, isPreview: false };
        if (typeof saved === 'object' && saved.optionId) {
            return { optionId: saved.optionId, level: Math.max(2, saved.level || 2), isPreview: false };
        }
        return { optionId: 'opt_b', level: 2, isPreview: false };
    }

    buildObjectMesh(id, optionId, levelOverride = null) {
        if (this.upgradeMeshes[id]) {
            this.scene.remove(this.upgradeMeshes[id]);
        }

        const installed = this.getInstalledOption(id);
        const activeLevel = levelOverride || (installed ? installed.level : 1);

        let meshGroup = null;
        switch (id) {
            case 'reception_desk': meshGroup = this.buildReceptionDesk3D(optionId); break;
            case 'lobby_carpet': meshGroup = this.buildLobbyCarpet3D(optionId); break;
            case 'lobby_chandelier': meshGroup = this.buildLobbyChandelier3D(optionId); break;
            case 'room101_bed': meshGroup = this.buildRoom101Bed3D(optionId); break;
            case 'room101_decor': meshGroup = this.buildRoom101Decor3D(optionId); break;
            case 'restaurant_bar': meshGroup = this.buildRestaurantBar3D(optionId); break;
            case 'restaurant_tables': meshGroup = this.buildRestaurantTables3D(optionId); break;
            case 'swimming_pool': meshGroup = this.buildSwimmingPool3D(optionId); break;
            case 'spa_jacuzzi': meshGroup = this.buildSpaJacuzzi3D(optionId); break;
            case 'garden_courtyard': meshGroup = this.buildGardenCourtyard3D(optionId); break;
            case 'penthouse_suite': meshGroup = this.buildPenthouseSuite3D(optionId); break;
        }

        if (meshGroup) {
            if (optionId && activeLevel >= 3) {
                this.applyLevelEnhancements3D(meshGroup, id, activeLevel);
            }
            this.upgradeMeshes[id] = meshGroup;
            this.scene.add(meshGroup);
        }
    }

    // Adds visible 3D architectural & luxury features at Level 3 (Premium) and Level 4 (Royal Luxury Suite)
    applyLevelEnhancements3D(group, id, level) {
        const def = this.renovationDefs[id];
        if (!def) return;
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.12 });
        const crystalMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.05 });

        // Level 3: Premium golden border trim & warm ambient spotlight
        if (level >= 3) {
            const haloRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.85, 32), new THREE.MeshBasicMaterial({
                color: 0xd4af37,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.55
            }));
            haloRing.rotation.x = -Math.PI / 2;
            haloRing.position.set(def.pos.x, (def.pos.y > 5 ? 6.03 : 0.03), def.pos.z);
            group.add(haloRing);

            const warmLight = new THREE.PointLight(0xffdf88, 0.9, 6);
            warmLight.position.set(def.pos.x, def.pos.y + 1.8, def.pos.z);
            group.add(warmLight);
        }

        // Level 4: Royal Luxury Suite twin golden pedestals with crystal globes
        if (level >= 4) {
            const baseY = (def.pos.y > 5) ? 6.0 : 0.0;
            [-2.2, 2.2].forEach(offsetX => {
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 16), goldMat);
                ped.position.set(def.pos.x + offsetX, baseY + 0.55, def.pos.z + 1.1);
                group.add(ped);

                const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 1), crystalMat);
                orb.position.set(def.pos.x + offsetX, baseY + 1.3, def.pos.z + 1.1);
                group.add(orb);
            });
        }
    }

    // 1. RECEPTION DESK 3D (Old vs Opt A vs Opt B vs Opt C)
    buildReceptionDesk3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            const oldMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.2), oldMat);
            desk.position.set(0, 0.55, -4);
            group.add(desk);
        } else if (optionId === 'opt_a') {
            const oakTex = this.getTexture('light_nordic_oak');
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.15, 1.3), new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.3 }));
            desk.position.set(0, 0.58, -4);
            group.add(desk);
            const glass = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 1.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.05 }));
            glass.position.set(0, 1.18, -4);
            group.add(glass);
            const strip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            strip.position.set(0, 0.05, -3.34);
            group.add(strip);
        } else if (optionId === 'opt_b') {
            const neroTex = this.getTexture('nero_marble');
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 1.4), new THREE.MeshStandardMaterial({ map: neroTex, roughness: 0.1 }));
            desk.position.set(0, 0.6, -4);
            group.add(desk);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 1.5), goldMat);
            trim.position.set(0, 1.25, -4);
            group.add(trim);
            const comp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            comp.position.set(0, 1.55, -4);
            group.add(comp);
            const lampLight = new THREE.PointLight(0xffeedd, 0.8, 4);
            lampLight.position.set(-1.8, 1.6, -4);
            group.add(lampLight);
        } else if (optionId === 'opt_c') {
            const whiteTex = this.getTexture('carrara_marble');
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.85, roughness: 0.2 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 1.4), new THREE.MeshStandardMaterial({ map: whiteTex, roughness: 0.15 }));
            desk.position.set(0, 0.6, -4);
            group.add(desk);
            [-2.4, 2.4].forEach(x => {
                const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12), brassMat);
                pil.position.set(x, 0.6, -3.3);
                group.add(pil);
            });
        }
        return group;
    }

    // 2. LOBBY CARPET 3D
    buildLobbyCarpet3D(optionId) {
        const group = new THREE.Group();
        if (optionId === 'opt_a') {
            const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 14), new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.85 }));
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            group.add(carpet);
        } else if (optionId === 'opt_b') {
            const carpetTex = this.getTexture('velvet_carpet');
            carpetTex.repeat.set(1, 4);
            const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 14), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.85 }));
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            group.add(carpet);
        } else if (optionId === 'opt_c') {
            const emeraldTex = this.getTexture('emerald_velvet');
            emeraldTex.repeat.set(1, 4);
            const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 14), new THREE.MeshStandardMaterial({ map: emeraldTex, roughness: 0.85 }));
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            group.add(carpet);
        }
        return group;
    }

    // 3. LOBBY CHANDELIER 3D
    buildLobbyChandelier3D(optionId) {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });

        if (!optionId) {
            const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), goldMat);
            cord.position.set(0, 4.25, -1);
            group.add(cord);
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            bulb.position.set(0, 3.5, -1);
            group.add(bulb);
        } else if (optionId === 'opt_a') {
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.04, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
            ring1.rotation.x = Math.PI / 2.3;
            ring1.position.set(0, 3.8, -1);
            group.add(ring1);
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
            ring2.rotation.x = -Math.PI / 2.5;
            ring2.position.set(0, 3.4, -1);
            group.add(ring2);
        } else if (optionId === 'opt_b') {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), goldMat);
            stem.position.set(0, 4.4, -1);
            group.add(stem);
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 12, 24), goldMat);
            ring1.rotation.x = Math.PI / 2;
            ring1.position.set(0, 3.8, -1);
            group.add(ring1);
            const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.05, ior: 1.6 });
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const prism = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), glassMat);
                prism.position.set(Math.cos(angle) * 1.4, 3.5, -1 + Math.sin(angle) * 1.4);
                group.add(prism);
            }
        } else if (optionId === 'opt_c') {
            for (let i = 0; i < 20; i++) {
                const angle = (i / 20) * Math.PI * 2;
                const r = (i % 2 === 0 ? 1.2 : 0.8);
                const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 12), goldMat);
                tube.position.set(Math.cos(angle) * r, 3.6, -1 + Math.sin(angle) * r);
                group.add(tube);
            }
        }
        return group;
    }

    // 4. ROOM 101 BED 3D
    buildRoom101Bed3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 3.5), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            frame.position.set(-19, 0.2, -12);
            group.add(frame);
        } else if (optionId === 'opt_a') {
            const oakTex = this.getTexture('light_nordic_oak');
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 3.8), new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.3 }));
            bedBase.position.set(-19, 0.25, -12);
            group.add(bedBase);
            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 3.2), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }));
            quilt.position.set(-19, 0.65, -11.7);
            group.add(quilt);
        } else if (optionId === 'opt_b') {
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 3.8), new THREE.MeshStandardMaterial({ color: 0x2b180d, roughness: 0.3 }));
            bedBase.position.set(-19, 0.35, -12);
            group.add(bedBase);
            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
            quilt.position.set(-19, 0.85, -11.7);
            group.add(quilt);
            [[-20.6, -13.8], [-17.4, -13.8], [-20.6, -10.2], [-17.4, -10.2]].forEach(pos => {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5), goldMat);
                post.position.set(pos[0], 1.75, pos[1]);
                group.add(post);
            });
            const topFrame = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 3.7), goldMat);
            topFrame.position.set(-19, 3.5, -12);
            group.add(topFrame);
        } else if (optionId === 'opt_c') {
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 3.8), new THREE.MeshStandardMaterial({ color: 0x3a2012, roughness: 0.3 }));
            bedBase.position.set(-19, 0.35, -12);
            group.add(bedBase);
            const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x7a0c1a, roughness: 0.8 }));
            head.position.set(-19, 1.5, -13.8);
            group.add(head);
            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.6 }));
            quilt.position.set(-19, 0.85, -11.7);
            group.add(quilt);
        }
        return group;
    }

    // 5. ROOM 101 DECOR 3D
    buildRoom101Decor3D(optionId) {
        const group = new THREE.Group();
        if (optionId === 'opt_a') {
            const mat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.5 });
            const chair1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), mat);
            chair1.position.set(-22, 0.4, -7);
            const chair2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), mat);
            chair2.position.set(-20, 0.4, -7);
            group.add(chair1); group.add(chair2);
        } else if (optionId === 'opt_b') {
            const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
            const chair1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), emeraldMat);
            chair1.position.set(-22, 0.45, -7);
            const chair2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), emeraldMat);
            chair2.position.set(-20, 0.45, -7);
            group.add(chair1); group.add(chair2);
            const table = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85 }));
            table.position.set(-21, 0.25, -7);
            group.add(table);
        } else if (optionId === 'opt_c') {
            const wickerMat = new THREE.MeshStandardMaterial({ color: 0xc89d66, roughness: 0.9 });
            const chair1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.8, 16), wickerMat);
            chair1.position.set(-22, 0.4, -7);
            const chair2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, 0.8, 16), wickerMat);
            chair2.position.set(-20, 0.4, -7);
            group.add(chair1); group.add(chair2);
        }
        return group;
    }

    // 6. RESTAURANT BAR 3D
    buildRestaurantBar3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            const oldBar = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x443322 }));
            oldBar.position.set(20, 0.6, -6);
            group.add(oldBar);
        } else if (optionId === 'opt_a') {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 1.5), new THREE.MeshStandardMaterial({ color: 0xcc7722, roughness: 0.2, emissive: 0x552200 }));
            bar.position.set(20, 0.6, -6);
            group.add(bar);
        } else if (optionId === 'opt_b') {
            const marbleTex = this.getTexture('carrara_marble');
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
            const bar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 1.5), new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.15 }));
            bar.position.set(20, 0.6, -6);
            group.add(bar);
            const rail = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 1.7), goldMat);
            rail.position.set(20, 1.25, -6);
            group.add(rail);
            for (let x = 17.5; x <= 22.5; x += 1.4) {
                const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), goldMat);
                stool.position.set(x, 0.4, -4.7);
                group.add(stool);
            }
        } else if (optionId === 'opt_c') {
            const walnutTex = this.getTexture('dark_walnut');
            const bar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 1.5), new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.3 }));
            bar.position.set(20, 0.6, -6);
            group.add(bar);
        }
        return group;
    }

    // 7. RESTAURANT TABLES 3D
    buildRestaurantTables3D(optionId) {
        const group = new THREE.Group();
        if (optionId) {
            let tableMat, chairMat;
            if (optionId === 'opt_a') {
                tableMat = new THREE.MeshStandardMaterial({ color: 0xd8b98b, roughness: 0.4 });
                chairMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.6 });
            } else if (optionId === 'opt_b') {
                const neroTex = this.getTexture('nero_marble');
                tableMat = new THREE.MeshStandardMaterial({ map: neroTex, roughness: 0.1 });
                chairMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
            } else {
                tableMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
                chairMat = new THREE.MeshStandardMaterial({ color: 0x7a0c1a, roughness: 0.7 });
            }

            [[17, 3], [22, 3], [17, -1], [22, -1]].forEach(pos => {
                const t = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.9, 16), tableMat);
                t.position.set(pos[0], 0.45, pos[1]);
                group.add(t);
                const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), chairMat);
                c1.position.set(pos[0] - 0.9, 0.4, pos[1]);
                const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), chairMat);
                c2.position.set(pos[0] + 0.9, 0.4, pos[1]);
                group.add(c1); group.add(c2);
            });
        }
        return group;
    }

    // 8. SWIMMING POOL 3D
    buildSwimmingPool3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            const dry = new THREE.Mesh(new THREE.PlaneGeometry(15, 7), new THREE.MeshStandardMaterial({ color: 0x334444, roughness: 0.9 }));
            dry.rotation.x = -Math.PI / 2;
            dry.position.set(0, -0.6, -22);
            group.add(dry);
        } else {
            let waterColor = 0x00f0ff;
            if (optionId === 'opt_b') waterColor = 0x00d2ff;
            else if (optionId === 'opt_c') waterColor = 0x00e6a8;

            const waterTex = this.getTexture('pool_water');
            const water = new THREE.Mesh(
                new THREE.PlaneGeometry(15.2, 7.2),
                new THREE.MeshPhysicalMaterial({ map: waterTex, color: waterColor, transparent: true, opacity: 0.85, roughness: 0.1 })
            );
            water.rotation.x = -Math.PI / 2;
            water.position.set(0, -0.1, -22);
            group.add(water);

            const bedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
            [-5, -2, 2, 5].forEach(x => {
                const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 2.2), bedMat);
                lounger.position.set(x, 0.2, -16.5);
                group.add(lounger);
            });
        }
        return group;
    }

    // 9. SPA JACUZZI 3D
    buildSpaJacuzzi3D(optionId) {
        const group = new THREE.Group();
        if (optionId) {
            let tubMat;
            if (optionId === 'opt_a') tubMat = new THREE.MeshStandardMaterial({ color: 0xc89d66, roughness: 0.8 });
            else if (optionId === 'opt_b') tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
            else tubMat = new THREE.MeshStandardMaterial({ color: 0xd8c29d, roughness: 0.6 });

            const tub = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.0, 1.0, 24), tubMat);
            tub.position.set(18, 0.5, -22);
            group.add(tub);

            const water = new THREE.Mesh(new THREE.CircleGeometry(1.9, 24), new THREE.MeshStandardMaterial({ color: 0x00d2ff, roughness: 0.1 }));
            water.rotation.x = -Math.PI / 2;
            water.position.set(18, 0.85, -22);
            group.add(water);
        }
        return group;
    }

    // 10. GARDEN COURTYARD & FOUNTAIN 3D
    buildGardenCourtyard3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            const dryBasin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0x6b655e, roughness: 0.95 }));
            dryBasin.position.set(-12, 0.2, -22);
            group.add(dryBasin);
        } else {
            const marbleMat = new THREE.MeshStandardMaterial({
                color: optionId === 'opt_b' ? 0xd4af37 : (optionId === 'opt_a' ? 0x2d3748 : 0xf4efe6),
                metalness: optionId === 'opt_b' ? 0.8 : 0.1,
                roughness: 0.25
            });
            const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.55, 24), marbleMat);
            basin.position.set(-12, 0.28, -22);
            group.add(basin);

            const water = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.1 }));
            water.rotation.x = -Math.PI / 2;
            water.position.set(-12, 0.58, -22);
            group.add(water);

            const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.55, 1.4, 16), marbleMat);
            tier1.position.set(-12, 1.1, -22);
            group.add(tier1);

            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.4, 0.35, 20), marbleMat);
            bowl.position.set(-12, 1.75, -22);
            group.add(bowl);

            const foliageMat = new THREE.MeshStandardMaterial({
                color: optionId === 'opt_b' ? 0x991b1b : (optionId === 'opt_c' ? 0xbe185d : 0x15803d),
                roughness: 0.7
            });
            [[-14.8, -20], [-9.2, -20], [-14.8, -24], [-9.2, -24]].forEach(pos => {
                const bush = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), foliageMat);
                bush.position.set(pos[0], 0.65, pos[1]);
                group.add(bush);
            });
        }
        return group;
    }

    // 11. PENTHOUSE SUITE 3D
    buildPenthouseSuite3D(optionId) {
        const group = new THREE.Group();
        if (optionId) {
            let pianoColor = 0xfafafa;
            let couchColor = 0xd4af37;
            if (optionId === 'opt_b') { pianoColor = 0xd4af37; couchColor = 0x111111; }
            else if (optionId === 'opt_c') { pianoColor = 0x3a2012; couchColor = 0x7a0c1a; }

            const piano = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.8), new THREE.MeshStandardMaterial({ color: pianoColor, roughness: 0.15, metalness: 0.2 }));
            piano.position.set(-4, 6.6, 2);
            group.add(piano);

            const couch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 1.4), new THREE.MeshStandardMaterial({ color: couchColor, roughness: 0.6 }));
            couch.position.set(3, 6.5, -3);
            group.add(couch);
        }
        return group;
    }

    addRenovationBeacon(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        const curLvl = this.getAreaLevel(id);
        const isMaxLevel = (curLvl >= 4);
        const nextCost = this.getNextUpgradeCost(id);
        const nextStars = this.getNextUpgradeStars(id);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = !isMaxLevel && (balance >= nextCost && stars >= nextStars);

        const group = new THREE.Group();

        let beaconColor = isMaxLevel ? 0x00f0ff : (canAfford ? 0x00ff88 : 0xffcc00);
        let emissiveColor = isMaxLevel ? 0x004466 : (canAfford ? 0x006622 : 0xcc8800);

        const markerGeo = new THREE.OctahedronGeometry(0.35, 0);
        const markerMat = new THREE.MeshStandardMaterial({
            color: beaconColor,
            emissive: emissiveColor,
            roughness: 0.1,
            metalness: 0.9
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        group.add(marker);

        const ringGeo = new THREE.RingGeometry(0.4, 0.65, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: beaconColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.7;
        group.add(ring);

        group.position.copy(def.pos);
        group.position.y += 0.8;
        this.scene.add(group);

        this.interactivePoints.push({
            id: id,
            name: def.name,
            group: group,
            marker: marker,
            ring: ring,
            pos: def.pos,
            isCompleted: isMaxLevel,
            canAfford: canAfford,
            action: () => this.openRenovationModal(id)
        });
    }

    // ----------------------------------------------------
    // AUTOMATIC AFFORDABILITY NOTIFICATION ENGINE
    // ----------------------------------------------------
    checkAffordableNotifications() {
        Object.keys(this.renovationDefs).forEach(id => {
            const def = this.renovationDefs[id];
            const curLvl = this.getAreaLevel(id);
            if (curLvl >= 4) return;

            const nextCost = this.getNextUpgradeCost(id);
            const nextStars = this.getNextUpgradeStars(id);
            const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
            const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
            const canAfford = (balance >= nextCost && stars >= nextStars);
            const notifyKey = `${id}_lv${curLvl + 1}`;

            if (canAfford && !this.notifiedAffordable[notifyKey]) {
                this.notifiedAffordable[notifyKey] = true;
                this.triggerAffordableAlert(def, curLvl + 1, nextCost);
            }
        });
    }

    triggerAffordableAlert(def, nextLvl = 2, nextCost = 1200) {
        this.playSound('chime');
        const alertBox = document.getElementById('budgetAlertToast');
        if (!alertBox) return;

        alertBox.innerHTML = `
            <div class="alert-content">
                <span class="alert-sparkle">✨ 3 TASARIM KİLİDİ AÇILDI! (SEVİYE ${nextLvl})</span>
                <p><b>${def.name}</b> (Seviye ${nextLvl} — $${nextCost}) yenilemesi için yeterli birikime ulaştınız! 3 farklı lüks tasarımdan favorinizi seçebilirsiniz.</p>
            </div>
            <button class="alert-action-btn" onclick="hotel3D.goToAndOpenRenovation('${def.id}')">
                3 Tasarımı Gör ➔
            </button>
        `;
        alertBox.style.display = 'flex';
        clearTimeout(this.alertTimer);
        this.alertTimer = setTimeout(() => {
            alertBox.style.display = 'none';
        }, 7000);
    }

    goToAndOpenRenovation(id) {
        const def = this.renovationDefs[id];
        if (!def) return;
        const alertBox = document.getElementById('budgetAlertToast');
        if (alertBox) alertBox.style.display = 'none';

        // Ensure Hotel page is active
        if (window.switchMainPage) {
            window.switchMainPage('pageHotel');
        }

        // Teleport near the object inside 3D hotel
        this.player.currentFloor = (def.pos.y > 5.0) ? 2 : 1;
        this.player.pos.set(def.pos.x, (this.player.currentFloor === 2 ? 7.7 : 1.7), def.pos.z + 2.5);
        this.player.rot.yaw = 0;
        this.playSound('door');

        setTimeout(() => {
            this.onResize();
            this.updateInteractions(0);
            this.updateProximityPanel();
            this.openRenovationModal(id);
        }, 250);
    }

    // ----------------------------------------------------
    // INTERACTIVE 3-DESIGN SELECTION & MULTI-LEVEL MODAL
    // ----------------------------------------------------
    openRenovationModal(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        const modal = document.getElementById('renoModal');
        const modalContent = document.getElementById('renoModalContent');
        if (!modal || !modalContent) return;

        this.currentViewingId = id;
        this.selectedOptionIndex = 0;

        const installed = this.getInstalledOption(id);
        if (installed) {
            const idx = def.options.findIndex(o => o.id === installed.optionId);
            if (idx !== -1) this.selectedOptionIndex = idx;
        }

        this.renderModalContent();
        modal.style.display = 'flex';
    }

    selectDesignTab(idx) {
        const id = this.currentViewingId;
        const curLvl = this.getAreaLevel(id);
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = (balance >= cost && stars >= starsNeeded);

        if (!canAfford && curLvl < 4) {
            const defCoins = Math.max(0, cost - balance);
            this.showBanner(`🔒 3 Tasarım Kilitli! Seviye ${curLvl + 1} için $${defCoins} daha biriktirmelisiniz.`);
            return;
        }

        this.selectedOptionIndex = idx;
        this.renderModalContent();
    }

    previewDesignInWorld(optionId) {
        const id = this.currentViewingId;
        const curLvl = this.getAreaLevel(id);
        const targetLvl = Math.min(4, curLvl + 1);
        this.previewingRenovation = { id: id, optionId: optionId, level: targetLvl };
        this.buildObjectMesh(id, optionId, targetLvl);
        this.playSound('step');
        this.showBanner(`👁️ 3D Önizleme Aktif: ${this.renovationDefs[id].name} (Seviye ${targetLvl})`);
        this.renderModalContent();
    }

    cancelPreviewAndClose() {
        if (this.previewingRenovation) {
            const id = this.previewingRenovation.id;
            this.previewingRenovation = null;
            const installed = this.getInstalledOption(id);
            this.buildObjectMesh(id, installed ? installed.optionId : null, installed ? installed.level : 1);
        }
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
    }

    renderModalContent() {
        const id = this.currentViewingId;
        const def = this.renovationDefs[id];
        const modalContent = document.getElementById('renoModalContent');
        if (!modalContent || !def) return;

        const curLvl = this.getAreaLevel(id);
        const isMaxLevel = (curLvl >= 4);
        const nextLvl = Math.min(4, curLvl + 1);

        const opt = def.options[this.selectedOptionIndex];
        const installed = this.state.renovations[id];
        const isPreviewing = (this.previewingRenovation && this.previewingRenovation.optionId === opt.id);

        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const cost = this.getNextUpgradeCost(id);
        const starsNeeded = this.getNextUpgradeStars(id);

        const deficitCoins = Math.max(0, cost - balance);
        const deficitStars = Math.max(0, starsNeeded - stars);
        const canAfford = isMaxLevel || (deficitCoins === 0 && deficitStars === 0);

        const optionStyleLabels = [
            'Seçenek 1 — Modern Elegance',
            'Seçenek 2 — Velvet Luxury',
            'Seçenek 3 — Mediterranean Suite'
        ];

        // Build 4-level progress pills
        let levelStepsHtml = '';
        for (let lv = 1; lv <= 4; lv++) {
            const lvClass = lv < curLvl ? 'lv-done' : (lv === curLvl ? 'lv-current' : (lv === nextLvl ? 'lv-next' : 'lv-future'));
            const lvNames = { 1: 'Lv.1 Başlangıç', 2: 'Lv.2 Modern', 3: 'Lv.3 Premium', 4: 'Lv.4 Kraliyet Lüksü' };
            levelStepsHtml += `<div class="reno-lv-step ${lvClass}"><span>${lvNames[lv]}</span></div>`;
        }

        // If player cannot afford next upgrade yet, show LOCKED 3-design showcase as required!
        if (!canAfford && !isMaxLevel) {
            let lockedCardsHtml = '';
            def.options.forEach((o, idx) => {
                lockedCardsHtml += `
                    <div class="locked-design-option-card">
                        <div class="locked-design-icon">🔒</div>
                        <div class="locked-design-info">
                            <b>${optionStyleLabels[idx]}</b>
                            <span>${o.name}</span>
                            <small>Maliyet: $${cost} &nbsp;•&nbsp; Gelir: +$${o.incomeBoost}/dk</small>
                        </div>
                        <span class="locked-pill">KİLİTLİ</span>
                    </div>
                `;
            });

            modalContent.innerHTML = `
                <div class="reno-card-header">
                    <div class="header-left">
                        <span class="reno-badge">${def.area} · Mevcut: Seviye ${curLvl}/4</span>
                        <h3 class="reno-title">${def.name}</h3>
                    </div>
                    <button class="reno-close-btn" onclick="hotel3D.cancelPreviewAndClose()">&times;</button>
                </div>

                <div class="reno-lv-stepper">${levelStepsHtml}</div>

                <div class="area-visual-banner" style="background-image: url('${def.sceneImg || 'assets/scene_lobby_reception.jpg'}')">
                    <div class="area-visual-overlay">
                        <span class="area-cond-tag">${this.getLevelTitle(curLvl)}</span>
                        <b>Sonraki Hedef: ${this.getLevelTitle(nextLvl)} ($${cost})</b>
                    </div>
                </div>

                <div class="budget-breakdown-card" style="margin-bottom: 12px;">
                    <div class="budget-row">
                        <span>Seviye ${nextLvl} Yenileme Maliyeti:</span>
                        <b class="text-gold">💰 $${cost} &nbsp;|&nbsp; ⭐ ${starsNeeded} Yıldız</b>
                    </div>
                    <div class="budget-row">
                        <span>Mevcut Kasanız:</span>
                        <b>💰 $${balance} &nbsp;|&nbsp; ⭐ ${stars} Yıldız</b>
                    </div>
                    <div class="budget-deficit-box">
                        <span class="deficit-title">🔒 DURUM: BİRİKTİRİLİYOR (SAVING MONEY)</span>
                        <div class="deficit-pills">
                            ${deficitCoins > 0 ? `<span class="def-tag coin">$${deficitCoins} daha gerekli</span>` : ''}
                            ${deficitStars > 0 ? `<span class="def-tag star">${deficitStars} ⭐ daha gerekli</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="locked-designs-box">
                    <div class="locked-box-title">
                        <span>🎨 3 TASARIM SEÇENEĞİ ($${cost} Biriktiğinde Kilidi Açılır)</span>
                    </div>
                    <div class="locked-designs-list">
                        ${lockedCardsHtml}
                    </div>
                </div>

                <div class="reno-actions-footer">
                    <button class="preview-3d-btn" onclick="hotel3D.setTargetRenovation('${id}'); hotel3D.cancelPreviewAndClose();">
                        🎯 Bu Alanı Birikim Hedefi Yap
                    </button>
                    <button class="purchase-confirm-btn btn-disabled" disabled>
                        🔒 Yetersiz Bakiye ($${deficitCoins} Eksik)
                    </button>
                </div>
            `;
            return;
        }

        // UNLOCKED 3 DESIGN OPTIONS WITH VISUAL PREVIEW
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

        const previewImgSrc = (window.LuxuryArt && window.LuxuryArt.getDesignPreview)
            ? window.LuxuryArt.getDesignPreview(id, opt.id, nextLvl)
            : (def.sceneImg || 'assets/scene_lobby_reception.jpg');

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

            <!-- 3 DESIGN OPTIONS PICKER TABS -->
            <div class="design-tabs-row">
                ${optionsTabsHtml}
            </div>

            <!-- SELECTED OPTION CARD WITH VISUAL PREVIEW -->
            <div class="design-detail-card">
                <div class="design-visual-preview-wrap">
                    <img src="${previewImgSrc}" alt="${opt.name}" class="design-visual-preview-img" />
                    <span class="design-preview-badge">🔓 ${optionStyleLabels[this.selectedOptionIndex]}</span>
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

                <!-- STATS BENEFIT -->
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
                        <span>Mevcut Kasanız:</span>
                        <b>💰 $${balance} &nbsp;|&nbsp; ⭐ ${stars} Yıldız</b>
                    </div>
                    <div class="budget-sufficient-box">
                        <span>✅ ${isMaxLevel ? 'Maksimum Seviye (Lv.4) tamamlandı! Tasarımlar arasında ücretsiz geçiş yapabilirsiniz.' : `Bütçeniz Seviye ${nextLvl} yükseltmesi için yeterli! İşlem sonrası kalan: +$${balance - cost}`}</span>
                    </div>
                </div>
            </div>

            <!-- ACTION FOOTER: 3D PREVIEW & PURCHASE BUTTON -->
            <div class="reno-actions-footer">
                <button class="preview-3d-btn ${isPreviewing ? 'active-preview' : ''}" 
                    onclick="hotel3D.previewDesignInWorld('${opt.id}')">
                    ${isPreviewing ? '👁️ 3D Önizleniyor' : '👁️ 3D Dünyada Önizle'}
                </button>

                <button class="purchase-confirm-btn btn-ready"
                    onclick="hotel3D.executePurchase('${id}', '${opt.id}')">
                    ${isMaxLevel
                        ? `🎨 Bu Tasarımı Uygula (Ücretsiz)`
                        : `🛠️ Seviye ${nextLvl}'e Yükselt & Uygula ($${cost})`}
                </button>
            </div>
        `;
    }

    executePurchase(id, optionId) {
        const def = this.renovationDefs[id];
        if (!def) return;
        const opt = def.options.find(o => o.id === optionId);
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

        // Independently advance ONLY this area's level (1 -> 2 -> 3 -> 4)
        this.state.renovations[id] = { optionId: optionId, level: nextLvl };
        this.previewingRenovation = null;

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.spawnConfettiParticles(def.pos);
        this.rebuildAllRenovations();

        this.cancelPreviewAndClose();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        const nextUpgradeMsg = nextLvl < 4
            ? `Sonraki Seviye (Lv.${nextLvl + 1}) Kilidi Açıldı!`
            : `👑 Maksimum Seviye (Lv.4 Kraliyet Lüksü) Tamamlandı!`;
        this.showBanner(`🎉 ${def.name} Seviye ${nextLvl} (${opt.name}) Tamamlandı! ${nextUpgradeMsg}`);
    }

    // ----------------------------------------------------
    // VISUAL HOTEL AREA SHOWCASE CARDS (#hotelAreasVisualGrid)
    // Restores & upgrades visible realistic hotel environments on #pageHotel
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

            // If upgraded (Lv.2+), we can also show the design preview pill alongside the realistic area photo
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
                                🚶‍♂️ 3D Odaya Git &amp; Gez
                            </button>
                            <button class="area-reno-btn ${canAfford ? 'unlocked' : 'locked'}" onclick="hotel3D.openRenovationModal('${id}')">
                                ${isMax
                                    ? '🎨 Tasarım Değiştir'
                                    : (canAfford ? `✨ 3 Tasarımı Seç (Lv.${nextLvl})` : `🔒 Maliyet &amp; 3 Tasarım ($${cost})`)}
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
        this.player.currentFloor = (def.pos.y > 5.0) ? 2 : 1;
        this.player.pos.set(def.pos.x, (this.player.currentFloor === 2 ? 7.7 : 1.7), def.pos.z + 2.5);
        this.player.rot.yaw = 0;
        this.playSound('door');
        this.updateInteractions(0);
        this.updateProximityPanel();
        this.showBanner(`📍 ${def.name} (${def.area}) alanına yürüdünüz.`);
        const container = document.getElementById('hotel3DContainer');
        if (container && container.scrollIntoView) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // ----------------------------------------------------
    // PROJECT PLAN & BUDGET OVERVIEW MODAL (DESTEK DEFTERİ)
    // ----------------------------------------------------
    openProjectPlanModal() {
        let modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        const allIds = Object.keys(this.renovationDefs);
        const totalMaxLevels = allIds.length * 3; // Each area has 3 upgrades (Lv1->2, 2->3, 3->4)
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
                            ${isMax ? '🎨 Tasarım Değiştir' : (canAfford ? `🛠️ Lv.${nextLvl} Tasarla ➔` : '📍 Odaya Git & İncele ➔')}
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

    spawnConfettiParticles(pos) {
        const colors = [0xd4af37, 0xff3366, 0x00f0ff, 0xffffff, 0x70e000];
        for (let i = 0; i < 40; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(0.12, 0.12, 0.02),
                new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
            );
            p.position.copy(pos);
            p.position.y += 1.5;
            p.velocity = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 5 + 2, (Math.random() - 0.5) * 4);
            p.rotSpeed = new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10);
            p.life = 2.5;
            this.scene.add(p);
            this.particles.push(p);
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
                continue;
            }
            p.velocity.y -= 9.8 * dt;
            p.position.addScaledVector(p.velocity, dt);
            p.rotation.x += p.rotSpeed.x * dt;
            p.rotation.y += p.rotSpeed.y * dt;
        }
    }

    // ----------------------------------------------------
    // PASSIVE INCOME TICK & HUD UPDATES
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

        const x = this.player.pos.x;
        const z = this.player.pos.z;
        const floor = this.player.currentFloor;

        if (floor === 2) {
            tag.innerText = '📍 2. Kat: Başkanlık Penthouse Suiti';
        } else if (z < -14) {
            tag.innerText = (x > 12) ? '📍 Aurelia Zen Spa & Jakuzi' : '📍 Aurelia Sonsuzluk Havuzu & Güneş Terası';
        } else if (x < -12) {
            tag.innerText = (z < -4) ? '📍 Deluxe Deniz Manzaralı Suit (Oda 101)' : '📍 Misafir Odaları Koridoru';
        } else if (x > 12) {
            tag.innerText = '📍 Riviera Restoran & Şampanya Barı';
        } else {
            tag.innerText = '📍 Aurelia Palace Büyük Lobi & Resepsiyon';
        }
    }

    setupMinimap() {
        this.radarCanvas = document.getElementById('radarCanvas');
        if (this.radarCanvas) {
            this.radarCtx = this.radarCanvas.getContext('2d');
        }
    }

    drawMinimap() {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const scale = 2.4;
        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1.5;

        const rooms = [
            { x: 0, z: 0, w: 24, d: 20, name: 'Lobi' },
            { x: -20, z: -10.5, w: 14, d: 15, name: '101' },
            { x: 21, z: 0, w: 18, d: 20, name: 'Restoran' },
            { x: 0, z: -22, w: 18, d: 10, name: 'Havuz' }
        ];

        rooms.forEach(r => {
            const rx = cx + (r.x - this.player.pos.x) * scale;
            const ry = cy + (r.z - this.player.pos.z) * scale;
            ctx.strokeRect(rx - (r.w * scale) / 2, ry - (r.d * scale) / 2, r.w * scale, r.d * scale);
        });

        this.interactivePoints.forEach(pt => {
            const bx = cx + (pt.pos.x - this.player.pos.x) * scale;
            const by = cy + (pt.pos.z - this.player.pos.z) * scale;
            ctx.fillStyle = pt.isCompleted ? '#00f0ff' : (pt.canAfford ? '#00ff88' : '#ffcc00');
            ctx.beginPath();
            ctx.arc(bx, by, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Player marker
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-this.player.rot.yaw);
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
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

    // ----------------------------------------------------
    // CONTROLS & MOVEMENT
    // ----------------------------------------------------
    setupControls() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.run = true; break;
                case 'KeyE': this.triggerActiveBeacon(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
                case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
                case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.run = false; break;
            }
        });

        let isMouseDown = false;
        let lastMouse = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            lastMouse = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => { isMouseDown = false; });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            lastMouse = { x: e.clientX, y: e.clientY };

            this.player.rot.yaw -= dx * 0.004;
            this.player.rot.pitch -= dy * 0.004;
            this.player.rot.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.rot.pitch));
        });

        this.setupMobileTouch();
    }

    setupMobileTouch() {
        const joyZone = document.getElementById('mobileJoystickZone');
        const joyKnob = document.getElementById('joystickKnob');
        const lookZone = document.getElementById('mobileLookZone');

        if (!joyZone || !lookZone) return;

        joyZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joyZone.getBoundingClientRect();
            this.touch.joystickActive = true;
            this.touch.joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
        }, { passive: false });

        joyZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touch.joystickActive) return;
            const touch = e.touches[0];
            this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
        }, { passive: false });

        const resetJoy = () => {
            this.touch.joystickActive = false;
            this.touch.joystickDelta = { x: 0, y: 0 };
            if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
        };

        joyZone.addEventListener('touchend', resetJoy);
        joyZone.addEventListener('touchcancel', resetJoy);

        lookZone.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.touch.lookActive = true;
            this.touch.lastLook = { x: touch.clientX, y: touch.clientY };
        }, { passive: true });

        lookZone.addEventListener('touchmove', (e) => {
            if (!this.touch.lookActive) return;
            const touch = e.touches[0];
            const dx = touch.clientX - this.touch.lastLook.x;
            const dy = touch.clientY - this.touch.lastLook.y;
            this.touch.lastLook = { x: touch.clientX, y: touch.clientY };

            this.player.rot.yaw -= dx * 0.005;
            this.player.rot.pitch -= dy * 0.005;
            this.player.rot.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.player.rot.pitch));
        }, { passive: true });

        lookZone.addEventListener('touchend', () => { this.touch.lookActive = false; });
        lookZone.addEventListener('touchcancel', () => { this.touch.lookActive = false; });
    }

    updateJoystick(clientX, clientY, knob) {
        const maxDist = 45;
        const dx = clientX - this.touch.joystickOrigin.x;
        const dy = clientY - this.touch.joystickOrigin.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        if (knob) knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

        this.touch.joystickDelta = {
            x: clampedX / maxDist,
            y: clampedY / maxDist
        };
    }

    updateMovement(dt) {
        let forward = 0;
        let right = 0;

        if (this.keys.forward) forward += 1;
        if (this.keys.backward) forward -= 1;
        if (this.keys.right) right += 1;
        if (this.keys.left) right -= 1;

        if (this.touch.joystickActive) {
            forward -= this.touch.joystickDelta.y;
            right += this.touch.joystickDelta.x;
        }

        const isMoving = (Math.abs(forward) > 0.05 || Math.abs(right) > 0.05);
        this.player.isMoving = isMoving;

        if (isMoving) {
            const moveSpeed = this.player.speed * (this.keys.run ? 1.6 : 1.0);
            const yaw = this.player.rot.yaw;

            const fX = -Math.sin(yaw) * forward;
            const fZ = -Math.cos(yaw) * forward;

            const sX = Math.cos(yaw) * right;
            const sZ = -Math.sin(yaw) * right;

            const moveDir = new THREE.Vector2(fX + sX, fZ + sZ).normalize().multiplyScalar(moveSpeed * dt);

            this.moveWithCollision(moveDir.x, 0);
            this.moveWithCollision(0, moveDir.y);

            this.stepTimer = (this.stepTimer || 0) + dt;
            if (this.stepTimer > 0.42) {
                this.playSound('step');
                this.stepTimer = 0;
            }
        }

        this.camera.position.copy(this.player.pos);
        this.camera.rotation.y = this.player.rot.yaw;
        this.camera.rotation.x = this.player.rot.pitch;

        this.updateCurrentLocationTag();
    }

    moveWithCollision(dx, dz) {
        const nextX = this.player.pos.x + dx;
        const nextZ = this.player.pos.z + dz;
        const r = this.player.radius;
        const y = this.player.pos.y;

        let collided = false;
        for (let col of this.colliders) {
            if (y >= col.minY && y <= col.maxY) {
                if (nextX + r > col.minX && nextX - r < col.maxX &&
                    nextZ + r > col.minZ && nextZ - r < col.maxZ) {
                    collided = true;
                    break;
                }
            }
        }

        if (!collided) {
            this.player.pos.x = nextX;
            this.player.pos.z = nextZ;
        }
    }

    updateInteractions(time) {
        let nearestBeacon = null;
        let minDist = 3.0;

        this.interactivePoints.forEach(pt => {
            if (pt.marker) {
                pt.marker.rotation.y += 0.025;
                pt.marker.position.y = Math.sin(time * 3 + pt.pos.x) * 0.15;
            }
            if (pt.ring) {
                pt.ring.scale.setScalar(1 + Math.sin(time * 4) * 0.12);
            }

            const dist = this.player.pos.distanceTo(pt.pos);
            if (dist < minDist) {
                minDist = dist;
                nearestBeacon = pt;
            }
        });

        this.activeBeacon = nearestBeacon;

        const prompt = document.getElementById('actionPrompt');
        if (prompt) {
            if (nearestBeacon) {
                const def = this.renovationDefs[nearestBeacon.id];
                const label = def ? def.name : nearestBeacon.name;
                const curLvl = def ? this.getAreaLevel(nearestBeacon.id) : 1;
                const isMax = (curLvl >= 4);
                const nextLvl = Math.min(4, curLvl + 1);
                const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
                const cost = def ? this.getNextUpgradeCost(nearestBeacon.id) : 1200;
                const canAfford = isMax || (balance >= cost);

                prompt.innerHTML = `
                    <div class="prompt-icon">${isMax ? '👑' : (canAfford ? '🟢' : '🛠️')}</div>
                    <div class="prompt-text">
                        <strong>${label} (Lv.${curLvl}/4)</strong>
                        <span>${isMax ? '[E] Tasarımı Değiştir (MAX)' : (canAfford ? `[E] Seviye ${nextLvl} Hazır! 3 Tasarımı Gör` : `[E] Seviye ${nextLvl} Maliyetini İncele ($${cost})`)}</span>
                    </div>
                `;
                prompt.style.display = 'flex';
            } else {
                prompt.style.display = 'none';
            }
        }

        // Live Proximity Information Card
        this.updateProximityPanel();
    }

    updateProximityPanel() {
        const proxPanel = document.getElementById('renovationProximityPanel');
        if (!proxPanel) return;

        if (!this.activeBeacon) {
            proxPanel.style.display = 'none';
            return;
        }

        const def = this.renovationDefs[this.activeBeacon.id];
        if (!def) {
            proxPanel.style.display = 'none';
            return;
        }

        const id = def.id;
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
        let statusText = 'SAVING MONEY';
        let currentCondition = def.defaultDesc || 'Seviye 1: Başlangıç Durumu';

        if (installed) {
            const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
            currentCondition = `Seviye ${curLvl}: ${opt.name} (${opt.style})`;
        }

        if (isMax) {
            statusClass = 'status-completed';
            statusText = 'MAX LEVEL 4';
        } else if (canAfford) {
            statusClass = 'status-ready';
            statusText = `READY FOR LV.${nextLvl}`;
        }

        const stillNeeded = Math.max(0, cost - balance);
        const remainingAfter = Math.max(0, balance - cost);

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
                
                <div class="prox-actions-row">
                    ${isMax ? `
                        <button class="prox-btn-view-designs" onclick="hotel3D.openRenovationModal('${def.id}')">
                            🎨 3 Tasarım Arasında Geçiş Yap
                        </button>
                    ` : canAfford ? `
                        <button class="prox-btn-view-designs pulse" onclick="hotel3D.openRenovationModal('${def.id}')">
                            🔓 3 Tasarımı İncele &amp; Seviye ${nextLvl}'e Yükselt
                        </button>
                    ` : `
                        <button class="prox-btn-locked" onclick="hotel3D.openRenovationModal('${def.id}')">
                            🔒 3 Tasarım Kilitli ($${stillNeeded} eksik · Detayları Gör)
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

    openFinancialLedgerModal() {
        if (window.GameEconomy) {
            window.GameEconomy.openLedgerModal();
        }
    }

    triggerActiveBeacon() {
        if (this.activeBeacon && this.activeBeacon.action) {
            this.activeBeacon.action();
        }
    }

    createInteractivePoint(id, name, pos, action) {
        const group = new THREE.Group();
        const marker = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x004466 }));
        marker.rotation.x = Math.PI;
        marker.position.set(0, 0.5, 0);
        group.add(marker);
        group.position.copy(pos);
        this.scene.add(group);

        this.interactivePoints.push({
            id: id,
            name: name,
            marker: marker,
            pos: pos,
            action: action
        });
    }

    jumpTo(room) {
        if (room === 'lobby') {
            this.player.currentFloor = 1;
            this.player.pos.set(0, 1.7, 8);
            this.player.rot.yaw = 0;
            this.playSound('door');
            this.showBanner('📍 Büyük Lobi & Resepsiyona geçildi.');
        } else if (room === 'room101') {
            this.player.currentFloor = 1;
            this.player.pos.set(-19, 1.7, -6);
            this.player.rot.yaw = 0;
            this.playSound('door');
            this.showBanner('📍 Deluxe Suit 101 Odasına geçildi.');
        } else if (room === 'restaurant') {
            this.player.currentFloor = 1;
            this.player.pos.set(20, 1.7, 0);
            this.player.rot.yaw = Math.PI / 2;
            this.playSound('door');
            this.showBanner('📍 Riviera Restoran & Barına geçildi.');
        } else if (room === 'pool') {
            this.player.currentFloor = 1;
            this.player.pos.set(0, 1.7, -18);
            this.player.rot.yaw = Math.PI;
            this.playSound('door');
            this.showBanner('📍 Sonsuzluk Havuzu & Güneş Terasına geçildi.');
        } else if (room === 'spa') {
            this.player.currentFloor = 1;
            this.player.pos.set(18, 1.7, -19);
            this.player.rot.yaw = Math.PI;
            this.playSound('door');
            this.showBanner('📍 Zen Termal Spa & Jakuzi Merkezine geçildi.');
        } else if (room === 'garden') {
            this.player.currentFloor = 1;
            this.player.pos.set(-12, 1.7, -19);
            this.player.rot.yaw = Math.PI;
            this.playSound('door');
            this.showBanner('📍 Akdeniz Botanik Bahçesi & Mermer Çeşmeye geçildi.');
        } else if (room === 'penthouse') {
            this.player.currentFloor = 2;
            this.player.pos.set(0, 7.7, 4);
            this.player.rot.yaw = 0;
            this.playSound('door');
            this.showBanner('📍 2. Kat: Başkanlık Penthouse Suitine geçildi.');
        }

        document.querySelectorAll('.room-jump-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.room-jump-btn[onclick*="${room}"]`);
        if (btn) btn.classList.add('active');
        this.updateInteractions(0);
        this.updateProximityPanel();
    }

    onResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || 520;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    // ----------------------------------------------------
    // MAIN LOOP
    // ----------------------------------------------------
    animate() {
        requestAnimationFrame(this.animate);

        const dt = Math.min(this.clock.getDelta(), 0.1);
        const time = this.clock.getElapsedTime();

        this.updateMovement(dt);
        this.updateInteractions(time);
        this.updateParticles(dt);
        this.updateEconomy();
        this.drawMinimap();

        this.renderer.render(this.scene, this.camera);
    }
}

// Global initialization helpers
window.Hotel3DSimulator = Hotel3DSimulator;

window.jumpToRoom = function(room) {
    if (window.hotel3D) window.hotel3D.jumpTo(room);
};

window.initHotel3D = function() {
    if (!window.hotel3D && document.getElementById('hotel3DContainer')) {
        window.hotel3D = new Hotel3DSimulator('hotel3DContainer');
    } else if (window.hotel3D) {
        window.hotel3D.onResize();
        window.hotel3D.renderHotelAreaCards();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.initHotel3D();
    }, 150);
});
