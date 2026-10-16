export type TimeOfDayTag = 'dawn' | 'day' | 'dusk' | 'night';

export interface HanoiAtmosphereConfig {
  tag: TimeOfDayTag;
  title: string;
  sunColor: string;
  skyColor: string;
  ambientColor: string;
  ambientIntensity: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  fogDensity: number;
  streetLampIntensity: number;
  shopLanternGlow: number;
  windSwayStrength: number;
}

/**
 * Returns procedural Hanoi street lighting and atmosphere according to game clock minutes (0..1440).
 * 06:00 = 360m (dawn)
 * 12:00 = 720m (day)
 * 17:30 = 1050m (dusk)
 * 20:00 = 1200m (night)
 */
export function getHanoiAtmosphere(timeMinutes: number): HanoiAtmosphereConfig {
  const norm = ((timeMinutes % 1440) + 1440) % 1440;

  if (norm >= 330 && norm < 510) {
    // 05:30 - 08:30: Sáng sớm sương mù phố cổ Hà Nội
    return {
      tag: 'dawn',
      title: 'Sương sớm phố nhỏ',
      sunColor: '#ffe4b5',
      skyColor: '#bde0fe',
      ambientColor: '#dbe7e4',
      ambientIntensity: 0.76,
      sunIntensity: 1.4,
      sunPosition: [-8, 6, 8],
      fogDensity: 0.028,
      streetLampIntensity: 0.15,
      shopLanternGlow: 0.35,
      windSwayStrength: 0.85,
    };
  }

  if (norm >= 510 && norm < 990) {
    // 08:30 - 16:30: Ban ngày rực rỡ, bóng râm mát dưới mái hiên
    return {
      tag: 'day',
      title: 'Nắng ấm ngõ quen',
      sunColor: '#fffdf5',
      skyColor: '#a2d2ff',
      ambientColor: '#ffffff',
      ambientIntensity: 1.05,
      sunIntensity: 2.4,
      sunPosition: [2, 14, 6],
      fogDensity: 0.008,
      streetLampIntensity: 0.0,
      shopLanternGlow: 0.0,
      windSwayStrength: 0.6,
    };
  }

  if (norm >= 990 && norm < 1140) {
    // 16:30 - 19:00: Hoàng hôn phố nhỏ, đèn lồng và đèn đường bắt đầu sáng
    return {
      tag: 'dusk',
      title: 'Hoàng hôn góc phố',
      sunColor: '#fb8500',
      skyColor: '#cdb4db',
      ambientColor: '#f7d6bf',
      ambientIntensity: 0.72,
      sunIntensity: 1.6,
      sunPosition: [10, 4, 7],
      fogDensity: 0.018,
      streetLampIntensity: 0.65,
      shopLanternGlow: 0.88,
      windSwayStrength: 0.7,
    };
  }

  // 19:00 - 05:30: Đêm phố cổ, ánh đèn vàng quầy trà ấm áp
  return {
    tag: 'night',
    title: 'Đêm phố yên bình',
    sunColor: '#2b2d42',
    skyColor: '#10172a',
    ambientColor: '#1e293b',
    ambientIntensity: 0.38,
    sunIntensity: 0.25,
    sunPosition: [0, 8, -5],
    fogDensity: 0.024,
    streetLampIntensity: 1.0,
    shopLanternGlow: 1.0,
    windSwayStrength: 0.45,
  };
}

/**
 * Procedural leaf and awning sway math (zero vertex allocation).
 */
export function computeWindLeavesOffset(time: number, windStrength = 0.6): { x: number; y: number } {
  return {
    x: Math.sin(time * 2.2) * 0.04 * windStrength + Math.sin(time * 5.4) * 0.015 * windStrength,
    y: Math.cos(time * 1.8) * 0.025 * windStrength,
  };
}
