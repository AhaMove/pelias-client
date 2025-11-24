import _ from "lodash/fp.js";
import deaccents from "../format/vietnam/deaccents.js";
import { extract } from "../format/vietnam/extract.js";
import { NearbyParams } from "../resources/nearby.params.js";
import {
  CreateQuery,
  CreateSearchBody,
  CreateShouldClauses,
  CreateSort,
  ElasticBoolQuery,
  ElasticFunctionScoreQuery,
  ElasticQuery,
  GeocodeParams,
  MultiIndexAggregationConfig,
  MultiIndexOptions,
  RescoreFunction,
  RescoreQuery,
} from "../types/elastic.types.js";

export class ElasticTransform {
  static createShouldClauses({ parsedText, formatted }: CreateShouldClauses) {
    const componentClauses = _.flow([
      _.toPairs,
      _.map(([key, value]: [string, string]) => {
        let newKey;
        switch (key) {
          case "region":
          case "county":
          case "locality":
            newKey = `parent.${key}`;
            break;
          // case "number":
          // case "street":
          //   newKey = `address_parts.${key}`
          //   break
          // case "address":
          //   return null
          default:
            return null;
        }

        if (!value || !newKey) {
          return null;
        }

        if (newKey === "parent.locality") {
          if (value.match(/(Phường)\s\D/)) value = value.replace("Phường ", "");
        }
        if (newKey === "parent.county") {
          if (value.match(/(Quận)\s\D/)) value = value.replace("Quận ", "");
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
        };
      }),
      _.filter((value) => !!value),
    ])(parsedText);

    // Always add a name.default search clause
    const nameDefaultClause = {
      intervals: {
        "name.default": {
          match: {
            query: formatted,
            ordered: true,
            max_gaps: 1,
          },
        },
      },
    };

    const entrancesClause = {
      nested: {
        path: "addendum.geometry.entrances",
        // currently favorite_location and recent_location don't have addendum.geometry.entrances field
        ignore_unmapped: true,
        query: {
          intervals: {
            "addendum.geometry.entrances.name": {
              match: {
                query: formatted,
                ordered: true,
              },
            },
          },
        },
      },
    };

    return [nameDefaultClause, entrancesClause, ...componentClauses];
  }

  static createQuery({ parsedText, formatted }: CreateQuery): ElasticBoolQuery {
    const result: ElasticBoolQuery = {
      bool: {
        must: [],
        should: ElasticTransform.createShouldClauses({ parsedText, formatted }),
        minimum_should_match: "50%",
      },
    };
    if (parsedText.number) {
      result.bool.must.push({
        regexp: {
          "address_parts.number.keyword": {
            value: `${parsedText.number}([\\/\\-].*)?`,
            flags: "ALL",
          },
        },
      });
    }

    if (parsedText.venue) {
      const shouldClauses: Array<Record<string, unknown>> = [
        {
          intervals: {
            "name.default": {
              match: {
                query: parsedText.venue,
                max_gaps: 1,
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
      ];
      result.bool.should.push(...shouldClauses);
      result.bool.minimum_should_match = 1;
    }
    return result;
  }

  static rescoreQuery({ query, venueName, parsedText }: RescoreQuery): ElasticFunctionScoreQuery {
    const functions: RescoreFunction[] = [
      {
        script_score: {
          script: {
            source:
              "try { return params._source.addendum.containsKey('geometry') ? 10 : 0; } catch (Exception e) { return 0; }",
          },
        },
      },
    ];

    functions.push({
      script_score: {
        script: {
          source: `
              try {
                String searchTerm = params.venueName;
                if (searchTerm == null || searchTerm.isEmpty()) {
                  return 0;
                }

                // Check name.normalized for prefix match (highest score) or substring match
                if (params._source.containsKey('name') && params._source.name.containsKey('normalized')) {
                  String normalizedMainName = params._source.name.normalized;
                  if (normalizedMainName != null && !normalizedMainName.isEmpty()) {
                    // Prefix match gets higher score
                    if (normalizedMainName.indexOf(searchTerm) == 0) {
                      return 15;
                    }
                    // Substring match gets lower score
                    else if (normalizedMainName.indexOf(searchTerm) >= 0) {
                      return 10;
                    }
                  }
                }

                // Check if any entrance normalized name contains the search term
                if (params._source.containsKey('addendum') &&
                    params._source.addendum.containsKey('geometry') &&
                    params._source.addendum.geometry.containsKey('entrances')) {

                  def entrances = params._source.addendum.geometry.entrances;
                  if (entrances instanceof List) {
                    for (def entrance : entrances) {
                      if (entrance.containsKey('normalized')) {
                        String normalizedEntranceName = entrance.normalized.toLowerCase();
                        if (normalizedEntranceName != null && !normalizedEntranceName.isEmpty() && normalizedEntranceName.indexOf(searchTerm) >= 0) {
                          return 10;
                        }
                      }
                    }
                  }
                }

                return 0;
              } catch (Exception e) {
                return 0;
              }
            `,
          params: {
            venueName: deaccents(venueName.toLowerCase() || parsedText?.address?.toLowerCase() || ""),
          },
        },
      },
    });

    return {
      function_score: {
        query: query,
        functions,
        score_mode: "sum",
        boost_mode: "replace",
      },
    };
  }

  static createSort({ sortScore: _sortScore, lat, lon }: CreateSort) {
    const result: Array<Record<string, unknown>> = [
      {
        _score: "desc",
      },
    ];

    // if (sortScore) {
    //   result.push({
    //     _score: "desc",
    //   })
    // }

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
      });
    }

    // if result is empty array, we default to sort by index order
    if (result.length === 0) {
      result.push({
        _doc: "desc",
      });
    }

    return result;
  }

  static async createSearchBody({
    text,
    size,
    lat,
    lon,
    countFunc,
    geocode = false,
    userId,
  }: CreateSearchBody) {
    // const formatted = format(text)
    const formatted = text.trim().replace(/\s{2,}/g, " ");
    const parsedText = extract(formatted);
    const layer = parsedText.venue ? "venue" : "";
    // if not geocode, ignore admin parts
    if (!geocode) {
      parsedText.country = "";
      parsedText.county = "";
      parsedText.locality = "";
      parsedText.region = "";
    }
    let sortScore = true;

    const multiIndexOpts = userId ? buildMultiIndexSearchOpts(userId) : null;
    // create query
    let query: ElasticQuery = ElasticTransform.createQuery({ parsedText, formatted });
    // if multiIndexOpts is provided, add extra filters
    if (multiIndexOpts?.extraFilters && "bool" in query) {
      query.bool.filter = query.bool.filter || [];
      query.bool.filter.push(...multiIndexOpts.extraFilters);
    }
    // count the number of records that match the query. If return terminated_early == true, we won't recalculate the score
    const countResult = await countFunc({
      query: query,
    });

    if (!countResult.terminated_early) {
      const venueName = parsedText.venue || "";
      query = ElasticTransform.rescoreQuery({ query, venueName, parsedText });
    } else {
      sortScore = false;
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
    if (multiIndexOpts?.extraFunctions) {
      if (!("function_score" in query)) {
        query = {
          function_score: {
            query: query,
            functions: [],
          },
        };
      }
      query.function_score.functions = query.function_score.functions || [];
      query.function_score.functions.push(...multiIndexOpts.extraFunctions);
    }

    // Add distance-based scoring when coordinates are available
    if (lat !== undefined && lon !== undefined && "function_score" in query) {
      const nearbyDistanceScore = [
        {
          filter: {
            geo_distance: {
              distance: "30km",
              center_point: { lat, lon },
            },
          },
          weight: 25,
        },
        {
          filter: { match_all: {} },
          weight: 10,
          gauss: {
            center_point: {
              origin: { lat, lon },
              scale: "3km",
              offset: "0km",
              decay: 0.1,
            },
          },
        },
      ];

      query.function_score.functions.push(...nearbyDistanceScore);
    }

    const sort = ElasticTransform.createSort({ sortScore, lat, lon });
    if (multiIndexOpts && multiIndexOpts.overwriteHits) {
      size = 0;
    }

    // Create script field for sorted entrances (matching entrances first)
    const sortedEntrancesScript = {
      script: {
        source: `
        try {
          // Early exit for non-pelias indices
          if (params._index == 'favorite_location' || params._index == 'recent_location') {
            return [];
          }

          // Validate entrances exist
          if (!params._source.containsKey('addendum') ||
              !params._source.addendum.containsKey('geometry') ||
              !params._source.addendum.geometry.containsKey('entrances')) {
            return [];
          }

          def entrances = params._source.addendum.geometry.entrances;
          if (!(entrances instanceof List) || entrances.isEmpty()) {
            return [];
          }

          // Early exit if no search term
          String searchTerm = params.searchTerm.toLowerCase().trim();
          if (searchTerm.isEmpty()) {
            return entrances;
          }

          // Tokenize search term once
          def searchTokens = [];
          if (searchTerm.contains(' ')) {
            def parts = searchTerm.splitOnToken(' ');
            for (def part : parts) {
              String trimmedPart = part.trim();
              if (!trimmedPart.isEmpty()) {
                searchTokens.add(trimmedPart);
              }
            }
          } else {
            searchTokens.add(searchTerm);
          }

          int searchSize = searchTokens.size();

          // Create scored entrance list with index tracking
          def scoredEntrances = [];

          for (int idx = 0; idx < entrances.size(); idx++) {
            def entrance = entrances[idx];

            if (!entrance.containsKey('name')) {
              // Entrance without name - no match, score 0
              scoredEntrances.add(['index': idx, 'score': 0.0, 'matched': 0]);
              continue;
            }

            String entranceName = entrance.name.toLowerCase();

            // Tokenize entrance name
            def entranceWords = [];
            if (entranceName.contains(' ')) {
              def parts = entranceName.splitOnToken(' ');
              for (def part : parts) {
                String trimmedPart = part.trim();
                if (!trimmedPart.isEmpty()) {
                  entranceWords.add(trimmedPart);
                }
              }
            } else {
              entranceWords.add(entranceName);
            }

            // Find all token matches with positions
            def allTokenMatches = [];
            for (int i = 0; i < searchSize; i++) {
              String searchToken = searchTokens[i];
              def tokenPositions = [];

              for (int j = 0; j < entranceWords.size(); j++) {
                if (entranceWords[j].contains(searchToken)) {
                  tokenPositions.add(j);
                }
              }

              if (!tokenPositions.isEmpty()) {
                allTokenMatches.add(tokenPositions);
              }
            }

            int matchedTokens = allTokenMatches.size();

            if (matchedTokens == 0) {
              scoredEntrances.add(['index': idx, 'score': 0.0, 'matched': 0]);
              continue;
            }

            // Calculate best proximity score based on matched tokens
            double proximityScore = 0.0;

            if (matchedTokens == 1) {
              proximityScore = 1.0;
            } else if (matchedTokens == 2) {
              def firstOptions = allTokenMatches[0];
              def secondOptions = allTokenMatches[1];
              double bestDist = 0.0;

              for (def pos1 : firstOptions) {
                for (def pos2 : secondOptions) {
                  int dist = (pos2 > pos1) ? (pos2 - pos1) : (pos1 - pos2);
                  double distScore = (dist == 1) ? 4.0 : (dist == 2) ? 2.5 : (dist <= 4) ? 1.5 : 0.5;
                  if (distScore > bestDist) {
                    bestDist = distScore;
                  }
                }
              }
              proximityScore = bestDist;
            } else if (matchedTokens == 3) {
              def firstOptions = allTokenMatches[0];
              def secondOptions = allTokenMatches[1];
              def thirdOptions = allTokenMatches[2];
              double bestAvg = 0.0;

              for (def pos1 : firstOptions) {
                for (def pos2 : secondOptions) {
                  for (def pos3 : thirdOptions) {
                    // Sort positions
                    def positions = [pos1, pos2, pos3];
                    positions.sort();

                    // Calculate average proximity
                    int dist1 = positions[1] - positions[0];
                    int dist2 = positions[2] - positions[1];

                    double score1 = (dist1 == 1) ? 4.0 : (dist1 == 2) ? 2.5 : (dist1 <= 4) ? 1.5 : 0.5;
                    double score2 = (dist2 == 1) ? 4.0 : (dist2 == 2) ? 2.5 : (dist2 <= 4) ? 1.5 : 0.5;

                    double avgScore = (score1 + score2) / 2.0;
                    if (dist1 == 1 && dist2 == 1) {
                      avgScore += 1.0; // Consecutive bonus
                    }

                    if (avgScore > bestAvg) {
                      bestAvg = avgScore;
                    }
                  }
                }
              }
              proximityScore = bestAvg;
            } else {
              proximityScore = 1.0;
            }

            // Calculate final score: full match gets pure proximity, partial gets combined
            double finalScore;
            if (matchedTokens == searchSize) {
              finalScore = 1000.0 + proximityScore; // Full match bucket
            } else {
              finalScore = (double)matchedTokens + (proximityScore * 0.5); // Partial match bucket
            }

            scoredEntrances.add(['index': idx, 'score': finalScore, 'matched': matchedTokens]);
          }

          // Sort by score descending (higher scores first)
          scoredEntrances.sort((a, b) -> Double.compare((double)b['score'], (double)a['score']));

          // Build result using original entrance objects in sorted order
          def result = [];
          for (def scored : scoredEntrances) {
            result.add(entrances[(int)scored['index']]);
          }

          return result;

        } catch (Exception e) {
          return [];
        }
        `,
        params: {
          searchTerm: parsedText.venue?.toLowerCase() || parsedText.address?.toLowerCase() || "",
        },
      },
    };

    const body: Record<string, unknown> = {
      query: query,
      size: size,
      track_scores: true,
      sort: sort,
      _source: true,
    };

    // Add script field for sorted entrances if we have a search term
    let scriptFields: Record<string, unknown> | undefined;
    if (parsedText.venue || parsedText.address) {
      scriptFields = {
        sorted_entrances: sortedEntrancesScript,
      };
      body.script_fields = scriptFields;
    }

    if (multiIndexOpts && multiIndexOpts.aggregations) {
      body["aggs"] = buildMultiIndexAggregations(multiIndexOpts.aggregations, sort, scriptFields);
    }

    return {
      body,
      formatted,
      parsedText,
      layer,
      multiIndexOpts,
    };
  }

  static createNearByBody(params: NearbyParams) {
    const size = params.size ?? "10";
    const nearByBody: {
      query: {
        bool: {
          filter: Record<string, unknown>;
          must: Array<Record<string, unknown>>;
        };
      };
      size: number;
      sort: Record<string, unknown>;
    } = {
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
    };

    if (params.sources) {
      nearByBody.query.bool.must.push({
        terms: {
          source: params.sources.split(","),
        },
      });
    }

    if (params.layers) {
      nearByBody.query.bool.must.push({
        terms: {
          layer: params.layers.split(","),
        },
      });
    }

    return nearByBody;
  }

  static createGeocodeBody(params: GeocodeParams): Record<string, unknown> {
    const { text, addressParts } = params;
    const { venue, number, street } = extract(text);

    const mustClauses: Array<Record<string, unknown>> = [];

    if (venue) {
      mustClauses.push({
        bool: {
          must: [
            {
              match_phrase: {
                "name.default": {
                  query: venue,
                  slop: 1,
                },
              },
            },
            {
              term: {
                layer: "venue",
              },
            },
          ],
        },
      });
    } else {
      mustClauses.push({
        match_phrase: {
          "name.default": {
            query: text,
          },
        },
      });
    }

    // Add address number matching with intervals
    if (number) {
      mustClauses.push({
        match_phrase: {
          "address_parts.number": {
            query: number,
          },
        },
      });
    }

    // Add street name matching
    if (street) {
      mustClauses.push({
        match_phrase: {
          "address_parts.street": {
            query: street,
          },
        },
      });
    }

    // Add admin region matching
    if (addressParts?.region) {
      mustClauses.push({
        match_phrase: {
          "parent.region": {
            query: addressParts.region,
          },
        },
      });
    }

    if (addressParts?.county) {
      let countyQuery = addressParts.county;

      // Map old districts to Thu Duc City
      const thuDucRegex =
        /(Quận\s*2|Q\.?\s*2|Quan\s*2|Quận\s*9|Q\.?\s*9|Quan\s*9|Quận\s*Thủ\s*Đức|Q\.?\s*T\.?\s*D|Q\.?\s*TD|QTD|Q\s*Thu\s*Duc|Q\s*Thủ\s*Đức|Quan\s*Thu\s*Duc|Quan\s*Thủ\s*Đức|Thủ\s*Đức|Thu\s*Duc)/i;
      if (countyQuery.match(thuDucRegex)) {
        countyQuery = "Thành Phố Thủ Đức";
      }

      mustClauses.push({
        match_phrase: {
          "parent.county": {
            query: countyQuery,
          },
        },
      });
    }

    // Add admin locality matching
    if (addressParts?.locality) {
      mustClauses.push({
        match_phrase: {
          "parent.locality": {
            query: addressParts.locality,
          },
        },
      });
    }

    return {
      query: {
        bool: {
          must: mustClauses,
        },
      },
      size: 1,
    };
  }
}

function buildMultiIndexAggregations(
  aggregations: Record<string, MultiIndexAggregationConfig> | null,
  sort: Array<Record<string, unknown>>,
  scriptFields?: Record<string, unknown>,
) {
  // Initialize empty aggregations object
  const aggs: Record<string, unknown> = {};
  // Return empty object if aggregations is null
  if (!aggregations) {
    return aggs;
  }
  // Loop through each aggregation configuration
  for (const [aggName, aggConfig] of Object.entries(aggregations)) {
    // Skip if configuration is empty
    if (!aggConfig) continue;

    const topHitsConfig: Record<string, unknown> = {
      size: aggConfig.size,
      track_scores: true,
      sort: sort,
      _source: true,
    };

    // Add script fields if provided
    if (scriptFields && aggName === "pelias") {
      topHitsConfig.script_fields = scriptFields;
    }

    aggs[aggName] = {
      filter: aggConfig.filter,
      aggs: {
        top_hits: {
          top_hits: topHitsConfig,
        },
      },
    };
  }
  return aggs;
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
              { bool: { must_not: [{ term: { user_id: userId } }] } },
            ],
          },
        },
      ],
    },
  };

  const recentLocationFilter = {
    bool: {
      must_not: [
        {
          bool: {
            must: [
              { term: { _index: "recent_location" } },
              { bool: { must_not: [{ term: { user_id: userId } }] } },
            ],
          },
        },
      ],
    },
  };

  // Function scores for boosting
  const favoriteLocationFuncScore = {
    filter: { term: { _index: "favorite_location" } },
    weight: 60,
  };

  const recentLocationFuncScore = {
    filter: { term: { _index: "recent_location" } },
    weight: 30,
  };

  // Aggregations
  const aggs = {
    favorite_location: {
      filter: { term: { _index: "favorite_location" } },
      size: 2,
    },
    recent_location: {
      filter: { term: { _index: "recent_location" } },
      size: 2,
    },
    pelias: {
      filter: {
        bool: {
          must_not: [
            {
              terms: {
                _index: ["favorite_location", "recent_location"], // exclude both aliases
              },
            },
          ],
        },
      },
      size: 10,
    },
  };

  return {
    extraFilters: [favoriteLocationFilter, recentLocationFilter],
    extraFunctions: [favoriteLocationFuncScore, recentLocationFuncScore],
    aggregations: aggs,
    overwriteHits: true,
  };
}
