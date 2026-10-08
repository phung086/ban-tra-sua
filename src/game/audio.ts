import {getUiPreferences} from './preferences';
import {musicNotes,MUSIC_BEATS,MUSIC_BPM,type MusicNote} from './musicScore';

let context:AudioContext|undefined,music:GainNode|undefined,sfx:GainNode|undefined;
let unlocked=false,timer:ReturnType<typeof setTimeout>|undefined,cycle=0,cursor=0,start=0;
let score=musicNotes(),ducked=false;
const seconds=60/MUSIC_BPM;
function status(){
  if(typeof document==='undefined')return;
  document.documentElement.dataset.music=!getUiPreferences().music?'off':context?.state==='running'&&unlocked&&getUiPreferences().musicVolume>0?'playing':'waiting';
  window.dispatchEvent(new Event('tea-audio-state'));
}
export function gameAudio(){
  try{
    if(!context){
      const Ctor=window.AudioContext??(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;
      if(!Ctor)return undefined;
      context=new Ctor();music=context.createGain();sfx=context.createGain();
      music.gain.value=0;music.connect(context.destination);sfx.connect(context.destination);
      context.onstatechange=()=>{status();};
    }
    return {context,music:music!,sfx:sfx!};
  }catch{return undefined;}
}
function note(audio:NonNullable<ReturnType<typeof gameAudio>>,n:MusicNote,at:number){
  const oscillator=audio.context.createOscillator(),gain=audio.context.createGain();
  oscillator.type=n.voice==='warm'?'triangle':'sine';
  oscillator.frequency.value=440*2**((n.midi-69)/12);
  const duration=n.duration*seconds;
  gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(n.velocity,at+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  oscillator.connect(gain);gain.connect(audio.music);oscillator.start(at);oscillator.stop(at+duration+.03);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
}
function mix(){
  if(!context||!music||!sfx)return;
  const prefs=getUiPreferences(),now=context.currentTime;
  music.gain.cancelScheduledValues(now);music.gain.setTargetAtTime(prefs.music&&!document.hidden?prefs.musicVolume*(ducked?.32:.75):0,now,.08);
  sfx.gain.setTargetAtTime(prefs.sound?1:0,now,.025);status();
}
function schedule(){
  timer=undefined;
  if(!context||context.state!=='running'||document.hidden||!getUiPreferences().music)return;
  const horizon=context.currentTime+.25;
  while(start+score[cursor].beat*seconds<horizon){
    const at=start+score[cursor].beat*seconds;
    if(at>=context.currentTime)note({context,music:music!,sfx:sfx!},score[cursor],at);
    if(++cursor===score.length){cursor=0;start+=MUSIC_BEATS*seconds;score=musicNotes(++cycle);}
  }
  timer=setTimeout(schedule,100);
}
function restart(){
  if(timer!==undefined)clearTimeout(timer);timer=undefined;
  mix();
  if(context?.state==='running'&&getUiPreferences().music&&!document.hidden){cursor=0;cycle=0;score=musicNotes();start=context.currentTime+.06;schedule();}
}
export function duckMusic(value:boolean){ducked=value;mix();}
export function installGameAudio(){
  let previousMusic=getUiPreferences().music,disposed=false;
  const unlock=()=>{
    if(unlocked)return;
    const audio=gameAudio();if(!audio)return;
    void audio.context.resume().then(()=>{if(!disposed){unlocked=true;restart();}}).catch(()=>{if(!disposed)status();});
  };
  const preference=()=>{const next=getUiPreferences().music;if(unlocked&&next!==previousMusic)restart();else mix();previousMusic=next;status();};
  const visibility=()=>{
    if(document.hidden){if(timer!==undefined)clearTimeout(timer);timer=undefined;mix();void context?.suspend().catch(()=>{});}
    else if(unlocked&&context)void context.resume().then(()=>{if(!disposed)restart();}).catch(()=>{if(!disposed)status();});
  };
  window.addEventListener('pointerdown',unlock,{capture:true});window.addEventListener('keydown',unlock,{capture:true});
  window.addEventListener('tea-graphics-change',preference);document.addEventListener('visibilitychange',visibility);status();
  return ()=>{
    disposed=true;
    window.removeEventListener('pointerdown',unlock,{capture:true});window.removeEventListener('keydown',unlock,{capture:true});
    window.removeEventListener('tea-graphics-change',preference);document.removeEventListener('visibilitychange',visibility);
    if(timer!==undefined)clearTimeout(timer);timer=undefined;
    if(context){context.onstatechange=null;void context.close().catch(()=>{});}context=undefined;music=sfx=undefined;unlocked=false;
  };
}
