export interface SearchParams {
  text: string
  size?: string
  /**
   * The minimum percent will match these addresses, default is 80%
   */
  minimumShouldMatch?: string
  "focus.point.lat"?: string
  "focus.point.lon"?: string
}

export interface SearchByNameParams {
  id?: string
  address_name?: string
  minimum_should_match?: string
}
