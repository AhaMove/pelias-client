import { PeliasClient, formatAddress, extractAddress } from "./index"

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
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái",
    ],
    [
      "Rivera Park",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park",
    ],
    [
      "Thao Dien",
      "Tòa Nhà Thảo Điền, 25 Hoàng Hoa Thám, Phường 06, Quận Bình Thạnh, Hồ Chí Minh, Việt Nam",
    ],
  ])("autocomplete with focus should success: '%s'", async (text, result1) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989", //Ahamove
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: 2,
    })

    const features = resp.features
    expect(features[1].properties.name).toContain(result1)
  })

  test.each([
    [
      "7/28 Thành Thái", 
      "7/28 Thành Thái"
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái",
    ],
    [
      "Rivera Park",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park",
    ],
    [
      "Thao Dien",
      "L'Apella De Thao Dien, 1 Đường Số 16, Thảo Điền, Thủ Đức, Hồ Chí Minh, Việt Nam",
    ],
  ])("autocomplete w/o focus should success: '%s'", async (text, result1) => {
    const resp = await client.search({
      text: formatAddress(text),
      size: 2,
    })

    const features = resp.features
    expect(features[1].properties.name).toContain(result1)
  })

  test.each([
    [
      "7/28 Thành Thái",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái",
    ],
    [
      "Rivera Park",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park",
    ],
    [
      "Thao Dien",
      "Masteri Thao Dien, Quận 04, Hồ Chí Minh, Việt Nam",
    ],
  ])("geocoding with focus should success: '%s'", async (text, result) => {
    const resp = await client.search(
      {
        "focus.point.lat": "10.76989", //Ahamove
        "focus.point.lon": "106.6640",
        text: formatAddress(text),
      },
      true
    )

    const features = resp.features
    expect(features[0].properties.name).toContain(result)
  })

  test.each([
    [
      "7/28 Thành Thái", 
      "7/28 Thành Thái"
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "7/28 Thành Thái",
    ],
    [
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "7/28 Thành Thái",
    ],
    [
      "Rivera Park",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
      "Rivera Park",
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      "Rivera Park",
    ],
    [
      "Thao Dien",
      "Masteri Thảo Điền, T3, 42 Đường Số 10, Thao Dien, Quận 02, Hồ Chí Minh, Việt Nam",
    ],
  ])("geocoding w/o focus should success: '%s'", async (text, result) => {
    const resp = await client.search(
      {
        text: formatAddress(text),
      },
      true
    )

    const features = resp.features
    expect(features[0].properties.name).toContain(result)
  })

  test.each([
    ["9696 Trân Hưng Đạo"],
    ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một"],
    ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương"],
    ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam"],
    ["Phòng chứa bí mật"],
    ["Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một"],
    [
      "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương",
    ],
    [
      "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
    ],
  ])("geocoding should not found: '%s'", async (text) => {
    const resp = await client.search(
      {
        text: formatAddress(text),
      },
      true
    )

    const features = resp.features
    expect(features.length).toBe(0)
  })

  test.each([
    [
      "Thao Dien",
    ],
    [
      "ATM",
    ],
    [
      "Hotel"
    ]
  ])("Too many matches -> no function_score triggered -> exec time won't exceed 1 sec: '%s'", async (text) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989", //Ahamove
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: 10,
    })

    const features = resp.features
    expect(!features[0].properties.entrances || features[0].properties.entrances == "{}").toBe(true)
  },
  1000)

  test.each([
    [
      "Thao Dien Pearl",
    ],
  ])("First returned venue has entrances: '%s'", async (text) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989", //Ahamove
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: 10,
    })

    const features = resp.features
    expect(features[0].properties.entrances.length > 10).toBe(true)
  })

  test.each([
    [
      "ben vien van hanh",
      "Cổng Sư Vạn Hạnh"
    ],
  ])("Results must follow venue name's order: '%s'", async (text, badResult) => {
    const resp = await client.search({
      "focus.point.lat": "10.769015", //bệnh viện Nhi đồng 1
      "focus.point.lon": "106.671015",
      text: formatAddress(text),
      size: 10,
    })

    resp.features.forEach((feature, index) => {
      expect(feature.properties.name).not.toContain(badResult)
    })
  })

  test.each([
    [
      "7/28 Thành Thái",
    ],
  ])("Results must be < 1km away from focus point: '%s'", async (text) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989", //Ahamove
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: 10,
    })

    resp.features.forEach((feature, index) => {
      expect(feature.properties.distance).toBeLessThan(1)
    })
  })

  test.each([
    [
      "7/28 Thành Thái, F.14, Q.10, HCM, VN",
      "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Số nhà 7/28 \", đường Thành Thái \\, Phường 14 () ( ), Quận 10   , thành phố Hồ Chí Minh \t , Việt   Nam   ",
      "7/28 Đường Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "/12/34 Lý Thường Kiệt, F.12, Q.5, HCM",
      "12/34 Lý Thường Kiệt, Phường 12, Quận 05, Hồ Chí Minh, Việt Nam",
    ],
    [
      "..--''//.-'/12 Lý Thường Kiệt, F.12, Q.5, HCM",
      "12 Lý Thường Kiệt, Phường 12, Quận 05, Hồ Chí Minh, Việt Nam",
    ],
    [
      "7/28 d.Thành Thái, F.14, Q.10, HCM, VN",
      "7/28 Đường Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
    ],
    [
      "Rivera Park, 7/28 đ. Thành Thái",
      "Rivera Park, 7/28 Đường Thành Thái",
    ],
  ])("Formated text should be correct: '%s'", async (text, result) => {
    expect(formatAddress(text)).toBe(result)
  })

  test.each([
    [
      "241/61/28 Ngõ Chợ Khâm Thiên",
      "241/61/28 Ngõ Chợ Khâm Thiên, Phương Liên, Đống Đa, Hà Nội, Việt Nam",
    ],
    [
      "Saigon Centre",
      "Saigon Centre Moi, 77 Nam Ky Khoi Nghia, Ben Nghe, Quận 01, Hồ Chí Minh, Việt Nam",
    ],
  ])("Search should found: '%s'", async (text, result) => {
    const resp = await client.search({
      "focus.point.lat": "10.76989", //Ahamove
      "focus.point.lon": "106.6640",
      text: formatAddress(text),
      size: 1,
    })

    const features = resp.features
    expect(features[0].properties.name).toContain(result)
  })

  test.each([
    [
      "Rivera Park , 7/28 Thành Thái , F14 , Q10 , HCM , VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "Phường 14",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park 7/28 Thành Thái",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        venue: "Rivera Park 7/28 Thành Thái",
      }
    ],
    [
      "7/28",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        address: "7/28",
      }
    ],
    [
      "7/28 Thành Thái",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "Rivera Park, 7/28",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, 7/28 Thành Thái",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, VN",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "7/28, Thành Thái",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, VN",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "Rivera Park, 7/28 Thành Thái, Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, 7/28 Thành Thái, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, 7/28 Thành Thái, VN",
      {
        country: "",
        region: "",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, F14, Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "Phường 14",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, Q10, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, Q10, VN",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park, HCM, VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "7/28 Thành Thái, F14, Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "Phường 14",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, Q10, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, Q10, VN",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái, HCM, VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "Rivera Park , 7/28 Thành Thái , F14 , Q10",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "Phường 14",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , 7/28 Thành Thái , Q10 , HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , 7/28 Thành Thái , Q10 , VN",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , 7/28 Thành Thái , HCM , VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , F14 , Q10, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "Phường 14",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , F14 , Q10, VN",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "Phường 14",
        venue: "Rivera Park",
      }
    ],
    [
      "Rivera Park , Q10, HCM, VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "",
        venue: "Rivera Park",
      }
    ],
    [
      "7/28 Thành Thái , F14 , Q10, HCM",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "Phường 14",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái , F14 , Q10, VN",
      {
        country: "",
        region: "",
        county: "Quận 10",
        locality: "Phường 14",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
    [
      "7/28 Thành Thái , Q10 , HCM, VN",
      {
        country: "Việt Nam",
        region: "Hồ Chí Minh",
        county: "Quận 10",
        locality: "",
        number: "7/28",
        street: "Thành Thái",
        address: "7/28 Thành Thái",
      }
    ],
  ])("Address extraction should return as expected: '%s'", async (text, expected) => {
    const result = extractAddress(formatAddress(text))

    expect(result).toEqual(expected)
  })
})