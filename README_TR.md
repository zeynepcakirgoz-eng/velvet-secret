# Velvet Secrets — Android prototipi

Bu paket, Android uygulamasına dönüştürülebilecek çalışan bir oyun prototipinin kaynak dosyalarını içerir. Henüz imzalanmış bir APK değildir; Android Studio ile derlenmesi gerekir.

## Özellikler
- 500 başlangıç enerjisi, 60 saniyede 1 enerji (500 üst sınır)
- Enerji, prestij ve mücevher kaynakları
- Aynı seviyedeki aynı tür objeleri birleştirme
- Sipariş ve görev ödülleri
- Isabella ve Adrian hikâye seçimi
- İlerlemeyi cihazda tarayıcı depolamasında saklama
- Android geri tuşu için web görünümü uyumlu sade arayüz

## Gerekenler
- Bilgisayar (Windows, macOS veya Linux)
- Node.js LTS
- Android Studio ve Android SDK
- Android telefon ve USB kablosu (isteğe bağlı; emülatör de olur)

## Android APK oluşturma

1. ZIP dosyasını bilgisayara çıkar.
2. Proje klasöründe terminal/komut istemcisi aç.
3. Şunları çalıştır:

   ```bash
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```

4. Android Studio açıldığında Gradle eşitlemesinin bitmesini bekle.
5. Telefonu USB ile bağla ve telefonda Geliştirici seçenekleri > USB hata ayıklama seçeneğini aç; veya Android Studio'da bir emülatör başlat.
6. Test etmek için Android Studio'daki **Run ▶** düğmesine bas.
7. APK üretmek için **Build > Build Bundle(s) / APK(s) > Build APK(s)** yolunu kullan.
8. Android Studio, oluşturulan APK'nın yolunu bildirir. APK'yı telefona aktar ve yükle. Bilinmeyen uygulama yükleme izni gerekebilir.

## Önemli
- Bu proje imzalı bir mağaza sürümü değildir. Google Play'e yayınlamak için paket adı, imzalama anahtarı, gizlilik metni, mağaza görselleri ve testler gerekir.
- Görseller şu an emoji tabanlı prototip varlıklarıdır. Gerçekçi karakter portreleri, animasyonlar, sesler ve profesyonel çizimler sonraki aşamada eklenebilir.
- Bu prototipte satın alma veya gerçek para işlemi yoktur.
- İlerleme aynı cihazdaki uygulama verilerinde tutulur. Uygulama verilerini silmek ilerlemeyi silebilir.
