// ========================================================
// VELVET SECRETS — SEMI-REALISTIC LUXURY ART, 3D CHEST & SEASONAL LIVE-OPS ENGINE
// 1. Semi-Realistic 3D Studio-Lit Merge Object Renderer (Shadows, Specular, Glass/Metal/Petal Depth)
// 2. Seasonal Event Merge Chains (Halloween, Valentine's Day, Winter Gala)
// 3. Three.js Interactive 3D Treasure Chest & Rising Reward Animation Engine
// 4. Centralized Seasonal Live-Ops Theme Manager (window.ThemeManager)
// ========================================================

class LuxuryArtEngine {
    constructor() {
        this.itemCache = {};
        this.designPreviewCache = {};
        this.loadedPhotos = {};

        this.areaSceneMap = {
            reception_desk: 'assets/scene_lobby_reception.jpg',
            lobby_carpet: 'assets/scene_lobby_carpet.jpg',
            lobby_chandelier: 'assets/scene_lobby_chandelier.jpg',
            lobby_columns: 'assets/scene_lobby_reception.jpg',
            room101_bed: 'assets/scene_presidential_suite.jpg',
            room101_decor: 'assets/scene_suite_terrace.jpg',
            room101_lounge: 'assets/scene_presidential_suite.jpg',
            restaurant_tables: 'assets/scene_restaurant_pool.jpg',
            restaurant_bar: 'assets/scene_restaurant_bar.jpg',
            restaurant_lighting: 'assets/scene_restaurant_pool.jpg',
            restaurant_terrace: 'assets/scene_restaurant_pool.jpg',
            swimming_pool: 'assets/scene_infinity_pool.jpg',
            pool_cabanas: 'assets/scene_infinity_pool.jpg',
            pool_lounge: 'assets/scene_infinity_pool.jpg',
            spa_jacuzzi: 'assets/scene_spa_wellness.jpg',
            spa_beds: 'assets/scene_spa_wellness.jpg',
            spa_waterfall: 'assets/scene_spa_wellness.jpg',
            garden_courtyard: 'assets/scene_garden_terrace.jpg',
            garden_pergola: 'assets/scene_garden_terrace.jpg',
            garden_pavilion: 'assets/scene_garden_terrace.jpg',
            penthouse_suite: 'assets/scene_penthouse_piano.jpg',
            penthouse_fireplace: 'assets/scene_penthouse_piano.jpg',
            penthouse_terrace: 'assets/scene_penthouse_piano.jpg'
        };

        this.rewardIconMap = {
            energy: 'assets/rewards/reward_energy.jpg',
            prestige: 'assets/rewards/reward_prestige.jpg',
            coins: 'assets/rewards/reward_prestige.jpg',
            cash: 'assets/rewards/reward_prestige.jpg',
            gems: 'assets/rewards/reward_gems.jpg',
            stars: 'assets/rewards/reward_star.jpg',
            star: 'assets/rewards/reward_star.jpg',
            chest: 'assets/rewards/reward_chest.jpg',
            spawner: 'assets/rewards/reward_spawner.jpg',
            key: 'assets/rewards/reward_key.jpg',
            mask: 'assets/rewards/reward_mask.jpg'
        };
    }

    getAreaScene(areaId) {
        return this.areaSceneMap[areaId] || 'assets/scene_lobby_reception.jpg';
    }

    getRewardIcon(type) {
        return this.rewardIconMap[type] || 'assets/rewards/reward_prestige.jpg';
    }

    getItemImage(type, level, seasonalTheme = null) {
        const cleanType = Math.max(0, Math.min(4, Number(type) || 0));
        const cleanLevel = Math.max(1, Math.min(5, Number(level) || 1));
        if (cleanType < 4) {
            return `assets/items/item_${cleanType}_${cleanLevel}.png`;
        }
        const themeKey = seasonalTheme || (window.ThemeManager ? window.ThemeManager.currentTheme : 'default');
        return this.getProceduralItemImage(cleanType, cleanLevel, themeKey);
    }

    // Semi-Realistic High-DPI Studio-Lit Object Renderer (260x260) — Reference Prop Sheet Style
    getProceduralItemImage(type, level, themeKey = 'default') {
        const cleanType = Math.max(0, Math.min(4, Number(type) || 0));
        const cleanLevel = Math.max(1, Math.min(5, Number(level) || 1));
        const cacheKey = `sr_v6_${cleanType}_${cleanLevel}_${cleanType === 4 ? themeKey : 'core'}`;
        if (this.itemCache[cacheKey]) return this.itemCache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 260;
        canvas.height = 260;
        const ctx = canvas.getContext('2d');
        ctx.scale(260 / 220, 260 / 220);

        // 1. Studio Light Pearlescent Grey Backdrop matching Reference Props Sheet (media_1792952688524_5fff4248.jpg)
        const bgGrad = ctx.createLinearGradient(0, 0, 220, 220);
        bgGrad.addColorStop(0, '#eef0f4');
        bgGrad.addColorStop(0.55, '#d8dde5');
        bgGrad.addColorStop(1, '#c2c8d3');
        ctx.fillStyle = bgGrad;
        this.roundRect(ctx, 3, 3, 214, 214, 22);
        ctx.fill();

        // Soft studio floor cast shadow (matching reference image)
        ctx.fillStyle = 'rgba(25, 32, 45, 0.16)';
        ctx.beginPath();
        ctx.ellipse(115, 174, 68, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Draw Semi-Realistic Object with Cast Shadow & Specular Highlights
        ctx.save();
        ctx.translate(10, 6);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 7;

        if (cleanType === 0) {
            this.drawRoseEvolutionChain(ctx, cleanLevel);
        } else if (cleanType === 1) {
            this.drawJewelryEvolutionChain(ctx, cleanLevel);
        } else if (cleanType === 2) {
            this.drawPatisserieEvolutionChain(ctx, cleanLevel);
        } else if (cleanType === 3) {
            this.drawChampagneEvolutionChain(ctx, cleanLevel);
        } else {
            this.drawSeasonalEvolutionChain(ctx, cleanLevel, themeKey);
        }
        ctx.restore();

        // 5. Optical lens flare & specular glints
        if (cleanLevel >= 2) {
            this.drawSparkle(ctx, 46, 46, cleanLevel === 5 ? 15 : 9, '#fff9db');
            if (cleanLevel >= 3) {
                this.drawSparkle(ctx, 174, 52, cleanLevel >= 4 ? 13 : 9, '#ffd700');
            }
            if (cleanLevel === 5) {
                this.drawSparkle(ctx, 168, 152, 12, '#ffffff');
                this.drawSparkle(ctx, 48, 148, 11, '#ffd700');
            }
        }

        // 6. Beveled metallic luxury frame
        const frameGrad = ctx.createLinearGradient(0, 0, 220, 220);
        if (cleanType === 4) {
            frameGrad.addColorStop(0, '#f472b6');
            frameGrad.addColorStop(0.5, '#fde047');
            frameGrad.addColorStop(1, '#a855f7');
        } else if (cleanLevel === 5) {
            frameGrad.addColorStop(0, '#fff3b0');
            frameGrad.addColorStop(0.35, '#ffd700');
            frameGrad.addColorStop(0.7, '#b45309');
            frameGrad.addColorStop(1, '#fde68a');
        } else {
            frameGrad.addColorStop(0, 'rgba(245, 222, 179, 0.65)');
            frameGrad.addColorStop(0.5, 'rgba(180, 142, 76, 0.35)');
            frameGrad.addColorStop(1, 'rgba(245, 222, 179, 0.55)');
        }
        ctx.strokeStyle = frameGrad;
        ctx.lineWidth = cleanLevel === 5 ? 4.5 : 2.4;
        this.roundRect(ctx, 5, 5, 210, 210, 26);
        ctx.stroke();

        // Inner glass bevel highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, 8, 8, 204, 204, 23);
        ctx.stroke();

        const url = canvas.toDataURL('image/png');
        this.itemCache[cacheKey] = url;
        return url;
    }

    draw3DStudioPedestal(ctx, level, seasonalTheme) {
        // Deep ambient occlusion shadow under pedestal
        const aoGrad = ctx.createRadialGradient(110, 184, 10, 110, 184, 78);
        aoGrad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
        aoGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.38)');
        aoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aoGrad;
        ctx.beginPath();
        ctx.ellipse(110, 184, 76, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal cylinder side (brushed brass / dark marble)
        const sideGrad = ctx.createLinearGradient(52, 166, 168, 186);
        if (level >= 4 || seasonalTheme) {
            sideGrad.addColorStop(0, '#785118');
            sideGrad.addColorStop(0.3, '#f5d076');
            sideGrad.addColorStop(0.55, '#b8860b');
            sideGrad.addColorStop(0.85, '#ffe89e');
            sideGrad.addColorStop(1, '#5c3c0e');
        } else {
            sideGrad.addColorStop(0, '#1e2436');
            sideGrad.addColorStop(0.4, '#475569');
            sideGrad.addColorStop(0.7, '#283147');
            sideGrad.addColorStop(1, '#0f1420');
        }
        ctx.fillStyle = sideGrad;
        ctx.beginPath();
        ctx.ellipse(110, 177, 58, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal top polished marble surface
        const topGrad = ctx.createRadialGradient(96, 168, 6, 110, 172, 58);
        if (level === 5) {
            topGrad.addColorStop(0, '#fff9e6');
            topGrad.addColorStop(0.6, '#ebd5a7');
            topGrad.addColorStop(1, '#9c7a3c');
        } else {
            topGrad.addColorStop(0, '#f1f5f9');
            topGrad.addColorStop(0.65, '#cbd5e1');
            topGrad.addColorStop(1, '#64748b');
        }
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.ellipse(110, 171, 56, 12.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Specular gold rim on pedestal
        ctx.strokeStyle = level >= 3 ? 'rgba(255, 215, 0, 0.85)' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Object contact shadow on pedestal surface
        const contactGrad = ctx.createRadialGradient(110, 170, 4, 110, 170, 42);
        contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
        contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = contactGrad;
        ctx.beginPath();
        ctx.ellipse(110, 170, 42, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================================
    // CHAIN 0: ROYAL ROSES EVOLUTION (SEMI-REALISTIC VELVET & DEWDROPS)
    // ========================================================
    drawRoseEvolutionChain(ctx, level) {
        if (level === 1) {
            this.drawStemAndLeaves(ctx, 100, 104, 100, 164);
            this.drawLeaf(ctx, 86, 96, -0.38, 19);
            this.drawLeaf(ctx, 114, 96, 0.38, 19);
            const budGrad = ctx.createRadialGradient(92, 68, 3, 100, 82, 30);
            budGrad.addColorStop(0, '#ff8fa3');
            budGrad.addColorStop(0.32, '#e01e37');
            budGrad.addColorStop(0.75, '#800f2f');
            budGrad.addColorStop(1, '#3c0919');
            ctx.fillStyle = budGrad;
            ctx.beginPath();
            ctx.moveTo(100, 48);
            ctx.bezierCurveTo(126, 62, 124, 102, 100, 106);
            ctx.bezierCurveTo(76, 102, 74, 62, 100, 48);
            ctx.closePath();
            ctx.fill();
            // Velvet rim highlight & realistic crystal dewdrop
            ctx.strokeStyle = 'rgba(255, 225, 232, 0.68)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(100, 50);
            ctx.quadraticCurveTo(112, 76, 96, 100);
            ctx.stroke();
            this.drawDewdrop(ctx, 108, 78, 4.5);
        } else if (level === 2) {
            this.drawStemAndLeaves(ctx, 100, 112, 100, 166);
            this.drawDetailedRose(ctx, 100, 82, 44, '#b80f28', '#ff4d6d', '#3d040e');
            this.drawDewdrop(ctx, 84, 74, 4.2);
            this.drawDewdrop(ctx, 116, 90, 3.6);
        } else if (level === 3) {
            // Crystal glass vase base + bouquet
            this.drawStemAndLeaves(ctx, 82, 116, 94, 164);
            this.drawStemAndLeaves(ctx, 100, 116, 100, 166);
            this.drawStemAndLeaves(ctx, 118, 116, 106, 164);
            this.drawLeaf(ctx, 60, 94, -0.62, 23);
            this.drawLeaf(ctx, 140, 94, 0.62, 23);
            this.drawGoldRibbonBow(ctx, 100, 140, 34);
            this.drawDetailedRose(ctx, 72, 86, 27, '#a40e24', '#ff3858', '#3d030c');
            this.drawDetailedRose(ctx, 128, 86, 27, '#a40e24', '#ff3858', '#3d030c');
            this.drawDetailedRose(ctx, 85, 62, 25, '#d90429', '#ff758f', '#4a040f');
            this.drawDetailedRose(ctx, 115, 62, 25, '#d90429', '#ff758f', '#4a040f');
            this.drawDetailedRose(ctx, 100, 88, 31, '#c9184a', '#ff4d6d', '#3c0919');
            this.drawDewdrop(ctx, 104, 82, 3.8);
        } else if (level === 4) {
            // Luxury Gold & Woven Wicker Basket with multi-tone roses
            const archGrad = ctx.createLinearGradient(45, 45, 155, 100);
            archGrad.addColorStop(0, '#b45309');
            archGrad.addColorStop(0.5, '#fef08a');
            archGrad.addColorStop(1, '#92400e');
            ctx.strokeStyle = archGrad;
            ctx.lineWidth = 6.5;
            ctx.beginPath();
            ctx.arc(100, 96, 53, Math.PI, 0, false);
            ctx.stroke();

            const baskGrad = ctx.createLinearGradient(50, 106, 150, 162);
            baskGrad.addColorStop(0, '#e6b872');
            baskGrad.addColorStop(0.45, '#b57c32');
            baskGrad.addColorStop(1, '#54320b');
            ctx.fillStyle = baskGrad;
            ctx.beginPath();
            ctx.moveTo(50, 108);
            ctx.lineTo(150, 108);
            ctx.lineTo(133, 162);
            ctx.lineTo(67, 162);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2.8;
            ctx.stroke();

            // 3D cross-hatch weave shading
            ctx.strokeStyle = 'rgba(55, 30, 5, 0.55)';
            ctx.lineWidth = 2;
            for (let y = 118; y <= 152; y += 10) {
                ctx.beginPath();
                ctx.moveTo(56, y);
                ctx.lineTo(144, y);
                ctx.stroke();
            }
            for (let x = 68; x <= 132; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, 110);
                ctx.lineTo(x + (x < 100 ? 4 : -4), 160);
                ctx.stroke();
            }

            this.drawLeaf(ctx, 50, 96, -0.7, 21);
            this.drawLeaf(ctx, 150, 96, 0.7, 21);
            this.drawDetailedRose(ctx, 67, 93, 24, '#b80f28', '#ff3858', '#45040e');
            this.drawDetailedRose(ctx, 133, 93, 24, '#b80f28', '#ff3858', '#45040e');
            this.drawDetailedRose(ctx, 84, 76, 25, '#ec4899', '#fce7f3', '#701a46');
            this.drawDetailedRose(ctx, 116, 76, 25, '#e01e37', '#ff758f', '#590411');
            this.drawDetailedRose(ctx, 100, 96, 28, '#c9122f', '#ff4d6d', '#3c040c');
            this.drawGoldRibbonBow(ctx, 100, 135, 25);
        } else {
            // Level 5 (MAX): Aurelia Imperial Rose & Gold Wreath
            const ringGrad = ctx.createLinearGradient(40, 40, 160, 160);
            ringGrad.addColorStop(0, '#fde047');
            ringGrad.addColorStop(0.5, '#d97706');
            ringGrad.addColorStop(1, '#fef9c3');
            ctx.strokeStyle = ringGrad;
            ctx.lineWidth = 11;
            ctx.beginPath();
            ctx.arc(100, 96, 54, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                this.drawLeaf(ctx, 100 + Math.cos(a) * 59, 96 + Math.sin(a) * 59, a + Math.PI / 2, 15);
            }
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const rx = 100 + Math.cos(a) * 52;
                const ry = 96 + Math.sin(a) * 52;
                const isPink = i % 2 === 1;
                this.drawDetailedRose(
                    ctx,
                    rx,
                    ry,
                    20,
                    isPink ? '#db2777' : '#be123c',
                    isPink ? '#fbcfe8' : '#fb7185',
                    isPink ? '#500724' : '#4c0519'
                );
            }
            this.drawGoldRibbonBow(ctx, 100, 150, 32);
        }
    }

    drawDewdrop(ctx, x, y, r) {
        ctx.save();
        const dropGrad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.5, x, y, r);
        dropGrad.addColorStop(0, '#ffffff');
        dropGrad.addColorStop(0.45, 'rgba(224, 242, 254, 0.85)');
        dropGrad.addColorStop(1, 'rgba(12, 74, 110, 0.55)');
        ctx.fillStyle = dropGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ========================================================
    // CHAIN 1: ROYAL JEWELRY EVOLUTION (FACETED GEMS & METALLIC GOLD)
    // ========================================================
    drawJewelryEvolutionChain(ctx, level) {
        const goldGrad = ctx.createLinearGradient(45, 45, 155, 155);
        goldGrad.addColorStop(0, '#92400e');
        goldGrad.addColorStop(0.28, '#fef08a');
        goldGrad.addColorStop(0.55, '#d97706');
        goldGrad.addColorStop(0.82, '#fffbeb');
        goldGrad.addColorStop(1, '#78350f');

        if (level === 1) {
            // Level 1: South Sea Pearl & Diamond Stud Drop Earring
            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 5.5;
            ctx.beginPath();
            ctx.arc(100, 60, 14, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();

            this.drawFacetedGem(ctx, 100, 75, 9, '#e0f2fe', '#38bdf8', '#0369a1');

            const pearlGrad = ctx.createRadialGradient(88, 106, 4, 100, 120, 35);
            pearlGrad.addColorStop(0, '#ffffff');
            pearlGrad.addColorStop(0.35, '#fff1f2');
            pearlGrad.addColorStop(0.68, '#e2e8f0');
            pearlGrad.addColorStop(0.88, '#94a3b8');
            pearlGrad.addColorStop(1, '#475569');
            ctx.fillStyle = pearlGrad;
            ctx.beginPath();
            ctx.arc(100, 120, 33, 0, Math.PI * 2);
            ctx.fill();
        } else if (level === 2) {
            // Level 2: Solitaire Brilliant Cut Diamond Ring
            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 13;
            ctx.beginPath();
            ctx.arc(100, 122, 36, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring metallic shadow
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(100, 122, 30, 0, Math.PI * 2);
            ctx.stroke();

            // Prongs
            ctx.fillStyle = goldGrad;
            ctx.beginPath();
            ctx.moveTo(82, 84);
            ctx.lineTo(118, 84);
            ctx.lineTo(109, 97);
            ctx.lineTo(91, 97);
            ctx.closePath();
            ctx.fill();

            // Multi-faceted brilliant diamond
            const diaGrad = ctx.createLinearGradient(70, 42, 130, 88);
            diaGrad.addColorStop(0, '#ffffff');
            diaGrad.addColorStop(0.35, '#e0f2fe');
            diaGrad.addColorStop(0.7, '#7dd3fc');
            diaGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = diaGrad;
            ctx.beginPath();
            ctx.moveTo(80, 52);
            ctx.lineTo(120, 52);
            ctx.lineTo(134, 67);
            ctx.lineTo(100, 92);
            ctx.lineTo(66, 67);
            ctx.closePath();
            ctx.fill();

            // Internal diamond facet lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(66, 67);
            ctx.lineTo(134, 67);
            ctx.moveTo(80, 52);
            ctx.lineTo(88, 67);
            ctx.lineTo(100, 92);
            ctx.moveTo(120, 52);
            ctx.lineTo(112, 67);
            ctx.lineTo(100, 92);
            ctx.moveTo(88, 67);
            ctx.lineTo(100, 52);
            ctx.lineTo(112, 67);
            ctx.stroke();
            this.drawSparkle(ctx, 100, 54, 15, '#ffffff');
        } else if (level === 3) {
            // Level 3: Burmese Ruby & Gold Cuff Bracelet
            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 17;
            ctx.beginPath();
            ctx.arc(100, 106, 48, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const gx = 100 + Math.cos(a) * 48;
                const gy = 106 + Math.sin(a) * 48;
                this.drawFacetedGem(ctx, gx, gy, i === 6 ? 15 : 10, '#ffe4e6', '#e11d48', '#4c0519');
            }
        } else if (level === 4) {
            // Level 4: Colombian Emerald & Pearl Royal Necklace
            ctx.strokeStyle = goldGrad;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(100, 88, 52, 0.12 * Math.PI, 0.88 * Math.PI);
            ctx.stroke();

            for (let i = 0; i <= 8; i++) {
                const a = (0.12 + (i / 8) * 0.76) * Math.PI;
                const px = 100 + Math.cos(a) * 52;
                const py = 88 + Math.sin(a) * 52;
                if (i % 2 === 0) {
                    this.drawFacetedGem(ctx, px, py, 9, '#d1fae5', '#10b981', '#064e3b');
                } else {
                    const pGrad = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, 7);
                    pGrad.addColorStop(0, '#ffffff');
                    pGrad.addColorStop(1, '#94a3b8');
                    ctx.fillStyle = pGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, 6.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            this.drawFacetedGem(ctx, 100, 154, 17, '#a7f3d0', '#059669', '#022c22');
        } else {
            // Level 5 (MAX): Monaco Imperial Diamond, Ruby & Emerald Tiara Crown
            const velvetGrad = ctx.createRadialGradient(100, 96, 8, 100, 108, 46);
            velvetGrad.addColorStop(0, '#e11d48');
            velvetGrad.addColorStop(0.6, '#881337');
            velvetGrad.addColorStop(1, '#310613');
            ctx.fillStyle = velvetGrad;
            ctx.beginPath();
            ctx.arc(100, 114, 42, Math.PI, 0, false);
            ctx.fill();

            ctx.fillStyle = goldGrad;
            ctx.beginPath();
            ctx.moveTo(46, 134);
            ctx.lineTo(38, 72);
            ctx.lineTo(70, 98);
            ctx.lineTo(100, 46);
            ctx.lineTo(130, 98);
            ctx.lineTo(162, 72);
            ctx.lineTo(154, 134);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fffbeb';
            ctx.lineWidth = 2.2;
            ctx.stroke();

            this.drawFacetedGem(ctx, 100, 110, 14, '#ffe4e6', '#e11d48', '#4c0519');
            this.drawFacetedGem(ctx, 68, 115, 10, '#d1fae5', '#10b981', '#064e3b');
            this.drawFacetedGem(ctx, 132, 115, 10, '#d1fae5', '#10b981', '#064e3b');
            this.drawFacetedGem(ctx, 100, 46, 8, '#ffffff', '#38bdf8', '#0369a1');
            this.drawFacetedGem(ctx, 38, 72, 6.5, '#ffffff', '#38bdf8', '#0369a1');
            this.drawFacetedGem(ctx, 162, 72, 6.5, '#ffffff', '#38bdf8', '#0369a1');
        }
    }

    drawFacetedGem(ctx, x, y, r, lightCol, midCol, darkCol) {
        ctx.save();
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
        g.addColorStop(0, lightCol);
        g.addColorStop(0.5, midCol);
        g.addColorStop(1, darkCol);
        ctx.fillStyle = g;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const px = x + Math.cos(a) * r;
            const py = y + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Inner table facet
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.52, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // ========================================================
    // CHAIN 2: FRENCH PATISSERIE EVOLUTION (GLAZED & TEXTURED)
    // ========================================================
    drawPatisserieEvolutionChain(ctx, level) {
        // Fine bone china plate with gold rim
        const plateGrad = ctx.createRadialGradient(100, 146, 10, 100, 150, 68);
        plateGrad.addColorStop(0, '#ffffff');
        plateGrad.addColorStop(0.75, '#e2e8f0');
        plateGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = plateGrad;
        ctx.beginPath();
        ctx.ellipse(100, 150, 64, 17, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (level === 1) {
            // Level 1: Ladurée-style Raspberry & Pistachio Macaron Duo
            this.drawMacaron(ctx, 84, 132, 32, '#f472b6', '#be185d', '#fdf2f8');
            this.drawMacaron(ctx, 118, 116, 32, '#6ee7b7', '#047857', '#ecfdf5');
        } else if (level === 2) {
            // Level 2: Glazed Strawberry Tartlet
            const crustGrad = ctx.createLinearGradient(56, 110, 144, 148);
            crustGrad.addColorStop(0, '#f59e0b');
            crustGrad.addColorStop(0.5, '#d97706');
            crustGrad.addColorStop(1, '#78350f');
            ctx.fillStyle = crustGrad;
            ctx.beginPath();
            ctx.moveTo(54, 114);
            ctx.lineTo(146, 114);
            ctx.lineTo(132, 148);
            ctx.lineTo(68, 148);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.ellipse(100, 114, 44, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            this.drawStrawberry(ctx, 82, 98, 17);
            this.drawStrawberry(ctx, 118, 98, 17);
            this.drawStrawberry(ctx, 100, 86, 20);
        } else if (level === 3) {
            // Level 3: Royal Opera Cake Slice with Gold Leaf
            ctx.fillStyle = '#fce7f3';
            ctx.fillRect(62, 88, 76, 54);
            ctx.fillStyle = '#9d174d';
            ctx.fillRect(62, 104, 76, 10);
            ctx.fillRect(62, 124, 76, 10);
            // Glossy chocolate ganache top
            const ganGrad = ctx.createLinearGradient(60, 74, 140, 92);
            ganGrad.addColorStop(0, '#451a03');
            ganGrad.addColorStop(0.5, '#78350f');
            ganGrad.addColorStop(1, '#270e02');
            ctx.fillStyle = ganGrad;
            ctx.beginPath();
            ctx.moveTo(62, 88);
            ctx.lineTo(106, 68);
            ctx.lineTo(138, 88);
            ctx.closePath();
            ctx.fill();
            this.drawStrawberry(ctx, 100, 72, 15);
        } else if (level === 4) {
            // Level 4: 2-Tier Boutique Fondant Cake
            this.drawCakeTier(ctx, 100, 126, 48, 34, '#fbcfe8', '#9d174d');
            this.drawCakeTier(ctx, 100, 92, 34, 28, '#ffffff', '#fbbf24');
            this.drawDetailedRose(ctx, 100, 66, 16, '#e11d48', '#fda4af', '#4c0519');
        } else {
            // Level 5 (MAX): Aurelia 3-Tier Imperial Gala Cake
            this.drawCakeTier(ctx, 100, 134, 54, 28, '#fce7f3', '#be185d');
            this.drawCakeTier(ctx, 100, 104, 40, 25, '#ffffff', '#d97706');
            this.drawCakeTier(ctx, 100, 78, 27, 22, '#fef3c7', '#b45309');
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(85, 58);
            ctx.lineTo(81, 42);
            ctx.lineTo(93, 50);
            ctx.lineTo(100, 36);
            ctx.lineTo(107, 50);
            ctx.lineTo(119, 42);
            ctx.lineTo(115, 58);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawMacaron(ctx, x, y, r, topCol, botCol, creamCol) {
        const gTop = ctx.createRadialGradient(x - 6, y - 10, 2, x, y - 5, r);
        gTop.addColorStop(0, '#ffffff');
        gTop.addColorStop(0.3, topCol);
        gTop.addColorStop(1, botCol);
        ctx.fillStyle = gTop;
        ctx.beginPath();
        ctx.ellipse(x, y - 6, r, r * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = creamCol;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.96, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = botCol;
        ctx.beginPath();
        ctx.ellipse(x, y + 6, r * 0.92, r * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStrawberry(ctx, x, y, r) {
        const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
        g.addColorStop(0, '#ff758f');
        g.addColorStop(0.5, '#e11d48');
        g.addColorStop(1, '#4c0519');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
        ctx.fill();
        // Specular berry glaze highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.22, y - r * 0.22, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCakeTier(ctx, x, y, radiusX, height, bodyColor, dripColor) {
        const bodyGrad = ctx.createLinearGradient(x - radiusX, y, x + radiusX, y);
        bodyGrad.addColorStop(0, bodyColor);
        bodyGrad.addColorStop(0.35, '#ffffff');
        bodyGrad.addColorStop(1, bodyColor);
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(x - radiusX, y - height / 2, radiusX * 2, height);

        ctx.beginPath();
        ctx.ellipse(x, y + height / 2, radiusX, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = dripColor;
        ctx.beginPath();
        ctx.ellipse(x, y - height / 2, radiusX, 9, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ========================================================
    // CHAIN 3: RIVIERA CHAMPAGNE CELLAR (CRYSTAL REFRACTION & GOLD FOIL)
    // ========================================================
    drawChampagneEvolutionChain(ctx, level) {
        if (level === 1) {
            this.drawCrystalFlute(ctx, 100, 96, 1.0, false);
        } else if (level === 2) {
            this.drawCrystalFlute(ctx, 100, 96, 1.0, true);
        } else if (level === 3) {
            // Crystal Decanter & Flute
            const decGrad = ctx.createRadialGradient(84, 118, 6, 90, 124, 34);
            decGrad.addColorStop(0, '#fef08a');
            decGrad.addColorStop(0.55, '#d97706');
            decGrad.addColorStop(1, '#451a03');
            ctx.fillStyle = decGrad;
            ctx.beginPath();
            ctx.arc(90, 124, 31, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = 'rgba(224, 242, 254, 0.42)';
            ctx.fillRect(82, 68, 16, 28);
            this.drawFacetedGem(ctx, 90, 58, 11, '#ffffff', '#bae6fd', '#0284c7');
            this.drawCrystalFlute(ctx, 138, 108, 0.76, true);
        } else if (level === 4) {
            this.drawChampagneBottle(ctx, 90, 98, 1.0);
            this.drawCrystalFlute(ctx, 138, 110, 0.72, true);
        } else {
            // Level 5 (MAX): Royal Golden Ice Bucket & Twin Flutes
            this.drawCrystalFlute(ctx, 54, 108, 0.72, true);
            this.drawCrystalFlute(ctx, 146, 108, 0.72, true);
            this.drawChampagneBottle(ctx, 100, 76, 0.85);

            const buckGrad = ctx.createLinearGradient(62, 104, 138, 160);
            buckGrad.addColorStop(0, '#92400e');
            buckGrad.addColorStop(0.3, '#fef08a');
            buckGrad.addColorStop(0.6, '#d97706');
            buckGrad.addColorStop(0.85, '#fffbeb');
            buckGrad.addColorStop(1, '#78350f');
            ctx.fillStyle = buckGrad;
            ctx.beginPath();
            ctx.moveTo(64, 104);
            ctx.lineTo(136, 104);
            ctx.lineTo(124, 160);
            ctx.lineTo(76, 160);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawCrystalFlute(ctx, x, y, scale, filled) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 62);
        ctx.moveTo(-22, 62);
        ctx.lineTo(22, 62);
        ctx.stroke();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.28)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-22, -40);
        ctx.lineTo(22, -40);
        ctx.quadraticCurveTo(20, 18, 0, 18);
        ctx.quadraticCurveTo(-20, 18, -22, -40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (filled) {
            const liqGrad = ctx.createLinearGradient(-18, -24, 18, 16);
            liqGrad.addColorStop(0, '#fef9c3');
            liqGrad.addColorStop(0.5, '#facc15');
            liqGrad.addColorStop(1, '#ca8a04');
            ctx.fillStyle = liqGrad;
            ctx.beginPath();
            ctx.moveTo(-18, -20);
            ctx.lineTo(18, -20);
            ctx.quadraticCurveTo(16, 14, 0, 14);
            ctx.quadraticCurveTo(-16, 14, -18, -20);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            [[-6, 0], [5, -6], [-2, -12], [6, 4]].forEach(([bx, by]) => {
                ctx.beginPath();
                ctx.arc(bx, by, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        ctx.restore();
    }

    drawChampagneBottle(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const botGrad = ctx.createLinearGradient(-24, -10, 24, 62);
        botGrad.addColorStop(0, '#064e3b');
        botGrad.addColorStop(0.35, '#10b981');
        botGrad.addColorStop(0.7, '#065f46');
        botGrad.addColorStop(1, '#022c22');
        ctx.fillStyle = botGrad;
        ctx.beginPath();
        ctx.moveTo(-10, -52);
        ctx.lineTo(10, -52);
        ctx.quadraticCurveTo(12, -15, 24, 0);
        ctx.lineTo(24, 62);
        ctx.lineTo(-24, 62);
        ctx.lineTo(-24, 0);
        ctx.quadraticCurveTo(-12, -15, -10, -52);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-10, -52, 20, 28);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(-18, 12, 36, 28);
        ctx.restore();
    }

    // ========================================================
    // CHAIN 4: SEASONAL LIVE-OPS EVENT CHAIN (HALLOWEEN / VALENTINES / WINTER)
    // ========================================================
    drawSeasonalEvolutionChain(ctx, level, themeKey) {
        if (themeKey === 'valentines') {
            // Valentine's Day Chain: Love Letter -> Heart Chocolates -> Crystal Heart Perfume -> Rose Heart Arch -> Diamond Swan Duo
            const heartColors = ['#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337'];
            this.draw3DHeart(ctx, 100, 96, 26 + level * 6, '#fda4af', heartColors[level - 1], '#4c0519');
            if (level >= 3) {
                this.drawGoldRibbonBow(ctx, 100, 134, 24 + level * 2);
            }
            if (level === 5) {
                this.drawFacetedGem(ctx, 100, 88, 14, '#ffffff', '#38bdf8', '#0369a1');
            }
        } else if (themeKey === 'winter_gala') {
            // Winter Gala Chain: Crystal Snowflake -> Gold Ornament -> Hot Cocoa -> Royal Snowglobe -> Imperial Ice Crown
            this.drawFacetedGem(ctx, 100, 96, 24 + level * 6, '#ffffff', '#38bdf8', '#1e3a8a');
            if (level >= 3) {
                ctx.strokeStyle = '#fde047';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(100, 96, 34 + level * 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else {
            // Default Seasonal Event: Halloween Luxury Pumpkin & Mystic Artifacts
            this.drawLuxuryPumpkin(ctx, 100, 104, 24 + level * 6, level);
        }
    }

    drawLuxuryPumpkin(ctx, x, y, r, level) {
        ctx.save();
        // Golden twisted stem
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 0.75);
        ctx.quadraticCurveTo(x + 8, y - r * 1.25, x + 16, y - r * 1.15);
        ctx.stroke();

        // Ribbed 3D pumpkin lobes
        const offsets = [-0.55, -0.28, 0, 0.28, 0.55];
        offsets.forEach((off) => {
            const pGrad = ctx.createRadialGradient(x + off * r - 6, y - 8, 3, x + off * r, y, r * 0.85);
            if (level === 5) {
                pGrad.addColorStop(0, '#fef08a');
                pGrad.addColorStop(0.5, '#f59e0b');
                pGrad.addColorStop(1, '#78350f');
            } else {
                pGrad.addColorStop(0, '#fdba74');
                pGrad.addColorStop(0.45, '#ea580c');
                pGrad.addColorStop(1, '#431407');
            }
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.ellipse(x + off * r * 0.85, y, r * 0.45, r * 0.78, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
            ctx.lineWidth = 1.4;
            ctx.stroke();
        });

        if (level >= 3) {
            this.drawFacetedGem(ctx, x, y, 8 + level * 1.5, '#f3e8ff', '#a855f7', '#3b0764');
        }
        ctx.restore();
    }

    draw3DHeart(ctx, x, y, size, lightCol, midCol, darkCol) {
        ctx.save();
        const g = ctx.createRadialGradient(x - size * 0.25, y - size * 0.25, 3, x, y, size * 1.2);
        g.addColorStop(0, lightCol);
        g.addColorStop(0.5, midCol);
        g.addColorStop(1, darkCol);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.75);
        ctx.bezierCurveTo(x - size * 1.2, y + size * 0.1, x - size * 0.9, y - size * 0.85, x, y - size * 0.35);
        ctx.bezierCurveTo(x + size * 0.9, y - size * 0.85, x + size * 1.2, y + size * 0.1, x, y + size * 0.75);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }

    // ========================================================
    // SHARED VECTOR DRAWING HELPERS
    // ========================================================
    drawStemAndLeaves(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2 - 6, (y1 + y2) / 2, x2, y2);
        ctx.stroke();
        this.drawLeaf(ctx, (x1 + x2) / 2 - 12, (y1 + y2) / 2, -0.6, 18);
        this.drawLeaf(ctx, (x1 + x2) / 2 + 12, (y1 + y2) / 2 + 6, 0.6, 18);
    }

    drawLeaf(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const leafGrad = ctx.createLinearGradient(-size, 0, size, 0);
        leafGrad.addColorStop(0, '#4ade80');
        leafGrad.addColorStop(0.5, '#15803d');
        leafGrad.addColorStop(1, '#052e16');
        ctx.fillStyle = leafGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawDetailedRose(ctx, cx, cy, radius, mainCol, lightCol, darkCol) {
        ctx.save();
        for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2;
            const px = cx + Math.cos(a) * (radius * 0.46);
            const py = cy + Math.sin(a) * (radius * 0.46);
            const pGrad = ctx.createRadialGradient(px - 3, py - 3, 2, px, py, radius * 0.58);
            pGrad.addColorStop(0, lightCol);
            pGrad.addColorStop(0.6, mainCol);
            pGrad.addColorStop(1, darkCol);
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(px, py, radius * 0.54, 0, Math.PI * 2);
            ctx.fill();
        }
        const coreGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, radius * 0.56);
        coreGrad.addColorStop(0, lightCol);
        coreGrad.addColorStop(0.65, mainCol);
        coreGrad.addColorStop(1, darkCol);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.54, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 240, 245, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.26, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
    }

    drawGoldRibbonBow(ctx, x, y, size) {
        ctx.save();
        const g = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
        g.addColorStop(0, '#b45309');
        g.addColorStop(0.5, '#fef08a');
        g.addColorStop(1, '#d97706');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x - size * 0.48, y, size * 0.48, size * 0.26, -0.25, 0, Math.PI * 2);
        ctx.ellipse(x + size * 0.48, y, size * 0.48, size * 0.26, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawSparkle(ctx, x, y, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.quadraticCurveTo(x, y, x + size, y);
        ctx.quadraticCurveTo(x, y, x, y + size);
        ctx.quadraticCurveTo(x, y, x - size, y);
        ctx.quadraticCurveTo(x, y, x, y - size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

// ========================================================
// 2. THREE.JS 3D TREASURE CHEST & REWARD OPENING ANIMATION ENGINE
// ========================================================
class RewardChest3DEngine {
    constructor() {
        this.isOpen = false;
        this.animId = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.chestGroup = null;
        this.lidPivot = null;
        this.particles = [];
        this.risingItems = [];
        this.clock = null;
        this.phase = 'idle';
        this.phaseTime = 0;
    }

    ensureModalDOM() {
        let modal = document.getElementById('chest3DModal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'chest3DModal';
        modal.className = 'chest-3d-modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="chest-3d-stage-card">
                <div class="chest-3d-header">
                    <span class="chest-3d-eyebrow">✦ KRALİYET HAZİNE SANDIĞI</span>
                    <h2 id="chest3DTitle">ÖZEL TAMAMLAMA ÖDÜLÜ!</h2>
                    <p id="chest3DSubtitle">Sandık açılıyor, lüks ödülleriniz yükseliyor...</p>
                </div>
                <div id="chest3DCanvasWrap" class="chest-3d-canvas-wrap"></div>
                <div id="chest3DRewardsTray" class="chest-3d-rewards-tray"></div>
                <button id="chest3DClaimBtn" class="chest-3d-claim-btn" style="display:none;">
                    ✦ ÖDÜLLERİ ENVANTERE AL
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        const btn = document.getElementById('chest3DClaimBtn');
        if (btn) {
            btn.onclick = () => this.close();
        }
        return modal;
    }

    open(config = {}) {
        const modal = this.ensureModalDOM();
        const titleEl = document.getElementById('chest3DTitle');
        const subEl = document.getElementById('chest3DSubtitle');
        const trayEl = document.getElementById('chest3DRewardsTray');
        const btnEl = document.getElementById('chest3DClaimBtn');
        const wrapEl = document.getElementById('chest3DCanvasWrap');

        if (titleEl) titleEl.textContent = config.title || 'KRALİYET HAZİNE SANDIĞI!';
        if (subEl) subEl.textContent = config.subtitle || 'Tebrikler! Özel ödülleriniz sandıktan çıkıyor!';
        if (trayEl) {
            trayEl.innerHTML = '';
            trayEl.classList.remove('visible');
        }
        if (btnEl) btnEl.style.display = 'none';

        this.onCloseCallback = config.onClose || null;
        this.rewardsList = config.rewards || [
            { icon: '💎', label: '+10 Elmas', img: 'assets/rewards/reward_gems.jpg' },
            { icon: '💰', label: '+$500 Altın', img: 'assets/rewards/reward_prestige.jpg' }
        ];

        modal.style.display = 'flex';
        this.isOpen = true;
        this.initThreeScene(wrapEl);
    }

    initThreeScene(wrapEl) {
        if (!wrapEl || !window.THREE) {
            this.revealRewardCards();
            return;
        }
        wrapEl.innerHTML = '';

        const width = Math.min(360, window.innerWidth - 36);
        const height = 250;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(0, 2.3, 5.6);
        this.camera.lookAt(0, 0.6, 0);

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        wrapEl.appendChild(this.renderer.domElement);

        const ambient = new THREE.AmbientLight(0xfff2cc, 0.85);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffd700, 1.5);
        dirLight.position.set(3, 6, 5);
        this.scene.add(dirLight);

        this.innerGlowLight = new THREE.PointLight(0xffea00, 0, 8);
        this.innerGlowLight.position.set(0, 0.8, 0);
        this.scene.add(this.innerGlowLight);

        this.chestGroup = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b1d2f, roughness: 0.35, metalness: 0.2 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.18, metalness: 0.92 });

        const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.4), woodMat);
        baseMesh.position.y = 0.55;
        this.chestGroup.add(baseMesh);

        const trimBottom = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.16, 1.48), goldMat);
        trimBottom.position.y = 0.1;
        this.chestGroup.add(trimBottom);

        const trimMid = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.16, 1.48), goldMat);
        trimMid.position.y = 1.05;
        this.chestGroup.add(trimMid);

        const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.14), goldMat);
        lockPlate.position.set(0, 0.95, 0.72);
        this.chestGroup.add(lockPlate);

        this.lidPivot = new THREE.Group();
        this.lidPivot.position.set(0, 1.1, -0.7);

        const lidBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.4), woodMat);
        lidBox.position.set(0, 0.22, 0.7);
        this.lidPivot.add(lidBox);

        const lidArch = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.22, 20, 1, false, 0, Math.PI), goldMat);
        lidArch.rotation.z = Math.PI / 2;
        lidArch.position.set(0, 0.25, 0.7);
        this.lidPivot.add(lidArch);

        this.chestGroup.add(this.lidPivot);

        const rayGeo = new THREE.ConeGeometry(1.6, 3.2, 24, 1, true);
        const rayMat = new THREE.MeshBasicMaterial({
            color: 0xffe66d,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        this.godRayCone = new THREE.Mesh(rayGeo, rayMat);
        this.godRayCone.position.set(0, 1.8, 0);
        this.godRayCone.rotation.x = Math.PI;
        this.chestGroup.add(this.godRayCone);

        this.chestGroup.position.y = 3.2;
        this.scene.add(this.chestGroup);

        this.particles = [];
        const pColors = [0xffd700, 0xffffff, 0xff4d6d, 0x38bdf8, 0xa855f7];
        for (let i = 0; i < 55; i++) {
            const pGeo = new THREE.OctahedronGeometry(0.08 + Math.random() * 0.08, 0);
            const pMat = new THREE.MeshBasicMaterial({ color: pColors[i % pColors.length] });
            const p = new THREE.Mesh(pGeo, pMat);
            p.visible = false;
            p.userData = {
                vx: (Math.random() - 0.5) * 4.5,
                vy: 2.2 + Math.random() * 3.8,
                vz: (Math.random() - 0.5) * 4.5
            };
            this.scene.add(p);
            this.particles.push(p);
        }

        this.risingItems = [];
        const count = Math.min(4, this.rewardsList.length);
        for (let i = 0; i < count; i++) {
            const orbGroup = new THREE.Group();
            const gemGeo = new THREE.OctahedronGeometry(0.32, 1);
            const gemMat = new THREE.MeshStandardMaterial({
                color: i === 0 ? 0xffd700 : (i === 1 ? 0xec4899 : 0x38bdf8),
                emissive: i === 0 ? 0x996515 : 0x3b0764,
                metalness: 0.7,
                roughness: 0.15
            });
            const gemMesh = new THREE.Mesh(gemGeo, gemMat);
            orbGroup.add(gemMesh);

            const haloGeo = new THREE.RingGeometry(0.38, 0.46, 24);
            const haloMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0, side: THREE.DoubleSide });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            orbGroup.add(halo);

            orbGroup.position.set(0, 0.7, 0);
            orbGroup.scale.setScalar(0.01);
            const spread = (i - (count - 1) / 2) * 1.05;
            orbGroup.userData = { targetX: spread, targetY: 2.05, targetZ: 0.5 };
            this.scene.add(orbGroup);
            this.risingItems.push(orbGroup);
        }

        this.clock = new THREE.Clock();
        this.phase = 'drop';
        this.phaseTime = 0;
        this.cardsRevealed = false;

        if (this.animId) cancelAnimationFrame(this.animId);
        const animateLoop = () => {
            if (!this.isOpen) return;
            this.animId = requestAnimationFrame(animateLoop);
            this.updateAnimation();
        };
        animateLoop();
    }

    updateAnimation() {
        const dt = Math.min(0.05, this.clock.getDelta());
        this.phaseTime += dt;

        if (this.phase === 'drop') {
            const t = Math.min(1, this.phaseTime / 0.45);
            const ease = 1 - Math.pow(1 - t, 3);
            this.chestGroup.position.y = 3.2 * (1 - ease);
            this.chestGroup.rotation.y = Math.sin(t * Math.PI) * 0.25;
            if (t >= 1) {
                this.phase = 'anticipation';
                this.phaseTime = 0;
            }
        } else if (this.phase === 'anticipation') {
            const shake = Math.sin(this.phaseTime * 55) * 0.08;
            this.chestGroup.rotation.z = shake;
            this.chestGroup.scale.set(1 + shake * 0.4, 1 - shake * 0.4, 1 + shake * 0.4);
            if (this.phaseTime >= 0.42) {
                this.chestGroup.rotation.z = 0;
                this.chestGroup.scale.set(1, 1, 1);
                this.phase = 'burst';
                this.phaseTime = 0;
                this.particles.forEach((p) => {
                    p.visible = true;
                    p.position.set(0, 1.0, 0);
                });
            }
        } else if (this.phase === 'burst') {
            const openProgress = Math.min(1, this.phaseTime / 0.5);
            this.lidPivot.rotation.x = -openProgress * (Math.PI * 0.68);
            this.innerGlowLight.intensity = openProgress * 4.5;
            this.godRayCone.material.opacity = openProgress * 0.36;
            this.godRayCone.rotation.y += dt * 1.5;

            this.particles.forEach((p) => {
                p.position.x += p.userData.vx * dt;
                p.position.y += p.userData.vy * dt;
                p.position.z += p.userData.vz * dt;
                p.userData.vy -= 5.8 * dt;
                p.rotation.x += 5 * dt;
                p.rotation.y += 5 * dt;
            });

            this.risingItems.forEach((orb) => {
                const rt = Math.min(1, this.phaseTime / 0.75);
                const backOut = 1 + 1.7 * Math.pow(rt - 1, 3) + 0.7 * Math.pow(rt - 1, 2);
                orb.position.x = orb.userData.targetX * rt;
                orb.position.y = 0.7 + (orb.userData.targetY - 0.7) * Math.max(0, backOut);
                orb.position.z = orb.userData.targetZ * rt;
                orb.scale.setScalar(Math.max(0.01, rt));
                orb.rotation.y += dt * 2.4;
            });

            if (this.phaseTime >= 0.55 && !this.cardsRevealed) {
                this.cardsRevealed = true;
                this.revealRewardCards();
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    revealRewardCards() {
        const trayEl = document.getElementById('chest3DRewardsTray');
        const btnEl = document.getElementById('chest3DClaimBtn');
        if (trayEl) {
            trayEl.innerHTML = this.rewardsList.map((r, idx) => `
                <div class="chest-3d-reward-card" style="animation-delay: ${idx * 0.12}s">
                    <div class="chest-reward-glow"></div>
                    ${r.img ? `<img src="${r.img}" alt="${r.label}" class="chest-reward-img">` : `<span class="chest-reward-emoji">${r.icon || '🎁'}</span>`}
                    <strong class="chest-reward-label">${r.label}</strong>
                </div>
            `).join('');
            trayEl.classList.add('visible');
        }
        if (btnEl) {
            btnEl.style.display = 'inline-flex';
        }
    }

    close() {
        this.isOpen = false;
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        const modal = document.getElementById('chest3DModal');
        if (modal) modal.style.display = 'none';
        if (typeof this.onCloseCallback === 'function') {
            const cb = this.onCloseCallback;
            this.onCloseCallback = null;
            cb();
        }
    }
}

// ========================================================
// 3. CENTRALIZED SEASONAL LIVE-OPS THEME MANAGER (window.ThemeManager)
// Supports: 'default', 'halloween', 'valentines', 'winter_gala'
// ========================================================
class SeasonalThemeManager {
    constructor() {
        this.themes = {
            default: {
                id: 'default',
                name: 'Aurelia Contemporary Luxury',
                shortLabel: '👑 Standart Lüks',
                badgeIcon: '👑',
                accentColor: '#fbbf24',
                secondaryColor: '#d97706',
                bgTint: 'rgba(13, 15, 23, 1)',
                bannerTitle: '✦ AURELIA PALACE — MODERN LÜKS SEZONU',
                bannerDesc: 'Standart sezon aktif. Sezonluk özel etkinlikleri (Cadılar Bayramı, Sevgililer Günü, Kış Galası) üstteki tema seçiciden istediğiniz an etkinleştirebilirsiniz!',
                hasEventChain: false,
                eventChainName: '👑 Özel Etkinlik Koleksiyonu',
                eventItems: [
                    { name: 'Altın Mühür', icon: '🪙' },
                    { name: 'Kraliyet Rozeti', icon: '🏅' },
                    { name: 'Kristal Kupa', icon: '🏆' },
                    { name: 'Aurelia Asası', icon: '⚜️' },
                    { name: 'İmparatorluk Küresi', icon: '👑' }
                ]
            },
            halloween: {
                id: 'halloween',
                name: 'Mistika Cadılar Bayramı (Halloween Live-Ops)',
                shortLabel: '🎃 Cadılar Bayramı',
                badgeIcon: '🎃',
                accentColor: '#f97316',
                secondaryColor: '#9333ea',
                bgTint: 'rgba(22, 11, 36, 1)',
                bannerTitle: '🎃 CADILAR BAYRAMI ETKİNLİĞİ: MİSTİKA BALOSU AKTİF!',
                bannerDesc: '3D Otel lobisine lüks balkabağı aranjmanları ve mistik ışıklandırmalar eklendi! Masada sınırlı süreli Cadılar Bayramı objelerini birleştirerek ekstra ödüller kazanın!',
                hasEventChain: true,
                eventChainName: '🎃 Cadılar Bayramı Özel Koleksiyonu',
                eventItems: [
                    { name: 'Mistik Mor Mum', icon: '🕯️' },
                    { name: 'Altın Balkabağı Feneri', icon: '🎃' },
                    { name: 'Cadı İksiri Kristali', icon: '🧪' },
                    { name: 'Gotik Balkabağı Aranjmanı', icon: '🦇' },
                    { name: 'Kraliyet Hayalet Şatosu Tacı', icon: '👑' }
                ]
            },
            valentines: {
                id: 'valentines',
                name: 'Romantik Sevgililer Günü (Valentine’s Live-Ops)',
                shortLabel: '💘 Sevgililer Günü',
                badgeIcon: '💘',
                accentColor: '#f43f5e',
                secondaryColor: '#ec4899',
                bgTint: 'rgba(34, 10, 24, 1)',
                bannerTitle: '💘 SEVGİLİLER GÜNÜ ETKİNLİĞİ: MONAKO AŞK GALASI AKTİF!',
                bannerDesc: '3D Otel lobisine özel çiçek köşe tasarımları ve zarif kalp kemerleri eklendi! Masada sınırlı süreli Sevgililer Günü objelerini birleştirin!',
                hasEventChain: true,
                eventChainName: '💘 Sevgililer Günü Özel Koleksiyonu',
                eventItems: [
                    { name: 'Mühürlü Aşk Mektubu', icon: '💌' },
                    { name: 'Kadife Kalp Çikolata Kutusu', icon: '🍫' },
                    { name: 'Kristal Kalp Parfümü', icon: '💖' },
                    { name: 'Kırmızı Gül Kalp Kemeri', icon: '🌹' },
                    { name: 'Ebedi Aşk Elmas Kuğu Heykeli', icon: '🦢' }
                ]
            },
            winter_gala: {
                id: 'winter_gala',
                name: 'Kış Sarayı & Yılbaşı Galası (Winter Live-Ops)',
                shortLabel: '❄️ Kış Galası',
                badgeIcon: '❄️',
                accentColor: '#38bdf8',
                secondaryColor: '#fbbf24',
                bgTint: 'rgba(10, 22, 40, 1)',
                bannerTitle: '❄️ KIŞ SARAYI ETKİNLİĞİ: KRİSTAL GALA AKTİF!',
                bannerDesc: '3D Otel lobisine altın yılbaşı çamları ve kristal kar küreleri eklendi! Sınırlı süreli Kış Galası objelerini masada birleştirin!',
                hasEventChain: true,
                eventChainName: '❄️ Kış Sarayı Özel Koleksiyonu',
                eventItems: [
                    { name: 'Kristal Kar Tanesi', icon: '❄️' },
                    { name: 'Altın Çam Küresi', icon: '🎄' },
                    { name: 'Kraliyet Sıcak Çikolatası', icon: '☕' },
                    { name: 'Altın Kış Sarayı Kar Küresi', icon: '🔮' },
                    { name: 'İmparatorluk Kış Tacı', icon: '👑' }
                ]
            }
        };

        this.currentTheme = 'default';
        this.listeners = [];
        this.loadSavedTheme();
    }

    loadSavedTheme() {
        try {
            const saved = localStorage.getItem('velvet_seasonal_theme_v1');
            if (saved && this.themes[saved]) {
                this.currentTheme = saved;
            }
        } catch (e) {}
    }

    getActiveTheme() {
        return this.themes[this.currentTheme] || this.themes.default;
    }

    setTheme(themeId) {
        if (!this.themes[themeId]) return;
        this.currentTheme = themeId;
        try {
            localStorage.setItem('velvet_seasonal_theme_v1', themeId);
        } catch (e) {}

        // Clear cached procedural images for chain 4 so seasonal icons refresh immediately
        if (window.LuxuryArt && window.LuxuryArt.itemCache) {
            Object.keys(window.LuxuryArt.itemCache).forEach((k) => {
                if (k.startsWith('sr_v5_4_')) delete window.LuxuryArt.itemCache[k];
            });
        }

        this.applyThemeToDOM();

        if (window.hotel3D && typeof window.hotel3D.applySeasonalTheme3D === 'function') {
            window.hotel3D.applySeasonalTheme3D(themeId);
        }

        this.listeners.forEach((cb) => {
            try { cb(this.getActiveTheme()); } catch (e) {}
        });
    }

    subscribe(cb) {
        if (typeof cb === 'function') this.listeners.push(cb);
    }

    applyThemeToDOM() {
        const t = this.getActiveTheme();
        document.body.setAttribute('data-seasonal-theme', t.id);
        document.documentElement.style.setProperty('--seasonal-accent', t.accentColor);
        document.documentElement.style.setProperty('--seasonal-secondary', t.secondaryColor);

        const btn = document.getElementById('seasonalThemeBtn');
        if (btn) {
            btn.innerHTML = `${t.badgeIcon} <span>${t.shortLabel}</span>`;
        }

        const banner = document.getElementById('seasonalEventBanner');
        if (banner) {
            if (t.id === 'default') {
                banner.className = 'seasonal-event-banner theme-default';
            } else {
                banner.className = `seasonal-event-banner theme-${t.id} active-event`;
            }
            banner.innerHTML = `
                <div class="seb-left">
                    <span class="seb-icon">${t.badgeIcon}</span>
                    <div class="seb-text">
                        <strong>${t.bannerTitle}</strong>
                        <small>${t.bannerDesc}</small>
                    </div>
                </div>
                <div class="seb-actions">
                    ${t.hasEventChain ? `<button id="spawnEventItemBtn" class="seb-spawn-btn">✨ Etkinlik Objesi Üret (-2⚡)</button>` : ''}
                    <button id="changeSeasonalThemeBtn" class="seb-switch-btn">🎭 Etkinlik Seç</button>
                </div>
            `;
        }
    }
}

window.LuxuryArt = new LuxuryArtEngine();
window.RewardChest3D = new RewardChest3DEngine();
window.ThemeManager = new SeasonalThemeManager();
