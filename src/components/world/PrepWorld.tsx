import { DRINKS, RESTOCK_ITEMS, STAFF } from "../../game/content";
import { startDay } from "../../game/engine";
import type { GameState, Screen } from "../../game/types";
import {GameIcon} from '../GameIcon';


interface Props {
  game: GameState;
  onGame: (state: GameState) => void;
  onNavigate: (screen: Screen) => void;
}

export function PrepWorld({ game, onGame, onNavigate }: Props) {
  const visibleStock = RESTOCK_ITEMS.filter((item) => item.unlockLevel <= game.level);
  const lowStock = visibleStock.filter((item) => game.inventory[item.key] <= 3).slice(0, 4);
  const activeStaff = STAFF.find((staff) => staff.id === game.activeStaff);
  const xpInLevel = game.xp % 160;
  const nextDrink = Object.values(DRINKS)
    .filter((drink) => drink.unlockLevel > game.level)
    .sort((a, b) => a.unlockLevel - b.unlockLevel)[0];

  return <section className="prep-foundation">
    <header><div><h2>{game.event.name}</h2><p>{game.event.description}</p></div><span className="prep-day">Ngày {game.day}</span></header>
    <button className="primary-button prep-open" onClick={()=>onGame(startDay(game))}><GameIcon name="home"/><span>Mở cửa tiệm<small>Bắt đầu ca · {game.targetOrders} đơn</small></span></button>
    <div className="prep-service-plan"><GameIcon name="cup"/><div><h3>Ca bán hôm nay</h3><p>{game.targetOrders} khách hẹn ghé tiệm</p></div></div>
    <dl className="prep-numbers"><div><dt><GameIcon name="person"/>Người theo dõi</dt><dd>{game.fans}</dd></div><div><dt><GameIcon name="star"/>Lượt lan tỏa</dt><dd>{game.viral}</dd></div><div><dt><GameIcon name="board"/>Điểm nghiên cứu</dt><dd>{game.researchPoints}</dd></div><div><dt><GameIcon name="cup"/>Món trong menu</dt><dd>{game.unlockedBaseIds.length}</dd></div></dl>
    <div className="prep-level"><p><b>Cấp {game.level}</b><span>{xpInLevel}/160 kinh nghiệm</span></p><progress value={xpInLevel} max="160" aria-label="Tiến độ cấp độ"/><small>{nextDrink?`Cấp ${nextDrink.unlockLevel} mở ${nextDrink.name}`:'Menu đã mở toàn bộ.'}</small></div>
    <p className="prep-operator"><GameIcon name="person"/>{activeStaff?`${activeStaff.name} · ${activeStaff.role}`:'Bạn trực quầy hôm nay'}<span>{game.unlockedToppingIds.length} loại topping</span></p>
    {lowStock.length>0&&<button className="prep-stock-alert" onClick={()=>onNavigate('stock')}><GameIcon name="box"/><span><b>Kiểm tra kho trước khi mở</b><small>{lowStock.map(item=>item.label).join(' · ')}</small></span></button>}
    <p className="prep-footnote">Trước ca bán, bạn có thể đi phố, nhập nguyên liệu hoặc giúp hàng xóm.</p>
  </section>;
}
