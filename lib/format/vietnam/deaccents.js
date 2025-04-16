"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fp_1 = require("lodash/fp");
const deaccents = (0, fp_1.flow)([
    (0, fp_1.replace)(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a"),
    (0, fp_1.replace)(/[èéẹẻẽêềếệểễ]/g, "e"),
    (0, fp_1.replace)(/[ìíịỉĩ]/g, "i"),
    (0, fp_1.replace)(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o"),
    (0, fp_1.replace)(/[ùúụủũưừứựửữ]/g, "u"),
    (0, fp_1.replace)(/[ỳýỵỷỹ]/g, "y"),
    (0, fp_1.replace)(/đ/g, "d"),
    (0, fp_1.replace)(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "A"),
    (0, fp_1.replace)(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "E"),
    (0, fp_1.replace)(/[ÌÍỊỈĨ]/g, "I"),
    (0, fp_1.replace)(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "O"),
    (0, fp_1.replace)(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "U"),
    (0, fp_1.replace)(/[ỲÝỴỶỸ]/g, "Y"),
    (0, fp_1.replace)(/Đ/g, "D"),
]);
exports.default = deaccents;
//# sourceMappingURL=deaccents.js.map