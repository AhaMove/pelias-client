import { PeliasClient } from "./index"

const client = new PeliasClient({
  node: "http://pes7.ahamove.com:9200",
  auth: {
    username: "admin1996",
    password: "03091996@",
  },
})

describe("test api", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  test("should ping success", async () => {
    const resp = await client.ping({})
    expect(resp.statusCode).toBe(200)
  })

  test("should search (w/o geocode) success", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "7/28 thanh thai",
      size: "2",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(
      "7/28 Thanh Thai Cc Riverapark, Quận 10, Hồ Chí Minh, Việt Nam"
    )
    expect(features[1].properties.name).toBe(
      "7/28 Đường Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam"
    )
  })

  test("should search (with geocode) success", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "7/28 thanh thai",
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(
      "7/28 Thanh Thai Cc Riverapark, Quận 10, Hồ Chí Minh, Việt Nam"
    )
  })

  // test("should find by ids success", async () => {
  //   const resp = await client.findByIds(
  //     "openaddresses:address:4f56ee8599bac054c020fb0d90298e89,openaddresses:address:e3427fd0f0507aac12a008904a4951b1"
  //   )
  //   expect(resp.features[0].properties.id).toBe(
  //     "4f56ee8599bac054c020fb0d90298e89"
  //   )
  //   expect(resp.features[1].properties.id).toBe(
  //     "e3427fd0f0507aac12a008904a4951b1"
  //   )
  // })
})
