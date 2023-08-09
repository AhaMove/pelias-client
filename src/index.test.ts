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

  test.each([
    [
      "7/28 thanh thai",
      "7/28 Thành Thái, 7/28 Thành TháI, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park Saigon, 7/28 Thành Thái, Phường 14",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Circle K",
      "Circle K, Lữ Gia, Phường 15, Quận 11, Hồ Chí Minh, Việt Nam",
      "Circle K, Hoà Hảo, Phường 03, Quận 10, Hồ Chí Minh, Việt Nam",
      "Circle K, Tô Hiến Thành, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "41 Bàu Cát, Phường 14, Quận Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát 7, Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát 8, Phường 13, Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát 8, Phường 14, Tân Bình, Hồ Chí Minh, Việt Nam",
    ],
  ])("autocomplete with focus should success: '%s'", async (text, result1, result2, result3) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text,
      size: "10",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(result1)
    expect(features[1].properties.name).toBe(result2)
    expect(features[2].properties.name).toBe(result3)
  })

  test.each([
    [
      "7/28 thanh thai",
      "7/28 Thành Thái, 7/28 Thành TháI, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park Saigon, 7/28 Thành Thái, Phường 14",
    ],
    [
      "Circle K",
      "Circle K, Đường A4, Phường 12, Quận Tân Bình",
      "Circle K, 7 Thanh Niên, Trúc Bạch, Ba Đình",
      "Circle K, 3 Xuân Diệu, Quảng An, Tây Hồ",
    ],
    [
      "41 Bàu Cát, Phường 14, Quận Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát, Phường 13, Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát, Phường 14, Tân Bình, Hồ Chí Minh, Việt Nam",
      "41 Bàu Cát 7, Tân Bình, Hồ Chí Minh, Việt Nam",
    ],
  ])("autocomplete w/o focus should success: '%s'", async (text, result1, result2, result3) => {
    const resp = await client.search({
      text,
      size: "10",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(result1)
    expect(features[1].properties.name).toBe(result2)
    expect(features[2].properties.name).toBe(result3)
  })

  test.each([
    [
      "13 tú xương",
      "13 Tú Xương, Quận 03, Hồ Chí Minh, Việt Nam"
    ],
    [
      "Bitexco",
      "Bitexco Nam Long, Võ Văn Tần, Phường 06, Quận 03, Hồ Chí Minh, Việt Nam"
    ],
    [
      "28/7 Thành Thái, Phường 14, Quận 10, Hồ Chi Minh, Việt Nam",
      "28/7 Đường Thành Thái, Phường 10 (Quận 10), Quận 10, Hồ Chí Minh, Việt Nam"
    ]
  ])("geocoding with focus should success: '%s'", async (text, name) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text,
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(name)
  })

  test.each([
    [
      "13 tú xương",
      "13 Tú Xương, Quận 03, Hồ Chí Minh, Việt Nam"
    ],
    [
      "Bitexco",
      "Bitexco Financial Tower, Tòa Nhà Tài Chính Bitexco, Ngô Đức Kế, Bến Nghé, Quận 01, Hồ Chí Minh, Việt Nam"
    ],
    [
      "28/7 Thành Thái, Phường 14, Quận 10, Hồ Chi Minh, Việt Nam",
      "28/7 Đường Thành Thái, Phường 10 (Quận 10), Quận 10, Hồ Chí Minh, Việt Nam"
    ]
  ])("geocoding w/o focus should success: '%s'", async (text, name) => {
    const resp = await client.search({
      text,
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(name)
  })

  test.each([
    [
      "9696 Trân Hưng Đạo",
    ],
    [
      "phòng chứa bí mật",
    ],
    [
      "135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
    ]
  ])("geocoding should not foundl: '%s'", async (text) => {
    const resp = await client.search({
      text,
    }, true)

    const features = resp.features
    expect(features.length).toBe(0)
  })
})
