import * as turf from "@turf/turf"
import { Position } from "@turf/turf"
import * as _ from "lodash/fp"
import { HitsModel } from "src/models/hits.model"
import { PeliasFeatureModel } from "src/models/pelias-feature.model"
import { DocumentModel } from "src/models/document.model"

type FeatureOps = {
  points?: Position
}

export class PeliasTransform {
  static createGId(value: string): string {
    return `whosonfirst:region:${value}`
  }

  static getDistance(startPosition: Position, endPosition: Position): number {
    if (!Array.isArray(startPosition) || !Array.isArray(endPosition)) {
      return 0
    }

    const from = turf.point(startPosition)
    const to = turf.point(endPosition)

    return turf.distance(from, to)
  }

  static getHits<T extends DocumentModel>(
    hits: HitsModel<T>,
    geocode: boolean
  ): HitsModel<T> {
    if (geocode) {
      if (hits.length > 0) {
        return [hits[0]]
      }
    }

    return hits
  }

  static toFeatures<T extends DocumentModel>(
    hits: HitsModel<T>,
    opts: FeatureOps = {
      points: undefined,
    }
  ): PeliasFeatureModel[] {
    return hits.map((value) => {
      const source = value._source
      const parent = source.parent
      const coordinates = [source.center_point.lon, source.center_point.lat]
      const nameDefault = source.name.default
      const name = Array.isArray(nameDefault) ? nameDefault[0] : nameDefault

      const result: PeliasFeatureModel = {
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
          region_a: _.get("region_a.0", parent),
          county: _.get("county.0", parent),
          county_gid: _.get("county_id.0", parent),
          county_a: _.get("county_a.0", parent),
          label: name,
          distance: 0,
          housenumber: "",
          street: "",
          locality: "",
          locality_a: "",
          locality_gid: "",
        },
      }

      const locality = _.get("locality.0", parent)
      if (locality) {
        result.properties = {
          ...result.properties,
          ...{
            locality,
            locality_gid: PeliasTransform.createGId(
              _.get("locality_id.0", parent)
            ),
            locality_a: _.get("locality_a.0", parent),
          },
        }
      } else {
        result.properties = {
          ...result.properties,
          ...{
            locality: result.properties.county,
            locality_gid: result.properties.county_gid,
            locality_a: result.properties.county_a,
          },
        }
      }

      if (source.address_parts) {
        result.properties.housenumber = source.address_parts.number
        result.properties.street = source.address_parts.street
      }

      if (Array.isArray(opts.points) && opts.points[0] && opts.points[1]) {
        result.properties.distance = PeliasTransform.getDistance(
          opts.points,
          coordinates
        )
      }

      return result
    })
  }
}
