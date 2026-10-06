import type {
  BaseId,
  Customer,
  DrinkDefinition,
  Inventory,
  InventoryKey,
  ToppingDefinition,
  ToppingId,
} from "./types";

export const CUSTOMERS: Customer[] = [
  {
    id: "miu",
    name: "Miu",
    hair: "#50304b",
    shirt: "#ff85b8",
    skin: "#ffd8c8",
    greeting: "Chủ tiệm ơi, cho mình ly xinh xinh nha!",
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
    good: ["Ngon xỉu, chụp story liền!", "Chủ tiệm nay lên tay dữ 💖"],
    okay: ["Xinh nhưng vị cần chỉnh chút nha.", "Mình vẫn uống được, 3 sao rưỡi!"],
    bad: ["Ảnh thì xinh mà vị hơi... nghệ thuật.", "Mình cần một lời giải thích từ chủ tiệm 😭"],
  },
];

export const DRINKS: Record<BaseId, DrinkDefinition> = {
  "classic-milk-tea": {
    id: "classic-milk-tea",
    name: "Trà sữa truyền thống",
    emoji: "🧋",
    ingredient: "classicMilkTea",
    priceM: 28000,
    priceL: 34000,
  },
  "peach-tea": {
    id: "peach-tea",
    name: "Trà đào hồng",
    emoji: "🍑",
    ingredient: "peachTea",
    priceM: 30000,
    priceL: 36000,
  },
  "matcha-latte": {
    id: "matcha-latte",
    name: "Matcha sữa",
    emoji: "🍵",
    ingredient: "matchaLatte",
    priceM: 34000,
    priceL: 40000,
  },
};

export const TOPPINGS: Record<ToppingId, ToppingDefinition> = {
  none: { id: "none", name: "Không topping", emoji: "✨" },
  "black-pearl": { id: "black-pearl", name: "Trân châu đen", emoji: "⚫", ingredient: "blackPearl" },
  pudding: { id: "pudding", name: "Pudding", emoji: "🍮", ingredient: "pudding" },
  "rainbow-jelly": { id: "rainbow-jelly", name: "Thạch cầu vồng", emoji: "💎", ingredient: "rainbowJelly" },
};

export const DEFAULT_INVENTORY: Inventory = {
  cupsM: 12,
  cupsL: 10,
  classicMilkTea: 12,
  peachTea: 10,
  matchaLatte: 8,
  blackPearl: 10,
  pudding: 8,
  rainbowJelly: 8,
  sugar: 25,
  ice: 25,
};

export interface RestockItem {
  key: InventoryKey;
  label: string;
  emoji: string;
  amount: number;
  price: number;
}

export const RESTOCK_ITEMS: RestockItem[] = [
  { key: "cupsM", label: "Ly M", emoji: "🥤", amount: 10, price: 9000 },
  { key: "cupsL", label: "Ly L", emoji: "🥤", amount: 10, price: 12000 },
  { key: "classicMilkTea", label: "Cốt trà sữa", emoji: "🧋", amount: 8, price: 30000 },
  { key: "peachTea", label: "Cốt trà đào", emoji: "🍑", amount: 8, price: 32000 },
  { key: "matchaLatte", label: "Matcha", emoji: "🍵", amount: 8, price: 40000 },
  { key: "blackPearl", label: "Trân châu đen", emoji: "⚫", amount: 8, price: 18000 },
  { key: "pudding", label: "Pudding", emoji: "🍮", amount: 8, price: 22000 },
  { key: "rainbowJelly", label: "Thạch", emoji: "💎", amount: 8, price: 20000 },
  { key: "sugar", label: "Đường", emoji: "🍬", amount: 15, price: 14000 },
  { key: "ice", label: "Đá", emoji: "🧊", amount: 15, price: 12000 },
];

export const BASE_IDS = Object.keys(DRINKS) as BaseId[];
export const TOPPING_IDS = Object.keys(TOPPINGS) as ToppingId[];
export const PERCENT_OPTIONS = [0, 30, 50, 70, 100];
