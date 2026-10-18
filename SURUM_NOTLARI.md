# 🏨 Velvet Secrets — Türkçe Sürüm Notları ve Değişiklik Günlüğü (Changelog)

Bu dosya, **Velvet Secrets (Aurelia Palace Hotel)** Android oyununun tüm versiyon güncellemelerini ve eklenen özellikleri Türkçe olarak detaylandırır.

---

## 🚀 Sürüm `v2.4.0` (18 Ekim 2026) — *Foto-Gerçekçi Görevler, 3D Boyamalı Kazanımlar, Tam 3D Mimari & Mobil/Tablet UI*
### 1. Konuyla Birebir Uyumlu Foto-Gerçekçi Görev ve Hikâye Sahneleri
- Görevlerde (`#tasks`) ve hikâye bölümlerinde (`#pageStory`) yer alan eski kırpılmış, üzerinde yazı bulunan veya tekrarlayan görseller tamamen temizlendi.
- **5 Aşamalı Kraliyet Görevi** eklendi; her görevin arka planı ve ikonu görevde anlatılan konuyla birebir uyumludur:
  1. **Akdeniz Gül Bahçesi & Parfüm Atölyesi:** `assets/scene_garden_terrace.jpg`
  2. **Riviera Gala & VIP Konuk Servisi:** `assets/scene_restaurant_bar.jpg`
  3. **Aurelia Palace 3D Mimari Restorasyonu:** `assets/scene_lobby_reception.jpg`
  4. **Penthouse Kraliyet Koleksiyonu Sentezi:** `assets/scene_penthouse_piano.jpg`
  5. **Termal Spa & Kraliyet Sandığı Üretimi:** `assets/scene_spa_wellness.jpg`
- **11 Otel Alanına 11 Benzersiz HD Mimari Sahne:** Lobi Resepsiyon, Bohemya Avizesi, Kraliyet Halıları, Riviera Restoran, Şampanya Barı, Deluxe Suit 101, Panoramik Suit Terası, Sonsuzluk Havuzu, Zen Termal Spa, Botanik Bahçe ve 2. Kat Penthouse Piyano Salonu artık tamamen kendine özgü foto-gerçekçi görsellere sahiptir.

### 2. Zenginleştirilmiş Kazanım (`Kazanımlar`) Görselleri ve Büyük Kraliyet Sandığı
- Görevler, müşteri siparişleri, üst ekonomi çubuğu, üretim sandığı, hikâye bölümleri ve şans çarkındaki tüm ödüller için **yüksek çözünürlüklü 3D boyamalı ikonlar (`www/assets/rewards/`)** üretildi:
  - `reward_energy.jpg` *(Kanatlı Altın Enerji Şimşeği)*
  - `reward_prestige.jpg` *(24K Aurelia Kraliyet Altın Sikke Yığını)*
  - `reward_gems.jpg` *(Safir ve Pırlanta Kümesi)*
  - `reward_star.jpg` *(5 Köşeli Altın Restorasyon Yıldızı)*
  - `reward_chest.jpg` *(Kırmızı Kadife & Altın VIP Hazine Sandığı)*
  - `reward_spawner.jpg` *(Kraliyet Üretim Sandığı)*
- **Büyük Kraliyet Hazine Sandığı (`#questChestHeader`):** Her 3 görev tamamlandığında açılan ve `+$750 Prestij`, `+120 Enerji`, `+10 Elmas`, `+2 Yıldız` kazandıran görsel sandık vitrini eklendi.

### 3. 3D Otel Mimarisi ve Çok Parçalı Mobilya Modelleri (`www/js/hotel3d.js`)
- **360° Akdeniz Gün Batımı Gökyüzü Kubbesi & Deniz:** Karanlık gökyüzü yerine 360° gün batımı gökyüzü ve parıldayan deniz yüzeyi eklendi.
- **Tavanlar, Altın Kornişler, Zen Spa Pavyonu ve Botanik Bahçe:** Tüm iç odalara tavan ve altın kornişler, duvar aplikleri, 3D palmiye ağaçları ve dış teras pavyonları eklendi.
- **Seviye 1–4 Tam 3D Mobilyalar:** 11 alanın tamamı hem Seviye 1'de (başlangıç durumu) hem de Seviye 2–4'teki 3 farklı tasarım seçeneğinde (`Seçenek 1`, `Seçenek 2`, `Seçenek 3`) çok parçalı 3D modellerle görünür.

### 4. Android Telefon ve Tablet Arayüz (UI/UX) İyileştirmeleri
- **3D Ekranı Kapatmayan Yakınlık Konsolu:** `#renovationProximityPanel`, 3D sahnenin içinden çıkarılarak hemen altına yerleştirildi; böylece mobilde yürürken görüş alanı kapanmaz.
- **Tam Ekran Dokunmatik Bakış:** 3D sahnenin herhangi bir yerine parmakla dokunup kaydırarak kamerayı döndürme desteği eklendi.
- **Tablet & Geniş Ekran Desteği (`@media (min-width: 680px)`):** Tabletlerde Görevler, Otel Alanları ve Hikâye Bölümleri 2 sütunlu galeri görünümüne geçer.

---

## 🛠️ Sürüm `v2.2.0` — *4 Seviyeli Bağımsız Restorasyon & HD Obje İllüstrasyonları*
- 11 otel alanının her biri için bağımsız **Seviye 1 ➔ Seviye 2 ➔ Seviye 3 ➔ Seviye 4** yükseltme sistemi kuruldu.
- 5x5 birleştirme tahtasındaki 3 zincirde yer alan **18 objenin tamamına** yüksek çözünürlüklü boyamalı lüks illüstrasyonlar (`www/assets/items/item_0_1.jpg` – `item_2_6.jpg`) eklendi.
- Birleştirme masası sayfasından otel alanı kartları kaldırılarak yalnızca 3D Otel sekmesinde gösterilmesi sağlandı.

---

## 💰 Sürüm `v2.0.0` — *Görünür Maliyetler, Çift Gelir Sistemi & Kilitli Tasarımlar*
- **Başlangıçtan İtibaren Görünür Maliyetler:** `📋 Tüm Maliyetler` ve `💼 Kasa Defteri` ekranlarında tüm 11 alanın Seviye 2–4 maliyetleri, mevcut kasa bakiyesi ve eksik tutar başlangıçtan itibaren açıkça gösterilir.
- **Birleşik Çift Gelir Sistemi (`GameEconomy`):** Müşteri siparişi gelirleri ile 3D otel pasif gelirleri (`+$45/dk` ve üzeri) tek bir ortak kasada birleştirildi.
- **Kilitli 3 Tasarım Seçeneği & Bütçe Bildirimi:** Bütçe yetersizken 3 tasarım seçeneği kilitli önizleme olarak gösterilir; yeterli para biriktiğinde otomatik bildirimle kilidi açılır.

---

## 🏛️ Sürüm `v1.5.0` — *3D Gezilebilir Otel Simülatörü*
- Three.js tabanlı birinci şahıs 3D yürüyüş, sanal mobil joystick, çarpışma kontrolü, radar minimap ve 2. Kat Penthouse asansörü eklendi.

---

## ✨ Sürüm `v1.0.0` — *İlk Prototip*
- 5x5 birleştirme tahtası, müşteri siparişleri, enerji sayacı, hikâye seçimleri ve Şans Çarkı oluşturuldu.
