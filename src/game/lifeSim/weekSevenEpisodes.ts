import type { GameState } from '../types';
import { weekSevenEpisodes, type Episode } from './weekSevenData';
export type WeekSevenChoice = 'meet'|'message';
const choices:readonly WeekSevenChoice[]=['meet','message'];
const key=(day:number,choice:WeekSevenChoice)=>`week-seven-${day}-${choice}`;
const has=(game:GameState,id:string)=>game.relationshipRewardIds?.includes(id)===true||game.storyLog?.some(x=>x.id===id)===true;
export function getWeekSevenEpisode(game:GameState):Episode|null {
 const e=weekSevenEpisodes[game.day];if(!e)return null;
 if(game.day===45&&has(game,'week-six-44-meet'))return {...e,prompt:'Bác Bình kể về buổi chăm cây. Cô Thu muốn góp ý cách đón khách.'};
 if(game.day===47&&has(game,key(45,'meet')))return {...e,prompt:'Cô Thu đã giúp bạn mở sổ góp ý. Linh muốn ghi khẩu vị ít ngọt.'};
 if(game.day===49&&has(game,key(48,'meet')))return {...e,prompt:'Sau khi nhập đường từ cô Hạnh, bạn có thời gian nghe bố kể chuyện.'};
 if(game.day===51&&has(game,key(50,'message')))return {...e,prompt:'Thảo đã gửi ảnh góc phố. Mẹ Mai rủ bạn chuẩn bị bữa trưa.'};
 return e;
}
export function getWeekSevenDecision(game:GameState):WeekSevenChoice|null {
 return choices.find(c=>has(game,key(game.day,c)))??null;
}
export function getWeekSevenCallback(game:GameState):string|null {
 const e=weekSevenEpisodes[game.day-1],c=choices.find(x=>has(game,key(game.day-1,x)));
 return e&&c?e[c].callback:null;
}
export function getWeekSevenRecap(game:GameState):string|null {
 if(game.day!==51)return null;
 const stock=has(game,key(48,'meet'))?'Kho có thêm đường mua ở chợ.':'Bạn vẫn theo dõi giá nguyên liệu.';
 const friends=has(game,key(50,'meet'))?'Nhóm bạn chia rõ tiền ăn.':has(game,key(50,'message'))?'Nhóm bạn đi dạo không tốn tiền.':'Bạn có thể hẹn bạn bè tuần tới.';
 const family=has(game,key(51,'meet'))?'Bạn cùng mẹ nấu bữa mới.':has(game,key(51,'message'))?'Bạn ăn cơm có sẵn, không lãng phí.':'Bữa cơm nhà vẫn đang đợi.';
 return [stock,friends,family].join(' ');
}
export function canChooseWeekSeven(game:GameState,choice:WeekSevenChoice):boolean {
 const e=weekSevenEpisodes[game.day];
 if(!e||!choices.includes(choice)||game.phase!=='prep'||game.morning.day!==game.day||game.morning.step!=='finished'||getWeekSevenDecision(game))return false;
 const o=e[choice];
 if(!Number.isFinite(game.cash)||!Number.isFinite(game.city.minutes)||!Number.isFinite(game.city.energy)||!Number.isFinite(game.inventory.sugar)||!Number.isFinite(game.morning.satiety))return false;
 if(choice==='message')return true;
 return game.cash>=o.cost&&game.city.energy>=Math.max(0,-o.energy)&&game.city.minutes+o.minutes<=Math.min(1260,e.meetBefore);
}
export function chooseWeekSeven(game:GameState,choice:WeekSevenChoice):GameState {
 if(!choices.includes(choice)||!weekSevenEpisodes[game.day]||game.phase!=='prep'||game.morning.day!==game.day||game.morning.step!=='finished'||getWeekSevenDecision(game))return game;
 if(!canChooseWeekSeven(game,choice))return {...game,notice:'Đã qua giờ hẹn hoặc chưa đủ tiền, sức. Bạn vẫn có thể nhắn miễn phí.'};
 const e=weekSevenEpisodes[game.day],o=e[choice],id=key(game.day,choice);
 return {...game,cash:game.cash-o.cost,fans:game.fans+o.fans,
 inventory:o.stockSugar>0?{...game.inventory,sugar:game.inventory.sugar+o.stockSugar}:game.inventory,
 city:{...game.city,minutes:Math.min(1260,game.city.minutes+o.minutes),energy:Math.min(100,Math.max(0,game.city.energy+o.energy)),goodwill:game.city.goodwill+o.goodwill,journal:[`Ngày ${game.day}: ${o.reply}`,...game.city.journal].slice(0,24)},
 morning:{...game.morning,satiety:Math.min(100,Math.max(0,game.morning.satiety+o.satiety))},
 relationshipRewardIds:[...(game.relationshipRewardIds??[]),id],
 storyLog:[{id,customerId:e.characterId,customerName:e.character,title:e.title,text:o.reply,day:game.day,rewardFans:0},...game.storyLog].slice(0,24),notice:o.reply};
}
