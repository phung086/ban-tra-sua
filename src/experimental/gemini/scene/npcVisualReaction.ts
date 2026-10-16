import {
  applyChibiPose,
  type ChibiExpression,
  type PoseablePersonLike,
} from './chibiAnimation';
import {
  CANONICAL_NPCS,
  type CanonicalNpcId,
} from '../game/lifeSim/npcInteractionEngine';

export interface NpcVisualStyle {
  npcId: CanonicalNpcId;
  shirtHex: string;
  pantsHex: string;
  accentHex: string;
  scaleY: number;
  defaultExpression: ChibiExpression;
  blinkSeed: number;
}

export const NPC_VISUAL_STYLES: Record<CanonicalNpcId, NpcVisualStyle> = {
  co_hanh: {
    npcId: 'co_hanh',
    shirtHex: '#d97757',
    pantsHex: '#3b4252',
    accentHex: '#f4a261',
    scaleY: 0.98,
    defaultExpression: 'greeting',
    blinkSeed: 1.1,
  },
  co_thu: {
    npcId: 'co_thu',
    shirtHex: '#5e6472',
    pantsHex: '#2b2d42',
    accentHex: '#b8c0ff',
    scaleY: 0.99,
    defaultExpression: 'listening',
    blinkSeed: 2.3,
  },
  anh_nam: {
    npcId: 'anh_nam',
    shirtHex: '#457b9d',
    pantsHex: '#1d3557',
    accentHex: '#a8dadc',
    scaleY: 1.03,
    defaultExpression: 'idle_breathing',
    blinkSeed: 3.7,
  },
  bac_minh: {
    npcId: 'bac_minh',
    shirtHex: '#8d7b68',
    pantsHex: '#4a403a',
    accentHex: '#c8b6a6',
    scaleY: 0.95,
    defaultExpression: 'looking_around',
    blinkSeed: 4.9,
  },
  bac_binh: {
    npcId: 'bac_binh',
    shirtHex: '#4f772d',
    pantsHex: '#31572c',
    accentHex: '#90a955',
    scaleY: 0.97,
    defaultExpression: 'idle_breathing',
    blinkSeed: 5.4,
  },
  lan: {
    npcId: 'lan',
    shirtHex: '#f28482',
    pantsHex: '#4a4e69',
    accentHex: '#f6bd60',
    scaleY: 0.98,
    defaultExpression: 'happy',
    blinkSeed: 6.2,
  },
  me_mai: {
    npcId: 'me_mai',
    shirtHex: '#b56576',
    pantsHex: '#355070',
    accentHex: '#eaac8b',
    scaleY: 0.97,
    defaultExpression: 'listening',
    blinkSeed: 7.5,
  },
  bo_quang: {
    npcId: 'bo_quang',
    shirtHex: '#3d5a80',
    pantsHex: '#293241',
    accentHex: '#98c1d9',
    scaleY: 1.02,
    defaultExpression: 'idle_breathing',
    blinkSeed: 8.1,
  },
  em_an: {
    npcId: 'em_an',
    shirtHex: '#ffd166',
    pantsHex: '#26547c',
    accentHex: '#06d6a0',
    scaleY: 0.9,
    defaultExpression: 'happy',
    blinkSeed: 9.3,
  },
  thao: {
    npcId: 'thao',
    shirtHex: '#8338ec',
    pantsHex: '#3a0ca3',
    accentHex: '#ff006e',
    scaleY: 0.99,
    defaultExpression: 'looking_around',
    blinkSeed: 10.6,
  },
  duy: {
    npcId: 'duy',
    shirtHex: '#fb8500',
    pantsHex: '#023047',
    accentHex: '#ffb703',
    scaleY: 1.01,
    defaultExpression: 'worried',
    blinkSeed: 11.4,
  },
  khanh: {
    npcId: 'khanh',
    shirtHex: '#2a9d8f',
    pantsHex: '#264653',
    accentHex: '#e9c46a',
    scaleY: 1.0,
    defaultExpression: 'talking',
    blinkSeed: 12.8,
  },
  linh: {
    npcId: 'linh',
    shirtHex: '#84a59d',
    pantsHex: '#52796f',
    accentHex: '#f5cac3',
    scaleY: 0.97,
    defaultExpression: 'idle_breathing',
    blinkSeed: 13.5,
  },
  phuc: {
    npcId: 'phuc',
    shirtHex: '#495057',
    pantsHex: '#212529',
    accentHex: '#adb5bd',
    scaleY: 1.02,
    defaultExpression: 'tired',
    blinkSeed: 14.9,
  },
};

export function syncNpcVisualReaction(
  person: PoseablePersonLike,
  npcId: CanonicalNpcId,
  options: {
    time: number;
    walking?: boolean;
    sitting?: boolean;
    holdingCup?: boolean;
    reactionOverride?: ChibiExpression;
    motion?: boolean;
  },
) {
  const style = NPC_VISUAL_STYLES[npcId] ?? NPC_VISUAL_STYLES.linh;
  const profile = CANONICAL_NPCS[npcId] ?? CANONICAL_NPCS.linh;
  const expr = options.reactionOverride ?? style.defaultExpression;

  person.root.scale.y = style.scaleY;
  person.root.userData = {
    ...person.root.userData,
    blinkSeed: style.blinkSeed,
    expression: expr,
    mood: expr,
  };

  const gesture =
    options.holdingCup || expr === 'holding_cup' || expr === 'serving'
      ? 0.45
      : expr === 'greeting'
      ? 0.65
      : 0;

  const channels = applyChibiPose(
    person,
    options.time,
    options.walking ?? false,
    gesture,
    options.sitting ?? false,
    options.motion ?? true,
    options.time * 7,
    expr,
  );

  return {
    npcId,
    displayName: profile.displayName,
    expression: expr,
    style,
    channels,
  };
}
