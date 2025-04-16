import * as _ from "lodash/fp"
import { AddressParts } from "src/models/address-parts.model"

const hasCountry = (text: string) => {
  return /Việt Nam/gi.test(text)
}

const findCountry = (text: string) => {
  const arr = text.split(",")

  if (hasCountry(text)) {
    return arr[arr.length - 1].trim()
  }

  return ""
}

const findRegion = (text: string) => {
  const arr = text.split(",")

  if (hasCountry(text)) {
    return arr[arr.length - 2].trim()
  }

  return ""
}

const findCounty = (text: string) => {
  const arr = text.split(",")
  let county = ""
  let index = -1

  let length = arr.length
  if (!hasCountry(text)) length = length + 2

  if (length >= 4) {
    county = arr[length - 3]
    index = length - 3
  }

  if (isAddress(county)) {
    county = ""
    index = -1
  }

  return {
    index,
    name: county.trim(),
  }
}

const findLocality = (text: string) => {
  const arr = text.split(",")
  let locality = ""
  let index = -1

  let length = arr.length
  if (!hasCountry(text)) length = length + 2

  if (length >= 5) {
    locality = arr[length - 4]
    index = length - 4
  }

  if (isAddress(locality)) {
    locality = ""
    index = -1
  }

  return {
    index,
    name: locality.trim(),
  }
}

const extractAddressParts = (arr: string[]) => {
  let number = ""
  let street = ""

  arr.forEach((value) => {
    const data = /^([Số|Ngõ\s0-9/-]+)(\s)(.*)/gi.exec(value.trim())

    if (data) {
      number = data[1]
      street = data[3]
    }
  })

  return {
    number: number.trim(),
    street: street.trim(),
  }
}

const extractAddress = (text: string) => {
  const arr = text.split(",")
  let number: string
  let street: string
  let address = arr[0] || ""

  // const data = /^([A-Z]?[0-9][A-Z\-/0-9]*)([,\s]+)((?:.)*?(?=,|$))/gi.exec(text)
  const data = /^([A-Z]?[0-9][A-Z\-/0-9]*)(?:([,\s]+)((?:.)*?(?=,|$)))?/gi.exec(text);

  if (data) {
    number = data[1]
    street = data[3]
  } else {
    // eslint-disable-next-line no-use-before-define
    let addressParts: any = /Phố((?:(?!Phố).)*?(\s{2}|(?=,)))/.exec(text)

    if (addressParts) {
      street = addressParts[0]
      number = text.slice(0, addressParts.index).replace(/,/gi, "")
    } else {
      addressParts = extractAddressParts(arr)

      number = addressParts.number
      street = addressParts.street
    }
  }

  if (!number.replace(/[^0-9]/gi, "")) {
    number = ""
  }

  if (arr.length === 1) {
    address = arr[0] || ""
  }

  if (arr.length === 10) {
    address = _.slice(0, 6, arr).join(",")
  }

  if (arr.length === 8) {
    address = _.slice(0, 4, arr).join(",")
  }

  if (arr.length === 7) {
    address = _.slice(0, 3, arr).join(",")
  }

  if (arr.length === 6) {
    address = _.slice(0, 2, arr).join(",")
  }

  return {
    number,
    street,
    address,
  }
}

// export const isHouseNumber = (text: string) => {
//   return /^[0-9a-h/]+/gi.test(text)
// }

export const isAddress = (text: string): RegExpMatchArray | null => {
  let firstPart = text.split(",")[0].trim()
  firstPart = firstPart
    .replace(
      /^(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i,
      "$2"
    )
    .trim()

  return firstPart.match(/^[A-Z]?[0-9][A-Z\-/0-9]*(?=\s|$)/i)
}

export const extractVenue = (text: string): string => {
  if (isAddress(text)) {
    return ""
  }

  const venue = text.split(",")[0]
  if (!venue.replace(/[^a-z0-9À-ỹ]/gi, "")) {
    return ""
  }

  return venue.trim()
}

export const extract = (text: string): AddressParts => {
  const arr = text.split(",")
  const country = findCountry(text)
  const region = findRegion(text)
  const { name: county, index: countyIndex } = findCounty(text)
  let locality = "",
    localityIndex = -1
  if (county != "" && countyIndex > -1) {
    const { name: _locality, index: _localityIndex } = findLocality(text)
    locality = _locality
    localityIndex = _localityIndex
  }

  const index =
    localityIndex > -1
      ? localityIndex
      : countyIndex > -1
      ? countyIndex
      : arr.length

  const result: AddressParts = {
    country,
    region,
    county,
    locality,
  }

  const venue = extractVenue(text)
  const addressParams = arr.slice(0, index).join(",")
  const { number, street, address } = extractAddress(addressParams)

  if (number) {
    result.number = number
  }

  if (street) {
    result.street = street
  }

  if (venue) {
    result.venue = venue
  } else {
    result.address = address
  }

  return result
}
