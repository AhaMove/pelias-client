/**
 * Vietnamese place/building prefixes that should be removed from names
 * Common prefixes for buildings, venues, and establishments
 */
const PLACE_PREFIXES = [
  // Buildings
  "tòa nhà",
  "toa nha",
  "toà nhà",
  "cao ốc",
  "cao oc",
  "chung cư",
  "chung cu",
  "căn hộ",
  "can ho",
  "building",

  // Hotels & Hospitality
  "khách sạn",
  "khach san",
  "ks",
  "hotel",
  "resort",
  "villa",
  "homestay",
  "nhà nghỉ",
  "nha nghi",
  "motel",

  // Commercial
  "trung tâm thương mại",
  "trung tam thuong mai",
  "tttm",
  "trung tâm",
  "trung tam",
  "tt",
  "siêu thị",
  "sieu thi",
  "st",
  "cửa hàng",
  "cua hang",
  "shop",
  "showroom",

  // Healthcare
  "bệnh viện",
  "benh vien",
  "bv",
  "phòng khám",
  "phong kham",
  "pk",
  "nhà thuốc",
  "nha thuoc",

  // Food & Beverage
  "nhà hàng",
  "nha hang",
  "nh",
  "quán",
  "quan",
  "quán ăn",
  "quan an",
  "quán cà phê",
  "quan ca phe",
  "quán cafe",
  "cafe",
  "coffee",
  "quán nhậu",
  "quan nhau",
  "bar",
  "pub",
  "restaurant",

  // Education
  "trường",
  "truong",
  "trường học",
  "truong hoc",
  "trường đại học",
  "truong dai hoc",
  "đại học",
  "dai hoc",
  "học viện",
  "hoc vien",
  "viện",
  "vien",
  "school",
  "university",
  "college",

  // Religious
  "chùa",
  "chua",
  "nhà thờ",
  "nha tho",
  "đền",
  "den",
  "đình",
  "dinh",
  "miếu",
  "mieu",

  // Transportation
  "bến xe",
  "ben xe",
  "sân bay",
  "san bay",
  "ga",
  "nhà ga",
  "nha ga",
  "cảng",
  "cang",

  // Entertainment
  "rạp",
  "rap",
  "rạp chiếu phim",
  "rap chieu phim",
  "rạp hát",
  "rap hat",
  "sân vận động",
  "san van dong",
  "svđ",
  "svd",
  "công viên",
  "cong vien",
  "cv",
  "khu vui chơi",
  "khu vui choi",

  // Industrial & Office
  "khu công nghiệp",
  "khu cong nghiep",
  "kcn",
  "nhà máy",
  "nha may",
  "xưởng",
  "xuong",
  "văn phòng",
  "van phong",
  "vp",
  "office",
  "tower",

  // Government
  "ủy ban",
  "uy ban",
  "ubnd",
  "công an",
  "cong an",
  "ca",
  "tòa án",
  "toa an",
  "bưu điện",
  "buu dien",
] as const;

// Sort by length descending to match longer prefixes first
const SORTED_PREFIXES = [...PLACE_PREFIXES].sort((a, b) => b.length - a.length);

// Build regex pattern once for performance
const prefixPattern = new RegExp(
  `^(${SORTED_PREFIXES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s+`,
  "i",
);

/**
 * Removes common Vietnamese place/building prefixes from a name
 *
 * @param name - The place/building name to process
 * @returns The name with prefix removed, or original name if no prefix found
 *
 * @example
 * removePlacePrefix("Toa nha Rivera Park") // "Rivera Park"
 * removePlacePrefix("Khách sạn Hilton") // "Hilton"
 * removePlacePrefix("Bệnh viện Nhi Đồng 1") // "Nhi Đồng 1"
 * removePlacePrefix("Rivera Park") // "Rivera Park" (no prefix)
 */
export function removePlacePrefix(name: string): string {
  if (!name || typeof name !== "string") {
    return name;
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }

  const result = trimmed.replace(prefixPattern, "");

  // Return original if result is empty (prefix was the entire string)
  return result.trim() || trimmed;
}

/**
 * Checks if a name starts with a known Vietnamese place prefix
 *
 * @param name - The name to check
 * @returns true if the name starts with a known prefix
 */
export function hasPlacePrefix(name: string): boolean {
  if (!name || typeof name !== "string") {
    return false;
  }

  return prefixPattern.test(name.trim());
}

/**
 * Gets all available place prefixes
 * Useful for extending or customizing the prefix list
 */
export function getPlacePrefixes(): readonly string[] {
  return PLACE_PREFIXES;
}
