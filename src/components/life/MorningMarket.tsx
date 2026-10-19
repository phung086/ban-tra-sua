import type {GameState} from '../../game/types';
import {formatMoney} from '../../game/engine';
import {MARKET_OPTIONS,marketDialogue,visitMorningMarket} from '../../game/lifeSim/marketEncounter';
import {MARKET_OPTIONS as KITCHEN_OPTIONS,visitMorningMarket as visitKitchenMarket,cookMarketMeal} from '../../game/lifeSim/morning';
import {morningActionBlock} from '../../game/lifeSim/morningAction';
import {pendingHanhHelp,canPromiseHanhHelp,promiseHanhHelp,resolveHanhHelp,hanhHelpBlock,hanhHelpResolvedToday} from '../../game/lifeSim/hanhHelpPromise';

export function MorningMarket({game,onGame}:{game:GameState;onGame:(state:GameState)=>void}){
  const choice=game.morning.marketVisit;
  const options=[
    {...MARKET_OPTIONS.fruit,id:'fruit',emoji:'🍎',energy:0,act:()=>visitMorningMarket(game,'fruit')},
    {...KITCHEN_OPTIONS.basket,id:'basket',emoji:'🥬',act:()=>visitKitchenMarket(game,'basket')},
    {...MARKET_OPTIONS.chat,id:'chat',emoji:'💬',energy:0,act:()=>visitMorningMarket(game,'chat')},
    {...MARKET_OPTIONS.leave,id:'leave',emoji:'🏪',energy:0,act:()=>visitMorningMarket(game,'leave')},
  ];
  const cookBlocked=morningActionBlock(game,0,18,3);
  return <section className="life-market life-market-unified" aria-label="Ghé chợ buổi sáng">
    <h4>Ghé chợ đầu ngõ · Cô Hạnh</h4>
    {pendingHanhHelp(game)&&<div className="life-market-result" aria-label="Lời hẹn với cô Hạnh">
      <p>{pendingHanhHelp(game)?.overdue?'Cô Hạnh vẫn nhớ lời hẹn cũ.':'Hôm qua mình hẹn phụ cô Hạnh xếp sạp.'}</p>
      <div className="life-morning-options">
        <button type="button" disabled={!!hanhHelpBlock(game,'carry')}
          onClick={()=>onGame(resolveHanhHelp(game,'carry'))}>🧺 Phụ xếp sạp · 14 phút · −7 sức · +2 thân thiết</button>
        <button type="button" disabled={!!hanhHelpBlock(game,'bags')}
          onClick={()=>onGame(resolveHanhHelp(game,'bags'))}>🛍️ Mua túi giấy · 9.000 ₫ · 6 phút · +1 thân thiết</button>
        <button type="button" onClick={()=>onGame(resolveHanhHelp(game,'apologize'))}>
          💬 Xin lỗi cô Hạnh · miễn phí · không khóa tiến trình
        </button>
      </div>
    </div>}
    {hanhHelpResolvedToday(game)&&<p role="status">✓ Đã giải quyết lời hẹn hôm nay. Cô Hạnh sẽ nhớ.</p>
    {canPromiseHanhHelp(game)&&<button type="button" onClick={()=>onGame(promiseHanhHelp(game))}>Hẹn mai phụ cô Hạnh xếp sạp</button>}
    <p>Một lần ghé chợ hôm nay: chọn trái cây ăn giữa ca hoặc mua rau về nấu cơm.</p>
    {choice==null?<div className="life-morning-options">
      {options.map(option=>{
        const blocked=morningActionBlock(game,option.cost,option.minutes,option.energy);
        return <button key={option.id} type="button" className="life-morning-option" disabled={!!blocked}
          onClick={()=>onGame(option.act())}>
          <span aria-hidden="true">{option.emoji}</span><strong>{option.label}</strong>
          <small>{option.minutes} phút{option.energy?` · −${option.energy} sức`:''}</small>
          <b>{option.cost?formatMoney(option.cost):'Miễn phí'}</b>
          {blocked&&<small>{blocked}</small>}
        </button>;
      })}
    </div>:choice==='basket'?<section className="life-market-result" aria-label="Chợ sáng và nấu cơm">
      <p>Đã mua rau và trứng. {game.morning.homeCooked?'Bữa cơm đã nấu xong.':'Có thể nấu bữa cơm ở nhà trước khi mở tiệm.'}</p>
      {!game.morning.homeCooked&&<>
        <button type="button" disabled={!!cookBlocked} onClick={()=>onGame(cookMarketMeal(game))}>🍲 Nấu canh rau tại nhà · 18 phút · −3 sức · +20 độ no</button>
        {cookBlocked&&<small>{cookBlocked}</small>}
      </>}
      {game.morning.homeCooked&&<p role="status">✓ Đã nấu cơm · Độ no {game.morning.satiety}/100</p>}
    </section>:<div className="life-market-reply" role="status">
      <strong>✓ Đã ghé chợ hôm nay</strong>
      <p>{game.storyLog.find(item=>item.id===`morning-market-${game.day}`)?.text ?? marketDialogue(choice,game.city.stories.bonds.hanh??0)}</p>
      <small>Mỗi ngày một lựa chọn · Đã lưu</small>
    </div>}
  </section>;
}
