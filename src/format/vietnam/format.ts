import * as _ from "lodash/fp"
import regex from "src/data/vietnam/regex.json"
import abbreviations from "src/data/vietnam/abbreviations.json"
import dictionary from "src/data/vietnam/dictionary.json"
import deaccents from "src/format/vietnam/deaccents"
import { match, when } from "src/utils/match-when"
import escapeStringRegexp from "src/utils/escape-string-regexp"

const dedupSpaces = _.replace(/\s+/g, " ")

const trimAll = _.flow([_.split(","), _.map(_.trim), _.filter((_) => _ != ""), _.join(", ")])

const capitalizeAll = _.flow([
  _.split(","),
  _.map(
    _.flow([_.trim, _.split(" "), _.map(_.upperFirst), _.join(" ")])
  ),
  _.join(", ")
])

const dedupString = _.flow([
  _.split(","),
  _.uniqBy(_.flow([deaccents, _.lowerCase])),
  _.join(", "),
])

const sanitizeStreet = _.flow([
  _.replace(/(?<=^|\W)(Đường\s|đường\s|Duong\s|Đ\s|đ\s|Đ\.|đ\.|D\s|D\.)/gi, " Đường "),
  _.replace(/(?<=^|\W)(Street|Road)(?=$|\W)/gi, ", "),
])

const encodeDictionaryWord = (text: string) => {
  const re = dictionary.map((value) => `(${value})`).join("|")

  return text.replace(new RegExp(re, "gi"), (m, ...p) => {
    return "#" + p.findIndex((value) => !!value)
  })
}

const decodeDictionaryWord = (text: string) => {
  return text.replace(new RegExp(/(#)(\d+)/, "g"), (m, p1, p2) => {
    return dictionary[parseInt(p2)]
  })
}

const cleanAddress = _.flow([
  _.replace(/(?<=^|\W)\d{5,6}(?=$|\W)/gi, " "), // clean VN postal code
  _.replace(/["\\]/g, " "), // remove common non-related symbols such as " \
  _.replace(/[\n\t]/g, " "), // remove common escape sequences: \n, \t
  _.replace(/^[,.\-'/]+/, ""), //remove preceding symbols such as , . - ' /
  _.replace(/;/g, ","),
  _.replace(/(?<=^|\W)(Vietnam|Việt Nam|Viet Nam|VN|ViệtNam)(?=$|\W)/gi, ""),
  _.replace(/(?<=^|\W)(Đ\/c|đ\/c|Đc|đc|Địa Chỉ|địa chỉ|D\/c|Dc|Dia Chi)(?=$|\W)/gi, ""),
  _.replace(
    /^(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i,
    "$2"
  ),
  _.replace(
    /(?<=^|\W)(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)([0-9])/gi,
    "$1 $2"
  ),
  _.replace(/^([A-Z]?[0-9][A-Z\-/0-9]*)([\s,]*)/i, "$1 "), // xoá dấu , kề sau số nhà
  
  _.replace(
    /^([a-z0-9]*)(\s?-\s?)([a-z0-9]*)(,?\s)([a-z0-9]*)(\s?-\s?)([a-z0-9]*)/i,
    "$1@$3$4$5@$7"
  ),
  (str) => {
    const re = /^([a-t0-9]+)(-)([a-t0-9]+)/gi
    const number = str.match(re)

    return _.flow([
      _.replace(new RegExp(number, "gi"), "%"),
      _.replace(/^([0-9a-z]+)(\s?-\s?)((?:.)*?)(?=,)/gi, (_, p1, p2, p3) => {
        if (p3.length > 3) {
          return p1 + " @ " + p3
        }

        return p1 + "@" + p3
      }),
      _.replace(/([0-9]+)(-)([0-9]+)(-)([0-9]+)/, "$1@$3@$5"),
      _.replace(/([0-9]+)(-)([0-9]+)/, "$1@$3"),
      _.replace(/\s?-\s?/g, ", "),
      _.replace(/(\d)-/g, "$1,"),
      _.replace("%", number),
    ])(str)
  },
  _.replace(/@/g, "-"),
])

const addLeadingZero = _.flow([
  _.replace(/(Quận|Phường)(\s+)(\d+)/gi, (_, p1, p2, p3) => {
    return p1 + " " + p3.trim().padStart(2, "0")
  }),
])

const sanitizeWithoutFirst = (
  regex: RegExp,
  replacement: string,
  maxLength = 20
) => (text: string) => {
  const [p1, ...rest] = text.split(",")

  if (rest.length === 0) {
    return text
  }

  const formatted = rest.join(",").replace(regex, replacement)

  if (p1.length > maxLength) {
    const formattedP1 = p1.replace(regex, replacement)

    return [formattedP1].concat(formatted).join(",")
  }

  return [p1].concat(formatted).join(",")
}

const sanitizeRegion = _.flow([
  sanitizeWithoutFirst(/(?<=^|\W)City(?=$|\W)/gi, ","),
  sanitizeWithoutFirst(/(?<=^|\W)Province(?=$|\W)/gi, ","),
  sanitizeWithoutFirst(/(?<=^|\W)(Thành Phố\s|Thanh Pho\s|Tp\s|Tp\.)/gi, ", Thành Phố "),
  sanitizeWithoutFirst(/(?<=^|\W)(Tỉnh\s|Tinh\s)/gi, ", Tỉnh "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(T\s|T\.)/gi, ", Tỉnh "),
])

const sanitizeCounty = _.flow([
  _.replace(/(District((?:(?!District).)*?(?=,|$)))/gi, (_, p1, p2) => {
    if (p2 && !isNaN(p2)) {
      return ", Quận " + p2 + ", "
    }

    return ", " + p2 + ", "
  }),
  sanitizeWithoutFirst(/(?<=^|\W)(Quận\s|Quan\s|Q\s|Q\.)/gi, ", Quận "),
  sanitizeWithoutFirst(/(?<=^|\W)q(\d{1,2})(?=$|\W)/gi, ", Quận $1, "),
  sanitizeWithoutFirst(/(?<=^|\W)(Huyện\s|Huyen\s|H\s|H\.)/gi, ", Huyện "),
  sanitizeWithoutFirst(/(?<=^|\W)(Thị Xã\s|Thi Xa\s|Tx\s|Tx\.)/gi, ", Thị Xã "),
])

const sanitizeLocality = _.flow([
  _.replace(/(Ward((?:(?!Ward).)*?(?=,|$)))/gi, (_, p1, p2) => {
    if (p2 && !isNaN(p2)) {
      return ", Phường " + p2 + ", "
    }

    return ", " + p2 + ", "
  }),
  sanitizeWithoutFirst(/(?<=^|\W)(Phường\s|Phuong\s|P\s|P\.|F\s|F\.)/gi, ", Phường "),
  sanitizeWithoutFirst(/(?<=^|\W)[pf](\d{1,2})(?=$|\W)/gi, ", Phường $1, "),
  sanitizeWithoutFirst(/(?<=^|\W)(Xã\s|Xa\s|X\s|X\.)/gi, ", Xã "),
  sanitizeWithoutFirst(/(?<=^|\W)(Thị Trấn\s|Thi Tran\s|Tt\s|Tt\.)/gi, ", Thị Trấn "),
])

interface MatchParams {
  pattern?: string
  flags?: string
  matchFlags?: string
  replacement?(text: string): string
  matchCallback?(re: RegExp, key: string): void
}

const createMatchFactory = (source: { [key: string]: string }) => (
  params: MatchParams = {
    pattern: "",
    flags: "gi",
  }
) => {
  const { pattern = "", flags = "", matchFlags = "", replacement, matchCallback } = params

  const matcher = Object.keys(source).reduce<any>((acc, key) => {
    const flag = matchFlags ? matchFlags : flags
    const re = new RegExp(source[key] + pattern, flag)
    const hasReplacement = !!replacement
    const matching = _.replace(re, hasReplacement ? replacement!(key) : key)
    acc[when(re)] = matchCallback ? matchCallback(re, key) : matching

    return acc
  }, {})

  matcher[when()] = (value: string) => value

  return matcher
}

const cleanCityNameFactory = createMatchFactory(regex)

const handleCleanSuffix = match({
  [when(/Vietnam|Việt Nam/i)]: _.replace(/Vietnam|Việt Nam.*/i, ""),
  [when()]: match(
    cleanCityNameFactory({
      pattern: ".*",
      flags: "i",
      replacement: (key) => key + ", Việt Nam",
    })
  ),
})

const cleanSuffix = function (data: string) {
  const splitData = data
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "")
  if (splitData.length > 1) {
    const first = splitData.shift()
    let i = splitData.length - 1
    for (i; i >= 0; i--) {
      const result = handleCleanSuffix(splitData[i])
      if (result !== splitData[i]) {
        splitData[i] = result
        splitData.splice(i + 1, splitData.length)
        break
      }
    }
    return `${first}, ${splitData.join(", ")}`
  }
  return data
}

const reverseString = _.flow([_.split(","), _.reverse, _.join(",")])

const transformAbbreviations = (text: string) => {
  for (const [key, value] of Object.entries(abbreviations)) {
    const re = new RegExp(value, "gi");
    text = text.replace(re, key);
  }
  
  return text
}

const dedupStringFactory = (patternString: string) => (
  value: string,
  index = -1
) => {
  const reLocality = /(Phường((?:(?!Phường).)*?))|(Thị trấn((?:(?!Thị trấn).)*?))/gi
  const reWard = /(Quận((?:(?!Quận).)*?))|(Huyện((?:(?!Huyện).)*?))|(Thị xã((?:(?!Thị xã).)*?))/gi

  if (!isNaN(Number(patternString))) {
    return value
  }

  if (!reLocality.test(value) && !reWard.test(value) && index !== 0) {
    const patternStringNoAccent = deaccents(patternString)
    const reStr = [
      `\\d ${patternString}`,
      `\\d ${patternStringNoAccent}`,
      `Đường\\s+${patternString}`,
      `Đường\\s+${patternStringNoAccent}`,
      `Phố ${patternString}`,
      `Phố ${patternStringNoAccent}`,
      `Thị xã ${patternString}`,
      `Thị xã ${patternStringNoAccent}`,
      `Kho ${patternString}`,
      `Kho ${patternStringNoAccent}`,
      `Tuyến ${patternString}`,
      `Tuyen ${patternStringNoAccent}`,
    ].join("|")

    const re = new RegExp(`^(?!.*(${reStr})).*$`, "gi")

    if (re.test(value)) {
      value = value.replace(
        new RegExp(`\\b${patternString}|\\b${patternStringNoAccent}`, "gi"),
        ""
      )
    }
  }

  return value
}

const dedupAdmin = (
  str: string,
  patternString: string,
  hasWardOrLocality = false
) => {
  const arr = str.split(",")
  const callback = dedupStringFactory(patternString)

  if (hasWardOrLocality) {
    return arr.map(callback).join(",")
  }

  arr[0] = callback(arr[0])

  return arr.join(",")
}

const transformRegion = (text: string) => {
  for (const [key, value] of Object.entries(regex)) {
    const re = new RegExp(value, "gi");
    text = text.replace(re, key);
  }
  
  return text
}

const dedupCounty = (retry = 10) => (
  text: string,
  currentRetry = 0
): string => {
  const arr = text.split(",")

  if (arr.length === 1) {
    return text
  }

  if (currentRetry === retry) {
    return text
  }

  // const matcher = str.match(
  //   /(Quận((?:(?!Quận).)*?(\s{2}|(?=,)))|Thị Xã((?:(?!Thị Xã).)*?(\s{2}|(?=,)))|Huyện((?:(?!Huyện).)))/gi,
  // )
  const fullWardName = RegExp.$1
  const rawWardName = RegExp.$2 ? RegExp.$2 : RegExp.$4
  const wardName = escapeStringRegexp(rawWardName.replace(/(^\s+|,$)/gi, ""))

  const re = `${escapeStringRegexp(fullWardName)}`
  const matcher1 = text.match(new RegExp(re, "gi"))

  if (!Array.isArray(matcher1)) {
    return text
  }

  if (matcher1 && matcher1.length >= 2) {
    const result = text.replace(new RegExp(re, "i"), "")

    return dedupCounty(retry)(result, currentRetry + 1)
  }

  // const hasWardOrLocality = matcher && matcher.length > 0

  return dedupAdmin(text, wardName, true)
}

const dedupLocality = (retry = 10) => (
  text: string,
  currentRetry = 0
): string => {
  const arr = text.split(",")

  if (arr.length === 1) {
    return text
  }

  if (currentRetry === retry) {
    return text
  }

  const matcher = text.match(
    /(Phường((?:(?!Phường).)*?(\s{2}|(?=,)|Quận((?:(?!Phường).)*?),)))/gi
  )
  const fullLocalityName = escapeStringRegexp(RegExp.$1)
  const localityName = escapeStringRegexp(RegExp.$2.replace(/(^\s+|,$)/gi, ""))

  const re = `${fullLocalityName}`
  const matcher1 = text.match(new RegExp(re, "gi"))

  if (!Array.isArray(matcher1)) {
    return text
  }

  if (matcher1 && matcher1.length >= 2) {
    const result = text.replace(new RegExp(re, "i"), "")

    return dedupLocality(retry)(result, currentRetry + 1)
  }

  const hasWardOrLocality = !!(matcher && matcher.length > 0)

  return dedupAdmin(text, localityName, hasWardOrLocality)
}

export const format = _.flow([
  dedupSpaces,
  transformAbbreviations,
  encodeDictionaryWord,
  cleanAddress,
  decodeDictionaryWord,
  dedupSpaces,
  sanitizeRegion,
  sanitizeCounty,
  sanitizeLocality,
  addLeadingZero,
  sanitizeStreet,
  dedupSpaces,
  trimAll,
  capitalizeAll,
  transformRegion,
  dedupString,
  trimAll,
  // dedupLocality(),
  // dedupCounty(),
  // _.replace(/([a-z])(\s+)(Quận|Huyện)/gi, "$1, $3 "),
  // dedupSpaces,
  // _.replace(/(phố)/, " Phố"), // them khoang cach
  // _.replace(/(Ngõ|số)(\d+)/i, "$1 $2"), // them khoang cach
  // _.replace(
  //   /(Sau|QUA GỌI|qua goi|Gọi|Goi|Láy|Lấy|Lay|Giao Trước|Giao truoc|Nghỉ|Có)((?:.)*?(\s{2}|(?=,)))/i,
  //   ""
  // ),
  // _.replace(/(Gần((?:.)*?(\s{2}|(?=,))))/i, ", $1"),
  // _.replace(/(09|08|01[2689])+([0-9]{8})\b/, ""),
  // _.replace(/,\s,\s,|,\s,/g, ","),
  // _.replace(/\/,/g, ","),
  // _.replace(/\/\s/g, " "), // xoa dau /
  // _.replace(/(\s?trên\s?)(\d+)/gi, "/$2"),
  // trimAll,
  // cleanSuffix,
])
