#!/usr/bin/env ts-node

import * as fs from "fs"
import * as path from "path"
import deaccents from "../format/vietnam/deaccents"

interface RegexMapping {
  [key: string]: string
}

interface AdminRegion {
  _id: string
  name_vn: string
  parent_ids?: string[]
}

interface GroupedRegexMapping {
  [parentKey: string]: {
    [name: string]: string
  }
}

function generateNoSpaceVariations(name: string): string[] {
  const words = name.split(/\s+/)
  const variations: string[] = []

  // Join all words together
  variations.push(words.join(""))

  // Join with different spacing patterns
  if (words.length > 2) {
    // Join first two, keep rest separate
    variations.push(words.slice(0, 2).join("") + " " + words.slice(2).join(" "))
    // Join last two, keep rest separate
    variations.push(
      words.slice(0, -2).join(" ") + " " + words.slice(-2).join("")
    )
  }

  return variations
}

function createSpecialAbbreviations(name: string): string[] {
  const abbreviations: string[] = []

  // Special cases for major cities
  if (name.includes("Hồ Chí Minh")) {
    abbreviations.push("TpHCM", "HCM", "HCMC")
  } else if (name.includes("Hà Nội")) {
    abbreviations.push("(?<=^|,|\\s)HN(?=$|,|\\s)") // Use lookahead/lookbehind
  } else if (name.includes("Đà Nẵng")) {
    abbreviations.push("DN")
  } else if (name.includes("Cần Thơ")) {
    abbreviations.push("CT")
  } else if (name.includes("Hải Phòng")) {
    abbreviations.push("HP")
  }

  return abbreviations
}

function generateRegexPattern(
  fullName: string,
  type: "province" | "district" | "ward"
): string {
  // Extract the core name without administrative prefix
  const coreName = fullName.replace(
    /^(Thành Phố|Tỉnh|Quận|Huyện|Phường|Xã|Thị Trấn|Thị Xã)\s+/,
    ""
  )

  const variations: Set<string> = new Set()

  // Check if this is a numbered district/ward
  const isNumbered =
    (type === "district" && /^Quận \d+$/.test(fullName)) ||
    (type === "ward" && /^Phường \d+$/.test(fullName))

  // Romanized version (needed for both numbered and non-numbered)
  const romanized = deaccents(coreName)

  if (!isNumbered) {
    // Original name (only for non-numbered)
    variations.add(coreName)

    // Name without spaces
    const noSpaceVariations = generateNoSpaceVariations(coreName)
    noSpaceVariations.forEach((v) => variations.add(v))

    // Romanized versions (without diacritics)
    variations.add(romanized)
    const romanizedNoSpace = generateNoSpaceVariations(romanized)
    romanizedNoSpace.forEach((v) => variations.add(v))
  }

  // Add administrative prefix variations based on type
  const adminPrefixes: string[] = []
  const englishSuffixes: string[] = []

  if (type === "province") {
    if (fullName.startsWith("Thành Phố")) {
      adminPrefixes.push("Thành Phố " + coreName)
      adminPrefixes.push("Tp. " + coreName)
      adminPrefixes.push("tp. " + coreName)
      adminPrefixes.push("TP. " + coreName)
      englishSuffixes.push(coreName + " City")
      englishSuffixes.push(romanized + " City")
    } else {
      adminPrefixes.push("Tỉnh " + coreName)
      adminPrefixes.push("T. " + coreName)
      adminPrefixes.push("t. " + coreName)
      englishSuffixes.push(coreName + " Province")
      englishSuffixes.push(romanized + " Province")
    }
  } else if (type === "district") {
    if (fullName.startsWith("Thành Phố")) {
      // Handle city-level districts (like Thành Phố Vinh)
      adminPrefixes.push("Thành Phố " + coreName)
      adminPrefixes.push("Tp. " + coreName)
      adminPrefixes.push("tp. " + coreName)
      adminPrefixes.push("TP. " + coreName)
      englishSuffixes.push(coreName + " City")
      englishSuffixes.push(romanized + " City")
    } else if (fullName.startsWith("Quận")) {
      adminPrefixes.push("Quận " + coreName)
      if (isNumbered) {
        // For numbered districts, add abbreviated forms with number
        adminPrefixes.push("Q." + coreName)
        adminPrefixes.push("q." + coreName)
        adminPrefixes.push("Q. " + coreName)
        adminPrefixes.push("q. " + coreName)
      } else {
        adminPrefixes.push("Q. " + coreName)
        adminPrefixes.push("q. " + coreName)
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " District")
        englishSuffixes.push(romanized + " District")
      }
    } else if (fullName.startsWith("Huyện")) {
      adminPrefixes.push("Huyện " + coreName)
      adminPrefixes.push("H. " + coreName)
      adminPrefixes.push("h. " + coreName)
      if (!isNumbered) {
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " District")
        englishSuffixes.push(romanized + " District")
      }
    } else if (fullName.startsWith("Thị Xã")) {
      adminPrefixes.push("Thị Xã " + coreName)
      adminPrefixes.push("TX. " + coreName)
      adminPrefixes.push("tx. " + coreName)
      if (!isNumbered) {
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " Town")
        englishSuffixes.push(romanized + " Town")
      }
    }
  } else if (type === "ward") {
    if (fullName.startsWith("Phường")) {
      adminPrefixes.push("Phường " + coreName)
      if (isNumbered) {
        // For numbered wards, add abbreviated forms with number
        adminPrefixes.push("P." + coreName)
        adminPrefixes.push("p." + coreName)
        adminPrefixes.push("P. " + coreName)
        adminPrefixes.push("p. " + coreName)
      } else {
        adminPrefixes.push("P. " + coreName)
        adminPrefixes.push("p. " + coreName)
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " Ward")
        englishSuffixes.push(romanized + " Ward")
      }
    } else if (fullName.startsWith("Xã")) {
      adminPrefixes.push("Xã " + coreName)
      adminPrefixes.push("X. " + coreName)
      adminPrefixes.push("x. " + coreName)
      if (!isNumbered) {
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " Commune")
        englishSuffixes.push(romanized + " Commune")
      }
    } else if (fullName.startsWith("Thị Trấn")) {
      adminPrefixes.push("Thị Trấn " + coreName)
      adminPrefixes.push("TT. " + coreName)
      adminPrefixes.push("tt. " + coreName)
      if (!isNumbered) {
        const romanized = deaccents(coreName)
        englishSuffixes.push(coreName + " Town")
        englishSuffixes.push(romanized + " Town")
      }
    }
  }

  // Add all variations
  adminPrefixes.forEach((v) => variations.add(v))
  englishSuffixes.forEach((v) => variations.add(v))

  // Add special abbreviations for provinces
  if (type === "province") {
    const abbreviations = createSpecialAbbreviations(fullName)
    abbreviations.forEach((abbr) => variations.add(abbr))
  }

  // Convert to array, remove duplicates, and escape special regex characters
  const uniqueVariations = Array.from(variations)
    .filter((v) => v.trim().length > 0)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape regex special chars

  // Create the final regex pattern
  const pattern = `(${uniqueVariations.join("|")})`

  return pattern
}

function convertFile(
  inputFile: string,
  outputFile: string,
  type: "province" | "district" | "ward"
) {
  console.log(`Converting ${inputFile} to ${outputFile}...`)

  const inputPath = path.join(
    __dirname,
    "../data/vietnam/old_admins",
    inputFile
  )
  const outputPath = path.join(__dirname, "../data/vietnam", outputFile)

  // Read input file
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"))

  // All files now use the new format (array of objects with _id)
  const data = rawData as AdminRegion[]

  if (type === "province") {
    // Handle provinces with flat structure
    const regexMapping: RegexMapping = {}

    data.forEach((region) => {
      const fullName = region.name_vn

      // For provinces, extract core name without prefix
      const keyName = fullName.replace(
        /^(Thành Phố|Tỉnh|Quận|Huyện|Phường|Xã|Thị Trấn|Thị Xã)\s+/,
        ""
      )

      // Use place_name-id format for the key
      const finalKey = keyName + "-" + region._id
      const regexPattern = generateRegexPattern(fullName, type)
      regexMapping[finalKey] = regexPattern
    })

    // Write output file with flat structure
    fs.writeFileSync(outputPath, JSON.stringify(regexMapping, null, 2))
    console.log(
      `✓ Generated ${Object.keys(regexMapping).length} regex patterns`
    )
  } else {
    // Handle districts and wards with grouped structure
    const groupedMapping: GroupedRegexMapping = {}

    data.forEach((region) => {
      const fullName = region.name_vn

      // Create proper hierarchical parent keys
      let parentKey: string
      if (!region.parent_ids || region.parent_ids.length === 0) {
        parentKey = "no_parent"
      } else if (type === "district") {
        // Districts should be grouped by province only (first parent)
        parentKey = region.parent_ids[0]
      } else if (type === "ward") {
        // Wards should be grouped by district only (second parent)
        parentKey = region.parent_ids[1]
      } else {
        // Fallback to original logic for any other cases
        parentKey = region.parent_ids.sort().join(",")
      }

      // Initialize parent group if it doesn't exist
      if (!groupedMapping[parentKey]) {
        groupedMapping[parentKey] = {}
      }

      let keyName: string

      // For numbered districts like "Quận 1", keep the full name as key
      if (
        (type === "district" && /^Quận \d+$/.test(fullName)) ||
        (type === "ward" && /^Phường \d+$/.test(fullName))
      ) {
        keyName = fullName
      } else {
        // For other cases, extract core name without prefix
        keyName = fullName.replace(
          /^(Thành Phố|Tỉnh|Quận|Huyện|Phường|Xã|Thị Trấn|Thị Xã)\s+/,
          ""
        )
      }

      // Use place_name-id format for the key
      const finalKey = keyName + "-" + region._id
      const regexPattern = generateRegexPattern(fullName, type)
      groupedMapping[parentKey][finalKey] = regexPattern
    })

    // Write output file with grouped structure
    fs.writeFileSync(outputPath, JSON.stringify(groupedMapping, null, 2))

    const totalPatterns = Object.values(groupedMapping).reduce(
      (sum, group) => sum + Object.keys(group).length,
      0
    )
    console.log(
      `✓ Generated ${totalPatterns} regex patterns grouped by ${
        Object.keys(groupedMapping).length
      } parent combinations`
    )
  }
}

function main() {
  console.log("Converting administrative region files to regex format...\n")

  try {
    // Convert provinces
    convertFile("provinces.json", "provinces-regex.json", "province")

    // Convert districts
    convertFile("districts.json", "districts-regex.json", "district")

    // Convert wards
    convertFile("wards.json", "wards-regex.json", "ward")

    console.log("\n✅ All files converted successfully!")
    console.log("\nGenerated files:")
    console.log("  - src/data/vietnam/provinces-regex.json")
    console.log("  - src/data/vietnam/districts-regex.json")
    console.log("  - src/data/vietnam/wards-regex.json")
  } catch (error) {
    console.error("❌ Error during conversion:", error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
