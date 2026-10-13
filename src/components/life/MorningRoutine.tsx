import { BREAKFAST_OPTIONS, chooseBreakfast, choosePlantCare, wakeMorning, PLANT_CARE_OPTIONS, type BreakfastChoice, type PlantCareChoice } from '../../game/lifeSim/morning';
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
  </section>;
}
