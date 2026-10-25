// ========================================================
// VELVET SECRETS — FULL 3D WALKABLE HOTEL & 3-OPTION RENOVATION ENGINE
// Powered by Three.js (WebGL) - Free Roam Movement (Joystick + Touch Look + WASD),
// 3D Raycast Tap-to-Renovate, Live 3D Furniture Preview & Permanent Customization
// ========================================================

class Hotel3DSimulator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.state = {
            coins: 2400,
            stars: 10,
            hotelStars: 1,
            reputation: 120,
            incomePerMin: 45,
            uncollectedIncome: 0,
            lastIncomeTick: Date.now(),
            renovations: {}
        };

        this.currentRoom = 'lobby';
        this.isMapMode = false;
        this.isFullLuxuryPreview = false;
        this.selectedAreaId = 'lobby_floor_walls';
        this.selectedOptionIndex = 0;
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;
        this.notifiedAffordable = new Set();

        // 3D Player & Free-Roam Camera State (Exact Reference Photo Perspective in Grand Lobby)
        this.player = {
            pos: new THREE.Vector3(-0.6, 1.72, 8.4),
            rot: { yaw: 0.02, pitch: -0.02 },
            targetPos: null,
            targetYaw: null,
            targetPitch: null,
            speed: 5.8,
            radius: 0.45,
            currentFloor: 1,
            isMoving: false
        };

        this.keys = { forward: false, backward: false, left: false, right: false, run: false };
        this.touch = {
            joystickActive: false,
            joystickOrigin: { x: 0, y: 0 },
            joystickDelta: { x: 0, y: 0 },
            lookActive: false,
            lastLook: { x: 0, y: 0 },
            startLook: { x: 0, y: 0 },
            moved: false
        };

        this.colliders = [];
        this.interactivePoints = [];
        this.upgradeMeshes = {};
        this.particles = [];
        this.textures = {};
        this.activeBeacon = null;

        this.setupRoomDefinitions();
        this.setupRenovationDefinitions();
        this.loadState();

        const activeTask = this.getAreaActiveTask(this.currentRoom);
        if (activeTask) {
            this.selectedAreaId = activeTask.id;
        }

        this.initAudio();
        this.initThreeEngine();
        this.buildHotelEnvironment3D();
        this.setupControls3D();
        this.setupMinimap();

        this.closeBottomDesignDock();
        this.jumpTo(this.currentRoom, true);
        this.updateHUD();
        this.updateProximityPanel();
        this.renderHotelAreaCards();

        if (window.GameEconomy) {
            window.GameEconomy.subscribe(() => {
                this.state.coins = window.GameEconomy.getBalance();
                this.state.stars = window.GameEconomy.getStars();
                this.updateHUD();
                this.refreshBeaconColors();
                this.checkAffordableNotifications();
                if (this.isRenovationDockOpen) {
                    this.renderBottomDesignDock();
                }
                this.updateProximityPanel();
                this.renderHotelAreaCards();
            });
            setTimeout(() => this.checkAffordableNotifications(true), 800);
        }

        setInterval(() => {
            this.updateEconomy();
        }, 1000);

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    // ----------------------------------------------------
    // 1. HOTEL ROOMS & CAMERA WAYPOINTS
    // ----------------------------------------------------
    setupRoomDefinitions() {
        this.rooms = {
            lobby: {
                id: 'lobby',
                name: 'Aurelia Palace Büyük Lobi & Resepsiyon Salonu',
                shortName: '🏛️ Büyük Lobi',
                floorLabel: 'Zemin Kat · Merkez Kanat (6 Aşamalı Tadilat)',
                bgImg: 'assets/scene_lobby_reception.jpg',
                mapPos: { x: 50, y: 66 },
                spawnPos: { x: -0.6, y: 1.72, z: 8.4, yaw: 0.02, pitch: -0.02, floor: 1 },
                description: 'Başlangıçta boş, tozlu ve kirli olan lobiyi adım adım tadilat yaparak 85+ lüks eşyalı modern mermer resepsiyon ve lounge salonuna dönüştürün!',
                dialogue: 'Büyük Lobi: Alan önce boş ve kirli! Adım adım zemin mermerlerini, ceviz resepsiyon bankosunu, 4 halkalı avizeleri ve çok sayıda koltuk/sehpa/bitki takımını kurarak ortamı güzelleştirin!',
                tasks: ['lobby_floor_walls', 'reception_desk', 'lobby_chandelier', 'lobby_carpet', 'lobby_columns', 'lobby_back_vista']
            },
            restaurant: {
                id: 'restaurant',
                name: 'Riviera Gurme Restoran & Şampanya Barı',
                shortName: '🍷 Riviera Restoran',
                floorLabel: 'Zemin Kat · Doğu Terası',
                bgImg: 'assets/scene_restaurant_pool.jpg',
                mapPos: { x: 80, y: 60 },
                spawnPos: { x: 16.5, y: 1.75, z: 4.8, yaw: -0.35, pitch: -0.08, floor: 1 },
                description: 'Monako yat limanı manzaralı açık hava lüks gurme restoranı.',
                dialogue: 'Riviera Restoran: 3D salonda serbestçe dolaşın, yemek masalarını ve şampanya barını 3 farklı lüks tasarımla yenileyin!',
                tasks: ['restaurant_tables', 'restaurant_bar', 'restaurant_lighting', 'restaurant_terrace']
            },
            room101: {
                id: 'room101',
                name: 'Deluxe Deniz Manzaralı Suit (Oda 101)',
                shortName: '🛏️ Suit 101',
                floorLabel: '1. Kat · Batı Kanadı',
                bgImg: 'assets/scene_presidential_suite.jpg',
                mapPos: { x: 20, y: 60 },
                spawnPos: { x: -19.0, y: 1.75, z: -5.5, yaw: 0.05, pitch: -0.08, floor: 1 },
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
                spawnPos: { x: 0, y: 1.75, z: -14.2, yaw: 0, pitch: -0.1, floor: 1 },
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
                spawnPos: { x: 18.0, y: 1.75, z: -15.5, yaw: 0, pitch: -0.1, floor: 1 },
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
                spawnPos: { x: -12.0, y: 1.75, z: -15.5, yaw: 0, pitch: -0.08, floor: 1 },
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
                spawnPos: { x: 0, y: 7.75, z: 5.8, yaw: 0.1, pitch: -0.08, floor: 2 },
                description: 'Çatı katı suitinde kuyruklu konser piyanosu ve şömine salonu.',
                dialogue: '2. Kat Penthouse: Konser piyanosu ve mermer şömineli salonu kurarak en seçkin gala süitini tamamlayın.',
                tasks: ['penthouse_suite', 'penthouse_fireplace', 'penthouse_terrace']
            }
        };
    }

    // ----------------------------------------------------
    // 2. RENOVATION TASKS WITH 3D COORDINATES & 3 OPTIONS
    // ----------------------------------------------------
    setupRenovationDefinitions() {
        this.renovationDefs = {
            // === RIVIERA RESTORAN ===
            restaurant_tables: {
                id: 'restaurant_tables',
                room: 'restaurant',
                order: 1,
                name: 'Riviera Yemek Masalarını Temizle & Yenile',
                area: 'Riviera Restoran · Görev 1/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                pos: new THREE.Vector3(19.5, 1.0, 1.5),
                camView: { x: 15.8, y: 1.85, z: 5.2, yaw: -0.52, pitch: -0.14 },
                defaultDesc: 'Harabe Halinde: Devrilmiş kırık masalar, tozlu moloz yığınları ve kırık ahşap kalaslar (Temizlik & Yenileme Bekliyor)',
                baseCost: 1200,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Modern Beyaz Yuvarlak Mermer Masa',
                        style: 'Seçenek A · Yuvarlak Modern',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: '⚪',
                        desc: 'Silindirik altın kaideli yuvarlak beyaz İtalyan Carrara mermeri masa ve kavisli modern beyaz koltuklar.',
                        previewImg: 'assets/designs/restaurant_tables_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Klasik Kare Maun Ahşap Masa',
                        style: 'Seçenek B · Klasik Kare Maun',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🟫',
                        desc: '4 oymalı sütun ayaklı klasik kare koyu maun ahşap masa, kapitone bordo deri sandalyeler ve altın şamdan.',
                        previewImg: 'assets/designs/restaurant_tables_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Lüks Oval Mermer & Altın Kafes Masa',
                        style: 'Seçenek C · Lüks Oval Mermer',
                        cost: 1200,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '💎',
                        desc: 'Heykelsi altın kafes tabanlı geniş oval siyah-altın damarlı mermer masa ve turkuaz kadife berjerler.',
                        previewImg: 'assets/designs/restaurant_tables_opt_c.jpg'
                    }
                ]
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                room: 'restaurant',
                order: 2,
                name: 'Şampanya & Kokteyl Barını Enkazdan Kurtar',
                area: 'Riviera Restoran · Görev 2/4',
                sceneImg: 'assets/scene_restaurant_bar.jpg',
                pos: new THREE.Vector3(20.0, 1.2, -6.0),
                camView: { x: 19.5, y: 1.8, z: -1.2, yaw: -0.08, pitch: -0.1 },
                defaultDesc: 'Harabe Halinde: Çökmüş bar tezgâhı, kırık şişe kasaları ve tozlu molozlar (Yenilenmedi)',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Modern Lineer Amber Oniks & LED Bar',
                        style: 'Seçenek A · Lineer Oniks',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🍸',
                        desc: 'Sıcak gizli LED aydınlatmalı düz kesim kehribar oniks mermer tezgâh ve silindirik altın bar tabureleri.',
                        previewImg: 'assets/designs/restaurant_bar_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kavisli At Nalı Maun & Zümrüt Mermer Bar',
                        style: 'Seçenek B · Kavisli Klasik',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '🍾',
                        desc: 'Yarım daire kavisli koyu maun ve zümrüt mermer bar adası, sırtlıklı bordo kadife bar koltukları.',
                        previewImg: 'assets/designs/restaurant_bar_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Altıgen Kristal Cam & Fırçalanmış Bronz Ada Bar',
                        style: 'Seçenek C · Geometrik Ada',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 95,
                        icon: '🥂',
                        desc: 'Çokgen kesimli füme kristal cam ve bronz ada bar ile tavandan sarkan ışıklı içki rafı.',
                        previewImg: 'assets/designs/restaurant_bar_opt_c.jpg'
                    }
                ]
            },
            restaurant_lighting: {
                id: 'restaurant_lighting',
                room: 'restaurant',
                order: 3,
                name: 'Teras Sarkıt Avizeleri & Gizli LED Tavan',
                area: 'Riviera Restoran · Görev 3/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                pos: new THREE.Vector3(20.5, 3.6, 0.5),
                camView: { x: 16.0, y: 1.75, z: 5.5, yaw: -0.58, pitch: 0.22 },
                defaultDesc: 'Harabe Halinde: Sarkan kopuk kablolar ve kırık tavan armatürleri',
                baseCost: 1500,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '4 Halkalı Modern Sarkıt LED Avize',
                        style: 'Seçenek A · Halkalı LED',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '✨',
                        desc: 'Referans lüks otel tarzında 4 kademeli konsantrik sıcak LED ışık halkaları.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Klasik 12 Kollu İmparatorluk Kristal Avizesi',
                        style: 'Seçenek B · Klasik Kristal',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 68,
                        icon: '🕯️',
                        desc: 'Katmanlı prizma kristallerden oluşan mum kollu geleneksel saray avizesi.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Heykelsi Asimetrik Altın Işık Tüpleri & Küreler',
                        style: 'Seçenek C · Heykelsi Küre',
                        cost: 1500,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🏮',
                        desc: 'Çapraz kesişen fırçalanmış altın ışık barları ve havada asılı opal cam küreler.',
                        previewImg: 'assets/designs/restaurant_lighting_opt_c.jpg'
                    }
                ]
            },
            restaurant_terrace: {
                id: 'restaurant_terrace',
                room: 'restaurant',
                order: 4,
                name: 'Mermer Teras Zemini & Tropikal Bitkiler',
                area: 'Riviera Restoran · Görev 4/4',
                sceneImg: 'assets/scene_restaurant_pool.jpg',
                pos: new THREE.Vector3(24.5, 0.9, 1.5),
                camView: { x: 18.5, y: 1.75, z: 5.5, yaw: -0.78, pitch: -0.12 },
                defaultDesc: 'Harabe Halinde: Çatlamış beton zemin, kurumuş saksılar ve moloz taşları',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Cilalı Damarlı Mermer & Antrasit Saksıda Palmiyeler',
                        style: 'Seçenek A · Modern Mermer',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: '🌴',
                        desc: 'Yansımalı cilalı mermer zemin ve mat antrasit saksılarda dev tropikal salon palmiyeleri.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Bordo Protokol Yolu & Altın Sütun Saksılar',
                        style: 'Seçenek B · Klasik Bordo',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 100,
                        icon: '🌹',
                        desc: 'Altın bordürlü bordo kadife protokol halısı ve yüksek altın kaidelerde kırmızı gül küreleri.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Doğal Tik Ahşap Güverte & Kare Taş Saksıda Zeytin Ağaçları',
                        style: 'Seçenek C · Doğal Ahşap',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 110,
                        icon: '🍋',
                        desc: 'Masif yat güvertesi tik ahşap zemin ve kare traverten saksılarda Akdeniz ağaçları.',
                        previewImg: 'assets/designs/restaurant_terrace_opt_c.jpg'
                    }
                ]
            },

            // === BÜYÜK LOBİ & RESEPSİYON (6 AŞAMALI TADİLAT: ÖNCE BOŞ VE KİRLİ -> 85+ LÜKS EŞYALI SALON) ===
            lobby_floor_walls: {
                id: 'lobby_floor_walls',
                room: 'lobby',
                order: 1,
                name: 'Zemin Temizliği, İki Tonlu Cilalı Mermer & Panoramik Perdeler',
                area: 'Büyük Lobi · Görev 1/6',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                pos: new THREE.Vector3(0.2, 0.25, 3.8),
                camView: { x: -0.6, y: 1.72, z: 8.4, yaw: 0.02, pitch: -0.12 },
                defaultDesc: 'Önce Boş ve Kirli: Çatlak, çamurlu ve tozlu beton zemin, boya kovaları, temizlik malzemeleri ve çıplak pencereler',
                baseCost: 600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'İki Tonlu Damarlı Carrara & Antrasit Mermer Zemin + Tül Perdeler',
                        style: 'Seçenek A · Referans Görsel Mermeri',
                        cost: 600,
                        stars: 1,
                        incomeBoost: 25,
                        repBoost: 45,
                        icon: '✨',
                        desc: 'Referans görseldeki gibi ön alanda koyu gri damarlı mermer, ana salonda krem Carrara mermeri, ayna parlaklığında yansımalar ve boydan boya tül perdeler.',
                        previewImg: 'assets/designs/reception_desk_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Nero Marquina & Altın Bordürlü Saray Mermeri',
                        style: 'Seçenek B · Siyah & Altın Mermer',
                        cost: 600,
                        stars: 1,
                        incomeBoost: 30,
                        repBoost: 50,
                        icon: '👑',
                        desc: 'Altın geometrik bordürlü siyah İspanyol mermeri zemin ve bordo kadife fon perdeler.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Balıksırtı Masif Meşe Parke & Traverten Mermer Geçişi',
                        style: 'Seçenek C · Sıcak Ahşap & Traverten',
                        cost: 600,
                        stars: 1,
                        incomeBoost: 28,
                        repBoost: 48,
                        icon: '🪵',
                        desc: 'Sıcak İskandinav meşe parke, doğal traverten taş bordürler ve keten tül perdeler.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg'
                    }
                ]
            },
            reception_desk: {
                id: 'reception_desk',
                room: 'lobby',
                order: 2,
                name: 'Sol Duvar: Mermer Resepsiyon Bankosu, Ceviz Duvar, Işıklı Logo & 3 iMac',
                area: 'Büyük Lobi · Görev 2/6',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                pos: new THREE.Vector3(-5.2, 1.1, -1.2),
                camView: { x: -0.4, y: 1.72, z: 5.8, yaw: 0.42, pitch: -0.04 },
                defaultDesc: 'Önce Boş ve Kirli: Sol duvarda dökülmüş sıva izleri, yerlerde toz öbekleri, kırık tahta kasalar ve boş banko yeri',
                baseCost: 800,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Damarlı Mermer & Ceviz Banko + 3 iMac + Işıklı Logo + 4 Raf + 2 Palmiye',
                        style: 'Seçenek A · Referans Görsel Bankosu',
                        cost: 800,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '🏛️',
                        desc: 'Referans görseldeki gibi sol boyunca uzanan beyaz damarlı mermer ve ceviz banko, 3 iMac bilgisayar, 2 abajur, arkada ışıklı M/V logolu ceviz duvar, 4 dekoratif raf ve 2 dev palmiye.',
                        previewImg: 'assets/designs/reception_desk_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kavisli Siyah Oniks & Altın Yivli Kraliyet Bankosu + Kristal Abajurlar',
                        style: 'Seçenek B · Kavisli Siyah Oniks',
                        cost: 800,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '👑',
                        desc: 'Kavisli siyah-altın oniks mermer banko, 3 altın çerçeveli ekran, kristal küre lambalar ve maun kütüphane rafları.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Asimetrik Füme Kristal Cam & Bronz Banko + Bonsai Aranjmanı',
                        style: 'Seçenek C · Füme Cam & Bronz',
                        cost: 800,
                        stars: 1,
                        incomeBoost: 42,
                        repBoost: 70,
                        icon: '💎',
                        desc: 'V-formunda konsol yükselen füme kristal cam ve fırçalanmış bronz banko, 3 ultra-ince ekran ve ışıklı nişler.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg'
                    }
                ]
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                room: 'lobby',
                order: 3,
                name: 'Tavan Havuz LED Aydınlatma, Spot Rayları & 4 Halkalı Sarkıt Avizeler',
                area: 'Büyük Lobi · Görev 3/6',
                sceneImg: 'assets/scene_lobby_chandelier.jpg',
                pos: new THREE.Vector3(0.4, 5.2, -1.0),
                camView: { x: -0.4, y: 1.72, z: 7.8, yaw: 0.02, pitch: 0.16 },
                defaultDesc: 'Önce Boş ve Kirli: Karanlık ve isli tavan boşluğu, sarkan kablolar ve sönük şantiye lambası',
                baseCost: 900,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '4 Kademeli Sarkıt Halka LED Avize + Gizli Havuz LED + Siyah Spot Rayları',
                        style: 'Seçenek A · Referans 4 Halkalı LED',
                        cost: 900,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '⭕',
                        desc: 'Referans görseldeki gibi yüksek tavan havuzunda sıcak gizli LED ışık, 2 paralel siyah spot rayı ve kademeli sarkan 4 ışıklı halka avize.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Klasik İmparatorluk Bohemya Kristal Saray Avizesi Seti',
                        style: 'Seçenek B · Klasik Kristal Tacı',
                        cost: 900,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🕯️',
                        desc: '12 altın mum kollu, şelale gibi sarkan kesme Bohemya kristalli ikili saray avizesi.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Heykelsi Geometrik Altın Işık Barları & Süzülen Opal Küreler',
                        style: 'Seçenek C · Geometrik Küreler',
                        cost: 900,
                        stars: 1,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: '✨',
                        desc: 'Asimetrik kesişen fırçalanmış altın ışık tüpleri ve tavandan süzülen 12 sıcak opal cam küre.',
                        previewImg: 'assets/designs/lobby_chandelier_opt_c.jpg'
                    }
                ]
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                room: 'lobby',
                order: 4,
                name: 'Sağ Ön Lounge: Dalgalı Halı, 3\'lü Kanepe, 2 Berjer, Mermer Sehpa & Palmiyeler',
                area: 'Büyük Lobi · Görev 4/6',
                sceneImg: 'assets/scene_lobby_carpet.jpg',
                pos: new THREE.Vector3(4.2, 0.45, 2.8),
                camView: { x: -0.8, y: 1.75, z: 8.2, yaw: -0.32, pitch: -0.1 },
                defaultDesc: 'Önce Boş ve Kirli: Sağ ön cam kenarında toz birikintileri, karton kutular, boya lekeleri ve boş zemin',
                baseCost: 950,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Antrasit 3\'lü Kanepe (5 Yastıklı) + 2 Berjer + Mermer Sehpa + Dalgalı Halı',
                        style: 'Seçenek A · Referans Ön Lounge',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🛋️',
                        desc: 'Referans görseldeki gibi altın topoğrafik dalgalı gri halı, 5 kırlentli geniş antrasit kanepe, 2 derin berjer, üzerinde kitap/tepsi/karaf bulunan mermer sehpa ve dev palmiye.',
                        previewImg: 'assets/designs/lobby_carpet_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Klasik Bordo Chesterfield Kanepe & Berjerler + Kare Oyma Maun Sehpa',
                        style: 'Seçenek B · Klasik Bordo & Maun',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '👑',
                        desc: 'Kraliyet bordo protokol halısı, kapitone bordo kadife Chesterfield kanepe, 2 berjer ve altın şamdanlı maun sehpa.',
                        previewImg: 'assets/designs/lobby_carpet_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Organik Kavisli Krem Bukle Kanepe + Turkuaz Berjerler + Oval Cam Sehpa',
                        style: 'Seçenek C · Kavisli Krem & Oval Cam',
                        cost: 950,
                        stars: 1,
                        incomeBoost: 52,
                        repBoost: 85,
                        icon: '🌿',
                        desc: 'Kavisli organik krem bukle (bouclé) kanepe, turkuaz kadife berjerler ve altın kafesli oval cam sehpa.',
                        previewImg: 'assets/designs/lobby_carpet_opt_c.jpg'
                    }
                ]
            },
            lobby_columns: {
                id: 'lobby_columns',
                room: 'lobby',
                order: 5,
                name: 'Sağ Orta Lounge: 2. Kanepe Grubu, 2 Lacivert Berjer, Sehpa, Halı & Bitkiler',
                area: 'Büyük Lobi · Görev 5/6',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                pos: new THREE.Vector3(4.2, 0.45, -3.2),
                camView: { x: -0.2, y: 1.75, z: 3.2, yaw: -0.45, pitch: -0.08 },
                defaultDesc: 'Önce Boş ve Kirli: Orta salonda inşaat tozları, muşamba örtü, merdiven ve boş zemin',
                baseCost: 1100,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: '2. Lüks Kanepe Grubu + 2 Lacivert Berjer + Mermer Sehpa + 2 Palmiye',
                        style: 'Seçenek A · Referans Orta Lounge',
                        cost: 1100,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 80,
                        icon: '🌴',
                        desc: 'Referans görselin orta aksındaki ikinci dalgalı halı, kırlentli kanepe, 2 lacivert/antrasit berjer, mermer orta sehpa, yan sehpa ve cam kenarı tropikal palmiyeler.',
                        previewImg: 'assets/designs/lobby_columns_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Kadife Kraliyet Salonu + Silindirik Oniks Sütunlar & Maun Sehpa',
                        style: 'Seçenek B · Zümrüt & Siyah Oniks',
                        cost: 1100,
                        stars: 1,
                        incomeBoost: 55,
                        repBoost: 90,
                        icon: '🏛️',
                        desc: 'Zümrüt yeşili kapitone kanepe ve berjerler, siyah oniks mermer sehpa ve altın başlıklı sütunlar.',
                        previewImg: 'assets/designs/lobby_columns_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Karamel Deri & Ceviz Lounge Takımı + Oval Mermer Sehpa',
                        style: 'Seçenek C · Karamel Deri & Ceviz',
                        cost: 1100,
                        stars: 1,
                        incomeBoost: 58,
                        repBoost: 95,
                        icon: '💎',
                        desc: 'İtalyan karamel deri kanepe ve koltuklar, oval siyah mermer sehpa ve zeytin ağaçları.',
                        previewImg: 'assets/designs/lobby_columns_opt_c.jpg'
                    }
                ]
            },
            lobby_back_vista: {
                id: 'lobby_back_vista',
                room: 'lobby',
                order: 6,
                name: 'Arka Hol: Konsol & Tablolar, Merdiven Önü Berjerler, Asansör & Asma Kat',
                area: 'Büyük Lobi · Görev 6/6',
                sceneImg: 'assets/scene_lobby_reception.jpg',
                pos: new THREE.Vector3(1.2, 1.2, -10.8),
                camView: { x: 0.0, y: 1.75, z: -2.5, yaw: 0.0, pitch: -0.03 },
                defaultDesc: 'Önce Boş ve Kirli: Arka koridorda karanlık duvarlar, korkuluksuz merdiven boşluğu ve boş asansör önü',
                baseCost: 1250,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Merdiven Önü 2 Berjer + Sol Konsol & 2 Abajur + 2 Tablo + Cam Korkuluklar',
                        style: 'Seçenek A · Referans Arka Hol & Merdiven',
                        cost: 1250,
                        stars: 2,
                        incomeBoost: 65,
                        repBoost: 110,
                        icon: '🖼️',
                        desc: 'Referans görselin arka planındaki ahşap merdivenler, merdiven önü 2 mavi berjer ve yuvarlak sehpa, sol koridorda 2 abajurlu konsol ve 2 modern tablo, bronz asansör ve 2. kat cam korkuluklar.',
                        previewImg: 'assets/designs/reception_desk_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Altın Korkuluklu Merdiven + Bordo Berjerler + Klasik Yağlıboya Tablolar',
                        style: 'Seçenek B · Altın & Klasik Galeri',
                        cost: 1250,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 120,
                        icon: '👑',
                        desc: 'Altın ferforje merdiven ve balkon korkulukları, bordo berjerler, maun konsol ve altın çerçeveli tablolar.',
                        previewImg: 'assets/designs/reception_desk_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Modern Heykel Galerisi + Krem Berjerler + Kristal Asansör Holü',
                        style: 'Seçenek C · Modern Sanat Galerisi',
                        cost: 1250,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 130,
                        icon: '✨',
                        desc: 'Aydınlatmalı sanat nişleri, krem bukle berjerler, mermer heykel kaideleri ve panoramik asansör girişi.',
                        previewImg: 'assets/designs/reception_desk_opt_c.jpg'
                    }
                ]
            },

            // === DELUXE SUIT 101 ===
            room101_bed: {
                id: 'room101_bed',
                room: 'room101',
                order: 1,
                name: 'Deluxe Suit Kraliyet Yatağı',
                area: 'Suit 101 · Görev 1/3',
                sceneImg: 'assets/scene_presidential_suite.jpg',
                pos: new THREE.Vector3(-19.0, 1.1, -12.0),
                camView: { x: -19.0, y: 1.75, z: -6.5, yaw: 0, pitch: -0.1 },
                defaultDesc: 'Standart eski karyola ve sade başlık',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Fildişi İpek & Altın Sayvanlı Kral Yatağı',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '🛏️',
                        desc: 'Fildişi ipek nevresimler, altın çerçeveli yatak başlığı ve yumuşak gizli LED aydınlatma.',
                        previewImg: 'assets/designs/room101_bed_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Bordo Kadife & 4 Direkli Cibinlikli Yatak',
                        style: 'Kraliyet Kadife',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 48,
                        repBoost: 72,
                        icon: '👑',
                        desc: 'Dört köşesinde altın pirinç sütunlar, bordo kapitone başlık ve tül cibinlik.',
                        previewImg: 'assets/designs/room101_bed_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Turkuaz & Ceviz Platform Yatak',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 44,
                        repBoost: 68,
                        icon: '🌊',
                        desc: 'Masif ceviz gövde, turkuaz ipek yastıklar ve panoramik deniz uyumu.',
                        previewImg: 'assets/designs/room101_bed_opt_c.jpg'
                    }
                ]
            },
            room101_decor: {
                id: 'room101_decor',
                room: 'room101',
                order: 2,
                name: 'Panoramik Deniz Balkonu & Şezlonglar',
                area: 'Suit 101 · Görev 2/3',
                sceneImg: 'assets/scene_suite_terrace.jpg',
                pos: new THREE.Vector3(-21.0, 1.0, -7.0),
                camView: { x: -17.5, y: 1.75, z: -4.2, yaw: 0.72, pitch: -0.14 },
                defaultDesc: 'Boş pencere önü ve eski sehpa',
                baseCost: 1400,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem Berjerler & Altın Şampanya Sehpası',
                        style: 'Modern Zarafet',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 50,
                        icon: '🥂',
                        desc: 'Krem kadife berjerler, yuvarlak altın mermer sehpa ve gümüş kovada şampanya ikramı.',
                        previewImg: 'assets/designs/room101_decor_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Zümrüt Kadife VIP Dinlenme Köşesi',
                        style: 'Kraliyet Kadife',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 42,
                        repBoost: 62,
                        icon: '💎',
                        desc: 'Zümrüt yeşili kapitone koltuklar, siyah mermer sehpa ve kristal şamdan.',
                        previewImg: 'assets/designs/room101_decor_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Riviera Tik Ağacı & Beyaz Keten Teras Takımı',
                        style: 'Klasik Premium',
                        cost: 1400,
                        stars: 1,
                        incomeBoost: 38,
                        repBoost: 56,
                        icon: '🌴',
                        desc: 'El işçiliği tik ağacı şezlonglar, beyaz keten minderler ve Akdeniz esintisi.',
                        previewImg: 'assets/designs/room101_decor_opt_c.jpg'
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
                pos: new THREE.Vector3(-26.5, 1.2, -11.0),
                camView: { x: -21.5, y: 1.75, z: -8.5, yaw: 1.15, pitch: -0.08 },
                defaultDesc: 'Boş oda köşesi ve sönük ışıklar',
                baseCost: 1800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermer Şömine & Altın Ayna',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🔥',
                        desc: 'Beyaz İtalyan mermeri şömine, üzerinde altın varaklı boy aynası ve sıcak ateş.',
                        previewImg: 'assets/designs/room101_lounge_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Nero Mermer Şömine & Kristal Aplikler',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '🕯️',
                        desc: 'Siyah mermer şömine, bordo kadife puf ve elmas kesim gece lambaları.',
                        previewImg: 'assets/designs/room101_lounge_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Klasik Ceviz Şömine & Kitaplık Köşesi',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 2,
                        incomeBoost: 48,
                        repBoost: 75,
                        icon: '📚',
                        desc: 'Oyma ceviz şömine çerçevesi, sıcak abajurlar ve özel koleksiyon kitaplığı.',
                        previewImg: 'assets/designs/room101_lounge_opt_c.jpg'
                    }
                ]
            },

            // === SONSUZLUK HAVUZU ===
            swimming_pool: {
                id: 'swimming_pool',
                room: 'pool',
                order: 1,
                name: 'Sonsuzluk Havuzu & Mozaik Zemin',
                area: 'Sonsuzluk Havuzu · Görev 1/3',
                sceneImg: 'assets/scene_infinity_pool.jpg',
                pos: new THREE.Vector3(0, 0.8, -22.0),
                camView: { x: 0, y: 1.85, z: -14.2, yaw: 0, pitch: -0.14 },
                defaultDesc: 'Bakımsız havuz ve boş teras',
                baseCost: 3500,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Kristal Cam Kenarlı & Turkuaz Sonsuzluk Havuzu',
                        style: 'Modern Zarafet',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 110,
                        icon: '🌊',
                        desc: 'Şeffaf cam korkuluklu sonsuzluk havuzu, su altı LED aydınlatma ve beyaz şezlonglar.',
                        previewImg: 'assets/designs/swimming_pool_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: '24K Altın Mozaikli Kraliyet Saray Havuzu',
                        style: 'Kraliyet Kadife',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        icon: '👑',
                        desc: 'Tabanı altın mozaik döşeli havuz, bordo güneş şemsiyeleri ve altın fıskiyeler.',
                        previewImg: 'assets/designs/swimming_pool_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Doğal Taş Lagün & Palmiye Havuzu',
                        style: 'Klasik Premium',
                        cost: 3500,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 118,
                        icon: '🌴',
                        desc: 'Zümrüt yeşili lagün suyu, doğal traverten kenarlar ve tik ağacı güneşlenme terası.',
                        previewImg: 'assets/designs/swimming_pool_opt_c.jpg'
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
                pos: new THREE.Vector3(6.5, 1.2, -18.5),
                camView: { x: 2.2, y: 1.75, z: -13.5, yaw: -0.68, pitch: -0.1 },
                defaultDesc: 'Eski plastik şezlonglar',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz İpek Tüllü Modern VIP Localar',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '🏖️',
                        desc: 'Uçuşan beyaz ipek perdeli VIP kabanalar ve soğuk şampanya servis üniteleri.',
                        previewImg: 'assets/designs/pool_cabanas_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Bordo & Altın Gölgelikli Localar',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '👑',
                        desc: 'Bordo kadife minderli altın direkli kraliyet locaları ve özel güneş şemsiyeleri.',
                        previewImg: 'assets/designs/pool_cabanas_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Monako Mavi & Beyaz Çizgili Riviera Kabanalar',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '⛵',
                        desc: 'Fransız Rivierası tarzı lacivert-beyaz tenteli ahşap kabanalar.',
                        previewImg: 'assets/designs/pool_cabanas_opt_c.jpg'
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
                pos: new THREE.Vector3(-6.5, 1.0, -18.5),
                camView: { x: -2.2, y: 1.75, z: -13.5, yaw: 0.68, pitch: -0.1 },
                defaultDesc: 'Boş beton teras kenarı',
                baseCost: 2400,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Mermer Gömme Ateş Çukuru & Modern Lounge',
                        style: 'Modern Zarafet',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 60,
                        repBoost: 90,
                        icon: '🔥',
                        desc: 'Beyaz mermer dairesel ateş çukuru ve etrafında modern alçak oturma grubu.',
                        previewImg: 'assets/designs/pool_lounge_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Meşaleli & Siyah Oniks Havuz Barı',
                        style: 'Kraliyet Kadife',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 68,
                        repBoost: 100,
                        icon: '🍸',
                        desc: 'Siyah oniks taşlı ateş şöminesi ve altın meşalelerle çevrili VIP gece locası.',
                        previewImg: 'assets/designs/pool_lounge_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Taş Ateş Çukuru & Bambu Koltuklar',
                        style: 'Klasik Premium',
                        cost: 2400,
                        stars: 2,
                        incomeBoost: 64,
                        repBoost: 95,
                        icon: '🌴',
                        desc: 'Doğal taş ateş çukuru, turkuaz minderli bambu koltuklar ve fenerler.',
                        previewImg: 'assets/designs/pool_lounge_opt_c.jpg'
                    }
                ]
            },

            // === ZEN TERMAL SPA ===
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                room: 'spa',
                order: 1,
                name: 'Aurelia Termal Jakuzi Havuzu',
                area: 'Zen Spa · Görev 1/3',
                sceneImg: 'assets/scene_spa_wellness.jpg',
                pos: new THREE.Vector3(18.0, 1.0, -22.0),
                camView: { x: 18.0, y: 1.75, z: -16.2, yaw: 0, pitch: -0.14 },
                defaultDesc: 'Henüz termal jakuzi kurulumu yapılmamış',
                baseCost: 2800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Carrara Mermeri Hidroterapi Jakuzisi',
                        style: 'Modern Zarafet',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 55,
                        repBoost: 85,
                        icon: '♨️',
                        desc: 'Gömme İtalyan mermeri, altın su jetleri ve su altı aromaterapi ışıklandırması.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Mozaikli & Gül Yapraklı Kraliyet Jakuzisi',
                        style: 'Kraliyet Kadife',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 62,
                        repBoost: 95,
                        icon: '🌹',
                        desc: '24 ayar altın mozaik kaplama, kırmızı gül yaprakları ve mum ışığı ambiyansı.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Japon Sedir Ağacı Onsen & Doğal Taş Jakuzi',
                        style: 'Klasik Premium',
                        cost: 2800,
                        stars: 2,
                        incomeBoost: 58,
                        repBoost: 90,
                        icon: '🎋',
                        desc: 'Aromatik sedir ağacı gövde, sıcak nehir taşları ve huzur veren termal buhar.',
                        previewImg: 'assets/designs/spa_jacuzzi_opt_c.jpg'
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
                pos: new THREE.Vector3(15.2, 0.9, -24.5),
                camView: { x: 17.5, y: 1.75, z: -18.5, yaw: 0.42, pitch: -0.14 },
                defaultDesc: 'Boş dinlenme köşesi',
                baseCost: 1800,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Isıtmalı Beyaz Mermer Masaj & Dinlenme Yatakları',
                        style: 'Modern Zarafet',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 60,
                        icon: '💆',
                        desc: 'Ergonomik ısıtmalı mermer şezlonglar, ipek havlular ve orkide aranjmanları.',
                        previewImg: 'assets/designs/spa_beds_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife & Altın Tütsülük VIP Masaj Locaları',
                        style: 'Kraliyet Kadife',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '🕯️',
                        desc: 'Kraliyet bordosu masaj yatakları, altın buhurdanlıklar ve sıcak taş seti.',
                        previewImg: 'assets/designs/spa_beds_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tik Ağacı & Yeşil Bambu Zen Yatakları',
                        style: 'Klasik Premium',
                        cost: 1800,
                        stars: 1,
                        incomeBoost: 42,
                        repBoost: 65,
                        icon: '🌿',
                        desc: 'Doğal tik ağacı masaj yatakları, organik keten örtüler ve bambu dekoru.',
                        previewImg: 'assets/designs/spa_beds_opt_c.jpg'
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
                pos: new THREE.Vector3(21.2, 1.8, -24.5),
                camView: { x: 17.8, y: 1.75, z: -18.5, yaw: -0.48, pitch: -0.04 },
                defaultDesc: 'Sade taş duvar',
                baseCost: 2200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Aydınlatmalı Pembe Himalaya Tuz Duvarı & Şelale',
                        style: 'Modern Zarafet',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 75,
                        icon: '✨',
                        desc: 'Arkadan sıcak kehribar ışıklı Himalaya tuz tuğlaları ve mermer su perdesi.',
                        previewImg: 'assets/designs/spa_waterfall_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Aslan Başlı Kraliyet Termal Şelalesi',
                        style: 'Kraliyet Kadife',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 56,
                        repBoost: 85,
                        icon: '🦁',
                        desc: 'Siyah mermer duvar üzerinde 24K altın oluklardan akan sıcak termal kaynak suyu.',
                        previewImg: 'assets/designs/spa_waterfall_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Tropikal Bambu & Doğal Kaya Şelalesi',
                        style: 'Klasik Premium',
                        cost: 2200,
                        stars: 2,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '🌊',
                        desc: 'Doğal kayalardan süzülen şelale, nilüfer çiçekleri ve canlı eğrelti otları.',
                        previewImg: 'assets/designs/spa_waterfall_opt_c.jpg'
                    }
                ]
            },

            // === BOTANİK BAHÇE ===
            garden_courtyard: {
                id: 'garden_courtyard',
                room: 'garden',
                order: 1,
                name: '3 Katlı Mermer Saray Çeşmesi',
                area: 'Botanik Bahçe · Görev 1/3',
                sceneImg: 'assets/scene_garden_terrace.jpg',
                pos: new THREE.Vector3(-12.0, 1.2, -22.0),
                camView: { x: -12.0, y: 1.75, z: -16.0, yaw: 0, pitch: -0.1 },
                defaultDesc: 'Kurumuş çalılar ve çalışmayan taş çeşme',
                baseCost: 2000,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz İtalyan Mermeri 3 Katlı Fıskiyeli Çeşme',
                        style: 'Modern Zarafet',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 45,
                        repBoost: 70,
                        icon: '⛲',
                        desc: 'Berrak turkuaz havuzlu, 3 katlı beyaz Carrara mermeri saray çeşmesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Varaklı & Kırmızı Güllü Kraliyet Çeşmesi',
                        style: 'Kraliyet Kadife',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 52,
                        repBoost: 80,
                        icon: '🌹',
                        desc: '24 ayar altın varaklı çeşme gövdesi ve etrafında kırmızı kadife gül bahçesi.',
                        previewImg: 'assets/designs/garden_courtyard_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Mozaikli & Limon Ağaçlı Avlu Çeşmesi',
                        style: 'Klasik Premium',
                        cost: 2000,
                        stars: 1,
                        incomeBoost: 48,
                        repBoost: 75,
                        icon: '🍋',
                        desc: 'Mavi-beyaz çini mozaikli çeşme ve terrakota saksılarda kokulu limon ağaçları.',
                        previewImg: 'assets/designs/garden_courtyard_opt_c.jpg'
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
                pos: new THREE.Vector3(-9.2, 1.4, -22.0),
                camView: { x: -12.0, y: 1.75, z: -16.2, yaw: -0.45, pitch: -0.06 },
                defaultDesc: 'Bakımsız toprak patika',
                baseCost: 1600,
                starsNeeded: 1,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Beyaz Mermer Kemerli & Beyaz Güllü Pergola',
                        style: 'Modern Zarafet',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 35,
                        repBoost: 55,
                        icon: '🌸',
                        desc: 'Beyaz mermer sütunlu pergola, fildişi sarmaşık güller ve aydınlatmalı taş yol.',
                        previewImg: 'assets/designs/garden_pergola_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Ferforje & Kırmızı Kadife Gül Kemeri',
                        style: 'Kraliyet Kadife',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 40,
                        repBoost: 65,
                        icon: '🌹',
                        desc: 'Altın işlemeli ferforje kemerler ve yoğun kırmızı Monako gülleri.',
                        previewImg: 'assets/designs/garden_pergola_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Sedir Ağacı & Mor Begonvil Riviera Pergolası',
                        style: 'Klasik Premium',
                        cost: 1600,
                        stars: 1,
                        incomeBoost: 38,
                        repBoost: 60,
                        icon: '🌺',
                        desc: 'Doğal ahşap pergola, sarkan mor begonviller ve Akdeniz çakıl taşı yürüyüş yolu.',
                        previewImg: 'assets/designs/garden_pergola_opt_c.jpg'
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
                pos: new THREE.Vector3(-15.0, 1.2, -22.0),
                camView: { x: -11.5, y: 1.75, z: -16.2, yaw: 0.52, pitch: -0.08 },
                defaultDesc: 'Boş çim alan',
                baseCost: 2100,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Cam Kubbeli & Beyaz Mermer Çay Köşkü',
                        style: 'Modern Zarafet',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 48,
                        repBoost: 72,
                        icon: '🫖',
                        desc: 'Zarif beyaz mermer kameriye, porselen çay takımı ve kristal bahçe fenerleri.',
                        previewImg: 'assets/designs/garden_pavilion_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Altın Kubbeli Kraliyet Gazebo & Kadife Koltuklar',
                        style: 'Kraliyet Kadife',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 54,
                        repBoost: 82,
                        icon: '👑',
                        desc: 'Altın kubbeli saray kameriyesi, bordo ipek perdeler ve pirinç şamdanlar.',
                        previewImg: 'assets/designs/garden_pavilion_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Riviera Ahşap Çardak & Bohemya Fenerleri',
                        style: 'Klasik Premium',
                        cost: 2100,
                        stars: 2,
                        incomeBoost: 50,
                        repBoost: 76,
                        icon: '🏮',
                        desc: 'El oyması ahşap çardak, turkuaz minderler ve renkli cam bahçe fenerleri.',
                        previewImg: 'assets/designs/garden_pavilion_opt_c.jpg'
                    }
                ]
            },

            // === 2. KAT BAŞKANLIK PENTHOUSE ===
            penthouse_suite: {
                id: 'penthouse_suite',
                room: 'penthouse',
                order: 1,
                name: 'Kuyruklu Konser Piyanosu',
                area: '2. Kat Penthouse · Görev 1/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                pos: new THREE.Vector3(-4.0, 7.1, 1.5),
                camView: { x: -0.5, y: 7.75, z: 6.2, yaw: 0.58, pitch: -0.12 },
                defaultDesc: 'Üstü örtülü eşyalar, boş teras katı',
                baseCost: 5000,
                starsNeeded: 3,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Parlak Beyaz Lake & 24K Altın Kuyruklu Piyano',
                        style: 'Modern Zarafet',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 120,
                        repBoost: 180,
                        icon: '🎹',
                        desc: 'Saf beyaz lake konser piyanosu, altın iç teller ve kristal nota sehpası.',
                        previewImg: 'assets/designs/penthouse_suite_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Siyah Abanoz & Altın Varaklı Steinway Piyano',
                        style: 'Kraliyet Kadife',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 135,
                        repBoost: 200,
                        icon: '👑',
                        desc: 'Ayna parlaklığında siyah abanoz gövde, 24 ayar altın ayaklar ve bordo kadife tabure.',
                        previewImg: 'assets/designs/penthouse_suite_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Venedik Barok Oyma Maun Konser Piyanosu',
                        style: 'Klasik Premium',
                        cost: 5000,
                        stars: 3,
                        incomeBoost: 128,
                        repBoost: 190,
                        icon: '🎼',
                        desc: 'El oyması kızıl maun gövde, altın varak işlemeler ve klasik konser akustiği.',
                        previewImg: 'assets/designs/penthouse_suite_opt_c.jpg'
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
                pos: new THREE.Vector3(3.2, 7.0, -1.8),
                camView: { x: 0.2, y: 7.75, z: 4.5, yaw: -0.45, pitch: -0.1 },
                defaultDesc: 'Kullanılmayan soğuk şömine ve boş salon',
                baseCost: 3200,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Krem İpek Köşe Koltuk & Bioetanol Mermer Şömine',
                        style: 'Modern Zarafet',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 70,
                        repBoost: 105,
                        icon: '🔥',
                        desc: 'Geniş krem ipek L-koltuk, altın mermer sehpa ve panoramik cam şömine.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Bordo Kadife Kraliyet Salonu & Siyah Oniks Şömine',
                        style: 'Kraliyet Kadife',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 80,
                        repBoost: 120,
                        icon: '🍷',
                        desc: 'Kapitone bordo kadife koltuklar, altın sehpa ve siyah oniks mermer şömine.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Zümrüt Kadife & Ceviz VIP Şömine Salonu',
                        style: 'Klasik Premium',
                        cost: 3200,
                        stars: 2,
                        incomeBoost: 75,
                        repBoost: 112,
                        icon: '💎',
                        desc: 'Zümrüt yeşili kadife kanepe, antika pirinç şömine siperi ve kristal avize.',
                        previewImg: 'assets/designs/penthouse_fireplace_opt_c.jpg'
                    }
                ]
            },
            penthouse_terrace: {
                id: 'penthouse_terrace',
                room: 'penthouse',
                order: 3,
                name: 'Monako Körfezi Özel Manzara Terası',
                area: '2. Kat Penthouse · Görev 3/3',
                sceneImg: 'assets/scene_penthouse_piano.jpg',
                pos: new THREE.Vector3(0, 7.2, -7.5),
                camView: { x: 0, y: 7.75, z: -1.5, yaw: 0, pitch: -0.08 },
                defaultDesc: 'Boş teras korkuluğu',
                baseCost: 3800,
                starsNeeded: 2,
                options: [
                    {
                        id: 'opt_a',
                        name: 'Altın Teleskop & Kristal Şampanya Terası',
                        style: 'Modern Zarafet',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 85,
                        repBoost: 125,
                        icon: '🔭',
                        desc: 'Monako yat limanına bakan pirinç teleskop, beyaz mermer bar ve şampanya standı.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_a.jpg'
                    },
                    {
                        id: 'opt_b',
                        name: 'Kraliyet Kırmızı Halı & Altın Kubbeli VIP Balkon',
                        style: 'Kraliyet Kadife',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 95,
                        repBoost: 140,
                        icon: '👑',
                        desc: 'Altın sütunlu teras kemeri, bordo kadife dinlenme koltukları ve meşaleler.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_b.jpg'
                    },
                    {
                        id: 'opt_c',
                        name: 'Akdeniz Pergolalı & Jakuzili Çatı Terası',
                        style: 'Klasik Premium',
                        cost: 3800,
                        stars: 2,
                        incomeBoost: 90,
                        repBoost: 132,
                        icon: '🥂',
                        desc: 'Çatı katı açık hava barı, tik ağacı şezlonglar ve yıldızlı gece aydınlatması.',
                        previewImg: 'assets/designs/penthouse_terrace_opt_c.jpg'
                    }
                ]
            }
        };
    }

    // ----------------------------------------------------
    // 3. STATE PERSISTENCE & TASK HELPERS
    // ----------------------------------------------------
    loadState() {
        const raw = localStorage.getItem('velvet_gossip_hotel_v5');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.state = Object.assign(this.state, parsed);
                if (!this.state.renovations) this.state.renovations = {};
            } catch (e) {}
        }

        if (window.GameEconomy && window.GameEconomy.data && window.GameEconomy.data.renovations) {
            Object.keys(window.GameEconomy.data.renovations).forEach(k => {
                const r = window.GameEconomy.data.renovations[k];
                if (r && r.completed) {
                    this.state.renovations[k] = r;
                }
            });
        }

        if (window.GameEconomy) {
            this.state.coins = window.GameEconomy.getBalance();
            this.state.stars = window.GameEconomy.getStars();
        }

        this.recalcHotelStats();
    }

    saveState() {
        try {
            localStorage.setItem('velvet_gossip_hotel_v5', JSON.stringify(this.state));
        } catch (e) {}
        this.updateHUD();
    }

    isTaskCompleted(taskId) {
        return Boolean(this.state.renovations && this.state.renovations[taskId] && this.state.renovations[taskId].completed);
    }

    isAreaCompleted(taskId) {
        return this.isTaskCompleted(taskId);
    }

    getInstalledOption(taskId) {
        const saved = this.state.renovations ? this.state.renovations[taskId] : null;
        if (!saved || !saved.completed) return null;
        return {
            optionId: saved.optionId || 'opt_a',
            completed: true
        };
    }

    getActiveOrPreviewOption(taskId) {
        if (this.previewingRenovation && this.previewingRenovation.id === taskId) {
            return this.previewingRenovation.optionId;
        }
        const installed = this.getInstalledOption(taskId);
        if (installed) return installed.optionId;
        if (this.isFullLuxuryPreview) return 'opt_a';
        return null;
    }

    toggleFullLuxuryPreview(forceState) {
        if (typeof forceState === 'boolean') {
            this.isFullLuxuryPreview = forceState;
        } else {
            this.isFullLuxuryPreview = !this.isFullLuxuryPreview;
        }
        const btn = document.getElementById('ghTogglePreviewBtn');
        if (btn) {
            btn.innerHTML = this.isFullLuxuryPreview
                ? '🧹 Gerçek Tadilat Durumuna Dön'
                : '✨ Tam Tadilatlı Lüks Hali Gör';
            btn.classList.toggle('active-preview', this.isFullLuxuryPreview);
        }
        this.rebuildAllRenovations3D();
        this.updateLobbyEnvironmentProgression();
        this.updateProximityPanel();
        if (this.isFullLuxuryPreview) {
            this.showBanner('✨ Tam Tadilatlı Lüks Görünüm Aktif! (85+ Eşya & Cilalı Mermer)');
        } else {
            this.showBanner('🧹 Gerçek Tadilat Modu: Boş ve kirli alanları adım adım yenileyerek güzelleştirin!');
        }
    }

    getAreaTasks(roomKey) {
        const rm = this.rooms[roomKey];
        if (!rm || !rm.tasks) return [];
        return rm.tasks.map(tId => this.renovationDefs[tId]).filter(Boolean);
    }

    getAreaCompletedTasks(roomKey) {
        return this.getAreaTasks(roomKey).filter(t => this.isTaskCompleted(t.id));
    }

    getAreaActiveTask(roomKey) {
        const tasks = this.getAreaTasks(roomKey);
        return tasks.find(t => !this.isTaskCompleted(t.id)) || null;
    }

    getAreaLevel(roomKey) {
        if (this.renovationDefs[roomKey]) {
            return this.isTaskCompleted(roomKey) ? 4 : 1;
        }
        const tasks = this.getAreaTasks(roomKey);
        if (!tasks.length) return 1;
        const done = this.getAreaCompletedTasks(roomKey).length;
        return Math.min(tasks.length + 1, done + 1);
    }

    getAreaProgress(roomKey) {
        const tasks = this.getAreaTasks(roomKey);
        if (!tasks.length) return 0;
        const done = this.getAreaCompletedTasks(roomKey).length;
        return Math.round((done / tasks.length) * 100);
    }

    getCurrentSequentialAreaId(roomKey) {
        const targetRoom = roomKey || this.currentRoom || 'restaurant';
        const active = this.getAreaActiveTask(targetRoom);
        if (active) return active.id;

        for (const rKey of Object.keys(this.rooms)) {
            const t = this.getAreaActiveTask(rKey);
            if (t) return t.id;
        }
        return null;
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

    recalcHotelStats() {
        let baseIncome = 45;
        let baseRep = 120;
        let completedCount = 0;

        Object.keys(this.renovationDefs).forEach(tId => {
            const saved = this.state.renovations[tId];
            if (saved && saved.completed) {
                completedCount++;
                const def = this.renovationDefs[tId];
                const opt = def.options.find(o => o.id === saved.optionId) || def.options[0];
                if (opt) {
                    baseIncome += opt.incomeBoost;
                    baseRep += opt.repBoost;
                }
            }
        });

        this.state.incomePerMin = baseIncome;
        this.state.reputation = baseRep;
        this.state.hotelStars = Math.min(5, 1 + Math.floor(completedCount / 4));
    }

    // ----------------------------------------------------
    // 4. AUDIO SYNTHESIZER
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
            this.audioCtx.resume().catch(() => {});
        }
        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        if (type === 'step') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'renovate') {
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.14, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.55);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.55);
            });
        } else if (type === 'chime' || type === 'door' || type === 'cash') {
            [659.25, 880, 1174.66].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                gain.gain.setValueAtTime(0.09, now + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.35);
            });
        }
    }

    // ----------------------------------------------------
    // 5. THREE.JS 3D ENGINE & PORTRAIT CAMERA SETUP
    // ----------------------------------------------------
    initThreeEngine() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage || !window.THREE) return;

        stage.innerHTML = `
            <div id="threeCanvasHolder" class="three-canvas-holder"></div>
            <div id="mapOverlayHolder" class="map-overlay-holder" style="display:none;"></div>
            <div id="actionPrompt" class="action-prompt" style="display:none;"></div>
            <div class="mobile-controls-layer" id="hotel3DMobileControls">
                <div id="mobileJoystickZone" class="mobile-joystick-zone" title="Serbest Yürüyüş Joystick">
                    <div id="joystickKnob" class="joystick-knob"></div>
                    <span class="joy-label">YÜRÜ</span>
                </div>
                <div class="look-hint-pill">👆 Sürükle: 360° Bak · 🔨 Dokun: Yenile</div>
                <button id="mobileActionBtn" class="mobile-action-btn" onclick="hotel3D.triggerActiveBeacon()">
                    <span>🔨</span>
                    <small>YENİLE</small>
                </button>
            </div>
        `;

        this.canvasHolder = document.getElementById('threeCanvasHolder');
        this.mapHolder = document.getElementById('mapOverlayHolder');

        const width = stage.clientWidth || 390;
        const height = stage.clientHeight || 420;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c101d);
        this.scene.fog = new THREE.FogExp2(0x0e1322, 0.018);

        // Portrait-friendly wider vertical FOV (72 deg) so one-hand vertical view sees full luxury interior
        this.camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 160);
        this.camera.position.copy(this.player.pos);
        this.camera.rotation.order = 'YXZ';

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.canvasHolder.appendChild(this.renderer.domElement);
        this.raycaster = new THREE.Raycaster();
        this.pointerNDA = new THREE.Vector2();

        window.addEventListener('resize', () => this.onResize());

        // Luxury Interior & Sunset Lighting
        const ambientLight = new THREE.AmbientLight(0xffeed6, 0.68);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffb878, 1.15);
        sunLight.position.set(18, 28, 16);
        sunLight.castShadow = true;
        this.scene.add(sunLight);

        const lobbyPt = new THREE.PointLight(0xffd89b, 1.35, 24);
        lobbyPt.position.set(0, 4.3, -1);
        this.scene.add(lobbyPt);

        const restPt = new THREE.PointLight(0xffb366, 1.35, 24);
        restPt.position.set(20, 4.1, 0);
        this.scene.add(restPt);

        const suitePt = new THREE.PointLight(0xffe4bd, 1.15, 20);
        suitePt.position.set(-19, 3.8, -10);
        this.scene.add(suitePt);

        const poolPt = new THREE.PointLight(0x38bdf8, 1.45, 28);
        poolPt.position.set(0, 2.5, -22);
        this.scene.add(poolPt);
    }

    getTexture(name) {
        if (this.textures[name]) return this.textures[name];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (name === 'carrara_marble') {
            // Contemporary Luxury Polished Veined Marble Tiles (Reference Image Main Hall Floor & Upper Wall)
            const mGrad = ctx.createLinearGradient(0, 0, 512, 512);
            mGrad.addColorStop(0, '#f4efe6');
            mGrad.addColorStop(0.5, '#eae3d6');
            mGrad.addColorStop(1, '#dfd7c8');
            ctx.fillStyle = mGrad;
            ctx.fillRect(0, 0, 512, 512);

            // Soft natural stone clouds & organic diagonal grey/gold veins
            for (let i = 0; i < 16; i++) {
                ctx.strokeStyle = i % 3 === 0 ? 'rgba(182, 150, 96, 0.24)' : 'rgba(115, 118, 128, 0.26)';
                ctx.lineWidth = 1.5 + (i % 3) * 1.4;
                ctx.beginPath();
                let x = (i * 43) % 512;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.sin(y * 0.03 + i) * 28);
                    y += 40;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Polished large-format slab joint lines
            ctx.strokeStyle = 'rgba(86, 82, 74, 0.32)';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, 252, 252);
            ctx.strokeRect(256, 2, 252, 252);
            ctx.strokeRect(2, 256, 252, 252);
            ctx.strokeRect(256, 256, 252, 252);
        } else if (name === 'anthracite_veined_marble') {
            // Reference Image Foreground Dark Grey/Anthracite Veined Marble Tiles
            const dGrad = ctx.createLinearGradient(0, 0, 512, 512);
            dGrad.addColorStop(0, '#464a52');
            dGrad.addColorStop(0.5, '#373b42');
            dGrad.addColorStop(1, '#2b2e35');
            ctx.fillStyle = dGrad;
            ctx.fillRect(0, 0, 512, 512);

            for (let i = 0; i < 18; i++) {
                ctx.strokeStyle = i % 4 === 0 ? 'rgba(218, 195, 145, 0.22)' : 'rgba(210, 216, 224, 0.2)';
                ctx.lineWidth = 1.2 + (i % 3) * 1.1;
                ctx.beginPath();
                let x = (i * 39) % 512;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += Math.cos(y * 0.035 + i) * 24;
                    y += 36;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(20, 22, 26, 0.55)';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(2, 2, 252, 252);
            ctx.strokeRect(256, 2, 252, 252);
            ctx.strokeRect(2, 256, 252, 252);
            ctx.strokeRect(256, 256, 252, 252);
        } else if (name === 'dirty_concrete_floor') {
            // Unrenovated Dirty, Dusty, Mud-Stained & Cracked Floor Texture ("Önce Boş ve Kirli")
            ctx.fillStyle = '#4c463e';
            ctx.fillRect(0, 0, 512, 512);
            // Mud & water stains
            for (let i = 0; i < 28; i++) {
                ctx.fillStyle = i % 2 === 0 ? 'rgba(42, 35, 26, 0.45)' : 'rgba(110, 98, 82, 0.35)';
                ctx.beginPath();
                ctx.ellipse((i * 73) % 512, (i * 119) % 512, 28 + (i % 5) * 14, 18 + (i % 4) * 10, i * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
            // Plaster/paint splatters & dust speckles
            for (let j = 0; j < 65; j++) {
                ctx.fillStyle = j % 3 === 0 ? 'rgba(185, 175, 158, 0.32)' : 'rgba(30, 26, 22, 0.4)';
                ctx.beginPath();
                ctx.arc((j * 59) % 512, (j * 97) % 512, 3 + (j % 6), 0, Math.PI * 2);
                ctx.fill();
            }
            // Cracks & worn grid joints
            ctx.strokeStyle = 'rgba(24, 20, 16, 0.65)';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(2, 2, 252, 252);
            ctx.strokeRect(256, 2, 252, 252);
            ctx.strokeRect(2, 256, 252, 252);
            ctx.strokeRect(256, 256, 252, 252);
            for (let k = 0; k < 7; k++) {
                ctx.beginPath();
                ctx.moveTo((k * 83) % 512, (k * 41) % 512);
                ctx.lineTo(((k * 83) + 95) % 512, ((k * 41) + 120) % 512);
                ctx.stroke();
            }
        } else if (name === 'dirty_stained_wall') {
            // Unrenovated Peeling, Damp-Stained Raw Plaster Wall
            ctx.fillStyle = '#5a5348';
            ctx.fillRect(0, 0, 512, 512);
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = i % 2 === 0 ? 'rgba(38, 33, 27, 0.42)' : 'rgba(92, 82, 68, 0.38)';
                ctx.fillRect((i * 67) % 480, (i * 89) % 480, 45 + (i % 4) * 20, 60 + (i % 3) * 30);
            }
        } else if (name === 'fluted_walnut') {
            // Natural Vertical Fluted Wood Paneling (Reference Image Reception Wall)
            ctx.fillStyle = '#4e321e';
            ctx.fillRect(0, 0, 512, 512);
            for (let x = 0; x < 512; x += 14) {
                ctx.fillStyle = '#68442a';
                ctx.fillRect(x, 0, 9, 512);
                ctx.fillStyle = '#2a180c';
                ctx.fillRect(x + 9, 0, 5, 512);
            }
        } else if (name === 'modern_rug') {
            // Reference Image Topographic Gold & Grey Wavy Contour Carpet
            ctx.fillStyle = '#33363f';
            ctx.fillRect(0, 0, 512, 512);
            for (let w = 0; w < 22; w++) {
                ctx.strokeStyle = w % 2 === 0 ? 'rgba(198, 170, 112, 0.52)' : 'rgba(148, 132, 102, 0.36)';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                for (let x = 0; x <= 512; x += 16) {
                    const y = 30 + w * 22 + Math.sin(x * 0.018 + w * 0.55) * 28 + Math.cos(x * 0.009 - w * 0.3) * 16;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (name === 'nero_marble') {
            ctx.fillStyle = '#101218';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo((i * 73) % 512, 0);
                ctx.quadraticCurveTo(256, 256, ((i + 3) * 97) % 512, 512);
                ctx.stroke();
            }
        } else if (name === 'light_nordic_oak') {
            ctx.fillStyle = '#d8b98b';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#b59260';
            ctx.lineWidth = 3;
            for (let y = 0; y < 512; y += 48) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }
        } else if (name === 'dark_walnut') {
            ctx.fillStyle = '#3b2112';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#221107';
            ctx.lineWidth = 3;
            for (let y = 0; y < 512; y += 48) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }
        } else if (name === 'velvet_carpet') {
            ctx.fillStyle = '#7a0c1a';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 16;
            ctx.strokeRect(20, 20, 472, 472);
        } else if (name === 'emerald_velvet') {
            ctx.fillStyle = '#0f3824';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 16;
            ctx.strokeRect(20, 20, 472, 472);
        } else if (name === 'pool_water') {
            const grad = ctx.createLinearGradient(0, 0, 512, 512);
            grad.addColorStop(0, '#00b4d8');
            grad.addColorStop(1, '#0077b6');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 16; i++) {
                ctx.beginPath();
                ctx.arc((i * 89) % 512, (i * 137) % 512, 36, 0, Math.PI * 2);
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
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        this.textures[name] = tex;
        return tex;
    }

    loadPhotoTexture(url) {
        if (this.textures[url]) return this.textures[url];
        const loader = new THREE.TextureLoader();
        const tex = loader.load(url);
        this.textures[url] = tex;
        return tex;
    }

    createTropicalPalmPlanter(x, y, z, scale = 1.0) {
        const group = new THREE.Group();
        // Rounded Matte Black Planter Pot (Exact Reference Image Style)
        const potMat = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.72, metalness: 0.15 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.44 * scale, 0.34 * scale, 0.78 * scale, 20), potMat);
        pot.position.y = 0.39 * scale;
        group.add(pot);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.43 * scale, 0.03 * scale, 10, 20), potMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.78 * scale;
        group.add(rim);

        const soil = new THREE.Mesh(
            new THREE.CircleGeometry(0.41 * scale, 16),
            new THREE.MeshStandardMaterial({ color: 0x261a10, roughness: 0.95 })
        );
        soil.rotation.x = -Math.PI / 2;
        soil.position.y = 0.77 * scale;
        group.add(soil);

        // Multi-stem Lush Arching Areca Palm Fronds (14 layered fronds)
        const frondMatDark = new THREE.MeshStandardMaterial({ color: 0x1b4d27, roughness: 0.42, side: THREE.DoubleSide });
        const frondMatLight = new THREE.MeshStandardMaterial({ color: 0x2d6a36, roughness: 0.38, side: THREE.DoubleSide });
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2;
            const tier = i % 3;
            const stemH = (1.15 + tier * 0.36) * scale;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * scale, 0.028 * scale, stemH, 6), frondMatDark);
            stem.position.set(Math.cos(angle) * 0.14 * scale, (0.75 + stemH * 0.42) * scale, Math.sin(angle) * 0.14 * scale);
            stem.rotation.z = -Math.cos(angle) * (0.28 + tier * 0.14);
            stem.rotation.x = Math.sin(angle) * (0.28 + tier * 0.14);
            group.add(stem);

            // Leaflets along the arching frond
            const leafBlade = new THREE.Mesh(
                new THREE.ConeGeometry(0.32 * scale, (0.95 + tier * 0.25) * scale, 5),
                i % 2 === 0 ? frondMatLight : frondMatDark
            );
            leafBlade.scale.set(1.25, 1.0, 0.35);
            leafBlade.position.set(
                Math.cos(angle) * (0.38 + tier * 0.15) * scale,
                (1.32 + tier * 0.26) * scale,
                Math.sin(angle) * (0.38 + tier * 0.15) * scale
            );
            leafBlade.rotation.z = -Math.cos(angle) * (0.62 + tier * 0.12);
            leafBlade.rotation.x = Math.sin(angle) * (0.62 + tier * 0.12);
            group.add(leafBlade);
        }

        group.position.set(x, y, z);
        return group;
    }

    // Helper: Detailed 3D Luxury Sofa with Cushions, Armrests, Legs & Throw Pillows (Reference Image Style)
    buildDetailedSofa3D(x, y, z, rotY, length, fabricMat, legMat, pillowColors = [0xd6c7b2, 0x8c4a27, 0xb8a99a, 0x9c5230, 0x3b4252]) {
        const sofa = new THREE.Group();
        const depth = 1.15;
        // Base platform
        const base = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.22, length), fabricMat);
        base.position.y = 0.24;
        sofa.add(base);

        // 4 Angled Tapered Legs
        const legOffsets = [
            [-depth * 0.42, 0.08, -length * 0.45],
            [depth * 0.42, 0.08, -length * 0.45],
            [-depth * 0.42, 0.08, length * 0.45],
            [depth * 0.42, 0.08, length * 0.45]
        ];
        legOffsets.forEach(([lx, ly, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.018, 0.16, 10), legMat);
            leg.position.set(lx, ly, lz);
            sofa.add(leg);
        });

        // Backrest Frame
        const backFrame = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, length), fabricMat);
        backFrame.position.set(depth * 0.4, 0.56, 0);
        sofa.add(backFrame);

        // Left & Right Padded Armrests
        [-length * 0.46, length * 0.46].forEach((az) => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(depth * 0.96, 0.48, 0.22), fabricMat);
            arm.position.set(0, 0.46, az);
            sofa.add(arm);
        });

        // 3 Individual Plump Seat Cushions & 3 Backrest Cushions
        const innerLen = length - 0.46;
        const cLen = innerLen / 3 - 0.03;
        for (let i = 0; i < 3; i++) {
            const cz = -innerLen / 2 + (i + 0.5) * (innerLen / 3);
            const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(depth * 0.78, 0.18, cLen), fabricMat);
            seatCushion.position.set(-0.06, 0.42, cz);
            sofa.add(seatCushion);

            const backCushion = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, cLen * 0.96), fabricMat);
            backCushion.position.set(depth * 0.22, 0.66, cz);
            backCushion.rotation.z = -0.12;
            sofa.add(backCushion);
        }

        // Plush Angled Throw Pillows (Warm Beige, Cognac/Rust, Taupe — Exact Reference Photo)
        const pillowPositions = [
            [0.05, 0.62, -innerLen * 0.38, 0.22, -0.35],
            [0.08, 0.60, -innerLen * 0.26, -0.15, -0.2],
            [0.06, 0.62, innerLen * 0.38, -0.25, 0.35],
            [0.09, 0.60, innerLen * 0.24, 0.18, 0.22],
            [0.08, 0.58, 0.0, 0.08, -0.18]
        ];
        pillowColors.slice(0, 5).forEach((colHex, idx) => {
            const pp = pillowPositions[idx];
            if (!pp) return;
            const pMat = new THREE.MeshStandardMaterial({ color: colHex, roughness: 0.68 });
            const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.38), pMat);
            pillow.position.set(pp[0], pp[1], pp[2]);
            pillow.rotation.x = pp[3];
            pillow.rotation.y = pp[4];
            pillow.rotation.z = -0.2;
            sofa.add(pillow);
        });

        sofa.position.set(x, y, z);
        sofa.rotation.y = rotY;
        return sofa;
    }

    // Helper: Detailed 3D Luxury Armchair with Seat/Back Cushions, Legs & Throw Pillow
    buildDetailedArmchair3D(x, y, z, rotY, fabricMat, legMat, pillowColor = 0x9c5230) {
        const chair = new THREE.Group();
        const w = 1.05;
        const d = 1.02;

        const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.22, d), fabricMat);
        base.position.y = 0.24;
        chair.add(base);

        [[-w * 0.4, -d * 0.4], [w * 0.4, -d * 0.4], [-w * 0.4, d * 0.4], [w * 0.4, d * 0.4]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.016, 0.16, 8), legMat);
            leg.position.set(lx, 0.08, lz);
            chair.add(leg);
        });

        const seat = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.18, d * 0.78), fabricMat);
        seat.position.set(0, 0.42, 0.04);
        chair.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.56, 0.22), fabricMat);
        back.position.set(0, 0.60, -d * 0.38);
        back.rotation.x = -0.1;
        chair.add(back);

        [-w * 0.42, w * 0.42].forEach((ax) => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, d * 0.92), fabricMat);
            arm.position.set(ax, 0.46, 0);
            chair.add(arm);
        });

        if (pillowColor) {
            const pillow = new THREE.Mesh(
                new THREE.BoxGeometry(0.38, 0.32, 0.14),
                new THREE.MeshStandardMaterial({ color: pillowColor, roughness: 0.65 })
            );
            pillow.position.set(0.05, 0.58, -d * 0.18);
            pillow.rotation.x = -0.25;
            pillow.rotation.y = 0.18;
            chair.add(pillow);
        }

        chair.position.set(x, y, z);
        chair.rotation.y = rotY;
        return chair;
    }

    // Helper: Detailed Coffee Table with Sled Frame & Rich Tabletop Props (Tray, Art Books, Carafe, Glasses, Vase)
    buildDetailedCoffeeTable3D(x, y, z, width, depth, topMat, frameMat) {
        const tbl = new THREE.Group();

        // Marble Slab Top
        const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.07, depth), topMat);
        top.position.y = 0.42;
        tbl.add(top);

        // Black Steel Sled Legs & Under-frame (Reference Image Style)
        [-depth * 0.42, depth * 0.42].forEach((fz) => {
            const runner = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.035, 0.04), frameMat);
            runner.position.set(0, 0.02, fz);
            tbl.add(runner);
            [-width * 0.44, width * 0.44].forEach((fx) => {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.04), frameMat);
                post.position.set(fx, 0.21, fz);
                tbl.add(post);
            });
        });

        // Tabletop Decor Props ("çok fazla eşya"):
        // 1. Matte Black Serving Tray
        const trayMat = new THREE.MeshStandardMaterial({ color: 0x14171f, roughness: 0.4, metalness: 0.3 });
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.56), trayMat);
        tray.position.set(-0.12, 0.47, 0.18);
        tbl.add(tray);

        // 2. Dark Carafe Bottle & 2 Glasses on Tray
        const bottleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.12, metalness: 0.4 });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.075, 0.26, 14), bottleMat);
        bottle.position.set(-0.16, 0.61, 0.24);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.1, 12), bottleMat);
        neck.position.set(-0.16, 0.77, 0.24);
        tbl.add(bottle, neck);

        const glassMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65, roughness: 0.08 });
        [[-0.02, 0.08], [-0.22, 0.04]].forEach(([gx, gz]) => {
            const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.11, 12), glassMat);
            gl.position.set(gx, 0.54, gz);
            tbl.add(gl);
        });

        // 3. Stacked Coffee Table Art Books
        const book1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.38, 0.045, 0.48),
            new THREE.MeshStandardMaterial({ color: 0xe5dec9, roughness: 0.6 })
        );
        book1.position.set(0.18, 0.48, -0.25);
        book1.rotation.y = 0.12;
        const book2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.04, 0.42),
            new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: 0.5 })
        );
        book2.position.set(0.18, 0.525, -0.25);
        book2.rotation.y = -0.08;
        tbl.add(book1, book2);

        // 4. Sculptural Gold Sphere Object on Books
        const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.065, 14, 14),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 })
        );
        orb.position.set(0.18, 0.61, -0.25);
        tbl.add(orb);

        tbl.position.set(x, y, z);
        return tbl;
    }

    // ----------------------------------------------------
    // 6. BUILD CONTEMPORARY LUXURY 3D HOTEL WORLD (EXACT REFERENCE IMAGE LAYOUT)
    // ----------------------------------------------------
    buildHotelEnvironment3D() {
        if (!this.scene) return;

        // Sky dome & Night City Skyline Horizon (Reference Image Night View Outside Panoramic Windows)
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 256;
        skyCanvas.height = 128;
        const sctx = skyCanvas.getContext('2d');
        const skyGrad = sctx.createLinearGradient(0, 0, 0, 128);
        skyGrad.addColorStop(0.0, '#040711');
        skyGrad.addColorStop(0.55, '#0b1326');
        skyGrad.addColorStop(0.85, '#162442');
        skyGrad.addColorStop(1.0, '#2a3b5c');
        sctx.fillStyle = skyGrad;
        sctx.fillRect(0, 0, 256, 128);
        const skyTex = new THREE.CanvasTexture(skyCanvas);
        const skyDome = new THREE.Mesh(
            new THREE.SphereGeometry(120, 24, 18),
            new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
        );
        this.scene.add(skyDome);

        // Night City Skyline Towers outside the right panoramic glass wall (x > 13)
        const cityGroup = new THREE.Group();
        const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0b101d, roughness: 0.6, metalness: 0.4 });
        const winGlowMat = new THREE.MeshBasicMaterial({ color: 0xffdf9e });
        [
            [18, 12, -8, 3.5, 24, 3.5],
            [22, 15, -2, 4.2, 30, 4.0],
            [19, 10, 5, 3.2, 20, 3.2],
            [25, 18, -14, 4.8, 36, 4.5]
        ].forEach(([bx, by, bz, bw, bh, bd]) => {
            const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bldgMat);
            tower.position.set(bx, by, bz);
            cityGroup.add(tower);
            for (let wy = 2; wy < bh - 2; wy += 2.2) {
                const winStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, bd * 0.7), winGlowMat);
                winStrip.position.set(bx - bw / 2 - 0.02, wy - bh / 2 + by, bz);
                cityGroup.add(winStrip);
            }
        });
        this.scene.add(cityGroup);

        const waterTex = this.getTexture('pool_water');
        waterTex.repeat.set(16, 10);
        const seaPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(170, 90),
            new THREE.MeshStandardMaterial({ map: waterTex, color: 0x0a4b78, roughness: 0.12, metalness: 0.45 })
        );
        seaPlane.rotation.x = -Math.PI / 2;
        seaPlane.position.set(0, -1.3, -65);
        this.scene.add(seaPlane);

        const marbleTex = this.getTexture('carrara_marble');
        marbleTex.repeat.set(5, 6);
        const anthraciteTex = this.getTexture('anthracite_veined_marble');
        anthraciteTex.repeat.set(4, 2);
        const dirtyFloorTex = this.getTexture('dirty_concrete_floor');
        dirtyFloorTex.repeat.set(5, 6);
        const dirtyWallTex = this.getTexture('dirty_stained_wall');
        dirtyWallTex.repeat.set(3, 2);
        const walnutTex = this.getTexture('fluted_walnut');
        walnutTex.repeat.set(4, 2);
        const parquetTex = this.getTexture('light_nordic_oak');
        parquetTex.repeat.set(6, 6);

        const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x151821, metalness: 0.75, roughness: 0.28 });
        const warmLedMat = new THREE.MeshBasicMaterial({ color: 0xffe5a3 });
        const dimCoveMat = new THREE.MeshBasicMaterial({ color: 0x575044 });

        // ====================================================
        // 1. GRAND CONTEMPORARY LUXURY LOBBY (Exact Reference Photo Architecture)
        // ====================================================
        this.lobbyArch = {};

        // 1A. Foreground Floor (z = 3.6 to 10.5) & Main Hall Floor (z = -15.0 to 3.6)
        const fgFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(18.5, 7.0),
            new THREE.MeshStandardMaterial({ map: dirtyFloorTex, roughness: 0.9, metalness: 0.04 })
        );
        fgFloor.rotation.x = -Math.PI / 2;
        fgFloor.position.set(0, 0.005, 7.1);
        this.scene.add(fgFloor);
        this.lobbyArch.fgFloor = fgFloor;

        const mainFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(18.5, 18.6),
            new THREE.MeshStandardMaterial({ map: dirtyFloorTex, roughness: 0.9, metalness: 0.04 })
        );
        mainFloor.rotation.x = -Math.PI / 2;
        mainFloor.position.set(0, 0.0, -5.7);
        this.scene.add(mainFloor);
        this.lobbyArch.mainFloor = mainFloor;

        // Specular Floor Light Reflections Group (Visible once floor is polished!)
        const reflGroup = new THREE.Group();
        const reflPoolMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0, transparent: true, opacity: 0.16 });
        [
            [0.2, 0.012, 6.2, 1.8, 2.4],
            [0.2, 0.012, 0.5, 2.4, 3.8],
            [-3.8, 0.012, -1.2, 0.35, 6.8],
            [0.0, 0.012, -8.5, 2.0, 3.0]
        ].forEach(([rx, ry, rz, rw, rd]) => {
            const p = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), reflPoolMat);
            p.rotation.x = -Math.PI / 2;
            p.position.set(rx, ry, rz);
            reflGroup.add(p);
        });
        this.scene.add(reflGroup);
        this.lobbyArch.reflGroup = reflGroup;

        // 1B. High Coffered Ceiling (y = 7.4) with Recessed Tray, Warm LED Cove & 2 Black Spotlight Tracks
        const lobbyCeiling = new THREE.Mesh(
            new THREE.PlaneGeometry(19, 26),
            new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.6 })
        );
        lobbyCeiling.rotation.x = Math.PI / 2;
        lobbyCeiling.position.set(0, 7.4, -2.5);
        this.scene.add(lobbyCeiling);

        // Recessed Rectangular Ceiling Cove Glow Strips (Reference Image Top Center)
        const ceilingCoveGroup = new THREE.Group();
        const coveFront = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.08, 0.16), warmLedMat);
        coveFront.position.set(0.4, 7.32, 4.2);
        const coveBack = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.08, 0.16), warmLedMat);
        coveBack.position.set(0.4, 7.32, -6.2);
        const coveLeft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 10.4), warmLedMat);
        coveLeft.position.set(-3.0, 7.32, -1.0);
        const coveRight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 10.4), warmLedMat);
        coveRight.position.set(3.8, 7.32, -1.0);
        ceilingCoveGroup.add(coveFront, coveBack, coveLeft, coveRight);
        this.scene.add(ceilingCoveGroup);
        this.lobbyArch.ceilingCoveGroup = ceilingCoveGroup;

        // Two Parallel Black Recessed Magnetic Track Channels (x = -3.8 and x = 4.6)
        [-3.8, 4.6].forEach((tx) => {
            const track = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 16.5), darkFrameMat);
            track.position.set(tx, 7.36, -0.8);
            this.scene.add(track);
        });

        // 1C. Left Reception Architecture Wall (x = -8.2, z = 4.2 to -6.8)
        const leftFeatureWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 4.5, 9.6),
            new THREE.MeshStandardMaterial({ map: dirtyWallTex, roughness: 0.85 })
        );
        leftFeatureWall.position.set(-8.2, 2.25, -1.2);
        this.scene.add(leftFeatureWall);
        this.lobbyArch.leftFeatureWall = leftFeatureWall;

        const upperMarbleWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 2.9, 10.2),
            new THREE.MeshStandardMaterial({ map: dirtyWallTex, roughness: 0.85 })
        );
        upperMarbleWall.position.set(-8.1, 5.95, -1.2);
        this.scene.add(upperMarbleWall);
        this.lobbyArch.upperMarbleWall = upperMarbleWall;

        // Left & Right Framing Wood Pilasters around Reception Feature Wall
        [3.65, -6.05].forEach((pz) => {
            const pilaster = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 7.4, 0.65),
                new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.45 })
            );
            pilaster.position.set(-8.0, 3.7, pz);
            this.scene.add(pilaster);
        });

        // 1D. Right Floor-to-Ceiling Panoramic Dark-Framed Glass Curtain Wall (x = 8.8)
        const glassPaneMat = new THREE.MeshStandardMaterial({
            color: 0x0f1e38,
            transparent: true,
            opacity: 0.34,
            roughness: 0.06,
            metalness: 0.5
        });
        const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(25, 7.4), glassPaneMat);
        windowPane.rotation.y = -Math.PI / 2;
        windowPane.position.set(8.85, 3.7, -2.0);
        this.scene.add(windowPane);

        for (let gz = -13.5; gz <= 9.5; gz += 2.6) {
            const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.4, 0.16), darkFrameMat);
            mullion.position.set(8.8, 3.7, gz);
            this.scene.add(mullion);
        }
        [2.45, 4.95, 7.25].forEach((gy) => {
            const transom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 25), darkFrameMat);
            transom.position.set(8.8, gy, -2.0);
            this.scene.add(transom);
        });

        // 1E. Back Hall Mezzanine Slab, Elevator Core Wall & Left Corridor Wall
        const mezzSlab = new THREE.Mesh(
            new THREE.BoxGeometry(17.6, 0.38, 6.5),
            new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.5 })
        );
        mezzSlab.position.set(0, 4.35, -11.5);
        this.scene.add(mezzSlab);

        const backCorridorWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 4.35, 7.2),
            new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.55 })
        );
        backCorridorWall.position.set(-7.8, 2.18, -10.6);
        this.scene.add(backCorridorWall);

        const backEndWall = new THREE.Mesh(
            new THREE.BoxGeometry(17.6, 7.4, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xd6cdbe, roughness: 0.55 })
        );
        backEndWall.position.set(0, 3.7, -14.6);
        this.scene.add(backEndWall);

        // Bronze Elevator Doors in Center-Back (x = -0.5, z = -14.35)
        const elevFrame = new THREE.Mesh(
            new THREE.BoxGeometry(2.55, 3.05, 0.14),
            new THREE.MeshStandardMaterial({ color: 0x1a1817, metalness: 0.8, roughness: 0.25 })
        );
        elevFrame.position.set(-0.5, 1.52, -14.35);
        this.scene.add(elevFrame);

        [-1.08, 0.08].forEach((ex) => {
            const doorLeaf = new THREE.Mesh(
                new THREE.BoxGeometry(1.12, 2.9, 0.16),
                new THREE.MeshStandardMaterial({ color: 0x2c2623, metalness: 0.72, roughness: 0.28 })
            );
            doorLeaf.position.set(ex, 1.46, -14.33);
            this.scene.add(doorLeaf);
        });

        // Glowing Green Exit Sign above Elevator Doors (Visible in Reference Image)
        const exitSign = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.18, 0.06),
            new THREE.MeshBasicMaterial({ color: 0x22c55e })
        );
        exitSign.position.set(-0.5, 3.22, -14.3);
        this.scene.add(exitSign);

        // 2. SUITE 101 & WEST CORRIDOR
        const corridorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(16, 6),
            new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.22 })
        );
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(-20, 0, 0);
        this.scene.add(corridorFloor);

        const suiteFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(14, 15),
            new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.18 })
        );
        suiteFloor.rotation.x = -Math.PI / 2;
        suiteFloor.position.set(-21, 0, -10.5);
        this.scene.add(suiteFloor);

        this.createWall(-28, 2.25, -10.5, 0.3, 4.5, 15, null);
        this.createWall(-14, 2.25, -10.5, 0.3, 4.5, 15, null);
        const suiteViewTex = this.loadPhotoTexture('assets/scene_suite_terrace.jpg');
        const oceanBackdrop = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 4.4),
            new THREE.MeshBasicMaterial({ map: suiteViewTex })
        );
        oceanBackdrop.position.set(-21, 2.25, -18.0);
        this.scene.add(oceanBackdrop);

        // 3. RIVIERA RESTAURANT & BAR
        const restFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 20),
            new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.1, metalness: 0.15 })
        );
        restFloor.rotation.x = -Math.PI / 2;
        restFloor.position.set(21, 0, 0);
        this.scene.add(restFloor);

        this.createWall(30, 2.5, 0, 0.4, 5, 20, null);
        this.createWall(21, 2.5, 10, 18, 5, 0.4, null);
        this.createWall(21, 2.5, -10, 18, 5, 0.4, null, true, [14.5, 18.5]);

        const galaTex = this.loadPhotoTexture('assets/scene_restaurant_pool.jpg');
        const galaMural = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 4.4),
            new THREE.MeshBasicMaterial({ map: galaTex })
        );
        galaMural.position.set(29.7, 2.5, 0);
        galaMural.rotation.y = -Math.PI / 2;
        this.scene.add(galaMural);

        // 4. OUTDOOR POOL, ZEN SPA & BOTANICAL GARDEN
        const poolTerrace = new THREE.Mesh(
            new THREE.PlaneGeometry(48, 24),
            new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.22 })
        );
        poolTerrace.rotation.x = -Math.PI / 2;
        poolTerrace.position.set(4, 0, -22);
        this.scene.add(poolTerrace);

        const harborTex = this.loadPhotoTexture('assets/scene_infinity_pool.jpg');
        const extMural = new THREE.Mesh(
            new THREE.PlaneGeometry(46, 15),
            new THREE.MeshBasicMaterial({ map: harborTex })
        );
        extMural.position.set(4, 6.8, -35);
        this.scene.add(extMural);

        // 5. 2ND FLOOR PENTHOUSE SUITE
        const pentFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(24, 24),
            new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.12 })
        );
        pentFloor.rotation.x = -Math.PI / 2;
        pentFloor.position.set(0, 6.0, 0);
        this.scene.add(pentFloor);

        const pentTex = this.loadPhotoTexture('assets/scene_penthouse_piano.jpg');
        const pentMural = new THREE.Mesh(
            new THREE.PlaneGeometry(18, 4.5),
            new THREE.MeshBasicMaterial({ map: pentTex })
        );
        pentMural.position.set(0, 8.4, -11.7);
        this.scene.add(pentMural);

        const pentLight = new THREE.PointLight(0xffe0a3, 1.4, 26);
        pentLight.position.set(0, 9.8, 0);
        this.scene.add(pentLight);

        // Build all dynamic 3D furniture & beacons
        this.rebuildAllRenovations3D();
        this.updateLobbyEnvironmentProgression();

        // Apply active seasonal Live-Ops 3D decorations
        if (window.ThemeManager) {
            this.applySeasonalTheme3D(window.ThemeManager.currentTheme);
        }
    }

    // Dynamically transitions the Lobby's floor, walls, reflections & LED coves from "Dirty & Empty" to "Polished Luxury" as tasks are renovated!
    updateLobbyEnvironmentProgression() {
        if (!this.lobbyArch) return;

        const floorOpt = this.getActiveOrPreviewOption('lobby_floor_walls');
        const deskOpt = this.getActiveOrPreviewOption('reception_desk');
        const chandOpt = this.getActiveOrPreviewOption('lobby_chandelier');

        // 1. Floor Transition: Dirty Cracked Concrete -> Two-Tone Mirror-Polished Veined Marble
        if (this.lobbyArch.fgFloor && this.lobbyArch.mainFloor) {
            if (!floorOpt) {
                const dirtyTex = this.getTexture('dirty_concrete_floor');
                this.lobbyArch.fgFloor.material.map = dirtyTex;
                this.lobbyArch.fgFloor.material.roughness = 0.92;
                this.lobbyArch.fgFloor.material.metalness = 0.02;
                this.lobbyArch.mainFloor.material.map = dirtyTex;
                this.lobbyArch.mainFloor.material.roughness = 0.92;
                this.lobbyArch.mainFloor.material.metalness = 0.02;
                if (this.lobbyArch.reflGroup) this.lobbyArch.reflGroup.visible = false;
            } else if (floorOpt === 'opt_a') {
                this.lobbyArch.fgFloor.material.map = this.getTexture('anthracite_veined_marble');
                this.lobbyArch.fgFloor.material.roughness = 0.08;
                this.lobbyArch.fgFloor.material.metalness = 0.22;
                this.lobbyArch.mainFloor.material.map = this.getTexture('carrara_marble');
                this.lobbyArch.mainFloor.material.roughness = 0.08;
                this.lobbyArch.mainFloor.material.metalness = 0.18;
                if (this.lobbyArch.reflGroup) this.lobbyArch.reflGroup.visible = true;
            } else if (floorOpt === 'opt_b') {
                const neroTex = this.getTexture('nero_marble');
                this.lobbyArch.fgFloor.material.map = neroTex;
                this.lobbyArch.fgFloor.material.roughness = 0.08;
                this.lobbyArch.mainFloor.material.map = neroTex;
                this.lobbyArch.mainFloor.material.roughness = 0.08;
                if (this.lobbyArch.reflGroup) this.lobbyArch.reflGroup.visible = true;
            } else {
                const oakTex = this.getTexture('light_nordic_oak');
                this.lobbyArch.fgFloor.material.map = oakTex;
                this.lobbyArch.fgFloor.material.roughness = 0.18;
                this.lobbyArch.mainFloor.material.map = this.getTexture('carrara_marble');
                this.lobbyArch.mainFloor.material.roughness = 0.12;
                if (this.lobbyArch.reflGroup) this.lobbyArch.reflGroup.visible = true;
            }
            this.lobbyArch.fgFloor.material.needsUpdate = true;
            this.lobbyArch.mainFloor.material.needsUpdate = true;
        }

        // 2. Left Reception Feature Wall Transition: Peeling Stained Plaster -> Fluted Walnut & Veined Carrara Marble
        if (this.lobbyArch.leftFeatureWall && this.lobbyArch.upperMarbleWall) {
            if (!deskOpt) {
                const dirtyWall = this.getTexture('dirty_stained_wall');
                this.lobbyArch.leftFeatureWall.material.map = dirtyWall;
                this.lobbyArch.leftFeatureWall.material.roughness = 0.9;
                this.lobbyArch.upperMarbleWall.material.map = dirtyWall;
                this.lobbyArch.upperMarbleWall.material.roughness = 0.9;
            } else {
                this.lobbyArch.leftFeatureWall.material.map = this.getTexture('fluted_walnut');
                this.lobbyArch.leftFeatureWall.material.roughness = 0.38;
                this.lobbyArch.upperMarbleWall.material.map = this.getTexture('carrara_marble');
                this.lobbyArch.upperMarbleWall.material.roughness = 0.14;
            }
            this.lobbyArch.leftFeatureWall.material.needsUpdate = true;
            this.lobbyArch.upperMarbleWall.material.needsUpdate = true;
        }

        // 3. Ceiling LED Cove Transition
        if (this.lobbyArch.ceilingCoveGroup) {
            this.lobbyArch.ceilingCoveGroup.visible = Boolean(chandOpt);
        }
    }

    createWall(x, y, z, width, height, depth, texture, hasOpening = false, openXRange = null, openZRange = null) {
        const mat = new THREE.MeshStandardMaterial({
            map: texture || null,
            color: texture ? 0xffffff : 0xdfd8ca,
            roughness: 0.55
        });

        if (!hasOpening) {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
            wall.position.set(x, y, z);
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
            }
            if (rightW > 0.1) {
                const rx = openXRange[1] + rightW / 2;
                const rWall = new THREE.Mesh(new THREE.BoxGeometry(rightW, height, depth), mat);
                rWall.position.set(rx, y, z);
                this.scene.add(rWall);
            }
        } else if (openZRange) {
            const topD = Math.max(0, openZRange[0] - (z - depth / 2));
            const botD = Math.max(0, (z + depth / 2) - openZRange[1]);
            if (topD > 0.1) {
                const tz = (z - depth / 2) + topD / 2;
                const tWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, topD), mat);
                tWall.position.set(x, y, tz);
                this.scene.add(tWall);
            }
            if (botD > 0.1) {
                const bz = openZRange[1] + botD / 2;
                const bWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, botD), mat);
                bWall.position.set(x, y, bz);
                this.scene.add(bWall);
            }
        }
    }

    // ----------------------------------------------------
    // SEASONAL LIVE-OPS 3D HOTEL DECORATIONS (HALLOWEEN / VALENTINES / WINTER)
    // ----------------------------------------------------
    applySeasonalTheme3D(themeId) {
        if (!this.scene || !window.THREE) return;
        if (this.seasonalGroup3D) {
            this.scene.remove(this.seasonalGroup3D);
            this.seasonalGroup3D = null;
        }
        if (!themeId || themeId === 'default') return;

        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.18 });

        // Key spots in Grand Lobby & Restaurant
        const decoSpots = [
            [-3.8, 0, -2.5],
            [3.8, 0, -2.5],
            [-4.5, 0, 3.2],
            [16.2, 0, 2.2]
        ];

        if (themeId === 'halloween') {
            // Luxury Carved Pumpkins, Gothic Candelabras & Mystic Violet/Amber Glow
            const pumpMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3, metalness: 0.15 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

            decoSpots.forEach(([sx, sy, sz]) => {
                const pod = new THREE.Group();
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.35, 16), goldMat);
                base.position.y = 0.18;
                pod.add(base);

                // Trio of luxury pumpkins
                [[0, 0.58, 0, 0.38], [-0.28, 0.44, 0.22, 0.24], [0.28, 0.44, 0.18, 0.26]].forEach(([px, py, pz, pr]) => {
                    const p = new THREE.Mesh(new THREE.SphereGeometry(pr, 16, 12), pumpMat);
                    p.scale.y = 0.78;
                    p.position.set(px, py, pz);
                    pod.add(p);
                    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.14, 8), goldMat);
                    stem.position.set(px, py + pr * 0.78, pz);
                    pod.add(stem);
                });

                // Tall Gothic Candelabra with Mystic Purple Flame
                const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.65, 10), goldMat);
                stand.position.set(0, 0.85, -0.22);
                pod.add(stand);
                const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xc084fc }));
                flame.position.set(0, 1.78, -0.22);
                pod.add(flame);

                pod.position.set(sx, sy, sz);
                group.add(pod);
            });

            const mysticLight = new THREE.PointLight(0xa855f7, 1.6, 20);
            mysticLight.position.set(0, 3.2, 0);
            group.add(mysticLight);
        } else if (themeId === 'valentines') {
            // Romantic Floral Rose Corners & 3D Heart Archways
            const roseMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
            const pinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });

            decoSpots.forEach(([sx, sy, sz]) => {
                const pod = new THREE.Group();
                const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.9, 18), goldMat);
                ped.position.y = 0.45;
                pod.add(ped);

                // Heart-shaped floral arrangement
                const arch = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.12, 12, 24), roseMat);
                arch.position.y = 1.38;
                pod.add(arch);

                const gemHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), pinkMat);
                gemHeart.position.y = 1.38;
                pod.add(gemHeart);

                pod.position.set(sx, sy, sz);
                group.add(pod);
            });

            const loveLight = new THREE.PointLight(0xf43f5e, 1.4, 20);
            loveLight.position.set(0, 3.2, 0);
            group.add(loveLight);
        } else if (themeId === 'winter_gala') {
            // Golden Royal Pine Trees & Crystal Snowglobes
            const pineMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4 });
            decoSpots.forEach(([sx, sy, sz]) => {
                const tree = new THREE.Group();
                [0.65, 0.5, 0.34].forEach((r, idx) => {
                    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 0.75, 16), idx % 2 === 0 ? pineMat : goldMat);
                    cone.position.y = 0.5 + idx * 0.52;
                    tree.add(cone);
                });
                const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
                star.position.y = 2.05;
                tree.add(star);
                tree.position.set(sx, sy, sz);
                group.add(tree);
            });
        }

        this.seasonalGroup3D = group;
        this.scene.add(group);
    }

    rebuildAllRenovations3D() {
        if (!this.scene) return;
        Object.keys(this.upgradeMeshes).forEach(k => {
            if (this.upgradeMeshes[k]) this.scene.remove(this.upgradeMeshes[k]);
        });
        this.upgradeMeshes = {};

        this.interactivePoints.forEach(pt => {
            if (pt.group) this.scene.remove(pt.group);
        });
        this.interactivePoints = [];

        Object.keys(this.renovationDefs).forEach(id => {
            const optId = this.getActiveOrPreviewOption(id);
            this.buildSingleFurniture3D(id, optId);
            this.addRenovationBeacon3D(id);
        });
    }

    // ----------------------------------------------------
    // Gossip Harbour Empty & Dirty / Construction State (!isRenovated)
    // "önce boş ve kirli olmalı işlem yani tadilat yaptıkça ortam güzelleşmeli"
    // ----------------------------------------------------
    buildRuinedDebrisState(group, centerPos, id) {
        const dustMat = new THREE.MeshStandardMaterial({ color: 0x5c5346, roughness: 0.98 });
        const mudStainMat = new THREE.MeshStandardMaterial({ color: 0x3b332b, roughness: 0.99, transparent: true, opacity: 0.82 });
        const rubbleMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.94 });
        const brokenWoodMat = new THREE.MeshStandardMaterial({ color: 0x523624, roughness: 0.95 });
        const cardboardMat = new THREE.MeshStandardMaterial({ color: 0x9a7b56, roughness: 0.9 });
        const bucketMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 });
        const paintWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65 });
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });

        const cx = centerPos.x;
        const cy = centerPos.y > 5 ? 6.0 : 0.0;
        const cz = centerPos.z;

        if (id.includes('chandelier') || id.includes('lighting')) {
            // Bare dangling ceiling wires & dusty temporary construction bulb
            [[-0.4, 0.8], [0.4, -1.2], [0.4, -2.8]].forEach(([ox, oz]) => {
                const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), brokenWoodMat);
                cord.position.set(cx + ox, 6.4, cz + oz);
                const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.14, 10), dustMat);
                socket.position.set(cx + ox, 5.55, cz + oz);
                group.add(cord, socket);
            });
            return;
        }

        // Large dirty floor stain & dust puddles (Empty & Dirty look)
        const mainStain = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), mudStainMat);
        mainStain.rotation.x = -Math.PI / 2;
        mainStain.scale.set(1.25, 0.85, 1);
        mainStain.position.set(cx, cy + 0.012, cz);
        group.add(mainStain);

        const secondDust = new THREE.Mesh(new THREE.CircleGeometry(1.7, 16), dustMat);
        secondDust.rotation.x = -Math.PI / 2;
        secondDust.position.set(cx + 1.1, cy + 0.015, cz - 0.7);
        group.add(secondDust);

        // Scattered plaster/concrete crumbs on the empty dirty floor
        [
            [-1.1, 0.08, 0.6, 0.14],
            [0.95, 0.07, -0.5, 0.12],
            [0.25, 0.09, 0.85, 0.16],
            [-0.65, 0.06, -0.75, 0.11],
            [1.35, 0.07, 0.45, 0.13]
        ].forEach(([ox, oy, oz, r]) => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rubbleMat);
            rock.position.set(cx + ox, cy + oy, cz + oz);
            rock.scale.set(1.2, 0.55, 1.1);
            rock.rotation.set(ox * 2, oy * 3, oz * 2);
            group.add(rock);
        });

        if (id === 'lobby_floor_walls') {
            // Paint buckets, wooden A-frame step ladder, broom & spilled plaster patch
            const bucket1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.38, 14), paintWhiteMat);
            bucket1.position.set(cx - 1.2, cy + 0.19, cz + 0.8);
            const bucket2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.34, 14), bucketMat);
            bucket2.position.set(cx - 0.7, cy + 0.17, cz + 1.0);
            group.add(bucket1, bucket2);

            // Wooden A-frame step ladder
            const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.45), brokenWoodMat);
            legL.position.set(cx + 0.8, cy + 0.9, cz - 0.4);
            legL.rotation.z = -0.22;
            const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.45), brokenWoodMat);
            legR.position.set(cx + 1.55, cy + 0.9, cz - 0.4);
            legR.rotation.z = 0.22;
            group.add(legL, legR);

            // Warning cone
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.58, 12), coneMat);
            cone.position.set(cx - 0.2, cy + 0.29, cz + 1.8);
            group.add(cone);
        } else if (id === 'reception_desk') {
            // Unrenovated left reception area: dusty floor outline, 2 cardboard boxes & broom leaning against wall
            const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.75), cardboardMat);
            box1.position.set(cx - 0.2, cy + 0.33, cz + 1.2);
            box1.rotation.y = 0.25;
            const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 0.62), cardboardMat);
            box2.position.set(cx + 0.1, cy + 0.26, cz - 1.4);
            box2.rotation.y = -0.4;
            const plank = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 2.8), brokenWoodMat);
            plank.position.set(cx + 0.6, cy + 0.04, cz + 0.2);
            plank.rotation.y = 0.18;
            group.add(box1, box2, plank);
        } else {
            // Empty & dirty lounge/corridor zone: a couple of wooden planks, paint bucket & warning cone
            const plank1 = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 0.22), brokenWoodMat);
            plank1.position.set(cx - 0.3, cy + 0.04, cz + 0.2);
            plank1.rotation.y = 0.42;
            const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.34, 12), bucketMat);
            bucket.position.set(cx + 0.7, cy + 0.17, cz - 0.3);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.52, 12), coneMat);
            cone.position.set(cx - 0.85, cy + 0.26, cz - 0.55);
            group.add(plank1, bucket, cone);
        }
    }

    // ----------------------------------------------------
    // 3 DISTINCT 3D MODELS PER TASK (opt_a vs opt_b vs opt_c)
    // Shared between the live 3D hotel scene AND the 1:1 UI Dock Thumbnail Renderer!
    // ----------------------------------------------------
    createFurnitureModelGroup(id, optionId) {
        const def = this.renovationDefs[id];
        const group = new THREE.Group();
        if (!def) return group;

        if (!optionId) {
            this.buildRuinedDebrisState(group, def.pos, id);
            return group;
        }

        const marbleTex = this.getTexture('carrara_marble');
        const neroTex = this.getTexture('nero_marble');
        const walnutTex = this.getTexture('fluted_walnut');
        const rugTex = this.getTexture('modern_rug');

        const carraraMat = new THREE.MeshStandardMaterial({ map: marbleTex, color: 0xffffff, roughness: 0.1, metalness: 0.12 });
        const neroMat = new THREE.MeshStandardMaterial({ map: neroTex, color: 0x181b24, roughness: 0.12, metalness: 0.22 });
        const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x4a1e10, roughness: 0.28, metalness: 0.08 });
        const walnutMat = new THREE.MeshStandardMaterial({ map: walnutTex, color: 0x6b442a, roughness: 0.32 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
        const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x181c24, metalness: 0.78, roughness: 0.24 });
        const charcoalFabricMat = new THREE.MeshStandardMaterial({ color: 0x262d3b, roughness: 0.78 });
        const deepNavyFabricMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.74 });
        const tealVelvetMat = new THREE.MeshStandardMaterial({ color: 0x0f5c78, roughness: 0.58 });
        const burgundyVelvetMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.62 });
        const creamBoucleMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.72 });
        const turquoiseVelvetMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.55 });
        const smokedGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, transparent: true, opacity: 0.52, roughness: 0.08, metalness: 0.35 });
        const warmLedMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });

        // ====================================================
        // LOBBY STAGE 1: FLOOR, WALLS & SHEER PANORAMIC CURTAINS (lobby_floor_walls)
        // ====================================================
        if (id === 'lobby_floor_walls') {
            const curtainColor = optionId === 'opt_a' ? 0xf8f5ee : (optionId === 'opt_b' ? 0x1e293b : 0xfde68a);
            const curtainMat = new THREE.MeshStandardMaterial({
                color: curtainColor,
                transparent: true,
                opacity: 0.58,
                roughness: 0.65,
                side: THREE.DoubleSide
            });

            // 6 Full-height gathered sheer curtain panels along the right panoramic glass wall (x = 8.42)
            [6.2, 3.0, -0.2, -3.4, -6.6, -9.8].forEach((cz) => {
                for (let pleat = -2; pleat <= 2; pleat++) {
                    const fold = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.09, 0.11, 7.25, 10),
                        curtainMat
                    );
                    fold.position.set(8.42 + (pleat % 2) * 0.04, 3.63, cz + pleat * 0.14);
                    group.add(fold);
                }
            });

            // Decorative marble & brass floor border inlay strips + warm window floor uplights
            const borderTrim = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.015, 0.12), goldMat);
            borderTrim.position.set(0.2, 0.01, 1.5);
            group.add(borderTrim);

            // 2 Decorative sculptural floor vases near entrance
            [[-7.2, 6.2], [7.6, 7.2]].forEach(([vx, vz]) => {
                this.createTropicalPalmPlanter(group, vx, vz, 0.85);
            });
        }
        // ====================================================
        // LOBBY STAGE 2: LEFT RECEPTION DESK, 3 iMACS, LAMPS, SHELVES, MONOGRAM & PALMS (reception_desk)
        // ====================================================
        else if (id === 'reception_desk') {
            const rx = -5.45;
            const rz = -1.2;

            if (optionId === 'opt_a') {
                // Exact Reference Photo Left-Side Reception Desk (running along Z axis from z = 2.4 to z = -4.8)
                const marbleBody = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.16, 7.2), carraraMat);
                marbleBody.position.set(rx, 0.58, rz);
                // Recessed warm walnut front panel facing right (+X)
                const walnutInset = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 5.8), walnutMat);
                walnutInset.position.set(rx + 0.68, 0.52, rz);
                // Thick marble top counter overhang
                const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 7.36), carraraMat);
                counterTop.position.set(rx, 1.18, rz);
                // Glowing warm LED strip under top overhang and at floor toe-kick
                const topLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 5.8), warmLedMat);
                topLed.position.set(rx + 0.71, 0.91, rz);
                const bottomLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.1), warmLedMat);
                bottomLed.position.set(rx + 0.67, 0.04, rz);
                group.add(marbleBody, walnutInset, counterTop, topLed, bottomLed);
            } else if (optionId === 'opt_b') {
                // Option B: Curved Black Onyx & Gold Reception Desk along Left Side
                const onyxBody = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.18, 7.0), neroMat);
                onyxBody.position.set(rx, 0.59, rz);
                const goldFront = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.82, 5.9), goldMat);
                goldFront.position.set(rx + 0.69, 0.55, rz);
                const topSlab = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 7.2), neroMat);
                topSlab.position.set(rx, 1.2, rz);
                group.add(onyxBody, goldFront, topSlab);
            } else {
                // Option C: Sculptural Smoked Glass & Brushed Bronze Reception Counter
                const bronzeBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 6.8), goldMat);
                bronzeBase.position.set(rx, 0.55, rz);
                const glassCounter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 7.4), smokedGlassMat);
                glassCounter.position.set(rx, 1.18, rz);
                group.add(bronzeBase, glassCounter);
            }

            // 3 Angled Silver All-in-One Monitors (iMac style) + Keyboards + Receptionist Chairs (as in Ref Image)
            const monitorSilver = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.18 });
            const screenDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12, metalness: 0.5 });
            [1.15, -0.95, -2.85].forEach((mz, idx) => {
                // Monitor stand
                const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.18), monitorSilver);
                stand.position.set(rx - 0.1, 1.32, mz);
                // Monitor screen angled slightly toward receptionists
                const mon = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.64), monitorSilver);
                mon.position.set(rx + 0.02, 1.48, mz);
                mon.rotation.y = idx === 0 ? -0.15 : 0.12;
                const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.36, 0.58), screenDark);
                bezel.position.set(rx + 0.015, 1.49, mz);
                bezel.rotation.y = mon.rotation.y;
                // Keyboard
                const kb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.38), monitorSilver);
                kb.position.set(rx - 0.32, 1.25, mz);
                group.add(stand, mon, bezel, kb);
            });

            // 2 Ergonomic Receptionist Chairs behind the desk
            [0.8, -1.8].forEach((chZ) => {
                const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16), charcoalFabricMat);
                chairSeat.position.set(rx - 1.15, 0.58, chZ);
                const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.52), charcoalFabricMat);
                chairBack.position.set(rx - 1.42, 0.92, chZ);
                const chairPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 10), darkSteelMat);
                chairPost.position.set(rx - 1.15, 0.28, chZ);
                group.add(chairSeat, chairBack, chairPost);
            });

            // 2 Glowing Warm Drum-Shade Table Lamps on the Reception Counter (front-left z = 2.05 and back-left z = -4.2)
            [2.05, -4.2].forEach((lz) => {
                const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.42, 14), goldMat);
                lampStem.position.set(rx + 0.18, 1.44, lz);
                const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.34, 20), warmLedMat);
                lampShade.position.set(rx + 0.18, 1.72, lz);
                group.add(lampStem, lampShade);
            });

            // Glowing Circular Hotel Monogram Logo ('M' / 'V') on the Fluted Walnut Back Wall (x = -7.98, y = 2.95, z = 0.2)
            const logoRing = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.045, 14, 36), warmLedMat);
            logoRing.rotation.y = Math.PI / 2;
            logoRing.position.set(-7.96, 2.95, 0.35);
            const logoDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 32), walnutMat);
            logoDisc.rotation.z = Math.PI / 2;
            logoDisc.position.set(-8.0, 2.95, 0.35);
            // Stylized 'M' bars inside the circular emblem
            [-0.18, 0, 0.18].forEach((oz, i) => {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, i === 1 ? 0.38 : 0.52, 0.07), warmLedMat);
                bar.position.set(-7.94, 2.95, 0.35 + oz);
                group.add(bar);
            });
            group.add(logoRing, logoDisc);

            // 4 Backlit Floating Walnut Shelves on the back wall stocked with 16+ decorative bottles, books & sculptures
            [
                [2.25, -2.5],
                [1.62, -2.5],
                [2.25, -4.55],
                [1.62, -4.55]
            ].forEach(([sy, sz], sIdx) => {
                const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.07, 1.65), walnutMat);
                shelf.position.set(-7.88, sy, sz);
                const shelfLed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 1.58), warmLedMat);
                shelfLed.position.set(-7.82, sy + 0.045, sz);
                group.add(shelf, shelfLed);

                // Populate each shelf with 4 decorative items (bottles, vases, books, gold spheres)
                [-0.55, -0.18, 0.2, 0.55].forEach((oz, itemIdx) => {
                    if ((sIdx + itemIdx) % 3 === 0) {
                        const bottle = new THREE.Mesh(
                            new THREE.CylinderGeometry(0.045, 0.065, 0.28, 12),
                            itemIdx % 2 === 0 ? goldMat : smokedGlassMat
                        );
                        bottle.position.set(-7.84, sy + 0.18, sz + oz);
                        group.add(bottle);
                    } else if ((sIdx + itemIdx) % 3 === 1) {
                        const bookStack = new THREE.Mesh(
                            new THREE.BoxGeometry(0.22, 0.16, 0.24),
                            itemIdx % 2 === 0 ? creamBoucleMat : burgundyVelvetMat
                        );
                        bookStack.position.set(-7.84, sy + 0.12, sz + oz);
                        group.add(bookStack);
                    } else {
                        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), goldMat);
                        orb.position.set(-7.84, sy + 0.13, sz + oz);
                        group.add(orb);
                    }
                });
            });

            // 2 Warm Wall Sconces on the left marble pilasters (z = 2.65 and z = -6.15)
            [2.65, -6.15].forEach((sz) => {
                const sconceBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.22), goldMat);
                sconceBack.position.set(-7.42, 2.55, sz);
                const sconceShade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.32, 16), warmLedMat);
                sconceShade.position.set(-7.32, 2.62, sz);
                group.add(sconceBack, sconceShade);
            });

            // 2 Large Lush Tropical Areca Palm Planters flanking the reception desk (z = 3.15 and z = -5.55)
            this.createTropicalPalmPlanter(group, -6.65, 3.15, 1.18);
            this.createTropicalPalmPlanter(group, -6.65, -5.55, 1.12);
        }
        // ====================================================
        // LOBBY STAGE 3: 4 CASCADING CONCENTRIC RING CHANDELIERS + 16 TRACK SPOTLIGHTS (lobby_chandelier)
        // ====================================================
        else if (id === 'lobby_chandelier' || id === 'restaurant_lighting') {
            const isLobby = (id === 'lobby_chandelier');
            const cx = def.pos.x;
            const cz = def.pos.z;

            if (optionId === 'opt_a') {
                if (isLobby) {
                    // Exact Reference Image: 4 Cascading Large Concentric Glowing Ring Chandeliers + 5th Back Hall Ring
                    const ringsConfig = [
                        { x: 0.35, y: 5.75, z: 1.45, r: 1.95, tiltX: 0.08, tiltZ: -0.05 },
                        { x: 0.55, y: 5.32, z: -0.25, r: 1.72, tiltX: -0.06, tiltZ: 0.07 },
                        { x: 0.25, y: 4.92, z: -1.85, r: 1.48, tiltX: 0.07, tiltZ: -0.04 },
                        { x: 0.45, y: 4.52, z: -3.45, r: 1.25, tiltX: -0.05, tiltZ: 0.05 },
                        // 5th Distant Ring Chandelier in the Back Hallway (as seen in reference photo)
                        { x: -0.35, y: 3.92, z: -10.4, r: 1.15, tiltX: 0.04, tiltZ: 0.0 }
                    ];
                    const wireMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
                    ringsConfig.forEach((rc) => {
                        // Outer brushed bronze housing + glowing warm inner diffuser torus
                        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(rc.r, 0.065, 16, 48), warmLedMat);
                        outerRing.rotation.x = Math.PI / 2 + rc.tiltX;
                        outerRing.rotation.y = rc.tiltZ;
                        outerRing.position.set(rc.x, rc.y, rc.z);
                        group.add(outerRing);

                        const goldTrim = new THREE.Mesh(new THREE.TorusGeometry(rc.r + 0.03, 0.025, 12, 48), goldMat);
                        goldTrim.rotation.copy(outerRing.rotation);
                        goldTrim.position.set(rc.x, rc.y + 0.03, rc.z);
                        group.add(goldTrim);

                        // 3 Thin suspension cables up to the recessed ceiling (y = 7.4)
                        for (let c = 0; c < 3; c++) {
                            const ang = (c / 3) * Math.PI * 2;
                            const h = 7.4 - rc.y;
                            const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), wireMat);
                            wire.position.set(
                                rc.x + Math.cos(ang) * (rc.r * 0.85),
                                rc.y + h / 2,
                                rc.z + Math.sin(ang) * (rc.r * 0.85)
                            );
                            group.add(wire);
                        }
                    });

                    // 16 Track Spotlights along the 2 black ceiling tracks (x = -2.2 and x = 2.8)
                    [-2.2, 2.8].forEach((tx) => {
                        for (let sz = 5.0; sz >= -8.0; sz -= 1.85) {
                            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), darkSteelMat);
                            cyl.position.set(tx, 7.12, sz);
                            const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10), warmLedMat);
                            bulb.rotation.x = Math.PI / 2;
                            bulb.position.set(tx, 7.0, sz);
                            group.add(cyl, bulb);
                        }
                    });
                } else {
                    // Restaurant 4-Tier Concentric Ring Chandelier
                    [1.65, 1.28, 0.92, 0.58].forEach((r, idx) => {
                        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 14, 36), warmLedMat);
                        ring.rotation.x = Math.PI / 2;
                        ring.position.set(cx, 4.45 - idx * 0.28, cz);
                        group.add(ring);
                    });
                }
            } else if (optionId === 'opt_b') {
                // Option B: Classic Cascading Crystal Empire Chandeliers
                const positions = isLobby ? [[0.4, 5.2, 0.8], [0.4, 4.8, -2.6]] : [[cx, 3.9, cz]];
                positions.forEach(([px, py, pz]) => {
                    const crown = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.45, 20), goldMat);
                    crown.rotation.x = Math.PI;
                    crown.position.set(px, py, pz);
                    const crystalCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 1), warmLedMat);
                    crystalCore.position.set(px, py - 0.5, pz);
                    group.add(crown, crystalCore);
                });
            } else {
                // Option C: Sculptural Intersecting Gold Light Tubes & Floating Opal Spheres
                const by = isLobby ? 5.4 : 4.0;
                for (let i = 0; i < 4; i++) {
                    const bar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.08), goldMat);
                    bar.position.set(cx, by - i * 0.24, cz);
                    bar.rotation.y = (i * Math.PI) / 4;
                    group.add(bar);
                }
                [[-1.1, by - 0.2], [1.1, by - 0.4], [0, by - 0.65], [0.6, by - 0.85]].forEach(([ox, oy]) => {
                    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), warmLedMat);
                    orb.position.set(cx + ox, oy, cz);
                    group.add(orb);
                });
            }
        }
        // ====================================================
        // LOBBY STAGE 4: FOREGROUND RIGHT LOUNGE CLUSTER (lobby_carpet)
        // Carpet + 3-Seater Sofa (5 Pillows) + 2 Armchairs + Marble Coffee Table (Tray/Glasses/Books) + Side Table & Lamp + 2 Palms
        // ====================================================
        else if (id === 'lobby_carpet') {
            if (optionId === 'opt_a') {
                // Wavy Gold & Grey Topographic Carpet (5.8m × 6.0m)
                const rug = new THREE.Mesh(
                    new THREE.PlaneGeometry(5.8, 6.2),
                    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.82 })
                );
                rug.rotation.x = -Math.PI / 2;
                rug.position.set(4.85, 0.02, 3.15);
                group.add(rug);

                // Detailed 3-Seater Charcoal Sofa along the right window facing left (-X, rotY = -Math.PI / 2)
                this.buildDetailedSofa3D(group, 6.45, 3.15, -Math.PI / 2, charcoalFabricMat, 3.4);

                // 2 Detailed Deep Charcoal Lounge Armchairs (Foreground right facing back-left, and Mid-left facing right-front)
                this.buildDetailedArmchair3D(group, 4.95, 5.55, Math.PI * 0.82, charcoalFabricMat, 0xd6cfc2);
                this.buildDetailedArmchair3D(group, 3.45, 0.95, 0.38, charcoalFabricMat, 0x9a5b3e);

                // Detailed Rectangular Carrara Marble Coffee Table with black tray, carafe, 2 crystal glasses, stacked art books & gold sphere
                this.buildDetailedCoffeeTable3D(group, 4.35, 3.15, carraraMat, darkSteelMat, 1.55, 1.35);

                // Round Side Table + Warm Brass Table Lamp next to sofa (x = 6.35, z = 0.85)
                const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.56, 18), walnutMat);
                sideTbl.position.set(6.35, 0.28, 0.85);
                const sideLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.32, 12), goldMat);
                sideLampBase.position.set(6.35, 0.72, 0.85);
                const sideLampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 16), warmLedMat);
                sideLampShade.position.set(6.35, 0.96, 0.85);
                group.add(sideTbl, sideLampBase, sideLampShade);

                // 2 Tall Lush Tropical Palm Planters by the right panoramic glass window
                this.createTropicalPalmPlanter(group, 7.55, 5.25, 1.22);
                this.createTropicalPalmPlanter(group, 7.55, 0.35, 1.15);
            } else if (optionId === 'opt_b') {
                // Option B: Classic Burgundy Chesterfield Lounge Set + Mahogany Table + Palms
                const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 6.2), burgundyVelvetMat);
                rug.rotation.x = -Math.PI / 2;
                rug.position.set(4.85, 0.02, 3.15);
                group.add(rug);
                this.buildDetailedSofa3D(group, 6.45, 3.15, -Math.PI / 2, burgundyVelvetMat, 3.4);
                this.buildDetailedArmchair3D(group, 4.95, 5.55, Math.PI * 0.82, burgundyVelvetMat, 0xd4af37);
                this.buildDetailedArmchair3D(group, 3.45, 0.95, 0.38, burgundyVelvetMat, 0xd4af37);
                this.buildDetailedCoffeeTable3D(group, 4.35, 3.15, mahoganyMat, goldMat, 1.55, 1.35);
                this.createTropicalPalmPlanter(group, 7.55, 5.25, 1.18);
                this.createTropicalPalmPlanter(group, 7.55, 0.35, 1.12);
            } else {
                // Option C: Avant-Garde Cream Bouclé Lounge Set + Nero Marble Table + Palms
                const rug = new THREE.Mesh(new THREE.CircleGeometry(3.1, 32), creamBoucleMat);
                rug.rotation.x = -Math.PI / 2;
                rug.position.set(4.85, 0.02, 3.15);
                group.add(rug);
                this.buildDetailedSofa3D(group, 6.45, 3.15, -Math.PI / 2, creamBoucleMat, 3.4);
                this.buildDetailedArmchair3D(group, 4.95, 5.55, Math.PI * 0.82, creamBoucleMat, 0x0d9488);
                this.buildDetailedArmchair3D(group, 3.45, 0.95, 0.38, creamBoucleMat, 0x0d9488);
                this.buildDetailedCoffeeTable3D(group, 4.35, 3.15, neroMat, goldMat, 1.55, 1.35);
                this.createTropicalPalmPlanter(group, 7.55, 5.25, 1.18);
                this.createTropicalPalmPlanter(group, 7.55, 0.35, 1.12);
            }
        }
        // ====================================================
        // LOBBY STAGE 5: MIDGROUND RIGHT LOUNGE CLUSTER & COLUMNS (lobby_columns)
        // Second Carpet + Second 3-Seater Sofa + 2 Deep Navy/Charcoal Armchairs + Second Marble Coffee Table + Columns + 2 Palms
        // ====================================================
        else if (id === 'lobby_columns') {
            const seatMat = optionId === 'opt_a' ? deepNavyFabricMat : (optionId === 'opt_b' ? burgundyVelvetMat : creamBoucleMat);
            const tableMat = optionId === 'opt_a' ? carraraMat : (optionId === 'opt_b' ? neroMat : walnutMat);

            // Second Wavy Gold & Grey Carpet in Midground Right (z = -3.6)
            const rug2 = new THREE.Mesh(
                new THREE.PlaneGeometry(5.5, 5.4),
                new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.82 })
            );
            rug2.rotation.x = -Math.PI / 2;
            rug2.position.set(4.85, 0.02, -3.65);
            group.add(rug2);

            // Second 3-Seater Sofa along the right window (x = 6.45, z = -3.65, facing -X)
            this.buildDetailedSofa3D(group, 6.45, -3.65, -Math.PI / 2, seatMat, 3.2);

            // 2 Deep Navy/Charcoal Lounge Armchairs facing the second coffee table
            this.buildDetailedArmchair3D(group, 3.35, -2.05, 0.45, seatMat, 0xd6cfc2);
            this.buildDetailedArmchair3D(group, 3.35, -5.25, 2.55, seatMat, 0x9a5b3e);

            // Second Veined Marble Coffee Table with Tray, Decanter, Glasses & Art Books
            this.buildDetailedCoffeeTable3D(group, 4.55, -3.65, tableMat, darkSteelMat, 1.45, 1.25);

            // 2 Architectural Marble & Brass Pilasters with Warm Sconces
            [[-7.35, -6.2], [7.85, -3.4]].forEach(([cx, cz]) => {
                const col = new THREE.Mesh(
                    new THREE.BoxGeometry(0.68, 7.3, 0.68),
                    optionId === 'opt_b' ? neroMat : carraraMat
                );
                col.position.set(cx, 3.65, cz);
                const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.48, 0.16), warmLedMat);
                sconce.position.set(cx + (cx < 0 ? 0.36 : -0.36), 2.65, cz);
                group.add(col, sconce);
            });

            // 2 More Tall Lush Tropical Palm Planters flanking the second lounge cluster
            this.createTropicalPalmPlanter(group, 7.55, -1.85, 1.15);
            this.createTropicalPalmPlanter(group, 7.55, -6.15, 1.2);
        }
        // ====================================================
        // LOBBY STAGE 6: BACK VISTA — FLOATING STAIRCASE, MEZZANINE BALCONY, CREDENZA & 2 LAMPS, 2 PAINTINGS, TEAL ARMCHAIRS (lobby_back_vista)
        // ====================================================
        else if (id === 'lobby_back_vista') {
            // 1. Left-Back Corridor Walnut & Marble Console Credenza (x = -6.85, z = -10.2)
            const credenzaBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.86, 3.4), walnutMat);
            credenzaBody.position.set(-6.85, 0.43, -10.2);
            const credenzaTop = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.08, 3.5), carraraMat);
            credenzaTop.position.set(-6.85, 0.89, -10.2);
            group.add(credenzaBody, credenzaTop);

            // 2 Warm Glowing Table Lamps on the Left-Back Credenza (exact match to reference photo!)
            [-9.1, -11.3].forEach((lz) => {
                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.34, 14), goldMat);
                base.position.set(-6.85, 1.1, lz);
                const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.3, 18), warmLedMat);
                shade.position.set(-6.85, 1.38, lz);
                group.add(base, shade);
            });

            // 2 Large Framed Vertical Wall Paintings above the Left-Back Credenza
            [-9.35, -11.05].forEach((pz, pIdx) => {
                const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.65, 1.15), darkSteelMat);
                frame.position.set(-7.52, 2.55, pz);
                const canvas = new THREE.Mesh(
                    new THREE.BoxGeometry(0.09, 1.48, 0.98),
                    new THREE.MeshStandardMaterial({ color: pIdx === 0 ? 0xd6cfc2 : 0x94a3b8, roughness: 0.45 })
                );
                canvas.position.set(-7.5, 2.55, pz);
                // Abstract dark art motif inside painting
                const motif = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.48), neroMat);
                motif.position.set(-7.49, 2.52, pz);
                group.add(frame, canvas, motif);
            });

            // 2. Right-Back Teal-Blue Velvet Armchairs + Round Marble/Brass Coffee Table + Rug in front of the Staircase
            const backRug = new THREE.Mesh(
                new THREE.PlaneGeometry(4.2, 3.4),
                new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.85 })
            );
            backRug.rotation.x = -Math.PI / 2;
            backRug.position.set(2.65, 0.02, -10.8);
            group.add(backRug);

            const accentChairMat = optionId === 'opt_a' ? tealVelvetMat : (optionId === 'opt_b' ? burgundyVelvetMat : turquoiseVelvetMat);
            this.buildDetailedArmchair3D(group, 1.75, -11.15, 0.28, accentChairMat, 0xd6cfc2);
            this.buildDetailedArmchair3D(group, 3.55, -11.15, -0.28, accentChairMat, 0xd6cfc2);

            const roundBackTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.08, 24), carraraMat);
            roundBackTbl.position.set(2.65, 0.46, -10.55);
            const roundBackBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.44, 18), goldMat);
            roundBackBase.position.set(2.65, 0.22, -10.55);
            group.add(roundBackTbl, roundBackBase);

            // 3. Wide Floating Walnut & Brushed Steel Staircase ascending in Right-Back (x = 5.45, z = -8.6 to -13.6)
            const stairStepMat = optionId === 'opt_b' ? neroMat : walnutMat;
            for (let s = 0; s < 14; s++) {
                const sy = 0.28 + s * 0.31;
                const sz = -8.65 - s * 0.36;
                const tread = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 0.42), stairStepMat);
                tread.position.set(5.55, sy, sz);
                const stepLed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.04), warmLedMat);
                stepLed.position.set(5.55, sy - 0.04, sz + 0.18);
                group.add(tread, stepLed);
            }
            // Diagonal steel stringer beams under floating stairs
            [-0.85, 0.85].forEach((ox) => {
                const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 6.6), darkSteelMat);
                stringer.position.set(5.55 + ox, 2.3, -11.0);
                stringer.rotation.x = 0.72;
                group.add(stringer);
            });
            // Tempered glass stair railing panels
            const stairGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 5.8), smokedGlassMat);
            stairGlass.position.set(4.35, 2.85, -11.0);
            stairGlass.rotation.x = 0.72;
            group.add(stairGlass);

            // 4. 2nd-Floor Mezzanine Balcony Slab, Smoked-Glass Balustrade & Under-Beam LED Strip (y = 4.65, z = -9.6)
            const mezzSlab = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.36, 4.6), carraraMat);
            mezzSlab.position.set(0.0, 4.55, -11.8);
            const mezzLed = new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.06, 0.08), warmLedMat);
            mezzLed.position.set(0.0, 4.36, -9.52);
            const mezzGlass = new THREE.Mesh(new THREE.BoxGeometry(15.8, 1.05, 0.08), smokedGlassMat);
            mezzGlass.position.set(0.0, 5.25, -9.56);
            const mezzHandrail = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.07, 0.12), darkSteelMat);
            mezzHandrail.position.set(0.0, 5.8, -9.56);
            group.add(mezzSlab, mezzLed, mezzGlass, mezzHandrail);

            // 5. 3 Background Tropical Palm Planters (flanking the elevator & staircase)
            this.createTropicalPalmPlanter(group, -5.2, -12.6, 1.15);
            this.createTropicalPalmPlanter(group, 0.65, -12.2, 1.1);
            this.createTropicalPalmPlanter(group, 7.25, -9.6, 1.18);
        }
        // 1. RESTAURANT TABLES (Explicit Brief Example: A = White Round, B = Classic Square Mahogany, C = Luxury Oval Marble)
        else if (id === 'restaurant_tables') {
            const coords = [[17.2, 3.0], [22.0, 3.0], [17.2, -0.8], [22.0, -0.8]];
            coords.forEach(([tx, tz]) => {
                if (optionId === 'opt_a') {
                    // Option A: Modern White Round Marble Table on Cylindrical Gold Pedestal
                    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.42, 0.84, 20), goldMat);
                    ped.position.set(tx, 0.42, tz);
                    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.08, 28), carraraMat);
                    top.position.set(tx, 0.88, tz);
                    group.add(ped, top);
                    [[-1.2, 0], [1.2, 0], [0, -1.2], [0, 1.2]].forEach(([ox, oz]) => {
                        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.48, 16), creamBoucleMat);
                        seat.position.set(tx + ox, 0.24, tz + oz);
                        group.add(seat);
                    });
                } else if (optionId === 'opt_b') {
                    // Option B: Classic Square Mahogany Wood Table with 4 Carved Corner Legs
                    const top = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.1, 1.95), mahoganyMat);
                    top.position.set(tx, 0.88, tz);
                    group.add(top);
                    [[-0.82, -0.82], [0.82, -0.82], [-0.82, 0.82], [0.82, 0.82]].forEach(([lx, lz]) => {
                        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.86, 0.14), mahoganyMat);
                        leg.position.set(tx + lx, 0.43, tz + lz);
                        group.add(leg);
                    });
                    [[-1.25, 0], [1.25, 0], [0, -1.25], [0, 1.25]].forEach(([ox, oz]) => {
                        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.88, 0.54), burgundyVelvetMat);
                        ch.position.set(tx + ox, 0.44, tz + oz);
                        group.add(ch);
                    });
                } else {
                    // Option C: Luxury Oval Nero/Gold Marble Table with Sculptural Cage Base
                    const cage = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), goldMat);
                    cage.position.set(tx, 0.45, tz);
                    const ovalTop = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.09, 28), neroMat);
                    ovalTop.scale.set(1.42, 1, 0.85);
                    ovalTop.position.set(tx, 0.9, tz);
                    group.add(cage, ovalTop);
                    [[-1.35, 0], [1.35, 0], [0, -1.05], [0, 1.05]].forEach(([ox, oz]) => {
                        const ch = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12), turquoiseVelvetMat);
                        ch.position.set(tx + ox, 0.35, tz + oz);
                        group.add(ch);
                    });
                }
            });
        }
        // 6. RESTAURANT BAR (A = Rectangular Amber Onyx LED Bar, B = Semi-Circular Mahogany Bar, C = Hexagonal Smoked Glass Island Bar)
        else if (id === 'restaurant_bar') {
            if (optionId === 'opt_a') {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.18, 1.4), goldMat);
                bar.position.set(20.0, 0.59, -6.0);
                const top = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.12, 1.6), carraraMat);
                top.position.set(20.0, 1.22, -6.0);
                group.add(bar, top);
            } else if (optionId === 'opt_b') {
                const curvedBar = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.18, 24, 1, false, 0, Math.PI), mahoganyMat);
                curvedBar.position.set(20.0, 0.59, -5.8);
                group.add(curvedBar);
            } else {
                const hexBar = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.2, 1.18, 6), smokedGlassMat);
                hexBar.position.set(20.0, 0.59, -5.8);
                group.add(hexBar);
            }
        }
        // 7. ALL OTHER TASKS WITH DISTINCT GEOMETRY PER OPTION (A = Rect/Modern, B = Classic/Curved/Regal, C = Sculptural/Organic)
        else {
            const px = def.pos.x;
            const py = def.pos.y > 5 ? 6.0 : 0.0;
            const pz = def.pos.z;

            if (optionId === 'opt_a') {
                const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 2.4), carraraMat);
                base.position.set(px, py + 0.33, pz);
                const accent = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 2.6), goldMat);
                accent.position.set(px, py + 0.72, pz);
                group.add(base, accent);
            } else if (optionId === 'opt_b') {
                const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.75, 24), burgundyVelvetMat);
                base.position.set(px, py + 0.38, pz);
                const spire = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.35, 16), goldMat);
                spire.position.set(px, py + 1.35, pz);
                group.add(base, spire);
            } else {
                const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.65, 8), walnutMat);
                base.scale.set(1.4, 1, 0.85);
                base.position.set(px, py + 0.33, pz);
                const dome = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), smokedGlassMat);
                dome.position.set(px, py + 0.95, pz);
                group.add(base, dome);
            }
        }

        return group;
    }

    // ----------------------------------------------------
    // 1:1 EXACT 3D MODEL THUMBNAIL RENDERER FOR UI DOCK CARDS
    // Guarantees the UI option card preview matches the 3D scene model 100%!
    // ----------------------------------------------------
    getExact3DOptionThumbnail(taskId, optionId) {
        if (!this.optionThumbCache) this.optionThumbCache = {};
        const key = `${taskId}_${optionId}`;
        if (this.optionThumbCache[key]) return this.optionThumbCache[key];

        if (!window.THREE) return `assets/designs/${taskId}_${optionId}.jpg`;

        try {
            if (!this.thumbRenderer) {
                this.thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
                this.thumbRenderer.setSize(260, 170);
                this.thumbRenderer.setPixelRatio(1);
            }

            const miniScene = new THREE.Scene();
            miniScene.background = new THREE.Color(0x121726);

            const amb = new THREE.AmbientLight(0xfff1d6, 0.95);
            miniScene.add(amb);
            const dir = new THREE.DirectionalLight(0xffdf9e, 1.45);
            dir.position.set(5, 8, 6);
            miniScene.add(dir);

            const modelGroup = this.createFurnitureModelGroup(taskId, optionId);
            miniScene.add(modelGroup);

            // Compute exact bounding box of the 3D furniture group to frame it cleanly
            const box = new THREE.Box3().setFromObject(modelGroup);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);

            // Add studio floor under model
            const floor = new THREE.Mesh(
                new THREE.PlaneGeometry(40, 40),
                new THREE.MeshStandardMaterial({ map: this.getTexture('carrara_marble'), roughness: 0.15 })
            );
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(center.x, box.min.y - 0.02, center.z);
            miniScene.add(floor);

            const maxDim = Math.max(size.x, size.y, size.z, 2.2);
            const dist = maxDim * 1.15;

            const cam = new THREE.PerspectiveCamera(42, 260 / 170, 0.1, 100);
            cam.position.set(center.x + dist * 0.72, center.y + dist * 0.55, center.z + dist * 0.88);
            cam.lookAt(center);

            this.thumbRenderer.render(miniScene, cam);
            const dataUrl = this.thumbRenderer.domElement.toDataURL('image/png');
            this.optionThumbCache[key] = dataUrl;
            return dataUrl;
        } catch (e) {
            return `assets/designs/${taskId}_${optionId}.jpg`;
        }
    }

    buildSingleFurniture3D(id, optionId) {
        if (!this.scene) return;
        if (this.upgradeMeshes[id]) {
            this.scene.remove(this.upgradeMeshes[id]);
        }

        const def = this.renovationDefs[id];
        if (!def) return;

        const group = this.createFurnitureModelGroup(id, optionId);

        // Tag all child meshes with taskId for 3D Raycasting tap detection
        group.traverse(obj => {
            if (obj.isMesh) {
                obj.userData.taskId = id;
            }
        });

        this.upgradeMeshes[id] = group;
        this.scene.add(group);
    }

    addRenovationBeacon3D(id) {
        const def = this.renovationDefs[id];
        if (!def || !this.scene) return;

        const isCompleted = this.isTaskCompleted(id);
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        const canAfford = !isCompleted && (balance >= def.baseCost && stars >= def.starsNeeded);

        const group = new THREE.Group();
        const beaconColor = isCompleted ? 0x00f0ff : (canAfford ? 0x2ecc71 : 0xffd700);

        const marker = new THREE.Mesh(
            new THREE.OctahedronGeometry(isCompleted ? 0.22 : 0.34, 0),
            new THREE.MeshStandardMaterial({
                color: beaconColor,
                emissive: beaconColor,
                emissiveIntensity: 0.45,
                metalness: 0.85,
                roughness: 0.15
            })
        );
        marker.userData.taskId = id;
        group.add(marker);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.38, 0.58, 24),
            new THREE.MeshBasicMaterial({
                color: beaconColor,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: isCompleted ? 0.3 : 0.75
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.55;
        ring.userData.taskId = id;
        group.add(ring);

        group.position.copy(def.pos);
        group.position.y += 0.85;
        this.scene.add(group);

        this.interactivePoints.push({
            id,
            name: def.name,
            room: def.room,
            group,
            marker,
            ring,
            pos: def.pos,
            isCompleted,
            canAfford
        });
    }

    refreshBeaconColors() {
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;

        this.interactivePoints.forEach(pt => {
            const def = this.renovationDefs[pt.id];
            if (!def) return;
            pt.isCompleted = this.isTaskCompleted(pt.id);
            pt.canAfford = !pt.isCompleted && (balance >= def.baseCost && stars >= def.starsNeeded);
            const col = pt.isCompleted ? 0x00f0ff : (pt.canAfford ? 0x2ecc71 : 0xffd700);
            if (pt.marker && pt.marker.material) {
                pt.marker.material.color.setHex(col);
                pt.marker.material.emissive.setHex(col);
            }
            if (pt.ring && pt.ring.material) {
                pt.ring.material.color.setHex(col);
            }
        });
    }

    // ----------------------------------------------------
    // 7. 3D CONTROLS: JOYSTICK, TOUCH LOOK, RAYCAST TAP & WASD
    // ----------------------------------------------------
    setupControls3D() {
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

        const joyZone = document.getElementById('mobileJoystickZone');
        const joyKnob = document.getElementById('joystickKnob');

        if (joyZone) {
            joyZone.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                joyZone.setPointerCapture(e.pointerId);
                const rect = joyZone.getBoundingClientRect();
                this.touch.joystickActive = true;
                this.player.targetPos = null;
                this.touch.joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                this.updateJoystick(e.clientX, e.clientY, joyKnob);
            });

            joyZone.addEventListener('pointermove', (e) => {
                if (!this.touch.joystickActive) return;
                e.preventDefault();
                e.stopPropagation();
                this.updateJoystick(e.clientX, e.clientY, joyKnob);
            });

            const resetJoy = () => {
                this.touch.joystickActive = false;
                this.touch.joystickDelta = { x: 0, y: 0 };
                if (joyKnob) joyKnob.style.transform = 'translate(-50%, -50%)';
            };
            joyZone.addEventListener('pointerup', resetJoy);
            joyZone.addEventListener('pointercancel', resetJoy);
        }

        if (this.renderer && this.renderer.domElement) {
            const dom = this.renderer.domElement;
            dom.addEventListener('pointerdown', (e) => {
                this.touch.lookActive = true;
                this.touch.moved = false;
                this.touch.startLook = { x: e.clientX, y: e.clientY };
                this.touch.lastLook = { x: e.clientX, y: e.clientY };
                dom.setPointerCapture(e.pointerId);
            });

            dom.addEventListener('pointermove', (e) => {
                if (!this.touch.lookActive) return;
                const dx = e.clientX - this.touch.lastLook.x;
                const dy = e.clientY - this.touch.lastLook.y;
                if (Math.hypot(e.clientX - this.touch.startLook.x, e.clientY - this.touch.startLook.y) > 8) {
                    this.touch.moved = true;
                    this.player.targetYaw = null;
                    this.player.targetPitch = null;
                }
                this.touch.lastLook = { x: e.clientX, y: e.clientY };

                this.player.rot.yaw -= dx * 0.0052;
                this.player.rot.pitch -= dy * 0.0042;
                this.player.rot.pitch = Math.max(-Math.PI / 2.6, Math.min(Math.PI / 2.6, this.player.rot.pitch));
            });

            const endLook = (e) => {
                if (!this.touch.lookActive) return;
                this.touch.lookActive = false;
                if (!this.touch.moved) {
                    this.handleCanvasTap3D(e.clientX, e.clientY);
                }
            };
            dom.addEventListener('pointerup', endLook);
            dom.addEventListener('pointercancel', () => { this.touch.lookActive = false; });
        }
    }

    updateJoystick(clientX, clientY, knob) {
        const maxDist = 38;
        const dx = clientX - this.touch.joystickOrigin.x;
        const dy = clientY - this.touch.joystickOrigin.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        if (knob) {
            knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
        }
        this.touch.joystickDelta = {
            x: clampedX / maxDist,
            y: clampedY / maxDist
        };
    }

    handleCanvasTap3D(clientX, clientY) {
        if (!this.renderer || !this.camera || !this.raycaster) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointerNDA.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.pointerNDA.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.pointerNDA, this.camera);
        const hits = this.raycaster.intersectObjects(this.scene.children, true);

        for (const hit of hits) {
            let obj = hit.object;
            while (obj) {
                if (obj.userData && obj.userData.taskId) {
                    const taskId = obj.userData.taskId;
                    this.focusCameraOnTask(taskId);
                    this.openBottomDesignDock(taskId, true);
                    return;
                }
                obj = obj.parent;
            }
        }
    }

    focusCameraOnTask(taskId) {
        const def = this.renovationDefs[taskId];
        if (!def) return;
        if (def.room && def.room !== this.currentRoom) {
            this.currentRoom = def.room;
        }
        if (def.camView) {
            this.player.currentFloor = def.camView.y > 5 ? 2 : 1;
            const yOffset = this.isIsometricCamera ? 2.15 : 0;
            const pitchOffset = this.isIsometricCamera ? -0.26 : 0;
            this.player.targetPos = new THREE.Vector3(def.camView.x, def.camView.y + yOffset, def.camView.z + (this.isIsometricCamera ? 1.8 : 0));
            this.player.targetYaw = def.camView.yaw;
            this.player.targetPitch = Math.max(-0.68, def.camView.pitch + pitchOffset);
        }
    }

    toggleCameraAngleMode() {
        this.isIsometricCamera = !this.isIsometricCamera;
        const btn = document.getElementById('ghToggleAngleBtn');
        if (btn) {
            btn.innerHTML = this.isIsometricCamera ? '🚶 Serbest 3D Kamera' : '📐 İzometrik 3D Açı';
        }
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        const baseY = (this.player.currentFloor === 2) ? 7.75 : 1.75;
        if (this.isIsometricCamera) {
            this.player.targetPos = new THREE.Vector3(rm.spawnPos.x - 1.5, baseY + 2.45, rm.spawnPos.z + 2.2);
            this.player.targetYaw = (rm.spawnPos.yaw || 0) - 0.22;
            this.player.targetPitch = -0.38;
            this.showBanner('📐 İzometrik 3D Panoramik Kamera Açısına Geçildi');
        } else {
            this.player.targetPos = new THREE.Vector3(rm.spawnPos.x, baseY, rm.spawnPos.z);
            this.player.targetYaw = rm.spawnPos.yaw || 0;
            this.player.targetPitch = rm.spawnPos.pitch || -0.08;
            this.showBanner('🚶 Serbest 3D Gezinti Kamera Açısına Geçildi');
        }
    }

    // ----------------------------------------------------
    // 8. ANIMATION LOOP, MOVEMENT & MINIMAP
    // ----------------------------------------------------
    animate() {
        requestAnimationFrame(this.animate);
        if (!this.renderer || !this.scene || !this.camera) return;

        const dt = Math.min(0.05, this.clock.getDelta());
        const elapsed = this.clock.getElapsedTime();

        if (!this.isMapMode) {
            this.updateMovement3D(dt);
            this.updateBeaconsAndParticles3D(dt, elapsed);
            this.drawMinimap();
            this.renderer.render(this.scene, this.camera);
        }
    }

    updateMovement3D(dt) {
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
            this.player.targetPos = null;
            this.player.targetYaw = null;
            this.player.targetPitch = null;

            const moveSpeed = this.player.speed * (this.keys.run ? 1.5 : 1.0);
            const yaw = this.player.rot.yaw;

            const fX = -Math.sin(yaw) * forward;
            const fZ = -Math.cos(yaw) * forward;
            const sX = Math.cos(yaw) * right;
            const sZ = -Math.sin(yaw) * right;

            const moveDir = new THREE.Vector2(fX + sX, fZ + sZ).normalize().multiplyScalar(moveSpeed * dt);
            this.player.pos.x = Math.max(-27.2, Math.min(28.8, this.player.pos.x + moveDir.x));
            this.player.pos.z = Math.max(-31.5, Math.min(9.2, this.player.pos.z + moveDir.y));

            this.stepTimer = (this.stepTimer || 0) + dt;
            if (this.stepTimer > 0.42) {
                this.playSound('step');
                this.stepTimer = 0;
            }
        } else if (this.player.targetPos) {
            this.player.pos.lerp(this.player.targetPos, Math.min(1, dt * 6));
            if (this.player.pos.distanceTo(this.player.targetPos) < 0.05) {
                this.player.targetPos = null;
            }
        }

        if (typeof this.player.targetYaw === 'number') {
            this.player.rot.yaw += (this.player.targetYaw - this.player.rot.yaw) * Math.min(1, dt * 6);
        }
        if (typeof this.player.targetPitch === 'number') {
            this.player.rot.pitch += (this.player.targetPitch - this.player.rot.pitch) * Math.min(1, dt * 6);
        }

        this.camera.position.copy(this.player.pos);
        this.camera.rotation.y = this.player.rot.yaw;
        this.camera.rotation.x = this.player.rot.pitch;

        this.detectRoomFromPosition();
        this.updateCurrentLocationTag();
    }

    detectRoomFromPosition() {
        if (!this.player.isMoving) return;
        const x = this.player.pos.x;
        const z = this.player.pos.z;
        let detected = this.currentRoom;

        if (this.player.currentFloor === 2) {
            detected = 'penthouse';
        } else if (z < -13.5) {
            if (x > 10) detected = 'spa';
            else if (x < -7) detected = 'garden';
            else detected = 'pool';
        } else if (x < -12.5) {
            detected = 'room101';
        } else if (x > 12.2) {
            detected = 'restaurant';
        } else {
            detected = 'lobby';
        }

        if (detected !== this.currentRoom) {
            this.currentRoom = detected;
            const active = this.getAreaActiveTask(detected);
            if (active) this.selectedAreaId = active.id;
            this.updateProximityPanel();
        }
    }

    updateBeaconsAndParticles3D(dt, elapsed) {
        let nearest = null;
        let minDist = 6.5;

        this.interactivePoints.forEach(pt => {
            if (pt.marker) {
                pt.marker.rotation.y += dt * 1.8;
                pt.marker.position.y = Math.sin(elapsed * 3.2 + pt.pos.x) * 0.14;
            }
            if (pt.ring) {
                pt.ring.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.12);
            }
            const dist = this.player.pos.distanceTo(pt.pos);
            if (dist < minDist) {
                minDist = dist;
                nearest = pt;
            }
        });

        this.activeBeacon = nearest;
        const prompt = document.getElementById('actionPrompt');
        if (prompt) {
            if (nearest && !this.isRenovationDockOpen) {
                const def = this.renovationDefs[nearest.id];
                const isDone = this.isTaskCompleted(nearest.id);
                prompt.innerHTML = `
                    <div class="prompt-icon">${isDone ? '✅' : '🔨'}</div>
                    <div class="prompt-text" onclick="hotel3D.openBottomDesignDock('${nearest.id}', true)">
                        <strong>${def.name}</strong>
                        <span>${isDone ? 'Kuruldu (3 Tasarımı Gör)' : `3 Tasarımdan Seç & Kur ($${def.baseCost})`}</span>
                    </div>
                `;
                prompt.style.display = 'flex';
            } else {
                prompt.style.display = 'none';
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.userData.life -= dt;
            if (p.userData.life <= 0) {
                this.scene.remove(p);
                this.particles.splice(i, 1);
                continue;
            }
            p.userData.vy -= 7.5 * dt;
            p.position.x += p.userData.vx * dt;
            p.position.y += p.userData.vy * dt;
            p.position.z += p.userData.vz * dt;
            p.rotation.x += 5 * dt;
            p.rotation.y += 5 * dt;
        }
    }

    triggerActiveBeacon() {
        const targetId = (this.activeBeacon && this.activeBeacon.id)
            ? this.activeBeacon.id
            : this.getCurrentSequentialAreaId(this.currentRoom);
        if (targetId) {
            this.focusCameraOnTask(targetId);
            this.openBottomDesignDock(targetId, true);
        }
    }

    setupMinimap() {
        this.radarCanvas = document.getElementById('radarCanvas');
        if (this.radarCanvas) {
            this.radarCtx = this.radarCanvas.getContext('2d');
        }
    }

    drawMinimap() {
        if (!this.radarCtx || !this.radarCanvas) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;
        ctx.clearRect(0, 0, w, h);

        const scale = 1.65;
        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.42)';
        ctx.lineWidth = 1.2;
        const mapRooms = [
            { x: 0, z: 0, w: 24, d: 20 },
            { x: -21, z: -10.5, w: 14, d: 15 },
            { x: 21, z: 0, w: 18, d: 20 },
            { x: 4, z: -22, w: 48, d: 20 }
        ];
        mapRooms.forEach(r => {
            const rx = cx + (r.x - this.player.pos.x) * scale;
            const ry = cy + (r.z - this.player.pos.z) * scale;
            ctx.strokeRect(rx - (r.w * scale) / 2, ry - (r.d * scale) / 2, r.w * scale, r.d * scale);
        });

        this.interactivePoints.forEach(pt => {
            const bx = cx + (pt.pos.x - this.player.pos.x) * scale;
            const by = cy + (pt.pos.z - this.player.pos.z) * scale;
            ctx.fillStyle = pt.isCompleted ? '#00f0ff' : (pt.canAfford ? '#2ecc71' : '#ffd700');
            ctx.beginPath();
            ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-this.player.rot.yaw);
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3.5, 4);
        ctx.lineTo(-3.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // ----------------------------------------------------
    // 9. MAP MODE & CAMERA RESET
    // ----------------------------------------------------
    toggleMapMode(forceState) {
        if (typeof forceState === 'boolean') {
            this.isMapMode = forceState;
        } else {
            this.isMapMode = !this.isMapMode;
        }

        const btn = document.getElementById('ghToggleMapBtn');
        if (btn) {
            btn.innerHTML = this.isMapMode ? '🚶 3D Gezintiye Dön' : '🗺️ Harita';
        }

        this.renderStage();
        this.updateCurrentLocationTag();
    }

    resetCameraView() {
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        if (rm && rm.spawnPos) {
            this.player.currentFloor = rm.spawnPos.floor || 1;
            this.player.targetPos = new THREE.Vector3(rm.spawnPos.x, rm.spawnPos.y, rm.spawnPos.z);
            this.player.targetYaw = rm.spawnPos.yaw;
            this.player.targetPitch = rm.spawnPos.pitch;
        }
        this.showBanner('🔍 3D Kamera oda merkezine hizalandı.');
    }

    renderStage() {
        if (!this.mapHolder || !this.canvasHolder) return;
        const controlsLayer = document.getElementById('hotel3DMobileControls');

        if (this.isMapMode) {
            this.canvasHolder.style.display = 'none';
            if (controlsLayer) controlsLayer.style.display = 'none';
            this.mapHolder.style.display = 'block';
            this.renderIsometricHotelMap(this.mapHolder);
        } else {
            this.mapHolder.style.display = 'none';
            this.canvasHolder.style.display = 'block';
            if (controlsLayer) controlsLayer.style.display = 'flex';
            const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
            const dlgEl = document.getElementById('hotelDialogueText');
            const activeTask = this.getAreaActiveTask(this.currentRoom);
            if (dlgEl) {
                if (activeTask) {
                    dlgEl.textContent = `${rm.shortName} Sıradaki Görev: "${activeTask.name}" ($${activeTask.baseCost}) — 3D mekanda dolaşın veya 3 lüks tasarımdan birini seçip kurun!`;
                } else {
                    dlgEl.textContent = `👑 Tebrikler! ${rm.shortName} içindeki tüm 3D restorasyon görevleri tamamlandı!`;
                }
            }
        }
    }

    renderIsometricHotelMap(container) {
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        let nodesHtml = '';

        Object.keys(this.rooms).forEach((roomKey) => {
            const rm = this.rooms[roomKey];
            const totalTasks = rm.tasks.length;
            const doneCount = this.getAreaCompletedTasks(roomKey).length;
            const activeTask = this.getAreaActiveTask(roomKey);
            const isAllDone = (doneCount >= totalTasks);
            const isReady = activeTask && (balance >= activeTask.baseCost);

            let statusPill = `<span class="map-node-pill">${doneCount}/${totalTasks} Görev</span>`;
            if (isAllDone) {
                statusPill = `<span class="map-node-pill done">✅ TAMAMLANDI</span>`;
            } else if (isReady) {
                statusPill = `<span class="map-node-pill ready">🔨 YENİLEME HAZIR!</span>`;
            }

            nodesHtml += `
                <button class="gh-iso-map-node ${this.currentRoom === roomKey ? 'current' : ''} ${isReady ? 'ready-pulse' : ''}"
                        style="left: ${rm.mapPos.x}%; top: ${rm.mapPos.y}%;"
                        onclick="hotel3D.jumpTo('${roomKey}')">
                    <div class="map-node-thumb" style="background-image: url('${rm.bgImg}');"></div>
                    <div class="map-node-meta">
                        <strong>${rm.shortName}</strong>
                        ${statusPill}
                    </div>
                </button>
            `;
        });

        container.innerHTML = `
            <div class="gh-room-canvas gh-isometric-map-canvas" style="background-image: linear-gradient(180deg, rgba(10,14,24,0.35), rgba(10,14,24,0.68)), url('assets/scene_hotel_exterior.jpg');">
                <div class="gh-map-header-banner">
                    <span>✦ AURELIA PALACE 3D OTEL HARİTASI — Gitmek istediğiniz odaya dokunun!</span>
                </div>
                ${nodesHtml}
            </div>
        `;
    }

    // ----------------------------------------------------
    // 10. PROXIMITY / AREA TASK SHEET (#renovationProximityPanel)
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

        let tasksListHtml = '';
        tasks.forEach((t) => {
            const installed = this.getInstalledOption(t.id);
            const isCompleted = Boolean(installed);
            const isActive = (activeTask && t.id === activeTask.id);

            let rowClass = 'task-row-locked';
            let badgeClass = 'badge-locked';
            let badgeText = `🔒 Görev ${t.order}`;
            let descText = t.defaultDesc;

            if (isCompleted) {
                const opt = t.options.find(o => o.id === installed.optionId) || t.options[0];
                rowClass = 'task-row-completed';
                badgeClass = 'badge-done';
                badgeText = '✅ KURULDU';
                descText = `Kalıcı Tasarım: <b>${opt.name}</b> (${opt.style})`;
            } else if (isActive) {
                const canAfford = (balance >= t.baseCost && stars >= t.starsNeeded);
                rowClass = 'task-row-active';
                badgeClass = canAfford ? 'badge-ready' : 'badge-saving';
                badgeText = canAfford ? `🟢 HAZIR ($${t.baseCost})` : `🎯 AKTİF ($${t.baseCost})`;
                descText = t.defaultDesc;
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
                                    onclick="hotel3D.focusCameraOnTask('${t.id}'); hotel3D.openBottomDesignDock('${t.id}', true)">
                                ${balance >= t.baseCost ? '3 Tasarımdan Seç ➔' : `3 Tasarımı Gör ($${t.baseCost})`}
                            </button>
                        ` : `
                            <button class="task-action-btn btn-gold"
                                    onclick="hotel3D.focusCameraOnTask('${t.id}'); hotel3D.openBottomDesignDock('${t.id}', true)">
                                👁️ 3D Önizle ($${t.baseCost})
                            </button>
                        `)}
                    </div>
                </div>
            `;
        });

        let activeCardHtml = '';
        if (activeTask) {
            const cost = activeTask.baseCost;
            const canAfford = (balance >= cost && stars >= activeTask.starsNeeded);
            const stillNeeded = Math.max(0, cost - balance);
            const taskThumb = this.getExact3DOptionThumbnail(activeTask.id, activeTask.options[0].id) || `assets/designs/${activeTask.id}_opt_a.jpg`;

            activeCardHtml = `
                <div class="gh-gossip-task-card ${canAfford ? 'card-ready' : 'card-saving'}">
                    <div class="gh-gt-header">
                        <span class="gh-gt-tag ${canAfford ? 'tag-ready' : 'tag-saving'}">
                            ${canAfford ? '🟢 BÜTÇE HAZIR! 3 TASARIMDAN SEÇİN' : '⏳ BÜTÇE BİRİKTİRİLİYOR'}
                        </span>
                        <span class="gh-gt-step">GÖREV ${activeTask.order} / ${tasks.length}</span>
                    </div>

                    <div class="gh-gt-body">
                        <div class="gh-gt-thumb" style="background-image: url('${taskThumb}');">
                            <span class="gh-gt-thumb-badge">${activeTask.order}</span>
                        </div>
                        <div class="gh-gt-info">
                            <h4>${activeTask.name}</h4>
                            <p>${activeTask.defaultDesc}</p>
                            <div class="gh-gt-reward-pills">
                                <span class="rw-pill income">+$${activeTask.options[0].incomeBoost}/dk Gelir</span>
                                <span class="rw-pill rep">+${activeTask.options[0].repBoost} Prestij</span>
                            </div>
                        </div>
                    </div>

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

                    <div class="gh-gt-action-bar">
                        <button class="gh-gt-btn-renovate ${canAfford ? 'pulse' : ''}" onclick="hotel3D.focusCameraOnTask('${activeTask.id}'); hotel3D.openBottomDesignDock('${activeTask.id}', true)">
                            🎨 3 FARKLI TASARIMI 3D ÖNİZLE &amp; KUR ($${cost})
                        </button>
                        ${!canAfford ? `
                            <button class="gh-gt-btn-earn" onclick="hotel3D.goToMergeBoardForFunds('${activeTask.id}', ${stillNeeded})">
                                ⚡ Masada Kazan ($${stillNeeded} Eksik)
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            activeCardHtml = `
                <div class="gh-area-completed-banner">
                    <div class="completed-icon">👑</div>
                    <div class="completed-text">
                        <h4>${rm.name.toUpperCase()} TAMAMEN RESTORE EDİLDİ!</h4>
                        <p>Bu alandaki tüm 3D lüks mobilyalar ve dekorasyonlar kalıcı olarak kuruldu!</p>
                    </div>
                </div>
            `;
        }

        proxPanel.innerHTML = `
            <div class="gh-area-hub-wrapper">
                <div class="gh-hub-header">
                    <div class="gh-hub-title-box">
                        <span class="gh-hub-crest">✦ AURELIA PALACE 3D RESTORASYON MERKEZİ</span>
                        <h3>${rm.name}</h3>
                        <p>${rm.description}</p>
                    </div>
                    <div class="gh-hub-lvl-badge">
                        <span class="gh-hub-lvl-num">SEVİYE ${areaLevel}</span>
                        <span class="gh-hub-lvl-pct">%${progressPct} (${completedTasks.length}/${tasks.length})</span>
                    </div>
                </div>

                <div class="gh-hub-progress-track">
                    <div class="gh-hub-progress-bar" style="width: ${progressPct}%;"></div>
                </div>

                ${activeCardHtml}

                <div class="gh-area-tasks-section">
                    <h4 class="gh-tasks-sec-title">📋 ${rm.shortName} Restorasyon Adımları (${tasks.length} Aşama)</h4>
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
            noticeEl.innerHTML = `🎯 <b>Otel Renovasyonu İçin:</b> 5 müşterinin siparişlerini tamamlayarak eksik <b>$${neededAmount}</b> altını kazanın!`;
        }
    }

    // ----------------------------------------------------
    // 11. 3-OPTION CUSTOMIZATION DOCK (#ghBottomDesignDock)
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

        // Live 3D mesh update in the 3D scene!
        this.buildSingleFurniture3D(targetId, chosenOpt.id);
        this.updateLobbyEnvironmentProgression();
        this.focusCameraOnTask(targetId);

        dock.style.display = 'block';
        this.renderBottomDesignDock();
        this.updateProximityPanel();

        if (scrollAndPulse) {
            dock.classList.remove('dock-pulse-highlight');
            void dock.offsetWidth;
            dock.classList.add('dock-pulse-highlight');
            setTimeout(() => {
                if (dock.scrollIntoView) {
                    dock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 60);
        }
    }

    closeBottomDesignDock() {
        const prev = this.previewingRenovation;
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;

        if (prev && prev.id) {
            const installed = this.getInstalledOption(prev.id);
            this.buildSingleFurniture3D(prev.id, installed ? installed.optionId : null);
        }
        this.updateLobbyEnvironmentProgression();

        const dock = document.getElementById('ghBottomDesignDock');
        if (dock) {
            dock.classList.remove('dock-pulse-highlight');
            dock.style.display = 'none';
            dock.innerHTML = '';
        }
        this.updateProximityPanel();
    }

    selectBottomDockOption(taskId, idx) {
        const def = this.renovationDefs[taskId];
        if (!def || !def.options[idx]) return;
        this.selectedAreaId = taskId;
        this.selectedOptionIndex = idx;
        const opt = def.options[idx];
        this.previewingRenovation = { id: taskId, optionId: opt.id };

        this.playSound('chime');
        // Update 3D furniture live in Three.js world!
        this.buildSingleFurniture3D(taskId, opt.id);
        this.updateLobbyEnvironmentProgression();
        this.focusCameraOnTask(taskId);
        this.renderBottomDesignDock();
        this.showBanner(`👁️ 3D Önizleme: "${opt.name}" (${opt.style})`);
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
            const thumbSrc = this.getExact3DOptionThumbnail(def.id, opt.id) || opt.previewImg || `assets/designs/${def.id}_${opt.id}.jpg`;

            cardsHtml += `
                <div class="gh-dock-option-card ${isSelected ? 'active' : ''}"
                     onclick="hotel3D.selectBottomDockOption('${def.id}', ${idx})">
                    <div class="gh-dock-thumb" style="background-image: url('${thumbSrc}');">
                        <span class="gh-dock-opt-num">${idx + 1}. ${opt.style}</span>
                        ${isSelected ? '<span class="gh-dock-check-tag">✓ 3D EŞLEŞMELİ</span>' : '<span class="gh-dock-lock-tag">👁️ 3D Önizle</span>'}
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
                    <span class="gh-dock-lvl-badge">🎨 GÖREV ${def.order} · 3 SEÇENEKLİ 3D ÖZELLEŞTİRME</span>
                    <h4>${def.name} — 3 Tasarımdan Birini Seçip Kalıcı Olarak Kurun:</h4>
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
                            ✓ Seçimi Onayla &amp; 3D Mekana Kalıcı Kur ($${cost})
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
    // 12. PERMANENT PURCHASE & 3D PARTICLE BURST
    // ----------------------------------------------------
    executePurchase(taskId, optionId) {
        const def = this.renovationDefs[taskId];
        if (!def) return;

        if (this.isTaskCompleted(taskId)) {
            this.closeBottomDesignDock();
            this.showBanner('✅ Bu alan zaten kalıcı olarak yenilendi!');
            return;
        }

        const opt = def.options.find(o => o.id === optionId) || def.options[0];
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
                this.showBanner('Yetersiz altın veya yıldız! Masadan sipariş teslim edin.');
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

        // Permanently save chosen design option
        this.state.renovations[taskId] = { optionId, completed: true, timestamp: Date.now() };
        this.isRenovationDockOpen = false;
        this.previewingRenovation = null;

        // Permanently build chosen 3D model & update beacon
        this.buildSingleFurniture3D(taskId, optionId);
        this.updateLobbyEnvironmentProgression();
        this.refreshBeaconColors();
        this.spawn3DConfetti(def.pos);

        this.recalcHotelStats();
        this.saveState();

        this.playSound('renovate');
        this.burstConfetti();
        this.closeBottomDesignDock();

        const nextTask = this.getAreaActiveTask(this.currentRoom);
        if (nextTask) {
            this.selectedAreaId = nextTask.id;
        }

        this.updateProximityPanel();
        this.renderHotelAreaCards();

        if (nextTask) {
            this.showBanner(`✨ "${opt.name}" 3D otele kalıcı olarak kuruldu! Sıradaki görev: "${nextTask.name}"`);
        } else {
            const rm = this.rooms[this.currentRoom];
            this.showBanner(`👑 Tebrikler! "${rm.shortName}" tüm 3D restorasyon görevleri tamamlandı!`);
        }
    }

    spawn3DConfetti(pos) {
        if (!this.scene || !window.THREE) return;
        const colors = [0xffd700, 0x2ecc71, 0xff4757, 0x38bdf8, 0xffffff];
        for (let i = 0; i < 36; i++) {
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.14, 0.04),
                new THREE.MeshBasicMaterial({ color: colors[i % colors.length] })
            );
            mesh.position.copy(pos);
            mesh.position.y += 1.2;
            mesh.userData = {
                vx: (Math.random() - 0.5) * 4.5,
                vy: 2.5 + Math.random() * 4.0,
                vz: (Math.random() - 0.5) * 4.5,
                life: 2.2
            };
            this.scene.add(mesh);
            this.particles.push(mesh);
        }
    }

    burstConfetti() {
        const stage = document.getElementById('ghSceneStage');
        if (!stage) return;
        const colors = ['#ffd700', '#2ecc71', '#ff4757', '#00d2d3', '#ffffff', '#ff9f43'];
        for (let i = 0; i < 30; i++) {
            const conf = document.createElement('div');
            conf.className = 'gh-celebration-confetti';
            conf.style.left = `${40 + Math.random() * 20}%`;
            conf.style.top = `${45 + Math.random() * 20}%`;
            conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const tx = (Math.random() - 0.5) * 240;
            const ty = -(60 + Math.random() * 150);
            conf.style.setProperty('--tx', `${tx}px`);
            conf.style.setProperty('--ty', `${ty}px`);
            stage.appendChild(conf);
            setTimeout(() => {
                if (conf.parentNode) conf.parentNode.removeChild(conf);
            }, 1350);
        }
    }

    // ----------------------------------------------------
    // 13. ROOM NAVIGATION & TELEPORTATION
    // ----------------------------------------------------
    jumpTo(roomKey, silent = false) {
        if (!this.rooms[roomKey]) return;

        this.isMapMode = false;
        this.currentRoom = roomKey;
        const rm = this.rooms[roomKey];

        if (rm.spawnPos) {
            this.player.currentFloor = rm.spawnPos.floor || 1;
            this.player.pos.set(rm.spawnPos.x, rm.spawnPos.y, rm.spawnPos.z);
            this.player.rot.yaw = rm.spawnPos.yaw || 0;
            this.player.rot.pitch = rm.spawnPos.pitch || -0.08;
            this.player.targetPos = null;
            this.player.targetYaw = null;
            this.player.targetPitch = null;
        }

        const activeTask = this.getAreaActiveTask(roomKey);
        if (activeTask) {
            this.selectedAreaId = activeTask.id;
        }

        if (!silent) {
            this.playSound('door');
        }

        document.querySelectorAll('.room-jump-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.room-jump-btn[onclick*="${roomKey}"]`);
        if (btn) btn.classList.add('active');

        this.closeBottomDesignDock();
        this.renderStage();
        this.updateProximityPanel();
        this.updateCurrentLocationTag();
        if (!silent) {
            this.showBanner(`📍 3D ${rm.name} alanına geçildi.`);
        }
    }

    goToAndOpenRenovation(taskId) {
        const def = this.renovationDefs[taskId];
        if (!def) return;
        const alertBox = document.getElementById('budgetAlertToast');
        if (alertBox) alertBox.style.display = 'none';

        if (window.switchMainPage) {
            window.switchMainPage('pageHotel');
        }

        this.jumpTo(def.room, true);
        setTimeout(() => {
            this.onResize();
            this.focusCameraOnTask(taskId);
            this.openBottomDesignDock(taskId, true);
        }, 120);
    }

    checkAffordableNotifications() {
        const activeTask = this.getAreaActiveTask(this.currentRoom);
        if (!activeTask) return;
        const balance = window.GameEconomy ? window.GameEconomy.getBalance() : this.state.coins;
        const stars = window.GameEconomy ? window.GameEconomy.getStars() : this.state.stars;
        if (balance >= activeTask.baseCost && stars >= activeTask.starsNeeded) {
            if (!this.notifiedAffordable.has(activeTask.id)) {
                this.notifiedAffordable.add(activeTask.id);
            }
        }
    }

    // ----------------------------------------------------
    // 14. PASSIVE HOTEL INCOME & HUD
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
            window.GameEconomy.addHotelIncome(amt, '3D Otel Kasası Toplanan Pasif Gelir');
        } else {
            this.state.coins += amt;
            this.saveState();
        }
        this.showBanner(`💰 +$${amt} Otel İşletme Geliri Kasaya Eklendi!`);
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
            tag.innerText = '🗺️ Aurelia Palace — 3D Otel Haritası';
            return;
        }
        const rm = this.rooms[this.currentRoom] || this.rooms.restaurant;
        tag.innerText = `📍 ${rm.name}`;
    }

    showBanner(msg) {
        const el = document.getElementById('hudNotification');
        if (!el) return;
        el.innerText = msg;
        el.style.display = 'block';
        clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => {
            el.style.display = 'none';
        }, 3200);
    }

    // ----------------------------------------------------
    // 15. AREA SHOWCASE GALLERY & PROJECT PLAN MODAL
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

            let statusLabel = `SEVİYE ${level} (%${progress})`;
            let statusClass = 'badge-saving';

            if (completedCount >= tasks.length) {
                statusLabel = '✅ TAMAMLANDI';
                statusClass = 'badge-max';
            } else if (activeTask && balance >= activeTask.baseCost) {
                statusLabel = '🟢 YENİLEME HAZIR!';
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
                            <b>${activeTask ? `${activeTask.order}. ${activeTask.name} ($${activeTask.baseCost})` : 'Tüm 3D Mobilyalar Kuruldu!'}</b>
                        </div>
                        <div class="area-card-actions">
                            <button class="area-walk-btn" onclick="hotel3D.jumpTo('${roomKey}')">
                                🚶 3D Mekana Git &amp; Yenile ➔
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = cardsHtml;
    }

    openProjectPlanModal() {
        const modal = document.getElementById('projectPlanModal');
        if (!modal) return;

        let rowsHtml = '';
        Object.keys(this.rooms).forEach(roomKey => {
            const rm = this.rooms[roomKey];
            const activeTask = this.getAreaActiveTask(roomKey);
            const level = this.getAreaLevel(roomKey);
            const progress = this.getAreaProgress(roomKey);

            rowsHtml += `
                <div class="proj-area-row" style="margin-bottom:10px; background:#161924; border:1px solid rgba(255,215,0,0.22); border-radius:12px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <h4 style="margin:0; color:#fff; font-size:13px;">${rm.shortName}</h4>
                        <span style="font-size:10px; font-weight:800; color:#ffd700; background:rgba(255,215,0,0.15); padding:2px 8px; border-radius:6px;">SEVİYE ${level} (%${progress})</span>
                    </div>
                    <p style="margin:0 0 8px; font-size:11px; color:#cbd5e1;">${activeTask ? `Sıradaki: <b>${activeTask.name}</b> (Maliyet: $${activeTask.baseCost})` : '✅ Tüm görevler tamamlandı'}</p>
                    <button class="proj-go-btn" onclick="document.getElementById('projectPlanModal').style.display='none'; hotel3D.jumpTo('${roomKey}')">
                        🚶 3D Mekana Git &amp; Görevi Gör
                    </button>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="proj-modal-card">
                <div class="proj-header">
                    <div>
                        <span class="proj-crest">✦ AURELIA PALACE 3D RESTORASYON PLANI</span>
                        <h3>Tüm Otel Alanları &amp; İlerleme</h3>
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
        const stage = document.getElementById('ghSceneStage');
        if (!stage || !this.renderer || !this.camera) return;
        const w = stage.clientWidth || 390;
        const h = stage.clientHeight || 420;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
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
        window.hotel3D.onResize();
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
