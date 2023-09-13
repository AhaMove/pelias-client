export interface SearchParams {
  text: string
  size?: number
  count_terminate_after?: number
  "focus.point.lat"?: string
  "focus.point.lon"?: string
}

export interface SearchByNameParams {
  id?: string
  address_name?: string
  minimum_should_match?: string
}
