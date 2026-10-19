import { DRINKS, RESTOCK_ITEMS, STAFF } from "../../game/content";
import { getCounterPatienceAdjustment } from "../../game/closingCare";
import { RushShiftPanel } from "./RushShiftPanel";
import type { Dispatch, SetStateAction } from "react";
import type { GameState, Screen } from "../../game/types";
import {GameIcon} from '../GameIcon';
import {MorningRoutine} from '../life/MorningRoutine';
import {StreetMomentPanel} from '../life/StreetMomentPanel';
import {SocialMorningPanel} from '../life/SocialMorningPanel';
import {ShopTastingPanel} from '../life/ShopTastingPanel';
import {WeekTwoEpisodePanel} from '../life/WeekTwoEpisodePanel';
import {WeekThreeEpisodePanel} from '../life/WeekThreeEpisodePanel';
import {WeekFourEpisodePanel} from '../life/WeekFourEpisodePanel';
import {WeekSixEpisodePanel} from '../life/WeekSixEpisodePanel';
import {WeekSevenEpisodePanel} from '../life/WeekSevenEpisodePanel';
import { canChooseWeekFive, chooseWeekFive, getWeekFiveCallback, getWeekFiveDecision, getWeekFiveEpisode } from '../../game/lifeSim/weekFiveEpisodes';
import {FriendMealPanel} from '../life/FriendMealPanel';
import {FatherSignRepairPanel} from '../life/FatherSignRepairPanel';


interface Props {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
  onNavigate: (screen: Screen) => void;
}

export function PrepWorld({ game, onGame, onNavigate }: Props) {
  const fiveEpisode = getWeekFiveEpisode(game);
  const fiveCallback = getWeekFiveCallback(game);
  const fiveDecision = getWeekFiveDecision(game);
  const visibleStock = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
  const lowStock = visibleStock.filter((item) => game.inventory[item.key] <= 3).slice(0, 4);
  const activeStaff = STAFF.find((staff) => staff.id === game.activeStaff);
  const xpInLevel = game.xp % 160;
  const nextDrink = Object.values(DRINKS)
    .filter((drink) => drink.unlockLevel > game.level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];

  return <section className="prep-foundation">
    <header><div><h2>{game.event.name}</h2><p>{game.event.description}</p></div><span className="prep-day">Ngày {game.day}</span></header>
    <MorningRoutine game={game} onGame={onGame}><RushShiftPanel game={game} onGame={onGame} onNavigate={onNavigate}/></MorningRoutine>
    <StreetMomentPanel game={game} onGame={onGame}/>
    <FatherSignRepairPanel game={game} onGame={onGame}/>
    <SocialMorningPanel game={game} onGame={onGame}/>
    <ShopTastingPanel game={game} onGame={onGame}/>
    <WeekTwoEpisodePanel game={game} onGame={onGame}/>
    <WeekThreeEpisodePanel game={game} onGame={onGame}/>
    <WeekFourEpisodePanel game={game} onGame={onGame}/>
    <WeekSixEpisodePanel game={game} onGame={onGame}/>
    <WeekSevenEpisodePanel game={game} onGame={onGame}/>
    {(fiveEpisode || fiveCallback) && <section className="life-morning" aria-label="Câu chuyện chương năm">
      {fiveCallback && <p aria-live="polite">💌 {fiveCallback}</p>}
      {fiveEpisode && game.morning.step === 'finished' && <>
        <span className="life-morning-label">CHƯƠNG 5 · NGÀY {game.day} · {fiveEpisode.character}</span>
        <h3>{fiveEpisode.title}</h3>
        <p>🕒 {fiveEpisode.schedule}</p>
        <p>{fiveDecision ? fiveEpisode[fiveDecision].reply : fiveEpisode.prompt}</p>
        {fiveDecision ? <p role="status">✓ Đã lưu quyết định. Nhân vật sẽ nhớ lựa chọn này ở ngày tiếp theo.</p> :
          <div className="life-morning-options">
            {(['meet', 'message'] as const).map(choice => {
              const option = fiveEpisode[choice];
              return <button key={choice} type="button" className="life-morning-option"
                disabled={!canChooseWeekFive(game, choice)}
                onClick={() => onGame(chooseWeekFive(game, choice))}>
                <strong>{option.label}</strong>
                <small>{option.minutes} phút · {option.cost.toLocaleString('vi-VN')} ₫ · {option.energy > 0 ? '+' : ''}{option.energy} sức · +{option.goodwill} thiện cảm</small>
              </button>;
            })}
          </div>}
        {!fiveDecision && !canChooseWeekFive(game, 'meet') &&
          <p role="status">Đã qua giờ hẹn hoặc chưa đủ tiền, sức. Bạn vẫn có thể nhắn hẹn lại miễn phí.</p>}
      </>}
    </section>}
    <FriendMealPanel game={game} onGame={onGame}/>
    <div className="prep-service-plan"><GameIcon name="cup"/><div><h3>Ca bán hôm nay</h3><p>{game.targetOrders} khách hẹn ghé tiệm</p></div></div>
    {getCounterPatienceAdjustment(game) !== 0 && <p className="prep-counter-condition" role="status">{game.counterCondition === "fresh" ? "✨ Quầy sạch thơm từ tối qua: khách hôm nay kiên nhẫn thêm 10 giây." : "🧽 Quầy chưa gọn: khách hôm nay sốt ruột sớm hơn 10 giây."}</p>}
    <dl className="prep-numbers"><div><dt><GameIcon name="person"/>Người theo dõi</dt><dd>{game.fans}</dd></div><div><dt><GameIcon name="star"/>Lượt lan tỏa</dt><dd>{game.viral}</dd></div><div><dt><GameIcon name="board"/>Điểm nghiên cứu</dt><dd>{game.researchPoints}</dd></div><div><dt><GameIcon name="cup"/>Món trong menu</dt><dd>{game.unlockedBaseIds.length}</dd></div></dl>
    <div className="prep-level"><p><b>Cấp {game.level}</b><span>{xpInLevel}/160 kinh nghiệm</span></p><progress value={xpInLevel} max="160" aria-label="Tiến độ cấp độ"/><small>{nextDrink?`Cấp ${nextDrink.unlockLevel} mở ${nextDrink.name}`:'Menu đã mở toàn bộ.'}</small></div>
    <p className="prep-operator"><GameIcon name="person"/>{activeStaff?`${activeStaff.name} · ${activeStaff.role}`:'Bạn trực quầy hôm nay'}<span>{game.unlockedToppingIds.length} loại topping</span></p>
    {lowStock.length>0&&<button className="prep-stock-alert" onClick={()=>onNavigate('stock')}><GameIcon name="box"/><span><b>Kiểm tra kho trước khi mở</b><small>{lowStock.map(item=>item.label).join(' · ')}</small></span></button>}
    <p className="prep-footnote">Trước ca bán, bạn có thể đi phố, nhập nguyên liệu hoặc giúp hàng xóm.</p>
  </section>;
}
