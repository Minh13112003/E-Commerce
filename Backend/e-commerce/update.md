# Backend & Database Update Log
**Date:** 2026-06-10  
**Branch:** main

---

## 1. Database Schema Changes (`prisma/schema.prisma`)

### New Models

#### `Departure`
| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID) | Primary key |
| `tourCode` | `String` | Unique, auto-generated (`BTT` + viết tắt tên tour + `yyyymmdd`) |
| `tourId` | `String` | FK → `Tour.id` (Cascade delete) |
| `departureDate` | `DateTime` | Ngày khởi hành |
| `availableSeats` | `Int` | Số ghế còn trống |
| `price` | `Decimal(15,2)` | Giá cho chuyến này |
| `createdAt` | `DateTime` | Auto |
| `updatedAt` | `DateTime` | Auto |

#### `Notification`
| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID) | Primary key |
| `userId` | `String` | FK → `User.id` (Cascade delete) |
| `type` | `NotificationType` | Enum |
| `title` | `String` | Tiêu đề thông báo |
| `message` | `String` | Nội dung thông báo |
| `isRead` | `Boolean` | Default: `false` |
| `createdAt` | `DateTime` | Auto |

---

### Modified Models

#### `Tour`
- **Xóa** field `price Decimal @db.Decimal(15,2)` — giá nay chuyển sang model `Departure`
- **Thêm** relation `departures Departure[]`

#### `Booking`
- **Đổi** `status String @default("Chờ xử lý")` → `status BookingStatus @default(PENDING)`
- **Thêm** `departureId String?` — liên kết với chuyến khởi hành cụ thể
- **Thêm** `paymentMethod PaymentMethod @default(AT_OFFICE)` — phương thức thanh toán
- **Thêm** relation `departure Departure?`
- `price` đã có sẵn — lưu giá cuối sau khi áp voucher (không thêm `finalPrice` riêng)

#### `User`
- **Thêm** relation `notifications Notification[]`

---

### New Enums

```
BookingStatus  : PENDING | CONFIRMED | PAID | ONGOING | COMPLETED | CANCELLED | REFUNDED
PaymentMethod  : AT_OFFICE | BANK_TRANSFER
NotificationType: PASSWORD_CHANGED | BOOKING_CREATED | BOOKING_STATUS_UPDATED
```

---

### Migration
```bash
npx prisma migrate dev --name add_departure_notification_booking_updates
npx prisma generate  # ✅ Đã chạy thành công
```

> **Lưu ý:** `prisma generate` đã chạy xong. Cần chạy `migrate dev` thủ công để áp migration lên database.

---

## 2. New Modules

### `DeparturesModule` (`src/modules/departures/`)

**Endpoints:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `POST` | `/api/v1/departures` | ADMIN | Tạo chuyến khởi hành mới |
| `GET` | `/api/v1/departures` | Public | Lấy danh sách (phân trang) |
| `GET` | `/api/v1/departures/tour/:tourId` | Public | Lấy theo tour |
| `GET` | `/api/v1/departures/:id` | Public | Lấy chi tiết |
| `PATCH` | `/api/v1/departures/:id` | ADMIN | Cập nhật |
| `DELETE` | `/api/v1/departures/:id` | ADMIN | Xóa |

**Logic đặc biệt:**
- Auto-generate `tourCode`: `BTT` + chữ cái đầu mỗi từ tên tour (tối đa 5 ký tự, viết hoa) + ngày khởi hành `yyyymmdd`
  - Ví dụ: Tour "Hà Nội Vịnh Nha Trang" khởi hành 2026-06-10 → `BTTHNVNT20260610`
- Khi update `tourId` hoặc `departureDate`, tự động tạo lại `tourCode`

**Files:**
- [src/modules/departures/departures.service.ts](src/modules/departures/departures.service.ts)
- [src/modules/departures/departures.controller.ts](src/modules/departures/departures.controller.ts)
- [src/modules/departures/departures.module.ts](src/modules/departures/departures.module.ts)
- [src/modules/departures/dtos/create-departure.dto.ts](src/modules/departures/dtos/create-departure.dto.ts)
- [src/modules/departures/dtos/update-departure.dto.ts](src/modules/departures/dtos/update-departure.dto.ts)
- [src/modules/departures/dtos/departure-response.dto.ts](src/modules/departures/dtos/departure-response.dto.ts)

---

### `NotificationsModule` (`src/modules/notifications/`)

**Endpoints:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `GET` | `/api/v1/notifications` | JWT | Lấy thông báo của tôi (phân trang) |
| `PATCH` | `/api/v1/notifications/read-all` | JWT | Đánh dấu tất cả đã đọc |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT | Đánh dấu 1 thông báo đã đọc |

**Logic đặc biệt:**
- `createNotification()` được gọi nội bộ (không expose qua API), dùng bởi các service khác
- Không ai có thể xóa thông báo qua API

**Files:**
- [src/modules/notifications/notifications.service.ts](src/modules/notifications/notifications.service.ts)
- [src/modules/notifications/notifications.controller.ts](src/modules/notifications/notifications.controller.ts)
- [src/modules/notifications/notifications.module.ts](src/modules/notifications/notifications.module.ts)

---

## 3. Modified Modules

### `BookingsModule` (`src/modules/bookings/`)

**Endpoint mới:**

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| `PATCH` | `/api/v1/bookings/:id/status` | ADMIN | Cập nhật trạng thái booking |

**Thay đổi logic `createBooking()`:**
- Wrap trong `$transaction` để đảm bảo tính atomic
- `departureId` **bắt buộc** (vì `Tour.price` đã bị xóa — giá lấy từ `Departure.price`)
- Kiểm tra `availableSeats > 0`, nếu đủ thì trừ 1 ghế sau khi tạo booking
- `price` = giá departure × quantity, sau đó trừ voucher nếu có
- Gửi notification `BOOKING_CREATED` sau khi tạo thành công

**Logic mới `updateBookingStatus()` (Admin only):**
- Kiểm tra duplicate: không cho cập nhật nếu status hiện tại đã trùng
- Trạng thái `CANCELLED` hoặc `REFUNDED`: hoàn lại `availableSeats` cho departure
- Trạng thái `COMPLETED`: cộng `Math.floor(price)` vào `rewardPoints` và `earnedPoints` của user
- Gửi notification `BOOKING_STATUS_UPDATED` cho user

**DTO thay đổi:**
- `CreateBookingDTO`: thêm `departureId` (string, bắt buộc), `paymentMethod?` (enum)
- `BookingResponseDTO`: thêm `departure?` (DepartureInfoDto), `paymentMethod`; bỏ `finalPrice` (dùng `price`)
- **Mới** `UpdateBookingStatusDto`: field `status` (BookingStatusDto enum)

**Files thay đổi:**
- [src/modules/bookings/bookings.service.ts](src/modules/bookings/bookings.service.ts)
- [src/modules/bookings/bookings.controller.ts](src/modules/bookings/bookings.controller.ts)
- [src/modules/bookings/bookings.module.ts](src/modules/bookings/bookings.module.ts) — thêm `NotificationsModule`
- [src/modules/bookings/dtos/create-booking.dto.ts](src/modules/bookings/dtos/create-booking.dto.ts)
- [src/modules/bookings/dtos/booking-response.dto.ts](src/modules/bookings/dtos/booking-response.dto.ts)
- [src/modules/bookings/dtos/update-booking-status.dto.ts](src/modules/bookings/dtos/update-booking-status.dto.ts) *(mới)*

---

### `UsersModule` (`src/modules/users/`)

**Thay đổi `changePassword()`:**
- Sau khi đổi mật khẩu thành công, gửi notification `PASSWORD_CHANGED` cho user

**Files thay đổi:**
- [src/modules/users/users.service.ts](src/modules/users/users.service.ts) — inject `NotificationsService`
- [src/modules/users/users.module.ts](src/modules/users/users.module.ts) — thêm `NotificationsModule`

---

### `AppModule` (`src/app.module.ts`)

- Thêm `DeparturesModule` vào imports
- Thêm `NotificationsModule` vào imports

---

## 4. Tổng hợp API mới/thay đổi

| Method | Endpoint | Auth | Thay đổi |
|--------|----------|------|---------|
| `POST` | `/api/v1/departures` | ADMIN | **Mới** |
| `GET` | `/api/v1/departures` | Public | **Mới** |
| `GET` | `/api/v1/departures/tour/:tourId` | Public | **Mới** |
| `GET` | `/api/v1/departures/:id` | Public | **Mới** |
| `PATCH` | `/api/v1/departures/:id` | ADMIN | **Mới** |
| `DELETE` | `/api/v1/departures/:id` | ADMIN | **Mới** |
| `GET` | `/api/v1/notifications` | JWT | **Mới** |
| `PATCH` | `/api/v1/notifications/read-all` | JWT | **Mới** |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT | **Mới** |
| `POST` | `/api/v1/bookings` | JWT | **Cập nhật** — thêm `departureId`, `paymentMethod`, trừ ghế |
| `PATCH` | `/api/v1/bookings/:id/status` | ADMIN | **Mới** |
| `PATCH` | `/api/v1/users/change-password` | JWT | **Cập nhật** — gửi notification |

---

## 5. Checklist hoàn thành

- [x] Prisma schema cập nhật (Departure, Notification, enums mới)
- [x] `prisma generate` — Prisma Client đã được tái tạo
- [x] Module `Departures` — CRUD đầy đủ + auto tourCode
- [x] Module `Notifications` — GET, mark read
- [x] Booking: seat management (trừ/hoàn ghế) trong transaction
- [x] Booking: reward points khi COMPLETED
- [x] Booking: Admin PATCH status endpoint
- [x] Notifications trigger: BOOKING_CREATED, BOOKING_STATUS_UPDATED, PASSWORD_CHANGED
- [ ] **`prisma migrate dev`** — cần chạy thủ công để áp lên DB
