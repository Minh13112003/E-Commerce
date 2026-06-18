# Thay đổi hệ thống Notification — Hướng dẫn cho FE

> Cập nhật ngày: 2026-06-17
> Áp dụng cho: trang thông báo người dùng, trang chi tiết tour, trang lịch khởi hành

---

## Mục lục

1. [Thay đổi cấu trúc Notification](#1-thay-đổi-cấu-trúc-notification)
2. [Các loại Notification mới](#2-các-loại-notification-mới)
3. [Cách FE xử lý điều hướng khi nhấn thông báo](#3-cách-fe-xử-lý-điều-hướng-khi-nhấn-thông-báo)
4. [Lịch khởi hành bị lùi ngày](#4-lịch-khởi-hành-bị-lùi-ngày)
5. [Lịch trình tour thay đổi](#5-lịch-trình-tour-thay-đổi)
6. [Nội dung thông báo theo từng loại](#6-nội-dung-thông-báo-theo-từng-loại)
7. [Gợi ý UI cho trang thông báo](#7-gợi-ý-ui-cho-trang-thông-báo)

---

## 1. Thay đổi cấu trúc Notification

### Trước (cũ)

```ts
{
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
```

### Sau (mới) — thêm `refId` và `refType`

```ts
{
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  refId: string | null      // ID của entity liên quan (tourId, v.v.)
  refType: string | null    // Loại entity: "TOUR" | "DEPARTURE" | "BOOKING"
  createdAt: string
}
```

**Giải thích:**

| Field | Ý nghĩa | Ví dụ |
|---|---|---|
| `refId` | ID để FE điều hướng đến trang tương ứng | `"abc-123"` (tourId) |
| `refType` | Loại entity, xác định route cần navigate | `"TOUR"` |

---

## 2. Các loại Notification mới

```ts
type NotificationType =
  | 'PASSWORD_CHANGED'
  | 'BOOKING_CREATED'
  | 'BOOKING_STATUS_UPDATED'
  | 'DEPARTURE_RESCHEDULED'   // MỚI — lùi ngày khởi hành
  | 'SCHEDULE_UPDATED'        // MỚI — lịch trình tour thay đổi
```

---

## 3. Cách FE xử lý điều hướng khi nhấn thông báo

Khi user nhấn vào một notification, FE dùng `refType` để biết điều hướng về đâu, và `refId` để lấy ID cụ thể.

```ts
function handleNotificationClick(notification: Notification) {
  if (!notification.refId || !notification.refType) return

  switch (notification.refType) {
    case 'TOUR':
      router.push(`/tours/${notification.refId}`)
      break
    // Mở rộng sau nếu có thêm loại
  }
}
```

**Mapping loại thông báo → hành động FE:**

| `type` | `refType` | Điều hướng về | Gợi ý highlight |
|---|---|---|---|
| `BOOKING_CREATED` | `TOUR` | `/tours/:refId` | — |
| `BOOKING_STATUS_UPDATED` | `TOUR` | `/tours/:refId` | — |
| `DEPARTURE_RESCHEDULED` | `TOUR` | `/tours/:refId` | Làm nổi bật ngày khởi hành mới |
| `SCHEDULE_UPDATED` | `TOUR` | `/tours/:refId` | Làm nổi bật phần lịch trình |

---

## 4. Lịch khởi hành bị lùi ngày

### Khi nào xảy ra?

Khi Admin cập nhật `departureDate` của một chuyến đi qua API:

```
PATCH /departures/:id
Body: { "departureDate": "2026-08-15T00:00:00.000Z" }
```

BE sẽ tự động gửi notification `DEPARTURE_RESCHEDULED` đến **toàn bộ user** có booking với trạng thái `PENDING`, `CONFIRMED`, hoặc `PAID` của chuyến đó.

### Nội dung thông báo mẫu

```
title: "Lịch khởi hành thay đổi"
message: "Tour Du lịch Đà Nẵng - Hội An (BTTDLDNA20260715) đã được dời ngày từ 15/7/2026 sang 15/8/2026. Vui lòng kiểm tra lại lịch trình của bạn."
refId: "<tourId>"
refType: "TOUR"
```

### Gợi ý UI khi user navigate đến trang tour từ thông báo này

Khi detect params hoặc state từ notification có `type === 'DEPARTURE_RESCHEDULED'`, FE nên:

```
Trang /tours/:id — phần "Chọn ngày khởi hành"
┌─────────────────────────────────────────────────────┐
│  Thời gian khởi hành                                │
│                                                     │
│  ░░░░░░░░░░░░░░░  15/07/2026  ░░░░░░░░░░░░░░░░░░░  │  ← Mờ (cũ, đã bị dời)
│                                                     │
│  ● 15/08/2026  ──  Còn 42 chỗ  ──  6.590.000đ     │  ← Viền nổi bật màu vàng/cam
│    ⚠ Ngày đã được cập nhật                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Cách làm:**

Option A — Dùng query param:
```
router.push(`/tours/${refId}?highlight=departure`)
```

Trong trang tour, đọc query `highlight`:
```ts
const { highlight } = useSearchParams()
// highlight === 'departure' → thêm class highlight vào departure section
```

Option B — Dùng sessionStorage để không làm xấu URL:
```ts
// Khi nhấn notification
sessionStorage.setItem('tour-highlight', JSON.stringify({
  tourId: notification.refId,
  type: 'departure',
}))
router.push(`/tours/${notification.refId}`)

// Trong trang tour
const highlight = JSON.parse(sessionStorage.getItem('tour-highlight') || '{}')
if (highlight.tourId === tourId && highlight.type === 'departure') {
  // Scroll đến departure section, thêm animation/highlight
  departureRef.current?.scrollIntoView({ behavior: 'smooth' })
  sessionStorage.removeItem('tour-highlight')
}
```

---

## 5. Lịch trình tour thay đổi

### Khi nào xảy ra?

Khi Admin chỉnh sửa lịch trình của tour (ví dụ: địa điểm bị cấm, thêm hoạt động mới) qua API:

```
PATCH /tours/:id/schedules
Authorization: Bearer <adminToken>

Body:
{
  "schedules": [
    {
      "dayNumber": 1,
      "title": "TP.HCM - ĐÀ NẴNG - PHỐ CỔ HỘI AN",
      "morning": "Xe đón tại sân bay Đà Nẵng, nhận phòng khách sạn.",
      "afternoon": "Tham quan Phố Cổ Hội An (lưu ý: Chùa Cầu tạm đóng cửa tu bổ).",
      "evening": "Thưởng thức ẩm thực địa phương tại chợ đêm Hội An.",
      "meals": ["Trưa", "Tối"]
    }
  ]
}
```

BE sẽ tự động gửi notification `SCHEDULE_UPDATED` đến **toàn bộ user** có booking `PENDING`, `CONFIRMED`, hoặc `PAID` của bất kỳ chuyến nào thuộc tour đó (distinct theo user để không gửi trùng).

### Nội dung thông báo mẫu

```
title: "Lịch trình tour thay đổi"
message: "Lịch trình tour Du lịch Đà Nẵng - Hội An vừa được cập nhật. Vui lòng kiểm tra chi tiết chuyến đi của bạn."
refId: "<tourId>"
refType: "TOUR"
```

### Gợi ý UI khi user navigate đến trang tour từ thông báo này

```
Trang /tours/:id — phần "Lịch trình chi tiết"
┌─────────────────────────────────────────────────────┐
│  Lịch trình chi tiết                                │
│                                                     │
│  Ngày 1  ⚡ Vừa cập nhật                           │  ← Badge "Vừa cập nhật"
│  TP.HCM - ĐÀ NẴNG - PHỐ CỔ HỘI AN                 │
│  ┌──────────────────────────────────────────────┐   │
│  │ Sáng: Xe đón tại sân bay Đà Nẵng...         │   │
│  │ Chiều: Tham quan Phố Cổ Hội An (lưu ý:...)  │   │
│  │ Tối: Thưởng thức ẩm thực địa phương...       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Ngày 2  (không thay đổi)                          │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

**Cách làm** (tương tự option B ở trên):

```ts
// Khi nhấn notification
sessionStorage.setItem('tour-highlight', JSON.stringify({
  tourId: notification.refId,
  type: 'schedule',
}))
router.push(`/tours/${notification.refId}`)

// Trong trang tour
const highlight = JSON.parse(sessionStorage.getItem('tour-highlight') || '{}')
if (highlight.tourId === tourId && highlight.type === 'schedule') {
  scheduleRef.current?.scrollIntoView({ behavior: 'smooth' })
  sessionStorage.removeItem('tour-highlight')
}
```

> **Lưu ý:** API lấy tour (`GET /tours/:id`) trả về `schedules` với `updatedAt` — FE có thể dùng `updatedAt` của từng schedule để biết ngày nào vừa được sửa và highlight riêng từng ngày.

---

## 6. Nội dung thông báo theo từng loại

Bảng tổng hợp tất cả notification text (đã đổi sang tiếng Việt):

| `type` | `title` | `message` |
|---|---|---|
| `BOOKING_CREATED` | Đặt tour thành công | Booking tour mã `{tourCode}` đã được tạo thành công. Trạng thái: Chờ xác nhận. |
| `BOOKING_STATUS_UPDATED` (CONFIRMED) | Cập nhật trạng thái booking | Booking của bạn đã được xác nhận. Tour: `{tên}` (`{tourCode}`). |
| `BOOKING_STATUS_UPDATED` (PAID) | Cập nhật trạng thái booking | Thanh toán thành công. Cảm ơn bạn! Tour: `{tên}` (`{tourCode}`). |
| `BOOKING_STATUS_UPDATED` (ONGOING) | Tour của bạn đã bắt đầu! | Tour mã `{tourCode}` đã chuyển sang trạng thái Đang diễn ra. Chúc bạn có chuyến đi vui vẻ! |
| `BOOKING_STATUS_UPDATED` (COMPLETED) | Tour đã hoàn thành! | Tour mã `{tourCode}` đã hoàn thành. Bạn được cộng `{điểm}` điểm thưởng vào tài khoản! |
| `BOOKING_STATUS_UPDATED` (CANCELLED) | Cập nhật trạng thái booking | Booking của bạn đã bị hủy. Tour: `{tên}` (`{tourCode}`). |
| `DEPARTURE_RESCHEDULED` | Lịch khởi hành thay đổi | Tour `{tên}` (`{tourCode}`) đã được dời ngày từ `{ngày cũ}` sang `{ngày mới}`. Vui lòng kiểm tra lại lịch trình của bạn. |
| `SCHEDULE_UPDATED` | Lịch trình tour thay đổi | Lịch trình tour `{tên}` vừa được cập nhật. Vui lòng kiểm tra chi tiết chuyến đi của bạn. |

---

## 7. Gợi ý UI cho trang thông báo

### Icon theo loại thông báo

```tsx
const NOTIFICATION_ICON: Record<string, { icon: string; color: string }> = {
  BOOKING_CREATED:          { icon: '🎉', color: 'text-green-500' },
  BOOKING_STATUS_UPDATED:   { icon: '📋', color: 'text-blue-500' },
  DEPARTURE_RESCHEDULED:    { icon: '⚠️', color: 'text-yellow-500' },
  SCHEDULE_UPDATED:         { icon: '📅', color: 'text-orange-500' },
  PASSWORD_CHANGED:         { icon: '🔐', color: 'text-gray-500' },
}
```

### Component NotificationItem

```tsx
function NotificationItem({ notification }: { notification: Notification }) {
  const router = useRouter()
  const { icon, color } = NOTIFICATION_ICON[notification.type] ?? { icon: '🔔', color: 'text-gray-500' }

  const handleClick = () => {
    // Đánh dấu đã đọc
    markAsRead(notification.id)

    // Lưu state highlight và điều hướng
    if (notification.refId && notification.refType === 'TOUR') {
      const highlightType =
        notification.type === 'DEPARTURE_RESCHEDULED' ? 'departure' :
        notification.type === 'SCHEDULE_UPDATED'      ? 'schedule'  : null

      if (highlightType) {
        sessionStorage.setItem('tour-highlight', JSON.stringify({
          tourId: notification.refId,
          type: highlightType,
        }))
      }

      router.push(`/tours/${notification.refId}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 p-4 rounded-lg cursor-pointer transition-colors
        ${notification.isRead ? 'bg-white' : 'bg-blue-50 border-l-4 border-blue-400'}`}
    >
      <span className={`text-2xl ${color}`}>{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">{notification.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { locale: vi, addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      )}
    </div>
  )
}
```

### Badge đếm thông báo chưa đọc

API hiện có `GET /notifications/me` trả về paginated list. FE có thể lấy số chưa đọc bằng cách:

```ts
// Lấy trang đầu với limit nhỏ, đếm isRead === false
// Hoặc thêm endpoint /notifications/me/unread-count nếu cần
const unreadCount = notifications.filter(n => !n.isRead).length
```

---

## API Endpoints liên quan

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/notifications/me?page=1&limit=20` | Lấy danh sách thông báo của user |
| `PATCH` | `/notifications/:id/read` | Đánh dấu 1 thông báo đã đọc |
| `PATCH` | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| `PATCH` | `/departures/:id` | Admin lùi ngày → auto notify |
| `PATCH` | `/tours/:id/schedules` | Admin sửa lịch trình → auto notify |
