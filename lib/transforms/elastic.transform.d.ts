import { NearbyParams } from "../resources/nearby.params";
import { CountModel } from "../models/count.model";
import { AddressParts } from "../models/address-parts.model";
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
}
interface CreateShouldClauses {
    parsedText: AddressParts;
}
interface CreateQuery {
    layer: string;
    parsedText: AddressParts;
}
interface RescoreQuery {
    query: Record<string, any>;
    venueName: string;
}
interface CreateSort {
    sortScore: boolean;
    lat?: number;
    lon?: number;
}
export declare class ElasticTransform {
    static createShouldClauses({ parsedText }: CreateShouldClauses): any;
    static createQuery({ layer, parsedText }: CreateQuery): Record<string, any>;
    static rescoreQuery({ query, venueName }: RescoreQuery): Record<string, any>;
    static createSort({ sortScore, lat, lon }: CreateSort): any;
    static createSearchBody({ text, size, lat, lon, countFunc, geocode, multiIndexOpts, }: CreateSearchBody): Promise<{
        body: Record<string, any>;
        formatted: string;
        parsedText: AddressParts;
        layer: string;
    }>;
    static createNearByBody(params: NearbyParams): any;
}
export {};
