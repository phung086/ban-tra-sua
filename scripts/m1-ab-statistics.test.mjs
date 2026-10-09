import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizePairedAB} from './m1-ab-statistics.mjs';

function fixtures(){
  const rows=[];
  for(const quality of ['light','balanced'])for(const mode of ['follow','overview']){
    for(const repeat of [1,2]){
      rows.push({variant:'a',quality,mode,repeat,frames:40,calls:100,
        triangles:200,intervalP95:100});
      rows.push({variant:'b',quality,mode,repeat,frames:35,calls:repeat===1?60:80,
        triangles:repeat===1?100:120,intervalP95:repeat===1?110:90});
    }
  }
  return rows;
}
test('two AB/BA pairs produce per-pair deltas and median/spread, not a pooled P95',()=>{
  const {comparisons,failures}=summarizePairedAB(fixtures(),{
    control:'a',candidate:'b',comparisonKey:'near12Vs16'});
  assert.deepEqual(failures,[]);
  assert.equal(comparisons.length,4);
  const row=comparisons.find(x=>x.quality==='light'&&x.mode==='overview');
  assert.equal(row.near12Vs16.callsPercent,-30);
  assert.equal(row.near12Vs16.trianglesPercent,-45);
  assert.equal(row.near12Vs16.p95Percent,0);
  assert.deepEqual(row.spread.callsPercent,{median:-30,min:-40,max:-20});
  assert.deepEqual(row.spread.p95Percent,{median:0,min:-10,max:10});
  assert.deepEqual(row.control.calls,{median:100,min:100,max:100});
  assert.deepEqual(row.candidate.calls,{median:70,min:60,max:80});
  assert.deepEqual(row.pairs.map(p=>p.repeat),[1,2]);
});
test('missing second paired round is an explicit failure, never a pass',()=>{
  const rows=fixtures().filter(row=>!(row.quality==='light'&&row.mode==='follow'&&
    row.repeat===2&&row.variant==='b'));
  const result=summarizePairedAB(rows,{control:'a',candidate:'b',comparisonKey:'ab'});
  assert.equal(result.comparisons.length,3);
  assert.equal(result.failures.length,1);
  assert.match(result.failures[0].error,/Missing/);
});
test('duplicate round cannot silently bias the comparison',()=>{
  const rows=fixtures();rows.push({...rows[0]});
  const result=summarizePairedAB(rows,{control:'a',candidate:'b',comparisonKey:'ab'});
  assert.equal(result.comparisons.length,3);
  assert.equal(result.failures.length,1);
  assert.equal(result.failures[0].controlCount,2);
});
test('zero baseline or nonfinite frame statistics reject the pair',()=>{
  const rows=fixtures();rows[0].calls=0;
  rows[3].intervalP95=NaN;
  const result=summarizePairedAB(rows,{control:'a',candidate:'b',comparisonKey:'ab'});
  assert.equal(result.comparisons.length,3);
  assert.equal(result.failures.length,2);
});
test('zero candidate P95 is not a valid perfect performance result',()=>{
  const rows=fixtures();rows[1].intervalP95=0;
  const result=summarizePairedAB(rows,{control:'a',candidate:'b',comparisonKey:'ab'});
  assert.equal(result.comparisons.length,3);
  assert.equal(result.failures.length,1);
});
test('low-frame sample is rejected',()=>{
  const rows=fixtures();rows[0].frames=4;
  const result=summarizePairedAB(rows,{control:'a',candidate:'b',comparisonKey:'ab'});
  assert.equal(result.comparisons.length,3);
  assert.equal(result.failures.length,1);
});
test('labels and key are validated',()=>{
  assert.throws(()=>summarizePairedAB([],{control:'a',candidate:'a',comparisonKey:'ab'}));
  assert.throws(()=>summarizePairedAB([],{control:'a',candidate:'b',comparisonKey:'bad-key'}));
});
