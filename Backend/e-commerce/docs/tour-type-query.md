# Tour Type API — Tài liệu cho Frontend

## Danh sách API liên quan

| Method | Endpoint         | Mô tả                                          |
|--------|------------------|------------------------------------------------|
| GET    | `/tours/by-type` | Lọc tour theo loại hình (có phân trang)        |
| GET    | `/tours/newest`  | Tour mới nhất theo ngày tạo (có phân trang)    |
| GET    | `/tours/hot`     | Tour có rating cao nhất (có phân trang)        |
| GET    | `/tours/popular` | Tour nhiều người đặt nhất (có phân trang)      |

---

## 1. GET `/tours/by-type`

### Query Parameters (đầu vào)

| Tham số   | Kiểu    | Bắt buộc | Mô tả                                                         |
|-----------|---------|----------|---------------------------------------------------------------|
| `country` | string  | Không    | Cấp 1 — loại hình tour. Phải khớp chính xác (xem bảng dưới) |
| `region`  | string  | Không    | Cấp 2 — khu vực/châu lục. Phải khớp chính xác               |
| `city`    | string  | Không    | Cấp 3 — tìm kiếm **chứa chuỗi con**, không phân biệt hoa thường |
| `page`    | number  | Không    | Trang hiện tại. Mặc định: `1`                                 |
| `limit`   | number  | Không    | Số tour mỗi trang. Mặc định: `10`, tối đa: `100`             |

#### Quy tắc lọc phân cấp

Có thể truyền 1, 2 hoặc 3 tham số. Các tham số **độc lập nhau** — không bắt buộc phải truyền cấp trên mới dùng được cấp dưới.

| Tham số truyền vào                          | Hành vi                                                      |
|---------------------------------------------|--------------------------------------------------------------|
| `country=Trong nước`                        | Toàn bộ tour trong nước                                     |
| `country=Trong nước&region=Miền Bắc`        | Tour trong nước, khu vực Miền Bắc                           |
| `country=Trong nước&region=Miền Bắc&city=Hà Nội` | Tour trong nước, Miền Bắc, điểm đến có chứa "Hà Nội"  |
| `city=Huế`                                  | Tất cả tour có `tourCity` **chứa** "Huế" (bất kể country/region) |

#### Giá trị hợp lệ cho `country`

> Phải truyền **đúng chính xác** (phân biệt dấu, hoa thường).

| Giá trị      | Ý nghĩa               |
|--------------|-----------------------|
| `Trong nước` | Tour nội địa Việt Nam |
| `Nước ngoài` | Tour quốc tế          |

#### Giá trị hợp lệ cho `region`

> Phải truyền **đúng chính xác**.

| Giá trị      | Thuộc `country`  |
|--------------|-----------------|
| `Miền Bắc`   | `Trong nước`    |
| `Miền Trung` | `Trong nước`    |
| `Miền Nam`   | `Trong nước`    |
| `Châu Á`     | `Nước ngoài`    |
| `Châu Âu`    | `Nước ngoài`    |
| `Châu Phi`   | `Nước ngoài`    |

#### Cách tìm kiếm `city` (contains)

`city` **không cần khớp chính xác** — hệ thống tìm tất cả tour có `tourCity` chứa chuỗi đó.

| Giá trị truyền vào | Khớp với `tourCity` trong DB            |
|--------------------|-----------------------------------------|
| `Huế`              | `"Đà Nẵng - Huế - Quảng Bình"` ✓       |
| `Đà Lạt`           | `"Lâm Đồng(Đà Lạt)"` ✓                 |
| `Lâm Đồng`         | `"Lâm Đồng(Đà Lạt)"` ✓                 |
| `Hà Giang`         | `"Hà Giang - Cao Bằng - Bắc Kạn"` ✓   |
| `Kenya`            | `"Kenya - Tanzania"` ✓                  |

#### Ví dụ request

```
GET /tours/by-type?country=Trong nước
GET /tours/by-type?country=Trong nước&region=Miền Bắc
GET /tours/by-type?city=Huế
GET /tours/by-type?city=Đà Lạt
GET /tours/by-type?country=Trong nước&region=Miền Trung&city=Đà Nẵng&page=1&limit=5
```

---

## 2. GET `/tours/newest`

### Query Parameters (đầu vào)

| Tham số | Kiểu   | Bắt buộc | Mô tả                              |
|---------|--------|----------|------------------------------------|
| `page`  | number | Không    | Trang hiện tại. Mặc định: `1`      |
| `limit` | number | Không    | Số tour mỗi trang. Mặc định: `10` |

Sắp xếp theo `createdAt` giảm dần — tour được thêm vào hệ thống mới nhất sẽ lên đầu.

---

## 3. GET `/tours/hot`

### Query Parameters (đầu vào)

| Tham số | Kiểu   | Bắt buộc | Mô tả                              |
|---------|--------|----------|------------------------------------|
| `page`  | number | Không    | Trang hiện tại. Mặc định: `1`      |
| `limit` | number | Không    | Số tour mỗi trang. Mặc định: `10` |

Sắp xếp theo `rating` giảm dần.

---

## 4. GET `/tours/popular`

### Query Parameters (đầu vào)

| Tham số | Kiểu   | Bắt buộc | Mô tả                              |
|---------|--------|----------|------------------------------------|
| `page`  | number | Không    | Trang hiện tại. Mặc định: `1`      |
| `limit` | number | Không    | Số tour mỗi trang. Mặc định: `10` |

Sắp xếp theo số lượng booking giảm dần, nếu bằng nhau thì tour mới hơn lên trước.

---

## Response (đầu ra) — chung cho cả 4 API

Cả 4 endpoint đều trả về cùng 1 cấu trúc `PaginatedResponse`:

```json
{
  "items": [ /* mảng Tour */ ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Cấu trúc 1 Tour trong `items`

```json
{
  "id": "uuid-string",
  "name": "Du lịch Đà Nẵng - Huế - Quảng Bình 4N3Đ",
  "imageUrl": "https://res.cloudinary.com/.../image.jpg",
  "imagePublicId": "tours/abc123",
  "duration": "4 Ngày 3 Đêm",
  "rating": 4.8,
  "reviewsCount": 120,
  "hasVat": true,
  "departureFrom": "TP. Hồ Chí Minh",
  "transport": "Máy bay",
  "included": [
    "Vé máy bay khứ hồi",
    "Khách sạn 3 sao",
    "Xe đưa đón"
  ],
  "notIncluded": [
    "Chi phí cá nhân",
    "Tiền tip"
  ],
  "notes": "Lịch bay có thể thay đổi.",
  "tourCountry": "Trong nước",
  "tourRegion": "Miền Trung",
  "tourCity": "Đà Nẵng - Huế - Quảng Bình",
  "bookingCount": 35,
  "schedules": [
    {
      "id": "uuid-string",
      "dayNumber": 1,
      "title": "TP.HCM - ĐÀ NẴNG - HỘI AN",
      "morning": "Xe và HDV đón khách tại sân bay",
      "noon": "Ăn trưa tại nhà hàng địa phương",
      "afternoon": "Tham quan phố cổ Hội An",
      "evening": "Dạo phố đèn lồng Hội An",
      "night": "Nghỉ đêm tại Đà Nẵng",
      "meals": ["Trưa", "Tối"]
    }
  ],
  "departures": [
    {
      "tourCode": "BTTDLHN20260715",
      "tourId": "uuid-string",
      "departureDate": "2026-07-15T00:00:00.000Z",
      "availableSeats": 20,
      "price": 6590000
    }
  ]
}
```

### Mô tả từng trường

| Trường          | Kiểu       | Nullable | Mô tả                                                        |
|-----------------|------------|----------|--------------------------------------------------------------|
| `id`            | string     | Không    | UUID của tour                                                |
| `name`          | string     | Không    | Tên tour                                                     |
| `imageUrl`      | string     | Không    | URL ảnh đại diện (Cloudinary)                                |
| `imagePublicId` | string     | Không    | Public ID trên Cloudinary (dùng để xóa/cập nhật ảnh)        |
| `duration`      | string     | Không    | Thời gian tour, VD: `"4 Ngày 3 Đêm"`                        |
| `rating`        | number     | Không    | Điểm đánh giá trung bình (0.0 – 5.0)                        |
| `reviewsCount`  | number     | Không    | Tổng số lượt đánh giá                                        |
| `hasVat`        | boolean    | Không    | Tour có bao gồm VAT không                                    |
| `departureFrom` | string     | Không    | Nơi khởi hành, VD: `"TP. Hồ Chí Minh"`                     |
| `transport`     | string     | Không    | Phương tiện, VD: `"Máy bay"`, `"Máy bay & Ô tô"`            |
| `included`      | string[]   | Không    | Mảng dịch vụ đã bao gồm trong giá                           |
| `notIncluded`   | string[]   | Không    | Mảng dịch vụ chưa bao gồm trong giá                         |
| `notes`         | string     | Có       | Lưu ý khác. Trả về `null` nếu không có                      |
| `tourCountry`   | string     | Có       | Cấp 1 loại hình. Trả về `null` nếu chưa gán                |
| `tourRegion`    | string     | Có       | Cấp 2 khu vực. Trả về `null` nếu chưa gán                  |
| `tourCity`      | string     | Có       | Cấp 3 điểm đến. Trả về `null` nếu chưa gán                 |
| `bookingCount`  | number     | Có       | Tổng số booking. Chỉ có ở API `/popular`, còn lại `undefined` |
| `schedules`     | object[]   | Có       | Lịch trình chi tiết theo ngày. `undefined` nếu chưa tải     |
| `departures`    | object[]   | Có       | Danh sách ngày khởi hành. `undefined` nếu chưa tải          |

#### Chi tiết `schedules[]`

| Trường      | Kiểu     | Nullable | Mô tả                                           |
|-------------|----------|----------|-------------------------------------------------|
| `id`        | string   | Không    | UUID của lịch trình                             |
| `dayNumber` | number   | Không    | Số ngày, VD: `1`, `2`, `3`...                  |
| `title`     | string   | Không    | Tiêu đề ngày, VD: `"TP.HCM - HÀ NỘI"`         |
| `morning`   | string   | Có       | Hoạt động buổi sáng                             |
| `noon`      | string   | Có       | Hoạt động buổi trưa                             |
| `afternoon` | string   | Có       | Hoạt động buổi chiều                            |
| `evening`   | string   | Có       | Hoạt động buổi tối                              |
| `night`     | string   | Có       | Thông tin nghỉ đêm                              |
| `meals`     | string[] | Không    | Mảng bữa ăn, VD: `["Sáng", "Trưa", "Tối"]`    |

#### Chi tiết `departures[]`

| Trường           | Kiểu   | Mô tả                                        |
|------------------|--------|----------------------------------------------|
| `tourCode`       | string | Mã chuyến, VD: `"BTTDLHN20260715"`           |
| `tourId`         | string | UUID của tour cha                            |
| `departureDate`  | string | Ngày khởi hành (ISO 8601), VD: `"2026-07-15T00:00:00.000Z"` |
| `availableSeats` | number | Số ghế còn trống                             |
| `price`          | number | Giá mỗi người (VNĐ)                          |

---

## Dữ liệu mẫu hiện có trong DB

| tourCountry  | tourRegion   | tourCity                           |
|--------------|--------------|------------------------------------|
| `Trong nước` | `Miền Bắc`   | `Hà Nội`                           |
| `Trong nước` | `Miền Bắc`   | `Hà Giang - Cao Bằng - Bắc Kạn`   |
| `Trong nước` | `Miền Trung` | `Đà Nẵng`                          |
| `Trong nước` | `Miền Trung` | `Đà Nẵng - Huế - Quảng Bình`      |
| `Trong nước` | `Miền Trung` | `Lâm Đồng(Đà Lạt)`                |
| `Trong nước` | `Miền Trung` | `Đắk Nông`                         |
| `Trong nước` | `Miền Nam`   | `Cần Thơ - Bạc Liêu - Cà Mau`    |
| `Nước ngoài` | `Châu Á`     | `Nhật Bản`                         |
| `Nước ngoài` | `Châu Á`     | `Trung Quốc`                       |
| `Nước ngoài` | `Châu Âu`    | `New Zealand`                      |
| `Nước ngoài` | `Châu Phi`   | `Kenya - Tanzania`                 |

---

## Quy ước nhập liệu `tourCity` (khi tạo tour mới)

| Trường hợp                     | Format                          | Ví dụ                               |
|--------------------------------|---------------------------------|-------------------------------------|
| Một điểm đến                   | Tên thành phố/quốc gia          | `Hà Nội`, `Nhật Bản`               |
| Nhiều điểm đến                 | Ngăn cách bằng ` - `            | `Đà Nẵng - Huế - Quảng Bình`       |
| Tên hành chính + tên thông dụng | `Tên chính thức(Tên phổ biến)` | `Lâm Đồng(Đà Lạt)`                 |
