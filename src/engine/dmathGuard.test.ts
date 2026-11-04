import { describe, expect, it } from 'vitest'
import { SIM_ROOTS, importsOf, resolveImport, simModules } from '../coop/simBuild'

/** Every source under `src` as text, by its repo path (`src/game/game.ts`). */
const SOURCES: Record<string, string> = import.meta.glob(['/src/**/*.ts', '/src/**/*.json', '!/src/**/*.test.ts'], { query: '?raw', import: 'default', eager: true })

const read = (path: string) => SOURCES[`/${path}`] ?? null

/**
 * Calls whose bits differ between engines (or did, in a JIT): use `engine/dmath`
 * instead. `Math.random` and the clock break replays anywhere.
 */
const BANNED = /\bMath\.(round|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|asinh|acosh|atanh|exp|expm1|log|log1p|log2|log10|pow|cbrt|hypot|random)\b|\*\*/

/** Modules the simulation reaches only through `import type`: none of their code runs in it. */
const TYPE_ONLY = new Set(['src/engine/audio.ts'])

/**
 * Code without its comments (block and line), so the doc blocks may name what
 * they avoid, and without whole powers of literals (`2 ** 32`), which are exact.
 */
const code = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ''))
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
    .replace(/\b\d+ \*\* \d+\b/g, '')

describe('the simulation sticks to deterministic math', () => {
  it('calls no engine-dependent Math function, nor **, in any of its modules', () => {
    // The co-op roots plus the solo replay's: everything a client or the server re-simulates.
    const modules = simModules([...SIM_ROOTS, 'src/game/replay.ts'], read).filter((m) => m.endsWith('.ts') && !TYPE_ONLY.has(m))
    expect(modules.length).toBeGreaterThan(100)
    const found = modules.flatMap((m) =>
      code(read(m) ?? '')
        .split('\n')
        .flatMap((line, i) => (BANNED.test(line) ? [`${m}:${i + 1}: ${line.trim()}`] : [])),
    )
    if (found.length) {
      // Identify which graph edges drag non-simulation code into a replay hash.
      const outside = modules.flatMap((from) =>
        importsOf(read(from) ?? '').flatMap((spec) => {
          const into = resolveImport(from, spec, (path) => read(path) !== null)
          return into && /^(src\/render\/|src\/ui\/|src\/engine\/(input|gamepad|pixelart|viewport)\.ts|src\/game\/bugReport\.ts)/.test(into)
            ? [`${from} -> ${into}`] : []
        }),
      )
      console.error('Simulation boundary imports (first 80):', outside.slice(0, 80))
    }
    expect(found).toEqual([])
  })
})
