import { describe, it, expect } from 'vitest'
import { toInt } from '@/types'

describe('toInt', () => {
  // Happy paths
  it('should convert valid number to Int', () => {
    expect(toInt(42)).toBe(42)
  })

  it('should convert valid string to Int', () => {
    expect(toInt('42')).toBe(42)
  })

  it('should convert negative string to Int', () => {
    expect(toInt('-10')).toBe(-10)
  })

  // Edge cases
  it('should return null for invalid string abc', () => {
    expect(toInt('abc')).toBe(null)
  })

  it('should return floor rounded for decimal string', () => {
    expect(toInt('42.5')).toBe(42)
  })

  it('should return null for scientific notation string', () => {
    expect(toInt('1e2')).toBe(null)
  })

  it('should return null for empty string', () => {
    expect(toInt('')).toBe(null)
  })

  it('should convert whitespace string to Int', () => {
    expect(toInt('  42  ')).toBe(42)
  })

  // Error scenarios
  it('should return null for NaN', () => {
    expect(toInt(NaN)).toBe(null)
  })

  it('should return floor rounded for decimal number', () => {
    expect(toInt(42.5)).toBe(42)
  })

  it('should return null for null input', () => {
    expect(toInt(null as any)).toBe(null)
  })

  it('should return null for undefined input', () => {
    expect(toInt(undefined as any)).toBe(null)
  })
})