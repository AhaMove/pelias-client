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

  if (arr.length === 10) {
    county = arr[7]
    index = 7
  }

  if (arr.length === 9) {
    county = arr[6]
    index = 6
  }

  if (arr.length === 8) {
    county = arr[5]
    index = 5
  }

  if (arr.length === 7) {
    county = arr[4]
    index = 4
  }

  if (arr.length === 6) {
    county = arr[3]
    index = 3
  }

  if (arr.length === 5) {
    county = arr[2]
    index = 2
  }

  if (arr.length === 4) {
    county = arr[1]
    index = 1
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

  if (hasCountry(text)) {
    if (arr.length === 10) {
      locality = arr[6]
      index = 6
    }

    if (arr.length === 9) {
      locality = arr[5]
      index = 5
    }

    if (arr.length === 8) {
      locality = arr[4]
      index = 4
    }

    if (arr.length === 7) {
      locality = arr[3]
      index = 3
    }

    if (arr.length === 6) {
      locality = arr[2]
      index = 2
    }

    if (arr.length === 5) {
      locality = arr[1]
      index = 1
    }

    if (arr.length === 3) {
      locality = ""
    }

    return {
      index,
      name: locality.trim(),
    }
  }

  if (arr.length >= 2) {
    return {
      index,
      name: arr[1].trim(),
    }
  }

  return {
    index,
    name: locality,
  }
}

const extractAddressParts = (arr: string[]) => {
  let number = ""
  let street = ""

  arr.forEach((value) => {
    const data = /^([Số|Ngõ\s0-9/\-]+)(\s)(.*)/gi.exec(value.trim())

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

  const data = /^([0-9A-Ha-h/\-]+)(,|\s)((?:.)*?(?=,))/g.exec(text)

  if (data) {
    number = data[1]
    street = data[3]
  } else {
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

export const isAddress = (text: string) => {
  const firstPart = text.split(",")[0]
  return firstPart.match(/^[0-9]+[a-zA-Z\-\/0-9]*[\s]+/)
}

export const isVenue = (text: string) => {
  return !isAddress(text)
}

export const extract = (text: string): AddressParts => {
  const arr = text.split(",")
  const country = findCountry(text)
  const region = findRegion(text)
  const { name: county, index: countyIndex } = findCounty(text)
  const { name: locality, index: localityIndex } = findLocality(text)

  const index = localityIndex > -1 ? localityIndex : countyIndex

  const result: AddressParts = {
    country,
    region,
    county,
    locality,
  }

  const addressParams = arr.slice(0, index).join(",")
  const venue = isVenue(text) ? addressParams : ""
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
