import '../../styles-friend-meal.css';
import type { GameState } from '../../game/types';
import { formatMoney } from '../../game/engine';
import { chooseFriendMeal, friendMealForDay, FRIEND_MEAL_OPTIONS } from '../../game/lifeSim/friendMeal';
import { ThaoMenuPanel } from './ThaoMenuPanel';

export function FriendMealPanel({game,onGame}:{game:GameState;onGame:(game:GameState)=>void}) {
  if (game.phase !== 'prep' || game.morning.step !== 'finished') return null;
  const selected = friendMealForDay(game);
  return <><section className="life-friend-meal" aria-label="Lời mời của Thảo">
    <h3>🥢 Thảo rủ ăn nhẹ trước ca</h3>
    <p>Thảo: Mình ghé quán đầu ngõ nhé? Tiền ăn tính sao cho thoải mái?</p>
    {selected === null
      ? <div className="life-friend-meal-options">
        {(['split','host','decline'] as const).map(choice => {
          const option = FRIEND_MEAL_OPTIONS[choice];
          return <button key={choice} disabled={game.cash < option.cost}
            onClick={() => onGame(chooseFriendMeal(game,choice))}>
            <strong>{option.label}</strong>
            <small>{option.cost ? formatMoney(option.cost) : 'Miễn phí'} · {option.minutes} phút</small>
          </button>;
        })}
      </div>
      : <p role="status">✓ {FRIEND_MEAL_OPTIONS[selected].label} · Đã lưu, không tính tiền lần hai.</p>}
  </section><ThaoMenuPanel game={game} onGame={onGame}/></>;
}
