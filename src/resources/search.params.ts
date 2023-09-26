export interface SearchParams {
  text: string
  size?: number
  count_terminate_after?: number
  "focus.point.lat"?: string
  "focus.point.lon"?: string
}

export interface SearchByNameParams {
  text: string
  lat?: string
  lon?: string
  size?: number
}
