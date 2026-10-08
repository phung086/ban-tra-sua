import {useEffect,useRef,useState} from 'react';
import {dialogueNode,missionFor,missionObjective,missionDefinition,resident,type ResidentId,type StoryAction} from '../game/neighborhoodStories';
import type {GameState} from '../game/types';
import {ChibiPortrait} from './ChibiCustomer';
import {getCustomer} from '../game/engine';
import type {CityPlace} from '../game/cityMap';
import {PERSONALITIES} from '../game/cityEpisodes';
import {GameIcon} from './GameIcon';

export function NeighborhoodDialogue({id,game,onClose,onAction,onNavigate}:{id:ResidentId;game:GameState;onClose:()=>void;onAction:(a:StoryAction)=>void;onNavigate:(p:CityPlace)=>void}) {
  const npc=resident(id),node=dialogueNode(game.city.stories,id),mission=missionFor(game.city.stories,id);
  const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null);
  const [acted,setActed]=useState(false);
  useEffect(()=>{
    previousFocus.current=document.activeElement as HTMLElement|null;
    dialog.current?.showModal();
    return ()=>{dialog.current?.close();previousFocus.current?.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className="neighborhood-dialogue" aria-labelledby="conversation-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <header><ChibiPortrait customer={getCustomer(npc.customerId)}/><div><h2 id="conversation-title">{npc.name}</h2><p>{npc.role}</p><small>{game.city.stories.bonds[id]??0} thân thiết</small></div><button aria-label="Khép cuộc trò chuyện" onClick={onClose}>Để lát nhé</button></header>
    <p className="dialogue-stage">{PERSONALITIES[id].label}. {npc.intro}</p>
    <p className="dialogue-speech" key={`${id}-${game.city.stories.nodes[id]}-${mission?.status}`} aria-live="polite">{node.text}</p>
    <p className="neighborhood-feedback" role="status" aria-live="polite" aria-atomic="true" hidden={!acted||game.notice===`${npc.name}: ${node.text}`}>{game.notice}</p>
    <div className="dialogue-choices">{node.choices.map((choice,i)=><button key={choice.id} className={choice.tone?`tone-${choice.tone}`:undefined} onClick={()=>{setActed(true);onAction({type:'choice',resident:id,choice:choice.id});}}><span>{choice.tone?<GameIcon name={choice.tone==='warm'?'leaf':choice.tone==='playful'?'star':'chat'}/>:i+1}</span><div><b>{choice.text}</b>{choice.tone&&<small>{choice.tone==='warm'?'Chân thành':choice.tone==='playful'?'Vui vẻ':'Cộc lốc'} · cách nói được người đối diện nhớ</small>}{choice.hint&&<small>{choice.hint}</small>}</div></button>)}</div>
    {mission?.status==='active' && <div className="dialogue-current-task"><p>{missionDefinition(mission.id).title}</p><button className="primary-button" onClick={()=>{onClose();onNavigate(missionObjective(mission).place);}}>Đi làm: {missionObjective(mission).verb.toLowerCase()}</button><small>Tiến trình giữ lại nếu bạn về tiệm hoặc sang ngày mới.</small></div>}
    {mission?.status==='complete' && <button className="primary-button" onClick={onClose}>Hẹn gặp lại ở tiệm trà</button>}
    <footer>Mỗi người có ba chặng chuyện. Việc sau mở khi báo tin xong việc trước; cách nói chuyện ảnh hưởng phản ứng và thân thiết. Có thể đổi cách nói để làm hòa.</footer>
  </dialog>;
}
