import type { GameState, InventoryKey, BaseId } from './types';
import { CITY_PLACES, nearCityPlace, type CityPlace } from './cityMap';
import type { Position } from './service';
import {hydrateStories,initialStories,type NeighborhoodStories} from './neighborhoodStories';
import {hydrateLife,initialLife,resetLifeDay,type CityLife} from './cityLife';

export type CityProject = 'trees' | 'lights' | 'club';
export interface TeaContract {
  id: string; destination: CityPlace; base: BaseId; sugar: number; count: number;
  reward: number; deadline: number; packed: boolean;
}
export interface CityState {
  day: number; minutes: number; energy: number; goodwill: number;
  visited: CityPlace[]; talked: CityPlace[]; completed: CityPlace[];
  errands: string[]; projects: CityProject[]; contract: TeaContract | null;
  deliveries: number; income: number; journal: string[];
  stories:NeighborhoodStories;
  life:CityLife;
}
export const CITY_PROJECTS = [
  { id: 'trees' as const, name: 'Hàng cây trước tiệm', cost: 90000, detail: 'Trồng thêm cây sấu. Chăm vườn nhận thêm 2 thiện cảm.' },
  { id: 'lights' as const, name: 'Đèn phố buổi tối', cost: 120000, detail: 'Thắp sáng lối đi. Đơn giao trà trả thêm 10%.' },
  { id: 'club' as const, name: 'Câu lạc bộ trà trong xóm', cost: 180000, detail: 'Cần 12 thiện cảm. Mỗi ngày mới thêm 3 fan cho tiệm.' },
];
export type MarketBasket = 'full' | 'budget';
export interface MarketOffer {
  id: MarketBasket;
  title: string;
  detail: string;
  cost: number;
  minutes: number;
  energy: number;
  stock: readonly (readonly [InventoryKey, number])[];
}
const FULL_MARKET_STOCK: MarketOffer['stock'] = [
  ['classicMilkTea', 8], ['peachTea', 6], ['cupsM', 12], ['sugar', 8], ['ice', 12],
];
const BUDGET_MARKET_STOCK: MarketOffer['stock'] = [
  ['classicMilkTea', 5], ['peachTea', 4], ['cupsM', 8], ['sugar', 6], ['ice', 8],
];
const DAY10_FULL_ID = 'market.day10.full';
const DAY11_HELP_ID = 'market.day11.help';
const DAY11_HURRY_ID = 'market.day11.hurry';
const DAY12_SCHOOL_PREFIX = 'school.day12.';
const DAY13_FAIR_PREFIX = 'school.day13.';
const DAY14_APARTMENT_PREFIX = 'apartments.day14.';
const DAY15_LIBRARY_PREFIX = 'library.day15.';
const DAY16_LAKE_PREFIX = 'lake.day16.';
export type ApartmentChoice = 'carry' | 'coordinate';
export type LibraryChoice = 'brew' | 'organize';
export type LakeChoice = 'cover' | 'move';
export type SchoolChoice = 'gift' | 'sell' | 'reschedule';
export type SchoolFairChoice = 'paint' | 'share';

/** Day 10 price shock with two real stock/cash outcomes. A full basket
 * earns one next-day supplier discount, persisted in the existing v3 ledger.
 * No new save fields, no random prices on reload.
 */
export function getMarketOffers(state: Pick<GameState, 'day' | 'relationshipRewardIds'>): MarketOffer[] {
  const loyalDiscount = state.day === 11 && state.relationshipRewardIds.includes(DAY10_FULL_ID) ? 4000 : 0;
  const supplierDiscount = state.day === 12 && state.relationshipRewardIds.includes(DAY11_HELP_ID) ? 6000 : 0;
  const regular: MarketOffer = {
    id: 'full', title: 'Gói nguyên liệu của cô Hạnh',
    detail: loyalDiscount
      ? 'Cô Hạnh nhớ bạn đã giữ đơn hôm qua, giảm 4.000 ₫ cho lần nhập hôm nay.'
      : supplierDiscount
        ? 'Cô Hạnh cảm ơn bạn đã dọn quầy hôm qua: giảm 6.000 ₫ cho giỏ hôm nay.'
        : 'Đủ trà, ly, đường và đá để bổ sung cho ca bán.',
    cost: 48000 - loyalDiscount - supplierDiscount, minutes: 15, energy: 8, stock: FULL_MARKET_STOCK,
  };
  if (state.day !== 10) return [regular];
  return [
    { ...regular, title: 'Giữ đủ giỏ hàng',
      detail: 'Giá chợ tăng hôm nay. Nhập đủ số lượng, cô Hạnh hẹn giảm 4.000 ₫ cho ngày 11.',
      cost: 60000 },
    { id: 'budget', title: 'Giỏ tiết kiệm',
      detail: 'Chi ít hơn nhưng số ly và trà nhập được cũng ít hơn. Vẫn có thể mua ở kho sau.',
      cost: 36000, minutes: 15, energy: 8, stock: BUDGET_MARKET_STOCK },
  ];
}

export function initialCity(day = 1): CityState {
  return { day, minutes: 480, energy: 100, goodwill: 0, visited: ['shop'], talked: [], completed: [], errands: [], projects: [], contract: null, deliveries: 0, income: 0, journal: ['Tiệm Phố Nhỏ mở cửa tại khu An Hòa, Hà Nội.'],stories:initialStories(),life:initialLife() };
}
export function newCityDay(city: CityState, day: number): CityState {
  return { ...city, day, minutes: 480, energy: 100, talked: [], completed: [], errands: [], contract: null,life:resetLifeDay(city.life) };
}
export function hydrateCity(value: Partial<CityState> | undefined, day: number): CityState {
  const initial = initialCity(day);
  if (!value || typeof value !== 'object') return initial;
  const finite = (n: unknown, fallback: number, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
  const places = (a: unknown, fallback: CityPlace[] = []) => Array.isArray(a) ? [...new Set(a.filter(p => typeof p === 'string' && Object.hasOwn(CITY_PLACES,p)))] as CityPlace[] : fallback;
  const projects = Array.isArray(value.projects) ? [...new Set(value.projects.filter(p => CITY_PROJECTS.some(project => project.id === p)))] : [];
  const c = value.contract;
  const contract = c && typeof c === 'object' && typeof c.id==='string' && Object.hasOwn(CITY_PLACES,c.destination) && Object.hasOwn(baseKey,c.base) && Number.isFinite(c.deadline) && c.deadline<=1440 && Number.isFinite(c.reward) && c.reward>0 && c.reward<=120000 && Number.isInteger(c.count) && c.count > 0 && c.count <= 10 && c.sugar >= 0 && c.sugar <= 100 ? c : null;
  const city: CityState = { ...initial, minutes: finite(value.minutes, 480, 360, 1260), energy: finite(value.energy, 100, 0, 100), goodwill: finite(value.goodwill, 0, 0, 100000), deliveries: finite(value.deliveries, 0, 0, 100000), income: finite(value.income, 0, 0, 1e12), visited: places(value.visited, ['shop']), talked: places(value.talked), completed: places(value.completed), projects, contract, errands: Array.isArray(value.errands) ? value.errands.filter(e => e === 'market' || e === 'garden') : [], journal: Array.isArray(value.journal) ? value.journal.filter(s => typeof s === 'string').slice(0, 24) : initial.journal };
  city.stories=hydrateStories(value.stories);
  city.life=hydrateLife(value.life);
  return value.day !== day ? newCityDay(city, day) : city;
}
export function cityTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;
}
export function cityWeather(day: number) {
  return day % 4 === 0 ? { name: 'Mưa phùn', rain: true, temperature: 22 } : day % 4 === 2 ? { name: 'Trời se lạnh', rain: false, temperature: 23 } : { name: 'Nắng nhẹ', rain: false, temperature: 27 };
}
export function cityContracts(state: GameState): TeaContract[] {
  const lanReferral = state.day === 13 && state.relationshipRewardIds.includes('school.day12.gift')
    ? 12000 : state.day === 13 && state.relationshipRewardIds.includes('school.day12.sell') ? 6000 : 0;
  const fairReferral = state.day === 14 && state.relationshipRewardIds.includes('school.day13.paint')
    ? 8000 : state.day === 14 && state.relationshipRewardIds.includes('school.day13.share') ? 3000 : 0;
  const apartmentReferral = state.day === 15 && state.relationshipRewardIds.includes('apartments.day14.carry')
    ? 10000 : state.day === 15 && state.relationshipRewardIds.includes('apartments.day14.coordinate') ? 4000 : 0;
  const libraryReferral = state.day === 16 && state.relationshipRewardIds.includes('library.day15.brew')
    ? 8000 : state.day === 16 && state.relationshipRewardIds.includes('library.day15.organize') ? 3000 : 0;
  const lakeReferral = state.day === 17 && state.relationshipRewardIds.includes('lake.day16.cover')
    ? 7000 : state.day === 17 && state.relationshipRewardIds.includes('lake.day16.move') ? 3000 : 0;
  return [
    { id: `${state.day}-school`, destination: 'school', base: 'peach-tea', sugar: 50, count: 3, reward: 82000 + lanReferral + fairReferral, deadline: 120, packed: false },
    { id: `${state.day}-apartments`, destination: 'apartments', base: 'classic-milk-tea', sugar: 75, count: 4, reward: 108000 + apartmentReferral + lakeReferral, deadline: 150, packed: false },
    { id: `${state.day}-library`, destination: 'library', base: 'oolong-milk-tea', sugar: 25, count: 3, reward: 96000 + libraryReferral, deadline: 150, packed: false },
  ].filter(c => state.unlockedBaseIds.includes(c.base as BaseId)) as TeaContract[];
}
const baseKey: Record<BaseId, InventoryKey> = { 'classic-milk-tea': 'classicMilkTea', 'peach-tea': 'peachTea', 'matcha-latte': 'matchaLatte', 'oolong-milk-tea': 'oolongMilkTea', 'taro-milk-tea': 'taroMix', 'strawberry-milk': 'strawberryMilk', 'cocoa-milk': 'cocoaMilk', 'lemon-tea': 'lemonTea' };
export type CityAction =
  | { type: 'accept'; destination: CityPlace }
  | { type: 'pack'; base: BaseId; sugar: number; timing: number }
  | { type: 'deliver' } | { type: 'cancel' }
  | { type: 'market'; basket?: MarketBasket } | { type: 'supplier'; choice: 'help' | 'hurry' }
  | { type: 'school'; choice: SchoolChoice } | { type: 'schoolFair'; choice: SchoolFairChoice } | { type: 'apartmentMeet'; choice: ApartmentChoice } | { type: 'libraryCorner'; choice: LibraryChoice } | { type: 'lakeRain'; choice: LakeChoice } | { type: 'talk'; place: CityPlace }
  | { type: 'garden' } | { type: 'rest'; place?:CityPlace }
  | { type: 'bus' }
  | { type: 'project'; id: CityProject };
function result(state: GameState, city: CityState, notice: string, patch: Partial<GameState> = {}): GameState {
  return { ...state, ...patch, city: { ...city, journal: [`Ngày ${state.day} · ${cityTime(city.minutes)} · ${notice}`, ...city.journal].slice(0, 24) }, notice };
}
export function walkCity(state: GameState, distance: number, position: Position): GameState {
  if (!Number.isFinite(distance) || distance <= 0) return state;
  const city = state.city;
  const visited = Object.keys(CITY_PLACES).filter(p => nearCityPlace(position, p as CityPlace)) as CityPlace[];
  return { ...state, city: { ...city, minutes: Math.min(1260, city.minutes + distance / 6), energy: Math.max(0, city.energy - distance * 0.12), visited: [...new Set([...city.visited, ...visited])],life:{...city.life,today:{...city.life.today,places:[...new Set([...city.life.today.places,...visited])]}} } };
}
export function cityAction(state: GameState, action: CityAction, position: Position): GameState {
  const city = state.city;
  if (state.phase === 'open') return { ...state, notice: 'Khách trong tiệm đang chờ. Hoàn tất ca rồi hãy đi phố nhé.' };
  if (action.type === 'accept') {
    if (city.contract) return { ...state, notice: 'Hoàn thành hoặc hủy chuyến đang nhận trước.' };
    const contract = cityContracts(state).find(c => c.destination === action.destination);
    if (!contract || city.completed.includes(contract.destination)) return state;
    if (city.minutes >= 1080) return { ...state, notice: 'Đã hết giờ nhận đơn đặt trước. Ngày mai lại nhé.' };
    return result(state, { ...city, contract: { ...contract, deadline: city.minutes + contract.deadline } }, 'Đã nhận đơn. Về quầy pha đúng trà, đường và đóng túi.');
  }
  if (action.type === 'cancel') return result(state, { ...city, contract: null }, 'Đã hủy chuyến. Nguyên liệu đã pha không hoàn lại.');
  const place: CityPlace = action.type === 'pack' ? 'shop' : action.type === 'deliver' ? city.contract?.destination ?? 'shop' : (action.type === 'market' || action.type === 'supplier') ? 'market' : (action.type === 'school' || action.type === 'schoolFair') ? 'school' : action.type === 'apartmentMeet' ? 'apartments' : action.type === 'libraryCorner' ? 'library' : action.type === 'lakeRain' ? 'lake' : action.type === 'garden' || action.type === 'project' ? 'park' : action.type === 'rest' ? (action.place&&['lake','plaza','riverside','temple'].includes(action.place)?action.place:'lake') : action.type === 'bus' ? 'bus' : action.place;
  if (!nearCityPlace(position, place)) return { ...state, notice: `Đi đến ${CITY_PLACES[place].name} để thực hiện.` };
  if (city.minutes < CITY_PLACES[place].hours[0] || city.minutes > CITY_PLACES[place].hours[1]) return { ...state, notice: 'Địa điểm đã đóng cửa. Quay lại vào ngày mai.' };
  if (action.type === 'bus') {
    if (state.cash < 7000) return { ...state, notice: 'Cần 7.000 ₫ để đi xe buýt.' };
    return result(state, { ...city, minutes: Math.min(1260, city.minutes + 10), energy: Math.min(100, city.energy + 5) }, 'Xe buýt đưa bạn về tiệm. Vé 7.000 ₫, 10 phút trong game.', { cash: state.cash - 7000 });
  }
  if (action.type === 'rest') {
    if (city.energy >= 100) return { ...state, notice: 'Bạn đã đủ sức. Đi một vòng phố nhé.' };
    return result(state, { ...city, energy: Math.min(100, city.energy + 35), minutes: Math.min(1260, city.minutes + 20) }, `Nghỉ tại ${CITY_PLACES[place].name} 20 phút. Hồi 35 sức lực.`);
  }
  if (action.type === 'supplier') {
    // One Day-11 choice, persisted in the existing v3 reward ledger.
    if (state.day !== 11 || state.relationshipRewardIds.some(id => id === DAY11_HELP_ID || id === DAY11_HURRY_ID)) return state;
    const help = action.choice === 'help';
    const minutes = help ? 20 : 5;
    const energy = help ? 12 : 2;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.market.hours[1])) {
      return { ...state, notice: 'Không đủ thời gian hoặc sức lực. Bạn có thể nghỉ chân và quay lại chợ sớm hơn.' };
    }
    const rewardId = help ? DAY11_HELP_ID : DAY11_HURRY_ID;
    const inventory = help ? state.inventory : { ...state.inventory, cupsM: state.inventory.cupsM + 2 };
    const freshness = help ? state.freshness : {
      ...state.freshness,
      cupsM: (state.inventory.cupsM * state.freshness.cupsM + 200) / (state.inventory.cupsM + 2),
    };
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + (help ? 3 : 0),
    }, help
      ? 'Bạn giúp cô Hạnh dọn quầy 20 phút. Thêm 3 thiện cảm; ngày mai cô giảm 6.000 ₫ giỏ hàng.'
      : 'Bạn xin về tiệm sớm. Cô Hạnh gửi thêm 2 ly M dự phòng, tiết kiệm thời gian cho ca bán.',
    { inventory, freshness, relationshipRewardIds: [...state.relationshipRewardIds, rewardId] });
  }
  if (action.type === 'school') {
    // QG-08: a rainy-day order for Lan's classroom. One decision per Day 12,
    // persisted in the existing v3 reward ledger and recalled by Day 13 orders.
    if (state.day !== 12 || state.relationshipRewardIds.some(id => id.startsWith(DAY12_SCHOOL_PREFIX))) return state;
    if (city.contract) return { ...state, notice: 'Hãy hoàn tất chuyến giao đang nhận trước khi gặp Lan.' };
    const gift = action.choice === 'gift', sell = action.choice === 'sell';
    const serve = gift || sell;
    const minutes = gift ? 20 : sell ? 12 : 3;
    const energy = gift ? 10 : sell ? 6 : 1;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.school.hours[1])) {
      return { ...state, notice: 'Không đủ sức hoặc thời gian trước khi sân trường đóng cửa.' };
    }
    const needs: Partial<Record<InventoryKey, number>> = { peachTea: 2, cupsM: 2, sugar: 1, ice: 2 };
    if (serve && Object.entries(needs).some(([key, count]) =>
      state.inventory[key as InventoryKey] < (count ?? 0) || state.freshness[key as InventoryKey] < 20)) {
      return { ...state, notice: 'Cần 2 phần trà đào tươi, 2 ly M, đường và đá. Có thể hẹn Lan ngày khác.' };
    }
    const inventory = { ...state.inventory };
    if (serve) for (const [key, count] of Object.entries(needs)) inventory[key as InventoryKey] -= count ?? 0;
    const revenue = sell ? 38000 : 0;
    const goodwill = gift ? 4 : sell ? 1 : 0;
    const fans = gift ? 3 : sell ? 2 : 0;
    const notice = gift
      ? 'Bạn tặng nhóm Lan 2 ly trà đào giữa cơn mưa. Thêm 4 thiện cảm; ngày 13 nhóm giới thiệu một đơn lớn hơn.'
      : sell
        ? 'Bạn bán 2 ly trà đào giá nhóm 38.000 ₫. Lan hẹn giới thiệu thêm khách vào ngày 13.'
        : 'Bạn nói thật là chưa kịp pha. Lan cảm ơn và hẹn lần sau, không mất nguyên liệu.';
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + goodwill, income: city.income + revenue,
      deliveries: city.deliveries + (serve ? 1 : 0),
      life: serve ? { ...city.life, today: { ...city.life.today, deliveries: city.life.today.deliveries + 1 } } : city.life,
    }, notice, {
      inventory, cash: state.cash + revenue, fans: state.fans + fans,
      relationshipRewardIds: [...state.relationshipRewardIds, `${DAY12_SCHOOL_PREFIX}${action.choice}`],
    });
  }
  if (action.type === 'schoolFair') {
    // QG-09: Lan's Day-13 class-fair sign. A modest cash/time tradeoff
    // changes only Day-14 school demand; the existing v3 ledger prevents replay.
    if (state.day !== 13 || state.relationshipRewardIds.some(id => id.startsWith(DAY13_FAIR_PREFIX))) return state;
    if (city.contract) return { ...state, notice: 'Hoàn tất chuyến giao đang nhận rồi hãy giúp Lan.' };
    const paint = action.choice === 'paint';
    const minutes = paint ? 20 : 5;
    const energy = paint ? 12 : 2;
    const cost = paint ? 8000 : 0;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.school.hours[1]) || state.cash < cost) {
      return { ...state, notice: 'Chưa đủ thời gian, sức hoặc tiền mua màu vẽ. Có thể chia sẻ thực đơn thay vì vẽ bảng.' };
    }
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + (paint ? 4 : 1),
    }, paint
      ? 'Bạn ở lại vẽ bảng cho hội chợ lớp Lan, mua màu 8.000 ₫. Thêm 4 thiện cảm và 2 fan; ngày 14 nhóm đặt trà nhiều hơn.'
      : 'Bạn đưa Lan thực đơn của tiệm để nhóm tự chia sẻ. Thêm 1 thiện cảm và 1 fan; ngày 14 có đơn nhỏ hơn.',
    { cash: state.cash - cost, fans: state.fans + (paint ? 2 : 1),
      relationshipRewardIds: [...state.relationshipRewardIds, `${DAY13_FAIR_PREFIX}${action.choice}`] });
  }
  if (action.type === 'apartmentMeet') {
    // QG-10: Day-14 meeting at the apartment block; exactly-once Day-15 referral.
    if (state.day !== 14 || state.relationshipRewardIds.some(id => id.startsWith(DAY14_APARTMENT_PREFIX))) return state;
    if (city.contract) return { ...state, notice: 'Hoàn tất chuyến giao đang nhận trước khi giúp cô Thu.' };
    const carry = action.choice === 'carry';
    const minutes = carry ? 22 : 6;
    const energy = carry ? 12 : 2;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.apartments.hours[1])) {
      return { ...state, notice: 'Không đủ thời gian hoặc sức lực trước giờ họp. Có thể nghỉ chân rồi quay lại.' };
    }
    const needs: Partial<Record<InventoryKey, number>> = { classicMilkTea: 2, cupsM: 2, sugar: 1, ice: 2 };
    if (carry && Object.entries(needs).some(([key, count]) =>
      state.inventory[key as InventoryKey] < (count ?? 0) || state.freshness[key as InventoryKey] < 20)) {
      return { ...state, notice: 'Cần 2 phần trà sữa tươi, 2 ly M, đường và đá. Bạn vẫn có thể nhờ hàng xóm hỗ trợ.' };
    }
    const inventory = { ...state.inventory };
    if (carry) for (const [key, count] of Object.entries(needs)) inventory[key as InventoryKey] -= count ?? 0;
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + (carry ? 4 : 1),
    }, carry
      ? 'Bạn mang 2 ly trà sữa và cùng cô Thu kê ghế lên tầng. Thêm 4 thiện cảm, 2 fan; ngày 15 khu tập thể đặt thêm trà.'
      : 'Bạn gọi hàng xóm cùng chuẩn bị ghế và nước uống. Thêm 1 thiện cảm, 1 fan; ngày 15 có thêm một đơn nhỏ.',
    { inventory, fans: state.fans + (carry ? 2 : 1),
      relationshipRewardIds: [...state.relationshipRewardIds, `${DAY14_APARTMENT_PREFIX}${action.choice}`] });
  }
  if (action.type === 'libraryCorner') {
    // QG-11: Day-15 reading corner with anh Nam. Only Day-16 library demand changes.
    if (state.day !== 15 || state.relationshipRewardIds.some(id => id.startsWith(DAY15_LIBRARY_PREFIX))) return state;
    if (city.contract) return { ...state, notice: 'Hoàn tất chuyến giao đang nhận rồi hãy giúp anh Nam.' };
    const brew = action.choice === 'brew';
    const minutes = brew ? 18 : 6;
    const energy = brew ? 10 : 2;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.library.hours[1])) {
      return { ...state, notice: 'Không đủ sức hoặc thời gian trước khi hiệu sách đóng cửa. Bạn có thể nghỉ rồi quay lại sớm hơn.' };
    }
    if (brew && !state.unlockedBaseIds.includes('oolong-milk-tea')) {
      return { ...state, notice: 'Bạn chưa mở công thức ô long. Vẫn có thể giúp anh Nam xếp sách.' };
    }
    const needs: Partial<Record<InventoryKey, number>> = { oolongMilkTea: 2, cupsM: 2, sugar: 1, ice: 2 };
    if (brew && Object.entries(needs).some(([key, count]) =>
      state.inventory[key as InventoryKey] < (count ?? 0) || state.freshness[key as InventoryKey] < 20)) {
      return { ...state, notice: 'Cần 2 phần ô long tươi, 2 ly M, đường và đá. Thiếu hàng vẫn có thể giúp xếp sách.' };
    }
    const inventory = { ...state.inventory };
    if (brew) for (const [key, count] of Object.entries(needs)) inventory[key as InventoryKey] -= count ?? 0;
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + (brew ? 3 : 1),
    }, brew
      ? 'Bạn pha 2 ly ô long cho góc đọc sách của anh Nam. Thêm 3 thiện cảm, 2 fan; đơn hiệu sách Ngày 16 tăng 8.000 ₫.'
      : 'Bạn giúp anh Nam xếp sách và dán lịch đọc. Thêm 1 thiện cảm, 1 fan; đơn hiệu sách Ngày 16 tăng 3.000 ₫.',
    { inventory, fans: state.fans + (brew ? 2 : 1),
      relationshipRewardIds: [...state.relationshipRewardIds, `${DAY15_LIBRARY_PREFIX}${action.choice}`] });
  }
  if (action.type === 'lakeRain') {
    // QG-12: Day-16 drizzle at An Hoa lake. One choice; Day-17 apartment demand only.
    if (state.day !== 16 || state.relationshipRewardIds.some(id => id.startsWith(DAY16_LAKE_PREFIX))) return state;
    if (city.contract) return { ...state, notice: 'Hãy hoàn tất chuyến giao đang nhận rồi giúp bác Minh.' };
    const cover = action.choice === 'cover';
    const minutes = cover ? 18 : 6;
    const energy = cover ? 10 : 2;
    const cost = cover ? 9000 : 0;
    if (city.energy < energy || city.minutes + minutes > Math.min(1260, CITY_PLACES.lake.hours[1]) || state.cash < cost) {
      return { ...state, notice: 'Chưa đủ tiền mua bạt, sức hoặc thời gian. Bạn vẫn có thể nhắn mọi người chuyển vào mái hiên.' };
    }
    return result(state, {
      ...city, minutes: city.minutes + minutes, energy: city.energy - energy,
      goodwill: city.goodwill + (cover ? 3 : 1),
    }, cover
      ? 'Bạn mua bạt 9.000 ₫ và cùng bác Minh che chỗ nghỉ khi mưa phùn. Thêm 3 thiện cảm, 2 fan; ngày 17 cô Thu đặt thêm trà.'
      : 'Bạn nhắn mọi người chuyển buổi đi bộ vào mái hiên an toàn. Thêm 1 thiện cảm, 1 fan; ngày 17 có thêm đơn trà nhỏ.',
    { cash: state.cash - cost, fans: state.fans + (cover ? 2 : 1),
      relationshipRewardIds: [...state.relationshipRewardIds, `${DAY16_LAKE_PREFIX}${action.choice}`] });
  }
  if (city.energy < 8) return { ...state, notice: 'Bạn mệt rồi. Ghé hồ nghỉ chân để hồi sức.' };
  if (action.type === 'pack') {
    const c = city.contract;
    if (!c || c.packed) return state;
    if (city.minutes + 10 > c.deadline) return { ...state, notice: 'Không còn đủ 10 phút để pha đơn. Hủy chuyến để nhận đơn khác.' };
    if (action.base !== c.base || action.sugar !== c.sugar || !Number.isFinite(action.timing) || action.timing < 65) return { ...state, notice: 'Kiểm tra đúng loại trà, lượng đường và canh rót đạt ít nhất 65 điểm.' };
    const costs: Partial<Record<InventoryKey, number>> = { [baseKey[c.base]]: c.count, cupsM: c.count, sugar: c.count * c.sugar / 100, ice: c.count };
    if (Object.entries(costs).some(([k, n]) => state.inventory[k as InventoryKey] < n || state.freshness[k as InventoryKey] < 20)) return { ...state, notice: 'Thiếu nguyên liệu tươi hoặc ly M. Bổ sung ở kho hoặc mua tại chợ.' };
    const inventory = { ...state.inventory };
    Object.entries(costs).forEach(([k, n]) => inventory[k as InventoryKey] -= n);
    return result(state, { ...city, minutes: city.minutes + 10, energy: city.energy - 8, contract: { ...c, packed: true } }, `Đã pha và đóng ${c.count} ly. Mang túi đến ${CITY_PLACES[c.destination].name}.`, { inventory });
  }
  if (action.type === 'deliver') {
    const c = city.contract;
    if (!c?.packed) return { ...state, notice: 'Pha và đóng túi tại quầy trước khi giao.' };
    if (city.minutes > c.deadline) return { ...state, notice: 'Đơn quá hẹn. Hủy chuyến hoặc về tiệm; lần tới giao sớm hơn nhé.' };
    const reward = Math.round(c.reward * (city.projects.includes('lights') ? 1.1 : 1));
    return result(state, { ...city, contract: null, completed: [...city.completed, c.destination], goodwill: city.goodwill + 3, deliveries: city.deliveries + 1, income: city.income + reward, energy: city.energy - 5,life:{...city.life,today:{...city.life.today,deliveries:city.life.today.deliveries+1}} }, `Giao đủ ${c.count} ly. Nhận ${reward.toLocaleString('vi-VN')} ₫ và 3 thiện cảm.`, { cash: state.cash + reward, fans: state.fans + c.count, reputation: state.reputation + 1 });
  }
  if (action.type === 'market') {
    if (city.errands.includes('market')) return { ...state, notice: 'Cô Hạnh đã bán phần hàng hôm nay. Ngày mai ghé lại nhé.' };
    const offer = getMarketOffers(state).find(item => item.id === (action.basket ?? 'full'));
    if (!offer) return state; // Budget basket is only available on day 10.
    if (state.cash < offer.cost) return { ...state, notice: `Cần ${offer.cost.toLocaleString('vi-VN')} ₫ để mua giỏ này.` };
    if (city.energy < offer.energy || city.minutes + offer.minutes > Math.min(1260, CITY_PLACES.market.hours[1])) {
      return { ...state, notice: 'Đã muộn hoặc bạn không đủ sức để mua hàng. Hãy nghỉ và quay lại sớm hơn.' };
    }
    const inventory = { ...state.inventory }, freshness = { ...state.freshness };
    for (const [key, count] of offer.stock) {
      freshness[key] = (inventory[key] * freshness[key] + count * 100) / (inventory[key] + count);
      inventory[key] += count;
    }
    const decisionId = state.day === 10 ? `market.day10.${offer.id}` : null;
    const relationshipRewardIds = decisionId && !state.relationshipRewardIds.includes(decisionId)
      ? [...state.relationshipRewardIds, decisionId] : state.relationshipRewardIds;
    return result(state, {
      ...city, errands: [...city.errands, 'market'],
      minutes: city.minutes + offer.minutes, energy: city.energy - offer.energy,
    }, `Đã mua ${offer.title.toLowerCase()} với giá ${offer.cost.toLocaleString('vi-VN')} ₫. ${offer.detail}`,
    { cash: state.cash - offer.cost, inventory, freshness, relationshipRewardIds });
  }
  if (action.type === 'talk') {
    if (city.talked.includes(place)) return { ...state, notice: 'Bạn đã trò chuyện ở đây hôm nay. Mai ghé lại nhé.' };
    const lines: Record<CityPlace, string> = { shop: 'Hàng xóm hẹn ghé uống trà sau giờ làm.', market: 'Cô Hạnh: Sáng mai cô giữ trà ngon cho cháu.', school: 'Lan: Trà đào ít đường hợp với nhóm mình lắm!', apartments: 'Cô Thu: Cả khu lại có một chỗ ngồi chuyện trò.', library: 'Anh Nam: Trà ô long rất hợp một buổi đọc sách.', lake: 'Bác Minh: Hà Nội se lạnh, một ly trà ấm là vừa.', park: 'Bác tổ trưởng: Cảm ơn cháu đã quan tâm đến xóm.', bus: 'Chú lái xe: Qua đường nhớ nhìn cả hai bên cháu nhé.', oldtown:'Cô bán gốm: Chậm thôi cháu, ngắm kỹ mới thấy nét đẹp của phố.', plaza:'Nhóm nhạc: Tối nay ra đây nghe chúng mình chơi nhé!', riverside:'Người đi bộ: Gió mát quá, thêm ly trà là trọn buổi chiều.', temple:'Bác trông đình: Giữ sân sạch để các cháu còn chơi nhé.' };
    return result(state, { ...city, talked: [...city.talked, place], goodwill: city.goodwill + 1, minutes: city.minutes + 5, energy: city.energy - 2 }, lines[place], { fans: state.fans + 1 });
  }
  if (action.type === 'garden') {
    if (city.errands.includes('garden')) return { ...state, notice: 'Vườn hoa đã được chăm hôm nay.' };
    const gain = city.projects.includes('trees') ? 4 : 2;
    return result(state, { ...city, errands: [...city.errands, 'garden'], goodwill: city.goodwill + gain, minutes: city.minutes + 15, energy: city.energy - 8 }, `Đã tưới cây và dọn vườn. Thêm ${gain} thiện cảm và 2 fan.`, { fans: state.fans + 2 });
  }
  const project = CITY_PROJECTS.find(p => p.id === action.id);
  if (!project || city.projects.includes(project.id)) return state;
  if (state.cash < project.cost || (project.id === 'club' && city.goodwill < 12)) return { ...state, notice: 'Chưa đủ tiền hoặc thiện cảm để thực hiện dự án.' };
  return result(state, { ...city, projects: [...city.projects, project.id], goodwill: city.goodwill + 2 }, `Hoàn tất: ${project.name}. Khu phố và tiệm cùng phát triển.`, { cash: state.cash - project.cost });
}
