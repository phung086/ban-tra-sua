import {describe,it,expect} from 'vitest';
import {createInitialState,nextDay,startDay} from './engine';
import {CITY_PLACES} from './cityMap';
import {MISSIONS,RESIDENTS,dialogueNode,hydrateStories,missionFor,storyAction} from './neighborhoodStories';
import type {GameState} from './types';

function accept(initial:GameState,missionId:string){
  const d=MISSIONS.find(m=>m.id===missionId)!,p=CITY_PLACES[RESIDENTS.find(r=>r.id===d.resident)!.place];
  const branch=dialogueNode(initial.city.stories,d.resident).choices.find(c=>c.next&&c.next!=='later'&&
    dialogueNode({...initial.city.stories,nodes:{[d.resident]:c.next}},d.resident).choices.some(option=>option.mission===missionId))!;
  let game=storyAction(initial,{type:'choice',resident:d.resident,choice:branch.id},p);
  game=storyAction(game,{type:'choice',resident:d.resident,choice:'accept'},p);
  return game;
}
describe('authored neighborhood stories',()=>{
  it('gives six residents two distinct playable branches with mutually exclusive outcomes',()=>{
    expect(RESIDENTS).toHaveLength(6);expect(MISSIONS).toHaveLength(30);
    for(const definition of MISSIONS.filter(m=>(m.episode??1)===1)){
      let game=accept(createInitialState(),definition.id);
      expect(missionFor(game.city.stories,definition.resident)?.id).toBe(definition.id);
      expect(game.city.stories.choices).toHaveLength(2);
      for(let i=0;i<definition.steps.length;i++){
        const step=definition.steps[i],before=game;
        game=storyAction(game,{type:'task',mission:definition.id,step:i},CITY_PLACES[step.place]);
        expect(game.city.energy).toBe(before.city.energy-step.energy);
        expect(game.city.minutes).toBe(before.city.minutes+step.minutes);
        expect(storyAction(game,{type:'task',mission:definition.id,step:i},CITY_PLACES[step.place])).toBe(game);
      }
      expect(missionFor(game.city.stories,definition.resident)?.status).toBe('ready');
      const npc=RESIDENTS.find(r=>r.id===definition.resident)!,before=game;
      const paid=storyAction(game,{type:'choice',resident:npc.id,choice:'paid'},CITY_PLACES[npc.place]);
      const kind=storyAction(game,{type:'choice',resident:npc.id,choice:'kind'},CITY_PLACES[npc.place]);
      expect(paid.cash).toBe(before.cash+definition.cash);expect(kind.cash).toBe(before.cash);
      expect(kind.city.goodwill-paid.city.goodwill).toBe(3);expect(kind.fans-paid.fans).toBe(2);
      expect(dialogueNode(kind.city.stories,npc.id).text).toContain('không nhận tiền');
      expect(storyAction(paid,{type:'choice',resident:npc.id,choice:'paid'},CITY_PLACES[npc.place])).toBe(paid);
      expect(storyAction(kind,{type:'choice',resident:npc.id,choice:'accept'},CITY_PLACES[npc.place])).toBe(kind);
    }
  });
  it('rejects distant dialogue, invented choices, out-of-order work, fatigue and closed locations',()=>{
    const initial=createInitialState();
    expect(storyAction(initial,{type:'choice',resident:'hanh',choice:'work'},CITY_PLACES.shop).city.stories).toEqual(initial.city.stories);
    expect(storyAction(initial,{type:'choice',resident:'hanh',choice:'accept'},CITY_PLACES.market)).toBe(initial);
    const game=accept(initial,'hanh-crates'),task={type:'task' as const,mission:'hanh-crates',step:0};
    expect(storyAction(game,{...task,step:1},CITY_PLACES.market)).toBe(game);
    expect(storyAction(game,task,CITY_PLACES.shop).city.stories).toEqual(game.city.stories);
    expect(storyAction({...game,city:{...game.city,energy:0}},task,CITY_PLACES.market).city.stories).toEqual(game.city.stories);
    const closed=storyAction({...game,city:{...game.city,minutes:1079}},task,CITY_PLACES.market);
    expect(closed.city.stories).toEqual(game.city.stories);
    expect(closed.notice).toContain('Nhiệm vụ được giữ lại cho ngày mai');
    expect(storyAction(startDay(game),task,CITY_PLACES.market).city.stories).toEqual(game.city.stories);
  });
  it('keeps choices and unfinished errands through days and hydration; limits active work',()=>{
    let game=accept(createInitialState(),'hanh-crates');
    game=storyAction(game,{type:'task',mission:'hanh-crates',step:0},CITY_PLACES.market);
    expect(nextDay(game).city.stories).toEqual(game.city.stories);
    expect(hydrateStories(JSON.parse(JSON.stringify(game.city.stories)))).toEqual(game.city.stories);
    game=accept(game,'thu-books');game=accept(game,'nam-sort');game=accept(game,'lan-posters');
    expect(game.city.stories.missions).toHaveLength(3);expect(game.notice).toContain('3 việc');
    const hydrated=hydrateStories({missions:[{id:'missing',step:99,status:'complete'},{id:'hanh-crates',step:2,status:'active'},{id:'hanh-neighbor',step:1,status:'active'}],nodes:{hanh:'unknown'},bonds:{hanh:NaN}});
    expect(hydrated.nodes).toEqual({});expect(hydrated.bonds).toEqual({});
    expect(hydrated.missions).toEqual([{id:'hanh-crates',step:2,status:'ready'}]);
  });
});
