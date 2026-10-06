import type {
  AchievementDefinition,
  BaseId,
  Customer,
  DayEvent,
  DrinkDefinition,
  Inventory,
  InventoryKey,
  StaffDefinition,
  ToppingDefinition,
  ToppingId,
  UpgradeDefinition,
  UpgradeLevels,
} from "./types";

export const CUSTOMERS: Customer[] = [
  {
    id: "miu",
    name: "Miu",
    hair: "#50304b",
    shirt: "#ff85b8",
    skin: "#ffd8c8",
    greeting: "Chủ tiệm ơi, cho mình ly xinh xinh nha!",
    archetype: "Nàng thơ",
    patience: "chill",
    favorite: "strawberry-milk",
    good: ["Đúng gu quá trời, cho tiệm 5 sao nè 💗", "Uống một ngụm là muốn quay lại liền!"],
    okay: ["Ổn áp nha, lần sau mình thử món khác.", "Cũng ngon đó, cố thêm chút nữa nhen."],
    bad: ["Ủa... mình gọi vậy hả ta 😭", "Chủ tiệm đang thử thách vị giác của mình đúng không?"],
  },
  {
    id: "bo",
    name: "Bơ",
    hair: "#78513c",
    shirt: "#ffd16b",
    skin: "#f5c7a9",
    greeting: "Nhanh giúp mình nha, mình đang thèm trà sữa lắm.",
    archetype: "Hệ vội",
    patience: "impatient",
    favorite: "classic-milk-tea",
    good: ["Chuẩn từng % đường luôn, có tâm!", "Quá đã, tiền tip xứng đáng."],
    okay: ["Sai nhẹ thôi, vẫn cứu được.", "Hơi lệch gu nhưng vẫn uống hết nha."],
    bad: ["Đá với đường đang đánh nhau trong ly à?", "Mình order một ly chứ đâu order bất ngờ 😭"],
  },
  {
    id: "nana",
    name: "Na Na",
    hair: "#292133",
    shirt: "#b99cff",
    skin: "#f7d1bd",
    greeting: "Cho mình đúng topping nha, mình soi kỹ lắm đó.",
    archetype: "Topping police",
    patience: "normal",
    favorite: "matcha-latte",
    good: ["Topping chuẩn bài, duyệt!", "Tiệm này đáng follow nha ✨"],
    okay: ["Tạm được, lần sau đừng làm mình hồi hộp.", "Một chiếc ly khá ổn."],
    bad: ["Topping của mình đi lạc đâu rồi?", "Review này được viết trong sự hoang mang."],
  },
  {
    id: "sunny",
    name: "Sunny",
    hair: "#9c5f2d",
    shirt: "#7edbc5",
    skin: "#dca982",
    greeting: "Hôm nay pha cho mình ly thật chill nha!",
    archetype: "Chill girl",
    patience: "chill",
    favorite: "peach-tea",
    good: ["Vị cân bằng, mood tăng 100 điểm.", "Cute từ quán tới ly nước 💕"],
    okay: ["Khá chill, chỉ là chưa wow lắm.", "Ổn nha, mình cho cơ hội lần nữa."],
    bad: ["Mood đang chill tự nhiên tỉnh luôn á.", "Ly này có plot twist hơi mạnh nha."],
  },
  {
    id: "chi",
    name: "Chii",
    hair: "#b06079",
    shirt: "#ffb1c8",
    skin: "#f3c5ac",
    greeting: "Cho mình món ngon nhất tiệm với ạ~",
    archetype: "Story addict",
    patience: "normal",
    favorite: "taro-milk-tea",
    good: ["Ngon xỉu, chụp story liền!", "Chủ tiệm nay lên tay dữ 💖"],
    okay: ["Xinh nhưng vị cần chỉnh chút nha.", "Mình vẫn uống được, 3 sao rưỡi!"],
    bad: ["Ảnh thì xinh mà vị hơi... nghệ thuật.", "Mình cần một lời giải thích từ chủ tiệm 😭"],
  },
  {
    id: "khanh",
    name: "Khánh",
    hair: "#3c312f",
    shirt: "#84b9ff",
    skin: "#e9b999",
    greeting: "Cho mình ly đậm trà, ít drama nha chủ tiệm.",
    archetype: "Khách ruột",
    patience: "chill",
    favorite: "oolong-milk-tea",
    good: ["Đậm trà chuẩn gu. Mai lại ghé.", "Pha có nghề đó nha!"],
    okay: ["Được, chưa tới mức nhớ nhưng ổn.", "Khá ổn, cân vị thêm chút là đẹp."],
    bad: ["Đậm drama hơn đậm trà rồi đó.", "Ủa công thức hôm nay ai cầm vậy?"],
  },
  {
    id: "lyly",
    name: "Ly Ly",
    hair: "#d77f9d",
    shirt: "#ff8f9e",
    skin: "#f6ccb7",
    greeting: "Mình đang quay vlog, làm ly thật photogenic nha!",
    archetype: "Vlogger",
    patience: "normal",
    favorite: "strawberry-milk",
    good: ["Lên hình quá xinh, tag tiệm liền 📸", "Ly này có tiềm năng viral nha!"],
    okay: ["Camera ăn màu hơn vị một chút.", "Xinh nè, vị chỉnh tí nữa là perfect."],
    bad: ["Vlog hôm nay thành video reaction rồi 😭", "Plot twist này mình không script nha."],
  },
  {
    id: "duc",
    name: "Đức",
    hair: "#332d3e",
    shirt: "#a9d47f",
    skin: "#d8a982",
    greeting: "Pha mạnh tay chút, mình cần tỉnh để chạy deadline.",
    archetype: "Deadline warrior",
    patience: "impatient",
    favorite: "cocoa-milk",
    good: ["Tỉnh luôn, 5 sao cho năng suất.", "Cứu một chiếc deadline rồi đó!"],
    okay: ["Đủ tỉnh, chưa đủ wow.", "Uống được, quay lại làm việc tiếp."],
    bad: ["Deadline chưa xong mà vị giác xong trước rồi.", "Mình cần cà phê sau ly này quá."],
  },
];

export const DRINKS: Record<BaseId, DrinkDefinition> = {
  "classic-milk-tea": { id: "classic-milk-tea", name: "Trà sữa truyền thống", shortName: "Truyền thống", emoji: "🧋", ingredient: "classicMilkTea", priceM: 28000, priceL: 34000, unlockLevel: 1 },
  "peach-tea": { id: "peach-tea", name: "Trà đào hồng", shortName: "Trà đào", emoji: "🍑", ingredient: "peachTea", priceM: 30000, priceL: 36000, unlockLevel: 1 },
  "matcha-latte": { id: "matcha-latte", name: "Matcha sữa", shortName: "Matcha", emoji: "🍵", ingredient: "matchaLatte", priceM: 34000, priceL: 40000, unlockLevel: 1 },
  "oolong-milk-tea": { id: "oolong-milk-tea", name: "Trà sữa ô long", shortName: "Ô long", emoji: "🫖", ingredient: "oolongMilkTea", priceM: 35000, priceL: 42000, unlockLevel: 2 },
  "taro-milk-tea": { id: "taro-milk-tea", name: "Trà sữa khoai môn", shortName: "Khoai môn", emoji: "🍠", ingredient: "taroMix", priceM: 36000, priceL: 43000, unlockLevel: 3 },
  "strawberry-milk": { id: "strawberry-milk", name: "Sữa dâu mây hồng", shortName: "Sữa dâu", emoji: "🍓", ingredient: "strawberryMilk", priceM: 38000, priceL: 45000, unlockLevel: 4 },
  "cocoa-milk": { id: "cocoa-milk", name: "Cacao sữa kem", shortName: "Cacao", emoji: "🍫", ingredient: "cocoaMilk", priceM: 39000, priceL: 46000, unlockLevel: 5 },
  "lemon-tea": { id: "lemon-tea", name: "Trà chanh mật ong", shortName: "Trà chanh", emoji: "🍋", ingredient: "lemonTea", priceM: 32000, priceL: 39000, unlockLevel: 6 },
};

export const TOPPINGS: Record<ToppingId, ToppingDefinition> = {
  none: { id: "none", name: "Không topping", emoji: "✨", price: 0, unlockLevel: 1 },
  "black-pearl": { id: "black-pearl", name: "Trân châu đen", emoji: "⚫", ingredient: "blackPearl", price: 5000, unlockLevel: 1 },
  pudding: { id: "pudding", name: "Pudding trứng", emoji: "🍮", ingredient: "pudding", price: 6000, unlockLevel: 2 },
  "rainbow-jelly": { id: "rainbow-jelly", name: "Thạch cầu vồng", emoji: "💎", ingredient: "rainbowJelly", price: 6000, unlockLevel: 2 },
  "cheese-foam": { id: "cheese-foam", name: "Kem cheese", emoji: "🧀", ingredient: "cheeseFoam", price: 8000, unlockLevel: 3 },
  "aloe-vera": { id: "aloe-vera", name: "Nha đam", emoji: "🌿", ingredient: "aloeVera", price: 7000, unlockLevel: 4 },
  mochi: { id: "mochi", name: "Mochi mini", emoji: "🍡", ingredient: "mochi", price: 9000, unlockLevel: 5 },
};

export const DEFAULT_INVENTORY: Inventory = {
  cupsM: 14,
  cupsL: 12,
  classicMilkTea: 12,
  peachTea: 10,
  matchaLatte: 8,
  oolongMilkTea: 0,
  taroMix: 0,
  strawberryMilk: 0,
  cocoaMilk: 0,
  lemonTea: 0,
  blackPearl: 10,
  pudding: 0,
  rainbowJelly: 0,
  cheeseFoam: 0,
  aloeVera: 0,
  mochi: 0,
  sugar: 28,
  ice: 28,
};

export interface RestockItem {
  key: InventoryKey;
  label: string;
  emoji: string;
  amount: number;
  price: number;
  unlockLevel: number;
  perishable: boolean;
}

export const RESTOCK_ITEMS: RestockItem[] = [
  { key: "cupsM", label: "Ly M", emoji: "🥤", amount: 12, price: 10000, unlockLevel: 1, perishable: false },
  { key: "cupsL", label: "Ly L", emoji: "🥤", amount: 10, price: 13000, unlockLevel: 1, perishable: false },
  { key: "classicMilkTea", label: "Cốt trà sữa", emoji: "🧋", amount: 8, price: 30000, unlockLevel: 1, perishable: true },
  { key: "peachTea", label: "Cốt trà đào", emoji: "🍑", amount: 8, price: 32000, unlockLevel: 1, perishable: true },
  { key: "matchaLatte", label: "Matcha sữa", emoji: "🍵", amount: 8, price: 40000, unlockLevel: 1, perishable: true },
  { key: "oolongMilkTea", label: "Cốt ô long", emoji: "🫖", amount: 8, price: 42000, unlockLevel: 2, perishable: true },
  { key: "taroMix", label: "Mix khoai môn", emoji: "🍠", amount: 8, price: 44000, unlockLevel: 3, perishable: true },
  { key: "strawberryMilk", label: "Sữa dâu", emoji: "🍓", amount: 8, price: 48000, unlockLevel: 4, perishable: true },
  { key: "cocoaMilk", label: "Cacao sữa", emoji: "🍫", amount: 8, price: 50000, unlockLevel: 5, perishable: true },
  { key: "lemonTea", label: "Trà chanh", emoji: "🍋", amount: 8, price: 36000, unlockLevel: 6, perishable: true },
  { key: "blackPearl", label: "Trân châu đen", emoji: "⚫", amount: 10, price: 19000, unlockLevel: 1, perishable: true },
  { key: "pudding", label: "Pudding", emoji: "🍮", amount: 8, price: 22000, unlockLevel: 2, perishable: true },
  { key: "rainbowJelly", label: "Thạch cầu vồng", emoji: "💎", amount: 8, price: 21000, unlockLevel: 2, perishable: true },
  { key: "cheeseFoam", label: "Kem cheese", emoji: "🧀", amount: 8, price: 28000, unlockLevel: 3, perishable: true },
  { key: "aloeVera", label: "Nha đam", emoji: "🌿", amount: 8, price: 24000, unlockLevel: 4, perishable: true },
  { key: "mochi", label: "Mochi mini", emoji: "🍡", amount: 8, price: 30000, unlockLevel: 5, perishable: true },
  { key: "sugar", label: "Đường", emoji: "🍬", amount: 18, price: 15000, unlockLevel: 1, perishable: false },
  { key: "ice", label: "Đá", emoji: "🧊", amount: 18, price: 13000, unlockLevel: 1, perishable: false },
];

export const UPGRADES: UpgradeDefinition[] = [
  { id: "brewer", name: "Máy ủ trà", emoji: "🫖", description: "Tăng chất lượng nền trà và giảm sai số pha chế.", baseCost: 90000, maxLevel: 5 },
  { id: "shaker", name: "Máy lắc", emoji: "🥤", description: "Tăng điểm kỹ thuật lắc và combo dễ giữ hơn.", baseCost: 110000, maxLevel: 5 },
  { id: "sealer", name: "Máy dập nắp", emoji: "🎀", description: "Tăng thưởng khi đóng nắp và cảm giác hoàn thiện ly.", baseCost: 85000, maxLevel: 5 },
  { id: "fridge", name: "Tủ mát", emoji: "🧊", description: "Giảm tốc độ mất độ tươi và hao hụt cuối ngày.", baseCost: 120000, maxLevel: 5 },
  { id: "decor", name: "Trang trí quán", emoji: "🌷", description: "Tăng tiền tip, uy tín và khả năng viral.", baseCost: 100000, maxLevel: 5 },
];

export const DEFAULT_UPGRADES: UpgradeLevels = {
  brewer: 0,
  shaker: 0,
  sealer: 0,
  fridge: 0,
  decor: 0,
};

export const STAFF: StaffDefinition[] = [
  { id: "momo", name: "Momo", emoji: "👩🏻‍🍳", role: "Phụ bar", description: "+5% doanh thu mỗi đơn khi đang trực.", hireCost: 180000 },
  { id: "kiki", name: "Kiki", emoji: "🧺", role: "Kho hàng", description: "Giảm 10% giá nhập hàng khi đang trực.", hireCost: 160000 },
  { id: "lili", name: "Lili", emoji: "📱", role: "Social", description: "Tăng fan và viral từ review tốt.", hireCost: 200000 },
];

export const DAY_EVENTS: DayEvent[] = [
  { id: "soft", name: "Ngày dịu dàng", emoji: "🌸", description: "Nhịp khách ổn định, thích hợp luyện tay nghề.", demandBonus: 0, revenueMultiplier: 1, tipMultiplier: 1 },
  { id: "rain", name: "Mưa lất phất", emoji: "🌧️", description: "Ít khách hơn nhưng ai ghé cũng thích đồ uống ấm áp.", demandBonus: -1, revenueMultiplier: 1.08, tipMultiplier: 1.1 },
  { id: "student", name: "Tan học rồi!", emoji: "🎒", description: "Học sinh kéo tới đông, nhiều order tùy chỉnh.", demandBonus: 2, revenueMultiplier: 1.02, tipMultiplier: 0.95 },
  { id: "weekend", name: "Cuối tuần đông vui", emoji: "🎡", description: "Khách đông và chịu chi hơn bình thường.", demandBonus: 2, revenueMultiplier: 1.08, tipMultiplier: 1.15 },
  { id: "festival", name: "Lễ hội phố trà", emoji: "🎆", description: "Ngày bùng nổ: đông khách, tip cao, cơ hội viral lớn.", demandBonus: 3, revenueMultiplier: 1.15, tipMultiplier: 1.35 },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first-10", name: "Bắt đầu có nghề", emoji: "🧋", description: "Phục vụ 10 ly.", metric: "served", threshold: 10, rewardCash: 40000, rewardFans: 5 },
  { id: "perfect-10", name: "Bàn tay vàng", emoji: "✨", description: "Đạt 10 ly từ 95 điểm.", metric: "perfect", threshold: 10, rewardCash: 70000, rewardFans: 10 },
  { id: "million", name: "Tiệm triệu đồng", emoji: "💰", description: "Tổng doanh thu đạt 1.000.000đ.", metric: "revenue", threshold: 1000000, rewardCash: 100000, rewardFans: 15 },
  { id: "reply-20", name: "Chủ tiệm online", emoji: "💬", description: "Rep 20 đánh giá.", metric: "replies", threshold: 20, rewardCash: 50000, rewardFans: 25 },
  { id: "week-one", name: "Một tuần bền bỉ", emoji: "📅", description: "Hoàn thành 7 ngày bán hàng.", metric: "days", threshold: 7, rewardCash: 120000, rewardFans: 20 },
  { id: "fan-100", name: "Tiệm đang viral", emoji: "📱", description: "Chạm mốc 100 fan.", metric: "fans", threshold: 100, rewardCash: 150000, rewardFans: 0 },
];

export const BASE_IDS = Object.keys(DRINKS) as BaseId[];
export const TOPPING_IDS = Object.keys(TOPPINGS) as ToppingId[];
export const PERCENT_OPTIONS = [0, 30, 50, 70, 100] as const;
export const FILL_OPTIONS = [70, 80, 90, 100] as const;
export const SHAKE_OPTIONS = [40, 60, 80, 100] as const;
