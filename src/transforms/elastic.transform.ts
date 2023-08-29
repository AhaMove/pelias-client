import * as _ from "lodash/fp"
import { extract, format } from "src/format/vietnam"
import { NearbyParams } from "src/resources/nearby.params"

interface CreateSearchBodyQuery {
  text: string
  size: number
  minimumShouldMatch: string
  lat?: number
  lon?: number
}

interface CreateClauseQueries {
  parsedText: any
}

interface CreateSearchShouldQueryNotAnalyze {
  parsedText: any
  minimumShouldMatch: string
}

interface CreateSearchMustQueryNotAnalyze {
  minimumShouldMatch: string
  formatted: string
  layer: string | string[]
}

export class ElasticTransform {
  static createSearchShouldQueryNotAnalyze({
    parsedText,
    minimumShouldMatch = "90%",
  }: CreateSearchShouldQueryNotAnalyze) {
    return _.flow([
      _.toPairs,
      _.map(([key, value]) => {
        let newKey = `parent.${key}`

        if (!value) {
          return null
        }

        if (["number", "street"].includes(key)) {
          newKey = `address_parts.${key}`
        }

        if (key === "venue") {
          newKey = "name.default"
        }

        return {
          match: {
            [newKey]: {
              boost: 1,
              query: value,
              minimum_should_match: minimumShouldMatch,
            },
          },
        }
      }),
      _.filter((value) => !!value),
    ])(parsedText)
  }

  static createSearchMustQueryNotAnalyze({
    minimumShouldMatch = "90%",
    formatted,
    layer,
  }: CreateSearchMustQueryNotAnalyze) {
    const results: any[] = [
      {
        match: {
          "name.default": {
            boost: 1,
            query: formatted,
            minimum_should_match: minimumShouldMatch,
            // minimum_should_match: '1<-1 3<-25%',
          },
        },
      },
    ]

    if (layer === "venue") {
      results.push({
        term: {
          layer: "venue",
        },
      })
    }

    return results
  }

  static createClauseQueries({ parsedText }: CreateClauseQueries) {
    return _.flow([
      _.toPairs,
      _.map(([key, value]) => {
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
            newKey = "name.default"
            break
          default:
            return null
        }

        if (!value) {
          return null
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

  static createSearchBodyQuery({
    text,
    size,
    minimumShouldMatch,
    lat,
    lon,
  }: CreateSearchBodyQuery) {
    // const formatted = format(text)
    const formatted = text
    const parsedText = extract(formatted)
    // console.log("parsedText:\n", JSON.stringify(parsedText, null, 2))
    const layer = parsedText.venue ? "venue" : ""

    // create basic query body
    const body: Record<string, any> = {
      query: {
        bool: {
          must:
            layer != ""
              ? [
                  {
                    term: {
                      layer: layer,
                    },
                  },
                ]
              : [],
          should: ElasticTransform.createClauseQueries({ parsedText }),
          minimum_should_match: minimumShouldMatch,
        },
      },
      size: size,
      track_scores: true,
      sort: ["_score"],
    }

    // if parsedText has venue, filter for addresses which have that venue in the beginning of "name.default"
    if (parsedText.venue) {
      body.query.bool.must.push({
        intervals: {
          "name.default": {
            match: {
              query: parsedText.venue,
              filter: {
                script: {
                  source:
                    "interval.start >= 0 && interval.end <= " +
                    (parsedText.venue.split(" ").length + 1) +
                    " && interval.gaps == 0",
                },
              },
            },
          },
        },
      })
    }

    // if focus lat lon is provided, sort the results from near to far without affecting the relevance _score
    if (lat !== undefined && lon !== undefined) {
      body.sort = [
        {
          _geo_distance: {
            center_point: {
              lat: lat,
              lon: lon,
            },
            order: "asc",
            unit: "m",
            distance_type: "plane",
          },
        },
      ]
    }

    // console.log("SearchBodyQuery:\n", JSON.stringify(body, null, 2))

    return {
      body,
      formatted,
      parsedText,
      layer,
    }
  }

  static createNearByBody(params: NearbyParams) {
    const size = params.size ?? "10"
    const nearByBody: any = {
      query: {
        bool: {
          filter: {
            geo_distance: {
              distance: params["boundary.circle.radius"] ?? "50m",
              center_point: {
                lat: parseFloat(params["point.lat"]),
                lon: parseFloat(params["point.lon"]),
              },
            },
          },
          must: [],
        },
      },
      size: parseInt(size),
      sort: {
        _geo_distance: {
          center_point: {
            lat: parseFloat(params["point.lat"]),
            lon: parseFloat(params["point.lon"]),
          },
          order: "asc",
        },
      },
    }

    if (params.sources) {
      nearByBody.query.bool.must.push({
        terms: {
          source: params.sources.split(","),
        },
      })
    }

    if (params.layers) {
      nearByBody.query.bool.must.push({
        terms: {
          layer: params.layers.split(","),
        },
      })
    }

    return nearByBody
  }
}
