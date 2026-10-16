import { SiblingAnCall } from "./SiblingAnCall";
import { BREAKFAST_OPTIONS, MOTHER_CALL_OPTIONS, LAN_MEAL_OPTIONS, LUNCH_PREP_OPTIONS, callFather, chooseBreakfast, chooseMotherCall, chooseLanMeal, prepareLunch, lanMealDialogue, motherCallDecision, motherCallDialogue, motherCallMemory, motherCallPrompt, shouldOfferMotherCall, wakeMorning, type BreakfastChoice, type MotherCallChoice, type LanMealChoice, type LunchPrepChoice, choosePlantCare, PLANT_CARE_OPTIONS, type PlantCareChoice } from "../../game/lifeSim/morning";
import { MARKET_OPTIONS, marketChoice, marketDialogue, visitMorningMarket, type MarketChoice } from "../../game/lifeSim/marketEncounter";
import { MARKET_OPTIONS as KITCHEN_OPTIONS, cookMarketMeal, visitMorningMarket as visitKitchenMarket } from '../../game/lifeSim/morning';
import { formatMoney } from '../../game/engine';
import { chooseDayEpisode, getDayEpisode, getEpisodeCallback } from '../../game/lifeSim/dayEpisodes';
import type { GameState } from '../../game/types';
import { BreakfastCookingPanel } from './BreakfastCookingPanel';

const titleForWake = {
  'on-time': 'Dậy đúng giờ, phố đã lên đèn nắng!',
  snoozed: 'Thêm năm phút nữa thôi…',
  overslept: 'Ôi, sáng nay ngủ quên rồi!',
} as const;

function timeLabel(minutes: number): string {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' +
    String(minutes % 60).padStart(2, '0');
}

const lunchChoices: {id:LunchPrepChoice;emoji:string;hint:string}[] = [
  {id:'lunchbox',emoji:'🍱',hint:'No lâu trong ca · 15 phút'},
  {id:'water',emoji:'💧',hint:'Không tốn tiền · 2 phút'},
];

const choices: {id:BreakfastChoice;emoji:string;hint:string}[] = [
  {id:'street',emoji:'🥖',hint:'Nhanh gọn đầu ngõ · 10 phút'},
  {id:'skip',emoji:'🚶',hint:'Chưa đói lắm · 0 phút'},
];

const motherChoices: {id:MotherCallChoice;emoji:string;hint:string}[] = [
  {id:'listen',emoji:'📞',hint:'10 phút · gắn kết +2'},
  {id:'promise',emoji:'🍚',hint:'5 phút · gắn kết +1'},
  {id:'later',emoji:'💌',hint:'0 phút · không áp lực'},
  {id:'photo',emoji:'📸',hint:'2 phút · gắn kết +1'},
];
const lanChoices: {id:LanMealChoice;emoji:string;hint:string}[] = [
  {id:'walk',emoji:'🌿',hint:'Đi dạo miễn phí · 12 phút · cùng Lan trò chuyện'},
  {id:'split',emoji:'🍜',hint:'40 phút · mỗi người tự trả phần mình'},
  {id:'treat',emoji:'💝',hint:'40 phút · mình trả cả hóa đơn'},
  {id:'decline',emoji:'💬',hint:'Không tốn tiền · hẹn dịp khác'},
];

/** Uses an existing pre-shop panel, not an additional WebGL scene. */
export function MorningRoutine({ game, onGame }:{game:GameState;onGame:(state:GameState)=>void}) {
  const {morning} = game;
  const finished = morning.step === 'finished';
  const episode = getDayEpisode(game.day);
  const callback = getEpisodeCallback(game);
  const recorded = game.storyLog.find(item => item.id === `day-episode-${game.day}-${morning.episodeChoice}`);
  const visited = marketChoice(game);
  return <section className="life-morning" aria-label="Sinh hoạt buổi sáng" data-step={morning.step}>
    <header className="life-morning-heading">
      <span className="life-morning-sun" aria-hidden="true">{morning.plan.wakeVariant==='overslept'?'⏰':'🌤️'}</span>
      <div>
        <span className="life-morning-label">NHẬT KÝ ĐỜI SỐNG · NGÀY {game.day}</span>
        <h3>{titleForWake[morning.plan.wakeVariant]}</h3>
        <p>{finished?'Bữa sáng đã xong. Tiệm đang chờ mình mở cửa.':
          morning.step==='asleep'?'Một ngày khác đang đợi bên ngoài cửa sổ.':
            'Ăn sáng một chút rồi mới ra quầy đón khách nhé.'}</p>
      </div>
      <strong className="life-morning-clock" aria-label="Giờ trong game">{timeLabel(game.city.minutes)}</strong>
    </header>
    {morning.step==='asleep'&&
      <button className="life-morning-wake" onClick={()=>onGame(wakeMorning(game))}>
        <span aria-hidden="true">☀️</span> Thức dậy bắt đầu ngày mới
      </button>}
    <BreakfastCookingPanel game={game} onGame={onGame}/>
    {morning.step==='awake'&&<>
      <p className="life-morning-prompt">Sáng nay ăn gì?</p>
      <div className="life-morning-options">
        {choices.map(({id,emoji,hint})=>{
          const option=BREAKFAST_OPTIONS[id],enough=game.cash>=option.cost;
          return <button key={id} disabled={!enough} onClick={()=>onGame(chooseBreakfast(game,id))}
            className="life-morning-option">
            <span aria-hidden="true">{emoji}</span>
            <strong>{option.label}</strong>
            <small>{hint}</small>
            <b>{option.cost?formatMoney(option.cost):'Miễn phí'}</b>
            {!enough&&<small>Chưa đủ tiền</small>}
          </button>;
        })}
      </div>
    </>}
    {finished && game.phase === 'prep' && <section className="life-family-call" aria-label="Gọi bố Quang">
      <strong>Bố Quang hỏi thăm tiệm</strong>
      {morning.fatherCall === null ? <div className="life-family-call-actions">
        <button onClick={() => onGame(callFather(game, 'listen'))}>Nghe bố tâm sự · 5 phút</button>
        <button onClick={() => onGame(callFather(game, 'promise'))}>Hẹn bố sửa biển hiệu · 8 phút</button>
      </div> : <p role="status">Đã gọi bố hôm nay.</p>}
    </section>}
    {finished&&shouldOfferMotherCall(morning)&&<section className="life-mother-call" aria-label="Cuộc gọi của mẹ Mai">
      <p className="life-morning-prompt">📱 Cuộc gọi từ mẹ Mai</p>
      {motherCallDecision(game) == null ? <>
        <p className="life-mother-message">{motherCallPrompt(game)}</p>
        <div className="life-morning-options">
          {motherChoices.map(({id,emoji,hint})=>{
            const option=MOTHER_CALL_OPTIONS[id];
            return <button key={id} type="button" className="life-morning-option"
              onClick={()=>onGame(chooseMotherCall(game,id))}>
              <span aria-hidden="true">{emoji}</span>
              <strong>{option.label}</strong>
              <small>{hint}</small>
              <b>Miễn phí</b>
            </button>;
          })}
        </div>
      </> : <p className="life-mother-reply" aria-live="polite">
        {motherCallDialogue(motherCallDecision(game)!,motherCallMemory(game).bond)}
      </p>}
      <small className="life-mother-bond">Gắn kết gia đình: {motherCallMemory(game).bond} điểm</small>
    </section>}
    {finished&&<section className="life-lan-invite" aria-label="Lời mời của Lan">
      <p className="life-morning-prompt">💌 Lan nhắn: “Trước khi mở tiệm, đi ăn cùng mình nhé?”</p>
      {morning.lanMeal == null ? <>
        <p className="life-lan-hint">Chọn cách thanh toán trước khi đi. Không bắt buộc phải nhận lời.</p>
        <div className="life-morning-options">
          {lanChoices.map(({id,emoji,hint})=>{
            const option=LAN_MEAL_OPTIONS[id],enough=game.cash>=option.cost;
            return <button key={id} type="button" className="life-morning-option" disabled={!enough}
              onClick={()=>onGame(chooseLanMeal(game,id))}>
              <span aria-hidden="true">{emoji}</span>
              <strong>{option.label}</strong>
              <small>{hint}</small>
              <b>{option.cost?formatMoney(option.cost):'Miễn phí'}</b>
              {!enough&&<small>Chưa đủ tiền</small>}
            </button>;
          })}
        </div>
      </> : <p className="life-lan-reply" aria-live="polite">
        {lanMealDialogue(morning.lanMeal,game.city.stories.bonds.lan ?? 0)}
      </p>}
    </section>}
    {finished&&game.phase==='prep'&&<section className="life-plant-care" aria-label="Chăm cây trước tiệm">
      <strong>🌿 Góc cây trước tiệm</strong>
      <p>{morning.lastPlantCare==='water'
        ? 'Bác Bình: “Hôm qua cháu tưới cây khéo đấy, lá trông tươi hơn rồi!”'
        : morning.lastPlantCare==='ask-binh'
          ? 'Bác Bình: “Nhớ lời bác dặn hôm qua nhé, đất khô rồi mới tưới.”'
          : 'Bác Bình để lại một chậu cây nhỏ. Mình chăm cây hay hỏi bác một chút?'}</p>
      {morning.plantCare == null ? <div className="life-plant-care-actions">
        {(['water','ask-binh'] as PlantCareChoice[]).map(choice=>{
          const option=PLANT_CARE_OPTIONS[choice];
          return <button key={choice} disabled={game.city.energy<option.energy}
            onClick={()=>onGame(choosePlantCare(game,choice))}>
            {option.label} · {option.minutes} phút · +{option.goodwill} thiện cảm
          </button>;
        })}
      </div> : <p role="status">{morning.plantCare==='water'
        ? 'Đã tưới cây hôm nay. Bác Bình sẽ nhớ vào sáng mai.'
        : 'Đã hỏi bác Bình hôm nay. Mai bác sẽ nhắc lại mẹo chăm cây.'}</p>}
    </section>}
    {finished&&<div className="life-morning-done" aria-live="polite">
      <span aria-hidden="true">✓</span>
      <span>{BREAKFAST_OPTIONS[morning.breakfast??'skip'].label} · Độ no {morning.satiety}/100</span>
      <small>Đã lưu trong ngày, không tính tiền lần hai.</small>
    </div>}
    {finished&&<SiblingAnCall game={game} onGame={onGame}/>}
    {callback && <p className="life-episode-callback" aria-live="polite">💌 Hôm qua được nhắc lại: {callback}</p>}
    {finished && episode && <section className="life-day-episode" aria-label={`Câu chuyện ngày ${game.day}`}>
      <span className="life-morning-label">CÂU CHUYỆN NGÀY {game.day} · {episode.character}</span>
      <h4>{episode.title}</h4>
      <p>{morning.episodeChoice != null ? (recorded?.text ?? 'Bạn đã chọn xong câu chuyện hôm nay.') : episode.question}</p>
      {morning.episodeChoice == null ? <div className="life-episode-choices">
        <button type="button" disabled={game.city.energy < episode.energy || game.city.minutes + episode.minutes > 1260}
          onClick={() => onGame(chooseDayEpisode(game, 'help'))}>
          {episode.helpLabel}
          <small>{episode.minutes} phút · -{episode.energy} sức · +{episode.goodwill} thiện cảm</small>
        </button>
        <button type="button" onClick={() => onGame(chooseDayEpisode(game, 'focus'))}>
          {episode.focusLabel}<small>Không tốn tiền hay thời gian</small>
        </button>
      </div> : <small className="life-episode-resolved">✓ Đã lưu lựa chọn hôm nay. Ngày mai câu chuyện sẽ tiếp nối.</small>}
    </section>}
    {finished&&game.phase==='prep'&&<div className="life-lunch" aria-label="Chuẩn bị bữa trưa">
      <p className="life-morning-prompt">Mang gì theo cho ca bán?</p>
      {morning.lunchPrep===null?<div className="life-morning-options life-lunch-options">
        {lunchChoices.map(({id,emoji,hint})=>{
          const option=LUNCH_PREP_OPTIONS[id],enough=game.cash>=option.cost;
          return <button key={id} className="life-morning-option" disabled={!enough}
            onClick={()=>onGame(prepareLunch(game,id))}>
            <span aria-hidden="true">{emoji}</span>
            <strong>{option.label}</strong>
            <small>{hint}</small>
            <b>{option.cost?formatMoney(option.cost):'Miễn phí'}</b>
            {!enough&&<small>Chưa đủ tiền</small>}
          </button>;
        })}
      </div>:<p className="life-lunch-result" role="status">
        ✓ {LUNCH_PREP_OPTIONS[morning.lunchPrep].label} · Độ no {morning.satiety}/100
      </p>}
      <small className="life-lunch-note">Tùy chọn · Có thể mở tiệm ngay, không bắt buộc chuẩn bị.</small>
    </div>}
    {finished&&morning.marketVisit!=='basket'&&!game.storyLog.some(item=>item.id===`morning-market-${game.day}`)&&<section className="life-market" aria-label="Ghé chợ buổi sáng">
      <h4>🧺 Ghé chợ đầu ngõ</h4>
      {visited === null ? <>
        <p>Cô Hạnh đang xếp hoa quả. Mua trái cây, hỏi thăm hay đi thẳng tới tiệm?</p>
        <div className="life-morning-options">
          {(['fruit','chat','leave'] as MarketChoice[]).map(choice=>{
            const option=MARKET_OPTIONS[choice];
            return <button key={choice} type="button" className="life-morning-option"
              disabled={game.cash<option.cost} onClick={()=>onGame(visitMorningMarket(game,choice))}>
              <span aria-hidden="true">{choice==='fruit'?'🍎':choice==='chat'?'💬':'🏪'}</span>
              <strong>{option.label}</strong>
              <small>{option.minutes} phút · {choice==='fruit'?'No +12':choice==='chat'?'Thân cô Hạnh +2':'Mở tiệm ngay'}</small>
              <b>{option.cost?formatMoney(option.cost):'Miễn phí'}</b>
              {game.cash<option.cost&&<small>Chưa đủ tiền · Có thể hỏi thăm miễn phí.</small>}
            </button>;
          })}
        </div>
      </> : <div className="life-market-reply" role="status">
        <strong>✓ Đã ghé chợ hôm nay</strong>
        <p>{marketDialogue(visited, game.city.stories.bonds.hanh ?? 0)}</p>
        <small>Độ no {morning.satiety}/100 · Mỗi ngày chỉ chọn một lần.</small>
      </div>}
    </section>}
    {finished&&(morning.marketVisit==null||morning.marketVisit==='basket'||game.storyLog.some(item=>item.id===`morning-market-${game.day}`))&&<section className="life-market life-kitchen-market" aria-label="Chợ sáng và nấu cơm">
      <h4>🥬 Chợ đầu ngõ · Cô Hạnh</h4>
      <p>{game.storyLog.some(moment=>moment.customerId==='hanh'&&moment.day<game.day&&moment.id.startsWith('morning-market-'))
        ? 'Cô Hạnh vẫn nhớ lần mình ghé chợ trước đó.'
        : 'Ghé chợ sau bữa sáng, hoặc mở tiệm ngay nếu muốn.'}</p>
      {morning.marketVisit == null&&<div className="life-market-actions">
        <button disabled={game.cash<KITCHEN_OPTIONS.basket.cost} onClick={()=>onGame(visitKitchenMarket(game,'basket'))}>
          🥬 {KITCHEN_OPTIONS.basket.label} · {formatMoney(KITCHEN_OPTIONS.basket.cost)} · 12 phút
        </button>
        <button onClick={()=>onGame(visitKitchenMarket(game,'chat'))}>
          💬 Nhờ cô Hạnh chọn rau · Miễn phí · 4 phút
        </button>
      </div>}
      {morning.marketVisit==='basket'&&<div className="life-market-result">
        <p>Đã mua rau và trứng. {morning.homeCooked?'Bữa cơm đã nấu xong.':'Có thể nấu bữa cơm ở nhà trước khi mở tiệm.'}</p>
        {!morning.homeCooked&&<button disabled={game.city.energy<3} onClick={()=>onGame(cookMarketMeal(game))}>
          🍲 Nấu canh rau tại nhà · 18 phút · +20 độ no
        </button>}
      </div>}
      {morning.marketVisit==='chat'&&<p className="life-market-result" role="status">Cô Hạnh đã trò chuyện cùng mình. Hẹn gặp lại vào ngày mai!</p>}
      {morning.homeCooked&&<p className="life-market-result" role="status">✓ Đã nấu cơm · Độ no {morning.satiety}/100</p>}
    </section>}
  </section>;
}
