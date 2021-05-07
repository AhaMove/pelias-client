import { UpdateParams } from "src/resources/update.params"
import { SearchByNameParams } from "src/resources/search.params"

export class DocumentTransform {
  static queryBuilder(params: SearchByNameParams): any {
    const query: any = {
      query: {
        bool: {
          must: [],
        },
      },
    }

    if (params.address_name) {
      query.query.bool.must.push({
        match: {
          "name.default": {
            query: params.address_name,
            minimum_should_match: params.minimum_should_match ?? "70%",
          },
        },
      })
    }

    if (params.id) {
      query.query.bool.must.push({
        term: {
          _id: params.id,
        },
      })
    }

    return query
  }

  static docBuilder(data: UpdateParams) {
    const doc: UpdateParams = {}

    if (data.name) {
      doc.name = data.name
    }

    if (data.address_parts) {
      doc.address_parts = data.address_parts
    }

    if (data.center_point) {
      doc.center_point = data.center_point
    }

    if (data.layer) {
      doc.layer = data.layer
    }

    if (data.parent) {
      doc.parent = data.parent
    }

    if (data.source) {
      doc.source = data.source
    }

    if (data.source_id) {
      doc.source_id = data.source_id
    }

    return doc
  }
}
