import type { LegendDomain } from '../domains'
import { DIALGA_DOMAIN } from './dialga'

/**
 * Palkia shares Spear Pillar's crossing and arena with Dialga, but not its
 * time skips or boss attacks. Spacial Rend will receive its own visuals in
 * the next stage; these water/dragon patterns provide a playable test fight.
 */
export const PALKIA_DOMAIN: LegendDomain = {
  ...DIALGA_DOMAIN,
  omen: { weather: 'clear', sky: 'spatialShimmer' },
  entrance: 'materialize',
  crossing: {
    ...DIALGA_DOMAIN.crossing,
    threat: { ...DIALGA_DOMAIN.crossing.threat, kind: 'void' },
  },
  phases: [
    {
      below: 1,
      hold: true,
      steer: { kind: 'anchor', x: 0, y: 0, drift: 0, pace: 0.5 },
      patterns: [
        { kind: 'volley', every: 3.5, count: 3, arc: 0.6, speed: 90, windup: 1, radius: 6, damage: 17, visual: 'water' },
        { kind: 'ring', every: 5.7, count: 12, speed: 65, radius: 5, damage: 15, visual: 'dragon', gap: 0.8 },
        { kind: 'strikes', every: 5.3, target: 'player', count: 3, spread: 58, radius: 15, delay: 1.3, damage: 19, visual: 'dragon' },
      ],
      // The opening Rend introduces the telegraph before its later cross patterns.
      ultimate: {
        move: 'Spacial Rend',
        first: 5,
        every: 23,
        steps: [
          { at: 0, pattern: { kind: 'beam', every: 0, source: 'edge', count: 1, spread: 0, windup: 1.6, duration: 0.35, width: 18, length: 500, damage: 22, visual: 'spatial' } },
        ],
      },
    },
    {
      below: 0.66,
      hold: true,
      shift: 2.2,
      steer: { kind: 'hold', range: 110, pace: 0.55 },
      patterns: [
        { kind: 'beam', every: 7, source: 'boss', count: 2, spread: 0.5, windup: 1.2, duration: 0.55, width: 12, length: 380, damage: 21, visual: 'dragon' },
        { kind: 'ring', every: 5.3, count: 16, speed: 70, radius: 5, damage: 16, visual: 'water', gap: 0.6 },
      ],
      ultimate: {
        move: 'Spacial Rend',
        first: 6,
        every: 22,
        steps: [
          { at: 0, pattern: { kind: 'beam', every: 0, source: 'edge', count: 2, spread: 85, windup: 1.4, duration: 0.35, width: 18, length: 500, damage: 25, visual: 'spatial' } },
        ],
      },
    },
    {
      below: 0.33,
      hold: true,
      shift: 2.6,
      steer: { kind: 'chase', pace: 0.55 },
      patterns: [
        { kind: 'beam', every: 6.2, source: 'boss', count: 3, spread: 0.38, windup: 1.1, duration: 0.65, width: 12, length: 390, damage: 23, visual: 'dragon' },
        { kind: 'ring', every: 4.9, count: 18, speed: 75, radius: 5, damage: 17, visual: 'water', gap: 0.5 },
      ],
      ultimate: {
        move: 'Spacial Rend',
        first: 5,
        every: 19,
        steps: [
          { at: 0, pattern: { kind: 'beam', every: 0, source: 'lattice', count: 2, spread: 105, windup: 1.5, duration: 0.4, width: 16, length: 500, damage: 28, visual: 'spatial', cross: 'spatial' } },
        ],
      },
    },
  ],
}
