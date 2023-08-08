import { ElasticTransform } from "src/transforms/elastic.transform"
import { PeliasTransform } from "src/transforms/pelias.transform"
import { NearbyParams } from "src/resources/nearby.params"
import { SearchByNameParams, SearchParams } from "src/resources/search.params"
import { AddressParts } from "src/models/address-parts.model"
import { extract, format } from "./format/vietnam"
import * as crypto from "crypto"
import { UpdateParams } from "src/resources/update.params"
import { DocumentTransform } from "src/transforms/document.transform"
import { DocumentModel } from "src/models/document.model"
import { CreateParams } from "src/resources/create.params"
import { PeliasResponse } from "src/resources/pelias.resouce"
import { Client, ClientOptions } from "@elastic/elasticsearch"
import * as RequestParams from "@elastic/elasticsearch/api/requestParams"
import {
  ApiResponse,
  Context,
  TransportRequestPromise,
} from "@elastic/elasticsearch/lib/Transport"
import { HitsModel } from "src/models/hits.model"

interface ClientConfig extends ClientOptions {
  /**
   * Standardized address text
   * TODO: improve later
   * @param text
   */
  format?(text: string): string

  /**
   * Extract address component. Just approximation
   * TODO: improve later
   * @param text
   */
  extract?(text: string): AddressParts
}

export class PeliasClient<
  TModel extends DocumentModel,
  TResponse extends HitsModel<TModel>,
  TContext = Context
> {
  private esClient: Client
  private format = format
  private extract = extract

  constructor(params: ClientConfig) {
    this.esClient = new Client(params)
    if (params.format) {
      this.format = params.format
    }

    if (params.extract) {
      this.extract = params.extract
    }
  }

  ping(
    params: RequestParams.Ping
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>> {
    return this.esClient.ping(params)
  }

  /**
   * Extract address to components
   * @param text
   */
  structured(
    text: string
  ): AddressParts & { formatted: string; layer?: string } {
    const formatted = format(text)
    const parsedText = extract(formatted)
    const layer = !parsedText.street ? "venue" : undefined

    return {
      ...parsedText,
      formatted,
      layer,
    }
  }

  /**
   * Search address
   * @param params
   * @param geocode
   */
  async search(params: SearchParams, geocode = false): Promise<PeliasResponse> {
    const { text, minimumShouldMatch = "3<-1", size = "10" } = params
    const {
      body,
      formatted,
      parsedText,
      layer,
    } = ElasticTransform.createSearchBodyQuery({
      text,
      size: parseInt(size),
      minimumShouldMatch: minimumShouldMatch,
      lat: params["focus.point.lat"] ? parseFloat(params["focus.point.lat"]) : undefined,
      lon: params["focus.point.lon"] ? parseFloat(params["focus.point.lon"]) : undefined,
    })

    const result = await this.esClient.search<TResponse>({
      index: "pelias",
      body,
    })

    const hits = result.body.hits.hits

    const points = {
      "focus.point.lat": parseFloat(params["focus.point.lat"] || "0"),
      "focus.point.lon": parseFloat(params["focus.point.lon"] || "0"),
    }

    const data = PeliasTransform.getHits(hits, geocode)

    // console.log("Hits:\n", JSON.stringify(data, null, 2))

    return {
      geocoding: {
        version: "0.1",
        query: {
          text,
          size: hits.length,
          querySize: parseInt(size),
          parser: "pelias",
          parsed_text: parsedText,
          formatted,
          layer,
          ...points,
        },
      },
      type: "FeatureCollection",
      features: PeliasTransform.toFeatures(data, {
        points: Object.values(points),
      }),
    }
  }

  async findByIds(ids: string): Promise<PeliasResponse> {
    const result = await this.esClient.search<TResponse>({
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
    })

    const hits = result.body.hits.hits
    const data = PeliasTransform.getHits(hits, false)

    return {
      geocoding: {
        version: "0.1",
      },
      type: "FeatureCollection",
      features: PeliasTransform.toFeatures(data),
    }
  }

  async nearBy(
    params: NearbyParams,
    geocode: boolean
  ): Promise<PeliasResponse> {
    const result = await this.esClient.search<TResponse>({
      index: "pelias",
      body: ElasticTransform.createNearByBody(params),
    })

    const hits = result.body.hits.hits
    const data = PeliasTransform.getHits(hits, geocode)

    return {
      geocoding: {
        version: "0.1",
      },
      type: "FeatureCollection",
      features: PeliasTransform.toFeatures(data),
    }
  }

  create(
    params: CreateParams
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>> {
    const idData =
      params.name.default + params.center_point.lat + params.center_point.lon
    const sourceId = crypto.createHash("md5").update(idData).digest("hex")
    const id = [params.source, params.layer, sourceId].join(":")

    return this.esClient.create({
      id,
      index: "pelias",
      type: "_doc",
      body: params,
    })
  }

  delete(
    id: string
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>> {
    return this.esClient.delete({
      id,
      index: "pelias",
      type: "_doc",
    })
  }

  update(
    id: string,
    params: UpdateParams
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>> {
    return this.esClient.update({
      id,
      index: "pelias",
      type: "_doc",
      body: {
        doc: DocumentTransform.docBuilder(params),
      },
    })
  }

  searchByName(
    params: SearchByNameParams
  ): TransportRequestPromise<ApiResponse<TResponse, TContext>> {
    return this.esClient.search({
      index: "pelias",
      body: DocumentTransform.queryBuilder(params),
    })
  }
}

export function formatAddress(address: string): string {
  return format(address)
}

export function extractAddress(address: string): AddressParts {
  return extract(address)
}
