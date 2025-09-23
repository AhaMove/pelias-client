
import { format } from "./format/vietnam/format";
import { extract } from "./format/vietnam/extract";



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
    ]
  ])("formatAddress should return as expected: '%s'", async (text, expected) => {
    expect(format(text)).toBe(expected)
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
    const result = extract(text);
    expect(result.number).toBe(expected.number);
    expect(result.street).toBe(expected.street);
    expect(result.address).toBe(expected.address);
  });

});

describe("Building Prefix Sanitization", () => {
  test.each([
    // Apartment buildings
    ["Chung cư Rivera Park, 7/28 Thành Thái", "Rivera Park, 7/28 Thành Thái"],
    ["CC Rivera Park, 7/28 Thành Thái", "Rivera Park, 7/28 Thành Thái"],
    ["chung cu Rivera Park", "Rivera Park"],

    // Office buildings
    ["Tòa nhà Vietcombank Tower", "Vietcombank Tower"],
    ["Văn phòng ABC Building", "ABC Building"],
    ["VP Saigon Centre", "Saigon Centre"],

    // High-rises
    ["Cao ốc Landmark 81", "Landmark 81"],
    ["Cao oc The Manor", "The Manor"],

    // Residential areas
    ["Khu dân cư Phú Mỹ Hưng", "Phú Mỹ Hưng"],
    ["KDC Him Lam", "Him Lam"],
    ["Khu đô thị Vinhomes", "Vinhomes"],

    // Villas and townhouses
    ["Biệt thự Thảo Điền", "Thảo Điền"],
    ["Nhà phố Park Riverside", "Park Riverside"],

    // Edge cases
    ["Chung cư, 123 Nguyễn Văn Linh", "123 Nguyễn Văn Linh"],
    ["Chung cư Rivera, 123 Nguyễn Văn Linh", "Rivera, 123 Nguyễn Văn Linh"],

    // Should not remove if not a prefix
    ["Rivera Chung cư Park", "Rivera Chung Cư Park"],
    ["Tower Bridge Restaurant", "Tower Bridge Restaurant"],
  ])("format('%s') = '%s'", (input, expected) => {
    expect(format(input)).toBe(expected);
  });
});

describe("Geocode with building prefixes", () => {
  test.each([
    ["Chung cư Rivera Park, 7/28 Thành Thái, Quận 10", "Rivera Park"],
    ["Tòa nhà Bitexco, 2 Hải Triều, Quận 1", "Bitexco"],
    ["Cao ốc Landmark 81, Vinhomes Central Park", "Landmark 81"],
    ["Khu đô thị Phú Mỹ Hưng, Quận 7", "Phú Mỹ Hưng"],
    ["CC Sunrise City, 23 Nguyễn Hữu Thọ", "Sunrise City"],
  ])("extract('%s') extracts venue '%s'", (address, expectedVenue) => {
    const formattedAddress = format(address);
    const addressParts = extract(formattedAddress);
    expect(addressParts.venue).toBe(expectedVenue);
  });
});