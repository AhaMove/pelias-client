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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeliasTransform = void 0;
const turf = __importStar(require("@turf/turf"));
const _ = __importStar(require("lodash/fp"));
const deaccents_1 = __importDefault(require("../format/vietnam/deaccents"));
const vietnam_1 = require("../format/vietnam");
class PeliasTransform {
    static createGId(value) {
        return `whosonfirst:region:${value}`;
    }
    static getDistance(startPosition, endPosition) {
        if (!Array.isArray(startPosition) || !Array.isArray(endPosition)) {
            return 0;
        }
        const from = turf.point(startPosition);
        const to = turf.point(endPosition);
        return turf.distance(from, to);
    }
    static filterHits(hits, geocode = false, adminAreas) {
        if (geocode) {
            if (!adminAreas) {
                if (hits.length > 0) {
                    return [hits[0]];
                }
                return hits;
            }
            adminAreas = {
                county: (0, deaccents_1.default)((0, vietnam_1.removeCountyPrefix)(adminAreas.county)),
                locality: (0, deaccents_1.default)((0, vietnam_1.removeLocalityPrefix)(adminAreas.locality)),
            };
            for (let i = 0; i < hits.length; i++) {
                const nameDefault = (0, deaccents_1.default)(hits[i]._source.name.default);
                if (adminAreas.county) {
                    if (!nameDefault.includes(adminAreas.county)) {
                        continue;
                    }
                }
                if (adminAreas.locality) {
                    if (!nameDefault.includes(adminAreas.locality)) {
                        continue;
                    }
                }
                return [hits[i]];
            }
            return [];
        }
        return hits;
    }
    static toFeatures(hits, opts = {
        points: undefined,
    }) {
        return hits.map((value) => {
            var _a, _b, _c, _d, _e, _f;
            const source = value._source;
            const parent = source.parent;
            const coordinates = [source.center_point.lon, source.center_point.lat];
            const nameDefault = source.name.default;
            const name = Array.isArray(nameDefault) ? nameDefault[0] : nameDefault;
            const { addendum } = source;
            let entrances = "", polygon = "";
            if (addendum) {
                const { geometry } = addendum;
                if (geometry) {
                    const jsonGeometry = JSON.parse(geometry);
                    entrances = (_a = jsonGeometry === null || jsonGeometry === void 0 ? void 0 : jsonGeometry.entrances) !== null && _a !== void 0 ? _a : "";
                    polygon = (_b = jsonGeometry === null || jsonGeometry === void 0 ? void 0 : jsonGeometry.polygon) !== null && _b !== void 0 ? _b : "";
                }
                else {
                    entrances = (_d = (_c = source === null || source === void 0 ? void 0 : source.addendum) === null || _c === void 0 ? void 0 : _c.entrances) !== null && _d !== void 0 ? _d : "";
                    polygon = (_f = (_e = source === null || source === void 0 ? void 0 : source.addendum) === null || _e === void 0 ? void 0 : _e.polygon) !== null && _f !== void 0 ? _f : "";
                }
            }
            const result = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates,
                },
                properties: {
                    id: source.source_id,
                    gid: value._id,
                    layer: source.layer,
                    source: source.source,
                    source_id: source.source_id,
                    name,
                    accuracy: "point",
                    region: _.get("region.0", parent),
                    region_gid: PeliasTransform.createGId(_.get("region_id.0", parent)),
                    region_id: _.get("region_id.0", parent),
                    region_a: _.get("region_a.0", parent),
                    county: _.get("county.0", parent),
                    county_gid: _.get("county_id.0", parent),
                    county_id: _.get("county_id.0", parent),
                    county_a: _.get("county_a.0", parent),
                    label: name,
                    distance: 0,
                    housenumber: "",
                    street: "",
                    locality: "",
                    locality_a: "",
                    locality_gid: "",
                    locality_id: _.get("locality_id.0", parent),
                    entrances,
                    polygon,
                },
            };
            const locality = _.get("locality.0", parent);
            if (locality) {
                result.properties = Object.assign(Object.assign({}, result.properties), {
                    locality,
                    locality_gid: PeliasTransform.createGId(_.get("locality_id.0", parent)),
                    locality_a: _.get("locality_a.0", parent),
                });
            }
            else {
                result.properties = Object.assign(Object.assign({}, result.properties), {
                    locality: result.properties.county,
                    locality_gid: result.properties.county_gid,
                    locality_a: result.properties.county_a,
                });
            }
            if (source.address_parts) {
                result.properties.housenumber = source.address_parts.number;
                result.properties.street = source.address_parts.street;
            }
            if (Array.isArray(opts.points) && opts.points[0] && opts.points[1]) {
                result.properties.distance = PeliasTransform.getDistance(opts.points, coordinates);
            }
            return result;
        });
    }
}
exports.PeliasTransform = PeliasTransform;
//# sourceMappingURL=pelias.transform.js.map