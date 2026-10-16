import { describe, it, expect } from 'vitest';
import {
  evaluateHanoiWeather,
  resolveNpcWeatherReaction,
  WEATHER_CONFIGS,
} from './hanoiWeatherSystem';

describe('hanoiWeatherSystem — Dynamic Weather, Rain Awning & Hot/Cold Demand', () => {
  it('triggers sudden afternoon rain on Day 4 between 14:00 and 16:30 per Story Bible', () => {
    const afternoonRain = evaluateHanoiWeather(4, 15 * 60); // Day 4, 15:00
    expect(afternoonRain.condition).toBe('sudden_rain');
    expect(afternoonRain.temperatureC).toBe(23);
    expect(afternoonRain.roofPattingSound).toBe(true);
    expect(afternoonRain.modifiers.hotDrinkPriceMultiplier).toBeGreaterThan(1.2);
  });

  it('adjusts drink demand: hot tea bonus during rain/cool weather and iced tea bonus during hot sun', () => {
    const hotWeather = WEATHER_CONFIGS.sunny_hot;
    expect(hotWeather.temperatureC).toBe(34);
    expect(hotWeather.modifiers.icedDrinkPriceMultiplier).toBeGreaterThan(1.2);

    const rainWeather = WEATHER_CONFIGS.sudden_rain;
    expect(rainWeather.modifiers.hotDrinkPriceMultiplier).toBe(1.4);
    expect(rainWeather.modifiers.tipShelterBonus).toBe(15);
  });

  it('causes street NPCs to seek shelter under awning and order warm drinks during sudden rain', () => {
    const coThuReaction = resolveNpcWeatherReaction('co_thu', WEATHER_CONFIGS.sudden_rain);
    expect(coThuReaction.action).toBe('shelter_under_awning');
    expect(coThuReaction.wantsHotDrink).toBe(true);
    expect(coThuReaction.dialogueQuote).toContain('trà nóng');

    const lanReaction = resolveNpcWeatherReaction('lan', WEATHER_CONFIGS.sudden_rain);
    expect(lanReaction.action).toBe('shelter_under_awning');
    expect(lanReaction.expression).toBe('happy');
  });
});
