import * as _ from "lodash/fp";
import { extract } from "src/format/vietnam";
import { AddressParts } from "src/models/address-parts.model";
import { CountModel } from "src/models/count.model";
import { NearbyParams } from "src/resources/nearby.params";

import deaccents from "../format/vietnam/deaccents.js";

export interface MultiIndexOptions {
  extraFilters?: Array<any>;
  extraFunctions?: Array<any>;
  aggregations?: Record<string, MultiIndexAggregationConfig> | null;
  overwriteHits?: boolean;
}

export interface MultiIndexAggregationConfig {
  filter: any;
  size: number;
}

interface CreateSearchBody {
  text: string;
  size: number;
  lat?: number;
  lon?: number;
  countFunc: (queryBody: Record<string, any>) => Promise<CountModel>;
  geocode: boolean;
  multiIndexOpts?: MultiIndexOptions | null;
  userId: string;
}

interface CreateShouldClauses {
  parsedText: AddressParts;
  formatted: string;
}

interface CreateQuery {
  parsedText: AddressParts;
  formatted: string;
}

interface RescoreQuery {
  query: Record<string, any>;
  venueName: string;
  parsedText: AddressParts;
}

interface CreateSort {
  sortScore: boolean;
  lat?: number;
  lon?: number;
}

interface RescoreFunction {
  script_score: {
    script: {
      source: string;
      params?: Record<string, any>;
    };
  };
}

interface GeocodeParams {
  text: string;
  addressParts?: {
    number?: string;
    street?: string;
    region?: string;
    locality?: string;
    county?: string;
  };
}

const VIETNAMESE_DEACCENT_FUNCTION = `
  String removeVietnameseAccents(String text, boolean isLowercase) {
    if (text == null || text.isEmpty()) {
      return text;
    }

    Map accentMap = [
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
      'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
      'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
      'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
      'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
      'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
      'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'đ': 'd',
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
      'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
      'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
      'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
      'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
      'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
      'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'Đ': 'D'
    ];

    StringBuilder result = new StringBuilder();
    for (int i = 0; i < text.length(); i++) {
      String character = text.substring(i, i + 1);
      def replacement = accentMap.get(character);
      result.append(replacement != null ? replacement : character);
    }
    if (isLowercase) {
      return result.toString().toLowerCase();
    }
    return result.toString();
  }
`;

export class ElasticTransform {
  static createShouldClauses({ parsedText, formatted }: CreateShouldClauses) {
    const componentClauses = _.flow([
      _.toPairs,
      _.map(([key, value]: [string, any]) => {
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

  static createQuery({ parsedText, formatted }: CreateQuery): Record<string, any> {
    const result: any = {
      bool: {
        must: [],
        should: ElasticTransform.createShouldClauses({ parsedText, formatted }),
        minimum_should_match: "50%",
      },
    };
    if (parsedText.number) {
      result.bool.must.push({
        match_phrase: {
          "address_parts.number": {
            query: parsedText.number,
          },
        },
      });
    }

    if (parsedText.venue) {
      const shouldClauses: any = [
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

  static rescoreQuery({ query, venueName, parsedText }: RescoreQuery): Record<string, any> {
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
              ${VIETNAMESE_DEACCENT_FUNCTION}
              try {
                String searchTerm = params.venueName;
                if (searchTerm == null || searchTerm.isEmpty()) {
                  return 0;
                }

                // Check name.default for prefix match (highest score) or substring match
                if (params._source.containsKey('name') && params._source.name.containsKey('default')) {
                  String deaccentedMainName = removeVietnameseAccents(params._source.name.default, true);

                  // Prefix match gets higher score
                  if (deaccentedMainName.indexOf(searchTerm) == 0) {
                    return 15;
                  }
                  // Substring match gets lower score
                  else if (deaccentedMainName.indexOf(searchTerm) >= 0) {
                    return 10;
                  }
                }

                // Check if any entrance name contains the search term
                if (params._source.containsKey('addendum') &&
                    params._source.addendum.containsKey('geometry') &&
                    params._source.addendum.geometry.containsKey('entrances')) {

                  def entrances = params._source.addendum.geometry.entrances;
                  if (entrances instanceof List) {
                    for (def entrance : entrances) {
                      if (entrance.containsKey('name')) {
                        String deaccentedEntranceName = removeVietnameseAccents(entrance.name, true);
                        if (deaccentedEntranceName.indexOf(searchTerm) >= 0) {
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
    const result: any = [
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
    let query = ElasticTransform.createQuery({ parsedText, formatted });
    // if multiIndexOpts is provided, add extra filters
    if (multiIndexOpts) {
      if (multiIndexOpts.extraFilters) {
        query.bool.filter = query.bool.filter || [];
        query.bool.filter.push(...multiIndexOpts.extraFilters);
      }
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
    if (multiIndexOpts && multiIndexOpts.extraFunctions) {
      if (!query.function_score) {
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
    if (lat !== undefined && lon !== undefined && query.function_score) {
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
          if (params._index == 'favorite_location' || params._index == 'recent_location') {
            return [];
          }

          if (!params._source.containsKey('addendum') || 
              !params._source.addendum.containsKey('geometry') || 
              !params._source.addendum.geometry.containsKey('entrances')) {
            return [];
          }
          
          def entrances = params._source.addendum.geometry.entrances;
          if (!(entrances instanceof List) || entrances.isEmpty()) {
            return [];
          }
          
          String searchTerm = params.searchTerm.toLowerCase().trim();
          if (searchTerm.isEmpty()) {
            return entrances;
          }
          
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
          
          def fullMatchEntrances = [];
          def partialMatchEntrances = [];  
          def noMatchEntrances = [];
          
          for (def entrance : entrances) {
            if (entrance.containsKey('name')) {
              String entranceName = entrance.name.toLowerCase();
              
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
              
              def allTokenMatches = [];
              for (int i = 0; i < searchTokens.size(); i++) {
                String searchToken = searchTokens[i];
                def tokenPositions = [];
                
                for (int j = 0; j < entranceWords.size(); j++) {
                  String entranceWord = entranceWords[j];
                  if (entranceWord.contains(searchToken)) {
                    def matchInfo = [:];
                    matchInfo['searchIndex'] = i;
                    matchInfo['entranceIndex'] = j;
                    matchInfo['token'] = searchToken;
                    matchInfo['word'] = entranceWord;
                    tokenPositions.add(matchInfo);
                  }
                }
                
                if (!tokenPositions.isEmpty()) {
                  allTokenMatches.add(tokenPositions);
                }
              }
              
              def entranceCopy = [:];
              for (def key : entrance.keySet()) {
                entranceCopy[key] = entrance[key];
              }
              
              int matchedTokens = allTokenMatches.size();
              
              if (matchedTokens == 0) {
                noMatchEntrances.add(entranceCopy);
                continue;
              }
              
              def bestCombination = [];
              double bestScore = -1.0;
              
              if (allTokenMatches.size() == 1) {
                bestCombination = [allTokenMatches[0][0]];
                bestScore = 1.0;
              } else if (allTokenMatches.size() == 2) {
                def firstTokenOptions = allTokenMatches[0];
                def secondTokenOptions = allTokenMatches[1];
                
                for (def first : firstTokenOptions) {
                  for (def second : secondTokenOptions) {
                    def combination = [first, second];
                    
                    combination.sort((a, b) -> {
                      int posA = (int)a['entranceIndex'];
                      int posB = (int)b['entranceIndex'];
                      return posA - posB;
                    });
                    
                    int pos1 = (int)combination[0]['entranceIndex'];
                    int pos2 = (int)combination[1]['entranceIndex'];
                    
                    int distance = pos2 - pos1;
                    if (distance < 0) {
                      distance = -distance;
                    }
                    
                    double score = 1.0;
                    if (distance == 1) {
                      score = 4.0;
                    } else if (distance == 2) {
                      score = 2.5;
                    } else if (distance <= 4) {
                      score = 1.5;
                    } else {
                      score = 0.5;
                    }
                    
                    if (score > bestScore) {
                      bestScore = score;
                      bestCombination = [first, second];
                    }
                  }
                }
              } else if (allTokenMatches.size() == 3) {
                def firstTokenOptions = allTokenMatches[0];
                def secondTokenOptions = allTokenMatches[1];
                def thirdTokenOptions = allTokenMatches[2];
                
                for (def first : firstTokenOptions) {
                  for (def second : secondTokenOptions) {
                    for (def third : thirdTokenOptions) {
                      def combination = [first, second, third];
                      
                      combination.sort((a, b) -> {
                        int posA = (int)a['entranceIndex'];
                        int posB = (int)b['entranceIndex'];
                        return posA - posB;
                      });
                      
                      double totalScore = 0.0;
                      int consecutiveBonus = 0;
                      
                      for (int k = 0; k < combination.size() - 1; k++) {
                        int pos1 = (int)combination[k]['entranceIndex'];
                        int pos2 = (int)combination[k + 1]['entranceIndex'];
                        int distance = pos2 - pos1;
                        
                        if (distance == 1) {
                          totalScore += 4.0;
                          consecutiveBonus++;
                        } else if (distance == 2) {
                          totalScore += 2.5;
                        } else if (distance <= 4) {
                          totalScore += 1.5;
                        } else {
                          totalScore += 0.5;
                        }
                      }
                      
                      if (consecutiveBonus > 0) {
                        totalScore += consecutiveBonus * 1.0;
                      }
                      
                      int pairCount = combination.size() - 1;
                      if (pairCount < 1) {
                        pairCount = 1;
                      }
                      double score = totalScore / pairCount;
                      
                      if (score > bestScore) {
                        bestScore = score;
                        bestCombination = [first, second, third];
                      }
                    }
                  }
                }
              } else {
                for (def tokenOptions : allTokenMatches) {
                  bestCombination.add(tokenOptions[0]);
                }
                bestScore = 1.0;
              }
              
              if (matchedTokens == searchTokens.size()) {
                entranceCopy['_proximityScore'] = bestScore;
                fullMatchEntrances.add(entranceCopy);
              } else {
                double combinedScore = matchedTokens + (bestScore * 0.5);
                entranceCopy['_combinedScore'] = combinedScore;
                partialMatchEntrances.add(entranceCopy);
              }
            } else {
              def entranceCopy = [:];
              for (def key : entrance.keySet()) {
                entranceCopy[key] = entrance[key];
              }
              noMatchEntrances.add(entranceCopy);
            }
          }
          
          if (!fullMatchEntrances.isEmpty()) {
            fullMatchEntrances.sort((a, b) -> {
              double scoreA = a.containsKey('_proximityScore') ? (double)a['_proximityScore'] : 0.0;
              double scoreB = b.containsKey('_proximityScore') ? (double)b['_proximityScore'] : 0.0;
              return Double.compare(scoreB, scoreA);
            });

            for (def entrance : fullMatchEntrances) {
              if (entrance.containsKey('_proximityScore')) {
                entrance.remove('_proximityScore');
              }
            }
          }
          
          if (!partialMatchEntrances.isEmpty()) {
            partialMatchEntrances.sort((a, b) -> {
              double scoreA = a.containsKey('_combinedScore') ? (double)a['_combinedScore'] : 0.0;
              double scoreB = b.containsKey('_combinedScore') ? (double)b['_combinedScore'] : 0.0;
              return Double.compare(scoreB, scoreA);
            });
            
            for (def entrance : partialMatchEntrances) {
              if (entrance.containsKey('_combinedScore')) {
                entrance.remove('_combinedScore');
              }
            }
          }
          
          def result = [];
          result.addAll(fullMatchEntrances);
          result.addAll(partialMatchEntrances);
          result.addAll(noMatchEntrances);
          
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

    const body: Record<string, any> = {
      query: query,
      size: size,
      track_scores: true,
      sort: sort,
      _source: true,
    };

    // Add script field for sorted entrances if we have a search term
    let scriptFields: Record<string, any> | undefined;
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

  static createGeocodeBody(params: GeocodeParams): Record<string, any> {
    const { text, addressParts } = params;
    const { venue, number, street } = extract(text);

    const mustClauses: Record<string, any>[] = [];

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
  sort: any,
  scriptFields?: Record<string, any>
) {
  // Initialize empty aggregations object
  const aggs: Record<string, any> = {};
  // Return empty object if aggregations is null
  if (!aggregations) {
    return aggs;
  }
  // Loop through each aggregation configuration
  for (const [aggName, aggConfig] of Object.entries(aggregations)) {
    // Skip if configuration is empty
    if (!aggConfig) continue;

    const topHitsConfig: any = {
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
