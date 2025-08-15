import * as _ from "lodash/fp"
import { CountModel } from "src/models/count.model"
import { AddressParts } from "src/models/address-parts.model"
import {
  buildMultiIndexAggregations,
  buildMultiIndexSearchOpts,
} from "./elastic.transform.js"
import { extractV2 } from "../format/vietnam/extractV2.js"

export interface CreateSearchBodyResult {
  /** The Elasticsearch query body */
  body: {
    query: Record<string, any>
    size: number
    track_scores: boolean
    sort: Array<Record<string, any>>
    _source: boolean
    script_fields?: Record<string, any>
    aggs?: Record<string, any>
  }
  /** Formatted and normalized search text */
  formatted: string
  /** Parsed address components */
  parsedText: AddressParts
  /** Layer type (e.g., "venue" or "") */
  layer: string
  /** Multi-index search options */
  multiIndexOpts: MultiIndexOptions | null
}

export interface MultiIndexOptions {
  extraFilters?: Array<any>
  extraFunctions?: Array<any>
  aggregations?: Record<string, MultiIndexAggregationConfig> | null
  overwriteHits?: boolean
}

export interface MultiIndexAggregationConfig {
  filter: any
  size: number
}

interface CreateSearchBodyParams {
  /** Search query text */
  text: string
  /** Maximum number of results to return */
  size: number
  /** Latitude coordinate for location-based search */
  lat?: number
  /** Longitude coordinate for location-based search */
  lon?: number
  /** Function to count matching documents for optimization */
  countFunc: (queryBody: { query: Record<string, any> }) => Promise<CountModel>
  /** Enable geocoding (administrative area matching) */
  geocode: boolean
  /** Multi-index search options for personalized results */
  multiIndexOpts?: MultiIndexOptions | null
  /** User identifier for personalized results */
  userId: string
}

interface CreateShouldClauses {
  parsedText: AddressParts
  formatted: string
}

interface CreateQuery {
  parsedText: AddressParts
  formatted: string
}

interface RescoreQuery {
  query: Record<string, any>
  venueName: string
  parsedText: AddressParts
}

interface CreateSort {
  sortScore: boolean
  lat?: number
  lon?: number
}

function createShouldClauses({ parsedText }: CreateShouldClauses) {
  return _.flow([
    _.toPairs,
    _.map(([key, value]: [string, string]) => {
      let _a
      let newKey
      switch (key) {
        case "region":
        case "county":
        case "locality":
          newKey = `parent.${key}`
          break
        case "number":
        case "street":
          newKey = `address_parts.${key}`
          break
        case "address":
          if (!parsedText.street) newKey = "name.default"
          break
        default:
          return null
      }
      if (!value || !newKey) {
        return null
      }
      if (newKey === "parent.locality") {
        if (value.match(/(Phường)\s\D/)) value = value.replace("Phường ", "")
      }
      if (newKey === "parent.county") {
        if (value.match(/(Quận)\s\D/)) value = value.replace("Quận ", "")
      }
      if (
        newKey === "address_parts.street" &&
        ((_a =
          parsedText === null || parsedText === void 0
            ? void 0
            : parsedText.address) === null || _a === void 0
          ? void 0
          : _a.includes("Hà Nội"))
      ) {
        if (value.match(/^(Phố)\s\D/i)) value = value.replace("Phố ", "")
      }
      if (newKey === "address_parts.number") {
        value = value.replace(/[^0-9]/g, " ")
        value = value.replace(/\s+/g, " ")
        value = value.trim()

        if (!value) {
          return null
        }
        return {
          intervals: {
            [newKey]: {
              match: {
                query: value,
                filter: {
                  script: {
                    source: "interval.start == 0 && interval.gaps == 0",
                  },
                },
                ordered: true,
              },
            },
          },
        }
      }
      return {
        match_phrase: {
          [newKey]: {
            analyzer: "peliasQuery",
            query: value,
          },
        },
      }
    }),
    _.filter((value) => !!value),
  ])(parsedText)
}
function createQuery({ layer, parsedText }: CreateQuery & { layer: string }) {
  const result: {
    bool: { must: any[]; should: any[]; minimum_should_match: string }
  } = {
    bool: {
      must: [],
      should: createShouldClauses({ parsedText, formatted: "" }),
      minimum_should_match: "100%",
    },
  }
  if (layer != "") {
    result.bool.must.push({
      term: {
        layer: layer,
      },
    })
  }
  if (parsedText.venue) {
    const venue_token_count = parsedText.venue.trim().split(/\s+/).length
    result.bool.must.push({
      intervals: {
        "name.default": {
          match: {
            query: parsedText.venue,
            filter: {
              script: {
                source:
                  "interval.start >= 0 && interval.end < " +
                  (venue_token_count + 4) +
                  " && interval.gaps <= " +
                  Math.max(venue_token_count - 1, 0),
              },
            },
            ordered: true,
          },
        },
      },
    })
  }
  return result
}
function rescoreQuery({ query, venueName }: RescoreQuery) {
  return {
    function_score: {
      query: query,
      functions: [
        {
          script_score: {
            script: {
              source:
                "try {params._source.addendum.entrances.length() > 2 ? 1 : 0} catch (Exception e) {0}",
            },
          },
        },
        {
          script_score: {
            script: {
              source: `
              try {
                double score = 0;
                int pos = params._source.name.default.toLowerCase().indexOf(params.venueName);
                if (pos > 0) {
                    score = 5;
                }
                if (pos == 0) {
                    score = 10;
                }
                return score;
                } catch (Exception e) {
                return 0;
              }
            `,
              params: {
                venueName: venueName.toLowerCase(),
              },
            },
          },
        },
      ],
      score_mode: "sum",
      boost_mode: "replace",
    },
  }
}
function createSort({ sortScore, lat, lon }: CreateSort) {
  const result = []
  if (sortScore) {
    result.push({
      _score: "desc",
    })
  }
  if (lat !== undefined && lon !== undefined) {
    result.push({
      _geo_distance: {
        center_point: {
          lat: lat,
          lon: lon,
        },
        order: "asc",
        unit: "m",
        distance_type: "plane",
      },
    })
  }
  if (result.length === 0) {
    result.push({
      _doc: "desc",
    })
  }
  return result
}
async function createSearchBody({
  text,
  size,
  lat,
  lon,
  countFunc,
  geocode = false,
  userId,
}: CreateSearchBodyParams): Promise<CreateSearchBodyResult> {
  const formatted = text
  const parsedText = extractV2(formatted)
  const layer = parsedText.venue ? "venue" : ""
  let sortScore = true
  let query: any = createQuery({ layer, parsedText, formatted })
  const multiIndexOpts = userId ? buildMultiIndexSearchOpts(userId) : null
  if (multiIndexOpts) {
    if (multiIndexOpts.extraFilters) {
      query.bool.filter = query.bool.filter || []
      query.bool.filter.push(...multiIndexOpts.extraFilters)
    }
  }
  const countResult = await countFunc({
    query: query,
  })
  if (parsedText.venue) {
    if (!countResult.terminated_early) {
      const venueName = parsedText.venue || ""
      query = rescoreQuery({ query, venueName, parsedText })
    } else {
      sortScore = false
    }
  }
  if (parsedText.number) {
    const score_exact_address_number = {
      script_score: {
        script: {
          source:
            "try { 100-params._source.address_parts.number.length() } catch (Exception e) {0}",
        },
      },
    }
    if (query.function_score) {
      query.function_score.functions.push(score_exact_address_number)
    } else {
      query = {
        function_score: {
          query: query,
          functions: [score_exact_address_number],
          score_mode: "sum",
          boost_mode: "replace",
        },
      }
    }
  }
  if (multiIndexOpts && multiIndexOpts.extraFunctions) {
    if (!query.function_score) {
      query = {
        function_score: {
          query: query,
          functions: [],
        },
      }
    }
    query.function_score.functions = query.function_score.functions || []
    query.function_score.functions.push(...multiIndexOpts.extraFunctions)
  }
  const sort = createSort({ sortScore, lat, lon })
  if (multiIndexOpts && multiIndexOpts.overwriteHits) {
    size = 0
  }
  const body: any = {
    query: query,
    size: size,
    track_scores: true,
    sort: sort,
  }
  if (multiIndexOpts && multiIndexOpts.aggregations) {
    body["aggs"] = buildMultiIndexAggregations(
      multiIndexOpts.aggregations,
      sort
    )
  }
  return {
    body,
    formatted,
    parsedText,
    layer,
    multiIndexOpts,
  }
}

export { createSearchBody }
