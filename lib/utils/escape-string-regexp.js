"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = escapeStringRegexp;
function escapeStringRegexp(text) {
    return text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
//# sourceMappingURL=escape-string-regexp.js.map