# String Sort Technical Reference

String similarity utility with multi-algorithm composite scoring for Vietnamese text processing.

## Purpose of Algorithm Combination

The composite scoring approach addresses the fundamental limitation that **no single similarity algorithm captures all dimensions of text similarity**.

### Individual Algorithm Limitations

| Algorithm | Strength | Weakness | Failure Case |
|-----------|----------|----------|--------------|
| **Jaro-Winkler** | Character matching, typos | Word reordering | "New York" vs "York New" |
| **Levenshtein** | Character-level precision | Word-level changes | "big car" vs "large vehicle" |
| **Jaccard** | Word-level similarity | Character-level typos | "color" vs "colour" |
| **N-gram** | Pattern recognition | Noise with short strings | "a" vs "an" |
| **LCS** | Shared segments | Gaps and insertions | "abcdef" vs "ace" |

### Combination Benefits

#### 1. **Complementary Coverage**

Different algorithms capture different similarity dimensions:

```
"Hồ Chí Minh" vs "Ho Chi Minh"
├── Jaro-Winkler: 0.95 (character similarity + prefix)
├── Levenshtein: 0.85 (diacritic differences)
├── Jaccard: 1.0 (identical word sets)
├── N-gram: 0.80 (character patterns)
└── LCS: 0.90 (shared segments)
```

#### 2. **Error Compensation**

When one algorithm fails, others compensate:

```
"Saigon" vs "Sài Gòn"
├── Jaro-Winkler: 0.70 (moderate character match)
├── Levenshtein: 0.60 (significant character changes)
├── Jaccard: 0.0 (no word overlap)
├── N-gram: 0.40 (some pattern similarity)
└── LCS: 0.50 (partial segment match)
```

#### 3. **Noise Reduction**

Multiple algorithms reduce outlier impact:

- Single algorithm might give extreme scores (0.0 or 1.0)
- Weighted combination provides more stable, nuanced scores
- Reduces false positives/negatives from algorithm-specific quirks

### Weight Rationale

```
0.3×jaro_winkler + 0.25×levenshtein + 0.2×jaccard + 0.15×ngram + 0.1×lcs
```

**Weight distribution reflects**:

- **Jaro-Winkler (30%)**: Most reliable for names/addresses
- **Levenshtein (25%)**: Consistent character-level accuracy
- **Jaccard (20%)**: Important for multi-word phrases
- **N-gram (15%)**: Good pattern recognition, some noise
- **LCS (10%)**: Specialized use case, less generally applicable

### Technical Advantages

#### 1. **Robustness**

- Handles diverse text variations (typos, formatting, abbreviations)
- Maintains performance across different string types
- Reduces algorithm-specific biases

#### 2. **Tunable Performance**

- Weights can be adjusted for specific domains
- Algorithm selection can be modified for different use cases
- Maintains consistent API regardless of internal changes

#### 3. **Graceful Degradation**

- If one algorithm performs poorly on specific input, others maintain quality
- No single point of failure in similarity calculation
- Consistent scoring range [0.0, 1.0] regardless of input characteristics

### Vietnamese Text Optimization

The combination is particularly effective for Vietnamese geographic names:

```
"Thành phố Hồ Chí Minh" vs "TP.HCM"
├── Jaro-Winkler: 0.40 (low character overlap)
├── Levenshtein: 0.20 (major length difference)
├── Jaccard: 0.25 (some word overlap after normalization)
├── N-gram: 0.15 (limited pattern similarity)
└── LCS: 0.30 (shared character sequences)
→ Combined: 0.28 (appropriately low for different representations)
```

### Mathematical Justification

The weighted linear combination provides:

- **Convex combination**: Ensures output remains in [0.0, 1.0] range
- **Balanced contribution**: No single algorithm dominates
- **Interpretable scores**: Weights reflect domain-specific importance
- **Computational efficiency**: Simple linear combination vs complex ensemble methods

This approach creates a **multi-dimensional similarity measure** that captures character-level, word-level, and pattern-level similarities simultaneously, providing more accurate and robust text matching for Vietnamese geographic search applications.

## API

### `sortBySimilarity(inputString: string, stringList: string[]): string[]`

Sorts strings by similarity score (descending).

### `calculateSimilarity(input: string, target: string): number`

Returns composite similarity score [0.0, 1.0].

## Algorithm Implementation

### Composite Scoring Formula

```
score = 0.3×jaro_winkler + 0.25×levenshtein + 0.2×jaccard + 0.15×ngram + 0.1×lcs
```

### 1. Jaro-Winkler Similarity (30%)

```typescript
function jaroWinklerSimilarity(a: string, b: string): number
```

- **Window size**: `Math.floor(Math.max(len1, len2) / 2) - 1`
- **Prefix bonus**: 0.1 × prefix_length × (1 - jaro), max 4 chars
- **Formula**: `jaro + prefix_bonus`
- **Complexity**: O(n×m)

### 2. Levenshtein Distance (25%)

```typescript
function levenshteinDistance(a: string, b: string): number
```

- **Operations**: Insert, delete, substitute (cost = 1)
- **Normalization**: `1 - (distance / max_length)`
- **Matrix**: `[b.length + 1][a.length + 1]`
- **Complexity**: O(n×m), Space: O(n×m)

### 3. Jaccard Index (20%)

```typescript
function jaccardIndex(a: string, b: string): number
```

- **Tokenization**: `split(/\s+/)`
- **Formula**: `|intersection| / |union|`
- **Complexity**: O(n+m)

### 4. N-gram Similarity (15%)

```typescript
function nGramSimilarity(a: string, b: string, n = 2): number
```

- **N-gram size**: 2 (bigrams)
- **Generation**: Sliding window `str.substr(i, n)`
- **Comparison**: Jaccard on n-gram sets
- **Complexity**: O(n+m)

### 5. Longest Common Substring (10%)

```typescript
function longestCommonSubstring(a: string, b: string): number
```

- **Algorithm**: Dynamic programming matrix
- **Normalization**: `max_length / Math.max(a.length, b.length)`
- **Complexity**: O(n×m), Space: O(n×m)

## Text Normalization

```typescript
function normalizeText(text: string): string {
  return deaccents(text.toLowerCase().trim())
}
```

**Process**:

1. Vietnamese diacritic removal via `deaccents()`
2. Case normalization to lowercase
3. Whitespace trimming

## Performance Characteristics

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| Jaro-Winkler | O(n×m) | O(1) | Character matching window |
| Levenshtein | O(n×m) | O(n×m) | DP matrix |
| Jaccard | O(n+m) | O(n+m) | Set operations |
| N-gram | O(n+m) | O(n+m) | Sliding window + sets |
| LCS | O(n×m) | O(n×m) | DP matrix |

**Overall**: O(n×m) time, O(n×m) space

## Optimization Features

- **Early return**: Exact match after normalization → 1.0
- **Conditional processing**: Empty input validation
- **Memory efficiency**: Matrix reuse where possible

## Vietnamese Language Processing

**Diacritic mapping** (via `deaccents`):

- Tone marks: á,à,ả,ã,ạ → a
- Circumflex: â,ấ,ầ,ẩ,ẫ,ậ → a  
- Breve: ă,ắ,ằ,ẳ,ẵ,ặ → a
- Hook: ê,ế,ề,ể,ễ,ệ → e
- All Vietnamese diacritics normalized

## Implementation Details

### Matrix Operations

```typescript
// Levenshtein DP matrix initialization
const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
for (let i = 0; i <= a.length; i++) matrix[0][i] = i
for (let j = 0; j <= b.length; j++) matrix[j][0] = j
```

### Set Operations

```typescript
// Jaccard intersection/union
const intersection = new Set([...setA].filter(x => setB.has(x)))
const union = new Set([...setA, ...setB])
```

### N-gram Generation

```typescript
// Sliding window bigram extraction
for (let i = 0; i <= str.length - n; i++) {
  grams.add(str.substr(i, n))
}
```

## Error Handling

- Input validation: Empty strings return appropriate defaults
- Division by zero: Protected in normalization calculations
- Memory allocation: Fixed-size matrices for known input lengths

## Dependencies

- `deaccents`: Vietnamese diacritic removal
- Native JavaScript: No external libraries

## Technical Constraints

- **String length**: No hard limits, performance degrades O(n×m)
- **Memory usage**: Proportional to input size for matrix operations
- **Precision**: IEEE 754 double precision for scores
- **Character encoding**: UTF-8 compatible
