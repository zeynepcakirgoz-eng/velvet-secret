// ========================================================
// VELVET SECRETS - LUXURY OBJECT & INTERIOR ART ENGINE
// Generates High-DPI Crystalline, Metallic Gold & Velvet
// Object Illustrations and 3-Design Architectural Previews
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
            room101_bed: 'assets/scene_presidential_suite.jpg',
            room101_decor: 'assets/scene_suite_terrace.jpg',
            restaurant_tables: 'assets/scene_restaurant_pool.jpg',
            restaurant_bar: 'assets/scene_restaurant_bar.jpg',
            swimming_pool: 'assets/scene_infinity_pool.jpg',
            spa_jacuzzi: 'assets/scene_spa_wellness.jpg',
            garden_courtyard: 'assets/scene_garden_terrace.jpg',
            penthouse_suite: 'assets/scene_penthouse_piano.jpg'
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

        this.preloadScenes();
    }

    preloadScenes() {
        const urls = new Set(Object.values(this.areaSceneMap));
        urls.forEach((url) => {
            const img = new Image();
            img.onload = () => {
                this.loadedPhotos[url] = img;
                this.designPreviewCache = {};
            };
            img.src = url;
        });
    }

    getAreaScene(areaId) {
        return this.areaSceneMap[areaId] || 'assets/scene_lobby_reception.jpg';
    }

    getRewardIcon(type) {
        return this.rewardIconMap[type] || 'assets/rewards/reward_prestige.jpg';
    }

    // Returns the high-resolution painted luxury illustration path for any (type, level) merge item
    getItemImage(type, level) {
        return `assets/items/item_${type}_${level}.jpg`;
    }

    getProceduralItemImage(type, level) {
        const key = `${type}_${level}`;
        if (this.itemCache[key]) return this.itemCache[key];

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // 1. Rich dark slate-velvet luxury vignette background with subtle gold rim
        const bgGrad = ctx.createRadialGradient(100, 95, 12, 100, 100, 105);
        if (level >= 5) {
            bgGrad.addColorStop(0, '#4a3820');
            bgGrad.addColorStop(0.55, '#222634');
            bgGrad.addColorStop(1, '#12151f');
        } else if (level >= 3) {
            bgGrad.addColorStop(0, '#332c28');
            bgGrad.addColorStop(0.6, '#1f2330');
            bgGrad.addColorStop(1, '#12151e');
        } else {
            bgGrad.addColorStop(0, '#2a2f40');
            bgGrad.addColorStop(0.65, '#1b1f2b');
            bgGrad.addColorStop(1, '#11141c');
        }
        ctx.fillStyle = bgGrad;
        this.roundRect(ctx, 4, 4, 192, 192, 26);
        ctx.fill();

        // Subtle golden ambient aura for higher levels
        if (level >= 3) {
            const aura = ctx.createRadialGradient(100, 100, 5, 100, 100, 82);
            aura.addColorStop(0, level >= 5 ? 'rgba(255, 215, 110, 0.42)' : 'rgba(223, 191, 131, 0.24)');
            aura.addColorStop(1, 'rgba(255, 215, 110, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(100, 100, 82, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.ellipse(100, 162, 52, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw specific luxury object
        ctx.save();
        if (type === 0) {
            this.drawRosePerfumeChain(ctx, level);
        } else if (type === 1) {
            this.drawCoutureJewelryChain(ctx, level);
        } else {
            this.drawGalaGourmetChain(ctx, level);
        }
        ctx.restore();

        // Sparkle highlights for high-tier items
        if (level >= 3) {
            this.drawSparkle(ctx, 42, 46, level >= 5 ? 14 : 10, '#fff6d6');
            this.drawSparkle(ctx, 156, 52, level >= 4 ? 12 : 8, '#ffd700');
            if (level >= 5) {
                this.drawSparkle(ctx, 148, 142, 11, '#ffffff');
            }
        }

        // Inner bevel gold border
        ctx.strokeStyle = level >= 5 ? 'rgba(255, 215, 0, 0.75)' : 'rgba(223, 191, 131, 0.35)';
        ctx.lineWidth = level >= 5 ? 3 : 2;
        this.roundRect(ctx, 5, 5, 190, 190, 24);
        ctx.stroke();

        const url = canvas.toDataURL('image/png');
        this.itemCache[key] = url;
        return url;
    }

    // CHAIN 0: ROYAL ROSES & COUTURE PERFUME
    drawRosePerfumeChain(ctx, level) {
        if (level === 1) {
            // Single Velvet Crimson Rose with stem & leaves
            this.drawStemAndLeaves(ctx, 100, 115, 100, 164);
            this.drawDetailedRose(ctx, 100, 88, 42, '#b80f28', '#ff2a4b', '#590411');
        } else if (level === 2) {
            // Twin Velvet Roses tied with a Gold Satin Ribbon
            this.drawStemAndLeaves(ctx, 82, 110, 96, 165);
            this.drawStemAndLeaves(ctx, 118, 110, 104, 165);
            this.drawGoldRibbonBow(ctx, 100, 138, 28);
            this.drawDetailedRose(ctx, 78, 86, 33, '#a80c22', '#ff3355', '#4d030e');
            this.drawDetailedRose(ctx, 122, 82, 35, '#c4122d', '#ff4766', '#5e0513');
        } else if (level === 3) {
            // Glowing Royal Rose Bouquet in Ornate Golden Pedestal Vase (exact center of screenshot!)
            const glow = ctx.createRadialGradient(100, 85, 10, 100, 85, 76);
            glow.addColorStop(0, 'rgba(255, 230, 140, 0.65)');
            glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(100, 85, 76, 0, Math.PI * 2);
            ctx.fill();

            // Golden Vase
            this.drawGoldPedestalVase(ctx, 100, 132, 34, 48);
            // Lush foliage
            this.drawLeaf(ctx, 60, 96, -0.6, 22);
            this.drawLeaf(ctx, 140, 96, 0.6, 22);
            this.drawLeaf(ctx, 75, 112, -0.3, 18);
            this.drawLeaf(ctx, 125, 112, 0.3, 18);
            // Bouquet of crimson & blush-cream roses
            this.drawDetailedRose(ctx, 72, 82, 24, '#b80f28', '#ff3858', '#520410');
            this.drawDetailedRose(ctx, 128, 82, 24, '#b80f28', '#ff3858', '#520410');
            this.drawDetailedRose(ctx, 86, 62, 23, '#e8b4b8', '#fff0f3', '#9e5860');
            this.drawDetailedRose(ctx, 116, 62, 23, '#c4122d', '#ff4d6a', '#590411');
            this.drawDetailedRose(ctx, 100, 84, 28, '#f5d0d6', '#ffffff', '#b56e78');
        } else if (level === 4) {
            // Sapphire Crystal Perfume Flacon with Gold Atomizer (row 5 col 5 of screenshot)
            this.drawPerfumeBottle(ctx, 100, 112, '#0c2d70', '#2b6eff', '#051336', '#ffd700', false);
        } else if (level === 5) {
            // Ruby Couture Elixir Flacon with Gold Filigree & Tassel (row 1 col 2 of screenshot)
            this.drawPerfumeBottle(ctx, 100, 112, '#8f0b24', '#ff2e55', '#420310', '#ffd700', true);
        } else {
            // Level 6: Imperial Golden 3-Arm Candelabra with Roses & Pearls
            this.drawGoldCandelabra(ctx, 100, 105);
        }
    }

    // CHAIN 1: HIGH SOCIETY JEWELRY & COUTURE
    drawCoutureJewelryChain(ctx, level) {
        if (level === 1) {
            // Black Velvet Gift Box with Gold Satin Ribbon (row 5 col 2 of screenshot)
            this.drawLuxuryGiftBox(ctx, 100, 114);
        } else if (level === 2) {
            // Silver & Diamond Stiletto High Heel (row 1 col 3 of screenshot)
            this.drawCoutureStiletto(ctx, 100, 110, '#d8e2ef', '#ffffff', '#687385', '#d4af37');
        } else if (level === 3) {
            // Royal Sapphire & Gold Stiletto Heel (row 6 col 3 of screenshot)
            this.drawCoutureStiletto(ctx, 100, 110, '#14388c', '#457dff', '#081945', '#ffd700');
        } else if (level === 4) {
            // Emerald & Pearl Royal Necklace on Velvet Bust
            this.drawRoyalNecklace(ctx, 100, 104);
        } else if (level === 5) {
            // Vintage Leather & Brass Luxury Trunk (row 1 col 1 of screenshot)
            this.drawLuxuryTrunk(ctx, 100, 112);
        } else {
            // Level 6: Aurelia Imperial Diamond & Ruby Tiara Crown
            this.drawImperialTiara(ctx, 100, 106);
        }
    }

    // CHAIN 2: RIVIERA GALA & GOURMET DELICACIES
    drawGalaGourmetChain(ctx, level) {
        if (level === 1) {
            // Fine White & Gold Porcelain Espresso Cup on Saucer (row 5 col 4 of screenshot)
            this.drawEspressoCup(ctx, 100, 116);
        } else if (level === 2) {
            // Crystal & Gold Amber Teapot (row 4 col 1 of screenshot)
            this.drawCrystalTeapot(ctx, 100, 112);
        } else if (level === 3) {
            // French Rose & Berry Gourmet Patisserie Cake on Gold Stand (row 2 col 6 of screenshot)
            this.drawPatisserieCake(ctx, 100, 114);
        } else if (level === 4) {
            // Crystal Champagne Glass with Golden Bubbles (row 1 col 5 of screenshot)
            this.drawChampagneGlass(ctx, 100, 104);
        } else if (level === 5) {
            // Silver Ice Bucket with Vintage Champagne Bottle (row 2 col 2 of screenshot)
            this.drawSilverIceBucket(ctx, 100, 110);
        } else {
            // Level 6: Imperial Golden Trophy Chalice with Jewels (row 2 col 3 of screenshot)
            this.drawGoldenChalice(ctx, 100, 106);
        }
    }

    // --- HELPER DRAWING PRIMITIVES ---
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    drawSparkle(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(size * 0.18, size * 0.18, size, 0);
            ctx.quadraticCurveTo(size * 0.18, -size * 0.18, 0, 0);
        }
        ctx.fill();
        ctx.restore();
    }

    drawStemAndLeaves(ctx, x1, y1, x2, y2) {
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo((x1 + x2) / 2 - 6, (y1 + y2) / 2, x2, y2);
        ctx.stroke();
        this.drawLeaf(ctx, x1 - 16, y1 + 22, -0.5, 18);
        this.drawLeaf(ctx, x1 + 16, y1 + 26, 0.5, 18);
    }

    drawLeaf(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(-size, 0, size, 0);
        grad.addColorStop(0, '#1e4620');
        grad.addColorStop(0.5, '#468a3e');
        grad.addColorStop(1, '#183819');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size * 0.85, 0, 0, size);
        ctx.quadraticCurveTo(-size * 0.85, 0, 0, -size);
        ctx.fill();
        ctx.restore();
    }

    drawDetailedRose(ctx, cx, cy, radius, midColor, lightColor, darkColor) {
        ctx.save();
        ctx.translate(cx, cy);
        // Outer petals
        for (let ring = 3; ring >= 0; ring--) {
            const r = radius * (0.35 + ring * 0.22);
            const count = 5 + ring * 2;
            for (let i = 0; i < count; i++) {
                const a = (i / count) * Math.PI * 2 + ring * 0.5;
                const px = Math.cos(a) * (r * 0.45);
                const py = Math.sin(a) * (r * 0.42);
                const pGrad = ctx.createRadialGradient(px - r * 0.15, py - r * 0.15, r * 0.08, px, py, r * 0.65);
                pGrad.addColorStop(0, lightColor);
                pGrad.addColorStop(0.55, midColor);
                pGrad.addColorStop(1, darkColor);
                ctx.fillStyle = pGrad;
                ctx.beginPath();
                ctx.arc(px, py, r * 0.52, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 220, 220, 0.18)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
        // Rose spiral center
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.16, 0, Math.PI * 1.6);
        ctx.stroke();
        ctx.restore();
    }

    drawGoldRibbonBow(ctx, x, y, s) {
        ctx.save();
        ctx.translate(x, y);
        const g = ctx.createLinearGradient(-s, -s, s, s);
        g.addColorStop(0, '#a67c2e');
        g.addColorStop(0.5, '#ffd700');
        g.addColorStop(1, '#8c6218');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(-s * 0.55, 0, s * 0.55, s * 0.32, -0.25, 0, Math.PI * 2);
        ctx.ellipse(s * 0.55, 0, s * 0.55, s * 0.32, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawGoldPedestalVase(ctx, cx, cy, w, h) {
        ctx.save();
        ctx.translate(cx, cy);
        const g = ctx.createLinearGradient(-w, 0, w, 0);
        g.addColorStop(0, '#7a5618');
        g.addColorStop(0.3, '#ffd700');
        g.addColorStop(0.55, '#fff3b0');
        g.addColorStop(0.8, '#d4af37');
        g.addColorStop(1, '#61420f');
        ctx.fillStyle = g;
        // Vase body
        ctx.beginPath();
        ctx.moveTo(-w * 0.75, -h * 0.5);
        ctx.bezierCurveTo(-w, 0, -w * 0.35, h * 0.35, -w * 0.25, h * 0.55);
        ctx.lineTo(w * 0.25, h * 0.55);
        ctx.bezierCurveTo(w * 0.35, h * 0.35, w, 0, w * 0.75, -h * 0.5);
        ctx.closePath();
        ctx.fill();
        // Base foot
        ctx.beginPath();
        ctx.ellipse(0, h * 0.62, w * 0.58, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawPerfumeBottle(ctx, cx, cy, darkCol, brightCol, deepCol, goldCol, hasTassel) {
        ctx.save();
        ctx.translate(cx, cy);
        const bodyGrad = ctx.createRadialGradient(-14, -8, 6, 0, 8, 48);
        bodyGrad.addColorStop(0, brightCol);
        bodyGrad.addColorStop(0.55, darkCol);
        bodyGrad.addColorStop(1, deepCol);
        ctx.fillStyle = bodyGrad;
        this.roundRect(ctx, -38, -26, 76, 72, 16);
        ctx.fill();

        // Gold collar & faceted crystal stopper
        ctx.fillStyle = goldCol;
        ctx.fillRect(-14, -42, 28, 16);
        ctx.strokeStyle = goldCol;
        ctx.lineWidth = 3;
        this.roundRect(ctx, -38, -26, 76, 72, 16);
        ctx.stroke();

        // Gold label plaque on front
        const plaqueGrad = ctx.createLinearGradient(-20, -4, 20, 24);
        plaqueGrad.addColorStop(0, '#fff2b2');
        plaqueGrad.addColorStop(0.5, '#d4af37');
        plaqueGrad.addColorStop(1, '#8a6214');
        ctx.fillStyle = plaqueGrad;
        this.roundRect(ctx, -20, -4, 40, 28, 6);
        ctx.fill();

        // Crystal diamond cap
        const capGrad = ctx.createLinearGradient(-18, -68, 18, -42);
        capGrad.addColorStop(0, '#ffffff');
        capGrad.addColorStop(0.5, hasTassel ? '#ff9eb5' : '#bde0fe');
        capGrad.addColorStop(1, '#6c757d');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.moveTo(0, -72);
        ctx.lineTo(22, -54);
        ctx.lineTo(14, -42);
        ctx.lineTo(-14, -42);
        ctx.lineTo(-22, -54);
        ctx.closePath();
        ctx.fill();

        if (hasTassel) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(14, -34);
            ctx.quadraticCurveTo(46, -24, 44, 16);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawGoldCandelabra(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        const g = ctx.createLinearGradient(-45, -50, 45, 50);
        g.addColorStop(0, '#9c711c');
        g.addColorStop(0.5, '#ffd700');
        g.addColorStop(1, '#755110');
        ctx.strokeStyle = g;
        ctx.fillStyle = g;
        ctx.lineWidth = 6;
        // Central pillar & base
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(0, 48);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 50, 36, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Curved arms
        ctx.beginPath();
        ctx.moveTo(-42, -24);
        ctx.quadraticCurveTo(-40, 12, 0, 8);
        ctx.quadraticCurveTo(40, 12, 42, -24);
        ctx.stroke();
        // 3 Glowing candles
        [-42, 0, 42].forEach(x => {
            ctx.fillStyle = '#fff8e7';
            ctx.fillRect(x - 5, -48, 10, 24);
            const flame = ctx.createRadialGradient(x, -58, 2, x, -58, 14);
            flame.addColorStop(0, '#ffffff');
            flame.addColorStop(0.4, '#ffcc00');
            flame.addColorStop(1, 'rgba(255, 120, 0, 0)');
            ctx.fillStyle = flame;
            ctx.beginPath();
            ctx.arc(x, -58, 14, 0, Math.PI * 2);
            ctx.fill();
        });
        this.drawDetailedRose(ctx, 0, 16, 18, '#c4122d', '#ff4d6a', '#590411');
        ctx.restore();
    }

    drawLuxuryGiftBox(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Box base
        ctx.fillStyle = '#181820';
        this.roundRect(ctx, -40, -18, 80, 58, 8);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Lid
        ctx.fillStyle = '#252634';
        this.roundRect(ctx, -44, -30, 88, 18, 6);
        ctx.fill();
        ctx.stroke();
        // Gold vertical & horizontal ribbons
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-8, -30, 16, 70);
        ctx.fillRect(-40, 4, 80, 12);
        this.drawGoldRibbonBow(ctx, 0, -34, 28);
        ctx.restore();
    }

    drawCoutureStiletto(ctx, cx, cy, midCol, highlightCol, darkCol, heelCol) {
        ctx.save();
        ctx.translate(cx, cy);
        // High heel spike
        ctx.fillStyle = heelCol;
        ctx.beginPath();
        ctx.moveTo(-36, -10);
        ctx.lineTo(-28, -10);
        ctx.lineTo(-30, 42);
        ctx.lineTo(-36, 42);
        ctx.closePath();
        ctx.fill();

        // Shoe upper body
        const shoeGrad = ctx.createLinearGradient(-40, -35, 42, 42);
        shoeGrad.addColorStop(0, highlightCol);
        shoeGrad.addColorStop(0.5, midCol);
        shoeGrad.addColorStop(1, darkCol);
        ctx.fillStyle = shoeGrad;
        ctx.beginPath();
        ctx.moveTo(-38, -28);
        ctx.quadraticCurveTo(-18, -15, 6, 18);
        ctx.quadraticCurveTo(26, 20, 46, 32);
        ctx.quadraticCurveTo(44, 42, 16, 42);
        ctx.quadraticCurveTo(-6, 42, -24, 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = heelCol;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Diamond ankle buckle
        this.drawSparkle(ctx, -18, -12, 11, '#ffffff');
        this.drawSparkle(ctx, 26, 26, 10, '#ffd700');
        ctx.restore();
    }

    drawRoyalNecklace(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Velvet display bust
        ctx.fillStyle = '#1b1d29';
        ctx.beginPath();
        ctx.arc(0, 2, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pearl & gold chain
        for (let i = -6; i <= 6; i++) {
            const a = (i / 6) * 1.15 + Math.PI / 2;
            const px = Math.cos(a) * 34;
            const py = Math.sin(a) * 28 - 8;
            ctx.fillStyle = '#fffdf7';
            ctx.beginPath();
            ctx.arc(px, py, 5.5, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center Emerald Pendant
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.lineTo(12, 28);
        ctx.lineTo(0, 42);
        ctx.lineTo(-12, 28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }

    drawLuxuryTrunk(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        const g = ctx.createLinearGradient(-46, -32, 46, 38);
        g.addColorStop(0, '#3d2516');
        g.addColorStop(0.5, '#24150c');
        g.addColorStop(1, '#140b06');
        ctx.fillStyle = g;
        this.roundRect(ctx, -46, -28, 92, 66, 10);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3.5;
        ctx.stroke();
        // Brass straps & clasp
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-26, -28, 8, 66);
        ctx.fillRect(18, -28, 8, 66);
        this.roundRect(ctx, -10, -4, 20, 18, 4);
        ctx.fill();
        ctx.restore();
    }

    drawImperialTiara(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        const g = ctx.createLinearGradient(-48, -30, 48, 30);
        g.addColorStop(0, '#b58922');
        g.addColorStop(0.5, '#fff3a8');
        g.addColorStop(1, '#9c6f14');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-46, 24);
        ctx.lineTo(-38, -14);
        ctx.lineTo(-20, 6);
        ctx.lineTo(0, -38);
        ctx.lineTo(20, 6);
        ctx.lineTo(38, -14);
        ctx.lineTo(46, 24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Rubies & Diamonds
        ctx.fillStyle = '#e6193c';
        ctx.beginPath();
        ctx.arc(0, 6, 8, 0, Math.PI * 2);
        ctx.arc(-26, 12, 5, 0, Math.PI * 2);
        ctx.arc(26, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawEspressoCup(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Saucer
        ctx.fillStyle = '#e9ecef';
        ctx.beginPath();
        ctx.ellipse(0, 24, 44, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Cup body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-28, -16);
        ctx.quadraticCurveTo(-24, 22, 0, 22);
        ctx.quadraticCurveTo(24, 22, 28, -16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Rich dark espresso crema inside
        ctx.fillStyle = '#4a2511';
        ctx.beginPath();
        ctx.ellipse(0, -16, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Gold handle
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(28, 0, 11, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
    }

    drawCrystalTeapot(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        const g = ctx.createRadialGradient(-10, -6, 6, 0, 4, 42);
        g.addColorStop(0, '#ffe8a3');
        g.addColorStop(0.55, '#d98a2b');
        g.addColorStop(1, '#6e3809');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 6, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Gold lid & finial
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, -28, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -36, 6, 0, Math.PI * 2);
        ctx.fill();
        // Spout & Handle
        ctx.beginPath();
        ctx.moveTo(-34, 0);
        ctx.quadraticCurveTo(-52, -20, -46, -28);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(32, 4, 16, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.restore();
    }

    drawPatisserieCake(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Gold cake plate
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.ellipse(0, 26, 46, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cake sponge & strawberry cream layers
        ctx.fillStyle = '#fff0f3';
        this.roundRect(ctx, -34, -18, 68, 42, 8);
        ctx.fill();
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(-34, 0, 68, 8);
        // Rose & berry topping
        this.drawDetailedRose(ctx, 0, -22, 16, '#c9184a', '#ff758f', '#800f2f');
        ctx.restore();
    }

    drawChampagneGlass(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // Stem & foot
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(0, 52);
        ctx.stroke();
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.ellipse(0, 52, 24, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Golden champagne liquid
        const liq = ctx.createLinearGradient(-20, -42, 20, 12);
        liq.addColorStop(0, '#fff3b0');
        liq.addColorStop(0.5, '#f59e0b');
        liq.addColorStop(1, '#b45309');
        ctx.fillStyle = liq;
        ctx.beginPath();
        ctx.moveTo(-22, -42);
        ctx.quadraticCurveTo(-20, 14, 0, 14);
        ctx.quadraticCurveTo(20, 14, 22, -42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    drawSilverIceBucket(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        // tilted green/gold champagne bottle sticking out
        ctx.save();
        ctx.rotate(0.28);
        ctx.fillStyle = '#14452f';
        this.roundRect(ctx, -12, -56, 24, 48, 6);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-8, -64, 16, 20);
        ctx.restore();

        // Silver bucket
        const silv = ctx.createLinearGradient(-38, -14, 38, 42);
        silv.addColorStop(0, '#f8f9fa');
        silv.addColorStop(0.5, '#adb5bd');
        silv.addColorStop(1, '#495057');
        ctx.fillStyle = silv;
        ctx.beginPath();
        ctx.moveTo(-38, -14);
        ctx.lineTo(-26, 42);
        ctx.lineTo(26, 42);
        ctx.lineTo(38, -14);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }

    drawGoldenChalice(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        this.drawGoldPedestalVase(ctx, 0, 8, 44, 72);
        // Handles
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(-28, -6, 14, Math.PI * 0.4, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(28, -6, 14, -Math.PI * 0.5, Math.PI * 0.6);
        ctx.stroke();
        // Crown lid
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -28, 26, Math.PI, 0);
        ctx.fill();
        ctx.restore();
    }

    // --------------------------------------------------------
    // PHOTOREALISTIC 3-DESIGN PREVIEW GENERATOR (FOR MODAL)
    // Uses the area's HD photorealistic scene with distinct
    // architectural color grading, lighting & material swatches:
    // - opt_a: Option 1 — Modern Elegance
    // - opt_b: Option 2 — Velvet Luxury
    // - opt_c: Option 3 — Mediterranean Suite
    // --------------------------------------------------------
    getDesignCssFilter(optionId) {
        return 'none';
    }

    getUnrenovatedPreview(areaId) {
        return `assets/designs/${areaId}_old.jpg`;
    }

    getDesignPreview(areaId, optionId, targetLevel = 2) {
        if (!areaId) return 'assets/scene_lobby_reception.jpg';
        if (!optionId || optionId === 'old') {
            return `assets/designs/${areaId}_old.jpg`;
        }
        return `assets/designs/${areaId}_${optionId}.jpg`;
    }
}

window.LuxuryArt = new LuxuryArtEngine();
