import { AddressParts } from "src/models/address-parts.model"
import { PeliasFeatureModel } from "src/models/pelias-feature.model"

export interface PeliasQuery {
  text: string
  size: number
  querySize: number
  parser: string
  parsed_text: AddressParts
  formatted: string
  layer: string
  "focus.point.lat": number
  "focus.point.lon": number
}

export interface PeliasGeocoding {
  version: string
  query?: PeliasQuery
}

export interface PeliasResponse {
  geocoding: PeliasGeocoding
  type: string
  features: PeliasFeatureModel[]
}
