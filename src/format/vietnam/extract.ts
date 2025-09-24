import { AddressParts } from "src/models/address-parts.model";

const hasCountry = (text: string) => {
  return /Việt Nam/gi.test(text);
};

const findCountry = (text: string) => {
  const arr = text.split(",");

  if (hasCountry(text)) {
    return arr[arr.length - 1].trim();
  }

  return "";
};

const findRegion = (text: string) => {
  const arr = text.split(",");

  if (hasCountry(text)) {
    return arr[arr.length - 2].trim();
  }

  return "";
};

const findCounty = (text: string) => {
  const arr = text.split(",");
  let county = "";
  let index = -1;

  let length = arr.length;
  if (!hasCountry(text)) length = length + 2;

  if (length >= 4) {
    county = arr[length - 3];
    index = length - 3;
  }

  if (isAddress(county)) {
    county = "";
    index = -1;
  }

  return {
    index,
    name: county.trim(),
  };
};

const findLocality = (text: string) => {
  const arr = text.split(",");
  let locality = "";
  let index = -1;

  let length = arr.length;
  if (!hasCountry(text)) length = length + 2;

  if (length >= 5) {
    locality = arr[length - 4];
    index = length - 4;
  }

  if (isAddress(locality)) {
    locality = "";
    index = -1;
  }

  return {
    index,
    name: locality.trim(),
  };
};

const extractAddressParts = (arr: string[]) => {
  let number = "";
  let street = "";

  arr.forEach((value) => {
    const data = /^([Số|Ngõ\s0-9/-]+)(\s)(.*)/gi.exec(value.trim());

    if (data) {
      number = data[1];
      street = data[3];
    }
  });

  return {
    number: number.trim(),
    street: street.trim(),
  };
};

// Helper function to check if a number is valid for Vietnamese addresses
const isValidAddressNumber = (number: string): boolean => {
  if (!number) return false;
  // Must contain at least one digit to be a valid address number
  // This handles: "123", "7/28", "A2", "B12", "Z06", "A2-15/3", etc.
  // But rejects pure letters like "vin", "spa", "bar"
  return /[0-9]/.test(number);
};

// Helper function to detect if text looks like a venue name
const looksLikeVenue = (text: string): boolean => {
  if (!text || text.length < 3) return false;
  // If it's already detected as an address, it's not a venue
  if (isAddress(text)) return false;
  // If it starts with address-like pattern, it's not a venue
  if (/^[A-Za-z]{0,3}[0-9]/.test(text.trim())) return false;
  return true;
};

// Helper function to build consistent result
const buildAddressResult = (number?: string, street?: string, fallbackAddress?: string) => {
  let address = "";

  if (number && street) {
    address = `${number} ${street}`;
  } else if (number) {
    address = number;
  } else if (fallbackAddress) {
    address = fallbackAddress;
  }

  return {
    number: number || undefined,
    street: street || undefined,
    address: address || undefined,
  };
};

// Try parsing with standard address patterns
const tryStandardParsing = (text: string) => {
  // Pattern 1: "123A Nguyen Van Cu" or "Z06 Duong So 13" (number + space + street)
  const standardMatch = text.match(/^([A-Za-z]{0,3}[0-9][A-Za-z0-9\-/]*)\s+(.+?)(?:,|$)/);
  if (standardMatch) {
    return buildAddressResult(standardMatch[1], standardMatch[2]);
  }

  // Pattern 2: Number only at start "123A" or "Z06" or "7/28" or "A2-15/3"
  const numberOnlyMatch = text.match(/^([A-Za-z]{0,3}[0-9][A-Za-z0-9\-/]*)(?:\s*,|$|\s|$)/);
  if (numberOnlyMatch) {
    return buildAddressResult(numberOnlyMatch[1]);
  }

  // Pattern 3: Vietnamese prefixes "Số 123 Nguyen Van Cu"
  const prefixMatch = text.match(/^(?:số|ngõ|hẻm)\s+([A-Za-z0-9\-/]+)(?:\s+(.+?))?(?:,|$)/i);
  if (prefixMatch) {
    return buildAddressResult(prefixMatch[1], prefixMatch[2]);
  }

  return null;
};

// Try parsing "Phố" format
const tryPhoParsing = (text: string) => {
  const phoMatch = /Phố((?:(?!Phố).)*?(\s{2}|(?=,)))/.exec(text);
  if (phoMatch) {
    const street = phoMatch[0];
    const number = text.slice(0, phoMatch.index).replace(/,/gi, "").trim();
    return buildAddressResult(number || undefined, street);
  }
  return null;
};

const extractAddress = (text: string) => {
  const parts = text.split(",").map((p) => p.trim());

  // Strategy 1: Try direct parsing from start
  let result = tryStandardParsing(text);
  if (result && result.number && isValidAddressNumber(result.number)) {
    return result;
  }

  // Strategy 2: Skip potential venue, parse from second part
  if (parts.length > 1 && looksLikeVenue(parts[0])) {
    const remainingText = parts.slice(1).join(", ");
    result = tryStandardParsing(remainingText);
    if (result && result.number && isValidAddressNumber(result.number)) {
      return result;
    }
  }

  // Strategy 3: Try "Phố" pattern
  result = tryPhoParsing(text);
  if (result && result.number && isValidAddressNumber(result.number)) {
    return result;
  }

  // Strategy 4: Try legacy extractAddressParts as fallback
  const legacyResult = extractAddressParts(parts);
  if (legacyResult.number && isValidAddressNumber(legacyResult.number)) {
    return buildAddressResult(legacyResult.number, legacyResult.street);
  }

  // Strategy 5: Simple fallback - if text starts with address-like pattern, extract it
  const simpleMatch = text.match(/^([A-Za-z0-9\-/]+)/);
  if (simpleMatch && isValidAddressNumber(simpleMatch[1])) {
    return buildAddressResult(simpleMatch[1]);
  }

  // Final fallback: Return first part as address
  return buildAddressResult(undefined, undefined, parts[0]);
};

// export const isHouseNumber = (text: string) => {
//   return /^[0-9a-h/]+/gi.test(text)
// }

export const isAddress = (text: string): RegExpMatchArray | null => {
  let firstPart = text.split(",")[0].trim();
  firstPart = firstPart
    .replace(
      /^(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i,
      "$2",
    )
    .trim();

  return firstPart.match(/^[A-Z]?[0-9][A-Z\-/0-9]*(?=\s|$)/i);
};

export const extractVenue = (text: string): string => {
  if (isAddress(text)) {
    return "";
  }

  const venue = text.split(",")[0];
  if (!venue.replace(/[^a-z0-9À-ỹ]/gi, "")) {
    return "";
  }

  return venue.trim();
};

export const extract = (text: string): AddressParts => {
  const arr = text.split(",");
  if (arr.length === 1) {
    const { number, street, address } = extractAddress(text);
    return {
      address,
      locality: "",
      county: "",
      region: "",
      country: "",
      number,
      street,
    };
  }

  const country = findCountry(text);
  const region = findRegion(text);
  const { name: county, index: countyIndex } = findCounty(text);
  let locality = "",
    localityIndex = -1;
  if (county != "" && countyIndex > -1) {
    const { name: _locality, index: _localityIndex } = findLocality(text);
    locality = _locality;
    localityIndex = _localityIndex;
  }

  const index = localityIndex > -1 ? localityIndex : countyIndex > -1 ? countyIndex : arr.length;

  const result: AddressParts = {
    country,
    region,
    county,
    locality,
  };

  const venue = extractVenue(text);
  const addressParams = arr.slice(0, index).join(",");
  const { number, street, address } = extractAddress(addressParams);

  if (number) {
    result.number = number;
  }

  if (street) {
    result.street = street;
  }

  if (venue) {
    result.venue = venue;
  }

  if (address) {
    result.address = address;
  }

  return result;
};
