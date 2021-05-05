import { SearchResponse } from "elasticsearch"

export type HitsModel<T> = SearchResponse<T>["hits"]["hits"]
