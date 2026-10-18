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

            penthouse_suite: {
                id: 'penthouse_suite',
                stage: 6,
                name: '2. Kat Başkanlık Penthouse Suiti',
                area: 'Aurelia Çatı Katı',
                pos: new THREE.Vector3(0, 7.2, 0),
                options: [
                    {
                        id: 'opt_a',
                        name: 'Panoramik Şömineli Beyaz Kuyruklu Piyano Salonu',
                        style: 'Modern Lüks',
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
                        style: 'Monako Palace',
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
                        style: 'Barok Miras',
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
    }

    // ----------------------------------------------------
    // SAVE DATA & ECONOMY
    // ----------------------------------------------------
    loadSaveData() {
        const saved = localStorage.getItem('velvet_hotel_3d_state_v2');
        const defaultState = {
            coins: 1000,
            stars: 15,
            prestige: 50,
            reputation: 250,
            hotelStars: 1,
            uncollectedIncome: 0,
            incomePerMin: 35,
            lastIncomeTick: Date.now(),
            currentStage: 1,
            // Maps renovationId -> { optionId: 'opt_b', level: 1 } or null
            renovations: {}
        };

        // Try reading v2 state, fallback to v1 migration
        if (saved) {
            try {
                this.state = Object.assign(defaultState, JSON.parse(saved));
            } catch (e) {
                this.state = defaultState;
            }
        } else {
            // Check legacy state
            const legacy = localStorage.getItem('velvet_hotel_3d_state');
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    this.state = Object.assign(defaultState, parsed);
                    // Migrate legacy binary 1s to 'opt_b'
                    if (parsed.renovations) {
                        this.state.renovations = {};
                        Object.keys(parsed.renovations).forEach(k => {
                            if (parsed.renovations[k] > 0) {
                                this.state.renovations[k] = { optionId: 'opt_b', level: 1 };
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

        // Calculate total income from installed renovations
        this.recalcHotelStats();
    }

    saveState() {
        localStorage.setItem('velvet_hotel_3d_state_v2', JSON.stringify(this.state));
        this.updateHUD();
    }

    recalcHotelStats() {
        let baseIncome = 35;
        let baseRep = 200;
        let count = 0;

        Object.keys(this.state.renovations).forEach(id => {
            const reno = this.state.renovations[id];
            if (reno && reno.optionId) {
                count++;
                const def = this.renovationDefs[id];
                if (def) {
                    const opt = def.options.find(o => o.id === reno.optionId) || def.options[0];
                    if (opt) {
                        baseIncome += opt.incomeBoost;
                        baseRep += opt.repBoost;
                    }
                }
            }
        });

        this.state.incomePerMin = baseIncome;
        this.state.reputation = baseRep;

        if (count >= 8) this.state.hotelStars = 5;
        else if (count >= 6) this.state.hotelStars = 4;
        else if (count >= 4) this.state.hotelStars = 3;
        else if (count >= 2) this.state.hotelStars = 2;
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
            return { optionId: this.previewingRenovation.optionId, isPreview: true };
        }
        const saved = this.state.renovations[id];
        if (!saved) return null;
        if (typeof saved === 'string') return { optionId: saved, isPreview: false };
        if (typeof saved === 'object' && saved.optionId) return { optionId: saved.optionId, isPreview: false };
        return { optionId: 'opt_b', isPreview: false };
    }

    buildObjectMesh(id, optionId) {
        if (this.upgradeMeshes[id]) {
            this.scene.remove(this.upgradeMeshes[id]);
        }

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
            case 'penthouse_suite': meshGroup = this.buildPenthouseSuite3D(optionId); break;
        }

        if (meshGroup) {
            this.upgradeMeshes[id] = meshGroup;
            this.scene.add(meshGroup);
        }
    }

    // 1. RECEPTION DESK 3D (Old vs Opt A vs Opt B vs Opt C)
    buildReceptionDesk3D(optionId) {
        const group = new THREE.Group();
        if (!optionId) {
            // Old dusty wooden crate
            const oldMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.2), oldMat);
            desk.position.set(0, 0.55, -4);
            group.add(desk);
        } else if (optionId === 'opt_a') {
            // Modern Minimalist Nordic Oak
            const oakTex = this.getTexture('light_nordic_oak');
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.15, 1.3), new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.3 }));
            desk.position.set(0, 0.58, -4);
            group.add(desk);
            // Floating glass top
            const glass = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.06, 1.4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0.05 }));
            glass.position.set(0, 1.18, -4);
            group.add(glass);
            // White LED light strip
            const strip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            strip.position.set(0, 0.05, -3.34);
            group.add(strip);
        } else if (optionId === 'opt_b') {
            // Nero Marquina Black & Gold Marble
            const neroTex = this.getTexture('nero_marble');
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 1.4), new THREE.MeshStandardMaterial({ map: neroTex, roughness: 0.1 }));
            desk.position.set(0, 0.6, -4);
            group.add(desk);
            const trim = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 1.5), goldMat);
            trim.position.set(0, 1.25, -4);
            group.add(trim);
            // Computer & lamp
            const comp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            comp.position.set(0, 1.55, -4);
            group.add(comp);
            const lampLight = new THREE.PointLight(0xffeedd, 0.8, 4);
            lampLight.position.set(-1.8, 1.6, -4);
            group.add(lampLight);
        } else if (optionId === 'opt_c') {
            // Neoclassical Imperial Carrara White Marble & Brass
            const whiteTex = this.getTexture('carrara_marble');
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.85, roughness: 0.2 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 1.4), new THREE.MeshStandardMaterial({ map: whiteTex, roughness: 0.15 }));
            desk.position.set(0, 0.6, -4);
            group.add(desk);
            // Ionic fluting details
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
            // Modern Geometric Gold
            const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 14), new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.85 }));
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            group.add(carpet);
        } else if (optionId === 'opt_b') {
            // Royal Crimson Damask Velvet
            const carpetTex = this.getTexture('velvet_carpet');
            carpetTex.repeat.set(1, 4);
            const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 14), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.85 }));
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            group.add(carpet);
        } else if (optionId === 'opt_c') {
            // Monaco Emerald Velvet
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
            // Modern Minimalist Ring Halo
            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.04, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
            ring1.rotation.x = Math.PI / 2.3;
            ring1.position.set(0, 3.8, -1);
            group.add(ring1);
            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffeedd }));
            ring2.rotation.x = -Math.PI / 2.5;
            ring2.position.set(0, 3.4, -1);
            group.add(ring2);
        } else if (optionId === 'opt_b') {
            // Bohemya 12 Kollu Kristal Avize
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
            // Art Deco Gold Tube Chandelier
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
            // Scandinavian Floating Bed
            const oakTex = this.getTexture('light_nordic_oak');
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 3.8), new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.3 }));
            bedBase.position.set(-19, 0.25, -12);
            group.add(bedBase);
            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 3.2), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 }));
            quilt.position.set(-19, 0.65, -11.7);
            group.add(quilt);
        } else if (optionId === 'opt_b') {
            // Royal Gold Canopy Bed (Cibinlikli)
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 3.8), new THREE.MeshStandardMaterial({ color: 0x2b180d, roughness: 0.3 }));
            bedBase.position.set(-19, 0.35, -12);
            group.add(bedBase);
            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
            quilt.position.set(-19, 0.85, -11.7);
            group.add(quilt);
            // 4 Canopy Posts
            [[-20.6, -13.8], [-17.4, -13.8], [-20.6, -10.2], [-17.4, -10.2]].forEach(pos => {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5), goldMat);
                post.position.set(pos[0], 1.75, pos[1]);
                group.add(post);
            });
            // Canopy Top Frame
            const topFrame = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.08, 3.7), goldMat);
            topFrame.position.set(-19, 3.5, -12);
            group.add(topFrame);
        } else if (optionId === 'opt_c') {
            // Chesterfield Bordo Kadife King Bed
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
            // Modern Minimalist Grey & Glass
            const mat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.5 });
            const chair1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), mat);
            chair1.position.set(-22, 0.4, -7);
            const chair2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), mat);
            chair2.position.set(-20, 0.4, -7);
            group.add(chair1); group.add(chair2);
        } else if (optionId === 'opt_b') {
            // Emerald Velvet & Brass Champagne Table
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
            // Riviera Bambu & Wicker
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
            // Amber Backlit Onyx
            const bar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 1.5), new THREE.MeshStandardMaterial({ color: 0xcc7722, roughness: 0.2, emissive: 0x552200 }));
            bar.position.set(20, 0.6, -6);
            group.add(bar);
        } else if (optionId === 'opt_b') {
            // White Carrara Marble & Fluted Gold
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
            // Dark Speakeasy Walnut
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
            if (optionId === 'opt_a') tubMat = new THREE.MeshStandardMaterial({ color: 0xc89d66, roughness: 0.8 }); // Cedar wood
            else if (optionId === 'opt_b') tubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 }); // Marble
            else tubMat = new THREE.MeshStandardMaterial({ color: 0xd8c29d, roughness: 0.6 }); // Roman stone

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

    // 10. PENTHOUSE SUITE 3D
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

        const installed = this.getInstalledOption(id);
        const isCompleted = (installed && !installed.isPreview);

        // Check if player can afford ANY option
        const minCostCoins = Math.min(...def.options.map(o => o.costCoins));
        const minCostStars = Math.min(...def.options.map(o => o.costStars));
        const canAfford = (this.state.coins >= minCostCoins && this.state.stars >= minCostStars);

        const group = new THREE.Group();

        // Color coding:
        // Green: Affordable now!
        // Gold: Unaffordable yet
        // Cyan: Completed
        let beaconColor = isCompleted ? 0x00f0ff : (canAfford ? 0x00ff88 : 0xffcc00);
        let emissiveColor = isCompleted ? 0x004466 : (canAfford ? 0x006622 : 0xcc8800);

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
            isCompleted: isCompleted,
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
            const installed = this.getInstalledOption(id);
            if (installed && !installed.isPreview) return; // already done

            const minCostCoins = Math.min(...def.options.map(o => o.costCoins));
            const minCostStars = Math.min(...def.options.map(o => o.costStars));

            const canAfford = (this.state.coins >= minCostCoins && this.state.stars >= minCostStars);

            if (canAfford && !this.notifiedAffordable[id]) {
                this.notifiedAffordable[id] = true;
                this.triggerAffordableAlert(def);
            }
        });
    }

    triggerAffordableAlert(def) {
        this.playSound('chime');
        const alertBox = document.getElementById('budgetAlertToast');
        if (!alertBox) return;

        alertBox.innerHTML = `
            <div class="alert-content">
                <span class="alert-sparkle">✨ BÜTÇE HAZIR!</span>
                <p><b>${def.name}</b> yenilemesi için yeterli birikime ulaştınız! Tasarımınızı seçebilirsiniz.</p>
            </div>
            <button class="alert-action-btn" onclick="hotel3D.goToAndOpenRenovation('${def.id}')">
                İncele &amp; Tasarla ➔
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

        // Teleport near the object
        this.player.currentFloor = (def.pos.y > 5.0) ? 2 : 1;
        this.player.pos.set(def.pos.x, (this.player.currentFloor === 2 ? 7.7 : 1.7), def.pos.z + 2.5);
        this.player.rot.yaw = 0;
        this.playSound('door');

        setTimeout(() => {
            this.openRenovationModal(id);
        }, 300);
    }

    // ----------------------------------------------------
    // INTERACTIVE 3-DESIGN SELECTION MODAL WITH 3D PREVIEW
    // ----------------------------------------------------
    openRenovationModal(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        const installed = this.getInstalledOption(id);
        const modal = document.getElementById('renoModal');
        const modalContent = document.getElementById('renoModalContent');
        if (!modal || !modalContent) return;

        this.currentViewingId = id;
        this.selectedOptionIndex = 0;

        // Find which option was installed or default to 0
        if (installed) {
            const idx = def.options.findIndex(o => o.id === installed.optionId);
            if (idx !== -1) this.selectedOptionIndex = idx;
        }

        this.renderModalContent();
        modal.style.display = 'flex';
    }

    selectDesignTab(idx) {
        this.selectedOptionIndex = idx;
        this.renderModalContent();
    }

    // Live 3D Preview: Swaps the 3D model in the world so player can walk/look!
    previewDesignInWorld(optionId) {
        const id = this.currentViewingId;
        this.previewingRenovation = { id: id, optionId: optionId };
        this.buildObjectMesh(id, optionId);
        this.playSound('step');
        this.showBanner(`👁️ 3D Önizleme Aktif: ${this.renovationDefs[id].name}`);
        this.renderModalContent();
    }

    cancelPreviewAndClose() {
        if (this.previewingRenovation) {
            const id = this.previewingRenovation.id;
            this.previewingRenovation = null;
            // Restore saved state
            const installed = this.getInstalledOption(id);
            this.buildObjectMesh(id, installed ? installed.optionId : null);
        }
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
    }

    renderModalContent() {
        const id = this.currentViewingId;
        const def = this.renovationDefs[id];
        const modalContent = document.getElementById('renoModalContent');
        if (!modalContent || !def) return;

        const opt = def.options[this.selectedOptionIndex];
        const installed = this.state.renovations[id];
        const isCurrentInstalled = (installed && (installed === opt.id || installed.optionId === opt.id));
        const isPreviewing = (this.previewingRenovation && this.previewingRenovation.optionId === opt.id);

        const deficitCoins = Math.max(0, opt.costCoins - this.state.coins);
        const deficitStars = Math.max(0, opt.costStars - this.state.stars);
        const canAfford = (deficitCoins === 0 && deficitStars === 0);

        let optionsTabsHtml = '';
        def.options.forEach((o, idx) => {
            const isSelected = (idx === this.selectedOptionIndex);
            const isInstalled = (installed && (installed === o.id || installed.optionId === o.id));
            optionsTabsHtml += `
                <button class="design-tab-btn ${isSelected ? 'active' : ''} ${isInstalled ? 'installed' : ''}" 
                    onclick="hotel3D.selectDesignTab(${idx})">
                    <span class="tab-icon">${o.icon}</span>
                    <div class="tab-text">
                        <b>Seçenek ${String.fromCharCode(65 + idx)}</b>
                        <small>${o.style}</small>
                    </div>
                    ${isInstalled ? '<span class="installed-tag">Mevcut</span>' : ''}
                </button>
            `;
        });

        modalContent.innerHTML = `
            <div class="reno-card-header">
                <div class="header-left">
                    <span class="reno-badge">${def.area}</span>
                    <h3 class="reno-title">${def.name}</h3>
                </div>
                <button class="reno-close-btn" onclick="hotel3D.cancelPreviewAndClose()">&times;</button>
            </div>

            <!-- 3 DESIGN OPTIONS PICKER TABS -->
            <div class="design-tabs-row">
                ${optionsTabsHtml}
            </div>

            <!-- SELECTED OPTION CARD -->
            <div class="design-detail-card">
                <div class="design-head-row">
                    <div class="design-title-box">
                        <span class="opt-badge">${opt.style}</span>
                        <h4>${opt.name}</h4>
                    </div>
                    <div class="design-price-tag">
                        <span>💰 ${opt.costCoins}</span>
                        <span class="star-pill">⭐ ${opt.costStars}</span>
                    </div>
                </div>

                <p class="design-desc">${opt.desc}</p>

                <!-- STATS BENEFIT -->
                <div class="design-stats-strip">
                    <div class="stat-pill">
                        <label>Pasif Otel Geliri</label>
                        <b class="positive">+₺${opt.incomeBoost}/dk</b>
                    </div>
                    <div class="stat-pill">
                        <label>Otel Prestiji</label>
                        <b class="rep">+${opt.repBoost} Rep</b>
                    </div>
                </div>

                <!-- BUDGET BREAKDOWN & DEFICIT CALCULATION -->
                <div class="budget-breakdown-card">
                    <div class="budget-row">
                        <span>Mevcut Kasanız:</span>
                        <b>💰 ₺${this.state.coins} &nbsp;|&nbsp; ⭐ ${this.state.stars} Yıldız</b>
                    </div>
                    ${!canAfford ? `
                        <div class="budget-deficit-box">
                            <span class="deficit-title">⚠️ Bütçe Durumu: Yetersiz Bakiye</span>
                            <div class="deficit-pills">
                                ${deficitCoins > 0 ? `<span class="def-tag coin">₺${deficitCoins} eksik</span>` : ''}
                                ${deficitStars > 0 ? `<span class="def-tag star">${deficitStars} ⭐ eksik</span>` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="budget-sufficient-box">
                            <span>✅ Bütçeniz bu lüks tasarımı uygulamak için yeterli!</span>
                        </div>
                    `}
                </div>
            </div>

            <!-- ACTION FOOTER: 3D PREVIEW & PURCHASE BUTTON -->
            <div class="reno-actions-footer">
                <button class="preview-3d-btn ${isPreviewing ? 'active-preview' : ''}" 
                    onclick="hotel3D.previewDesignInWorld('${opt.id}')">
                    ${isPreviewing ? '👁️ 3D Önizleniyor' : '👁️ 3D Dünyada Önizle'}
                </button>

                <button class="purchase-confirm-btn ${isCurrentInstalled ? 'btn-installed' : (canAfford ? 'btn-ready' : 'btn-disabled')}"
                    ${(!canAfford || isCurrentInstalled) ? 'disabled' : ''}
                    onclick="hotel3D.executePurchase('${id}', '${opt.id}')">
                    ${isCurrentInstalled ? '🌟 Bu Tasarım Kurulu' : (canAfford ? '🛠️ Satın Al & Uygula' : '❌ Yetersiz Bakiye')}
                </button>
            </div>
        `;
    }

    executePurchase(id, optionId) {
        const def = this.renovationDefs[id];
        if (!def) return;
        const opt = def.options.find(o => o.id === optionId);
        if (!opt) return;

        if (this.state.coins < opt.costCoins || this.state.stars < opt.costStars) {
            this.showBanner('Yetersiz bakiye! Masadan sipariş tamamlayın.');
            return;
        }

        // Deduct exactly once
        this.state.coins -= opt.costCoins;
        this.state.stars -= opt.costStars;

        // Save selected design
        this.state.renovations[id] = { optionId: optionId, level: 1 };
        this.previewingRenovation = null;

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.spawnConfettiParticles(def.pos);
        this.rebuildAllRenovations();

        this.cancelPreviewAndClose();
        this.showBanner(`🎉 ${opt.name} Başarıyla Uygulandı! (+₺${opt.incomeBoost}/dk)`);
    }

    // ----------------------------------------------------
    // PROJECT PLAN & BUDGET OVERVIEW MODAL (DESTEK DEFTERİ)
    // ----------------------------------------------------
    openProjectPlanModal() {
        let modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        const totalAreas = Object.keys(this.renovationDefs).length;
        const completedCount = Object.keys(this.state.renovations).filter(k => this.state.renovations[k]).length;
        const progressPct = Math.round((completedCount / totalAreas) * 100);

        let listHtml = '';
        Object.keys(this.renovationDefs).forEach((id, idx) => {
            const def = this.renovationDefs[id];
            const installed = this.getInstalledOption(id);
            const isDone = (installed && !installed.isPreview);

            const minCoins = Math.min(...def.options.map(o => o.costCoins));
            const minStars = Math.min(...def.options.map(o => o.costStars));
            const canAfford = (this.state.coins >= minCoins && this.state.stars >= minStars);

            let statusTag = '';
            if (isDone) {
                const opt = def.options.find(o => o.id === installed.optionId) || def.options[0];
                statusTag = `<span class="proj-badge done">✅ Tamamlandı (${opt.style})</span>`;
            } else if (canAfford) {
                statusTag = `<span class="proj-badge ready">🟢 BÜTÇE HAZIR (₺${minCoins})</span>`;
            } else {
                const defCoins = Math.max(0, minCoins - this.state.coins);
                statusTag = `<span class="proj-badge waiting">⏳ ₺${defCoins} Eksik</span>`;
            }

            listHtml += `
                <div class="proj-area-row ${isDone ? 'done-row' : ''}">
                    <div class="proj-area-info">
                        <span class="proj-stage">ALAN ${idx + 1} · ${def.area}</span>
                        <h4>${def.name}</h4>
                        <div class="proj-status-bar">${statusTag}</div>
                    </div>
                    <button class="proj-go-btn" onclick="hotel3D.goToAndOpenRenovation('${id}')">
                        ${isDone ? 'Tasarım Değiştir' : (canAfford ? '🛠️ Hemen Yap' : 'İncele ➔')}
                    </button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div class="proj-title-box">
                        <span class="proj-crest">✦ AURELIA PALACE PROJE DEFTERİ</span>
                        <h3>Restorasyon ve Bütçe Planı</h3>
                    </div>
                    <button class="reno-close-btn" onclick="document.getElementById('projectPlanModal').style.display='none'">&times;</button>
                </div>

                <div class="proj-summary-strip">
                    <div class="proj-sum-item">
                        <label>Genel İlerleme</label>
                        <b>%${progressPct} (${completedCount}/${totalAreas})</b>
                    </div>
                    <div class="proj-sum-item">
                        <label>Toplam Gelir</label>
                        <b class="positive">+₺${this.state.incomePerMin}/dk</b>
                    </div>
                    <div class="proj-sum-item">
                        <label>Mevcut Bakiye</label>
                        <b>💰 ₺${this.state.coins} | ⭐ ${this.state.stars}</b>
                    </div>
                </div>

                <div class="proj-progress-track">
                    <div class="proj-progress-bar" style="width: ${progressPct}%;"></div>
                </div>

                <div class="proj-list-scroll">
                    ${listHtml}
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
        this.state.coins += amt;
        this.state.uncollectedIncome = 0;
        this.playSound('cash');
        this.saveState();
        this.checkAffordableNotifications();
        this.showBanner(`💰 +₺${amt} Otel Geliri Kasaya Eklendi!`);
    }

    updateHUD() {
        const coinEl = document.getElementById('hudCoins');
        const starEl = document.getElementById('hudStars');
        const rateEl = document.getElementById('hudRate');
        const uncollectedEl = document.getElementById('hudUncollected');
        const hotelStarsEl = document.getElementById('hudHotelStars');

        if (coinEl) coinEl.innerText = this.state.coins;
        if (starEl) starEl.innerText = this.state.stars;
        if (rateEl) rateEl.innerText = `+₺${this.state.incomePerMin}/dk`;
        if (uncollectedEl) uncollectedEl.innerText = `₺${this.state.uncollectedIncome}`;
        if (hotelStarsEl) {
            hotelStarsEl.innerHTML = '⭐'.repeat(this.state.hotelStars);
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
                const installed = this.getInstalledOption(nearestBeacon.id);
                const isDone = (installed && !installed.isPreview);
                const canAfford = nearestBeacon.canAfford;

                prompt.innerHTML = `
                    <div class="prompt-icon">${isDone ? '✨' : (canAfford ? '🟢' : '🛠️')}</div>
                    <div class="prompt-text">
                        <strong>${label}</strong>
                        <span>${isDone ? '[E] Tasarımı Değiştir' : (canAfford ? '[E] Bütçe Hazır! Tasarla' : '[E] Bütçeyi İncele')}</span>
                    </div>
                `;
                prompt.style.display = 'flex';
            } else {
                prompt.style.display = 'none';
            }
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
    }
};

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.initHotel3D();
    }, 150);
});
