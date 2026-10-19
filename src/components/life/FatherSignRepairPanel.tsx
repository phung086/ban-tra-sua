import type { Dispatch, SetStateAction } from 'react';
import type { GameState } from '../../game/types';
import {
  FATHER_SIGN_OPTIONS, canChooseFatherSign, chooseFatherSign,
  getFatherSignCallback, getFatherSignChoice, isFatherSignDue,
  type FatherSignChoice,
} from '../../game/lifeSim/fatherSignRepair';

const choices: readonly FatherSignChoice[] = ['repair', 'clean', 'postpone'];

export function FatherSignRepairPanel({ game, onGame }: {
  game: GameState;
  onGame: Dispatch<SetStateAction<GameState>>;
}) {
  const due = isFatherSignDue(game);
  const callback = getFatherSignCallback(game);
  if (!due && !callback) return null;
  const chosen = getFatherSignChoice(game);
  return <section className="life-morning" aria-label="Sửa biển hiệu cùng bố Quang">
    {callback && <p role="status">💌 {callback}</p>}
    {due && <>
      <span className="life-morning-label">CUỐI TUẦN · NGÀY {game.day} · GIA ĐÌNH</span>
      <h3>🔧 Lời hẹn với bố Quang</h3>
      <p>{chosen
        ? FATHER_SIGN_OPTIONS[chosen].reply
        : 'Bố mang bộ dụng cụ đến trước tiệm như đã hẹn. Bạn muốn sửa biển hiệu, lau lại biển cũ hay xin hẹn tuần sau?'}</p>
      {chosen ? <p role="status">✓ Đã lưu lựa chọn. Bố sẽ nhắn lại vào sáng mai.</p> :
        <div className="life-morning-options">
          {choices.map(choice => {
            const option = FATHER_SIGN_OPTIONS[choice];
            return <button type="button" className="life-morning-option" key={choice}
              disabled={!canChooseFatherSign(game, choice)}
              onClick={() => onGame(current => chooseFatherSign(current, choice))}>
              <strong>{option.label}</strong>
              <small>{option.cost.toLocaleString('vi-VN')} ₫ · {option.minutes} phút ·
                {option.energy > 0 ? '+' : ''}{option.energy} sức ·
                +{option.bond} gắn kết · +{option.fans} người theo dõi</small>
            </button>;
          })}
        </div>}
      {!chosen && !canChooseFatherSign(game, 'repair') &&
        <p role="status">Thiếu tiền, sức hoặc đã muộn? Lau biển miễn phí nếu đủ sức, hoặc hẹn tuần sau không mất gì.</p>}
    </>}
  </section>;
}
