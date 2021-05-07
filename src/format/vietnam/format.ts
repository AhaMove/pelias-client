import * as _ from "lodash/fp"
import regex from "src/data/vietnam/regex.json"
import abbreviations from "src/data/vietnam/abbreviations.json"
import dictionary from "src/data/vietnam/dictionary.json"
import deaccents from "src/format/vietnam/deaccents"
import { match, when } from "src/utils/match-when"
import escapeStringRegexp from "src/utils/escape-string-regexp"

const dedupSpaces = _.replace(/\s+/g, " ")

const trimAll = _.flow([_.split(","), _.map(_.trim), _.join(", ")])

const splitAll = _.split(",")

const capitalizeAll = _.map(
  _.flow([_.split(" "), _.map(_.upperFirst), _.join(" ")])
)

const dedupString = _.flow([
  _.uniqBy(_.flow([_.lowerCase, deaccents])),
  _.join(", "),
])

const cleanCity = _.flow([
  _.replace(/Tp[,.]?/i, ""),
  _.replace(/\b(Tx\.|Tx)\b/i, "Thị xã "),
  _.replace(/\b(Tt\.|Tt)\b/i, "Thị trấn "),
])

const sanitizeStreet = _.flow([
  _.replace(/(Street)|(Road)/i, ","),
  _.replace(/(Đường)((?:(?!Đường ).)*?((?=,)))/i, "$1 $2"),
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
  _.replace(/\.,/g, ","),
  _.replace(
    /^(số|so|ngo|ngõ|hẻm|hem|số nhà|sn|Sô Nha|Sô|Đến|Nhà Số|nha so)\s?([0-9]+)/i,
    "$2"
  ),
  _.replace(
    /^([a-z0-9]*)(\s?-\s?)([a-z0-9]*)(,?\s)([a-z0-9]*)(\s?-\s?)([a-z0-9]*)/i,
    "$1@$3$4$5@$7"
  ),
  encodeDictionaryWord,
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
  _.replace(/; /g, " "),
  _.replace(/@/g, "-"),
  _.replace(/(ngách|ngach)(\d+)/gi, "$1 $2"),
  _.replace(/^[,.]*\s?/, ""),
])

const addLeadingZero = _.flow([
  _.replace(/(Quận|Phường)(\s+)(\d+)/gi, (_, p1, p2, p3) => {
    return p1 + p2 + p3.trim().padStart(2, "0")
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

const sanitizeCounty = _.flow([
  _.replace(/(District((?:(?!District).)*?(\s{2}|(?=,))))/gi, (_, p1, p2) => {
    if (p2 && !isNaN(p2)) {
      return "Quận " + p2
    }

    return p2
  }),
  _.replace(/District/i, ""),
  sanitizeWithoutFirst(/(,?\s?)((\bQuan\b)|(Q\s|Q\.))/gi, ", Quận "),
  _.replace(/\s(q|-q)(\d{1,2})/gi, " Quận $2"),
  _.replace(/(q)(?=[^uls\s.,0-9])/gi, "Quận "),
  _.replace(/(,?\s?)((Huyen\b)|(\bH\.))/gi, ", Huyện "),
])

const sanitizeLocality = _.flow([
  _.replace(/Phường,/gi, "#"),
  _.replace(/Phường/gi, ", Phường "),
  _.replace(/(,\s?)((Phuong)|(P\s|P\.|F\s|F\.|Ward))/gi, ", Phường "),
  // _.replace(/\s([pf])(\d{1,2})\b/gi, ', Phường $2'),
  sanitizeWithoutFirst(/\s([pf])(\d{1,2})\b/gi, ", Phường $2"),
  _.replace(/\s(p)(?=[^hluaefpr\s.,0-9])/gi, "Phường "),
  _.replace(/\b(x\.)\b/gi, "Xã "),
  _.replace(/(\s)(Ấp)/i, " Ấp "),
  _.replace(/#/g, "Phường,"),
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
    flags: "i",
  }
) => {
  const { pattern, flags, matchFlags, replacement, matchCallback } = params

  const matcher = Object.keys(source).reduce<any>((acc, key) => {
    const flag = matchFlags ? matchFlags : flags
    const re = new RegExp(source[key] + pattern, flag)
    const matching = _.replace(re, !!replacement ? replacement(key) : key)
    acc[when(re)] = matchCallback ? matchCallback(re, key) : matching

    return acc
  }, {})

  matcher[when()] = (value: string) => value

  return matcher
}

const cleanCityNameFactory = createMatchFactory(regex)

const fixAccent = match(
  cleanCityNameFactory({
    flags: "i",
  })
)

const cleanSuffix = match({
  [when(/Vietnam|Việt Nam/i)]: _.replace(/Vietnam|Việt Nam.*/i, ""),
  [when()]: match(
    cleanCityNameFactory({
      pattern: ".*",
      flags: "i",
      replacement: (key) => ", " + key + ", Việt Nam",
    })
  ),
})

const cleanWildcard = _.flow([
  _.replace(/^([0-9/]+)(,?)(\s-)?/, "$1"), // xoa dau , ke so
  _.replace(/(\s-\s|,\s,)/g, ", "), // xoa dau -
  _.replace(/^.*:[^,]/g, ""), // xoa cac ky tu la dau chuoi - vd: Người nhận : khả kỳ Sdt: 0792042968 Địa chỉ: Duong ABC,
  _.replace(/:,/g, ""),
])

const reverseString = _.flow([_.split(","), _.reverse, _.join(",")])

const cleanAbbreviations = match(createMatchFactory(abbreviations)())

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

const dedupCity = (retry = 10) => (str: string, currentRetry = 0): string => {
  if (currentRetry === retry) {
    return str
  }

  const matcher = match(
    str,
    cleanCityNameFactory({
      matchFlags: "gi",
      matchCallback: (re) => (value: string) => value.match(re),
    })
  )

  if (!Array.isArray(matcher)) {
    return str
  }

  if (matcher && matcher.length >= 2) {
    const result = match(
      str,
      cleanCityNameFactory({
        replacement: () => "",
      })
    )

    return dedupCity(retry)(result, currentRetry + 1)
  }

  return str
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

const cleanPostalCode = _.replace(/,\s+\d+,/gi, ",")

export const format = _.flow([
  _.replace(/Phuong(?:(?!Phuong).)*?Việt Nam,/gi, ""),
  _.replace(/Vietnam|Việt Nam|Viet Nam|VN|ViệtNam/gi, ""),
  _.replace(/Đường|D\./gi, " Đường "),
  _.replace(/Đc|Dc|, Hem|Địa Chị|Địa Chỉ/gi, ""),
  _.replace(/T7, Cn/gi, ""),
  cleanAbbreviations,
  sanitizeCounty,
  sanitizeLocality,
  addLeadingZero,
  cleanAddress,
  dedupSpaces,
  reverseString,
  cleanCity,
  sanitizeStreet,
  fixAccent,
  trimAll,
  splitAll,
  capitalizeAll,
  dedupString,
  reverseString,
  dedupCity(),
  cleanPostalCode,
  trimAll,
  cleanWildcard,
  cleanSuffix,
  trimAll,
  dedupLocality(),
  dedupCounty(),
  _.replace(/([a-z])(\s+)(Quận|Huyện)/gi, "$1, $3 "),
  dedupSpaces,
  _.replace(/(phố)/, " Phố"), // them khoang cach
  _.replace(/(Ngõ|số)(\d+)/i, "$1 $2"), // them khoang cach
  _.replace(
    /(Sau|QUA GỌI|qua goi|Gọi|Goi|Láy|Lấy|Lay|Giao Trước|Giao truoc|Nghỉ|Có)((?:.)*?(\s{2}|(?=,)))/i,
    ""
  ),
  _.replace(/(Gần((?:.)*?(\s{2}|(?=,))))/i, ", $1"),
  _.replace(/(09|08|01[2689])+([0-9]{8})\b/, ""),
  _.replace(/,\s,\s,|,\s,/g, ","),
  _.replace(/\/,/g, ","),
  _.replace(/\/\s/g, " "), // xoa dau /
  _.replace(/(\s?trên\s?)(\d+)/gi, "/$2"),
  decodeDictionaryWord,
  trimAll,
])
