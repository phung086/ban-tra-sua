export interface SeasonTheme {
  id: "blossom" | "rainy" | "moon" | "festival";
  name: string;
  emoji: string;
  subtitle: string;
}

const SEASONS: SeasonTheme[] = [
  { id: "blossom", name: "Mùa hoa hồng", emoji: "🌸", subtitle: "Pastel dịu, khách thích chụp ảnh tại quầy." },
  { id: "rainy", name: "Mùa mưa", emoji: "🌧️", subtitle: "Không khí chill, đồ uống ấm và khách quen ghé nhiều hơn." },
  { id: "moon", name: "Mùa trăng", emoji: "🌙", subtitle: "Đèn tiệm lung linh, buổi tối có cảm giác đặc biệt hơn." },
  { id: "festival", name: "Mùa lễ hội", emoji: "🎆", subtitle: "Phố trà đông vui, màu sắc và năng lượng tăng mạnh." },
];

export function getSeasonForDay(day: number): SeasonTheme {
  const chapter = Math.floor(Math.max(0, day - 1) / 7);
  return SEASONS[chapter % SEASONS.length];
}
