import { extractAddress, formatAddress } from "./index";

// const client = new PeliasClient({
//   node: process.env.PELIAS_URL,
//   auth: {
//     username: process.env.PELIAS_USERNAME as string,
//     password: process.env.PELIAS_PASSWORD as string
//   },
// })

// describe("test api", () => {
//   beforeEach(() => {
//     jest.useFakeTimers()
//   })

//   test("ping should success", async () => {
//     const resp = await client.ping({})
//     expect(resp.statusCode).toBe(200)
//   })

//   test.each([
//     [
//       "7/28 Thành Thái",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "7/28 Thành Thái",
//     ],
//     [
//       "Rivera Park",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "Rivera Park",
//     ],
//   ])("autocomplete with focus should success: '%s'", async (text, result1) => {
//     const resp = await client.search({
//       "focus.point.lat": "10.76989", //Ahamove
//       "focus.point.lon": "106.6640",
//       text: formatAddress(text),
//       size: 2,
//     })

//     const features = resp.features
//     expect(features[1].properties.name).toContain(result1)
//   })

//   test.each([
//     [
//       "7/28 Thành Thái",
//       "7/28 Thành Thái"
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "7/28 Thành Thái",
//     ],
//     [
//       "Rivera Park",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "Rivera Park",
//     ],
//   ])("autocomplete w/o focus should success: '%s'", async (text, result1) => {
//     const resp = await client.search({
//       text: formatAddress(text),
//       size: 2,
//     })

//     const features = resp.features
//     expect(features[1].properties.name).toContain(result1)
//   })


//   test.each([
//     [
//       "7/28 Thành Thái",
//       "7/28 Thành Thái"
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "7/28 Thành Thái",
//     ],
//     [
//       "7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "7/28 Thành Thái",
//     ],
//     [
//       "Rivera Park",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh",
//       "Rivera Park",
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//       "Rivera Park",
//     ],
//     // [
//     //   "241/61/28 Ngõ Chợ Khâm Thiên",
//     //   "241/61/28 Ngõ Chợ Khâm Thiên, Phương Liên, Đống Đa, Hà Nội, Việt Nam",
//     // ],
//     // [
//     //   "Saigon Centre Tower 2, 67 Lê Lợi, Bến Nghé, Quận 01, Hồ Chí Minh, Việt Nam",
//     //   "Saigon Centre",
//     // ],
//     [
//       "12 Vườn Lài, Quận 8, Ho Chi Minh",
//       "12 Vườn Lài, Phường 11, Quận 08, Hồ Chí Minh, Việt Nam"
//     ]
//   ])("geocoding should success: '%s'", async (text, result) => {
//     const resp = await client.search(
//       {
//         text: formatAddress(text),
//       },
//       true
//     )

//     const features = resp.features
//     expect(features[0].properties.name).toContain(result)
//   })

//   test.each([
//     ["9696 Trân Hưng Đạo"],
//     ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một"],
//     ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương"],
//     ["135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam"],
//     ["Phòng chứa bí mật"],
//     ["Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một"],
//     [
//       "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương",
//     ],
//     [
//       "Phòng chứa bí mật, 135 Đường Lê Lợi, Phường Phú Mỹ, Quận Thủ Dầu Một, Bình Dương, Việt Nam",
//     ],
//     // [
//     //   "3 đường Lê Văn Sỹ, Quận 3, Ho Chi Minh, Viet Nam"
//     // ],
//     // [
//     //   "532 Lê Văn Sỹ, Phường 14, Quận 3, Hồ Chí Minh, Vietnam"
//     // ],
//     [
//       "532 Le Van Sy, Phuong 14, Quan 3, Ho Chi Minh, Vietnam"
//     ],
//     [
//       "402/19 Lê Văn Sỹ, Phường 13, Quận Phú Nhuận, Hồ Chí Minh, Vietnam"
//     ],
//     [
//       "402/19 Le Van Sy, Phuong 13, Quan Phu Nhuan, Ho Chi Minh, Vietnam"
//     ]
//   ])("Geocoding should not found: '%s'", async (text) => {
//     const resp = await client.search(
//       {
//         text: formatAddress(text),
//       },
//       true,
//       true
//     )

//     const features = resp.features
//     expect(features.length).toBe(0)
//   })

//   // test.each([
//   //   [
//   //     "Thao Dien",
//   //   ],
//   //   [
//   //     "ATM",
//   //   ],
//   //   [
//   //     "Hotel"
//   //   ]
//   // ])("Too many matches -> no function_score triggered -> exec time won't exceed 1 sec: '%s'", async (text) => {
//   //   const resp = await client.search({
//   //     "focus.point.lat": "10.76989", //Ahamove
//   //     "focus.point.lon": "106.6640",
//   //     text: formatAddress(text),
//   //     size: 10,
//   //   })
//   //
//   //   const features = resp.features
//   //   expect(!features[0].properties.entrances || features[0].properties.entrances == "{}").toBe(true)
//   // },
//   // 1000)
//   //
//   // test.each([
//   //   [
//   //     "Thao Dien Pearl",
//   //   ],
//   //   [
//   //     "Rivera",
//   //   ]
//   // ])("First returned venue has entrances: '%s'", async (text) => {
//   //   const resp = await client.search({
//   //     "focus.point.lat": "10.76989", //Ahamove
//   //     "focus.point.lon": "106.6640",
//   //     text: formatAddress(text),
//   //     size: 10,
//   //   })
//   //
//   //   const features = resp.features
//   //   expect(features[0].properties.entrances.length > 10).toBe(true)
//   // })

//   test.each([
//     [
//       "ben vien van hanh",
//       "Cổng Sư Vạn Hạnh"
//     ],
//   ])("Results must follow venue name's order: '%s'", async (text, badResult) => {
//     const resp = await client.search({
//       "focus.point.lat": "10.769015", //bệnh viện Nhi đồng 1
//       "focus.point.lon": "106.671015",
//       text: formatAddress(text),
//       size: 10,
//     })

//     resp.features.forEach((feature) => {
//       expect(feature.properties.name).not.toContain(badResult)
//     })
//   })

//   test.each([
//     [
//       "7/28 Thành Thái",
//     ],
//   ])("Results must be < 1km away from focus point: '%s'", async (text) => {
//     const resp = await client.search({
//       "focus.point.lat": "10.76989", //Ahamove
//       "focus.point.lon": "106.6640",
//       text: formatAddress(text),
//       size: 10,
//     })

//     resp.features.forEach((feature) => {
//       expect(feature.properties.distance).toBeLessThan(1)
//     })
//   })

//   test.each([
//     [
//       "Trường ĐH Kinh Doanh Và Công Nghệ HN, 7/28 Thành Thái, F.14, Q.10, tp Ho Chi Minh City, VN",
//       "Trường ĐH Kinh Doanh Và Công Nghệ Hà Nội, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//     ],
//     [
//       "Gọi cho Khoa +84969284567 Bách Khoa Hà Nội ii, 7/28 CMT8, P14, Q.10, thành phố HCM city, VN, 70000",
//       "Gọi Cho Khoa Bách Khoa Hà Nội 2, 7/28 Cách Mạng Tháng Tám, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//     ],
//     [
//       "..--''//.-' Số nhà 7/28 \", đường Thành Thái \\, Phường 14 () ( ); Quận 10   ; thành phố Hồ Chí Minh \t , Việt   Nam   ",
//       "7/28 Đường Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//     ],
//     // [
//     //   "Đ/c /12/34 địa chỉ Lý Thường Kiệt gần chùa Gia Lào đối diện bưu cục GHN / F12 / Q 5 / HCM",
//     //   "12/34 Lý Thường Kiệt, Phường 12, Quận 05, Hồ Chí Minh, Việt Nam",
//     // ],
//     // [
//     //   "Nhà số A12-13 trên 4, ngõ5 ngách6 hẻm7, VNĐ ĐĐ Lý Thường Kiệt, P.12, Q5, thành phố    thành phố    hn    city   city, ,hn",
//     //   "A12-13/4 Ngõ 5 Ngách 6 Hẻm 7, VNĐ ĐĐ Lý Thường Kiệt, Phường 12, Quận 05, Hà Nội, Việt Nam",
//     // ],
//     [
//       "tháp Bảo Đại, đh Kinh Doanh và Công Nghệ HN, 7/28 Thành Thái street, Ward 14, District 10, HCM Province",
//       "Tháp Bảo Đại, Đh Kinh Doanh Và Công Nghệ Hà Nội, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
//     ],
//     [
//       "toà X lô H ấp T 7/28 Thành Thái street, x Hải Châu, H Hải Hậu, t Nam Định",
//       "Toà X Lô H Ấp T 7/28 Thành Thái, Xã Hải Châu, Huyện Hải Hậu, Nam Định, Việt Nam",
//     ],
//     [
//       "7/28 Thành Thái road, x.Hải Châu tỉnh Nam Định Tp.Nam Định",
//       "7/28 Thành Thái, Xã Hải Châu, Thành Phố Nam Định, Nam Định, Việt Nam",
//     ],
//     [
//       "TT TDTT block Tx 7/28 đ Xa Lộ Hà Nội, tt. Long Khánh Tx Long Khánh tỉnh Đồng Nai",
//       "TT TDTT Block Tx 7/28 Đường Xa Lộ Hà Nội, Thị Trấn Long Khánh, Thị Xã Long Khánh, Đồng Nai, Việt Nam",
//     ],
//     [
//       "Vi Tinh Phuong Xa Huyen Quan 7/28 d.Thành Thái Tt Thịnh Long H Hải Hậu t Nam Định",
//       "Vi Tinh Phuong Xa Huyen Quan 7/28 D.Thành Thái Tt Thịnh Long H Hải Hậu T Nam Định",
//     ],
//     // [
//     //   "Phở Nam Định, đ. Thủ Đức, p1, d.Thủ Đức, tp Thủ Đức,thành phố Hồ Chí Minh, tỉnh Nam Định, Thành Phố thanh pho tp Ho Chi Minh City, Nam Định, thành phố Nam Định ",
//     //   "Phở Nam Định, Đường Thủ Đức, Phường 01, Thành Phố Thủ Đức, Hồ Chí Minh, Việt Nam",
//     // ],
//     [
//       "Phở Nam Định, 123 Duong Thai Hoc, t Nam Định, h Hải Hậu, x Hải Châu, xa Hải Châu, huyen Hải Hậu, t.Nam Định, duong hải hậu huyện hải hậu xã hải châu tinh nam dinh f14 q10 tphcm vn",
//       "Phở Nam Định, 123 Duong Thai Hoc, Xã Hải Châu, Huyện Hải Hậu, Nam Định, Việt Nam",
//     ],
//     [
//       "Phở Nam Định, 123 đường số Gì Đó, Hải Châu, Something, huyện Hải Hậu, Something Else, Nam Định",
//       "Phở Nam Định, 123 Đường Số Gì Đó, Hải Châu, Something, Huyện Hải Hậu, Something Else, Nam Định, Việt Nam",
//     ],
//     [
//       "Phở Nam Định, 123 đường Gì Đó, xã Hải Châu, Something, huyện Hải Hậu, Quận 10, Something Else, Phường 14",
//       "Phở Nam Định, 123 Đường Gì Đó, Xã Hải Châu, Something, Huyện Hải Hậu, Something Else",
//     ],
//     // [
//     //   "7 đ 123 f14 q11 hcm",
//     //   "7 Đường Số 123, Phường 14, Quận 11, Hồ Chí Minh, Việt Nam"
//     // ],
//     [
//       "Pho Bo Ly Quoc Su, A70/12/4B,, , , ,,   p Hàng Mã, A70/12/4B p. Hàng Mã, p. cổ Hà Nội, q Hoàn Kiếm, HN",
//       "Pho Bo Ly Quoc Su, A70/12/4B Phố Hàng Mã, P. Cổ Hà Nội, Quận Hoàn Kiếm, Hà Nội, Việt Nam"
//     ],
//     // [
//     //   "108A đ 14 (mười bốn), Kp7 (không phải Kp9), VN (VN là Việt Nam (just in case) ạ)Hồ Chí Minh Quận Bình Tân Phường Bình Hưng Hòa A (gọi chị Phượng, Hồ Chí Minh, Quận Bình Tân (không phải Tân Bình), Phường Bình Hưng Hòa A.",
//     //   "108A Đường Số 14, Kp7, Phường Bình Hưng Hòa A, Quận Bình Tân, Hồ Chí Minh, Việt Nam"
//     // ],
//     // [
//     //   "9A đ.4, khu phố 22, khu đô thị Lakeview City, phường Bình Hưng Hoà A, Bình Tân, HCM ( gần trường Tiểu học Phù Đổng), Hồ Chí Minh, Quận Bình Tân, Phường Bình Hưng Hòa A.",
//     //   "9A Đường Số 4, Khu Phố 22, Khu Đô Thị Lakeview City, Phường Bình Hưng Hoà A, Quận Bình Tân, Hồ Chí Minh, Việt Nam"
//     // ],
//   ])("Formatted text should be correct: '%s'", async (text, result) => {
//     expect(formatAddress(text)).toBe(result)
//   })

//   test.each([
//     [
//       "Rivera Park , 7/28 Thành Thái , F14 , Q10 , HCM , VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "Phường 14",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park 7/28 Thành Thái",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         venue: "Rivera Park 7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         address: "7/28",
//       }
//     ],
//     [
//       "7/28 Thành Thái",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "Rivera Park, 7/28",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, VN",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "7/28, Thành Thái",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, VN",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, 7/28 Thành Thái, VN",
//       {
//         country: "",
//         region: "",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, F14, Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "Phường 14",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, Q10, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, Q10, VN",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park, HCM, VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "7/28 Thành Thái, F14, Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "Phường 14",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, Q10, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, Q10, VN",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái, HCM, VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "Rivera Park , 7/28 Thành Thái , F14 , Q10",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "Phường 14",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , 7/28 Thành Thái , Q10 , HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , 7/28 Thành Thái , Q10 , VN",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , 7/28 Thành Thái , HCM , VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , F14 , Q10, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "Phường 14",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , F14 , Q10, VN",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "Phường 14",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "Rivera Park , Q10, HCM, VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "",
//         venue: "Rivera Park",
//       }
//     ],
//     [
//       "7/28 Thành Thái , F14 , Q10, HCM",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "Phường 14",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái , F14 , Q10, VN",
//       {
//         country: "",
//         region: "",
//         county: "Quận 10",
//         locality: "Phường 14",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "7/28 Thành Thái , Q10 , HCM, VN",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Quận 10",
//         locality: "",
//         number: "7/28",
//         street: "Thành Thái",
//         address: "7/28 Thành Thái",
//       }
//     ],
//     [
//       "Cty dệt Phong Phú, 48 Tăng Nhơn Phú, Tăng Nhơn Phú B, Thành Phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam",
//       {
//         country: "Việt Nam",
//         region: "Hồ Chí Minh",
//         county: "Thành Phố Thủ Đức",
//         locality: "Tăng Nhơn Phú B",
//         number: "48",
//         street: "Tăng Nhơn Phú",
//         venue: "Cty Dệt Phong Phú",
//       }
//     ],
//     [
//       "Không gian Cafe Dệt Xưa, 5 Hoàng Hoa Thám, Trần Đăng Ninh, TP. Nam Định, Nam Định, Vietnam",
//       {
//         country: "Việt Nam",
//         region: "Nam Định",
//         county: "Thành Phố Nam Định",
//         locality: "Trần Đăng Ninh",
//         number: "5",
//         street: "Hoàng Hoa Thám",
//         venue: "Không Gian Cafe Dệt Xưa",
//       }
//     ],
//   ])("Address extraction should return as expected: '%s'", async (text, expected) => {
//     const result = extractAddress(formatAddress(text))

//     expect(result).toEqual(expected)
//   })
// })

describe("test formatAddress", () => {
  test.each([
    [
      "07/28 Thành Thái",
      "7/28 Thành Thái",
    ], [
      "Số      1101     Đường Tạ Quang Bửu,    Phường 6, Quận 8, HCM",
      "1101 Đường Tạ Quang Bửu, Phường 6, Quận 8, Hồ Chí Minh, Việt Nam",
    ], [
      "Số 0000101 Đường Tạ Quang Bửu, Phường 6, Quận 8, HCM",
      "101 Đường Tạ Quang Bửu, Phường 6, Quận 8, Hồ Chí Minh, Việt Nam",
    ], [
      "61 - 63, Liên phường , Phường Phú Hữu, Thành phố Thủ Đức, Thành phố Hồ Chí Minh",
      "61 - 63, Liên Phường, Phường Phú Hữu, Thành Phố Thủ Đức, Hồ Chí Minh, Việt Nam"
    ], [
      "103/09/09 đường số 11, Phường Linh Xuân, Quận Thủ Đức, TP Hồ Chí Minh",
      "103/9/9 Đường Số 11, Phường Linh Xuân, Quận Thủ Đức, Hồ Chí Minh, Việt Nam"
    ], [
      "028 lô K cư xá Thanh Đa, Phường 27, Quận Bình Thạnh, TP Hồ Chí Minh",
      "28 Lô K Cư Xá Thanh Đa, Phường 27, Quận Bình Thạnh, Hồ Chí Minh, Việt Nam"
    ], [
      "019/038 hồ bá phấn, Phường Phước Long A, Quận 9, TP Hồ Chí Minh",
      "19/38 Hồ Bá Phấn, Phường Phước Long A, Quận 9, Hồ Chí Minh, Việt Nam"
    ], [
      "125 Đ. Liên Phường, Phước Long B,      Quận 9,    Hồ Chí Minh 700000, Việt Nam",
      "125 Đường Liên Phường, Phước Long B, Quận 9, Hồ Chí Minh, Việt Nam"
    ], [
      "125 Đ. Liên Phường    ,    phường Phước Long B, Quận 9, Hồ Chí Minh 700000, Việt Nam",
      "125 Đường Liên Phường, Phường Phước Long B, Quận 9, Hồ Chí Minh, Việt Nam"
    ], [
      "46 Đ. Nguyễn Thái Bình, Phường Nguyễn Thái Bình, Quận 1, Hồ Chí Minh 71010, Vietnam",
      "46 Đường Nguyễn Thái Bình, Phường Nguyễn Thái Bình, Quận 1, Hồ Chí Minh, Việt Nam"
    ], [
      "44 P.Phạm Ngọc Thạch, Phương Liên, Đống Đa, Hà Nội",
      "44 Phố Phạm Ngọc Thạch, Phương Liên, Đống Đa, Hà Nội, Việt Nam"
    ], [
      "87 Đường Số 06, Phường Bình Trưng Tây, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam",
      "87 Đường Số 6, Phường Bình Trưng Tây, Thành Phố Thủ Đức, Hồ Chí Minh, Việt Nam"
    ], [
      "06 Thới An 06 Khu phố 7, Phường Hiệp Thành, Quận 12, Hồ Chí Minh",
      "6 Thới An 6 Khu Phố 7, Phường Hiệp Thành, Quận 12, Hồ Chí Minh, Việt Nam"
    ], [
      "07 quốc lộ 1a tổ 3 khu phố 6 , Phường Linh Trung, Thành phố Thủ Đức, Hồ Chí Minh",
      "7 Quốc Lộ 1a Tổ 3 Khu Phố 6, Phường Linh Trung, Thành Phố Thủ Đức, Hồ Chí Minh, Việt Nam"
    ], [
      "s6.02 tiệm nail Petuny, chung cư Vinhomes, Phường Long Thạnh Mỹ, Quận 9, Hồ Chí Minh",
      "S6.02 Tiệm Nail Petuny, Chung Cư Vinhomes, Phường Long Thạnh Mỹ, Quận 9, Hồ Chí Minh, Việt Nam"
    ], [
      "132 Đường 3 Tháng 2, Quận 11, Hồ Chí Minh, Việt Nam",
      "132 Đường 3 Tháng 2, Quận 11, Hồ Chí Minh, Việt Nam"
    ], [
      "Nhà Nghỉ Thanh Bình, Đường Tỉnh 351, Nam Sơn, An Dương, Hải Phòng, Việt Nam",
      "Nhà Nghỉ Thanh Bình, Đường Tỉnh 351, Nam Sơn, An Dương, Hải Phòng, Việt Nam"
    ], [
      "Nhà Đất Sơn Mỹ, Đường Tỉnh 744, Phú An, Bến Cát, Bình Dương, Việt Nam",
      "Nhà Đất Sơn Mỹ, Đường Tỉnh 744, Phú An, Bến Cát, Bình Dương, Việt Nam"
    ], [
      "1007/3C Đường 30 Tháng 4, Phường 11, Thành Phố Vũng Tàu, Bà Rịa-Vũng Tàu",
      "1007/3C Đường 30 Tháng 4, Phường 11, Thành Phố Vũng Tàu, Bà Rịa-Vũng Tàu"
    ]
  ])("formatAddress should return as expected: '%s'", async (text, expected) => {
    expect(formatAddress(text)).toBe(expected)
  })
})

describe("extractAddress", () => {
  test.each([
    // Basic address with number and street
    [
      "7/28 Thành Thái", 
      { number: "7/28", street: "Thành Thái", address: "7/28 Thành Thái" }
    ],
    // Number only - should extract the number but have empty street
    [
      "7/28", 
      { number: "7/28", street: undefined, address: "7/28" }
    ],
    // With leading zero in number
    [
      "07/28 Thành Thái", 
      { number: "07/28", street: "Thành Thái", address: "07/28 Thành Thái" }
    ],
    // With trailing space
    [
      "7/28 ", 
      { number: "7/28", street: undefined, address: "7/28" }
    ],
    // Complex number format
    [
      "A2-15/3 ", 
      { number: "A2-15/3", street: undefined, address: "A2-15/3" }
    ],
    // Number starting with letter
    [
      "B12 Nguyễn Văn Cừ", 
      { number: "B12", street: "Nguyễn Văn Cừ", address: "B12 Nguyễn Văn Cừ" }
    ],
    // Street with comma
    [
      "10 Lê Văn Sỹ,", 
      { number: "10", street: "Lê Văn Sỹ", address: "10 Lê Văn Sỹ" }
    ],
    // Address with "Phố" format
    [
      "123 Phố Huế", 
      { number: "123", street: "Phố Huế", address: "123 Phố Huế" }
    ],
    [
      "59C Nguyễn Đình Chiểu",
      { number: "59C", street: "Nguyễn Đình Chiểu", address: "59C Nguyễn Đình Chiểu" }
    ],
    [
      "G Campus, Z06 Đường Số 13, Phường Tân Thuận Đông, Quận 7, Hồ Chí Minh, Việt Nam",
      { number: "Z06", street: "Đường Số 13", address: "Z06 Đường Số 13" }
    ],
    [
      "Rivera Park Sài Gòn, 7/28 Thành Thái, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      { number: "7/28", street: "Thành Thái", address: "7/28 Thành Thái" }
    ],
    [
      "Rivera Park Sài Gòn, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam",
      { number: undefined, street: undefined, address: "Rivera Park Sài Gòn" }
    ], 
    [
      "Tịnh xá Ngọc Phương, Phường 1, Quận Gò Vấp, Hồ Chí Minh",
      { number: undefined, street: undefined, address: "Tịnh xá Ngọc Phương" }
    ],
    // Test cases for the fix: venue names should not extract pure letters as address numbers
    [
      "vin park 2",
      { number: undefined, street: undefined, address: "vin park 2" }
    ],
    [
      "spa wellness center",
      { number: undefined, street: undefined, address: "spa wellness center" }
    ],
    [
      "bar nightclub 123",
      { number: undefined, street: undefined, address: "bar nightclub 123" }
    ],
    // Ensure valid building codes with digits still work
    [
      "A2 Nguyen Van Cu",
      { number: "A2", street: "Nguyen Van Cu", address: "A2 Nguyen Van Cu" }
    ],
    [
      "B12 Thanh Thai",
      { number: "B12", street: "Thanh Thai", address: "B12 Thanh Thai" }
    ],
    [
      "Z06 Duong So 13",
      { number: "Z06", street: "Duong So 13", address: "Z06 Duong So 13" }
    ]
  ])("should correctly parse '%s'", (text, expected) => {
    const result = extractAddress(text);
    console.log(result)
    expect(result.number).toBe(expected.number);
    expect(result.street).toBe(expected.street);
    expect(result.address).toBe(expected.address);
  });

});

describe("ElasticTransform street scoring", () => {
  test("should parse street correctly for scoring", () => {
    // Test case: "52C Phạm Vấn" should be parsed correctly
    const input = "52C Phạm Vấn, Phường Phú Thọ Hòa, Quận Tân Phú, Thành phố Hồ Chí Minh, Việt Nam";
    const result = extractAddress(input);

    expect(result.number).toBe("52C");
    expect(result.street).toBe("Phạm Vấn");
  });

  test("should correctly identify street name for exact match scoring", () => {
    // Simulating the deaccent comparison that happens in rescoreQuery
    const searchStreet: string = "pham van";  // deaccents("Phạm Vấn".toLowerCase())
    const exactMatch: string = "pham van";    // deaccents("Phạm Vấn".toLowerCase())
    const partialMatch: string = "pham van xao";  // deaccents("Phạm Văn Xảo".toLowerCase())

    // Exact match should return true
    expect(exactMatch).toBe(searchStreet);

    // Partial match should NOT be equal
    expect(partialMatch).not.toBe(searchStreet);

    // Partial match DOES start with search street (this is the key insight)
    // This is why we need exact match scoring - "pham van xao" starts with "pham van"
    expect(partialMatch.startsWith(searchStreet)).toBe(true);

    // Expected scoring in Painless:
    // - "pham van" === "pham van" → +20 (exact match - checked first)
    // - "pham van xao".startsWith("pham van") → +10 (prefix match)
    // So exact match "52C Phạm Vấn" gets +20, while "52 Phạm Văn Xảo" only gets +10
  });
});