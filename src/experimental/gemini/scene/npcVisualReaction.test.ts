import { describe, it, expect } from 'vitest';
import { NPC_VISUAL_STYLES, syncNpcVisualReaction } from './npcVisualReaction';
import { CANONICAL_NPCS, type CanonicalNpcId } from '../game/lifeSim/npcInteractionEngine';

describe('npcVisualReaction — 14 canonical Hanoi NPCs & 3D expression sync', () => {
  it('defines distinct silhouettes, palettes, and blink seeds for all 14 canonical NPCs', () => {
    const ids = Object.keys(CANONICAL_NPCS) as CanonicalNpcId[];
    expect(ids).toHaveLength(14);
    const seeds = new Set<number>();

    for (const id of ids) {
      const style = NPC_VISUAL_STYLES[id];
      expect(style).toBeDefined();
      expect(style.shirtHex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(style.scaleY).toBeGreaterThan(0.85);
      expect(style.scaleY).toBeLessThan(1.1);
      seeds.add(style.blinkSeed);
    }
    expect(seeds.size).toBe(14);
  });

  it('syncs NPC reaction state onto 3D person rig with holdingCup gesture', () => {
    const mockPerson = {
      root: { scale: { y: 1 }, position: { x: 1, z: 2 }, rotation: { y: 0 }, userData: {} },
      body: { position: { y: 0 }, rotation: { x: 0, y: 0, z: 0 } },
      head: { rotation: { x: 0, y: 0, z: 0 } },
      leftArm: { rotation: { x: 0, z: 0 } },
      rightArm: { rotation: { x: 0, z: 0 } },
      leftLeg: { rotation: { x: 0 } },
      rightLeg: { rotation: { x: 0 } },
      eyes: [{ scale: { x: 1, y: 0.08 }, userData: { blinkHeight: 0.08, blinkWidth: 1 } }],
      knees: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }],
      elbows: [{ rotation: { x: 0 } }, { rotation: { x: 0 } }],
    };

    const synced = syncNpcVisualReaction(mockPerson, 'co_thu', {
      time: 1.2,
      holdingCup: true,
      reactionOverride: 'happy',
    });

    expect(synced.displayName).toBe('Cô Thu');
    expect(synced.expression).toBe('happy');
    expect(mockPerson.root.scale.y).toBeCloseTo(0.99, 3);
    expect(mockPerson.rightArm.rotation.x).toBeLessThan(0);
  });
});
