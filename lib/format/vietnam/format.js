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
exports.format = exports.removeLocalityPrefix = exports.removeCountyPrefix = void 0;
const _ = __importStar(require("lodash/fp"));
const regex_json_1 = __importDefault(require("../../data/vietnam/regex.json"));
const abbreviations_json_1 = __importDefault(require("../../data/vietnam/abbreviations.json"));
const dictionary_json_1 = __importDefault(require("../../data/vietnam/dictionary.json"));
const deaccents_1 = __importDefault(require("./deaccents"));
const dedupSpaces = _.replace(/\s+/g, " ");
const trimAll = _.flow([
    _.split(","),
    _.map(_.trim),
    _.filter((_) => _ != ""),
    _.join(", "),
]);
const capitalizeAll = _.flow([
    _.split(","),
    _.map(_.flow([_.trim, _.split(" "), _.map(_.upperFirst), _.join(" ")])),
    _.join(", "),
]);
const dedupString = _.flow([
    _.split(","),
    _.uniqBy(_.flow([deaccents_1.default, _.lowerCase])),
    _.join(", "),
]);
const sanitizeStreet = _.flow([
    _.replace(/(?<=^|\W)(Đường\s|đường\s)/gi, " Đường "),
    _.replace(/(?<=^|,|\s)(Đ\s|đ\s|Đ\.|đ\.)/gi, " Đường "),
    _.replace(/(?<=^|\W)(Street|Road)(?=$|\W)/gi, ", "),
    (text) => {
        if (!text.includes("Hà Nội")) {
            return text;
        }
        text = text.replace(/(?<=^|\W)(Phố\s)/gi, " Phố ");
        text = text.replace(/(?<=[A-Z]?[0-9][A-Z\-/0-9]*)[\s,]*(P\s|P\.)/gi, " Phố ");
        return text;
    },
]);
const encodeDictionaryWord = (text) => {
    const re = dictionary_json_1.default.map((value) => `(${value})`).join("|");
    return text.replace(new RegExp(re, "gi"), (m, ...p) => {
        return "#" + p.findIndex((value) => !!value);
    });
};
const decodeDictionaryWord = (text) => {
    return text.replace(new RegExp(/(#)(\d+)/, "g"), (m, p1, p2) => {
        return dictionary_json_1.default[parseInt(p2)];
    });
};
const cleanBracketContents = (text) => {
    let result = "";
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === "(") {
            count++;
        }
        else if (char === ")") {
            if (count > 0) {
                count--;
            }
        }
        else if (count === 0) {
            result += char;
        }
    }
    if (count != 0)
        return text.replace(/(\(|\))/g, "");
    return result;
};
const cleanAddress = _.flow([
    cleanBracketContents,
    _.replace(/(?<=^|\W)(Vietnam|Việt Nam|Viet Nam|ViệtNam)(?=$|\W)/gi, ""),
    _.replace(/(?<=^|,|\s)(VN)(?=$|,|\s)/gi, ""),
    _.replace(/(?<=^|,|\s)(Đ\/c|đ\/c|Đc|đc|Địa Chỉ|địa chỉ|D\/c|Dc|Dia Chi)(?=$|,|\s)/gi, ""),
    _.replace(/\b(?<!\.)0+([1-9][0-9]*)/g, "$1"),
    _.replace(/(?<=^|\W)\d{5,6}(?=$|\W)/gi, " "),
    _.replace(/(?<=^|\W)(\+84|0)(9|8|1[2689])([0-9]{8})(?=$|\W)/g, " "),
    _.replace(/["\\]/g, " "),
    _.replace(/[\n\t]/g, " "),
    _.replace(/^\s*[,.\-'/]+/, ""),
    _.replace(/(;|\s\/\s)/g, " , "),
    _.replace(/^\s*(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)\s+([A-Z]?[0-9])/i, "$2"),
    _.replace(/(?<=^|\W)(ngõ|ngo|ngách|ngach|hẻm|hem|số|sô|so|số nhà|sô nha|so nha|sn|nhà số|nha sô|nha so)([0-9])/gi, "$1 $2"),
    _.replace(/(\s+trên\s+)(\d+)/gi, "/$2"),
    _.replace(/^\s*([A-Z]?[0-9][A-Z\-/0-9]*)(?![\w.])[\s,]*/i, "$1 "),
    _.replace(/(?<=^|\W)Gần .*?(?=$|,)/gi, " "),
    _.replace(/(Đường\s)(số\s)?(\d+)(\s|,)/i, "Đường số $3, "),
]);
const addLeadingZero = function (text) {
    return _.replace(/(Quận|Phường)(\s+)(\d+)/gi, (_, p1, p2, p3) => {
        return p1 + " " + p3.trim();
    })(text);
};
const sanitizeWithoutFirst = (regex, replacement) => (text) => {
    const [p1, ...rest] = text.split(",");
    if (rest.length === 0) {
        return text;
    }
    const formatted = rest.join(",").replace(regex, replacement);
    return [p1].concat(formatted).join(",");
};
const sanitizeRegion = _.flow([
    sanitizeWithoutFirst(/(?<=^|\W)Province(?=$|\W)/gi, ","),
    sanitizeWithoutFirst(/(?<=^|\W)(Thành Phố\s|Thanh Pho\s)/gi, ", Thành Phố "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(Tp\s|Tp\.)/gi, ", Thành Phố "),
    sanitizeWithoutFirst(/(?<=^|\W)(Tỉnh\s)/gi, ", Tỉnh "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(T\s|T\.)/gi, ", Tỉnh "),
]);
const sanitizeCounty = _.flow([
    _.replace(/(District((?:(?!District).)*?(?=,|$)))/gi, (_, p1, p2) => {
        if (p2 && !isNaN(p2)) {
            return ", Quận " + p2 + ", ";
        }
        return ", " + p2 + ", ";
    }),
    sanitizeWithoutFirst(/(?<=^|\W)(Quận\s)/gi, ", Quận "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(Q\s|Q\.)/gi, ", Quận "),
    sanitizeWithoutFirst(/(?<=^|,|\s)q(\d{1,2})(?=$|,|\s)/gi, ", Quận $1, "),
    sanitizeWithoutFirst(/(?<=^|,|\s)Quận\s0(\d{1,2})(?=$|,|\s)/gi, ", Quận $1, "),
    sanitizeWithoutFirst(/(?<=^|\W)(Huyện\s)/gi, ", Huyện "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(H\s|H\.)/gi, ", Huyện "),
    sanitizeWithoutFirst(/(?<=^|\W)(Thị Xã\s|Thi Xa\s)/gi, ", Thị Xã "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(Tx\s|Tx\.)/gi, ", Thị Xã "),
]);
const removeCountyPrefix = function (county) {
    return county
        .replace(/(?<=^|\W)(Thành Phố\s|Quận\s|Huyện\s|Thị Xã\s)/gi, "")
        .trim();
};
exports.removeCountyPrefix = removeCountyPrefix;
const sanitizeLocality = _.flow([
    _.replace(/(Ward((?:(?!Ward).)*?(?=,|$)))/gi, (_, p1, p2) => {
        if (p2 && !isNaN(p2)) {
            return ", Phường " + p2 + ", ";
        }
        return ", " + p2 + ", ";
    }),
    sanitizeWithoutFirst(/(?<=^|\W)(Phường\s)(?![^,]*Phường)/gi, " Phường "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(F\s|F\.)/gi, ", Phường "),
    (text) => {
        if (text.includes("Hà Nội")) {
            return text;
        }
        return sanitizeWithoutFirst(/(?<=^|,|\s)(P\s|P\.)/gi, ", Phường ")(text);
    },
    sanitizeWithoutFirst(/(?<=^|,|\s)[pf](\d{1,2})(?=$|,|\s)/gi, ", Phường $1, "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(X\s|X\.)/gi, ", Xã "),
    sanitizeWithoutFirst(/(?<=^|\W)(?<!Thị\s)(Xã\s)/gi, ", Xã "),
    sanitizeWithoutFirst(/(?<=^|\W)(Thị Trấn\s|Thi Tran\s)/gi, ", Thị Trấn "),
    sanitizeWithoutFirst(/(?<=^|,|\s)(Tt\s|Tt\.)/gi, ", Thị Trấn "),
]);
const removeLocalityPrefix = function (locality) {
    return locality.replace(/(?<=^|\W)(Phường\s|Xã\s|Thị Trấn\s)/gi, "").trim();
};
exports.removeLocalityPrefix = removeLocalityPrefix;
const transformAll = function (text) {
    let arr = text
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    let locality = "", county = "", region = "";
    const regexLocality = new RegExp("^(Phường|Xã|Thị Trấn)", "i");
    const regexCounty = new RegExp("^(Thành Phố|Quận|Huyện|Thị Xã)", "i");
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (regexLocality.test(item)) {
            if (locality == "") {
                locality = item;
            }
            else {
                arr[i] = "";
            }
        }
    }
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (regexCounty.test(item)) {
            if (county == "") {
                county = item;
            }
            else {
                arr[i] = "";
            }
        }
    }
    const regionKeys = Object.keys(regex_json_1.default);
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (regionKeys.includes(item)) {
            if (region == "") {
                region = item;
            }
            else {
                arr[i] = "";
            }
        }
    }
    text = arr.filter((item) => item !== "").join(", ");
    if (locality != "" && county != "" && region != "") {
        arr = text
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
        text = "";
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (item != locality && item != county && item != region) {
                text += item + ", ";
            }
            else {
                break;
            }
        }
        text += locality + ", " + county + ", " + region;
    }
    if (region != "") {
        text += ", Việt Nam";
    }
    return text;
};
const transformAbbreviations = (text) => {
    for (const [key, value] of Object.entries(abbreviations_json_1.default)) {
        const re = new RegExp(value, "gi");
        text = text.replace(re, key);
    }
    return text;
};
const transformRegion = (text) => {
    for (const [key, value] of Object.entries(regex_json_1.default)) {
        const re = new RegExp(value, "gi");
        text = text.replace(re, key);
    }
    return text;
};
exports.format = _.flow([
    dedupSpaces,
    transformAbbreviations,
    encodeDictionaryWord,
    cleanAddress,
    decodeDictionaryWord,
    dedupSpaces,
    sanitizeStreet,
    sanitizeRegion,
    sanitizeLocality,
    sanitizeCounty,
    addLeadingZero,
    dedupSpaces,
    capitalizeAll,
    transformRegion,
    dedupString,
    dedupSpaces,
    trimAll,
    transformAll,
]);
//# sourceMappingURL=format.js.map