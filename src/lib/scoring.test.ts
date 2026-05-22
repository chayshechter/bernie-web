import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoring'

describe('calculateScore', () => {
  it('returns 100 for a perfect guess at any price', () => {
    expect(calculateScore(3, 3)).toBe(100) // tiny cheap car
    expect(calculateScore(10555, 10555)).toBe(100) // cheap branch
    expect(calculateScore(25000, 25000)).toBe(100) // exactly on the split
    expect(calculateScore(204000, 204000)).toBe(100) // expensive branch
  })

  describe('cheap branch (actual < $25,000) hits the anchor points', () => {
    // actual is a fixed cheap car; guess = actual + dollarsOff.
    const actual = 24000
    const anchors: ReadonlyArray<[dollarsOff: number, score: number]> = [
      [0, 100],
      [1000, 92],
      [2500, 82],
      [5000, 70],
      [7500, 60],
      [10000, 52],
      [15000, 30],
      [20000, 12],
      [25000, 4],
    ]

    for (const [dollarsOff, expected] of anchors) {
      it(`$${dollarsOff} off -> ${expected} pts`, () => {
        expect(calculateScore(actual + dollarsOff, actual)).toBe(expected)
        // direction of the miss should not matter (skip when an under-guess
        // would go negative — not a realistic guess)
        if (actual - dollarsOff >= 0) {
          expect(calculateScore(actual - dollarsOff, actual)).toBe(expected)
        }
      })
    }

    it('flattens to the floor beyond $25,000 off', () => {
      expect(calculateScore(actual + 30000, actual)).toBe(4)
      expect(calculateScore(actual + 100000, actual)).toBe(4)
    })

    it('interpolates smoothly and monotonically between anchors', () => {
      let prev = Infinity
      for (let dollarsOff = 0; dollarsOff <= 26000; dollarsOff += 250) {
        const score = calculateScore(actual + dollarsOff, actual)
        expect(score).toBeLessThanOrEqual(prev) // bigger miss is never better
        expect(Number.isInteger(score)).toBe(true)
        expect(score).toBeGreaterThanOrEqual(3)
        expect(score).toBeLessThanOrEqual(100)
        prev = score
      }
    })
  })

  describe('the $25,000 boundary', () => {
    // A $5,000 miss, evaluated just above and just below the split.
    it('at $25,000 uses the percentage formula (20% off -> 80)', () => {
      expect(calculateScore(20000, 25000)).toBe(80)
    })

    it('just below $25,000 uses the dollar curve ($5,000 off -> 70)', () => {
      expect(calculateScore(19999, 24999)).toBe(70)
    })
  })

  describe('expensive branch (actual >= $25,000)', () => {
    it('keeps the percentage-off formula', () => {
      // 10% off a $50k car -> 90
      expect(calculateScore(45000, 50000)).toBe(90)
    })

    it('floors a wild over-guess instead of returning 0', () => {
      // $7k guess on a $204k car: ~96.6% off -> floored at 3
      const score = calculateScore(7000, 204000)
      expect(score).toBe(3)
      expect(score).toBeGreaterThanOrEqual(3)
    })
  })

  describe('edge cases', () => {
    it('handles an over-guess on a cheap car without crashing', () => {
      // $15k guess on a $6k car: $9k off, cheap branch
      const score = calculateScore(15000, 6000)
      expect(score).toBe(55) // interpolated between $7.5k (60) and $10k (52)
      expect(score).toBeGreaterThan(3)
      expect(score).toBeLessThan(100)
      expect(Number.isInteger(score)).toBe(true)
    })

    it('returns the floor when actual price is zero or negative', () => {
      expect(calculateScore(5000, 0)).toBe(3)
      expect(calculateScore(0, 0)).toBe(3)
      expect(calculateScore(100, -50)).toBe(3)
    })

    it('always returns an integer in [3, 100]', () => {
      const cases: Array<[number, number]> = [
        [0, 1],
        [9999999, 1000],
        [0, 25000],
        [12345, 67890],
        [500, 24999],
      ]
      for (const [guess, actual] of cases) {
        const score = calculateScore(guess, actual)
        expect(Number.isInteger(score)).toBe(true)
        expect(score).toBeGreaterThanOrEqual(3)
        expect(score).toBeLessThanOrEqual(100)
      }
    })
  })
})
