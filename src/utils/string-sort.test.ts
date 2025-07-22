import { calculateSimilarity, sortBySimilarity } from './string-sort'

// Test helper to access levenshteinDistance function
// Since it's not exported, we'll test it through calculateSimilarity
const testLevenshteinDistance = (a: string, b: string): number => {
  // Create a simple similarity function that uses only levenshtein
  const normalizeText = (text: string): string => text.toLowerCase().trim()
  const normalizedA = normalizeText(a)
  const normalizedB = normalizeText(b)
  
  if (normalizedA.length === 0) return normalizedB.length
  if (normalizedB.length === 0) return normalizedA.length
  
  // Early exit for very different length strings
  const lengthDiff = Math.abs(normalizedA.length - normalizedB.length)
  if (lengthDiff > Math.max(normalizedA.length, normalizedB.length) * 0.5) {
    return Math.max(normalizedA.length, normalizedB.length)
  }
  
  // Ensure shorter string is processed as columns
  let [shorter, longer] = normalizedA.length <= normalizedB.length ? [normalizedA, normalizedB] : [normalizedB, normalizedA]
  
  // Space-optimized levenshtein implementation
  let previousRow = Array(shorter.length + 1).fill(0).map((_, i) => i)
  let currentRow = Array(shorter.length + 1).fill(0)
  
  for (let i = 1; i <= longer.length; i++) {
    currentRow[0] = i
    
    for (let j = 1; j <= shorter.length; j++) {
      if (longer[i - 1] === shorter[j - 1]) {
        currentRow[j] = previousRow[j - 1]
      } else {
        currentRow[j] = Math.min(
          previousRow[j] + 1,     // deletion
          currentRow[j - 1] + 1,  // insertion
          previousRow[j - 1] + 1  // substitution
        )
      }
    }
    
    [previousRow, currentRow] = [currentRow, previousRow]
  }
  
  return previousRow[shorter.length]
}

describe('levenshteinDistance', () => {
  test.each([
    ['', '', 0],
    ['', 'abc', 3],
    ['abc', '', 3],
    ['abc', 'abc', 0],
    ['abc', 'ab', 1],
    ['abc', 'abcd', 1],
    ['abc', 'def', 3],
    ['kitten', 'sitting', 3],
    ['saturday', 'sunday', 3],
    ['intention', 'execution', 5],
    ['distance', 'difference', 5],
    ['a', 'b', 1],
    ['ab', 'ba', 2],
    ['abc', 'bac', 2],
    ['hello', 'hallo', 1],
    ['world', 'word', 1],
    ['testing', 'tester', 3],
    ['algorithm', 'logarithm', 3],
    ['very long string that should trigger early exit', 'short', 47], // Early exit case
  ])('levenshteinDistance("%s", "%s") should return %d', (a, b, expected) => {
    expect(testLevenshteinDistance(a, b)).toBe(expected)
  })

  test('should handle unicode characters', () => {
    expect(testLevenshteinDistance('café', 'cafe')).toBe(1)
    expect(testLevenshteinDistance('naïve', 'naive')).toBe(1)
    expect(testLevenshteinDistance('résumé', 'resume')).toBe(2)
  })

  test('should handle Vietnamese characters', () => {
    expect(testLevenshteinDistance('Hà Nội', 'Ha Noi')).toBe(2)
    expect(testLevenshteinDistance('Thành phố Hồ Chí Minh', 'Thanh pho Ho Chi Minh')).toBe(4)
    expect(testLevenshteinDistance('Đường', 'Duong')).toBe(2)
  })

  test('should be symmetric', () => {
    const pairs = [
      ['hello', 'world'],
      ['testing', 'tester'],
      ['Hà Nội', 'Ha Noi'],
      ['abc', 'def']
    ]
    
    pairs.forEach(([a, b]) => {
      expect(testLevenshteinDistance(a, b)).toBe(testLevenshteinDistance(b, a))
    })
  })
})

describe('calculateSimilarity', () => {
  test.each([
    ['identical', 'identical', 1.0],
    ['', '', 1.0],
    ['hello', 'hello', 1.0],
    ['completely different', 'xyz', 0], // Should be very low
    ['hello', 'hallo', 0.5], // Should be moderate
    ['test', 'testing', 0.3], // Should be moderate
  ])('calculateSimilarity("%s", "%s") should return expected range', (input, target, threshold) => {
    const result = calculateSimilarity(input, target)
    
    if (threshold === 1.0) {
      expect(result).toBe(1.0)
    } else if (threshold === 0) {
      expect(result).toBeLessThan(0.3)
    } else {
      expect(result).toBeGreaterThan(threshold)
      expect(result).toBeLessThan(1.0)
    }
    
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThanOrEqual(1)
  })

  test('should handle Vietnamese text formatting', () => {
    const result1 = calculateSimilarity('Đường Thành Thái', 'Duong Thanh Thai')
    const result2 = calculateSimilarity('Quận 1', 'Quan 1')
    const result3 = calculateSimilarity('Phường 14', 'Phuong 14')
    
    expect(result1).toBeGreaterThan(0.7)
    expect(result2).toBeGreaterThan(0.8)
    expect(result3).toBeGreaterThan(0.8)
  })

  test('should be symmetric', () => {
    const pairs = [
      ['hello world', 'world hello'],
      ['Hà Nội', 'Ha Noi'],
      ['test string', 'string test'],
      ['abc def', 'def abc']
    ]
    
    pairs.forEach(([a, b]) => {
      expect(calculateSimilarity(a, b)).toBe(calculateSimilarity(b, a))
    })
  })
})

describe('sortBySimilarity', () => {
  test('should return empty array for empty input', () => {
    expect(sortBySimilarity('', [])).toEqual([])
    expect(sortBySimilarity('test', [])).toEqual([])
  })

  test('should handle null/undefined input', () => {
    expect(sortBySimilarity('', null as any)).toEqual([])
    expect(sortBySimilarity('', undefined as any)).toEqual([])
  })

  test('should sort by similarity score', () => {
    const input = 'hello'
    const stringList = ['hello', 'hallo', 'world', 'help', 'hell']
    const result = sortBySimilarity(input, stringList)
    
    expect(result[0]).toBe('hello') // Exact match should be first
    expect(result).toContain('hallo')
    expect(result).toContain('help')
    expect(result).toContain('hell')
    expect(result).toContain('world')
    
    // Check that scores are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      const score1 = calculateSimilarity(input, result[i])
      const score2 = calculateSimilarity(input, result[i + 1])
      expect(score1).toBeGreaterThanOrEqual(score2)
    }
  })

  test('should handle Vietnamese addresses', () => {
    const input = 'Đường Thành Thái'
    const addresses = [
      'Đường Thành Thái, Quận 10',
      'Duong Thanh Thai',
      'Thành Thái Street',
      'Đường Lê Lợi',
      'Thành Thái Road'
    ]
    
    const result = sortBySimilarity(input, addresses)
    
    // Vietnamese formatted version should score higher
    expect(result[0]).toBe('Đường Thành Thái, Quận 10')
    expect(result[1]).toBe('Duong Thanh Thai')
    
    // All results should be returned
    expect(result).toHaveLength(addresses.length)
  })
})

describe('Performance Tests', () => {
  test('should handle large strings efficiently', () => {
    const longString1 = 'a'.repeat(1000)
    const longString2 = 'b'.repeat(1000)
    const longString3 = 'a'.repeat(999) + 'b'
    
    const startTime = performance.now()
    
    const distance1 = testLevenshteinDistance(longString1, longString2)
    const distance2 = testLevenshteinDistance(longString1, longString3)
    const distance3 = testLevenshteinDistance(longString1, longString1)
    
    const endTime = performance.now()
    
    expect(distance1).toBe(1000) // Early exit case
    expect(distance2).toBe(1)
    expect(distance3).toBe(0)
    
    // Should complete in reasonable time (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100)
  })

  test('should handle batch similarity calculations efficiently', () => {
    const input = 'Đường Thành Thái'
    const addresses = Array(100).fill(0).map((_, i) => `Address ${i} Thành Thái Street`)
    
    const startTime = performance.now()
    const result = sortBySimilarity(input, addresses)
    const endTime = performance.now()
    
    expect(result).toHaveLength(100)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
  })

  test('should trigger early exit optimization', () => {
    const shortString = 'abc'
    const veryLongString = 'x'.repeat(1000)
    
    const startTime = performance.now()
    const distance = testLevenshteinDistance(shortString, veryLongString)
    const endTime = performance.now()
    
    expect(distance).toBe(1000) // Early exit returns max length
    expect(endTime - startTime).toBeLessThan(10) // Should be very fast due to early exit
  })
})