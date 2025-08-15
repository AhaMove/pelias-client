import { AddressParts } from "src/models/address-parts.model"
import provincesRegex from "src/data/vietnam/provinces-regex.json"
import districtsRegex from "src/data/vietnam/districts-regex.json"
import wardsRegex from "src/data/vietnam/wards-regex.json"

// Compile regex patterns for better performance
const compiledProvincePatterns = Object.entries(provincesRegex).map(
  ([nameWithId, pattern]) => ({
    nameWithId,
    regex: new RegExp(pattern, "gi"),
  })
)

// Cache for compiled district regex patterns by region
const districtRegexCache = new Map<
  string,
  Array<{ nameWithId: string; regex: RegExp }>
>()

// Cache for compiled ward regex patterns by county (composite key)
const wardRegexCache = new Map<
  string,
  Array<{ nameWithId: string; regex: RegExp }>
>()

// Helper function to get districts for a specific region ID
const getDistrictsForRegion = (regionId: string) => {
  // Check cache first
  if (districtRegexCache.has(regionId)) {
    return districtRegexCache.get(regionId)!
  }

  // Compile and cache patterns for this region
  const districts = (districtsRegex as any)[regionId] || {}
  const compiled = Object.entries(districts).map(([nameWithId, pattern]) => ({
    nameWithId,
    regex: new RegExp(pattern as string, "gi"),
  }))

  districtRegexCache.set(regionId, compiled)
  return compiled
}

// Helper function to get wards for specific region and county IDs
const getWardsForCounty = (regionId: string, countyId: string) => {
  const parentKey = `${regionId},${countyId}` // Note: region_id,district_id format

  // Check cache first
  if (wardRegexCache.has(parentKey)) {
    return wardRegexCache.get(parentKey)!
  }

  // Compile and cache patterns for this county
  const wards = (wardsRegex as any)[parentKey] || {}
  const compiled = Object.entries(wards).map(([nameWithId, pattern]) => ({
    nameWithId,
    regex: new RegExp(pattern as string, "gi"),
  }))

  wardRegexCache.set(parentKey, compiled)
  return compiled
}

// Helper function to split name-id format and extract components
const splitNameId = (nameWithId: string) => {
  const lastDashIndex = nameWithId.lastIndexOf("-")
  if (lastDashIndex === -1) {
    return { name: nameWithId, id: "" }
  }
  return {
    name: nameWithId.substring(0, lastDashIndex),
    id: nameWithId.substring(lastDashIndex + 1),
  }
}

// Fallback function to search all districts with metadata
const findAllCountyMatches = (text: string) => {
  const matches: Array<{
    name: string
    id: string
    regionId: string
    nameWithId: string
    match: string
    index: number
  }> = []

  // Search through all regions and their districts
  Object.entries(districtsRegex).forEach(([regionId, districts]) => {
    Object.entries(districts as any).forEach(([nameWithId, pattern]) => {
      const regex = new RegExp(pattern as string, "gi")
      const match = text.match(regex)
      if (match) {
        const { name, id } = splitNameId(nameWithId)
        matches.push({
          name,
          id,
          regionId,
          nameWithId,
          match: match[0],
          index: text.indexOf(match[0]),
        })
      }
    })
  })

  // Sort by match length (longest first) for better accuracy
  return matches.sort((a, b) => b.match.length - a.match.length)
}

// Fallback function to search all wards with metadata
const findAllLocalityMatches = (text: string) => {
  const matches: Array<{
    name: string
    id: string
    countyId: string
    regionId: string
    nameWithId: string
    match: string
    index: number
  }> = []

  // Search through all parent keys and their wards
  Object.entries(wardsRegex).forEach(([parentKey, wards]) => {
    const [regionId, countyId] = parentKey.split(",")
    Object.entries(wards as any).forEach(([nameWithId, pattern]) => {
      const regex = new RegExp(pattern as string, "gi")
      const match = text.match(regex)
      if (match) {
        const { name, id } = splitNameId(nameWithId)
        matches.push({
          name,
          id,
          countyId,
          regionId,
          nameWithId,
          match: match[0],
          index: text.indexOf(match[0]),
        })
      }
    })
  })

  // Sort by match length (longest first) for better accuracy
  return matches.sort((a, b) => b.match.length - a.match.length)
}

// Smart selection for ambiguous locality matches based on context
const selectBestLocalityMatch = (
  matches: Array<{
    name: string
    id: string
    countyId: string
    regionId: string
    nameWithId: string
    match: string
    index: number
  }>,
  regionId?: string,
  countyId?: string
) => {
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  // Priority 1: Both region and county match
  if (regionId && countyId) {
    const exact = matches.find(
      (m) => m.regionId === regionId && m.countyId === countyId
    )
    if (exact) return exact
  }

  // Priority 2: Region matches
  if (regionId) {
    const regionMatch = matches.find((m) => m.regionId === regionId)
    if (regionMatch) return regionMatch
  }

  // Priority 3: County matches (less reliable without region context)
  if (countyId) {
    const countyMatch = matches.find((m) => m.countyId === countyId)
    if (countyMatch) return countyMatch
  }

  // Priority 4: Default to first match (longest match due to sorting)
  return matches[0]
}

// Smart selection for ambiguous county matches based on context
const selectBestCountyMatch = (
  matches: Array<{
    name: string
    id: string
    regionId: string
    nameWithId: string
    match: string
    index: number
  }>,
  regionId?: string
) => {
  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  // Priority 1: Region matches
  if (regionId) {
    const regionMatch = matches.find((m) => m.regionId === regionId)
    if (regionMatch) return regionMatch
  }

  // Priority 2: Default to first match (longest match due to sorting)
  return matches[0]
}

// Country detection (keep simple approach)
const hasCountry = (text: string) => {
  return /Việt Nam/gi.test(text)
}

const findCountry = (text: string) => {
  return hasCountry(text) ? "Việt Nam" : ""
}

// Regex-based administrative division extraction
const findRegionByRegex = (text: string) => {
  let bestMatch = null
  let longestMatchLength = 0

  for (const { nameWithId, regex } of compiledProvincePatterns) {
    const match = text.match(regex)
    if (match && match[0].length > longestMatchLength) {
      longestMatchLength = match[0].length
      const { name, id } = splitNameId(nameWithId)
      bestMatch = {
        name,
        id,
        nameWithId,
        match: match[0],
        index: text.indexOf(match[0]),
      }
    }
  }
  return bestMatch
}

// Helper function to get all district matches for a specific region (useful for HCM city complexity)
const findAllCountyMatchesForRegion = (text: string, regionId: string) => {
  const matches: Array<{
    name: string
    id: string
    regionId: string
    nameWithId: string
    match: string
    index: number
  }> = []

  // Get district patterns for the specific region
  const districtPatterns = getDistrictsForRegion(regionId)

  for (const { nameWithId, regex } of districtPatterns) {
    const match = text.match(regex)
    if (match) {
      const { name, id } = splitNameId(nameWithId)
      matches.push({
        name,
        id,
        regionId,
        nameWithId,
        match: match[0],
        index: text.indexOf(match[0]),
      })
    }
  }

  // Sort by match length (longest first) for better accuracy
  return matches.sort((a, b) => b.match.length - a.match.length)
}

const findCountyByRegex = (text: string, regionId?: string) => {
  // For HCM City (ID 79), use the multi-match function to capture all district possibilities
  if (regionId === "79") {
    const allMatches = findAllCountyMatchesForRegion(text, regionId)
    // Return the best match (longest) but also preserve all matches for later use
    if (allMatches.length > 0) {
      const bestMatch = allMatches[0] // Already sorted by length
      return {
        ...bestMatch,
        allMatches, // Include all matches for HCM city
      }
    }
    return null
  }

  // Original logic for other regions
  let bestMatch = null
  let longestMatchLength = 0

  // If regionId is provided, only search districts in that region
  const districtPatterns = regionId ? getDistrictsForRegion(regionId) : []

  for (const { nameWithId, regex } of districtPatterns) {
    const match = text.match(regex)
    if (match && match[0].length > longestMatchLength) {
      longestMatchLength = match[0].length
      const { name, id } = splitNameId(nameWithId)
      bestMatch = {
        name,
        id,
        nameWithId,
        match: match[0],
        index: text.indexOf(match[0]),
      }
    }
  }
  return bestMatch
}

const findLocalityByRegex = (
  text: string,
  regionId?: string,
  countyId?: string,
  excludeNames?: string[]
) => {
  let bestMatch = null
  let longestMatchLength = 0

  // If both regionId and countyId are provided, only search wards in that county
  const wardPatterns =
    regionId && countyId ? getWardsForCounty(regionId, countyId) : []

  for (const { nameWithId, regex } of wardPatterns) {
    const match = text.match(regex)
    if (match) {
      const { name, id } = splitNameId(nameWithId)

      // Skip if this name is already matched at a higher administrative level
      if (excludeNames?.includes(name)) {
        continue
      }

      if (match[0].length > longestMatchLength) {
        longestMatchLength = match[0].length
        bestMatch = {
          name,
          id,
          nameWithId,
          match: match[0],
          index: text.indexOf(match[0]),
        }
      }
    }
  }
  return bestMatch
}

// Helper function to check if a number is valid for Vietnamese addresses
const isValidAddressNumber = (number: string): boolean => {
  if (!number) return false
  // Must contain at least one digit OR be a proper alphanumeric code (not just single letters)
  return /[0-9]/.test(number) || /^[A-Za-z][0-9]/.test(number)
}

// Helper function to detect if text looks like a venue name
const looksLikeVenue = (text: string): boolean => {
  if (!text || text.length < 3) return false
  if (isAddress(text)) return false
  if (/^[A-Za-z]{0,3}[0-9]/.test(text.trim())) return false
  return true
}

// Helper function to build consistent result
const buildAddressResult = (
  number?: string,
  street?: string,
  fallbackAddress?: string
) => {
  let address = ""

  if (number && street) {
    address = `${number} ${street}`
  } else if (number) {
    address = number
  } else if (fallbackAddress) {
    address = fallbackAddress
  }

  return {
    number: number || undefined,
    street: street || undefined,
    address: address || undefined,
  }
}

// Try parsing with standard address patterns
const tryStandardParsing = (text: string) => {
  // Pattern 1: "123A Nguyen Van Cu" or "Z06 Duong So 13" (number + space + street)
  const standardMatch = text.match(
    /^([A-Za-z]{0,3}[0-9][A-Za-z0-9\-/]*)\s+(.+?)(?:,|$)/
  )
  if (standardMatch) {
    return buildAddressResult(standardMatch[1], standardMatch[2])
  }

  // Pattern 2: Number only at start "123A" or "Z06" or "7/28" or "A2-15/3"
  const numberOnlyMatch = text.match(
    /^([A-Za-z]{0,3}[0-9][A-Za-z0-9\-/]*)(?:\s*,|$|\s|$)/
  )
  if (numberOnlyMatch) {
    return buildAddressResult(numberOnlyMatch[1])
  }

  // Pattern 3: Vietnamese prefixes "S� 123 Nguyen Van Cu"
  const prefixMatch = text.match(
    /^(?:s�|ng�|h�m)\s+([A-Za-z0-9\-/]+)(?:\s+(.+?))?(?:,|$)/i
  )
  if (prefixMatch) {
    return buildAddressResult(prefixMatch[1], prefixMatch[2])
  }

  return null
}

// Try parsing "Ph�" format
const tryPhoParsing = (text: string) => {
  const phoMatch = /Ph�((?:(?!Ph�).)*?(\s{2}|(?=,)))/.exec(text)
  if (phoMatch) {
    const street = phoMatch[0]
    const number = text.slice(0, phoMatch.index).replace(/,/gi, "").trim()
    return buildAddressResult(number || undefined, street)
  }
  return null
}

const extractAddress = (text: string) => {
  const parts = text.split(",").map((p) => p.trim())

  // Strategy 1: Try direct parsing from start
  let result = tryStandardParsing(text)
  if (result && result.number && isValidAddressNumber(result.number)) {
    return result
  }

  // Strategy 2: Skip potential venue, parse from second part
  if (parts.length > 1 && looksLikeVenue(parts[0])) {
    const remainingText = parts.slice(1).join(", ")
    result = tryStandardParsing(remainingText)
    if (result && result.number && isValidAddressNumber(result.number)) {
      return result
    }
  }

  // Strategy 3: Try "Ph�" pattern
  result = tryPhoParsing(text)
  if (result && result.number && isValidAddressNumber(result.number)) {
    return result
  }

  // Strategy 4: Simple fallback - if text starts with address-like pattern, extract it
  const simpleMatch = text.match(/^([A-Za-z0-9\-/]+)(?:\s|,|$)/)
  if (simpleMatch && isValidAddressNumber(simpleMatch[1])) {
    return buildAddressResult(simpleMatch[1])
  }

  // Final fallback: Return first part as address
  return buildAddressResult(undefined, undefined, parts[0])
}

export const isAddress = (text: string): RegExpMatchArray | null => {
  let firstPart = text.split(",")[0].trim()
  firstPart = firstPart
    .replace(
      /^(ng�|ngo|ng�ch|ngach|h�m|hem|s�|s�|so|s� nh�|s� nha|so nha|sn|nh� s�|nha s�|nha so)\s+([A-Z]?[0-9])/i,
      "$2"
    )
    .trim()

  return firstPart.match(/^[A-Z]?[0-9][A-Z\-/0-9]*(?=\s|$)/i)
}

export const extractVenue = (text: string): string => {
  if (isAddress(text)) {
    return ""
  }

  // Since admin divisions are already removed, we need to separate venue from address
  const parts = text.split(",").map((p) => p.trim())
  const venueParts = []

  for (const part of parts) {
    // Stop when we hit an address pattern
    if (isAddress(part)) {
      break
    }
    venueParts.push(part)
  }

  const venue = venueParts.join(", ").replace(/,\s*$/, "").trim()

  // Validate it's not empty after cleaning
  if (
    !venue.replace(
      /[^a-z0-9àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi,
      ""
    )
  ) {
    return ""
  }

  return venue
}

// Helper function to check if two matches overlap
const isOverlapping = (
  match1: { match: string; index: number },
  match2: { match: string; index: number }
) => {
  const start1 = match1.index
  const end1 = match1.index + match1.match.length
  const start2 = match2.index
  const end2 = match2.index + match2.match.length

  // Check if one match is contained within another
  return (
    (start1 <= start2 && end1 >= end2) || // match1 contains match2
    (start2 <= start1 && end2 >= end1) || // match2 contains match1
    (start1 < end2 && end1 > start2) // partial overlap
  )
}

// Helper function to remove overlapping matches, keeping the longest ones
const removeOverlappingMatches = (
  matches: Array<{ name: string; match: string; index: number }>
): Array<{ name: string; match: string; index: number }> => {
  const sortedMatches = matches.sort((a, b) => b.match.length - a.match.length)
  const nonOverlapping: Array<{ name: string; match: string; index: number }> =
    []

  for (const match of sortedMatches) {
    const hasOverlap = nonOverlapping.some((existing) =>
      isOverlapping(match, existing)
    )

    if (!hasOverlap) {
      nonOverlapping.push(match)
    }
  }

  return nonOverlapping
}

// Helper function to remove matched administrative parts from text
const removeMatchedParts = (
  text: string,
  matches: Array<{ match: string; index: number }>
) => {
  // Sort by index in descending order to avoid index shifting
  const sortedMatches = matches.sort((a, b) => b.index - a.index)
  let cleanedText = text

  for (const { match, index } of sortedMatches) {
    // Remove the match and surrounding commas/whitespace
    cleanedText =
      cleanedText.substring(0, index) +
      cleanedText
        .substring(index + match.length)
        .replace(/^\s*,\s*|,\s*$|\s+/g, " ")
        .trim()
  }

  return cleanedText.replace(/,\s*,/g, ",").replace(/^,|,$/g, "").trim()
}

export const extractV2 = (text: string): AddressParts => {
  const originalText = text.trim()

  // Extract country
  const country = findCountry(originalText)

  // Check if this looks like a street address first (number + street name)
  const hasStreetAddressPattern =
    /^([A-Za-z]{0,3}[0-9][A-Za-z0-9\-/]*)\s+(.+?)(?:,|$)/.test(originalText)

  // Extract administrative divisions using hybrid hierarchical + fallback approach
  const regionMatch = findRegionByRegex(originalText)

  // Try hierarchical search for county first
  let countyMatch = regionMatch
    ? findCountyByRegex(originalText, regionMatch.id)
    : null

  // If no county found, try fallback search with context validation
  if (!countyMatch) {
    const allCountyMatches = findAllCountyMatches(originalText)
    if (allCountyMatches.length > 0) {
      countyMatch = selectBestCountyMatch(allCountyMatches, regionMatch?.id)
    }
  }

  // Try hierarchical search for locality first
  // Exclude already matched administrative names to avoid duplicates
  const excludeNames = [regionMatch?.name, countyMatch?.name].filter(
    Boolean
  ) as string[]
  let localityMatch =
    regionMatch && countyMatch
      ? findLocalityByRegex(
          originalText,
          regionMatch.id,
          countyMatch.id,
          excludeNames
        )
      : null

  // If no locality found, try fallback search with context validation
  if (!localityMatch) {
    const allLocalityMatches = findAllLocalityMatches(originalText)
    if (allLocalityMatches.length > 0) {
      localityMatch = selectBestLocalityMatch(
        allLocalityMatches,
        regionMatch?.id,
        countyMatch?.id
      )
    }
  }

  // Collect all potential administrative matches
  const allAdminMatches: Array<{ name: string; match: string; index: number }> =
    []
  if (regionMatch) allAdminMatches.push(regionMatch)
  if (countyMatch && (!hasStreetAddressPattern || regionMatch))
    allAdminMatches.push(countyMatch)
  if (localityMatch && (!hasStreetAddressPattern || regionMatch))
    allAdminMatches.push(localityMatch)

  // Remove overlapping matches, keeping the longest ones
  const nonOverlappingMatches = removeOverlappingMatches(allAdminMatches)

  // Build list of matches for removal
  const adminMatches = nonOverlappingMatches

  // Remove administrative parts to get remaining text for address/venue extraction
  let remainingText = removeMatchedParts(originalText, adminMatches)

  // Remove country if present
  if (country) {
    remainingText = remainingText
      .replace(/Việt Nam/gi, "")
      .replace(/,\s*$|^\s*,/g, "")
      .trim()
  }

  // Determine which admin levels were actually matched (non-overlapping)
  const finalRegionMatch = nonOverlappingMatches.find((m) => m === regionMatch)
  const finalCountyMatch = nonOverlappingMatches.find((m) => m === countyMatch)
  const finalLocalityMatch = nonOverlappingMatches.find(
    (m) => m === localityMatch
  )

  const result: AddressParts = {
    country,
    region: finalRegionMatch?.name || "",
    county: finalCountyMatch?.name || "",
    locality: finalLocalityMatch?.name || "",
  }

  // Add county alternatives for HCM City (ID 79) if multiple matches were found
  if (regionMatch?.id === "79" && countyMatch && "allMatches" in countyMatch) {
    const allMatches = (
      countyMatch as typeof countyMatch & {
        allMatches: Array<{
          name: string
          id: string
          match: string
        }>
      }
    ).allMatches
    if (allMatches.length > 1) {
      // Filter out the primary match (first one) to only show alternatives
      result.countyAlternatives = allMatches
        .slice(1) // Skip the first match which is already the primary
        .map((match) => ({
          name: match.name,
          id: match.id,
          match: match.match,
        }))
    }
  }

  // Extract venue and address from remaining text
  if (remainingText) {
    const venue = extractVenue(remainingText)
    const addressResult = extractAddress(remainingText)

    if (venue) {
      result.venue = venue
    }

    // Only set address parts if we actually found valid address components
    // Don't set address if it's just extracting from a venue name
    if (addressResult.number && addressResult.number !== venue?.charAt(0)) {
      result.number = addressResult.number

      if (addressResult.street) {
        result.street = addressResult.street
      }

      if (addressResult.address) {
        result.address = addressResult.address
      }
    }
  }

  return result
}
