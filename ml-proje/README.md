# VardiyaWatt ML

## Kısa vadeli endüstriyel enerji tahmininde model karşılaştırması

Hazırlayan: Görkem Vatansever.

UCI Steel Industry Energy Consumption verisiyle sonraki 15 dakikalık dönemin tüketimi tahmin edilir. Son ölçüm referansı, StandardScaler + LinearRegression ve RandomForestRegressor karşılaştırılır. Random Forest hiperparametrelerini yalnız kronolojik validation kümesindeki MAE belirler. Son %20 test kümesi model ayarına dahil edilmez.

## Dosyalar

- `VardiyaWatt_ML.ipynb`: Türkçe açıklamalı, çıktıları bulunan Colab uyumlu not defteri.
- `train.py`: Veri edinme, analiz, kronolojik doğrulama ve değerlendirme kodu.
- `requirements.txt`: Kullanılan Python bağımlılıkları.
- `sonuclar.json`: Hesaplanan model metrikleri ve veri özeti.
- `VardiyaWatt_ML_Rapor.pdf`: Beş sayfalık teslim raporu.

## Çalıştırma

```bash
python -m pip install -r requirements.txt
python train.py
```

Veri bulunamazsa resmi UCI kaynağından otomatik indirilir. GPU gerekmez. Çıktılar `ciktilar` klasörüne kaydedilir.

## Veri kaynağı

V E, S., Shin, C., & Cho, Y. (2021). Steel Industry Energy Consumption [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52G8C

Lisans: CC BY 4.0. Kaynak: https://archive.ics.uci.edu/dataset/851/steel+industry+energy+consumption

Uyarlama: gece yarısı zaman düzeltmesi, geçmiş tüketim özellikleri ve regresyon hedefi. Rapor, test metrikleri ve hata analizi doğrudan çalıştırılan koddan üretilir.
