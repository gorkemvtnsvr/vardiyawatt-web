# VardiyaWatt ML — Teslim ve ister kontrolü

Hazırlayan: Görkem Vatansever

## Teslim

Teslim edilecek ana dosya: **VardiyaWatt_ML_Rapor.pdf** (5 sayfa).
Word dosyası düzenlenebilir kopyadır. Kod bağlantısı raporun son sayfasında bulunur.
Notebook, tüm kod hücreleri çalıştırılmış ve grafik çıktıları kaydedilmiş olarak sunulur.

Kod: https://github.com/gorkemvtnsvr/vardiyawatt-web/tree/main/ml-proje

## Zorunlu adımlar

| Yönerge | Karşılığı | Rapor sayfası |
|---|---|---|
| 3.1 Problem tanımı | Girdi, çıktı, kullanım ihtiyacı; dört cümle | 1 |
| 3.2 Veri seti | UCI kaynağı, lisans, 35.040 kayıt, değişkenler ve hedef | 1 |
| 3.3 Veri keşfi | Dağılım, saat ortalaması, gecikme ilişkisi; yorumları | 2 |
| 3.4 Ön işleme | Eksik/tekrar kontrolü, zaman düzeltmesi, aykırı değer, encoding, scaling, kronolojik ayrım | 3 |
| 3.5 Model seçimi | Son ölçüm referansı, doğrusal regresyon, Random Forest; gerekçeler ve parametreler | 3 |
| 3.6 Eğitim | Eğitim/validation/test, dört ayarın validation karşılaştırması, son yeniden eğitim | 3 |
| 3.7 Değerlendirme | Aynı test kümesinde MAE, MSE, RMSE, R²; tablo ve grafikler | 4 |
| 3.8 Yorumlama | Koşula göre hata, en büyük beş hata, güçlü/zayıf yön, sınırlılıklar ve iyileştirmeler | 5 |
| Kod bağlantısı | Erişilebilir GitHub klasörü; çalıştırılmış notebook ve Python betiği | 5 |

## Yeniden üretme

1. `python -m pip install -r requirements.txt`
2. `python train.py`

CSV mevcut değilse resmi UCI ZIP kaynağından otomatik indirilir. GPU gerekmez.
Yerel CSV olarak `Steel_industry_data.csv` kullanılabilir. Notebook Colab ile uyumludur.
Kod ve notebook aynı rastgelelik tohumu (42) ve aynı zaman sırası ayrımıyla doğrulandı.

## Sonuç ve sınır

Random Forest test MAE: 4,09 kWh; RMSE: 8,64 kWh; R²: 0,924.
Son ölçüm referansına göre MAE azalması yaklaşık %24,9'dur.
Bu ölçüm 15 dakikalık, her yeni gerçek ölçümle yenilenen tahmin içindir.
Gerçek işletme tasarrufu ölçülmedi; farklı tesislere genelleme iddiası yoktur.
Bu bir makine öğrenmesi regresyon projesidir; yönerge ML veya DL seçimine izin verir.
