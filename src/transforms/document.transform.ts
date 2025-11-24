import { UpdateParams } from "../resources/update.params.js";

export class DocumentTransform {
  static docBuilder(data: UpdateParams) {
    const doc: UpdateParams = {};

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
