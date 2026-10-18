# 🏨 Velvet Secrets — Türkçe Sürüm Notları ve Değişiklik Günlüğü (Changelog)

Bu dosya, **Velvet Secrets (Aurelia Palace Hotel)** Android oyununun tüm versiyon güncellemelerini ve eklenen özellikleri Türkçe olarak detaylandırır.

## 🌟 Sürüm `v2.7.0` (18 Ekim 2026) — *Gossip Harbour Referanslı Alan Bazlı Bağımsız Restorasyon Sistemi, 3 Tasarım Seçimi ve Canlı Dönüşüm*

Kullanıcının ayrıntılı analizi ve *Gossip Harbour: Merge & Story* referans mimarisi doğrultusunda, otel yenileme sistemi baştan sona yeniden tasarlandı. Önceki tek zincirli (1-11 global kilit) yapı tamamen kaldırılarak, her otel alanının kendi bağımsız görev zincirine sahip olduğu profesyonel restorasyon motoru devreye alındı:

### 1. 🏨 Gossip Harbour Tarzı Bağımsız Alan İlerlemesi (Independent Area Progression)
- **7 Bağımsız Otel Alanı:** `Riviera Gurme Restoran`, `Aurelia Büyük Lobi & Resepsiyon`, `Deluxe Ocean Suit 101`, `Monako Sonsuzluk Havuzu`, `Aurelia Zen Termal Spa`, `Akdeniz Botanik Bahçesi` ve `2. Kat Penthouse Lounge`.
- Hiçbir otel alanı yapay olarak bir diğerine kilitli değildir; oyuncu dilediği alana giderek o alanın restorasyon görevlerine odaklanabilir.
- Varsayılan başlangıç alanı referans mimari doğrultusunda **Riviera Gurme Restoran** olarak ayarlandı.

### 2. 📋 Net Görev Kartı ve 4 Temel Metrik (Full Gossip Harbour Task Transparency)
Her yenileme görevinde oyuncunun bütçesi ve hedefi şeffaf bir biçimde sergilenir:
- **Ne Yenilenecek:** Görevin adı, açıklaması ve kazandıracağı görsel/prestij dönüşüm.
- **Kesin Maliyet:** Gerekli altın miktarı.
- **Mevcut Bakiye:** Oyuncunun kasasındaki güncel para.
- **Kalan İhtiyaç:** Bütçe yetersizse eksik kalan tutar; bütçe yetiyorsa yeşil "Restorasyona Hazır!" onayı.
- **Durum:** *Tamamlandı*, *Aktif*, veya *Sıradaki Kilitli Görev*.
- Para yetersiz olduğunda tek tıkla birleştirme tahtasına yönlendiren ve eksik tutarı gösteren dinamik aksiyon butonu.

### 3. 🎨 3 Farklı Tasarım Seçeneği ve Canlı Sahne Önizlemesi (3 Distinct Design Choices)
- Görevin bütçesi karşılandığında Gossip Harbour alt tasarım seçici çubuğu açılır.
- 3 farklı estetik tarz (Seçenek A: Modern Zarafet, Seçenek B: Kadife Lüks, Seçenek C: Klasik Premium).
- Kartlara tıklandığında sahne üzerinde **canlı anlık önizleme** yapılır.
- "Bu Tasarımı Onayla ve Kur" butonuna basıldığında seçim mekana **kalıcı olarak sabitlenir**, alt çubuk otomatik olarak kapanır.

### 4. 💎 Otoriter Ekonomi ve Kalıcı Mekan Dönüşümü
- Altın düşümü tek seferde ve tam tutarında otoriter `GameEconomy.purchaseRenovation` ile gerçekleştirilir.
- Mekan seviyesi artar (Örn: Seviye 1'den Seviye 2'ye), alan ilerleme çubuğu güncellenir ve kutlama konfeti efekti eşliğinde sıradaki görev açılır.
- Yerleştirilen mobilya sahnede kalıcı katman (`stage_{taskId}_{optId}.png`) olarak sergilenir.

---

## 🏆 Sürüm `v2.6.0` (18 Ekim 2026) — *Gossip Harbor Mimarisinde 11 Sıralı Mobilya Kurulumu, Net Mekan Sahnesi, Kalıcı Tasarım Sabitlenmesi ve Tek Seferlik Seçim Düzeni*

Bu sürümde, kullanıcının talebi ve *Gossip Harbor* oyununun orijinal dinamikleri doğrultusunda 7 temel kuralın tümü kod tabanında tek tek kontrol edilmiş ve eksiksiz olarak hayata geçirilmiştir:

### 1. 🖼️ Net Mekan Sahnesi (Görsel Kirlilik ve Kutu Maskeler Kaldırıldı)
- Mekan sahnesindeki (`#ghSceneStage`) fotoğrafları kapatan, görsel bütünlüğü bozan opak kartlar, konuşma balonları, koyu vinyet gölgeleri ve oda geçiş pinleri kaldırıldı.
- Oda sahnesi 100% kristal netliğinde foto-gerçekçi oda panoraması ve izometrik haritadan oluşur. Mobilyalar sahneye şeffaf alfa geçişli dikişsiz katmanlar (`stage_{id}_{state}.png`) olarak yerleşir.

### 2. 📋 11 Sıralı Mobilya Kurulumu (Sequential Renovation)
- Mobilyalar tıpkı Gossip Harbor’daki gibi **kesin bir sıra** ile (Sıra 1'den 11'e) kurulur:
  1. `reception_desk` — Sıra 1/11: Mermer Resepsiyon Bankosu
  2. `lobby_chandelier` — Sıra 2/11: Büyük Lobi Kristal Avizesi
  3. `lobby_carpet` — Sıra 3/11: Kraliyet Lobi Halısı & Koltukları
  4. `restaurant_tables` — Sıra 4/11: Riviera Restoran Masaları
  5. `restaurant_bar` — Sıra 5/11: Oniks Şampanya & Kokteyl Barı
  6. `room101_bed` — Sıra 6/11: Suit 101 Dört Direkli Yatak
  7. `room101_decor` — Sıra 7/11: Suit 101 Manzara Balkonu
  8. `swimming_pool` — Sıra 8/11: Monako Sonsuzluk Havuzu
  9. `spa_jacuzzi` — Sıra 9/11: Aurelia Zen Spa Jakuzisi
  10. `garden_courtyard` — Sıra 10/11: Akdeniz Botanik Çeşmesi
  11. `penthouse_suite` — Sıra 11/11: 2. Kat Penthouse Kuyruklu Piyanosu
- Sıradaki mobilya kurulmadan bir sonrakine geçilemez (`isAreaCompleted` ve `getCurrentSequentialAreaId` kontrolleri). Sıra dışı eşyalara basıldığında kilit uyarısı verilir.

### 3. 🔒 Tek Seferlik Kurulum & Seçim Hakkının Tamamlanması (One-Time Placement)
- Her mobilya mekana **yalnızca 1 kez** konur.
- Oyuncu alt çubuktan 3 tasarımdan birini seçip onayladığında:
  1. Seçilen tasarım mekana **kalıcı olarak sabitlenir**.
  2. Alt tasarım seçici çubuğu kapanır.
  3. "Tasarımı Değiştir" gibi yapay butonlar kaldırılmıştır; o mobilya için seçim hakkı sona erer.
  4. Mekanın üzerindeki çekiç balonu kaybolur ve mekan temiz, bitmiş haliyle kalır.

### 4. 🎨 3 Farklı Tasarım ve Renk Seçeneği (44 Özel Üretilmiş Görsel)
- Alt çubukta açılan her seçenekte sadece o mobilyaya odaklanmış yüksek çözünürlüklü görseller sunulur (`assets/designs/{id}_opt_a.jpg`, `_opt_b.jpg`, `_opt_c.jpg`).
- Seçenekler arasında yalnızca ufak tonlama değil, belirgin materyal ve renk ayrımları bulunur:
  - **Seçenek A:** Beyaz İtalyan Carrara Mermeri / Fildişi & 24K Altın Detaylar
  - **Seçenek B:** Bordo / Kraliyet Yakut Kırmızısı & Siyah Nero Marquina Mermeri
  - **Seçenek C:** Akdeniz Turkuaz Mozaik & Zümrüt Yeşili Riviera Dokusu

### 5. 📜 Sıralı Görev Sistemi (`#tasks`)
- 5x5 Birleştirme masasındaki görevler Gossip Harbor sisteminde sıralı hale getirildi:
  - Aynı anda yalnızca **1 Aktif Görev** açık kalır.
  - Önceki görevler "TAMAMLANDI", sıradaki görev "AKTİF", sonraki görevler ise "KİLİTLİ" olarak listelenir.
  - Birleştirme masasından kazanılan altın ve ödüller doğrudan sıradaki mobilyanın maliyetine aktarılır.

### 6. 📱 Mobil ve Tablet UI Deneyimi
- 4 alt ana sekme (Birleştir, Otel, Hikaye, Prestij), dokunmatik kaydırma (Pan & Zoom) ve tam ekran mobil uyumluluk optimize edildi.
- Arayüzdeki eski "Lv.1-4" ibareleri temizlenip Gossip Harbor'ın "11 Sıralı Mobilya Kurulumu" terminolojisiyle güncellendi.

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
