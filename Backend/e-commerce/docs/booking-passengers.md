# Booking — Hành khách & Tính giá

## Endpoint tạo booking

```
POST /bookings
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Đầu vào (Request Body)

```json
{
  "idTour": "uuid-tour",
  "departureId": "uuid-departure",
  "adults": 2,
  "children": 1,
  "infants": 0,
  "paymentMethod": "AT_OFFICE",
  "voucherCode": "BTT300K",
  "notice": "Cần hỗ trợ xe lăn"
}
```

### Mô tả từng trường

| Trường          | Kiểu   | Bắt buộc | Mô tả                                                        |
|-----------------|--------|----------|--------------------------------------------------------------|
| `idTour`        | string | **Có**   | UUID của tour                                                |
| `departureId`   | string | **Có**   | UUID của chuyến khởi hành (lấy từ `departures[]` của tour)  |
| `adults`        | number | **Có**   | Số người lớn (≥ 16 tuổi). Tối thiểu **1**. Giá **100%**     |
| `children`      | number | Không    | Số trẻ em (2–15 tuổi). Mặc định **0**. Giá **80%**          |
| `infants`       | number | Không    | Số em bé (dưới 2 tuổi). Mặc định **0**. Giá **40%**         |
| `paymentMethod` | string | Không    | `"AT_OFFICE"` (mặc định) hoặc `"BANK_TRANSFER"`             |
| `voucherCode`   | string | Không    | Mã voucher giảm giá                                          |
| `notice`        | string | Không    | Ghi chú thêm cho booking                                    |

---

## Công thức tính giá

> `unitPrice` = giá người lớn lấy từ `departure.price`

```
adultTotal   = adults   × unitPrice × 1.0   (100%)
childTotal   = children × unitPrice × 0.8   (80%)
infantTotal  = infants  × unitPrice × 0.4   (40%)

originalPrice = adultTotal + childTotal + infantTotal
finalPrice    = originalPrice - discountFromVoucher   (nếu có voucher)
```

### Ví dụ tính giá

| Loại      | Số lượng | Đơn giá     | Tỷ lệ | Thành tiền   |
|-----------|----------|-------------|-------|--------------|
| Người lớn | 2        | 6.590.000 đ | 100%  | 13.180.000 đ |
| Trẻ em    | 1        | 5.272.000 đ | 80%   | 5.272.000 đ  |
| Em bé     | 0        | 2.636.000 đ | 40%   | 0 đ          |
| **Tổng**  |          |             |       | **18.452.000 đ** |

---

## Ghế (Seat Deduction)

Hệ thống trừ ghế theo **tổng số hành khách** = `adults + children + infants`.

Nếu số ghế còn lại < tổng hành khách, API trả lỗi:
```json
{
  "statusCode": 400,
  "message": "Không đủ chỗ. Còn 2 chỗ, bạn cần 3 chỗ."
}
```

---

## Đầu ra (Response)

```json
{
  "id": "uuid-booking",
  "idUser": "uuid-user",
  "tour": { "...": "xem docs tour-type-query.md" },
  "departure": {
    "id": "uuid-departure",
    "tourCode": "BTTDLHN20260715",
    "departureDate": "2026-07-15T00:00:00.000Z",
    "availableSeats": 17,
    "price": 6590000
  },
  "quantity": 3,
  "passengers": {
    "adults": 2,
    "adultUnitPrice": 6590000,
    "adultTotal": 13180000,
    "children": 1,
    "childUnitPrice": 5272000,
    "childTotal": 5272000,
    "infants": 0,
    "infantUnitPrice": 2636000,
    "infantTotal": 0
  },
  "originalPrice": 18452000,
  "discountAmount": 1845200,
  "price": 16606800,
  "paymentMethod": "AT_OFFICE",
  "voucher": null,
  "notice": "Cần hỗ trợ xe lăn",
  "status": "PENDING",
  "createdAt": "2026-06-15T12:00:00.000Z",
  "updatedAt": "2026-06-15T12:00:00.000Z"
}
```

### Mô tả trường `passengers`

| Trường           | Kiểu   | Mô tả                                              |
|------------------|--------|----------------------------------------------------|
| `adults`         | number | Số người lớn                                       |
| `adultUnitPrice` | number | Giá 1 người lớn (= `departure.price`)              |
| `adultTotal`     | number | `adults × adultUnitPrice`                          |
| `children`       | number | Số trẻ em                                          |
| `childUnitPrice` | number | Giá 1 trẻ em (= `departure.price × 0.8`)           |
| `childTotal`     | number | `children × childUnitPrice`                        |
| `infants`        | number | Số em bé                                           |
| `infantUnitPrice`| number | Giá 1 em bé (= `departure.price × 0.4`)            |
| `infantTotal`    | number | `infants × infantUnitPrice`                        |

### Mô tả trường giá

| Trường          | Mô tả                                                               |
|-----------------|---------------------------------------------------------------------|
| `quantity`      | Tổng hành khách = `adults + children + infants`                     |
| `originalPrice` | Tổng tiền trước khi áp voucher                                      |
| `discountAmount`| Số tiền được giảm (= `originalPrice - price`)                       |
| `price`         | Tiền thanh toán thực tế sau giảm giá                                |

---

## Quy tắc độ tuổi (gợi ý cho FE hiển thị)

| Loại hành khách | Độ tuổi       | Tỷ lệ giá |
|-----------------|---------------|-----------|
| Người lớn       | Từ 16 tuổi    | 100%      |
| Trẻ em          | 2 – 15 tuổi   | 80%       |
| Em bé           | Dưới 2 tuổi   | 40%       |

> Em bé vẫn **chiếm 1 ghế** trên hệ thống. Nếu tour không tính ghế cho em bé, liên hệ backend để điều chỉnh.

---

## Các trạng thái booking (`status`)

| Giá trị     | Ý nghĩa                             |
|-------------|-------------------------------------|
| `PENDING`   | Chờ xác nhận                        |
| `CONFIRMED` | Đã xác nhận                         |
| `PAID`      | Đã thanh toán                       |
| `ONGOING`   | Đang thực hiện tour                 |
| `COMPLETED` | Tour hoàn thành — người dùng được cộng điểm |
| `CANCELLED` | Đã hủy — ghế được hoàn lại         |
| `REFUNDED`  | Đã hoàn tiền — ghế được hoàn lại   |
