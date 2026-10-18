import type {GameState} from '../types';

export function morningActionBlock(game:GameState,cost:number,minutes:number,energy=0):string|null{
  if(game.cash<cost)return 'Chưa đủ tiền cho lựa chọn này.';
  if(game.city.energy<energy)return 'Chưa đủ sức, hãy nghỉ trước nhé.';
  if(game.city.minutes+minutes>1260)return 'Không còn đủ thời gian hôm nay. Hẹn ngày mai nhé.';
  return null;
}
