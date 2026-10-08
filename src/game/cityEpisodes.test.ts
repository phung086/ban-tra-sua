import {describe,it,expect} from 'vitest';
import {createInitialState} from './engine';
import {CITY_PLACES} from './cityMap';
import {dialogueNode,storyAction,missionFor,missionDefinition,hydrateStories,RESIDENTS,type ResidentId} from './neighborhoodStories';
import {CITY_EPISODES} from './cityEpisodes';
import type {GameState} from './types';
import {cityAction} from './city';
function finish(game:GameState,id:ResidentId){const m=missionFor(game.city.stories,id)!,definition=missionDefinition(m.id);for(let i=m.step;i<definition.steps.length;i++)game=storyAction(game,{type:'task',mission:m.id,step:i},CITY_PLACES[definition.steps[i].place]);return storyAction(game,{type:'choice',resident:id,choice:'paid'},CITY_PLACES[RESIDENTS.find(n=>n.id===id)!.place]);}
describe('city story episodes and conversation personalities',()=>{
  it('provides physical rest stops in the larger districts without granting remote recovery',()=>{
    const game=createInitialState(),tired={...game,city:{...game.city,energy:0}};
    for(const place of ['plaza','riverside','temple'] as const){expect(cityAction(tired,{type:'rest',place},CITY_PLACES[place]).city.energy).toBe(35);expect(cityAction(tired,{type:'rest',place},CITY_PLACES.shop).city.energy).toBe(0);}
  });
  it('unlocks authored second and third chapters, preserves completed work and rejects duplicate rewards',()=>{
    for(const npc of RESIDENTS){
      let game=createInitialState();const initial=dialogueNode(game.city.stories,npc.id).choices.find(c=>c.next&&c.next!=='later')!;
      game=storyAction(game,{type:'choice',resident:npc.id,choice:initial.id},CITY_PLACES[npc.place]);game=storyAction(game,{type:'choice',resident:npc.id,choice:'accept'},CITY_PLACES[npc.place]);game=finish(game,npc.id);
      const branches=dialogueNode(game.city.stories,npc.id).choices.filter(c=>c.mission);expect(branches).toHaveLength(2);
      for(const choice of branches){
        let sequel=storyAction(game,{type:'choice',resident:npc.id,choice:choice.id},CITY_PLACES[npc.place]);expect(sequel.city.stories.missions).toHaveLength(2);expect(hydrateStories(sequel.city.stories)).toEqual(sequel.city.stories);
        sequel=finish(sequel,npc.id);const finalChoice=dialogueNode(sequel.city.stories,npc.id).choices.find(c=>c.mission)!;
        sequel=storyAction(sequel,{type:'choice',resident:npc.id,choice:finalChoice.id},CITY_PLACES[npc.place]);sequel=finish(sequel,npc.id);
        expect(sequel.city.stories.missions).toHaveLength(3);expect(sequel.city.stories.missions.every(m=>m.status==='complete')).toBe(true);
        expect(storyAction(sequel,{type:'choice',resident:npc.id,choice:'paid'},CITY_PLACES[npc.place])).toBe(sequel);
        expect(dialogueNode(sequel.city.stories,npc.id).choices.some(c=>c.mission)).toBe(false);
      }
    }
  });
  it('remembers tone, gives distinct authored replies, permits reconciliation and does not farm rapport',()=>{
    for(const npc of RESIDENTS){let game=createInitialState();game=storyAction(game,{type:'choice',resident:npc.id,choice:'tone:brusque'},CITY_PLACES[npc.place]);expect(game.city.stories.tones[npc.id]).toBe('brusque');const grumpy=dialogueNode(game.city.stories,npc.id).text;
      game=storyAction(game,{type:'choice',resident:npc.id,choice:'tone:playful'},CITY_PLACES[npc.place]);expect(dialogueNode(game.city.stories,npc.id).text).not.toBe(grumpy);
      game=storyAction(game,{type:'choice',resident:npc.id,choice:'tone:warm'},CITY_PLACES[npc.place]);const bond=game.city.stories.bonds[npc.id];for(let i=0;i<20;i++)game=storyAction(game,{type:'choice',resident:npc.id,choice:'tone:warm'},CITY_PLACES[npc.place]);expect(game.city.stories.bonds[npc.id]).toBe(bond);expect(hydrateStories(game.city.stories)).toEqual(game.city.stories);
    }
  });
  it('rejects forged skipped chapters and invalid conversation tones in a restored save',()=>{
    expect(CITY_EPISODES).toHaveLength(18);const stories=hydrateStories({tones:{thu:'invalid' as 'warm'},missions:[{id:'thu-tea-finale',step:0,status:'active'}]});expect(stories.tones).toEqual({});expect(stories.missions).toEqual([]);
  });
});
