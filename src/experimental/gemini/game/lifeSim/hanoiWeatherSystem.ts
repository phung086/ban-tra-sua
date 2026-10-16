import { type CanonicalNpcId, CANONICAL_NPCS } from './npcInteractionEngine';
import { type ChibiExpression } from '../../scene/chibiAnimation';

export type HanoiWeatherCondition =
  | 'sunny_hot'
  | 'overcast_humid'
  | 'sudden_rain'
  | 'cool_autumn';

export interface WeatherDemandModifiers {
  hotDrinkPriceMultiplier: number;
  icedDrinkPriceMultiplier: number;
  tipShelterBonus: number;
  customerFlowModifier: number; // e.g. 0.8 during heavy rain, but longer stay
}

export interface HanoiWeatherState {
  condition: HanoiWeatherCondition;
  title: string;
  temperatureC: number;
  rainIntensity: number; // 0.0 to 1.0
  windSpeedKmh: number;
  roofPattingSound: boolean;
  modifiers: WeatherDemandModifiers;
  ambienceDescription: string;
}

export const WEATHER_CONFIGS: Record<HanoiWeatherCondition, HanoiWeatherState> = {
  sunny_hot: {
    condition: 'sunny_hot',
    title: 'Nắng hè oi ả',
    temperatureC: 34,
    rainIntensity: 0.0,
    windSpeedKmh: 8,
    roofPattingSound: false,
    modifiers: {
      hotDrinkPriceMultiplier: 0.85,
      icedDrinkPriceMultiplier: 1.35,
      tipShelterBonus: 0,
      customerFlowModifier: 1.15,
    },
    ambienceDescription: 'Tiếng ve râm ran góc phố An Hòa, khách thích uống nhiều đá giải nhiệt.',
  },
  overcast_humid: {
    condition: 'overcast_humid',
    title: 'Trời âm u chuyển mưa',
    temperatureC: 28,
    rainIntensity: 0.15,
    windSpeedKmh: 18,
    roofPattingSound: false,
    modifiers: {
      hotDrinkPriceMultiplier: 1.05,
      icedDrinkPriceMultiplier: 1.05,
      tipShelterBonus: 5,
      customerFlowModifier: 1.0,
    },
    ambienceDescription: 'Mây xám kéo qua đỉnh cây bàng, gió thổi lay nhẹ mái bạt che tiệm trà.',
  },
  sudden_rain: {
    condition: 'sudden_rain',
    title: 'Mưa rào rào mái hiên',
    temperatureC: 23,
    rainIntensity: 0.85,
    windSpeedKmh: 24,
    roofPattingSound: true,
    modifiers: {
      hotDrinkPriceMultiplier: 1.4,
      icedDrinkPriceMultiplier: 0.8,
      tipShelterBonus: 15,
      customerFlowModifier: 0.85,
    },
    ambienceDescription: 'Mưa rào bất chợt gõ lộp độp trên mái bạt, hàng xóm tấp vào hiên trú mưa ấm áp.',
  },
  cool_autumn: {
    condition: 'cool_autumn',
    title: 'Gió mùa thu se lạnh',
    temperatureC: 21,
    rainIntensity: 0.05,
    windSpeedKmh: 14,
    roofPattingSound: false,
    modifiers: {
      hotDrinkPriceMultiplier: 1.3,
      icedDrinkPriceMultiplier: 0.95,
      tipShelterBonus: 8,
      customerFlowModifier: 1.1,
    },
    ambienceDescription: 'Hà Nội vào thu se lạnh, lá vàng bay nhẹ, trà nóng gừng sả đắt hàng.',
  },
};

/**
 * Evaluates weather conditions based on game day and time minutes.
 * Day 4 has a guaranteed sudden afternoon shower (Day 4: "Cơn mưa rào").
 */
export function evaluateHanoiWeather(day: number, timeMinutes: number): HanoiWeatherState {
  const normTime = ((timeMinutes % 1440) + 1440) % 1440;

  // Day 4 script: Afternoon rain between 14:00 (840m) and 16:30 (990m)
  if (day === 4 && normTime >= 840 && normTime < 990) {
    return WEATHER_CONFIGS.sudden_rain;
  }

  // General weather cycle based on day & season seed
  const cycleSeed = (day * 3 + Math.floor(normTime / 360)) % 4;
  switch (cycleSeed) {
    case 0:
      return WEATHER_CONFIGS.sunny_hot;
    case 1:
      return WEATHER_CONFIGS.overcast_humid;
    case 2:
      return WEATHER_CONFIGS.sudden_rain;
    default:
      return WEATHER_CONFIGS.cool_autumn;
  }
}

export interface NpcWeatherReaction {
  npcId: CanonicalNpcId;
  action: 'shelter_under_awning' | 'enjoy_sun' | 'walk_fast';
  expression: ChibiExpression;
  dialogueQuote: string;
  wantsHotDrink: boolean;
}

/**
 * Computes how canonical NPCs react to sudden weather shifts.
 */
export function resolveNpcWeatherReaction(
  npcId: CanonicalNpcId,
  weather: HanoiWeatherState,
): NpcWeatherReaction {
  const profile = CANONICAL_NPCS[npcId];

  if (weather.condition === 'sudden_rain') {
    const quote =
      npcId === 'co_thu'
        ? 'Cô Thu vội che nón bước vào mái hiên: "Mưa to quá cháu ơi, cho cô ly trà nóng ấm bụng ngồi đợi dứt cơn nhé!"'
        : npcId === 'lan'
        ? 'Lan ướt nhẹ vạt áo cười giòn: "Mưa rào Hà Nội lãng mạn ghê! Cho mình ly trà sữa trân châu nóng hổi đi!"'
        : npcId === 'linh'
        ? 'Linh bước khẽ vào quán: "May mà quán có mái hiên rộng, cho mình ly trà ấm ít ngọt nhé."'
        : npcId === 'phuc'
        ? 'Phúc nhìn cơn mưa thở phào: "Mưa thế này kẹt xe rồi, vào quán ngồi nhâm nhi chút vậy."'
        : `${profile.displayName} tấp vào mái hiên trú mưa: "Tiệm cho mình ly trà nóng giữ ấm người nhé!"`;

    return {
      npcId,
      action: 'shelter_under_awning',
      expression: npcId === 'lan' ? 'happy' : 'surprised',
      dialogueQuote: quote,
      wantsHotDrink: true,
    };
  }

  if (weather.condition === 'sunny_hot') {
    return {
      npcId,
      action: 'enjoy_sun',
      expression: 'idle_breathing',
      dialogueQuote: `${profile.displayName}: "Trời nắng gắt quá, cho mình một ly thật nhiều đá mát lạnh nhé!"`,
      wantsHotDrink: false,
    };
  }

  return {
    npcId,
    action: 'walk_fast',
    expression: 'listening',
    dialogueQuote: `${profile.displayName}: "Thời tiết phố mình hôm nay dễ chịu thật."`,
    wantsHotDrink: weather.condition === 'cool_autumn',
  };
}
