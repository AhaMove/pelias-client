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

  test("ping should success", async () => {
    const resp = await client.ping({})
    expect(resp.statusCode).toBe(200)
  })

  test("autocomplete should success 1", async () => {
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

  test("autocomplete should success 2", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "Circle K",
      size: "2",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(
      "Circle K, 75 Đường Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam"
    )
    expect(features[1].properties.name).toBe(
      "Circle K, Tô Hiến Thành, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam"
    )
  })

  test("geocoding should success 1", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "Bitexco",
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(
      "Tòa Nhà Bitexco Nam Long, 63a Võ Văn Tần, Phường 06, Quận 03, Hồ Chí Minh, Việt Nam"
    )
  })

  test("geocoding should success 2", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "28/7 Thành Thái, Phường 14, Quận 10, Hồ Chi Minh, Việt Nam",
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(
      "28/7 Đường Thành Thái, Phường 10 (Quận 10), Quận 10, Hồ Chí Minh, Việt Nam" //this case still work due to its registered locality is still "Phường 14" 
    )
  })

  test("geocoding should not found 1", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
    }, true)

    const features = resp.features
    expect(features.length).toBe(0)
  })

  test("geocoding should not found 2", async () => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: "phòng chứa bí mật",
    }, true)

    const features = resp.features
    expect(features.length).toBe(0)
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
