import { removePlacePrefix, hasPlacePrefix, getPlacePrefixes } from "../../src/utils/remove-place-prefix.js";

describe("removePlacePrefix", () => {
  describe("building prefixes", () => {
    it.each([
      ["Toa nha Rivera Park", "Rivera Park"],
      ["Tòa nhà Rivera Park", "Rivera Park"],
      ["Toà nhà Vincom Center", "Vincom Center"],
      ["Cao ốc AB Tower", "AB Tower"],
      ["Cao oc Bitexco", "Bitexco"],
      ["Chung cư Vinhomes", "Vinhomes"],
      ["Chung cu The Manor", "The Manor"],
      ["Căn hộ Sunrise City", "Sunrise City"],
      ["Building Saigon Centre", "Saigon Centre"],
      ["Tower Landmark 81", "Landmark 81"],
    ])('removes building prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("hotel prefixes", () => {
    it.each([
      ["Khách sạn Hilton", "Hilton"],
      ["Khach san Rex", "Rex"],
      ["Hotel Caravelle", "Caravelle"],
      ["Resort Furama", "Furama"],
      ["Villa Aria", "Aria"],
      ["Homestay Dalat", "Dalat"],
      ["Nhà nghỉ Thanh Bình", "Thanh Bình"],
    ])('removes hotel prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("commercial prefixes", () => {
    it.each([
      ["Trung tâm thương mại Aeon", "Aeon"],
      ["TTTM Vincom", "Vincom"],
      ["Trung tâm SECC", "SECC"],
      ["Siêu thị Big C", "Big C"],
      ["Sieu thi Lotte", "Lotte"],
      ["Cửa hàng Apple", "Apple"],
      ["Shop Uniqlo", "Uniqlo"],
      ["Showroom Honda", "Honda"],
    ])('removes commercial prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("healthcare prefixes", () => {
    it.each([
      ["Bệnh viện Nhi Đồng 1", "Nhi Đồng 1"],
      ["Benh vien Cho Ray", "Cho Ray"],
      ["BV 115", "115"],
      ["Phòng khám Đa Khoa", "Đa Khoa"],
      ["Nhà thuốc Long Châu", "Long Châu"],
    ])('removes healthcare prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("food & beverage prefixes", () => {
    it.each([
      ["Nhà hàng Ngon", "Ngon"],
      ["Nha hang Ben Nha Rong", "Ben Nha Rong"],
      ["Quán Bún Bò", "Bún Bò"],
      ["Quán cà phê Highlands", "Highlands"],
      ["Cafe The Coffee House", "The Coffee House"],
      ["Bar Chill", "Chill"],
      ["Restaurant Xu", "Xu"],
    ])('removes F&B prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("education prefixes", () => {
    it.each([
      ["Trường Đại học Bách Khoa", "Bách Khoa"], // "trường đại học" is the longest match
      ["Trường Tiểu Học ABC", "Tiểu Học ABC"], // "trường" prefix
      ["Đại học Kinh Tế", "Kinh Tế"],
      ["Dai hoc Quoc Gia", "Quoc Gia"],
      ["Học viện Công nghệ", "Công nghệ"],
      ["School ABC", "ABC"],
      ["University of Science", "of Science"],
    ])('removes education prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("transportation prefixes", () => {
    it.each([
      ["Sân bay Tân Sơn Nhất", "Tân Sơn Nhất"],
      ["San bay Noi Bai", "Noi Bai"],
      ["Bến xe Miền Đông", "Miền Đông"],
      ["Ga Sài Gòn", "Sài Gòn"],
      ["Nhà ga Hà Nội", "Hà Nội"],
      ["Cảng Cát Lái", "Cát Lái"],
    ])('removes transportation prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("entertainment prefixes", () => {
    it.each([
      ["Công viên Đầm Sen", "Đầm Sen"],
      ["Cong vien Gia Dinh", "Gia Dinh"],
      ["Rạp chiếu phim CGV", "CGV"],
      ["Sân vận động Mỹ Đình", "Mỹ Đình"],
    ])('removes entertainment prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("industrial & office prefixes", () => {
    it.each([
      ["Khu công nghiệp Tân Bình", "Tân Bình"],
      ["KCN Long Hậu", "Long Hậu"],
      ["Nhà máy Samsung", "Samsung"],
      ["Văn phòng Google", "Google"],
      ["Office WeWork", "WeWork"],
    ])('removes industrial/office prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("religious prefixes", () => {
    it.each([
      ["Chùa Một Cột", "Một Cột"],
      ["Nhà thờ Đức Bà", "Đức Bà"],
      ["Đền Hùng", "Hùng"],
      ["Đình làng Cổ", "làng Cổ"],
    ])('removes religious prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("government prefixes", () => {
    it.each([
      ["UBND Quận 1", "Quận 1"],
      ["Ủy ban Nhân dân", "Nhân dân"],
      ["Công an Phường 5", "Phường 5"],
      ["Bưu điện Trung tâm", "Trung tâm"],
    ])('removes government prefix: "%s" -> "%s"', (input, expected) => {
      expect(removePlacePrefix(input)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("returns original name when no prefix found", () => {
      expect(removePlacePrefix("Rivera Park")).toBe("Rivera Park");
      expect(removePlacePrefix("Landmark 81")).toBe("Landmark 81");
      expect(removePlacePrefix("Bitexco Financial Tower")).toBe("Bitexco Financial Tower");
    });

    it("handles empty and null inputs", () => {
      expect(removePlacePrefix("")).toBe("");
      expect(removePlacePrefix("   ")).toBe("");
      expect(removePlacePrefix(null as unknown as string)).toBe(null);
      expect(removePlacePrefix(undefined as unknown as string)).toBe(undefined);
    });

    it("trims whitespace", () => {
      expect(removePlacePrefix("  Toa nha ABC  ")).toBe("ABC");
      expect(removePlacePrefix("  Rivera Park  ")).toBe("Rivera Park");
    });

    it("is case insensitive", () => {
      expect(removePlacePrefix("TOA NHA ABC")).toBe("ABC");
      expect(removePlacePrefix("toa nha ABC")).toBe("ABC");
      expect(removePlacePrefix("Toa Nha ABC")).toBe("ABC");
      expect(removePlacePrefix("KHACH SAN Hilton")).toBe("Hilton");
    });

    it("only removes prefix at the start", () => {
      expect(removePlacePrefix("ABC Toa nha XYZ")).toBe("ABC Toa nha XYZ");
      expect(removePlacePrefix("Vincom Trung tâm")).toBe("Vincom Trung tâm");
    });

    it("returns original when prefix is the entire string", () => {
      expect(removePlacePrefix("Khách sạn")).toBe("Khách sạn");
      expect(removePlacePrefix("Bệnh viện")).toBe("Bệnh viện");
    });

    it("handles single word after prefix", () => {
      expect(removePlacePrefix("Chùa Bái")).toBe("Bái");
      expect(removePlacePrefix("Ga HN")).toBe("HN");
    });
  });
});

describe("hasPlacePrefix", () => {
  it("returns true for names with prefixes", () => {
    expect(hasPlacePrefix("Toa nha Rivera Park")).toBe(true);
    expect(hasPlacePrefix("Khách sạn Hilton")).toBe(true);
    expect(hasPlacePrefix("Bệnh viện Nhi Đồng 1")).toBe(true);
  });

  it("returns false for names without prefixes", () => {
    expect(hasPlacePrefix("Rivera Park")).toBe(false);
    expect(hasPlacePrefix("Hilton Hotel")).toBe(false);
    expect(hasPlacePrefix("123 Nguyen Hue")).toBe(false);
  });

  it("handles edge cases", () => {
    expect(hasPlacePrefix("")).toBe(false);
    expect(hasPlacePrefix(null as unknown as string)).toBe(false);
    expect(hasPlacePrefix(undefined as unknown as string)).toBe(false);
  });
});

describe("getPlacePrefixes", () => {
  it("returns an array of prefixes", () => {
    const prefixes = getPlacePrefixes();
    expect(Array.isArray(prefixes)).toBe(true);
    expect(prefixes.length).toBeGreaterThan(0);
  });

  it("includes common prefixes", () => {
    const prefixes = getPlacePrefixes();
    expect(prefixes).toContain("tòa nhà");
    expect(prefixes).toContain("khách sạn");
    expect(prefixes).toContain("bệnh viện");
    expect(prefixes).toContain("trung tâm");
  });
});
