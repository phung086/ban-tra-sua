import { BREAKFAST_OPTIONS, MOTHER_CALL_OPTIONS, chooseBreakfast, chooseMotherCall, motherCallDecision, motherCallDialogue, motherCallMemory, motherCallPrompt, shouldOfferMotherCall, wakeMorning, type BreakfastChoice, type MotherCallChoice } from '../../game/lifeSim/morning';
import { formatMoney } from '../../game/engine';
import type { GameState } from '../../game/types';

const titleForWake = {
  'on-time': 'Dậy đúng giờ, phố đã lên đèn nắng!',
  snoozed: 'Thêm năm phút nữa thôi…',
  overslept: 'Ôi, sáng nay ngủ quên rồi!',
} as const;

function timeLabel(minutes: number): string {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' +
    String(minutes % 60).padStart(2, '0');
}

const choices: {id:BreakfastChoice;emoji:string;hint:string}[] = [
  {id:'cook',emoji:'🍳',hint:'Bữa cơm ấm bụng · 20 phút'},
  {id:'street',emoji:'🥖',hint:'Nhanh gọn đầu ngõ · 10 phút'},
  {id:'skip',emoji:'🚶',hint:'Chưa đói lắm · 0 phút'},
];

const motherChoices: {id:MotherCallChoice;emoji:string;hint:string}[] = [
  {id:'listen',emoji:'📞',hint:'10 phút · gắn kết +2'},
  {id:'promise',emoji:'🍚',hint:'5 phút · gắn kết +1'},
  {id:'later',emoji:'💌',hint:'0 phút · không áp lực'},
  {id:'photo',emoji:'📸',hint:'2 phút · gắn kết +1'},
];

/** Uses an existing pre-shop panel, not an additional WebGL scene. */
export function MorningRoutine({ game, onGame }:{game:GameState;onGame:(state:GameState)=>void}) {
  const {morning} = game;
  const finished = morning.step === 'finished';
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
    {finished&&<div className="life-morning-done" aria-live="polite">
      <span aria-hidden="true">✓</span>
      <span>{BREAKFAST_OPTIONS[morning.breakfast??'skip'].label} · Độ no {morning.satiety}/100</span>
      <small>Đã lưu trong ngày, không tính tiền lần hai.</small>
    </div>}
  </section>;
}
