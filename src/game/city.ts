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
  return [
    { id: `${state.day}-school`, destination: 'school', base: 'peach-tea', sugar: 50, count: 3, reward: 82000, deadline: 120, packed: false },
    { id: `${state.day}-apartments`, destination: 'apartments', base: 'classic-milk-tea', sugar: 75, count: 4, reward: 108000, deadline: 150, packed: false },
    { id: `${state.day}-library`, destination: 'library', base: 'oolong-milk-tea', sugar: 25, count: 3, reward: 96000, deadline: 150, packed: false },
  ].filter(c => state.unlockedBaseIds.includes(c.base as BaseId)) as TeaContract[];
}
const baseKey: Record<BaseId, InventoryKey> = { 'classic-milk-tea': 'classicMilkTea', 'peach-tea': 'peachTea', 'matcha-latte': 'matchaLatte', 'oolong-milk-tea': 'oolongMilkTea', 'taro-milk-tea': 'taroMix', 'strawberry-milk': 'strawberryMilk', 'cocoa-milk': 'cocoaMilk', 'lemon-tea': 'lemonTea' };
export type CityAction =
  | { type: 'accept'; destination: CityPlace }
  | { type: 'pack'; base: BaseId; sugar: number; timing: number }
  | { type: 'deliver' } | { type: 'cancel' }
  | { type: 'market' } | { type: 'talk'; place: CityPlace }
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
  const place: CityPlace = action.type === 'pack' ? 'shop' : action.type === 'deliver' ? city.contract?.destination ?? 'shop' : action.type === 'market' ? 'market' : action.type === 'garden' || action.type === 'project' ? 'park' : action.type === 'rest' ? (action.place&&['lake','plaza','riverside','temple'].includes(action.place)?action.place:'lake') : action.type === 'bus' ? 'bus' : action.place;
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
    if (city.errands.includes('market')) return { ...state, notice: 'Cô Hạnh đã bán phần hàng ưu đãi hôm nay.' };
    const cost = 48000;
    if (state.cash < cost) return { ...state, notice: 'Cần 48.000 ₫ để mua gói nguyên liệu.' };
    const inventory = { ...state.inventory }, freshness = { ...state.freshness };
    for (const [key, count] of [['classicMilkTea', 8], ['peachTea', 6], ['cupsM', 12], ['sugar', 8], ['ice', 12]] as [InventoryKey, number][]) {
      freshness[key] = (inventory[key] * freshness[key] + count * 100) / (inventory[key] + count);
      inventory[key] += count;
    }
    return result(state, { ...city, errands: [...city.errands, 'market'], minutes: city.minutes + 15, energy: city.energy - 8 }, 'Nhập hàng chợ: 8 trà đen, 6 trà đào, 12 ly M, 8 đường, 12 đá.', { cash: state.cash - cost, inventory, freshness });
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
