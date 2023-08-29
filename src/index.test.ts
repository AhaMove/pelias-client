import { PeliasClient, formatAddress } from "./index"

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
      "7/28 Thành Thái",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    // [
    //   "Rivera Park, 7/28 Thành Thái",
    //   "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    // ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Thao Dien",
      "Masteri Thao Dien, Quận 04, Hồ Chí Minh, Việt Nam",
    ]
  ])("autocomplete with focus should success: '%s'", async (text, result1) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: "10",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(result1)
  })

  test.each([
    [
      "7/28 Thành Thái",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "Rivera Park",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    // [
    //   "Rivera Park, 7/28 Thành Thái",
    //   "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    // ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Thao Dien",
      "Starbucks Thao Dien, Thảo Điền, Hồ Chí Minh, Việt Nam",
    ]
  ])("autocomplete w/o focus should success: '%s'", async (text, result1) => {
    const resp = await client.search({
      text: formatAddress(text),
      size: "10",
    })

    const features = resp.features
    expect(features[0].properties.name).toBe(result1)
  })

  test.each([
    [
      "7/28 Thành Thái",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    // [
    //   "Rivera Park, 7/28 Thành Thái",
    //   "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    // ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Thao Dien",
      "Masteri Thao Dien, Quận 04, Hồ Chí Minh, Việt Nam",
    ]
  ])("geocoding with focus should success: '%s'", async (text, name) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989",
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(name)
  })

  test.each([
    [
      "7/28 Thành Thái",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Chung Cu Rivera Park, 7/28 Thanh Thai, Phường 14",
    ],
    [
      "Rivera Park",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    // [
    //   "Rivera Park, 7/28 Thành Thái",
    //   "Chung Cư Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    // ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Thao Dien",
      "Starbucks Thao Dien, Thảo Điền, Hồ Chí Minh, Việt Nam",
    ]
  ])("geocoding w/o focus should success: '%s'", async (text, name) => {
    const resp = await client.search({
      text: formatAddress(text),
    }, true)

    const features = resp.features
    expect(features[0].properties.name).toBe(name)
  })

  test.each([
    [
      "9696 Trân Hưng Đạo",
    ],
    [
      "135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một",
    ],
    [
      "135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương",
    ],
    [
      "135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
    ],
    [
      "Phòng chứa bí mật",
    ],
    [
      "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một",
    ],
    [
      "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương",
    ],
    [
      "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
    ],
  ])("geocoding should not found: '%s'", async (text) => {
    const resp = await client.search({
      text: formatAddress(text),
    }, true)

    const features = resp.features
    expect(features.length).toBe(0)
  })
})
