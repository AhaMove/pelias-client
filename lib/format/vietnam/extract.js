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
exports.extract = exports.extractVenue = exports.isAddress = void 0;
const _ = __importStar(require("lodash/fp"));
const hasCountry = (text) => {
    return /Việt Nam/gi.test(text);
};
const findCountry = (text) => {
    const arr = text.split(",");
    if (hasCountry(text)) {
        return arr[arr.length - 1].trim();
    }
    return "";
};
const findRegion = (text) => {
    const arr = text.split(",");
    if (hasCountry(text)) {
        return arr[arr.length - 2].trim();
    }
    return "";
};
const findCounty = (text) => {
    const arr = text.split(",");
    let county = "";
    let index = -1;
    let length = arr.length;
    if (!hasCountry(text))
        length = length + 2;
    if (length >= 4) {
        county = arr[length - 3];
        index = length - 3;
    }
    if ((0, exports.isAddress)(county)) {
        county = "";
        index = -1;
    }
    return {
        index,
        name: county.trim(),
    };
};
const findLocality = (text) => {
    const arr = text.split(",");
    let locality = "";
    let index = -1;
    let length = arr.length;
    if (!hasCountry(text))
        length = length + 2;
    if (length >= 5) {
        locality = arr[length - 4];
        index = length - 4;
    }
    if ((0, exports.isAddress)(locality)) {
        locality = "";
        index = -1;
    }
    return {
        index,
        name: locality.trim(),
    };
};
const extractAddressParts = (arr) => {
    let number = "";
    let street = "";
    arr.forEach((value) => {
        const data = /^([Số|Ngõ\s0-9/-]+)(\s)(.*)/gi.exec(value.trim());
        if (data) {
            number = data[1];
            street = data[3];
        }
    });
    return {
        number: number.trim(),
        street: street.trim(),
    };
};
const extractAddress = (text) => {
    const arr = text.split(",");
    let number;
    let street;
    let address = arr[0] || "";
    const data = /^([A-Z]?[0-9][A-Z\-/0-9]*)([,\s]+)((?:.)*?(?=,|$))/gi.exec(text);
    if (data) {
        number = data[1];
        street = data[3];
    }
    else {
        let addressParts = /Phố((?:(?!Phố).)*?(\s{2}|(?=,)))/.exec(text);
        if (addressParts) {
            street = addressParts[0];
            number = text.slice(0, addressParts.index).replace(/,/gi, "");
        }
        else {
            addressParts = extractAddressParts(arr);
            number = addressParts.number;
            street = addressParts.street;
        }
    }
    if (!number.replace(/[^0-9]/gi, "")) {
        number = "";
    }
    if (arr.length === 1) {
        address = arr[0] || "";
    }
    if (arr.length === 10) {
        address = _.slice(0, 6, arr).join(",");
    }
    if (arr.length === 8) {
        address = _.slice(0, 4, arr).join(",");
    }
    if (arr.length === 7) {
        address = _.slice(0, 3, arr).join(",");
    }
    if (arr.length === 6) {
        address = _.slice(0, 2, arr).join(",");
    }
    return {
        number,
        street,
        address,
    };
};
const isAddress = (text) => {
    let firstPart = text.split(",")[0].trim();
    firstPart = firstPart
        .replace(/^(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i, "$2")
        .trim();
    return firstPart.match(/^[A-Z]?[0-9][A-Z\-/0-9]*(?=\s|$)/i);
};
exports.isAddress = isAddress;
const extractVenue = (text) => {
    if ((0, exports.isAddress)(text)) {
        return "";
    }
    const venue = text.split(",")[0];
    if (!venue.replace(/[^a-z0-9À-ỹ]/gi, "")) {
        return "";
    }
    return venue.trim();
};
exports.extractVenue = extractVenue;
const extract = (text) => {
    const arr = text.split(",");
    const country = findCountry(text);
    const region = findRegion(text);
    const { name: county, index: countyIndex } = findCounty(text);
    let locality = "", localityIndex = -1;
    if (county != "" && countyIndex > -1) {
        const { name: _locality, index: _localityIndex } = findLocality(text);
        locality = _locality;
        localityIndex = _localityIndex;
    }
    const index = localityIndex > -1
        ? localityIndex
        : countyIndex > -1
            ? countyIndex
            : arr.length;
    const result = {
        country,
        region,
        county,
        locality,
    };
    const venue = (0, exports.extractVenue)(text);
    const addressParams = arr.slice(0, index).join(",");
    const { number, street, address } = extractAddress(addressParams);
    if (number) {
        result.number = number;
    }
    if (street) {
        result.street = street;
    }
    if (venue) {
        result.venue = venue;
    }
    else {
        result.address = address;
    }
    return result;
};
exports.extract = extract;
//# sourceMappingURL=extract.js.map