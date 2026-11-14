"""UCI kaynak CSV'sinden tarayıcı modelini yeniden üretir. Web kullanımı için gerekmez."""
from pathlib import Path
import hashlib
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'public/data/steel-industry.csv'
raw = pd.read_csv(source)
time = pd.to_datetime(raw['date'], format='%d/%m/%Y %H:%M')
# Kaynağın 23:45 sonrasındaki 00:00 kaydı izleyen gece yarısıdır.
time += pd.to_timedelta(raw['NSM'].eq(0).astype(int), unit='D')
raw.index = pd.DatetimeIndex(time)
assert raw.index.to_series().diff().dropna().eq(pd.Timedelta(minutes=15)).all()
data = pd.DataFrame(index=raw.index)
for lag in [1, 4, 96]:
    data[f'lag_{lag}'] = raw['Usage_kWh'].shift(lag)
hour = raw.index.hour + raw.index.minute / 60
data['hour_sin'] = np.sin(2 * np.pi * hour / 24)
data['hour_cos'] = np.cos(2 * np.pi * hour / 24)
data['weekend'] = (raw.index.dayofweek >= 5).astype(int)
data['target_kwh'] = raw['Usage_kWh']
data = data.dropna()
X, y = data.drop(columns='target_kwh'), data['target_kwh']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.2, shuffle=False)
model = LinearRegression().fit(X_train, y_train)
predictions = np.maximum(model.predict(X_test), 0)
baseline = X_test['lag_1'].to_numpy()

def score(truth, prediction):
    return {'MAE_kWh':float(mean_absolute_error(truth,prediction)),
            'RMSE_kWh':float(np.sqrt(mean_squared_error(truth,prediction))),
            'R2':float(r2_score(truth,prediction))}

payload = {'name':'LinearRegression','features':X.columns.tolist(),
           'intercept':float(model.intercept_),'coefficients':model.coef_.tolist(),
           'trainingRange':{k:{'min':float(X_train[k].min()),'max':float(X_train[k].max())}
                            for k in ['lag_1','lag_4','lag_96']},
           'metrics':{'Doğrusal regresyon':score(y_test,predictions),
                      'Son ölçüm referansı':score(y_test,baseline)},
           'trainRows':len(X_train),'testRows':len(X_test),'rawRows':len(raw),
           'sourceDoi':'10.24432/C52G8C','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest()}
text = json.dumps(payload,ensure_ascii=False,indent=2)
for dest in [ROOT/'src/data/model.json', ROOT/'public/data/model.json']:
    dest.write_text(text,encoding='utf-8')
sample={'actual':y_test.iloc[:192].to_list(),'prediction':predictions[:192].tolist(),
        'baseline':baseline[:192].tolist(),'start':str(X_test.index[0]),'intervalMinutes':15}
(ROOT/'src/data/test-sample.json').write_text(json.dumps(sample),encoding='utf-8')
print(json.dumps(payload['metrics'],ensure_ascii=False,indent=2))
