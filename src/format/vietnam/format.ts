import * as _ from "lodash/fp"
import regex from "src/data/vietnam/regex.json"
import abbreviations from "src/data/vietnam/abbreviations.json"
import dictionary from "src/data/vietnam/dictionary.json"
import deaccents from "src/format/vietnam/deaccents"

const dedupSpaces = _.replace(/\s+/g, " ")

const trimAll = _.flow([
  _.split(","),
  _.map(_.trim),
  _.filter((_) => _ != ""),
  _.join(", "),
])

const capitalizeAll = _.flow([
  _.split(","),
  _.map(_.flow([_.trim, _.split(" "), _.map(_.upperFirst), _.join(" ")])),
  _.join(", "),
])

const dedupString = _.flow([
  _.split(","),
  _.uniqBy(_.flow([deaccents, _.lowerCase])),
  _.join(", "),
])

const sanitizeStreet = _.flow([
  _.replace(/(?<=^|\W)(Đường\s|đường\s)/gi, " Đường "),
  _.replace(/(?<=^|,|\s)(Đ\s|đ\s|Đ\.|đ\.)/gi, " Đường "),
  _.replace(/(?<=^|\W)(Street|Road)(?=$|\W)/gi, ", "),
  (text: string) => {
    // handle phố ở Hà Nội
    if (!text.includes("Hà Nội")) {
      return text
    }

    text = text.replace(/(?<=^|\W)(Phố\s)/gi, " Phố ")
    text = text.replace(
      /(?<=[A-Z]?[0-9][A-Z\-/0-9]*)[\s,]*(P\s|P\.)/gi,
      " Phố "
    )

    return text
  },
  // _.replace(/(?<=^|\W)Đường\s+(\d{1,3})(?=$|\W)/gi, " Đường số $1, "),
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

const cleanBracketContents = (text: string) => {
  //cleanBracketContents will remove all content that is inside brackets
  //There can be many brackets, so we have to remove all content inside all those brackets.
  //There can be nested brackets, so we only need to remove all content inside the most outer brackets.
  //Also, in case open bracket does not have a matching close bracket, we will remove all content after that open bracket until the end of the string.
  //For example: "123 (abc (xyz) def" will be transformed to "123 to 123 abc xyz def",
  //For example: "123 (abc (xyz) def) 456" will be transformed to "123 456"

  let result = ""
  let count = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === "(") {
      count++
    } else if (char === ")") {
      if (count > 0) {
        count--
      }
    } else if (count === 0) {
      result += char
    }
  }
  if (count != 0) return text.replace(/(\(|\))/g,'')
  return result
}

const cleanAddress = _.flow([
  cleanBracketContents,
  _.replace(/(?<=^|\W)(Vietnam|Việt Nam|Viet Nam|ViệtNam)(?=$|\W)/gi, ""),
  _.replace(/(?<=^|,|\s)(VN)(?=$|,|\s)/gi, ""),
  _.replace(
    /(?<=^|,|\s)(Đ\/c|đ\/c|Đc|đc|Địa Chỉ|địa chỉ|D\/c|Dc|Dia Chi)(?=$|,|\s)/gi,
    ""
  ),
  _.replace(/(?<=^|\W)\d{5,6}(?=$|\W)/gi, " "), // clean VN postal code
  _.replace(/(?<=^|\W)(\+84|0)(9|8|1[2689])([0-9]{8})(?=$|\W)/g, " "), // xoá số điện thoại Việt Nam
  _.replace(/["\\]/g, " "), // remove common non-related symbols such as " \
  _.replace(/[\n\t]/g, " "), // remove common escape sequences: \n, \t
  _.replace(/^\s*[,.\-'/]+/, ""), //remove preceding symbols such as , . - ' /
  _.replace(/(;|\s\/\s)/g, " , "), // replace ; and / with ,
  _.replace(
    /^\s*(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i,
    "$2"
  ),
  _.replace(
    /(?<=^|\W)(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)([0-9])/gi,
    "$1 $2"
  ),
  _.replace(/(\s+trên\s+)(\d+)/gi, "/$2"), // 2 trên 3 -> 2/3
  _.replace(/^\s*([A-Z]?[0-9][A-Z\-/0-9]*)([\s,]*)/i, "$1 "), // xoá dấu , kề sau số nhà
  _.replace(/(?<=^|\W)Gần .*?(?=$|,)/gi, " "), // xoá "gần ..."
  _.replace(/(Đường\s)(số\s)?(\d+)(\s|,)/i,"Đường số $3, ")

  // _.replace(
  //   /^([a-z0-9]*)(\s?-\s?)([a-z0-9]*)(,?\s)([a-z0-9]*)(\s?-\s?)([a-z0-9]*)/i,
  //   "$1@$3$4$5@$7"
  // ),
  // (str) => {
  //   const re = /^([a-t0-9]+)(-)([a-t0-9]+)/gi
  //   const number = str.match(re)

  //   return _.flow([
  //     _.replace(new RegExp(number, "gi"), "%"),
  //     _.replace(/^([0-9a-z]+)(\s?-\s?)((?:.)*?)(?=,)/gi, (_, p1, p2, p3) => {
  //       if (p3.length > 3) {
  //         return p1 + " @ " + p3
  //       }

  //       return p1 + "@" + p3
  //     }),
  //     _.replace(/([0-9]+)(-)([0-9]+)(-)([0-9]+)/, "$1@$3@$5"),
  //     _.replace(/([0-9]+)(-)([0-9]+)/, "$1@$3"),
  //     _.replace(/(\d)-/g, "$1,"),
  //     _.replace("%", number),
  //   ])(str)
  // },
  // _.replace(/@/g, "-"),
])

const addLeadingZero = function (text: string) {
  return _.replace(/(Quận|Phường)(\s+)(\d+)/gi, (_, p1, p2, p3) => {
    return p1 + " " + p3.trim() //.padStart(2, "0")
  })(text)
}

const sanitizeWithoutFirst =
  (regex: RegExp, replacement: string) => (text: string) => {
    const [p1, ...rest] = text.split(",")

    if (rest.length === 0) {
      return text
    }

    const formatted = rest.join(",").replace(regex, replacement)

    return [p1].concat(formatted).join(",")
  }

const sanitizeRegion = _.flow([
  // sanitizeWithoutFirst(/(?<=^|\W)City(?=$|\W)/gi, ","),
  sanitizeWithoutFirst(/(?<=^|\W)Province(?=$|\W)/gi, ","),
  sanitizeWithoutFirst(/(?<=^|\W)(Thành Phố\s|Thanh Pho\s)/gi, ", Thành Phố "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(Tp\s|Tp\.)/gi, ", Thành Phố "),
  sanitizeWithoutFirst(/(?<=^|\W)(Tỉnh\s)/gi, ", Tỉnh "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(T\s|T\.)/gi, ", Tỉnh "),
])

const sanitizeCounty = _.flow([
  _.replace(/(District((?:(?!District).)*?(?=,|$)))/gi, (_, p1, p2) => {
    if (p2 && !isNaN(p2)) {
      return ", Quận " + p2 + ", "
    }

    return ", " + p2 + ", "
  }),
  sanitizeWithoutFirst(/(?<=^|\W)(Quận\s)/gi, ", Quận "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(Q\s|Q\.)/gi, ", Quận "),
  sanitizeWithoutFirst(/(?<=^|,|\s)q(\d{1,2})(?=$|,|\s)/gi, ", Quận $1, "),
  sanitizeWithoutFirst(/(?<=^|\W)(Huyện\s)/gi, ", Huyện "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(H\s|H\.)/gi, ", Huyện "),
  sanitizeWithoutFirst(/(?<=^|\W)(Thị Xã\s|Thi Xa\s)/gi, ", Thị Xã "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(Tx\s|Tx\.)/gi, ", Thị Xã "),
])

export const removeCountyPrefix = function (county: string) {
  // remove "Thành Phố", "Quận" "Huyện" "Thị Xã" from county string
  return county
    .replace(/(?<=^|\W)(Thành Phố\s|Quận\s|Huyện\s|Thị Xã\s)/gi, "")
    .trim()
}

const sanitizeLocality = _.flow([
  _.replace(/(Ward((?:(?!Ward).)*?(?=,|$)))/gi, (_, p1, p2) => {
    if (p2 && !isNaN(p2)) {
      return ", Phường " + p2 + ", "
    }

    return ", " + p2 + ", "
  }),
  sanitizeWithoutFirst(/(?<=^|\W)(Phường\s)/gi, ", Phường "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(F\s|F\.)/gi, ", Phường "),
  (text: string) => {
    // tránh lầm giữa phố vs phường ở Hà Nội
    if (text.includes("Hà Nội")) {
      return text
    }

    return sanitizeWithoutFirst(/(?<=^|,|\s)(P\s|P\.)/gi, ", Phường ")(text)
  },
  sanitizeWithoutFirst(/(?<=^|,|\s)[pf](\d{1,2})(?=$|,|\s)/gi, ", Phường $1, "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(X\s|X\.)/gi, ", Xã "),
  sanitizeWithoutFirst(/(?<=^|\W)(?<!Thị\s)(Xã\s)/gi, ", Xã "),
  sanitizeWithoutFirst(/(?<=^|\W)(Thị Trấn\s|Thi Tran\s)/gi, ", Thị Trấn "),
  sanitizeWithoutFirst(/(?<=^|,|\s)(Tt\s|Tt\.)/gi, ", Thị Trấn "),
])

export const removeLocalityPrefix = function (locality: string) {
  // remove "Phường" "Xã" "Thị Trấn" from locality string
  return locality.replace(/(?<=^|\W)(Phường\s|Xã\s|Thị Trấn\s)/gi, "").trim()
}

const transformAll = function (text: string) {
  let arr = text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "")

  let locality = "",
    county = "",
    region = ""
  const regexLocality = new RegExp("^(Phường|Xã|Thị Trấn)", "i")
  const regexCounty = new RegExp("^(Thành Phố|Quận|Huyện|Thị Xã)", "i")

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (regexLocality.test(item)) {
      if (locality == "") {
        locality = item
      } else {
        arr[i] = ""
      }
    }
  }

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (regexCounty.test(item)) {
      if (county == "") {
        county = item
      } else {
        arr[i] = ""
      }
    }
  }

  const regionKeys = Object.keys(regex)
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (regionKeys.includes(item)) {
      if (region == "") {
        region = item
      } else {
        arr[i] = ""
      }
    }
  }

  text = arr.filter((item) => item !== "").join(", ")

  if (locality != "" && county != "" && region != "") {
    arr = text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "")

    text = ""

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      if (item != locality && item != county && item != region) {
        text += item + ", "
      } else {
        break
      }
    }

    text += locality + ", " + county + ", " + region
  }

  if (region != "") {
    text += ", Việt Nam"
  }

  return text
}

// const reverseString = _.flow([_.split(","), _.reverse, _.join(",")])

const transformAbbreviations = (text: string) => {
  for (const [key, value] of Object.entries(abbreviations)) {
    const re = new RegExp(value, "gi")
    text = text.replace(re, key)
  }

  return text
}

const transformRegion = (text: string) => {
  for (const [key, value] of Object.entries(regex)) {
    const re = new RegExp(value, "gi")
    text = text.replace(re, key)
  }

  return text
}

export const format = _.flow([
  dedupSpaces,
  transformAbbreviations,
  encodeDictionaryWord,
  cleanAddress,
  decodeDictionaryWord,
  dedupSpaces,
  sanitizeStreet,
  sanitizeRegion,
  sanitizeLocality,
  sanitizeCounty,
  addLeadingZero,
  dedupSpaces,
  capitalizeAll,
  transformRegion,
  dedupString,
  dedupSpaces,
  trimAll,
  transformAll,
])
