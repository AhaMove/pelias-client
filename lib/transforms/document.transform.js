"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentTransform = void 0;
class DocumentTransform {
    static docBuilder(data) {
        const doc = {};
        if (data.name) {
            doc.name = data.name;
        }
        if (data.address_parts) {
            doc.address_parts = data.address_parts;
        }
        if (data.center_point) {
            doc.center_point = data.center_point;
        }
        if (data.layer) {
            doc.layer = data.layer;
        }
        if (data.parent) {
            doc.parent = data.parent;
        }
        if (data.source) {
            doc.source = data.source;
        }
        if (data.source_id) {
            doc.source_id = data.source_id;
        }
        return doc;
    }
}
exports.DocumentTransform = DocumentTransform;
//# sourceMappingURL=document.transform.js.map