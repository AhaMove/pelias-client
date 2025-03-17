import { Position } from "@turf/turf";
import { PeliasFeatureModel } from "../models/pelias-feature.model";
import { DocumentModel } from "../models/document.model";
import { ResponseModel } from "../models/response.model";
type FeatureOps = {
    points?: Position;
};
export interface AdminAreas {
    county: string;
    locality: string;
}
export declare class PeliasTransform {
    static createGId(value: string): string;
    static getDistance(startPosition: Position, endPosition: Position): number;
    static filterHits<T extends DocumentModel>(hits: Array<ResponseModel<T>>, geocode?: boolean, adminAreas?: AdminAreas): Array<ResponseModel<T>>;
    static toFeatures<T extends DocumentModel>(hits: Array<ResponseModel<T>>, opts?: FeatureOps): PeliasFeatureModel[];
}
export {};
