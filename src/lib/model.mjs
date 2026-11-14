// Python'da eğitilen doğrusal modelin tarayıcıdaki eşdeğeri. Ağ isteği/API anahtarı yoktur.
export function numberValue(value) {
  if (String(value).trim() === '') throw new Error('Tüm tüketim alanlarını doldurun.');
  const n = Number(String(value).trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) throw new Error('Sıfır veya daha büyük, geçerli sayılar girin.');
  return n;
}

export function featuresFor(input) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(input.time);
  if (!match) throw new Error('Geçerli bir hedef tarih ve saat seçin.');
  const [, yy, mo, dd, hh, mm] = match.map(Number);
  const date = new Date(Date.UTC(yy, mo - 1, dd, hh, mm));
  if (yy < 1900 || yy > 2100 || date.getUTCFullYear() !== yy || date.getUTCMonth() !== mo - 1 ||
      date.getUTCDate() !== dd || hh > 23 || mm > 59 || mm % 15 !== 0) {
    throw new Error('Tarih geçerli olmalı. Dakika için 00, 15, 30 veya 45 seçin.');
  }
  const hour = hh + mm / 60;
  return [numberValue(input.last), numberValue(input.hour), numberValue(input.day),
    Math.sin(2 * Math.PI * hour / 24), Math.cos(2 * Math.PI * hour / 24),
    Number(date.getUTCDay() === 0 || date.getUTCDay() === 6)];
}

export function predict(input, model) {
  const features = featuresFor(input);
  const budget = numberValue(input.budget);
  if (budget === 0) throw new Error('Enerji bütçesi sıfırdan büyük olmalı.');
  const prediction = Math.max(0, model.intercept + model.coefficients.reduce((sum, coefficient, i) => sum + coefficient * features[i], 0));
  const outside = ['lag_1', 'lag_4', 'lag_96'].some((name, i) => features[i] < model.trainingRange[name].min || features[i] > model.trainingRange[name].max);
  return { prediction, baseline: features[0], budget, remaining: budget - prediction,
    overBudget: prediction >= budget, outside, input: { time: input.time, last: features[0], hour: features[1], day: features[2], budget } };
}

export const PRESETS = [
  { name: 'Düşük tüketim', short: 'Düşük', time: '2019-01-02T02:00', last: 4, hour: 4.5, day: 5, budget: 50 },
  { name: 'Orta tüketim', short: 'Orta', time: '2019-01-02T10:00', last: 45, hour: 40, day: 42, budget: 50 },
  { name: 'Yüksek tüketim', short: 'Yüksek', time: '2019-01-02T14:00', last: 90, hour: 85, day: 88, budget: 50 },
];

export const format = (n, digits = 2) => new Intl.NumberFormat('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
export function formatTime(value) {
  const [day, hour] = value.split('T');
  return `${day.split('-').reverse().join('.')} ${hour}`;
}

export function readRecords(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (parsed.version !== 1 || !Array.isArray(parsed.scenarios)) throw new Error('Kayıt biçimi okunamadı.');
  if (parsed.scenarios.length > 100) throw new Error('Kayıt sınırı aşıldı.');
  return parsed.scenarios.filter(r => r && typeof r.id === 'string' && typeof r.name === 'string' &&
    r.name.length <= 80 && r.input && typeof r.input.time === 'string' &&
    ['last', 'hour', 'day', 'budget'].every(k => typeof r.input[k] === 'number' && Number.isFinite(r.input[k]) && r.input[k] >= 0));
}

export function recordsCsv(records, model) {
  // Excel/Sheets formül olarak yorumlamasın. İsim gibi serbest metni güvenle dışa aktar.
  const cell = value => `"${String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  const lines = [['Senaryo', 'Hedef zaman', 'Son 15 dk kWh', '1 saat önce kWh', '24 saat önce kWh', 'Model kWh', 'Referans kWh', 'Bütçe kWh', 'Durum']];
  for (const record of records) {
    const result = predict(record.input, model);
    lines.push([record.name, record.input.time, result.input.last, result.input.hour, result.input.day,
      result.prediction.toFixed(4), result.baseline, result.budget, result.overBudget ? 'Bütçe aşımı' : 'Bütçe altında']);
  }
  return '\uFEFF' + lines.map(row => row.map(cell).join(';')).join('\r\n');
}
