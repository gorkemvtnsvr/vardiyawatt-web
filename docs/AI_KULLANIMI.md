# Yapay zeka destekli geliştirme kaydı

Asistan: ChatGPT / Codex. Aşağıdaki istemler bu projede yürütülen görevlerin yeniden kullanılabilir kısa özetleridir.

## Planlama istemi

"VardiyaWatt enerji tahminini React + Vite ile tarayıcıda çalışan bir uygulamaya dönüştür. Ekranları, bileşenleri, senaryo veri modelini ve LocalStorage akışını planla. Model ile son ölçüm referansını birlikte göster."

Karar: Dört ekran ve tek bir merkezi senaryo durumu. Form sonucu yalnız hesaplama sonrasında yenilenir. Kullanıcı değişiklik yaptıysa eski sonucu kaydetmek engellenir.

## Bileşen geliştirme istemi

"Girdi doğrulaması olan tüketim formu, 24/48 saat seçilebilen gerçek test grafiği ve kaydedilen senaryolar için arama/filtre destekli tablo oluştur."

Doğrulama: Üç örnek senaryonun sonuçları Python çıktılarıyla eşleştirildi. Grafik sabit test verisi olarak etiketlendi. Negatif ve eksik girdi, hatalı tarih ve geçersiz dönem sınırı reddedildi.

## Hata ayıklama istemi

"LocalStorage kaydını ve CSV dışa aktarmayı incele. Bozuk JSON, tarayıcı kayıt kısıtı ve Excel'de formül olarak yorumlanan serbest metin için davranışı düzelt."

Doğrulama: Yenileme sonrası kayıt korunması tarayıcıda denendi. CSV indirme gerçekleşti. Özel karakter kaçışı ve formül başlangıcının etkisizleştirilmesi otomatik testte kontrol edildi.

## Stil istemi

"Sade yeşil tonlar, açık zemin ve okunur bir tahmin formuyla masaüstü ve telefona uyarlanan CSS yaz. Klavye odağını, hata mesajlarını ve boş durumu tasarla."

Doğrulama: Masaüstü ekran görüntüsü alındı. CSS içinde 1190, 960 ve 700 piksel kırılımları tanımlandı. Mobil cihazda ayrıca kontrol önerilir; fiziksel cihaz testi yapılmış olduğu iddia edilmez.

## Dokümantasyon istemi

"Gerçek teknoloji sürümleri, kurulum komutları, veri lisansı ve yapay zeka katkılarını anlatan README hazırla. Modeli referanstan daha başarılı gibi sunma."

Doğrulama: README metrikleri eğitilmiş modelin sonuçlarıyla eşleştirildi. Canlı sayaç veya ölçülmüş tasarruf iddiası eklenmedi.
