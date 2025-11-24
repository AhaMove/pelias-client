import { AddressParts } from "src/models/address-parts.model";
import { CountModel } from "src/models/count.model";

export interface MultiIndexOptions {
  extraFilters?: Array<Record<string, unknown>>;
  extraFunctions?: Array<Record<string, unknown>>;
  aggregations?: Record<string, MultiIndexAggregationConfig> | null;
  overwriteHits?: boolean;
}

export interface MultiIndexAggregationConfig {
  filter: Record<string, unknown>;
  size: number;
}

export interface CreateSearchBody {
  text: string;
  size: number;
  lat?: number;
  lon?: number;
  countFunc: (queryBody: Record<string, unknown>) => Promise<CountModel>;
  geocode: boolean;
  multiIndexOpts?: MultiIndexOptions | null;
  userId: string;
}

export interface CreateShouldClauses {
  parsedText: AddressParts;
  formatted: string;
}

export interface CreateQuery {
  parsedText: AddressParts;
  formatted: string;
}

export interface ElasticBoolQuery {
  bool: {
    must: Array<Record<string, unknown>>;
    should: Array<Record<string, unknown>>;
    minimum_should_match: string | number;
    filter?: Array<Record<string, unknown>>;
  };
}

export interface ElasticFunctionScoreQuery {
  function_score: {
    query: ElasticBoolQuery | ElasticFunctionScoreQuery;
    functions: Array<Record<string, unknown>>;
    score_mode?: string;
    boost_mode?: string;
  };
}

export type ElasticQuery = ElasticBoolQuery | ElasticFunctionScoreQuery;

export interface RescoreQuery {
  query: ElasticQuery;
  venueName: string;
  parsedText: AddressParts;
}

export interface CreateSort {
  sortScore: boolean;
  lat?: number;
  lon?: number;
}

export type RescoreFunction = Record<string, unknown> & {
  script_score: {
    script: {
      source: string;
      params?: Record<string, unknown>;
    };
  };
};

export interface GeocodeParams {
  text: string;
  addressParts?: {
    number?: string;
    street?: string;
    region?: string;
    locality?: string;
    county?: string;
  };
}
