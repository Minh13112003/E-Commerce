# Admin Panel — Tài liệu API cho Next.js

> Base URL: `http://localhost:3000` (hoặc domain production)
> Mọi request cần có header: `Authorization: Bearer <accessToken>` (trừ login/register)
> Admin phải có `role: ADMIN`

---

## Mục lục

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Tours](#3-tours)
4. [Departures (Chuyến khởi hành)](#4-departures)
5. [Bookings](#5-bookings)
6. [Vouchers](#6-vouchers)
7. [Feedbacks](#7-feedbacks)
8. [Notifications](#8-notifications)
9. [Stats — Thống kê Dashboard](#9-stats)
10. [Kiểu dữ liệu chung](#10-kiểu-dữ-liệu-chung)

---

## 1. Auth

### 1.1 Đăng nhập

```
POST /auth/login
```

**Body:**

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

> Lưu `accessToken` vào HttpOnly cookie . Gửi kèm mọi request trong header `Authorization: Bearer <accessToken>`.

---

### 1.2 Refresh token

```
POST /auth/refresh-token
Authorization: Bearer <refreshToken>
```

**Response:** Trả về `accessToken` mới.

---

### 1.3 Đăng xuất

```
POST /auth/logout
Authorization: Bearer <accessToken>
```

---

## 2. Users

> Mọi endpoint đều yêu cầu JWT. Chỉ admin mới xóa được user.

### 2.1 Lấy danh sách tất cả users (Admin)

```
GET /users?page=1&limit=10
```

**Query params:** `page` (mặc định 1), `limit` (mặc định 10)

**Response:** `PaginatedResponse<UserResponseDto>`

```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "role": "USER",
      "phonenumber": "0912345678",
      "age": 25,
      "rewardPoints": 1000000,
      "earnedPoints": 500000,
      "successReferrals": 2,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 2.2 Lấy thông tin 1 user (Admin)

```
GET /users/:id
```

**Response:** `UserResponseDto` (cùng cấu trúc như items[] ở trên)

---

### 2.3 Xóa user (Admin)

```
DELETE /users/:id
```

**Response:**

```json
{ "message": "User deleted successfully" }
```

---

## 3. Tours

### 3.1 Lấy danh sách tất cả tours

```
GET /tours?page=1&limit=10
```

**Response:** `PaginatedResponse<TourResponseDto>` — xem cấu trúc ở [Kiểu dữ liệu chung](#tour-response)

---

### 3.2 Lấy tour mới nhất

```
GET /tours/newest?page=1&limit=10
```

Sort theo `createdAt desc`.

---

### 3.3 Lấy tour bán chạy nhất

```
GET /tours/popular?page=1&limit=10
```

Sort theo `bookingCount desc` (số booking đã COMPLETED).

---

### 3.4 Lấy tour được đánh giá cao nhất

```
GET /tours/hot?page=1&limit=10
```

Sort theo `rating desc`.

---

### 3.5 Lọc tour theo loại

```
GET /tours/by-type?country=Trong nước&region=Miền Nam&city=Đà Lạt&page=1&limit=10
```

| Query     | Mô tả                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------- |
| `country` | `"Trong nước"` hoặc `"Quốc tế"`                                                                     |
| `region`  | Vùng miền: `"Miền Bắc"`, `"Miền Trung"`, `"Miền Nam"`, v.v.                                         |
| `city`    | Tìm kiếm **chứa** (không phân biệt hoa thường). VD: `"Huế"` tìm được `"Đà Nẵng - Huế - Quảng Bình"` |

---

### 3.6 Lấy chi tiết 1 tour

```
GET /tours/:id
```

---

### 3.7 Tạo tour hàng loạt (Admin)

```
POST /tours/bulk
Content-Type: multipart/form-data
```

**Form fields:**

| Field    | Kiểu          | Mô tả                                             |
| -------- | ------------- | ------------------------------------------------- |
| `tours`  | string (JSON) | Mảng tour dạng JSON string (xem bên dưới)         |
| `images` | File[]        | Ảnh cho từng tour, **theo thứ tự** với mảng tours |

**Cấu trúc 1 tour trong `tours` (JSON string):**

```json
[
  {
    "name": "Tour Đà Lạt 3N2Đ",
    "duration": "3 ngày 2 đêm",
    "departureFrom": "TP. Hồ Chí Minh",
    "transport": "Xe khách",
    "hasVat": true,
    "tourCountry": "Trong nước",
    "tourRegion": "Miền Nam",
    "tourCity": "Lâm Đồng(Đà Lạt)",
    "included": ["Khách sạn 3 sao", "Bữa sáng"],
    "notIncluded": ["Vé máy bay", "Chi phí cá nhân"],
    "notes": "Mang theo áo ấm",
    "schedules": [
      {
        "dayNumber": 1,
        "title": "TP.HCM - Đà Lạt",
        "morning": "Khởi hành từ TP.HCM lúc 6h",
        "noon": "Dừng chân ăn trưa tại Bảo Lộc",
        "afternoon": "Tham quan Thung Lũng Tình Yêu",
        "evening": "Nhận phòng khách sạn",
        "night": "Nghỉ đêm tại Đà Lạt",
        "meals": ["Trưa", "Tối"]
      }
    ]
  }
]
```

> `tourCode` cho departure được backend tự sinh.

---

### 3.8 Cập nhật tour (Admin)

```
PATCH /tours/:id
Content-Type: multipart/form-data
```

Tất cả các field đều optional (PartialType của CreateTour). Gửi `image` file nếu muốn đổi ảnh.

---

### 3.9 Xóa tour (Admin)

```
DELETE /tours/:id
```

**Response:**

```json
{ "success": true, "message": "Tour deleted successfully" }
```

---

## 4. Departures

> Chuyến khởi hành cụ thể của một tour (ngày đi, số ghế, giá).

### 4.1 Lấy tất cả departures (có phân trang)

```
GET /departures?page=1&limit=10
```

**Response:** `PaginatedResponse<DepartureResponseDto>`

```json
{
  "items": [
    {
      "id": "uuid",
      "tourCode": "BTTDLHN20260715",
      "tourId": "uuid-tour",
      "departureDate": "2026-07-15T00:00:00.000Z",
      "availableSeats": 20,
      "price": 6590000,
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 4.2 Lấy tất cả departures của 1 tour

```
GET /departures/tour/:tourId
```

**Response:** `DepartureResponseDto[]` (mảng, không phân trang)

---

### 4.3 Lấy chi tiết 1 departure

```
GET /departures/:id
```

---

### 4.4 Tạo departure mới (Admin)

```
POST /departures
```

**Body:**

```json
{
  "tourId": "uuid-tour",
  "departureDate": "2026-07-15T00:00:00.000Z",
  "availableSeats": 30,
  "price": 6590000
}
```

> `tourCode` được backend tự sinh dựa trên tên tour và ngày.

---

### 4.5 Cập nhật departure (Admin)

```
PATCH /departures/:id
```

**Body:** Tất cả optional, chỉ gửi field muốn thay đổi.

```json
{
  "availableSeats": 25,
  "price": 7000000
}
```

---

### 4.6 Xóa departure (Admin)

```
DELETE /departures/:id
```

**Response:**

```json
{ "success": true, "message": "Departure deleted successfully" }
```

---

## 5. Bookings

> Admin quản lý toàn bộ booking, chủ yếu để **cập nhật trạng thái**.
> Trạng thái tự động: PAID → ONGOING → COMPLETED được scheduler xử lý mỗi giờ.

### 5.1 Lấy booking của bản thân (User / Admin)

```
GET /bookings/me?page=1&limit=10
```

---

### 5.2 Lấy lịch sử booking

```
GET /bookings/history
```

---

### 5.3 Lấy chi tiết 1 booking

```
GET /bookings/:id
```

---

### 5.4 Cập nhật trạng thái booking (Admin only)

```
PATCH /bookings/:id/status
```

**Body:**

```json
{ "status": "CONFIRMED" }
```

**Các giá trị `status` hợp lệ:**

| Giá trị     | Ý nghĩa             | Khi nào dùng                         |
| ----------- | ------------------- | ------------------------------------ |
| `PENDING`   | Chờ xác nhận        | Mặc định khi tạo                     |
| `CONFIRMED` | Đã xác nhận         | Admin xác nhận                       |
| `PAID`      | Đã thanh toán       | Sau khi thu tiền                     |
| `ONGOING`   | Đang thực hiện tour | **Tự động** khi đến ngày khởi hành   |
| `COMPLETED` | Hoàn thành          | **Tự động** sau khi hết số ngày tour |
| `CANCELLED` | Đã hủy              | Admin/User hủy — ghế được hoàn       |
| `REFUNDED`  | Đã hoàn tiền        | Sau khi hoàn tiền — ghế được hoàn    |

> Khi `COMPLETED`: user tự động nhận điểm thưởng và `bookingCount` của tour tăng 1.
> Khi `CANCELLED` hoặc `REFUNDED`: ghế tự động được hoàn lại cho departure.

---

### 5.5 Xóa booking

```
DELETE /bookings/:id
```

---

## 6. Vouchers

### 6.1 Lấy danh sách vouchers

```
GET /vouchers?page=1&limit=10
```

- Admin: thấy tất cả voucher
- User thường: chỉ thấy voucher của mình

**Response:** `PaginatedResponse<VoucherResponseDto>`

```json
{
  "items": [
    {
      "id": "uuid",
      "code": "BTT300K",
      "title": "Giảm 10% tối đa 300k",
      "subtitle": "VOUCHER DU LỊCH",
      "expiry": "HSD: 31/12/2026",
      "tag": "SUMMER 2026",
      "description": "Áp dụng cho tất cả tour trong nước.",
      "value": 10,
      "max": 300000,
      "status": true,
      "reuse": false,
      "usercreatedId": "uuid-admin",
      "userId": null
    }
  ],
  "meta": { ... }
}
```

**Mô tả fields:**

| Field    | Kiểu           | Mô tả                                                     |
| -------- | -------------- | --------------------------------------------------------- |
| `value`  | number         | % giảm giá (1–100)                                        |
| `max`    | number \| null | Giảm tối đa X đồng. `null` = không giới hạn               |
| `status` | boolean        | `true` = còn dùng được, `false` = đã dùng/vô hiệu         |
| `reuse`  | boolean        | `true` = dùng được nhiều lần                              |
| `userId` | string \| null | `null` = public cho tất cả. Có giá trị = chỉ user đó dùng |

---

### 6.2 Lấy chi tiết 1 voucher

```
GET /vouchers/:id
```

---

### 6.3 Tạo voucher (Admin)

```
POST /vouchers
```

**Body là mảng** (tạo nhiều voucher cùng lúc):

```json
[
  {
    "code": "SUMMER10",
    "title": "Giảm 10% mùa hè",
    "subtitle": "VOUCHER MÙA HÈ",
    "expiry": "HSD: 31/08/2026",
    "tag": "SUMMER 2026",
    "description": "Áp dụng cho tour trong nước.",
    "value": 10,
    "max": 500000,
    "reuse": false,
    "status": true,
    "userId": null
  }
]
```

**Response:** `VoucherResponseDto[]`

---

### 6.4 Cập nhật voucher (Admin)

```
PATCH /vouchers/:id
```

**Body:** Tất cả optional.

```json
{
  "status": false,
  "max": 200000
}
```

---

### 6.5 Xóa voucher (Admin)

```
DELETE /vouchers/:id
```

---

## 7. Feedbacks

### 7.1 Lấy tất cả feedbacks

```
GET /feedbacks
```

**Response:** `FeedbackResponseDto[]`

```json
[
  {
    "id": "uuid",
    "subject": "Góp ý dịch vụ Tour",
    "content": "Hướng dẫn viên nhiệt tình, tour rất tốt!",
    "userId": "uuid-user",
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  }
]
```

---

### 7.2 Lấy chi tiết 1 feedback

```
GET /feedbacks/:id
```

---

### 7.3 Xóa feedback (Admin)

```
DELETE /feedbacks/:id
```

---

## 8. Notifications

### 8.1 Lấy danh sách notifications

```
GET /notifications?page=1&limit=10
```

---

### 8.2 Đánh dấu tất cả là đã đọc

```
PATCH /notifications/read-all
```

---

### 8.3 Đánh dấu 1 notification đã đọc

```
PATCH /notifications/:id/read
```

---

## 9. Stats — Thống kê Dashboard

> Tất cả endpoint đều yêu cầu `role: ADMIN`.

### 9.1 Tổng quan (Stat Cards)

```
GET /stats/overview
```

Dùng để hiển thị 4–6 stat card ở đầu trang dashboard.

**Response:**

```json
{
  "tourCount": 142,
  "departureCount": 38,
  "bookingCount": 1247,
  "userCount": 856,
  "pendingBookingCount": 34,
  "totalRevenue": 5820000000
}
```

| Trường | Mô tả |
|--------|-------|
| `tourCount` | Tổng số tour |
| `departureCount` | Tổng số chuyến khởi hành |
| `bookingCount` | Tổng số booking (mọi trạng thái) |
| `userCount` | Tổng số người dùng |
| `pendingBookingCount` | Số booking đang chờ xử lý (`PENDING`) |
| `totalRevenue` | Tổng doanh thu từ booking `PAID` + `ONGOING` + `COMPLETED` (đơn vị: đồng VND) |

---

### 9.2 Booking theo tháng — Line Chart

```
GET /stats/bookings/monthly?months=12
```

| Query | Kiểu | Mô tả |
|-------|------|-------|
| `months` | number | Số tháng nhìn lại từ hiện tại. Mặc định: `12` |

**Response:**

```json
[
  { "month": "2025-07", "bookingCount": 42, "revenue": 378000000 },
  { "month": "2025-08", "bookingCount": 67, "revenue": 603000000 },
  { "month": "2025-09", "bookingCount": 55, "revenue": 495000000 },
  { "month": "2025-10", "bookingCount": 80, "revenue": 720000000 },
  { "month": "2025-11", "bookingCount": 91, "revenue": 819000000 },
  { "month": "2025-12", "bookingCount": 130, "revenue": 1170000000 },
  { "month": "2026-01", "bookingCount": 74, "revenue": 666000000 },
  { "month": "2026-06", "bookingCount": 84, "revenue": 756000000 }
]
```

**Cách dùng với Recharts (Line chart):**

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// data = response từ API
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
    <Tooltip
      formatter={(value, name) =>
        name === 'revenue' ? formatVND(Number(value)) : value
      }
    />
    <Legend />
    <Line
      yAxisId="left"
      type="monotone"
      dataKey="bookingCount"
      stroke="#D0021B"
      strokeWidth={2}
      dot={{ fill: '#D0021B', r: 4 }}
      name="Số booking"
    />
    <Line
      yAxisId="right"
      type="monotone"
      dataKey="revenue"
      stroke="#E8A020"
      strokeWidth={2}
      dot={{ fill: '#E8A020', r: 4 }}
      name="Doanh thu"
    />
  </LineChart>
</ResponsiveContainer>
```

---

### 9.3 Booking theo trạng thái — Donut Chart

```
GET /stats/bookings/by-status
```

**Response:**

```json
[
  { "status": "COMPLETED", "count": 820 },
  { "status": "PENDING",   "count": 34  },
  { "status": "CONFIRMED", "count": 180 },
  { "status": "PAID",      "count": 95  },
  { "status": "CANCELLED", "count": 88  },
  { "status": "ONGOING",   "count": 22  },
  { "status": "REFUNDED",  "count": 8   }
]
```

**Cách dùng với Recharts (Donut chart):**

```tsx
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16A34A',
  PENDING:   '#F59E0B',
  CONFIRMED: '#3B82F6',
  PAID:      '#06B6D4',
  ONGOING:   '#6366F1',
  CANCELLED: '#D0021B',
  REFUNDED:  '#9CA3AF',
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  PENDING:   'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PAID:      'Đã thanh toán',
  ONGOING:   'Đang thực hiện',
  CANCELLED: 'Đã hủy',
  REFUNDED:  'Đã hoàn tiền',
};

// data = response từ API
<PieChart width={340} height={280}>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    innerRadius={70}
    outerRadius={110}
    dataKey="count"
    nameKey="status"
    paddingAngle={2}
  >
    {data.map((entry) => (
      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#E5E7EB'} />
    ))}
  </Pie>
  <Tooltip formatter={(value, name) => [value, STATUS_LABEL[String(name)] ?? name]} />
  <Legend formatter={(value) => STATUS_LABEL[value] ?? value} />
</PieChart>
```

---

### 9.4 Top tours bán chạy

```
GET /stats/tours/top?limit=5
```

| Query | Kiểu | Mô tả |
|-------|------|-------|
| `limit` | number | Số lượng tour hiển thị. Mặc định: `5` |

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Tour Hà Nội - Hạ Long 4N3Đ",
    "imageUrl": "https://res.cloudinary.com/...",
    "tourCity": "Hà Nội - Hạ Long",
    "rating": 4.8,
    "bookingCount": 45
  }
]
```

Dùng để hiển thị bảng "Top tour bán chạy" bên dưới stat cards trên trang dashboard.

---

### 9.5 Người dùng mới theo tháng — Line Chart phụ

```
GET /stats/users/monthly?months=12
```

**Response:**

```json
[
  { "month": "2025-07", "newUsers": 18 },
  { "month": "2025-08", "newUsers": 23 },
  { "month": "2026-06", "newUsers": 31 }
]
```

Dùng để vẽ thêm một line trên cùng chart tăng trưởng, hoặc chart riêng phần Users.

---

## 10. Kiểu dữ liệu chung

### PaginatedResponse\<T\>

```typescript
{
  items: T[];
  meta: {
    total: number;       // Tổng số record
    page: number;        // Trang hiện tại
    limit: number;       // Số item/trang
    totalPages: number;  // Tổng số trang
    hasNext: boolean;
    hasPrevious: boolean;
  }
}
```

---

### TourResponseDto {#tour-response}

```json
{
  "id": "uuid",
  "name": "Tour Hà Nội - Hạ Long 4N3Đ",
  "imageUrl": "https://res.cloudinary.com/...",
  "imagePublicId": "tours/abc123",
  "duration": "4 ngày 3 đêm",
  "rating": 4.8,
  "reviewsCount": 120,
  "bookingCount": 45,
  "hasVat": true,
  "departureFrom": "TP. Hồ Chí Minh",
  "transport": "Máy bay",
  "tourCountry": "Trong nước",
  "tourRegion": "Miền Bắc",
  "tourCity": "Hà Nội - Hạ Long",
  "included": ["Vé máy bay", "Khách sạn 4 sao", "Bữa sáng"],
  "notIncluded": ["Chi phí cá nhân", "Tip hướng dẫn viên"],
  "notes": "Mang theo CCCD bản gốc",
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z",
  "schedules": [
    {
      "id": "uuid",
      "tourId": "uuid-tour",
      "dayNumber": 1,
      "title": "TP.HCM - Hà Nội",
      "morning": "Bay từ Tân Sơn Nhất",
      "noon": "Ăn trưa tại Hà Nội",
      "afternoon": "Tham quan Hồ Gươm",
      "evening": "Dạo phố cổ",
      "night": "Nghỉ đêm tại Hà Nội",
      "meals": ["Trưa", "Tối"]
    }
  ],
  "departures": [
    {
      "id": "uuid",
      "tourCode": "BTTHN20260715",
      "tourId": "uuid-tour",
      "departureDate": "2026-07-15T00:00:00.000Z",
      "availableSeats": 20,
      "price": 8990000,
      "createdAt": "2026-06-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

---

### BookingResponseDto

```json
{
  "id": "uuid",
  "idUser": "uuid-user",
  "tour": { "...": "TourResponseDto (không có schedules đầy đủ)" },
  "departure": {
    "id": "uuid",
    "tourCode": "BTTHN20260715",
    "departureDate": "2026-07-15T00:00:00.000Z",
    "availableSeats": 17,
    "price": 8990000
  },
  "quantity": 3,
  "passengers": {
    "adults": 2,
    "adultUnitPrice": 8990000,
    "adultTotal": 17980000,
    "children": 1,
    "childUnitPrice": 7192000,
    "childTotal": 7192000,
    "infants": 0,
    "infantUnitPrice": 3596000,
    "infantTotal": 0
  },
  "originalPrice": 25172000,
  "discountAmount": 0,
  "price": 25172000,
  "paymentMethod": "AT_OFFICE",
  "voucher": null,
  "notice": null,
  "status": "PENDING",
  "createdAt": "2026-06-15T12:00:00.000Z",
  "updatedAt": "2026-06-15T12:00:00.000Z"
}
```

---

## Gợi ý cấu trúc trang Admin Next.js

```
/admin
├── /login                  → Auth.1 (POST /auth/login)
├── /dashboard              → Stats.9.1 + 9.2 + 9.3 + 9.4 (overview, charts, top tours)
├── /users                  → Users.1 — danh sách
│   └── /[id]               → Users.2 — chi tiết
├── /tours                  → Tours.1 — danh sách
│   ├── /new                → Tours.7 — tạo mới (bulk)
│   └── /[id]/edit          → Tours.8 — chỉnh sửa
├── /departures             → Departures.1 — danh sách
│   ├── /new                → Departures.4 — tạo mới
│   └── /[id]/edit          → Departures.5 — chỉnh sửa
├── /bookings               → Bookings.1 — danh sách
│   └── /[id]               → Bookings.3+5.4 — chi tiết & đổi status
├── /vouchers               → Vouchers.1 — danh sách
│   ├── /new                → Vouchers.3 — tạo mới
│   └── /[id]/edit          → Vouchers.4 — chỉnh sửa
└── /feedbacks              → Feedbacks.1 — danh sách
```

> **Lưu ý bảo mật:** Mọi trang `/admin/*` cần middleware kiểm tra `role === "ADMIN"` từ decoded JWT trước khi render.

---

## 10. Hướng dẫn thiết kế giao diện Admin (Next.js)

> Phần này mô tả design system, màu sắc, layout, và component guidelines — lấy cảm hứng từ mobile app để đảm bảo nhất quán thương hiệu.

---

### 10.1 Design System & Brand Colors

Dùng chung bảng màu với mobile app:

| Token              | Hex       | Dùng cho                       |
| ------------------ | --------- | ------------------------------ |
| `brand-red`        | `#D0021B` | Primary action, badge, accent  |
| `brand-red-active` | `#A80016` | Hover/active state của nút đỏ  |
| `brand-red-light`  | `#FF1F37` | Focus ring, highlight          |
| `brand-gold`       | `#E8A020` | Rating stars, membership badge |
| `brand-gold-light` | `#FFF3DC` | Background vàng nhạt           |
| `brand-green`      | `#16A34A` | Trạng thái thành công          |
| `brand-amber`      | `#F59E0B` | Trạng thái chờ, cảnh báo       |
| `bg-light`         | `#F5F6FA` | Background trang (light)       |
| `bg-dark`          | `#111318` | Background trang (dark)        |
| `text-primary`     | `#1A1A2E` | Tiêu đề, nội dung chính        |
| `text-secondary`   | `#6B7280` | Label phụ, mô tả               |
| `text-muted`       | `#9CA3AF` | Placeholder, disabled          |

**Font:** [Rubik](https://fonts.google.com/specimen/Rubik) — Regular 400, Medium 500, Bold 700, Black 900.

```css
/* tailwind.config.ts */
fontFamily: {
  sans: ['Rubik', 'sans-serif'],
},
colors: {
  brand: {
    red: '#D0021B',
    'red-active': '#A80016',
    'red-light': '#FF1F37',
    gold: '#E8A020',
    'gold-light': '#FFF3DC',
    green: '#16A34A',
    amber: '#F59E0B',
  },
  bg: { light: '#F5F6FA', dark: '#111318' },
}
```

---

### 10.2 Layout tổng thể

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (240px)        │  Main Content Area            │
│  ─────────────────      │  ─────────────────────────── │
│  [Logo BTT]             │  [Topbar: breadcrumb + user]  │
│                         │                               │
│  ● Dashboard            │  <Page Content>               │
│  ● Tours                │                               │
│  ● Departures           │                               │
│  ● Bookings             │                               │
│  ● Users                │                               │
│  ● Vouchers             │                               │
│  ● Feedbacks            │                               │
│                         │                               │
│  [Logout]               │                               │
└─────────────────────────────────────────────────────────┘
```

- **Sidebar**: nền `#1A1A2E`, text trắng, item active có nền đỏ `#D0021B`, border-radius 8px
- **Topbar**: nền trắng, border-bottom 1px `#E5E7EB`, height 64px
- **Main Content**: nền `#F5F6FA`, padding 24px, overflow-y auto
- Responsive: sidebar collapse thành icon-only (64px) trên màn nhỏ hơn 1280px

---

### 10.3 Trang Dashboard (`/admin/dashboard`)

Hiển thị 4 stat cards hàng trên + 2 charts hàng dưới.

**Stat Cards:**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🧳 Tours     │  │ 📅 Departures│  │ 📋 Bookings  │  │ 👥 Users     │
│              │  │              │  │              │  │              │
│   142        │  │   38         │  │   1,247      │  │   856        │
│  +12 tuần này│  │  +5 tuần này │  │  +84 tháng   │  │  +23 tháng   │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

- Nền trắng, border-radius 16px, shadow `0 1px 4px rgba(0,0,0,0.08)`
- Icon màu `#D0021B`, số lớn font-black 28px
- Số tăng màu `#16A34A`, số giảm màu `#D0021B`

**Charts:**

- **Biểu đồ Booking theo tháng** (Line chart, chiếm 60% width) — thư viện [Recharts](https://recharts.org/)
- **Booking theo trạng thái** (Donut chart, 40% width) — màu tương ứng status mapping

---

### 10.4 Trang Tours (`/admin/tours`)

**Bảng danh sách:**

| Cột       | Nội dung                                             |
| --------- | ---------------------------------------------------- |
| Ảnh       | Thumbnail 64×48px, border-radius 8px                 |
| Tên tour  | Font-bold, click → `/admin/tours/[id]/edit`          |
| Điểm đến  | `tourCity` — badge viền nhạt                         |
| Thời gian | `duration`                                           |
| Rating    | ⭐ số vàng `#E8A020`                                 |
| Booking   | Số lượng đã completed                                |
| Ngày tạo  | Định dạng `dd/MM/yyyy`                               |
| Hành động | Nút **Sửa** (icon bút) + **Xóa** (icon thùng rác đỏ) |

**Toolbar phía trên bảng:**

- Search input (icon kính lúp, rounded-full, border `#E5E7EB`)
- Filter dropdown: Trong nước / Quốc tế / Tất cả
- Nút **+ Thêm tour** (nền `#D0021B`, text trắng, rounded-lg)

**Phân trang:** hiển thị `Trang X / Y · Tổng Z tours`, prev/next button

---

### 10.5 Trang Departures (`/admin/departures`)

**Bảng:**

| Cột            | Nội dung                                    |
| -------------- | ------------------------------------------- |
| Mã tour        | `tourCode` — monospace font, badge xám nhạt |
| Tên tour       | Link sang tour detail                       |
| Ngày khởi hành | Format `dd/MM/yyyy`, upcoming = badge xanh  |
| Ghế còn        | Số còn / tổng; nếu ≤ 5 → text đỏ `#D0021B`  |
| Giá            | Format VND — `8.990.000 ₫`                  |
| Hành động      | Sửa / Xóa                                   |

---

### 10.6 Trang Bookings (`/admin/bookings`)

**Filter chips** (giống mobile `history.tsx`):

```
[ Tất cả ]  [ Chờ xử lý ]  [ Đã xác nhận ]  [ Đã thanh toán ]  [ Đang đi ]  [ Hoàn thành ]  [ Đã hủy ]
```

- Chip active: nền `#D0021B`, text trắng
- Chip inactive: nền trắng, border `#E5E7EB`, text `#6B7280`

**Bảng:**

| Cột         | Nội dung                                             |
| ----------- | ---------------------------------------------------- |
| Mã đặt      | `id` rút gọn (8 ký tự đầu)                           |
| Tên tour    | Tên + departure date                                 |
| Khách hàng  | Email hoặc tên user                                  |
| Khách số    | `quantity` người                                     |
| Tổng tiền   | Format VND                                           |
| Phương thức | `AT_OFFICE` → "Tại văn phòng"; bank → "Chuyển khoản" |
| Trạng thái  | Badge màu (xem bảng bên dưới)                        |
| Hành động   | Xem chi tiết / Đổi trạng thái                        |

**Badge trạng thái** (dùng nhất quán với mobile):

| Status      | Màu nền   | Màu text  | Label VI       |
| ----------- | --------- | --------- | -------------- |
| `PENDING`   | `#FEF3C7` | `#92400E` | Chờ xử lý      |
| `CONFIRMED` | `#DBEAFE` | `#1E40AF` | Đã xác nhận    |
| `PAID`      | `#D1FAE5` | `#065F46` | Đã thanh toán  |
| `ONGOING`   | `#E0E7FF` | `#3730A3` | Đang thực hiện |
| `COMPLETED` | `#D1FAE5` | `#065F46` | Hoàn thành     |
| `CANCELLED` | `#FEE2E2` | `#991B1B` | Đã hủy         |
| `REFUNDED`  | `#F3F4F6` | `#374151` | Đã hoàn tiền   |

**Trang chi tiết booking** (`/admin/bookings/[id]`):

```
┌──────────────────────────────────────────────────┐
│  [Ảnh tour]   Tên tour                           │
│               ⭐ 4.8  ·  4 ngày 3 đêm  ·  Máy bay│
│               Khởi hành: 15/07/2026              │
│               Mã: BTTHN20260715                  │
├──────────────────────────────────────────────────┤
│  THÔNG TIN ĐẶT CHỖ                               │
│  ─────────────────────────────────────────       │
│  Người lớn    2 × 8.990.000 ₫  = 17.980.000 ₫   │
│  Trẻ em       1 × 7.192.000 ₫  =  7.192.000 ₫   │
│  Em bé        0 × 3.596.000 ₫  =          0 ₫   │
│  ─────────────────────────────────────────       │
│  Giảm giá voucher              - 2.519.200 ₫    │
│  ─────────────────────────────────────────       │
│  Tổng thanh toán               22.652.800 ₫     │
├──────────────────────────────────────────────────┤
│  Phương thức: Tại văn phòng                      │
│  Trạng thái: [ PENDING ▾ ]  ← dropdown đổi status│
└──────────────────────────────────────────────────┘
```

- Dropdown đổi trạng thái: `<Select>` với các option hợp lệ, sau khi chọn gọi `PATCH /bookings/:id/status`
- Nút **Lưu thay đổi** (nền `#D0021B`) — disabled khi status không đổi

---

### 10.7 Trang Users (`/admin/users`)

**Bảng:**

| Cột           | Nội dung                                                      |
| ------------- | ------------------------------------------------------------- |
| Avatar        | Initials avatar (2 chữ đầu họ tên) — nền `#D0021B`, chữ trắng |
| Họ tên        | `firstName + lastName`                                        |
| Email         | text muted                                                    |
| Số điện thoại | `phonenumber`                                                 |
| Điểm tích lũy | `earnedPoints` — format số có dấu phẩy                        |
| Điểm thưởng   | `rewardPoints`                                                |
| Ngày đăng ký  | `createdAt`                                                   |
| Hành động     | Xem chi tiết / Xóa (chỉ admin)                                |

---

### 10.8 Trang Vouchers (`/admin/vouchers`)

**Card layout** thay vì bảng — mỗi voucher hiển thị như thẻ:

```
┌─────────────────────────────────────────────────┐
│  VOUCHER DU LỊCH            [● Còn dùng được]   │
│                                                  │
│  Giảm 10% tối đa 300k                          │
│  Code: BTT300K              HSD: 31/12/2026     │
│  SUMMER 2026                                    │
│  Áp dụng cho tất cả tour trong nước.            │
│                             [Sửa]  [Xóa]        │
└─────────────────────────────────────────────────┘
```

- Border trái 4px màu `#D0021B`
- Badge trạng thái: `Còn dùng được` = nền `#D1FAE5` + text `#065F46`; `Đã dùng` = nền `#F3F4F6` + text `#6B7280`
- Nút **+ Tạo voucher** mở modal với form tạo mới

---

### 10.9 Trang Feedbacks (`/admin/feedbacks`)

**Danh sách dạng card:**

```
┌─────────────────────────────────────────────────┐
│  user@example.com                 01/06/2026    │
│  Góp ý dịch vụ Tour                             │
│  "Hướng dẫn viên nhiệt tình, tour rất tốt!"    │
│                                         [Xóa]   │
└─────────────────────────────────────────────────┘
```

- Nền trắng, border-radius 12px, shadow nhẹ
- Subject: font-semibold 15px
- Content: text-secondary, italic, giới hạn 3 dòng có "Xem thêm"

---

### 10.10 Component Guidelines

**Nút (Button):**

```tsx
// Primary (đỏ)
<button className="bg-[#D0021B] hover:bg-[#A80016] text-white font-bold px-5 py-2.5 rounded-lg transition-colors">
  Xác nhận
</button>

// Secondary (viền)
<button className="border border-[#D0021B] text-[#D0021B] hover:bg-red-50 font-bold px-5 py-2.5 rounded-lg transition-colors">
  Hủy bỏ
</button>

// Danger (xóa)
<button className="text-[#D0021B] hover:bg-red-50 p-2 rounded-lg transition-colors">
  <Trash2 size={16} />
</button>
```

**Input / Search:**

```tsx
<div className="relative">
  <Search
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    size={16}
  />
  <input
    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#D0021B]/30 text-sm"
    placeholder="Tìm kiếm..."
  />
</div>
```

**Table:**

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-100">
      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Tên cột
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="py-3.5 px-4 text-sm text-[#1A1A2E]">...</td>
    </tr>
  </tbody>
</table>
```

**Stat Card:**

```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <span className="text-sm font-medium text-gray-500">Tổng Bookings</span>
    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
      <BookOpen size={20} className="text-[#D0021B]" />
    </div>
  </div>
  <p className="text-3xl font-black text-[#1A1A2E]">1,247</p>
  <p className="text-xs text-[#16A34A] mt-1">+84 so với tháng trước</p>
</div>
```

**Pagination:**

```tsx
<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
  <span className="text-sm text-gray-500">Trang 1 / 10 · Tổng 142 tours</span>
  <div className="flex gap-2">
    <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-40">
      ← Trước
    </button>
    <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
      Sau →
    </button>
  </div>
</div>
```

---

### 10.11 VND Currency Format

Luôn dùng hàm này để format tiền (nhất quán với mobile):

```typescript
export const formatVND = (amount: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
// 8990000 → "8.990.000 ₫"
```

---

### 10.12 Tech Stack gợi ý

| Layer         | Thư viện                                      |
| ------------- | --------------------------------------------- |
| Framework     | Next.js 15+ (App Router)                      |
| Styling       | Tailwind CSS                                  |
| UI Components | shadcn/ui (dùng làm base, override màu brand) |
| Icons         | lucide-react                                  |
| Charts        | Recharts                                      |
| Form          | React Hook Form + Zod                         |
| HTTP          | Axios (tương tự mobile interceptor)           |
| Auth          | Lưu `accessToken` vào `httpOnly cookie`       |
