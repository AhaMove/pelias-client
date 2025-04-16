import { AddressParts } from "../../models/address-parts.model";
export declare const isAddress: (text: string) => RegExpMatchArray | null;
export declare const extractVenue: (text: string) => string;
export declare const extract: (text: string) => AddressParts;
