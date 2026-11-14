import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { predict, PRESETS, featuresFor, recordsCsv, readRecords } from '../src/lib/model.mjs';
const model=JSON.parse(readFileSync(new URL('../src/data/model.json',import.meta.url)));

test('Python notebookundaki üç örnekle aynı tahminleri üretir',()=>{
  for(const [i,expected] of [4.96,46.51,87.86].entries()) assert.equal(Number(predict(PRESETS[i],model).prediction.toFixed(2)),expected);
});
test('Bütçe durumunu doğru belirler',()=>{
  assert.equal(predict(PRESETS[0],model).overBudget,false);
  assert.equal(predict(PRESETS[2],model).overBudget,true);
  assert.equal(predict({...PRESETS[1],budget:predict(PRESETS[1],model).prediction},model).overBudget,true);
});
test('Saat diliminden bağımsız hafta sonu özelliklerini hesaplar',()=>{
  assert.equal(featuresFor({...PRESETS[0],time:'2019-01-05T10:00'})[5],1);
  assert.equal(featuresFor(PRESETS[0])[5],0);
});
test('Geçersiz tarih ve dönem sınırını reddeder',()=>{
  for(const time of ['2019-02-30T10:00','2019-01-02T10:07','not-a-date','2019-13-01T10:00']) assert.throws(()=>predict({...PRESETS[0],time},model));
});
test('Eksik, negatif ve sonsuz girdiyi reddeder; Türkçe ondalık kabul eder',()=>{
  for(const last of ['',-1,'Infinity','NaN']) assert.throws(()=>predict({...PRESETS[0],last},model));
  assert.equal(predict({...PRESETS[0],last:'4,5'},model).input.last,4.5);
  assert.throws(()=>predict({...PRESETS[0],budget:0},model));
});
test('Eğitim aralığı dışındaki veriyi işaretler ve negatif tahmini kırpar',()=>{
  assert.equal(predict({...PRESETS[0],last:10000},model).outside,true);
  const negative={...model,intercept:-1000,coefficients:model.coefficients.map(()=>0)};
  assert.equal(predict(PRESETS[0],negative).prediction,0);
});
test('CSV özel karakterleri korur ve formül çalıştırmasını engeller',()=>{
  const csv=recordsCsv([{id:'1',name:'=HYPERLINK("bad")',input:PRESETS[0]}],model);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes(predict(PRESETS[0],model).prediction.toFixed(4)));
});
test('Kayıt biçimi doğrulanır ve bozuk girdiler elenir',()=>{
  assert.deepEqual(readRecords(null),[]);
  assert.throws(()=>readRecords('{bad json'));
  assert.throws(()=>readRecords('{"version":0,"scenarios":[]}'));
  assert.equal(readRecords(JSON.stringify({version:1,scenarios:[{id:'1',name:'Test',input:PRESETS[1]},{id:'bad',name:'Invalid'}]})).length,1);
});
