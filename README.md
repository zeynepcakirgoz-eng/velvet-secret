# 🏨 Velvet Secrets — Lüks Birleştirme (Merge), Hikâye & 3D Otel Simülatörü

**Velvet Secrets**, Monako'daki efsanevi **Aurelia Palace Hotel**'in varisi **Isabella Laurent**'in gizemli hikâyesini, lüks obje birleştirme (*Gossip Harbor* tarzı Merge mekaniği) ve **tamamen gezilebilir 3D Otel Restorasyon Simülatörü** ile birleştiren Android (Telefon & Tablet) oyunudur.

---

## 📲 Doğrudan Android APK İndirme (`v3.0.0` — `81.66 MB`)
- **Doğrudan APK İndir (GitHub Repo):** [`VelvetSecrets-debug.apk`](https://github.com/zeynepcakirgoz-eng/velvet-secret/raw/main/VelvetSecrets-debug.apk)
- **GitHub Releases APK İndir:** [`VelvetSecrets-debug.apk (v3.0.0 Release)`](https://github.com/zeynepcakirgoz-eng/velvet-secret/releases/download/v1.0.0-demo/VelvetSecrets-debug.apk)

---

## 📦 Son Sürüm: `v3.0.0` — El Çizimi Lüks Eşya Seti, Önce Boş/Kirli Başlayan 85+ Eşyalı 3D Lobi Tadilatı, 5 Müşteri Siparişi, Obje Evrim Ağacı & 3D Hazine Sandığı

### 🌟 Sürüm Geçmişi ve Versiyon Açıklamaları (Türkçe)

#### 🔹 Versiyon `v3.0.0` (Güncel Sürüm) — *El Çizimi Lüks Eşya Seti, 85+ 3D Eşyalı Lobi Restorasyonu, Canlı Etkinlikler & 3D Sandık*
- **El Çizimi Yarı-Gerçekçi Lüks Eşya Seti (`www/assets/props/` & `www/assets/items/`):**
  - **Gül (Rose)**, **Altın İşlemeli Kadeh (Chalice)**, **Kraliyet Tacı (Crown/Tiara)**, **Püsküllü 'M' Otel Odası Anahtarı (Hotel Room Key)** ve **Kristal/Kadife Mücevher Kutusu (Luxury Box)** referans görselleriyle hazırlanan 4 ana evrim zinciri (Seviye 1 ➔ Seviye 5 MAKS) ve 1 dinamik etkinlik zinciri.
  - Maksimum Seviye (`Lv.5 🔒 MAKS`) birleşme kilidi ve aktif müşteri siparişlerinde talep edilen objeler için tahta üzerinde yeşil `✓ SİPARİŞ` ışıması.
  - **Obje Evrim Bilgi Paneli (Merge Tree / Recipe Tooltip):** Herhangi bir objeye dokunulduğunda Seviye 1'den Seviye 5'e kadar görsel üretim ağacını adım adım gösteren bilgi kartı.
- **Önce Boş ve Kirli Başlayan ➔ Tadilat Yaptıkça Lüksleşen 85+ Eşyalı 3D Büyük Lobi (`www/js/hotel3d.js`):**
  - Tadilat öncesi tozlu/lekeli çatlak beton zemin, boya kovaları, merdiven ve karton kutular; 6 aşamalı tadilat ilerledikçe cilalı damarlı mermer zemin, sıcak gizli LED tavan havuzu, 4 kademeli ışıklı halka avize, sol cephe mermer-ceviz resepsiyon bankosu (3 iMac, 2 masa lambası, ışıklı 'M' logosu, 16+ objeli raflar), sağ panoramik cam önünde iki ayrı lüks lounge oturma grubu, tropikal Areca palmiyeleri ve arkada 14 basamaklı yüzer merdiven + 2. kat cam korkuluklu asma kat (mezzanine).
  - **UI ve 3D Sahne 1:1 Senkronizasyonu:** Alt tasarım seçicideki önizleme kartları (`getExact3DOptionThumbnail`) doğrudan Three.js 3D modelinden render edilir ve 3 seçenek (`opt_a`, `opt_b`, `opt_c`) birbirinden tamamen farklı geometrilere sahiptir.
- **5 Aktif Müşteri Siparişi, Obje Mağazası, Elmas Zaman Atlama & 3D Sandık Açılış Animasyonu:**
  - Aynı anda 5 VIP müşteri siparişi, 5/5 set tamamlandığında Nadir Obje + Three.js 3D Hazine Sandığı açılış animasyonu, Obje Mağazası (`🛍️ Mağaza`), 24 saatlik Şans Çarkı sayacı ve Merkezi Canlı Etkinlik / Tema Yöneticisi (`🎭 Etkinlik` — Cadılar Bayramı, Sevgililer Günü, Kış Galası).

---

#### 🔹 Versiyon `v2.4.0` — *Görsel Bütünlük, Foto-Gerçekçi Görevler, 3D Kazanımlar & Mobil/Tablet Uyumluluğu*
- **Konuyla Birebir Uyumlu Foto-Gerçekçi Görev Kartları (`#tasks`):**
  - Görevlerdeki tekrarlayan veya konuyla ilgisiz arka planlar tamamen kaldırıldı.
  - Her göreve kendi konusuyla örtüşen, yazı/buton içermeyen 16:9 HD foto-gerçekçi arka plan sahnesi ve özel konu ikonu eklendi:
    1. *Akdeniz Gül Bahçesi & Parfüm Atölyesi* (`scene_garden_terrace.jpg`)
    2. *Riviera Gala & VIP Konuk Servisi* (`scene_restaurant_bar.jpg`)
    3. *Aurelia Palace 3D Mimari Restorasyonu* (`scene_lobby_reception.jpg`)
    4. *Penthouse Kraliyet Koleksiyonu Sentezi* (`scene_penthouse_piano.jpg`)
    5. *Termal Spa & Kraliyet Sandığı Üretimi* (`scene_spa_wellness.jpg`)
  - Görevler tamamlandıkça kilitlenmek yerine **Aşama 1 ➔ Aşama 2 ➔ Aşama 3** şeklinde artan hedefler ve büyüyen ödüllerle devam eder.
- **3D Boyamalı Lüks Kazanım İkonları (`www/assets/rewards/`) & Büyük Kraliyet Sandığı:**
  - Zayıf emoji ödüller yerine yüksek çözünürlüklü 3D boyamalı ödül ikonları eklendi: **Altın Enerji Şimşeği** (`reward_energy.jpg`), **24K Prestij Sikkeleri** (`reward_prestige.jpg`), **Safir Elmas Kümesi** (`reward_gems.jpg`), **5 Köşeli Restorasyon Yıldızı** (`reward_star.jpg`), **VIP Kraliyet Hazine Sandığı** (`reward_chest.jpg`) ve **Kraliyet Üretim Sandığı** (`reward_spawner.jpg`).
  - Her 3 görev tamamlandığında açılan **Büyük Kraliyet Hazine Sandığı Vitrini** (`+$750 Prestij`, `+120 Enerji`, `+10 Elmas`, `+2 Yıldız`) eklendi.
- **Tamamlanmış 3D Otel Mimarisi (`www/js/hotel3d.js`):**
  - Siyah boşluk yerine **360° Akdeniz Gün Batımı Gökyüzü Kubbesi** ve parıldayan deniz yüzeyi eklendi.
  - Oda tavanları, altın kornişler, duvar aplikleri, 3D palmiye ağaçları, **Zen Spa Mermer Pavyonu** ve **Botanik Bahçe Avlusu** inşa edildi.
  - **11 restorasyon alanının tamamına** Seviye 1 (başlangıç durumu) ve Seviye 2–4 (`Seçenek 1`, `Seçenek 2`, `Seçenek 3`) için çok parçalı, detaylı 3D mobilya modelleri eklendi.
- **Android Cep Telefonu & Tablet Arayüz (UI/UX) Optimizasyonu:**
  - 3D sahnenin alt yarısını kapatan yakınlık bilgi kartı (`#renovationProximityPanel`), 3D ekranın hemen altına bağımsız konsol olarak taşındı; böylece mobilde yürürken görüş alanı hiç kapanmaz.
  - 3D sahnede ekranın herhangi bir yerine dokunup parmak kaydırarak 360° kamera döndürme desteği eklendi.
  - Tabletler (`768px–1200px+`) için 2 sütunlu otomatik galeri ızgarası eklendi.

---

#### 🔹 Versiyon `v2.2.0` — *4 Seviyeli Bağımsız Restorasyon Sistemi & Yüksek Çözünürlüklü Obje İllüstrasyonları*
- **11 Otel Alanında Bağımsız 4 Seviye (`Seviye 1 ➔ Seviye 2 ➔ Seviye 3 ➔ Seviye 4`):**
  - Bir alanı yükselttiğinizde diğer alanlar otomatik yükselmez; her alan kendi maliyet ve tasarım seçimiyle bağımsız olarak Seviye 1'den Seviye 4'e geliştirilir.
- **18 Benzersiz Lüks Birleştirme Objesi (`www/assets/items/`):**
  - *Kraliyet Gülleri & Parfümeri*, *Couture & Mücevherat* ve *Riviera Gala & Gurme* zincirlerindeki 18 objenin tamamına özel boyamalı illüstrasyonlar eklendi.
- **Birleştirme Masasında (Sayfa 1) Otel Restorasyon Galerisi Alanını Kaldırma:**
  - Otel alanları yalnızca **3D Otel (Sayfa 2)** sekmesinde yer alır; Masa sekmesi tamamen birleştirme, müşteri siparişleri ve görevlere odaklanır.

---

#### 🔹 Versiyon `v2.0.0` — *Görünür Restorasyon Maliyetleri, Çift Gelir Sistemi & Kilitli Tasarım Seçenekleri*
- **Başlangıçtan İtibaren Görünür Maliyetler (`📋 Tüm Maliyetler` & `💼 Kasa Defteri`):**
  - Oyuncu henüz para biriktirmeden önce bile 11 alanın tamamının Seviye 2, Seviye 3 ve Seviye 4 maliyetlerini, mevcut bakiyesini ve gereken farkı açıkça görebilir.
- **Birleşik Çift Gelir Kasası (`www/js/economy.js`):**
  - **1. Gelir Kaynağı:** Birleştirme masasındaki müşteri siparişlerini teslim ederek kazanılan ödüller.
  - **2. Gelir Kaynağı:** Yenilenen otel odalarından dakikada biriken pasif otel geliri (`+$45/dk` ve üzeri).
  - Her iki gelir kaynağı tek bir ortak kasada (`GameEconomy`) birleşir ve işlem geçmişi **Kasa Defteri** modalında listelenir.
- **Kilitli 3 Tasarım Seçeneği & Otomatik Bütçe Bildirimi:**
  - Yeterli para yokken 3 tasarım seçeneği (`Klasik Riviera`, `Modern Monako`, `Kraliyet Sarayı`) kilitli önizleme olarak görünür; bütçe tamamlandığında otomatik bildirim çıkar ve 3 tasarımın kilidi açılır.

---

#### 🔹 Versiyon `v1.5.0` — *3D Gezilebilir Otel Simülatörü (Three.js WebGL)*
- Birinci şahıs (FPS) kamera, sanal mobil joystick, WASD/Ok tuşları, çarpışma algılama (duvar ve mobilya sınırları), radar minimap ve 2. Kat Penthouse'a çıkan interaktif asansör eklendi.
- Bağlantılı otel mimarisi: Büyük Lobi & Resepsiyon, Koridor & Deluxe Suit 101, Riviera Restoran & Şampanya Barı, Sonsuzluk Havuzu, Zen Spa, Botanik Bahçe ve 2. Kat Başkanlık Penthouse Suiti.

---

#### 🔹 Versiyon `v1.0.0` — *Temel Birleştirme (Merge), VIP Siparişler, Hikâye & Şans Çarkı*
- 5x5 sürükle-bırak birleştirme tahtası, 500 maksimum enerji sistemi, 4 ana karakter (*Isabella Laurent, Adrian Vale, Leon Marchand, Serena Black*), interaktif hikâye seçimleri, günlük Şans Çarkı ve ödüllü VIP reklam simülasyonu.

---

## 📲 Android APK Kurulumu
1. GitHub **Releases** sayfasından veya proje dizinindeki `VelvetSecrets-debug.apk` dosyasını Android telefonunuza ya da tabletinize indirin.
2. Dosyaya dokunarak **Yükle** seçeneğini onaylayın.
3. Bilinmeyen kaynaklardan uygulama yükleme izni istenirse onay verin ve oyuna başlayın!
