import * as _ from "lodash/fp"
import { extract, format } from "src/format/vietnam"
import { NearbyParams } from "src/resources/nearby.params"

interface CreateSearchBodyQuery {
  text: string
  size: number
  minimumShouldMatch: string
}

interface CreateSearchShouldQuery {
  parsedText: any
  minimumShouldMatch: string
}

interface CreateSearchShouldQueryNotAnalyze {
  parsedText: any
  minimumShouldMatch: string
}

interface CreateSearchMustQuery {
  minimumShouldMatch: string
  formatted: string
  layer: string | string[]
}

type CreateSearchMustQueryNotAnalyze = CreateSearchMustQuery

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

  static createSearchShouldQuery({
    parsedText,
    minimumShouldMatch = "90%",
  }: CreateSearchShouldQuery) {
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
              analyzer: "peliasQuery",
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

  static createSearchMustQuery({
    minimumShouldMatch = "90%",
    formatted,
    layer,
  }: CreateSearchMustQuery) {
    const result: any[] = [
      {
        match: {
          "name.default": {
            analyzer: "peliasQuery",
            boost: 1,
            query: formatted,
            minimum_should_match: minimumShouldMatch,
            // minimum_should_match: '1<-1 3<-25%',
          },
        },
      },
    ]

    if (layer === "venue") {
      result.push({
        term: {
          layer: "venue",
        },
      })
    }

    return result
  }

  static createSearchBodyQuery({
    text,
    size = 20,
    minimumShouldMatch,
  }: CreateSearchBodyQuery) {
    const formatted = format(text)
    const parsedText = extract(formatted)
    const layer = !parsedText.street ? "venue" : ""

    const body = {
      query: {
        bool: {
          must: ElasticTransform.createSearchMustQuery({
            formatted,
            layer: ["address", "venue"],
            minimumShouldMatch,
          }),
          should: ElasticTransform.createSearchShouldQuery({
            parsedText,
            minimumShouldMatch,
          }),
        },
      },
      size: size ?? 20,
      track_scores: true,
      sort: ["_score"],
    }

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
              distance: params["boundary.circle.radius"] ?? "20m",
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
