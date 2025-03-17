"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticTransform = void 0;
const _ = __importStar(require("lodash/fp"));
const vietnam_1 = require("../format/vietnam");
class ElasticTransform {
    static createShouldClauses({ parsedText, shouldSearchEntrances }) {
        return _.flow([
            _.toPairs,
            _.map(([key, value]) => {
                var _a;
                let newKey;
                switch (key) {
                    case "region":
                    case "county":
                    case "locality":
                        newKey = `parent.${key}`;
                        break;
                    case "number":
                    case "street":
                        newKey = `address_parts.${key}`;
                        break;
                    case "address":
                        if (!parsedText.street)
                            newKey = "name.default";
                        break;
                    default:
                        return null;
                }
                if (!value || !newKey) {
                    return null;
                }
                if (newKey === "parent.locality") {
                    if (value.match(/(Phường)\s\D/))
                        value = value.replace("Phường ", "");
                }
                if (newKey === "parent.county") {
                    if (value.match(/(Quận)\s\D/))
                        value = value.replace("Quận ", "");
                }
                if (newKey === "address_parts.street" &&
                    ((_a = parsedText === null || parsedText === void 0 ? void 0 : parsedText.address) === null || _a === void 0 ? void 0 : _a.includes("Hà Nội"))) {
                    if (value.match(/^(Phố)\s\D/i))
                        value = value.replace("Phố ", "");
                }
                if (newKey === "address_parts.number") {
                    value = value.replace(/[^0-9]/g, " ");
                    value = value.replace(/\s+/g, " ");
                    value = value.trim();
                    const partCount = value.split(/\s+/).length;
                    if (!value) {
                        return null;
                    }
                    if (shouldSearchEntrances) {
                        return {
                            bool: {
                                should: [
                                    {
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
                                    },
                                    {
                                        nested: {
                                            path: "addendum.geometryBeta.entrances",
                                            query: {
                                                intervals: {
                                                    "addendum.geometryBeta.entrances.name.default": {
                                                        match: {
                                                            query: value,
                                                            ordered: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        };
                    }
                    else {
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
                        };
                    }
                }
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
    }
    static createQuery({ layer, parsedText, shouldSearchEntrances }) {
        const result = {
            bool: {
                must: [],
                should: ElasticTransform.createShouldClauses({ parsedText, shouldSearchEntrances }),
                minimum_should_match: "100%",
            },
        };
        if (layer != "") {
            result.bool.must.push({
                term: {
                    layer: layer,
                },
            });
        }
        if (parsedText.venue) {
            const venue_token_count = parsedText.venue.trim().split(/\s+/).length;
            const baseIntervals = {
                intervals: {
                    "name.default": {
                        match: {
                            query: parsedText.venue,
                            filter: {
                                script: {
                                    source: "interval.start >= 0 && interval.end < " +
                                        (venue_token_count + 4) +
                                        " && interval.gaps <= " +
                                        Math.max(venue_token_count - 1, 0),
                                },
                            },
                            ordered: true,
                        },
                    },
                },
            };
            if (shouldSearchEntrances) {
                result.bool.must.push({
                    bool: {
                        "should": [
                            baseIntervals,
                            {
                                nested: {
                                    path: "addendum.geometryBeta.entrances",
                                    query: {
                                        intervals: {
                                            "addendum.geometryBeta.entrances.name.default": {
                                                match: {
                                                    query: parsedText.venue,
                                                    ordered: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                });
            }
            else {
                result.bool.must.push(baseIntervals);
            }
        }
        return result;
    }
    static rescoreQuery({ query, venueName }) {
        return {
            function_score: {
                query: query,
                functions: [
                    {
                        script_score: {
                            script: {
                                source: "try {params._source.addendum.entrances.length() > 2 ? 1 : 0} catch (Exception e) {0}",
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
        };
    }
    static createSort({ sortScore, lat, lon }) {
        const result = [];
        if (sortScore) {
            result.push({
                _score: "desc",
            });
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
            });
        }
        if (result.length === 0) {
            result.push({
                _doc: "desc",
            });
        }
        return result;
    }
    static async createSearchBody({ text, size, lat, lon, countFunc, geocode, multiIndexOpts, }) {
        const formatted = text;
        const parsedText = (0, vietnam_1.extract)(formatted);
        const layer = parsedText.venue ? "venue" : "";
        if (!geocode) {
            parsedText.country = "";
            parsedText.county = "";
            parsedText.locality = "";
            parsedText.region = "";
        }
        let sortScore = true;
        let shouldSearchEntrances = false;
        if (multiIndexOpts && multiIndexOpts.searchEntrances) {
            shouldSearchEntrances = true;
        }
        let query = ElasticTransform.createQuery({ layer, parsedText, shouldSearchEntrances });
        if (multiIndexOpts) {
            if (multiIndexOpts.extraFilters) {
                query.bool.filter = query.bool.filter || [];
                query.bool.filter.push(...multiIndexOpts.extraFilters);
            }
        }
        const countResult = await countFunc({
            query: query,
        });
        if (parsedText.venue) {
            if (!countResult.terminated_early) {
                const venueName = parsedText.venue || "";
                query = ElasticTransform.rescoreQuery({ query, venueName });
            }
            else {
                sortScore = false;
            }
        }
        if (parsedText.number) {
            const score_exact_address_number = {
                script_score: {
                    script: {
                        source: "try { 100-params._source.address_parts.number.length() } catch (Exception e) {0}",
                    },
                },
            };
            if (query.function_score) {
                query.function_score.functions.push(score_exact_address_number);
            }
            else {
                query = {
                    function_score: {
                        query: query,
                        functions: [score_exact_address_number],
                        score_mode: "sum",
                        boost_mode: "replace",
                    },
                };
            }
        }
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
        const sort = ElasticTransform.createSort({ sortScore, lat, lon });
        if (multiIndexOpts && multiIndexOpts.overwriteHits) {
            size = 0;
        }
        const body = {
            query: query,
            size: size,
            track_scores: true,
            sort: sort,
        };
        if (multiIndexOpts && multiIndexOpts.aggregations) {
            body["aggs"] = buildMultiIndexAggregations(multiIndexOpts.aggregations, sort);
        }
        if (multiIndexOpts && multiIndexOpts.debug) {
            console.log("Query body", JSON.stringify(body, null, 2));
        }
        return {
            body,
            formatted,
            parsedText,
            layer,
        };
    }
    static createNearByBody(params) {
        var _a, _b;
        const size = (_a = params.size) !== null && _a !== void 0 ? _a : "10";
        const nearByBody = {
            query: {
                bool: {
                    filter: {
                        geo_distance: {
                            distance: (_b = params["boundary.circle.radius"]) !== null && _b !== void 0 ? _b : "50m",
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
}
exports.ElasticTransform = ElasticTransform;
function buildMultiIndexAggregations(aggregations, sort) {
    const aggs = {};
    if (!aggregations) {
        return aggs;
    }
    for (const [aggName, aggConfig] of Object.entries(aggregations)) {
        if (!aggConfig)
            continue;
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
        };
    }
    return aggs;
}
//# sourceMappingURL=elastic.transform.js.map