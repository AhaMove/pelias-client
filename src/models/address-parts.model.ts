export interface AddressParts {
  country: string
  region: string
  county: string
  locality: string
  venue?: string
  number?: string
  street?: string
  address?: string
  countyAlternatives?: Array<{
    name: string
    id: string
    match: string
  }>
}
