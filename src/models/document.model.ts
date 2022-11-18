export interface Name {
  default: string
}

export interface AddressParts {
  street: string
  number?: string
}

export interface Parent {
  continent: string[]
  continent_id: string[]
  continent_a: string[]
  country: string[]
  country_id: string[]
  country_a: string[]
  region: string[]
  region_id: string[]
  region_a: string[]
  locality: string[]
  county: string[]
  county_id: string[]
  county_a: string[]
}

export interface CenterPoint {
  lon: number
  lat: number
}

interface Addendum {
  entrances: string
  polygon: string
}

export interface DocumentModel {
  center_point: CenterPoint
  name: Name
  parent: Parent
  address_parts: AddressParts
  source: string
  source_id: string
  layer: string
  addendum: Addendum
}
