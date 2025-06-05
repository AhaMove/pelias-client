import * as _ from "lodash/fp"
import { extract } from "src/format/vietnam"
import { NearbyParams } from "src/resources/nearby.params"
import { CountModel } from "src/models/count.model"
import { AddressParts } from "src/models/address-parts.model"

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

interface CreateSearchBody {
  text: string
  size: number
  lat?: number
  lon?: number
  countFunc: (queryBody: Record<string, any>) => Promise<CountModel>
  geocode: boolean
  multiIndexOpts?: MultiIndexOptions | null
  userId: string 
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

interface RescoreFunction {
  script_score: {
    script: {
      source: string,
      params?: Record<string, any>
    }
  }
}

export class ElasticTransform {
  static createShouldClauses({ parsedText }: CreateShouldClauses) {
    const componentClauses = _.flow([
      _.toPairs,
      _.map(([key, value]) => {
        let newKey
        switch (key) {
          case "region":
          case "county":
          case "locality":
            newKey = `parent.${key}`
            break
          // case "number":
          // case "street":
          //   newKey = `address_parts.${key}`
          //   break
          // case "address":
          //   return null
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
        // if (
        //   newKey === "address_parts.street" &&
        //   parsedText?.address?.includes("Hà Nội")
        // ) {
        //   if (value.match(/^(Phố)\s\D/i)) value = value.replace("Phố ", "")
        // }

        // if (newKey === "address_parts.number") {
        //   // replace all non-alphanumeric characters (except /) into space for value string
        //   value = value.replace(/[^0-9a-zA-Z/]/g, " ")
        //   // dedup space for value string
        //   value = value.replace(/\s+/g, " ")
        //   // trim space for value string
        //   value = value.trim()
        //   // count parts separated by space in value string
        //   // const partCount = value.split(/\s+/).length
        //   if (!value) {
        //     return null
        //   }

        //   return {
        //     intervals: {
        //       [newKey]: {
        //         match: {
        //           query: value,
        //           // filter: {
        //           //   script: {
        //           //     source: "interval.start == 0 && interval.gaps == 0",
        //           //   },
        //           // },
        //           ordered: true,
        //         },
        //       },
        //     },
        //   }
        // }

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

    // Always add a name.default search clause
    const nameDefaultClause = {
      bool: {
        should: [
          {
            match: {
              "name.default": {
                query: parsedText.venue || parsedText.address || "",
                operator: "and",
              }
            }
          },
          {
            match_phrase: {
              "name.default": {
                query: parsedText.address || parsedText.venue || "", 
                boost: 10,
              },
            },
          }
        ]
      }
      
    }

    const entrancesClause = {
      nested: {
        path: "addendum.geometry.entrances",
        query: {
          bool:{
            should: [
            {  match: {
                "addendum.geometry.entrances.name": {
                  query: parsedText.venue || parsedText.address || "",
                  operator: "and",
                }
              }},
              {
                match_phrase: {
                  "addendum.geometry.entrances.name": {
                    query: parsedText.venue || parsedText.address || "",
                    boost: 20,
                  }
                }
              }
            ]
          }
        }
      }
    }

    return [nameDefaultClause, entrancesClause, ...componentClauses]
  }

  static createQuery({ layer, parsedText }: CreateQuery): Record<string, any> {
    const result: any = {
      bool: {
          must: [],
          should: ElasticTransform.createShouldClauses({ parsedText }),
          minimum_should_match: "50%",
      },
    };
    // if (layer != "") {
    //     result.bool.must.push({
    //         term: {
    //             layer: layer,
    //         },
    //     });
    // }
    
      if (parsedText.venue) {
          const shouldClauses: any = [
              {
                  intervals: {
                      "name.default": {
                          match: {
                              query: parsedText.venue,
                              filter: {
                                  script: {
                                      source: `interval.gaps <= 1`
                                  },
                              },
                              ordered: true,
                          },
                      },
                  },
              },
              // {
              //     nested: {
              //         path: "addendum.geometry.entrances",
              //         query: {
              //             match: {
              //                 "addendum.geometry.entrances.name": {
              //                     query: parsedText.venue,
              //                     operator: "and",
              //                 }
              //             }
              //         }
              //     }
              // }
          ]
      result.bool.should.push(...shouldClauses);
      result.bool.minimum_should_match = 1;
      }
      return result;
  
  }

  static rescoreQuery({ query, venueName }: RescoreQuery): Record<string, any> {
    const functions: RescoreFunction[] = [
      {
        script_score: {
          script: {
            source: "try { return params._source.addendum.containsKey('geometry') ? 10 : 0; } catch (Exception e) { return 0; }"
          }
        }
      },
      {
        script_score: {
          script: {
            source: "try { return params._source.layer == 'venue' ? 10 : 0; } catch (Exception e) { return 0; }"
          }
        }
      }
    ]

    if (venueName) {
      functions.push(  {
        script_score: {
          script: {
            source: `try { 
                String name = params._source.name.default.toLowerCase(); 
                int pos = name.indexOf(params.venueName); 
                if (pos == -1) return 0;
                if (pos == 0) return 1;
                int nameLength = name.length();
                double ratio = (double)pos / nameLength;
                return Math.min(10, ratio * 10); 
              } catch (Exception e) { return 0; }`,
            params: {
              venueName: venueName.toLowerCase()
            }
          }
        }
      })
    }

    return {
      function_score: {
        query: query,
        functions,
        score_mode: "sum",
        boost_mode: "replace"
      }
    }
  }

  static createSort({ sortScore, lat, lon }: CreateSort) {
    const result: any = [{
      _score: "desc",
    }]

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
    userId
  }: CreateSearchBody) {
    // const formatted = format(text)
    const formatted = text
    const parsedText = extract(formatted)
    const layer = parsedText.venue ? "venue" : ""
    // if not geocode, ignore admin parts
    if (!geocode) {
      parsedText.country = ""
      parsedText.county = ""
      parsedText.locality = ""
      parsedText.region = ""
    }
    let sortScore = true

    const multiIndexOpts = buildMultiIndexSearchOpts(userId)
    // create query
    let query = ElasticTransform.createQuery({ layer, parsedText })
    // if multiIndexOpts is provided, add extra filters
    if (multiIndexOpts) {
      if (multiIndexOpts.extraFilters) {
        query.bool.filter = query.bool.filter || []
        query.bool.filter.push(...multiIndexOpts.extraFilters)
      }
    }
    // count the number of records that match the query. If return terminated_early == true, we won't recalculate the score
    const countResult = await countFunc({
      query: query,
    })
    
    if (!countResult.terminated_early) {
      const venueName = parsedText.venue || ""
      query = ElasticTransform.rescoreQuery({ query, venueName })
    } else {
      sortScore = false
    }
    
    // if (parsedText.number) {
    //   const score_exact_address_number = {
    //     script_score: {
    //       script: {
    //         // source: `try {params._source.address_parts.number == '${parsedText.number}' ? 1 : 0} catch (Exception e) {0}`,
    //         source:
    //           "try { 100-params._source.address_parts.number.length() } catch (Exception e) {0}",
    //       },
    //     },
    //   }
    //   if (query.function_score) {
    //     query.function_score.functions.push(score_exact_address_number)
    //   } else {
    //     query = {
    //       function_score: {
    //         query: query,
    //         functions: [score_exact_address_number],
    //         score_mode: "sum",
    //         boost_mode: "replace",
    //       },
    //     }
    //   }
    // }

    // if multiIndexOpts is provided, add extra scoring functions
    if (multiIndexOpts && multiIndexOpts.extraFunctions) {
      if (!query.function_score) {
          query = {
              function_score: {
                  query: query,
                  functions: []
              }
          };
      }
      query.function_score.functions = query.function_score.functions || [];
      query.function_score.functions.push(...multiIndexOpts.extraFunctions);
  }

    // Add distance-based scoring when coordinates are available
    if (lat !== undefined && lon !== undefined && query.function_score) {
      const nearbyDistanceScore = [
        {
          filter: {
            geo_distance: {
              distance: "30km",
              center_point: { lat, lon }
            }
          },
          weight: 25
        },
        {
          filter: { match_all: {} },
          weight: 10,
          gauss: {
            center_point: {
              origin: { lat, lon },
              scale: "3km",
              offset: "0km",
              decay: 0.1
            }
          }
        }
      ];
      
      query.function_score.functions.push(...nearbyDistanceScore);
    }

    const sort = ElasticTransform.createSort({ sortScore, lat, lon })
    if (multiIndexOpts && multiIndexOpts.overwriteHits) {
      size = 0
    }
    const body: Record<string, any> = {
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

function buildMultiIndexAggregations(
  aggregations: Record<string, MultiIndexAggregationConfig> | null,
  sort: any
) {
  // Initialize empty aggregations object
  const aggs: Record<string, any> = {}
  // Return empty object if aggregations is null
  if (!aggregations) {
    return aggs
  }
  // Loop through each aggregation configuration
  for (const [aggName, aggConfig] of Object.entries(aggregations)) {
    // Skip if configuration is empty
    if (!aggConfig) continue
    aggs[aggName] = {
      filter: aggConfig.filter,
      aggs: {
        top_hits: {
          top_hits: {
            size: aggConfig.size,
            track_scores: true,
            sort: sort,
          },
        },
      },
    }
  }
  return aggs
}


function buildMultiIndexSearchOpts(userId: string): MultiIndexOptions {
  // Filters for favorite and recent locations
  const favoriteLocationFilter = {
    bool: {
      must_not: [
        {
          bool: {
            must: [
              { term: { _index: "favorite_location" } },
              { bool: { must_not: [{ term: { user_id: userId } }] } }
            ]
          }
        }
      ]
    }
  };

  const recentLocationFilter = {
    bool: {
      must_not: [
        {
          bool: {
            must: [
              { term: { _index: "recent_location" } },
              { bool: { must_not: [{ term: { user_id: userId } }] } }
            ]
          }
        }
      ]
    }
  };

  // Function scores for boosting
  const favoriteLocationFuncScore = {
    filter: { term: { _index: "favorite_location" } },
    weight: 60
  };

  const recentLocationFuncScore = {
    filter: { term: { _index: "recent_location" } },
    weight: 30
  };

  // Aggregations
  const aggs = {
    "favorite_location": {
      filter: { term: { _index: "favorite_location" } },
      size: 2
    },
    "recent_location": {
      filter: { term: { _index: "recent_location" } },
      size: 2
    },
    "pelias": {
      filter: {
        bool: {
          must_not: [
            {
              terms: {
                _index: ["favorite_location", "recent_location"] // exclude both aliases
              }
            }
          ]
        }
      },
      size: 10
    }
  };

  return {
    extraFilters: [favoriteLocationFilter, recentLocationFilter],
    extraFunctions: [favoriteLocationFuncScore, recentLocationFuncScore],
    aggregations: aggs,
    overwriteHits: true
  };
}
