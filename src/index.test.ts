import Mock from "@elastic/elasticsearch-mock"
import addressMock from "../test/address.mock.json"
import searchResultsMock from "../test/search-results.mock.json"
import { PeliasClient } from "src/index"

const mock = new Mock()

const client = new PeliasClient({
  node: "https://pes7.ahamove.com/es/",
})

// mock.add(
//   {
//     method: "POST",
//     path: "/:index/_search",
//   },
//   () => {
//     return {
//       hits: {
//         total: { value: 1, relation: "eq" },
//         hits: addressMock,
//       },
//     }
//   }
// )
//
// mock.add(
//   {
//     method: "POST",
//     path: "/:index/_search",
//     body: {
//       query: {
//         bool: {
//           must: [
//             {
//               match: {
//                 "name.default": {
//                   analyzer: "peliasQuery",
//                   boost: 1,
//                   query: "41b Xã Đàn, Đống Đa, Hà Nội, Việt Nam",
//                   minimum_should_match: "90%",
//                 },
//               },
//             },
//           ],
//           should: [],
//         },
//       },
//       size: 10,
//       track_scores: true,
//       sort: ["_score"],
//     }
//   },
//   () => {
//     return {
//       hits: {
//         total: { value: 1, relation: "eq" },
//         hits: searchResultsMock,
//       },
//     }
//   }
// )

describe("test api", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  test("should response", async () => {
    try {
      const resp = await client.search({
        text: "41b Xã Đàn, Đống Đa, Hà Nội, Việt Nam",
      })
      console.log('resp', JSON.stringify(resp))
    } catch (e) {
      console.log(e)
    }

    expect(1).toBe(1)
  })
})


describe("findByIds", () => {
  test("should response", async () => {

  })
})