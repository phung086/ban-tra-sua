export type MusicNote={midi:number;beat:number;duration:number;velocity:number;voice:'bell'|'bass'|'warm'};
export const MUSIC_BPM=88;
export const MUSIC_BEATS=32;
// Original pentatonic café melody: eight bars, with warm broken chords and a
// gentle bass. No downloaded track, network request, or copyrighted song.
const melody=[76,79,81,79,76,74,72,0,74,76,79,76,74,72,69,0,72,76,79,81,79,76,74,0,72,74,76,74,72,69,67,0];
const chords=[[60,64,67],[57,60,64],[53,57,60],[55,59,62],[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
export function musicNotes(cycle=0):MusicNote[]{
  const notes:MusicNote[]=[];
  for(let i=0;i<melody.length;i++)if(melody[i])notes.push({midi:melody[i]+(cycle%4===3?-12:0),beat:i+.12,duration:.9,velocity:.027,voice:'bell'});
  chords.forEach((chord,bar)=>{
    notes.push({midi:chord[0]-12,beat:bar*4,duration:2.9,velocity:.025,voice:'bass'});
    for(let n=0;n<8;n++)notes.push({midi:chord[n%3],beat:bar*4+n*.5,duration:.7,velocity:.009,voice:'warm'});
  });
  return notes.sort((a,b)=>a.beat-b.beat);
}
