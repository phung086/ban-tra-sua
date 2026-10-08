import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {duckMusic,gameAudio,installGameAudio} from './audio';
import {getUiPreferences,updateUiPreferences} from './preferences';
import {musicNotes,MUSIC_BEATS} from './musicScore';

const param=()=>({value:0,setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),cancelScheduledValues:vi.fn(),setTargetAtTime:vi.fn()});
const gainNode=()=>({gain:param(),connect:vi.fn(),disconnect:vi.fn()});
class AudioMock {
  static instances:AudioMock[]=[];
  currentTime=0;state='suspended';destination={};onstatechange:unknown=null;
  gains:ReturnType<typeof gainNode>[]=[];
  createGain(){const node=gainNode();this.gains.push(node);return node;}
  createOscillator=vi.fn(()=>({type:'sine',frequency:param(),connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn(),onended:null}));
  resume=vi.fn(async()=>{this.state='running';});
  suspend=vi.fn(async()=>{this.state='suspended';});
  close=vi.fn(async()=>{this.state='closed';});
  constructor(){AudioMock.instances.push(this);}
}
let cleanup:(()=>void)|undefined;
beforeEach(()=>{
  vi.useFakeTimers();AudioMock.instances=[];
  const page=Object.assign(new EventTarget(),{hidden:false,documentElement:{dataset:{}}});
  const browser=Object.assign(new EventTarget(),{AudioContext:AudioMock});
  const store=new Map<string,string>();
  vi.stubGlobal('document',page);vi.stubGlobal('window',browser);
  vi.stubGlobal('localStorage',{getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>store.set(key,value)});
  vi.stubGlobal('CustomEvent',class extends Event {detail:unknown;constructor(type:string,init?:{detail:unknown}){super(type);this.detail=init?.detail;}});
});
afterEach(()=>{cleanup?.();cleanup=undefined;vi.useRealTimers();vi.unstubAllGlobals();});

describe('background music lifecycle',()=>{
  it('waits for a gesture, shares SFX context, ducks, mutes, pauses hidden and disposes timers',async()=>{
    cleanup=installGameAudio();expect(AudioMock.instances).toHaveLength(0);
    window.dispatchEvent(new Event('pointerdown'));await Promise.resolve();
    const audio=AudioMock.instances[0];expect(audio.resume).toHaveBeenCalledTimes(1);
    expect(gameAudio()?.context).toBe(audio);expect(AudioMock.instances).toHaveLength(1);
    expect(document.documentElement.dataset.music).toBe('playing');expect(audio.createOscillator).toHaveBeenCalled();
    duckMusic(true);expect(audio.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(.45*.32,0,.08);
    duckMusic(false);updateUiPreferences({music:false});
    expect(document.documentElement.dataset.music).toBe('off');expect(vi.getTimerCount()).toBe(0);
    expect(audio.gains[0].gain.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.08);
    updateUiPreferences({music:true,musicVolume:.2});expect(vi.getTimerCount()).toBe(1);
    Object.assign(document,{hidden:true});document.dispatchEvent(new Event('visibilitychange'));
    expect(audio.suspend).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
    Object.assign(document,{hidden:false});document.dispatchEvent(new Event('visibilitychange'));await Promise.resolve();
    expect(vi.getTimerCount()).toBe(1);
    cleanup();cleanup=undefined;expect(audio.close).toHaveBeenCalledTimes(1);expect(vi.getTimerCount()).toBe(0);
    window.dispatchEvent(new Event('pointerdown'));expect(AudioMock.instances).toHaveLength(1);
  });
  it('does not restart the phrase for graphics or volume changes and upgrades old preferences safely',async()=>{
    localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({graphics:'light',sound:false}));
    expect(getUiPreferences().music).toBe(true);expect(getUiPreferences().musicVolume).toBe(.45);
    cleanup=installGameAudio();window.dispatchEvent(new Event('keydown'));await Promise.resolve();
    const audio=AudioMock.instances[0],count=audio.createOscillator.mock.calls.length;
    updateUiPreferences({graphics:'balanced',musicVolume:.8});
    expect(audio.createOscillator).toHaveBeenCalledTimes(count);
    expect(audio.gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.025);
    localStorage.setItem('tiem-tra-chibi-ui-v1',JSON.stringify({music:'invalid',musicVolume:99}));
    expect(getUiPreferences().music).toBe(true);expect(getUiPreferences().musicVolume).toBe(1);
  });
  it('keeps every note within the repeating score and varies the melody without invalid pitches',()=>{
    const score=musicNotes(),variation=musicNotes(3);
    expect(new Set(score.map(n=>n.voice)).size).toBe(3);
    for(let i=0;i<score.length;i++){
      const n=score[i];expect(n.beat).toBeGreaterThanOrEqual(0);expect(n.beat).toBeLessThan(MUSIC_BEATS);
      expect(n.midi).toBeGreaterThan(20);expect(n.midi).toBeLessThan(100);expect(n.duration).toBeGreaterThan(0);
      expect(n.velocity).toBeGreaterThan(0);expect(n.velocity).toBeLessThan(.04);
      if(i)expect(n.beat).toBeGreaterThanOrEqual(score[i-1].beat);
    }
    expect(variation.filter(n=>n.voice==='bell').map(n=>n.midi)).toEqual(score.filter(n=>n.voice==='bell').map(n=>n.midi-12));
  });
});
