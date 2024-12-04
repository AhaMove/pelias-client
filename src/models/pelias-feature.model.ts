export interface PeliasGeometry {
  type: string
  coordinates: number[]
}

export interface PeliasProperties {
  id: string
  gid: string
  layer: string
  source: string
  source_id: string
  name: string
  accuracy: string
  region: string
  region_gid: string
  region_a: string
  county: string
  county_gid: string
  county_a: string
  label: string
  distance: number
  housenumber?: string
  street: string
  locality: string
  locality_gid: string
  locality_a: string
  entrances: string
  polygon: string
  region_id: string
  locality_id: string
  county_id: string
}

export interface PeliasFeatureModel {
  type: string
  geometry: PeliasGeometry
  properties: PeliasProperties
}
