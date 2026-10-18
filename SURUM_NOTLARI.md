# 🏨 Velvet Secrets — Türkçe Sürüm Notları ve Değişiklik Günlüğü (Changelog)

Bu dosya, **Velvet Secrets (Aurelia Palace Hotel)** Android oyununun tüm versiyon güncellemelerini ve eklenen özellikleri Türkçe olarak detaylandırır.

---

## 🎨 Sürüm `v2.5.2` (18 Ekim 2026) — *44 Farklı Full-HD Tasarım Seçeneği Görseli (`assets/designs/`) ve Onay Sonrası Otomatik Kapanan Yenileme Çubuğu*
- **Her Eşya İçin Birbirinden Tamamen Farklı 4 Full-HD Görsel (`11 Alan × 4 Durum = 44 Görsel`):**
  - `www/assets/designs/` klasöründe 11 otel alanının tamamı için birbirinden görsel, renk paleti, kadraj, materyal küreleri ve 3D madalyon olarak tamamen ayrışan **44 adet keskin Full-HD `.jpg`** üretildi:
    - `{alan}_old.jpg`: Yıpranmış, soluk sepya-gri **Seviye 1 (Yenilenmemiş Eski Hali)** görseli.
    - `{alan}_opt_a.jpg`: **1. Modern Zarafet** — İtalyan Beyaz Carrara Mermeri, 24K Altın ve Kristal aydınlatmalı tasarım.
    - `{alan}_opt_b.jpg`: **2. Kraliyet Kadife** — Bordo/Yakut Kraliyet Kadifesi, Siyah Nero Mermer ve şamdanlı tasarım.
    - `{alan}_opt_c.jpg`: **3. Akdeniz Riviera** — Turkuaz Mozaik, Zümrüt İpek ve Oyma Maun sahil tasarımı.
- **Seçim Yapıp Onaylandığında Yenilemenin Otomatik Kapanması (`hotel3d.js`):**
  - Oyuncu 3 tasarımdan birini seçip **`✓ Seçimi Onayla & Kur`** butonuna bastığı anda:
    1. Seçilen tasarım oda sahnesindeki eşyaya kalıcı olarak uygulanır.
    2. Alt 3-Tasarım Seçici Çubuğu (`#ghBottomDesignDock`) ve Yenileme Penceresi (`#renoModal`) **otomatik olarak kapanır**.
    3. Sahnedeki eşyanın üzerindeki `🔨 YENİLE!` çekici kalkar ve yerine **`✅ Kurulu`** rozeti gelir; yakınlık paneli de **`✅ YENİLEME TAMAMLANDI`** durumuna geçerek sıradaki yenilenecek eşyaya geçiş butonu sunar.

---

## 🛠️ Sürüm `v2.5.1` (18 Ekim 2026) — *Alt 3-Tasarım Seçici Çubuğu (`#ghBottomDesignDock`) Görünürlük, Android WebView Canvas ve Mobil Etkileşim Düzeltmesi*
- **Android WebView `SecurityError` (Tainted Canvas) Çökmesi Giderildi (`luxury_art.js`):**
  - Android `file://` protokolünde yerel görseller `<canvas>` üzerine çizilip `toDataURL()` çağrıldığında oluşan güvenlik hatası (`SecurityError`), alt 3-tasarım seçici çubuğunun (`#ghBottomDesignDock`) HTML içeriği oluşturulmadan hemen önce kodun durmasına yol açıyordu. `getDesignPreview()` fonksiyonu güvenli `try/catch` yapısına alındı ve her 3 tasarım için özel foto-gerçekçi CSS filtre ve ışıklandırma (`getDesignCssFilter`) eklendi.
- **Her Zaman Görünür & Sabitlenmiş Alt 3-Tasarım Seçici Çubuğu (`#ghBottomDesignDock`):**
  - Alt tasarım seçici çubuk artık sahnenin altında gizli kalmıyor veya sahnenin `overflow: hidden` sınırları tarafından kesilmiyor; direkt olarak 2.5D Otel Sahnesinin hemen altında sabit, parlak altın çerçeveli bir dock olarak **her zaman açık** duruyor.
  - Herhangi bir yenileme butonuna (`🔨 YENİLE!`, `🎨 3 Tasarımdan Seç & Kur` veya `GİT / YENİLE`) basıldığında ekran otomatik olarak alt tasarım çubuğuna kayıyor (`scrollIntoView`), altın vurgu animasyonu (`dock-pulse-highlight`) yapıyor ve **1. Modern Zarafet**, **2. Kraliyet Kadife**, **3. Akdeniz Riviera** seçeneklerini canlı önizlemeli olarak sunuyor.
- **3 Noktadan Anında Tasarım Seçimi:**
  - 3 tasarım seçeneği hem **2.5D Sahnenin Altındaki Seçici Çubukta (`#ghBottomDesignDock`)**, hem **Seçili Eşya Yakınlık Panelinde (`#renovationProximityPanel`)**, hem de **Detaylı Yenileme Penceresinde (`#renoModal`)** doğrudan tıklanabilir ve canlı önizlenebilir hale getirildi.

---

## 🌟 Sürüm `v2.5.0` (18 Ekim 2026) — *Gossip Harbor Tarzı 2.5D Foto-Gerçekçi & İzometrik Otel Restorasyon Sahnesi ve Alt 3-Tasarım Seçici Dock*
- **Gossip Harbor Tarzı 2.5D Foto-Gerçekçi & İzometrik Otel Sahnesi (`#ghSceneStage`):**
  - Eski birinci şahıs (FPS) kutu/silindir WebGL koridor yapısı tamamen kaldırıldı; yerine tıpkı *Gossip Harbor*’daki gibi **tam ekran foto-gerçekçi oda sahneleri üzerinde parmakla kaydırarak gezinme (Pan & Zoom)** ve **🗺️ İzometrik Otel Haritası** görünümü eklendi.
- **Eşyaların Üzerinde İnteraktif Çekiç/Yıldız Balonları (`🔨 YENİLE!`):**
  - Her odadaki eşyalar (*Mermer Resepsiyon Bankosu, Bohemya Kristal Avizesi, Kraliyet Halıları, Restoran Masaları, Onyx Şampanya Barı, Suit 101 Yatağı, Deniz Terası, Sonsuzluk Havuzu, Zen Termal Spa, Botanik Bahçe Çeşmesi, 2. Kat Penthouse Piyano Salonu*) doğrudan foto-gerçekçi oda sahnesi üzerindeki gerçek konumlarında yer alır.
  - Seviye 1 (yenilenmemiş) eşyalar yıpranmış/eski görünümde (`🕸️ Seviye 1`) durur; üzerlerindeki **`🔨 $1,200`** veya **`🔨 YENİLE!`** balonuna dokunulduğunda kamera yumuşakça o eşyaya odaklanır.
- **Sahne İçinde Yürüyen Karakterler (*Isabella Laurent, Adrian Vale, Serena Black, Leon Marchand*):**
  - Oda zemini üzerinde herhangi bir noktaya veya bir eşyanın `🔨` balonuna dokunduğunuzda **Isabella Laurent** sahne içinde yürüyerek o eşyanın yanına gider ve konuşma balonuyla yorum yapar.
- **Gossip Harbor İkonik Alt 3-Tasarım Seçici Çubuğu (`#ghBottomDesignDock`):**
  - Bir eşyaya dokunduğunuzda ekranın altında **3 Lüks Tasarım Seçeneği** (`1. Modern Zarafet`, `2. Kraliyet Kadife`, `3. Akdeniz Riviera`) yan yana açılır.
  - Seçeneklere dokunduğunuz anda **oda sahnesindeki eşya canlı olarak dönüşür** ve yeşil **`✓ Seçimi Onayla & Kur`** butonuyla kalıcı olarak kurulur.

---

## 🚀 Sürüm `v2.4.0` — *Foto-Gerçekçi Görevler, 3D Boyamalı Kazanımlar & Mobil/Tablet UI*
- **Konuyla Birebir Uyumlu 5 Aşamalı Foto-Gerçekçi Görev (`#tasks`):** Her göreve konusuyla birebir örtüşen 16:9 HD foto-gerçekçi arka plan sahnesi ve konu ikonu eklendi.
- **3D Boyamalı Kazanım (`Kazanımlar`) İkonları & Büyük Kraliyet Sandığı:** Tüm ödüller için yüksek çözünürlüklü 3D boyamalı ikonlar (`reward_energy.jpg`, `reward_prestige.jpg`, `reward_gems.jpg`, `reward_star.jpg`, `reward_chest.jpg`, `reward_spawner.jpg`) üretildi.

---

## 🛠️ Sürüm `v2.2.0` — *4 Seviyeli Bağımsız Restorasyon & 18 HD Obje İllüstrasyonu*
- 11 otel alanının her biri için bağımsız **Seviye 1 ➔ Seviye 2 ➔ Seviye 3 ➔ Seviye 4** yükseltme sistemi ve 5x5 birleştirme masasında 18 benzersiz boyamalı lüks obje illüstrasyonu eklendi.

---

## 💰 Sürüm `v2.0.0` — *Görünür Maliyetler, Çift Gelir Sistemi & Kilitli Tasarımlar*
- Başlangıçtan itibaren görünür maliyet tablosu (`📋 Tüm Maliyetler`), birleşik çift gelir kasası (`💼 Kasa Defteri`) ve otomatik bütçe bildirimi eklendi.
