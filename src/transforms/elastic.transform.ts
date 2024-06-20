import * as _ from "lodash/fp"
import { extract } from "src/format/vietnam"
import { NearbyParams } from "src/resources/nearby.params"
import { CountModel } from "src/models/count.model"
import { AddressParts } from "src/models/address-parts.model"


interface CreateSearchBody {
  text: string
  size: number
  lat?: number
  lon?: number
  countFunc: (queryBody: Record<string, any>) => Promise<CountModel>
  geocode: boolean
}

interface CreateShouldClauses {
  parsedText: AddressParts
}

interface CreateQuery {
  layer: string
  parsedText: AddressParts
}

interface RescoreQuery {
  query: Record<string, any>
  venueName: string
}

interface CreateSort {
  sortScore: boolean
  lat?: number
  lon?: number
}

export class ElasticTransform {
  static createShouldClauses({ parsedText }: CreateShouldClauses) {
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
            if (parsedText.venue) return null;
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

        if (newKey == "address_parts.number") {
          // replace all non-number character into space for value string
          value = value.replace(/[^0-9]/g, " ")
          // dedup space for value string
          value = value.replace(/\s+/g, " ")
          // trim space for value string
          value = value.trim()
          // count parts separated by space in value string
          const partCount = value.split(/\s+/).length
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
                      source:
                        "interval.start == 0 && interval.end == " +
                        (partCount - 1) +
                        " && interval.gaps == 0",
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

  static createQuery({ layer, parsedText }: CreateQuery): Record<string, any> {
    const result: any = {
      bool: {
        must: [],
        should: ElasticTransform.createShouldClauses({ parsedText }),
        minimum_should_match: "100%",
      },
    }

    // if layer is provided, filter for records which have that layer
    if (layer != "") {
      result.bool.must.push({
        term: {
          layer: layer,
        },
      })
    }

    // if parsedText has venue, filter for records which have that venue in the beginning of "name.default"
    if (parsedText.venue) {
      const venue_token_count = parsedText.venue.trim().split(/\s+/).length;
      result.bool.must.push({
          intervals: {
              "name.default": {
                  match: {
                      query: parsedText.venue,
                      filter: {
                          script: {
                              source: "interval.start >= 0 && interval.end < " +
                                  (venue_token_count + 4) +
                                  " && interval.gaps <= " + Math.max(venue_token_count - 1,0),
                          },
                      },
                      ordered: true,
                  },
              },
          },
      });
    }

    return result
  }

  static rescoreQuery({ query, venueName }: RescoreQuery): Record<string, any> {
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
                  "source": `
                    try {
                      double score = 0;
                      int pos = params._source.name.default.toLowerCase().indexOf('${venueName.toLowerCase()}');
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
                  `
                }
              },
          },
        ],
        score_mode: "sum",
        boost_mode: "replace",
      },
    }
  }

  static createSort({ sortScore, lat, lon }: CreateSort) {
    const result: any = []

    if (sortScore) {
      result.push({
        _score: "desc",
      })
    }

    // if focus lat lon is provided, after sorting by _score, we sort the results from near to far
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

    // if result is empty array, we default to sort by index order
    if (result.length === 0) {
      result.push({
        _doc: "desc",
      })
    }

    return result
  }

  static async createSearchBody({
    text,
    size,
    lat,
    lon,
    countFunc,
    geocode = false,
  }: CreateSearchBody) {
    // const formatted = format(text)
    const formatted = text
    let parsedText = extract(formatted);
    const layer = parsedText.venue ? "venue" : "";
    // if not geocode, we use venue search for address type
    if (parsedText.address && !geocode) {
        parsedText = {...parsedText, venue: parsedText.address}
    }
    let sortScore = true

    // create query
    let query = ElasticTransform.createQuery({ layer, parsedText })

    // count the number of records that match the query. If return terminated_early == true, we won't recalculate the score
    const countResult = await countFunc({
      query: query,
    })

    if (!countResult.terminated_early) {
      const venueName = parsedText.venue || ""
      query = ElasticTransform.rescoreQuery({ query, venueName })
      if (parsedText.number) {
        query.function_score.functions.push({
          script_score: {
            script: {
              source: `try {params._source.address_parts.number == '${parsedText.number}' ? 1 : 0} catch (Exception e) {0}`,
            },
          }
        })
      }
    } else {
      sortScore = false
    }


    // create search query body
    const body: Record<string, any> = {
      query: query,
      size: size,
      track_scores: true,
      sort: ElasticTransform.createSort({ sortScore, lat, lon }),
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
