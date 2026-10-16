// Pure A/B statistics: match each AB/BA round, never pool noisy frame intervals.
export const AB_QUALITIES=['light','balanced'];
export const AB_MODES=['follow','overview'];
const METRICS={calls:'callsPercent',triangles:'trianglesPercent',intervalP95:'p95Percent'};
const round=value=>Math.round(value*100)/100;
const median=values=>{
  const sorted=[...values].sort((a,b)=>a-b);
  return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
};
const describe=values=>({median:round(median(values)),min:round(Math.min(...values)),max:round(Math.max(...values))});

// Two paired repetitions are required for every quality/mode. A missing or
// malformed measurement is a failure, not a quietly dropped outlier.
export function summarizePairedAB(records,{control,candidate,comparisonKey}){
  if(control===candidate||!/^[a-z0-9-]+$/.test(control)||
     !/^[a-z0-9-]+$/.test(candidate)||
     !/^[a-zA-Z][a-zA-Z0-9]*$/.test(comparisonKey))
    throw new Error('Invalid A/B variant labels or comparison key');
  const comparisons=[],failures=[];
  for(const quality of AB_QUALITIES)for(const mode of AB_MODES){
    const pairs=[];
    for(const repeat of [1,2]){
      const matching=variant=>records.filter(row=>
        row.variant===variant&&row.quality===quality&&row.mode===mode&&row.repeat===repeat);
      const controls=matching(control),candidates=matching(candidate);
      if(controls.length!==1||candidates.length!==1){
        failures.push({quality,mode,repeat,error:'Missing or duplicate matched A/B sample',
          controlCount:controls.length,candidateCount:candidates.length});
        continue;
      }
      const a=controls[0],b=candidates[0];
      if(!Number.isInteger(a.frames)||a.frames<5||!Number.isInteger(b.frames)||b.frames<5||
         Object.keys(METRICS).some(metric=>
           !Number.isFinite(a[metric])||a[metric]<=0||
           !Number.isFinite(b[metric])||b[metric]<=0)){
        failures.push({quality,mode,repeat,error:'Invalid frames or metric in A/B sample'});
        continue;
      }
      const delta=Object.fromEntries(Object.entries(METRICS).map(([metric,key])=>
        [key,round((b[metric]-a[metric])/a[metric]*100)]));
      pairs.push({repeat,controlFrames:a.frames,candidateFrames:b.frames,
        control:{calls:a.calls,triangles:a.triangles,intervalP95:a.intervalP95},
        candidate:{calls:b.calls,triangles:b.triangles,intervalP95:b.intervalP95},
        ...delta});
    }
    if(pairs.length!==2)continue;
    const deltas=Object.fromEntries(Object.values(METRICS).map(key=>
      [key,describe(pairs.map(pair=>pair[key]))]));
    const variantMetrics=variant=>Object.fromEntries(Object.keys(METRICS).map(metric=>
      [metric,describe(records.filter(row=>
        row.variant===variant&&row.quality===quality&&row.mode===mode)
        .map(row=>row[metric]))]));
    comparisons.push({quality,mode,[comparisonKey]:Object.fromEntries(
      Object.entries(deltas).map(([key,value])=>[key,value.median])),
      spread:deltas,control:variantMetrics(control),candidate:variantMetrics(candidate),
      pairs});
  }
  return {comparisons,failures};
}
