// ========================================================
// VELVET SECRETS - 3D REALISTIC WALKABLE HOTEL SIMULATOR
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
            pos: new THREE.Vector3(0, 1.7, 8), // start inside grand lobby
            rot: { yaw: 0, pitch: 0 },
            velocity: new THREE.Vector3(0, 0, 0),
            speed: 5.5,
            radius: 0.45,
            currentFloor: 1, // 1: Ground floor, 2: Penthouse
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

        // Hotel State & Renovation Data
        this.loadSaveData();

        // Sound helper (Web Audio)
        this.initAudio();

        // Textures cache
        this.textures = {};

        // Initialize 3D Engine
        this.initThree();
        this.buildHotelEnvironment();
        this.setupControls();
        this.setupMinimap();

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        console.log("Hotel3DSimulator initialized successfully!");
    }

    // ----------------------------------------------------
    // SAVE DATA & ECONOMY
    // ----------------------------------------------------
    loadSaveData() {
        const saved = localStorage.getItem('velvet_hotel_3d_state');
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
            renovations: {
                reception_desk: 0,      // 0: Old wooden, 1: Carrara Marble & Gold
                lobby_chandelier: 0,    // 0: Dim bulb, 1: Imperial Crystal Chandelier
                lobby_carpet: 0,        // 0: Worn concrete, 1: Royal Velvet Red Carpet
                room101_bed: 0,         // 0: Dusty bed, 1: Luxury King Canopy Bed
                room101_decor: 0,       // 0: Bare walls, 1: French Riviera Suite Art & Balcony
                restaurant_bar: 0,      // 0: Shuttered bar, 1: Riviera Gold Cocktail Bar
                restaurant_tables: 0,   // 0: Empty floor, 1: VIP Dining Tables & Velvet Chairs
                swimming_pool: 0,       // 0: Empty dry pool, 1: Sparkling Turquoise Pool & Sunbeds
                spa_jacuzzi: 0,         // 0: Closed door, 1: Heated Hydrotherapy Jacuzzi
                penthouse_suite: 0      // 0: Dusty loft, 1: Ultra-Luxury Presidential Suite
            }
        };

        if (saved) {
            try {
                this.state = Object.assign(defaultState, JSON.parse(saved));
            } catch (e) {
                this.state = defaultState;
            }
        } else {
            this.state = defaultState;
        }

        // Renovation Catalog
        this.renovationDefs = {
            reception_desk: {
                id: 'reception_desk',
                stage: 1,
                name: 'Lobi Resepsiyon Masası',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 1.2, -4),
                costCoins: 200,
                costStars: 2,
                incomeBoost: 25,
                repBoost: 50,
                desc: 'Eski yıpranmış ahşap tezgahı altın işlemeli İtalyan Carrara mermeri ve VIP kayıt terminali ile yenileyin.',
                img: 'assets/hero_banner.jpg'
            },
            lobby_carpet: {
                id: 'lobby_carpet',
                stage: 1,
                name: 'Kraliyet Kadife Halısı & Zemin',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 0.4, 2),
                costCoins: 350,
                costStars: 3,
                incomeBoost: 30,
                repBoost: 70,
                desc: 'Lobi girişine altın bordürlü Fransız kadife kırmızı halı serin ve parlak mermer karoları cilalayın.',
                img: 'assets/scene_hotel_exterior.jpg'
            },
            lobby_chandelier: {
                id: 'lobby_chandelier',
                stage: 2,
                name: 'İmparatorluk Kristal Avizesi',
                area: 'Büyük Lobi',
                pos: new THREE.Vector3(0, 3.8, -1),
                costCoins: 500,
                costStars: 4,
                incomeBoost: 45,
                repBoost: 100,
                desc: 'Tavana 12 kollu parıldayan elmas kesim Bohemya kristal avize monte edin. Tüm lobiye altın ışıltı katacaktır.',
                img: 'assets/scene_romance_gala.jpg'
            },
            room101_bed: {
                id: 'room101_bed',
                stage: 3,
                name: 'Oda 101 Kraliyet Yatağı',
                area: 'Deluxe Deniz Suiti (Oda 101)',
                pos: new THREE.Vector3(-19, 1.2, -12),
                costCoins: 650,
                costStars: 5,
                incomeBoost: 60,
                repBoost: 120,
                desc: 'Kral dairesi yatak başlığı, kuş tüyü ortopedik şilte ve ipek saten çarşaflarla donatın.',
                img: 'assets/scene_presidential_suite.jpg'
            },
            room101_decor: {
                id: 'room101_decor',
                stage: 3,
                name: 'Oda 101 Panoramik Teras & Mobilya',
                area: 'Deluxe Deniz Suiti (Oda 101)',
                pos: new THREE.Vector3(-21, 1.2, -6),
                costCoins: 800,
                costStars: 6,
                incomeBoost: 75,
                repBoost: 150,
                desc: 'Akdeniz manzaralı balkon cam kapılarını açın, kadife berjer koltuklar ve mini şampanya barı ekleyin.',
                img: 'assets/scene_presidential_suite.jpg'
            },
            restaurant_bar: {
                id: 'restaurant_bar',
                stage: 4,
                name: 'Riviera Kokteyl & Şampanya Barı',
                area: 'Riviera Restoran',
                pos: new THREE.Vector3(20, 1.2, -6),
                costCoins: 950,
                costStars: 7,
                incomeBoost: 90,
                repBoost: 180,
                desc: 'Arkası ışıklı lüks içki vitrini, pirinç kaplama mermer bar tezgahı ve yüksek deri bar tabureleri yerleştirin.',
                img: 'assets/hero_banner.jpg'
            },
            restaurant_tables: {
                id: 'restaurant_tables',
                stage: 4,
                name: 'Gourmet Yemek Salonu Masaları',
                area: 'Riviera Restoran',
                pos: new THREE.Vector3(18, 1.2, 3),
                costCoins: 1100,
                costStars: 8,
                incomeBoost: 110,
                repBoost: 210,
                desc: 'Şamdanlı kristal yemek masaları ve özel şef mutfağını aktif ederek zengin misafirleri otele çekin.',
                img: 'assets/scene_romance_gala.jpg'
            },
            swimming_pool: {
                id: 'swimming_pool',
                stage: 5,
                name: 'Aurelia Sonsuzluk Havuzu & Şezlonglar',
                area: 'Açık Güneş Terası',
                pos: new THREE.Vector3(0, 1.0, -22),
                costCoins: 1400,
                costStars: 10,
                incomeBoost: 150,
                repBoost: 260,
                desc: 'Turkuaz termal suyla doldurun, su altı altın aydınlatmaları ve palmiyeli özel cabana çadırlarını kurun.',
                img: 'assets/scene_hotel_exterior.jpg'
            },
            spa_jacuzzi: {
                id: 'spa_jacuzzi',
                stage: 5,
                name: 'Zen Termal Jakuzi & Masaj Odası',
                area: 'Aurelia Spa & Sağlık',
                pos: new THREE.Vector3(18, 1.2, -22),
                costCoins: 1600,
                costStars: 12,
                incomeBoost: 180,
                repBoost: 300,
                desc: 'Sıcak hidromasaj jakuzisi, sedir ağacı sauna ve aromaterapi masaj yataklarını otele kazandırın.',
                img: 'assets/scene_isabella_letter.jpg'
            },
            penthouse_suite: {
                id: 'penthouse_suite',
                stage: 6,
                name: '2. Kat Başkanlık Penthouse Suiti',
                area: 'Aurelia Çatı Katı',
                pos: new THREE.Vector3(0, 7.2, 0),
                costCoins: 2500,
                costStars: 15,
                incomeBoost: 300,
                repBoost: 500,
                desc: 'Beyaz kuyruklu piyano, şömineli VIP salon ve 360 derece Riviera gün batımı terasını açarak otelinizi 5 Yıldıza ulaştırın!',
                img: 'assets/scene_presidential_suite.jpg'
            }
        };
    }

    saveState() {
        localStorage.setItem('velvet_hotel_3d_state', JSON.stringify(this.state));
        this.updateHUD();
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

        // Ambient Light
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
    // PROCEDURAL TEXTURE GENERATORS
    // ----------------------------------------------------
    getTexture(name) {
        if (this.textures[name]) return this.textures[name];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (name === 'carrara_marble') {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, 512, 512);
            // Draw marble veins
            ctx.strokeStyle = 'rgba(160, 165, 180, 0.25)';
            ctx.lineWidth = 3;
            for (let i = 0; i < 7; i++) {
                ctx.beginPath();
                let x = Math.random() * 512;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 50;
                    y += Math.random() * 60;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            // Gold subtle veins
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                let x = Math.random() * 512;
                let y = 0;
                ctx.moveTo(x, y);
                while (y < 512) {
                    x += (Math.random() - 0.5) * 40;
                    y += Math.random() * 80;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(200, 190, 180, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 256, 256);
            ctx.strokeRect(256, 0, 256, 256);
            ctx.strokeRect(0, 256, 256, 256);
            ctx.strokeRect(256, 256, 256, 256);
        } else if (name === 'velvet_carpet') {
            ctx.fillStyle = '#7a0c1a';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = 'rgba(140, 20, 35, 0.4)';
            for (let i = 0; i < 400; i++) {
                ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
            }
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 14;
            ctx.strokeRect(20, 20, 472, 472);
            ctx.lineWidth = 4;
            ctx.strokeRect(40, 40, 432, 432);
        } else if (name === 'oak_parquet') {
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = '#6b421a';
            for (let y = 0; y < 512; y += 64) {
                for (let x = 0; x < 512; x += 128) {
                    ctx.fillRect(x + ((y / 64) % 2 === 0 ? 0 : 64), y, 126, 62);
                }
            }
            ctx.strokeStyle = '#3a200e';
            ctx.lineWidth = 2;
            for (let y = 0; y < 512; y += 64) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(512, y);
                ctx.stroke();
            }
        } else if (name === 'wall_moulding') {
            ctx.fillStyle = '#f8f6f0';
            ctx.fillRect(0, 0, 512, 512);
            ctx.strokeStyle = '#c5a059';
            ctx.lineWidth = 8;
            ctx.strokeRect(40, 40, 432, 432);
            ctx.strokeStyle = '#e6cc8a';
            ctx.lineWidth = 3;
            ctx.strokeRect(55, 55, 402, 402);
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
        const wallTex = this.getTexture('wall_moulding');
        wallTex.repeat.set(4, 2);
        const parquetTex = this.getTexture('oak_parquet');
        parquetTex.repeat.set(6, 6);

        // 1. GRAND LOBBY FLOOR (x: [-12, 12], z: [-10, 10])
        const lobbyFloorGeo = new THREE.PlaneGeometry(24, 20);
        const lobbyFloorMat = new THREE.MeshStandardMaterial({
            map: marbleTex,
            roughness: 0.15,
            metalness: 0.1
        });
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

        // LOBBY WALLS with openings
        this.createWall(0, 2.5, 10, 24, 5, 0.4, wallTex, true, [-3, 3]); // South main door
        this.createWall(0, 2.5, -10, 24, 5, 0.4, wallTex, true, [-2, 2]); // North door to pool
        this.createWall(-12, 2.5, 0, 0.4, 5, 20, wallTex, true, null, [-2, 2]); // West door to rooms
        this.createWall(12, 2.5, 0, 0.4, 5, 20, wallTex, true, null, [-3, 3]); // East arch to restaurant

        // LOBBY COLUMNS
        [
            [-6, -4], [6, -4], [-6, 4], [6, 4]
        ].forEach(pos => {
            this.createColumn(pos[0], pos[1]);
        });

        // 2. WEST WING: CORRIDOR & GUEST SUITE 101
        const corridorFloorGeo = new THREE.PlaneGeometry(16, 6);
        const corridorFloor = new THREE.Mesh(corridorFloorGeo, new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.3 }));
        corridorFloor.rotation.x = -Math.PI / 2;
        corridorFloor.position.set(-20, 0, 0);
        corridorFloor.receiveShadow = true;
        this.scene.add(corridorFloor);

        const corridorCeil = new THREE.Mesh(corridorFloorGeo, ceilingMat);
        corridorCeil.rotation.x = Math.PI / 2;
        corridorCeil.position.set(-20, 4.5, 0);
        this.scene.add(corridorCeil);

        this.createWall(-20, 2.25, 3, 16, 4.5, 0.3, wallTex);
        this.createWall(-20, 2.25, -3, 16, 4.5, 0.3, wallTex, true, [-20, -18]); // Door to 101

        // ROOM 101 (Deluxe Ocean Suite)
        const suiteFloorGeo = new THREE.PlaneGeometry(14, 15);
        const suiteFloor = new THREE.Mesh(suiteFloorGeo, new THREE.MeshStandardMaterial({ map: parquetTex, roughness: 0.25 }));
        suiteFloor.rotation.x = -Math.PI / 2;
        suiteFloor.position.set(-21, 0, -10.5);
        suiteFloor.receiveShadow = true;
        this.scene.add(suiteFloor);

        this.createWall(-28, 2.25, -10.5, 0.3, 4.5, 15, wallTex);
        this.createWall(-14, 2.25, -10.5, 0.3, 4.5, 15, wallTex);
        this.createWall(-21, 2.25, -18, 14, 4.5, 0.3, wallTex, true, [-24, -18]); // Balcony doors

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

        this.createWall(30, 2.5, 0, 0.4, 5, 20, wallTex);
        this.createWall(21, 2.5, 10, 18, 5, 0.4, wallTex);
        this.createWall(21, 2.5, -10, 18, 5, 0.4, wallTex);

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

        // 7. RENOVATION MESHES
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
                minX: x - width / 2,
                maxX: x + width / 2,
                minZ: z - depth / 2,
                maxZ: z + depth / 2,
                minY: y - height / 2,
                maxY: y + height / 2
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
        const parquetTex = this.getTexture('oak_parquet');
        const wallTex = this.getTexture('wall_moulding');

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
        this.createWall(0, 8.5, -12, 24, 5.0, 0.3, wallTex);
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
    // DYNAMIC 3D RENOVATION BUILDERS
    // ----------------------------------------------------
    rebuildAllRenovations() {
        Object.keys(this.upgradeMeshes).forEach(key => {
            if (this.upgradeMeshes[key]) {
                this.scene.remove(this.upgradeMeshes[key]);
            }
        });
        this.upgradeMeshes = {};
        this.interactivePoints = [];

        const reno = this.state.renovations;

        this.upgradeMeshes.reception_desk = this.buildReceptionDesk(reno.reception_desk > 0);
        this.addRenovationBeacon('reception_desk');

        this.upgradeMeshes.lobby_carpet = this.buildLobbyCarpet(reno.lobby_carpet > 0);
        this.addRenovationBeacon('lobby_carpet');

        this.upgradeMeshes.lobby_chandelier = this.buildLobbyChandelier(reno.lobby_chandelier > 0);
        this.addRenovationBeacon('lobby_chandelier');

        this.upgradeMeshes.room101_bed = this.buildRoom101Bed(reno.room101_bed > 0);
        this.addRenovationBeacon('room101_bed');

        this.upgradeMeshes.room101_decor = this.buildRoom101Decor(reno.room101_decor > 0);
        this.addRenovationBeacon('room101_decor');

        this.upgradeMeshes.restaurant_bar = this.buildRestaurantBar(reno.restaurant_bar > 0);
        this.addRenovationBeacon('restaurant_bar');

        this.upgradeMeshes.restaurant_tables = this.buildRestaurantTables(reno.restaurant_tables > 0);
        this.addRenovationBeacon('restaurant_tables');

        this.upgradeMeshes.swimming_pool = this.buildSwimmingPool(reno.swimming_pool > 0);
        this.addRenovationBeacon('swimming_pool');

        this.upgradeMeshes.spa_jacuzzi = this.buildSpaJacuzzi(reno.spa_jacuzzi > 0);
        this.addRenovationBeacon('spa_jacuzzi');

        this.upgradeMeshes.penthouse_suite = this.buildPenthouseSuite(reno.penthouse_suite > 0);
        this.addRenovationBeacon('penthouse_suite');
    }

    addRenovationBeacon(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        const isCompleted = this.state.renovations[id] > 0;
        const group = new THREE.Group();

        const markerGeo = new THREE.OctahedronGeometry(0.35, 0);
        const markerMat = new THREE.MeshStandardMaterial({
            color: isCompleted ? 0x00ff88 : 0xffcc00,
            emissive: isCompleted ? 0x006622 : 0xcc8800,
            roughness: 0.1,
            metalness: 0.9,
            wireframe: false
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        group.add(marker);

        const ringGeo = new THREE.RingGeometry(0.4, 0.6, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: isCompleted ? 0x00ff88 : 0xffcc00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
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
            action: () => this.openRenovationModal(id)
        });
    }

    buildReceptionDesk(isLuxury) {
        const group = new THREE.Group();
        if (!isLuxury) {
            const oldMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 });
            const desk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.2), oldMat);
            desk.position.set(0, 0.55, -4);
            desk.castShadow = true;
            group.add(desk);
        } else {
            const marbleTex = this.getTexture('carrara_marble');
            const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.15 });
            const marbleMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.1 });

            const baseDesk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.2, 1.4), marbleMat);
            baseDesk.position.set(0, 0.6, -4);
            baseDesk.castShadow = true;
            group.add(baseDesk);

            const goldTrimTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, 1.5), goldMat);
            goldTrimTop.position.set(0, 1.25, -4);
            group.add(goldTrimTop);

            const comp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            comp.position.set(0, 1.55, -4);
            group.add(comp);

            const lampLight = new THREE.PointLight(0xffeedd, 0.8, 4);
            lampLight.position.set(-1.8, 1.6, -4);
            group.add(lampLight);
        }

        this.scene.add(group);
        return group;
    }

    buildLobbyCarpet(isLuxury) {
        const group = new THREE.Group();
        if (isLuxury) {
            const carpetTex = this.getTexture('velvet_carpet');
            carpetTex.repeat.set(1, 4);
            const carpet = new THREE.Mesh(
                new THREE.PlaneGeometry(3.6, 14),
                new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.85 })
            );
            carpet.rotation.x = -Math.PI / 2;
            carpet.position.set(0, 0.015, 2);
            carpet.receiveShadow = true;
            group.add(carpet);
        }
        this.scene.add(group);
        return group;
    }

    buildLobbyChandelier(isLuxury) {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.95, roughness: 0.1 });

        if (!isLuxury) {
            const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5), goldMat);
            cord.position.set(0, 4.25, -1);
            group.add(cord);
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            bulb.position.set(0, 3.5, -1);
            group.add(bulb);
        } else {
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2), goldMat);
            stem.position.set(0, 4.4, -1);
            group.add(stem);

            const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 12, 24), goldMat);
            ring1.rotation.x = Math.PI / 2;
            ring1.position.set(0, 3.8, -1);
            group.add(ring1);

            const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 12, 24), goldMat);
            ring2.rotation.x = Math.PI / 2;
            ring2.position.set(0, 3.4, -1);
            group.add(ring2);

            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                transmission: 0.9,
                opacity: 1,
                transparent: true,
                roughness: 0.05,
                ior: 1.6
            });

            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const prism = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), glassMat);
                prism.position.set(Math.cos(angle) * 1.4, 3.5, -1 + Math.sin(angle) * 1.4);
                group.add(prism);
            }
        }
        this.scene.add(group);
        return group;
    }

    buildRoom101Bed(isLuxury) {
        const group = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x2b180d, roughness: 0.3 });

        if (!isLuxury) {
            const frame = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.4, 3.5), new THREE.MeshStandardMaterial({ color: 0x555555 }));
            frame.position.set(-19, 0.2, -12);
            group.add(frame);
        } else {
            const bedBase = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 3.8), woodMat);
            bedBase.position.set(-19, 0.35, -12);
            group.add(bedBase);

            const quilt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
            quilt.position.set(-19, 0.85, -11.7);
            group.add(quilt);

            const pillowMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.6 });
            const pil1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), pillowMat);
            pil1.position.set(-19.8, 1.05, -13.2);
            const pil2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), pillowMat);
            pil2.position.set(-18.2, 1.05, -13.2);
            group.add(pil1);
            group.add(pil2);

            const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x7a0c1a, roughness: 0.8 }));
            head.position.set(-19, 1.4, -13.8);
            group.add(head);
        }
        this.scene.add(group);
        return group;
    }

    buildRoom101Decor(isLuxury) {
        const group = new THREE.Group();
        if (isLuxury) {
            const velvetMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.7 });
            const chair1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), velvetMat);
            chair1.position.set(-22, 0.45, -7);
            const chair2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 1.0), velvetMat);
            chair2.position.set(-20, 0.45, -7);
            group.add(chair1);
            group.add(chair2);

            const table = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 }));
            table.position.set(-21, 0.25, -7);
            group.add(table);
        }
        this.scene.add(group);
        return group;
    }

    buildRestaurantBar(isLuxury) {
        const group = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });

        if (!isLuxury) {
            const oldBar = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x443322 }));
            oldBar.position.set(20, 0.6, -6);
            group.add(oldBar);
        } else {
            const marbleTex = this.getTexture('carrara_marble');
            const bar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.2, 1.5), new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.15 }));
            bar.position.set(20, 0.6, -6);
            group.add(bar);

            const rail = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 1.7), goldMat);
            rail.position.set(20, 1.25, -6);
            group.add(rail);

            const rack = new THREE.Mesh(new THREE.BoxGeometry(6.5, 2.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x111111 }));
            rack.position.set(20, 2.4, -9.5);
            group.add(rack);

            for (let x = 17.5; x <= 22.5; x += 1.4) {
                const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12), goldMat);
                stool.position.set(x, 0.4, -4.7);
                group.add(stool);
            }
        }
        this.scene.add(group);
        return group;
    }

    buildRestaurantTables(isLuxury) {
        const group = new THREE.Group();
        if (isLuxury) {
            const tableMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
            const chairMat = new THREE.MeshStandardMaterial({ color: 0x7a0c1a, roughness: 0.7 });

            [
                [17, 3], [22, 3], [17, -1], [22, -1]
            ].forEach(pos => {
                const t = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.9, 16), tableMat);
                t.position.set(pos[0], 0.45, pos[1]);
                group.add(t);

                const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), chairMat);
                c1.position.set(pos[0] - 0.9, 0.4, pos[1]);
                const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.5), chairMat);
                c2.position.set(pos[0] + 0.9, 0.4, pos[1]);
                group.add(c1);
                group.add(c2);
            });
        }
        this.scene.add(group);
        return group;
    }

    buildSwimmingPool(isLuxury) {
        const group = new THREE.Group();
        if (!isLuxury) {
            const dry = new THREE.Mesh(new THREE.PlaneGeometry(15, 7), new THREE.MeshStandardMaterial({ color: 0x334444, roughness: 0.9 }));
            dry.rotation.x = -Math.PI / 2;
            dry.position.set(0, -0.6, -22);
            group.add(dry);
        } else {
            const waterTex = this.getTexture('pool_water');
            const water = new THREE.Mesh(
                new THREE.PlaneGeometry(15.2, 7.2),
                new THREE.MeshPhysicalMaterial({
                    map: waterTex,
                    color: 0x00f0ff,
                    transparent: true,
                    opacity: 0.85,
                    roughness: 0.1,
                    metalness: 0.1
                })
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
        this.scene.add(group);
        return group;
    }

    buildSpaJacuzzi(isLuxury) {
        const group = new THREE.Group();
        if (isLuxury) {
            const tub = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.0, 1.0, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
            tub.position.set(18, 0.5, -22);
            group.add(tub);

            const water = new THREE.Mesh(new THREE.CircleGeometry(1.9, 24), new THREE.MeshStandardMaterial({ color: 0x00d2ff, roughness: 0.1 }));
            water.rotation.x = -Math.PI / 2;
            water.position.set(18, 0.85, -22);
            group.add(water);
        }
        this.scene.add(group);
        return group;
    }

    buildPenthouseSuite(isLuxury) {
        const group = new THREE.Group();
        if (isLuxury) {
            const pianoMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1, metalness: 0.1 });
            const piano = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2.8), pianoMat);
            piano.position.set(-4, 6.6, 2);
            group.add(piano);

            const couchMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.6 });
            const couch = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.9, 1.4), couchMat);
            couch.position.set(3, 6.5, -3);
            group.add(couch);
        }
        this.scene.add(group);
        return group;
    }

    // ----------------------------------------------------
    // CONTROLS: KEYBOARD, MOUSE & MOBILE JOYSTICK
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
            if (joyKnob) {
                joyKnob.style.transform = 'translate(-50%, -50%)';
            }
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

        if (knob) {
            knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
        }

        this.touch.joystickDelta = {
            x: clampedX / maxDist,
            y: clampedY / maxDist
        };
    }

    // ----------------------------------------------------
    // MOVEMENT PHYSICS & COLLISION DETECTION
    // ----------------------------------------------------
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

    // ----------------------------------------------------
    // PROXIMITY INTERACTION & RENOVATION MODAL
    // ----------------------------------------------------
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
                const isDone = this.state.renovations[nearestBeacon.id] > 0;
                prompt.innerHTML = `
                    <div class="prompt-icon">${isDone ? '✨' : '🛠️'}</div>
                    <div class="prompt-text">
                        <strong>${label}</strong>
                        <span>${isDone ? '[E] İncele / Geliştir' : '[E] Restorasyonu Başlat'}</span>
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

    openRenovationModal(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        const isDone = this.state.renovations[id] > 0;
        const modal = document.getElementById('renoModal');
        const modalContent = document.getElementById('renoModalContent');

        if (!modal || !modalContent) return;

        const canAfford = (this.state.coins >= def.costCoins && this.state.stars >= def.costStars);

        modalContent.innerHTML = `
            <div class="reno-card-header">
                <span class="reno-badge">${def.area}</span>
                <button class="reno-close-btn" onclick="hotel3D.closeModal()">&times;</button>
            </div>
            <div class="reno-preview-container">
                <img src="${def.img}" class="reno-preview-img" alt="${def.name}" />
                ${isDone ? '<div class="reno-status-badge completed">✅ RESTORASYON TAMAMLANDI</div>' : ''}
            </div>
            <h3 class="reno-title">${def.name}</h3>
            <p class="reno-desc">${def.desc}</p>

            <div class="reno-rewards-grid">
                <div class="reno-stat">
                    <span class="stat-lbl">Otel Geliri</span>
                    <span class="stat-val positive">+₺${def.incomeBoost}/dk</span>
                </div>
                <div class="reno-stat">
                    <span class="stat-lbl">Prestij</span>
                    <span class="stat-val rep">+${def.repBoost} Rep</span>
                </div>
            </div>

            <div class="reno-footer">
                <div class="reno-cost-tags">
                    <span class="cost-tag coin">💰 ${def.costCoins}</span>
                    <span class="cost-tag star">⭐ ${def.costStars}</span>
                </div>
                <button class="reno-action-btn ${isDone ? 'btn-done' : (canAfford ? 'btn-active' : 'btn-disabled')}" 
                    onclick="hotel3D.executeRenovation('${id}')">
                    ${isDone ? '🌟 Zaten Yapıldı' : (canAfford ? '🛠️ Şimdi Yenile' : '❌ Yetersiz Bakiye')}
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }

    closeModal() {
        const modal = document.getElementById('renoModal');
        if (modal) modal.style.display = 'none';
    }

    executeRenovation(id) {
        const def = this.renovationDefs[id];
        if (!def) return;

        if (this.state.renovations[id] > 0) {
            this.showBanner('Bu alan zaten restore edildi! ✨');
            this.closeModal();
            return;
        }

        if (this.state.coins < def.costCoins || this.state.stars < def.costStars) {
            this.showBanner('Yetersiz altın veya yıldız! Masadan sipariş tamamlayın.');
            return;
        }

        this.state.coins -= def.costCoins;
        this.state.stars -= def.costStars;
        this.state.reputation += def.repBoost;
        this.state.incomePerMin += def.incomeBoost;
        this.state.renovations[id] = 1;

        const count = Object.values(this.state.renovations).filter(v => v > 0).length;
        if (count >= 2) this.state.hotelStars = 2;
        if (count >= 4) this.state.hotelStars = 3;
        if (count >= 7) this.state.hotelStars = 4;
        if (count >= 9) this.state.hotelStars = 5;

        this.playSound('renovate');
        this.spawnConfettiParticles(def.pos);
        this.rebuildAllRenovations();
        this.saveState();
        this.closeModal();

        this.showBanner(`🎉 ${def.name} Başarıyla Yenilendi! (+₺${def.incomeBoost}/dk)`);
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
            p.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 4
            );
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
            ctx.fillStyle = pt.isCompleted ? '#00ff88' : '#ffcc00';
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
    // GLOBAL ROOM JUMPERS & RESIZE
    // ----------------------------------------------------
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
    if (window.hotel3D) {
        window.hotel3D.jumpTo(room);
    }
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
