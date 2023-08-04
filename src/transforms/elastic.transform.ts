import * as _ from "lodash/fp"
import { extract, format } from "src/format/vietnam"
import { NearbyParams } from "src/resources/nearby.params"

interface CreateSearchBodyQuery {
  text: string
  size: number
  minimumShouldMatch: string
  lat?: number
  lon?: number
  geocode: boolean
}

interface CreateSubQuery1 {
  parsedText: any
  minimumShouldMatch: string
}

interface CreateSearchShouldQueryNotAnalyze {
  parsedText: any
  minimumShouldMatch: string
}

interface CreateSubQuery2 {
  minimumShouldMatch: string
  formatted: string
  layer: string | string[]
}

type CreateSearchMustQueryNotAnalyze = CreateSubQuery2

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

  static createSubQuery1({
    parsedText,
    minimumShouldMatch = "90%",
  }: CreateSubQuery1) {
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
          default:
            return null
        }

        if (!value) {
          return null
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

  static createSubQuery2({
    minimumShouldMatch = "90%",
    formatted,
    layer,
  }: CreateSubQuery2) {
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
    lat,
    lon,
    geocode = false
  }: CreateSearchBodyQuery) {
    // const formatted = format(text)
    const formatted = text
    const parsedText = extract(formatted)
    // console.log(JSON.stringify(parsedText, null, 2))
    const layer = !parsedText.street ? "venue" : ""

    // create default query body
    const body: Record<string, any> = {
      query: {
        bool: {
          must: ElasticTransform.createSubQuery2({
            formatted,
            layer: ["address", "venue"],
            minimumShouldMatch,
          }),
          should: [],
        },
      },
      size: size ?? 20,
      track_scores: true,
      sort: ["_score"],
    };

    if (geocode) {
      body.query.bool.must = body.query.bool.must.concat(ElasticTransform.createSubQuery1({
        parsedText,
        minimumShouldMatch,
      }));
    } else {
      body.query.bool.should = body.query.bool.should.concat(ElasticTransform.createSubQuery1({
        parsedText,
        minimumShouldMatch,
      }));
    }

    // if focus lat lon is provided, add function score to boost score of result that near focus point
    if (lat !== undefined && lon !== undefined) {
      body.query = {
        function_score: {
          query: body.query,
          functions: [
            {
              weight: 2,
              gauss: {
                center_point: {
                  origin: {
                    lat: lat,
                    lon: lon,
                  },
                  offset: "0km",
                  scale: "100km",
                  decay: 0.5,
                },
              },
            },
          ],
          score_mode: "avg",
          boost_mode: "replace",
        },
      };
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
