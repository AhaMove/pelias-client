import { MultiIndexOptions } from "./transforms/elastic.transform";
import { NearbyParams } from "./resources/nearby.params";
import { SearchByNameParams, SearchParams } from "./resources/search.params";
import { AddressParts } from "./models/address-parts.model";
import { UpdateParams } from "./resources/update.params";
import { DocumentModel } from "./models/document.model";
import { CreateParams } from "./resources/create.params";
import { PeliasResponse } from "./resources/pelias.resouce";
import { ClientOptions } from "@elastic/elasticsearch";
import * as RequestParams from "@elastic/elasticsearch/api/requestParams";
import { ApiResponse, Context, TransportRequestPromise } from "@elastic/elasticsearch/lib/Transport";
import { HitsModel } from "./models/hits.model";
import { CountModel } from "./models/count.model";
interface ClientConfig extends ClientOptions {
    format?(text: string): string;
    extract?(text: string): AddressParts;
}
export declare class PeliasClient<TModel extends DocumentModel, TResponse extends HitsModel<TModel>, TCountResponse extends CountModel, TContext = Context> {
    private esClient;
    private format;
    private extract;
    constructor(params: ClientConfig);
    ping(params: RequestParams.Ping): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    structured(text: string): AddressParts & {
        formatted: string;
        layer?: string;
    };
    search(params: SearchParams, geocode: boolean, adminMatch: boolean, alias: string, multiIndexOpts?: MultiIndexOptions | null): Promise<PeliasResponse>;
    findByIds(ids: string): Promise<PeliasResponse>;
    nearBy(params: NearbyParams, geocode: boolean): Promise<PeliasResponse>;
    create(params: CreateParams): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    delete(id: string): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    update(id: string, params: UpdateParams): TransportRequestPromise<ApiResponse<TResponse, TContext>>;
    searchByName(params: SearchByNameParams): Promise<PeliasResponse>;
    findById(_id: string): Promise<any>;
}
export declare function formatAddress(address: string): string;
export declare function extractAddress(address: string): AddressParts;
export {};
