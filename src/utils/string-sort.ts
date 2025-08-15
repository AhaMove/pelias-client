import deaccents from "../format/vietnam/deaccents"
import levenshteinDistance from "fast-levenshtein"
import { bigram, nGram } from "n-gram"

interface SimilarityScore {
  text: string
  score: number
}

// function levenshteinDistance(a: string, b: string): number {
//   if (a.length === 0) return b.length
//   if (b.length === 0) return a.length

//   const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

//   for (let i = 0; i <= a.length; i++) {
//     matrix[0][i] = i
//   }

//   for (let j = 0; j <= b.length; j++) {
//     matrix[j][0] = j
//   }

//   for (let j = 1; j <= b.length; j++) {
//     for (let i = 1; i <= a.length; i++) {
//       if (a[i - 1] === b[j - 1]) {
//         matrix[j][i] = matrix[j - 1][i - 1]
//       } else {
//         matrix[j][i] = Math.min(
//           matrix[j - 1][i] + 1,
//           matrix[j][i - 1] + 1,
//           matrix[j - 1][i - 1] + 1
//         )
//       }
//     }
//   }

//   return matrix[b.length][a.length]
// }

function jaroWinklerSimilarity(a: string, b: string): number {
  if (a === b) return 1.0

  const len1 = a.length
  const len2 = b.length
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1

  if (matchWindow < 0) return 0.0

  const matches1 = new Array(len1).fill(false)
  const matches2 = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, len2)

    for (let j = start; j < end; j++) {
      if (matches2[j] || a[i] !== b[j]) continue
      matches1[i] = true
      matches2[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0.0

  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!matches1[i]) continue
    while (!matches2[k]) k++
    if (a[i] !== b[k]) transpositions++
    k++
  }

  const jaro =
    (matches / len1 +
      matches / len2 +
      (matches - transpositions / 2) / matches) /
    3.0

  let prefix = 0
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (a[i] === b[i]) {
      prefix++
    } else {
      break
    }
  }

  return jaro + 0.1 * prefix * (1.0 - jaro)
}

function jaccardIndex(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/))
  const wordsB = new Set(b.toLowerCase().split(/\s+/))

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])

  return union.size === 0 ? 0 : intersection.size / union.size
}

// function nGramSimilarity(a: string, b: string, n = 2): number {
//   if (a.length < n || b.length < n) return 0

//   const getNGrams = (str: string): Set<string> => {
//     const grams = new Set<string>()
//     for (let i = 0; i <= str.length - n; i++) {
//       grams.add(str.substr(i, n))
//     }
//     return grams
//   }

//   const gramsA = getNGrams(a.toLowerCase())
//   const gramsB = getNGrams(b.toLowerCase())

//   const intersection = new Set([...gramsA].filter(x => gramsB.has(x)))
//   const union = new Set([...gramsA, ...gramsB])

//   return union.size === 0 ? 0 : intersection.size / union.size
// }

function nGramSimilarity(a: string, b: string, n = 2): number {
  if (a.length < n || b.length < n) return 0

  const gramFunction = n === 2 ? bigram : nGram(n)
  const gramsA = new Set(gramFunction(a.toLowerCase()))
  const gramsB = new Set(gramFunction(b.toLowerCase()))

  const intersection = new Set([...gramsA].filter((x) => gramsB.has(x)))
  const union = new Set([...gramsA, ...gramsB])

  return union.size === 0 ? 0 : intersection.size / union.size
}

function longestCommonSubstring(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0))
  let maxLength = 0

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1
        maxLength = Math.max(maxLength, matrix[i][j])
      }
    }
  }

  return maxLength / Math.max(a.length, b.length)
}

function normalizeText(text: string): string {
  return deaccents(text.toLowerCase().trim())
}

function containsWholeWords(target: string, input: string): boolean {
  if (!input || !target) return false

  // Split by spaces and commas only, keep "/" and "-" as part of words
  const inputWords = input.split(/[\s,]+/).filter((word) => word.length > 0)
  const targetWords = target.split(/[\s,]+/).filter((word) => word.length > 0)

  if (inputWords.length === 0 || targetWords.length === 0) return false
  if (inputWords.length > targetWords.length) return false

  // Check if input words appear consecutively in target
  for (let i = 0; i <= targetWords.length - inputWords.length; i++) {
    const consecutive = inputWords.every((word, index) => {
      const targetWord = targetWords[i + index]
      const isLastWord = index === inputWords.length - 1

      // Last word allows prefix match, others require exact match
      if (isLastWord) {
        return targetWord === word || targetWord.startsWith(word)
      }
      return targetWord === word
    })
    if (consecutive) return true
  }
  return false
}

function calculateSimilarity(input: string, target: string): number {
  const normalizedInput = normalizeText(input)
  const normalizedTarget = normalizeText(target)

  if (
    normalizedInput === normalizedTarget ||
    containsWholeWords(normalizedTarget, normalizedInput)
  )
    return 1.0

  const jaroWinkler = jaroWinklerSimilarity(normalizedInput, normalizedTarget)
  const levenshtein =
    1 -
    levenshteinDistance.get(normalizedInput, normalizedTarget) /
      Math.max(normalizedInput.length, normalizedTarget.length)
  const jaccard = jaccardIndex(normalizedInput, normalizedTarget)
  const nGram = nGramSimilarity(normalizedInput, normalizedTarget, 2)
  const lcs = longestCommonSubstring(normalizedInput, normalizedTarget)

  return (
    0.3 * jaroWinkler +
    0.25 * levenshtein +
    0.2 * jaccard +
    0.15 * nGram +
    0.1 * lcs
  )
}

function sortBySimilarity(inputString: string, stringList: string[]): string[] {
  if (!inputString || !stringList || stringList.length === 0) {
    return []
  }

  const scores: SimilarityScore[] = stringList.map((text) => ({
    text,
    score: calculateSimilarity(inputString, text),
  }))

  return scores.sort((a, b) => b.score - a.score).map((item) => item.text)
}

export { sortBySimilarity, calculateSimilarity }
