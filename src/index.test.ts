import { PeliasClient } from "src/index"

const client = new PeliasClient({
  node: "",
  auth: {
    username: "",
    password: "",
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

  test("should search success", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "7/28 thanh thai",
      size: "2",
    })

    const features = resp.features
    console.log(features[0])
    expect(features[0].properties.name).toBe(
      "7/28 Thành Thái, Tòa Nhà Rivera Park Thành Thái"
    )
    expect(features[1].properties.name).toBe("7/28 Thành Thái, Phường 14")
  })

  test("should find by ids success", async () => {
    const resp = await client.findByIds(
      "openaddresses:address:4f56ee8599bac054c020fb0d90298e89,openaddresses:address:e3427fd0f0507aac12a008904a4951b1"
    )
    expect(resp.features[0].properties.id).toBe(
      "4f56ee8599bac054c020fb0d90298e89"
    )
    expect(resp.features[1].properties.id).toBe(
      "e3427fd0f0507aac12a008904a4951b1"
    )
  })
})
