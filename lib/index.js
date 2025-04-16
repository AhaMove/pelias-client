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
exports.PeliasClient = void 0;
exports.formatAddress = formatAddress;
exports.extractAddress = extractAddress;
const elastic_transform_1 = require("./transforms/elastic.transform");
const pelias_transform_1 = require("./transforms/pelias.transform");
const vietnam_1 = require("./format/vietnam");
const crypto = __importStar(require("crypto"));
const document_transform_1 = require("./transforms/document.transform");
const elasticsearch_1 = require("@elastic/elasticsearch");
class PeliasClient {
    constructor(params) {
        this.format = vietnam_1.format;
        this.extract = vietnam_1.extract;
        this.esClient = new elasticsearch_1.Client(params);
        if (params.format) {
            this.format = params.format;
        }
        if (params.extract) {
            this.extract = params.extract;
        }
    }
    ping(params) {
        return this.esClient.ping(params);
    }
    structured(text) {
        const formatted = (0, vietnam_1.format)(text);
        const parsedText = (0, vietnam_1.extract)(formatted);
        const layer = !parsedText.street ? "venue" : undefined;
        return Object.assign(Object.assign({}, parsedText), { formatted,
            layer });
    }
    async search(params, geocode, adminMatch, alias, multiIndexOpts) {
        if (!alias) {
            alias = "pelias";
        }
        const { text, size = 10, count_terminate_after = 500 } = params;
        const countFunc = async (queryBody) => {
            const result = await this.esClient.count({
                index: alias,
                terminate_after: count_terminate_after,
                body: queryBody,
            });
            return result.body;
        };
        const { body, formatted, parsedText, layer } = await elastic_transform_1.ElasticTransform.createSearchBody({
            text,
            size: size,
            lat: params["focus.point.lat"]
                ? parseFloat(params["focus.point.lat"])
                : undefined,
            lon: params["focus.point.lon"]
                ? parseFloat(params["focus.point.lon"])
                : undefined,
            countFunc,
            geocode,
            multiIndexOpts: multiIndexOpts,
        });
        const result = await this.esClient.search({
            index: alias,
            body,
        });
        let hits = result.body.hits.hits;
        if (multiIndexOpts && multiIndexOpts.overwriteHits) {
            const aggregations = result.body.aggregations;
            hits = [];
            for (const key in aggregations) {
                const bucket = aggregations[key];
                if (bucket.top_hits) {
                    const topHits = bucket.top_hits.hits.hits;
                    for (const hit of topHits) {
                        hits.push(hit);
                    }
                }
            }
            hits.sort((a, b) => {
                return b._score - a._score;
            });
        }
        const adminAreas = adminMatch
            ? {
                county: parsedText.county,
                locality: parsedText.locality,
            }
            : undefined;
        const data = pelias_transform_1.PeliasTransform.filterHits(hits, geocode, adminAreas);
        const points = {
            "focus.point.lon": parseFloat(params["focus.point.lon"] || "0"),
            "focus.point.lat": parseFloat(params["focus.point.lat"] || "0"),
        };
        return {
            geocoding: {
                version: "0.1",
                query: Object.assign({ text, size: hits.length, querySize: size, parser: "pelias", parsed_text: parsedText, formatted,
                    layer }, points),
            },
            type: "FeatureCollection",
            features: pelias_transform_1.PeliasTransform.toFeatures(data, {
                points: Object.values(points),
            }),
        };
    }
    async findByIds(ids) {
        const result = await this.esClient.search({
            index: "pelias",
            body: {
                query: {
                    constant_score: {
                        filter: {
                            bool: {
                                should: [
                                    {
                                        terms: {
                                            _id: ids.split(","),
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        });
        const hits = result.body.hits.hits;
        const data = pelias_transform_1.PeliasTransform.filterHits(hits);
        return {
            geocoding: {
                version: "0.1",
            },
            type: "FeatureCollection",
            features: pelias_transform_1.PeliasTransform.toFeatures(data),
        };
    }
    async nearBy(params, geocode) {
        const result = await this.esClient.search({
            index: "pelias",
            body: elastic_transform_1.ElasticTransform.createNearByBody(params),
        });
        const hits = result.body.hits.hits;
        const data = pelias_transform_1.PeliasTransform.filterHits(hits, geocode);
        return {
            geocoding: {
                version: "0.1",
            },
            type: "FeatureCollection",
            features: pelias_transform_1.PeliasTransform.toFeatures(data),
        };
    }
    create(params) {
        const idData = params.name.default + params.center_point.lat + params.center_point.lon;
        const sourceId = crypto.createHash("md5").update(idData).digest("hex");
        const id = [params.source, params.layer, sourceId].join(":");
        return this.esClient.create({
            id,
            index: "pelias",
            type: "_doc",
            body: params,
        });
    }
    delete(id) {
        return this.esClient.delete({
            id,
            index: "pelias",
            type: "_doc",
        });
    }
    update(id, params) {
        return this.esClient.update({
            id,
            index: "pelias",
            type: "_doc",
            body: {
                doc: document_transform_1.DocumentTransform.docBuilder(params),
            },
        });
    }
    async searchByName(params) {
        const body = {
            query: {
                bool: {
                    filter: [
                        {
                            intervals: {
                                "name.default": {
                                    match: {
                                        query: params.text,
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
                    ],
                },
            },
            size: params.size || 1,
            sort: [
                {
                    _doc: "desc",
                },
            ],
        };
        if (params.lat && params.lon) {
            body.query.bool.filter.push({
                geo_distance: {
                    distance: "1m",
                    center_point: {
                        lat: params.lat,
                        lon: params.lon,
                    },
                },
            });
        }
        const result = await this.esClient.search({
            index: "pelias",
            body,
        });
        const hits = result.body.hits.hits;
        return {
            geocoding: {
                version: "0.1",
            },
            type: "FeatureCollection",
            features: pelias_transform_1.PeliasTransform.toFeatures(hits),
        };
    }
    async findById(_id) {
        const result = await this.esClient.search({
            index: "pelias",
            body: {
                query: {
                    term: {
                        source_id: _id,
                    },
                },
            },
        });
        return result.body.hits.hits[0];
    }
}
exports.PeliasClient = PeliasClient;
function formatAddress(address) {
    return (0, vietnam_1.format)(address);
}
function extractAddress(address) {
    return (0, vietnam_1.extract)(address);
}
//# sourceMappingURL=index.js.map