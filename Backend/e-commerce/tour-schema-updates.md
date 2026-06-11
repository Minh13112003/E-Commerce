# Tour & Booking Schema Updates — Vibe Coding Prompt

## Context
NestJS + Prisma + PostgreSQL (Supabase) e-commerce project for tour booking.

---

## 1. Prisma Schema Changes

### 1.1 Add new model `Departure` to `Tour`

Add the following model to `schema.prisma`:

```prisma
model Departure {
  id             String    @id @default(uuid())
  tourCode       String    @unique // Formula: BTT + first 5 uppercase letters of tour name abbreviation + departure date (yyyymmdd). Example: BTTDLMT20260610
  tourId         String
  departureDate  DateTime  // Departure date
  availableSeats Int       // Number of available seats
  price          Decimal   @db.Decimal(15, 2) // Price per person for this departure
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  tour           Tour      @relation(fields: [tourId], references: [id], onDelete: Cascade)
  bookings       Booking[]

  @@index([tourId])
  @@index([departureDate])
  @@map("departures")
}
```

### 1.2 Update `Tour` model

- **Remove** the `price` field from the `Tour` model (price is now managed per `Departure`)
- **Add** the `departures` relation field:

```prisma
model Tour {
  // ... existing fields ...
  // REMOVE: price Decimal @db.Decimal(15, 2)

  departures    Departure[]  // Add this relation

  // ... rest of existing fields ...
}
```

### 1.3 Update `Booking` model

- **Replace** existing status field with `BookingStatus` enum
- **Add** `paymentMethod` field
- **Add** `departureId` foreign key (replace or supplement existing tour relation)

```prisma
enum BookingStatus {
  PENDING    // Awaiting confirmation
  CONFIRMED  // Tour confirmed
  PAID       // Payment completed
  ONGOING    // Tour in progress
  COMPLETED  // Tour ended
  CANCELLED  // Booking cancelled
  REFUNDED   // Payment refunded
}

enum PaymentMethod {
  AT_OFFICE          // Pay at office
  BANK_TRANSFER      // Bank transfer
}

model Booking {
  // ... existing fields ...

  departureId    String
  status         BookingStatus  @default(PENDING)
  paymentMethod  PaymentMethod

  departure      Departure      @relation(fields: [departureId], references: [id])

  // ... rest of existing fields ...
}
```

---

## 2. CRUD for `Departure`

### 2.1 Generate files

```bash
nest g module modules/departures
nest g controller modules/departures
nest g service modules/departures
```

### 2.2 Create DTOs

**`create-departure.dto.ts`**
```typescript
export class CreateDepartureDto {
  tourId: string;
  departureDate: Date;   // Departure date
  availableSeats: number; // Number of available seats
  price: number;          // Price per person
}
```

**`update-departure.dto.ts`**
```typescript
export class UpdateDepartureDto extends PartialType(CreateDepartureDto) {}
```

### 2.3 Auto-generate `tourCode`

In `DeparturesService`, implement `tourCode` generation logic:

```typescript
private generateTourCode(tourName: string, departureDate: Date): string {
  // Take first letter of each word in tour name, max 5 letters, uppercase
  const abbreviation = tourName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 5);

  // Format date as yyyymmdd
  const dateStr = departureDate.toISOString().slice(0, 10).replace(/-/g, '');

  return `BTT${abbreviation}${dateStr}`;
  // Example: "Du lịch miền tây" → BTTDLMT20260610
}
```

### 2.4 CRUD Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/departures` | Create new departure |
| GET | `/api/v1/departures` | Get all departures (with pagination) |
| GET | `/api/v1/departures/:id` | Get departure by ID |
| GET | `/api/v1/departures/tour/:tourId` | Get all departures for a tour |
| PATCH | `/api/v1/departures/:id` | Update departure |
| DELETE | `/api/v1/departures/:id` | Delete departure |

---

## 3. Update Booking Logic

### 3.1 Create Booking — Deduct available seats

When a new booking is created:

1. Check if `departure.availableSeats > 0` — if `0`, throw `BadRequestException`
2. Create the booking
3. Decrement `availableSeats` by 1 (use Prisma transaction)

```typescript
async createBooking(dto: CreateBookingDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Check available seats
    const departure = await tx.departure.findUnique({
      where: { id: dto.departureId },
    });

    if (!departure) throw new NotFoundException('Departure not found');
    if (departure.availableSeats <= 0) {
      throw new BadRequestException('No available seats for this departure');
    }

    // 2. Create booking
    const booking = await tx.booking.create({
      data: {
        ...dto,
        status: BookingStatus.PENDING,
      },
    });

    // 3. Decrement available seats
    await tx.departure.update({
      where: { id: dto.departureId },
      data: { availableSeats: { decrement: 1 } },
    });

    return booking;
  });
}
```

### 3.2 Update Booking Status — Restore seats on CANCELLED or REFUNDED

When booking status is updated:

- If new status is `CANCELLED` or `REFUNDED` → **increment** `availableSeats` by 1
- If new status is `COMPLETED` → **add** points to user's `rewardPoints` and `earnedPoints`

```typescript
async updateBookingStatus(id: string, status: BookingStatus) {
  return this.prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { departure: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Restore seats if CANCELLED or REFUNDED
    if (status === BookingStatus.CANCELLED || status === BookingStatus.REFUNDED) {
      await tx.departure.update({
        where: { id: booking.departureId },
        data: { availableSeats: { increment: 1 } },
      });
    }

    // Add reward points if COMPLETED
    if (status === BookingStatus.COMPLETED) {
      const pointsToAdd = 10; // Define your points logic here
      await tx.user.update({
        where: { id: booking.userId },
        data: {
          rewardPoints: { increment: pointsToAdd },
          earnedPoints: { increment: pointsToAdd },
        },
      });
    }

    // Update booking status
    return tx.booking.update({
      where: { id },
      data: { status },
    });
  });
}
```

---

## 4. Model `Notification`

### 4.1 Add to `schema.prisma`

```prisma
enum NotificationType {
  PASSWORD_CHANGED     // User updated password
  BOOKING_CREATED      // User placed a booking
  BOOKING_STATUS_UPDATED // Booking status changed
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@map("notifications")
}
```

Add relation to `User` model:
```prisma
model User {
  // ... existing fields ...
  notifications Notification[]
}
```

### 4.2 Create `NotificationsService`

```bash
nest g module modules/notifications
nest g controller modules/notifications
nest g service modules/notifications
```

### 4.3 `NotificationsService` implementation

```typescript
// notifications.service.ts
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, message },
    });
  }

  // Get all notifications for current user (with pagination)
  async getMyNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data, total, page, limit };
  }

  // Mark notification as read
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
```

### 4.4 Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Get my notifications (auth required) |
| PATCH | `/api/v1/notifications/:id/read` | Mark one as read |
| PATCH | `/api/v1/notifications/read-all` | Mark all as read |

### 4.5 Trigger notifications in other services

**When user changes password** — in `UsersService.updatePassword()`:
```typescript
await this.notificationsService.createNotification(
  userId,
  NotificationType.PASSWORD_CHANGED,
  'Password Updated',
  'Your password has been successfully updated.',
);
```

**When booking is created** — in `BookingsService.createBooking()`:
```typescript
await this.notificationsService.createNotification(
  booking.userId,
  NotificationType.BOOKING_CREATED,
  'Booking Confirmed',
  `Your booking #${booking.id} has been placed successfully. Status: PENDING.`,
);
```

**When booking status changes** — in `BookingsService.updateBookingStatus()`:
```typescript
const statusMessages: Record<BookingStatus, string> = {
  CONFIRMED:  'Your booking has been confirmed.',
  PAID:       'Payment received. Thank you!',
  ONGOING:    'Your tour is now in progress. Enjoy!',
  COMPLETED:  'Your tour has ended. Thank you for traveling with us!',
  CANCELLED:  'Your booking has been cancelled.',
  REFUNDED:   'Your refund has been processed.',
  PENDING:    'Your booking is awaiting confirmation.',
};

await this.notificationsService.createNotification(
  booking.userId,
  NotificationType.BOOKING_STATUS_UPDATED,
  'Booking Status Updated',
  statusMessages[status],
);
```

---

## 5. Admin API — Update Booking Status

### 5.1 Endpoint

```
PATCH /api/v1/bookings/:id/status
```

- **Guard**: `JwtAuthGuard` + `RolesGuard` — only `ADMIN` role allowed
- **Body**: `{ "status": "CONFIRMED" }`

### 5.2 DTO

```typescript
// update-booking-status.dto.ts
import { IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
```

### 5.3 Controller

```typescript
// bookings.controller.ts
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiOperation({ summary: 'Update booking status (Admin only)' })
async updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateBookingStatusDto,
) {
  return this.bookingsService.updateBookingStatus(id, dto.status);
}
```

### 5.4 Duplicate Status Check

In `BookingsService.updateBookingStatus()`, **always check for duplicate status first**:

```typescript
async updateBookingStatus(id: string, status: BookingStatus) {
  return this.prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      include: { departure: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // ✅ DUPLICATE STATUS CHECK — prevent updating to same status
    if (booking.status === status) {
      throw new BadRequestException(
        `Booking is already in status: ${status}`,
      );
    }

    // Restore seats if CANCELLED or REFUNDED
    if (status === BookingStatus.CANCELLED || status === BookingStatus.REFUNDED) {
      await tx.departure.update({
        where: { id: booking.departureId },
        data: { availableSeats: { increment: 1 } },
      });
    }

    // Add reward points if COMPLETED
    // Points = final price after voucher discount
    if (status === BookingStatus.COMPLETED) {
      // booking.finalPrice is the price after voucher applied
      const pointsToAdd = Math.floor(Number(booking.finalPrice));

      await tx.user.update({
        where: { id: booking.userId },
        data: {
          rewardPoints: { increment: pointsToAdd },
          earnedPoints: { increment: pointsToAdd },
        },
      });
    }

    // Update booking status
    const updated = await tx.booking.update({
      where: { id },
      data: { status },
    });

    // Send notification to user
    await this.notificationsService.createNotification(
      booking.userId,
      NotificationType.BOOKING_STATUS_UPDATED,
      'Booking Status Updated',
      `Your booking status has been updated to: ${status}`,
    );

    return updated;
  });
}
```

### 5.5 Add `finalPrice` to `Booking` model

`finalPrice` stores the price **after voucher discount** — used for points calculation:

```prisma
model Booking {
  // ... existing fields ...
  finalPrice  Decimal  @db.Decimal(15, 2) // Price after voucher discount applied
}
```

When creating booking, calculate `finalPrice`:
```typescript
// In createBooking()
const originalPrice = departure.price;
let finalPrice = originalPrice;

if (dto.voucherId) {
  const voucher = await tx.voucher.findUnique({ where: { id: dto.voucherId } });
  if (voucher) {
    // Apply discount (example: percentage discount)
    finalPrice = originalPrice * (1 - voucher.discountPercent / 100);
  }
}

const booking = await tx.booking.create({
  data: {
    ...dto,
    finalPrice,
    status: BookingStatus.PENDING,
  },
});
```

---

## 6. Migration

After all schema changes, run:

```bash
npx prisma migrate dev --name add_departure_notification_booking_updates
npx prisma generate
```

---

## 7. Summary of All Changes

| Area | Change |
|------|--------|
| `Tour` model | Remove `price` field, add `departures` relation |
| New `Departure` model | `tourCode`, `tourId`, `departureDate`, `availableSeats`, `price` |
| `Booking` model | Add `departureId`, `status` → `BookingStatus` enum, add `paymentMethod`, add `finalPrice` |
| New `BookingStatus` enum | PENDING, CONFIRMED, PAID, ONGOING, COMPLETED, CANCELLED, REFUNDED |
| New `PaymentMethod` enum | AT_OFFICE, BANK_TRANSFER |
| New `Notification` model | `userId`, `type`, `title`, `message`, `isRead` |
| New `NotificationType` enum | PASSWORD_CHANGED, BOOKING_CREATED, BOOKING_STATUS_UPDATED |
| New CRUD | Full CRUD for `Departure` |
| New CRUD | GET + PATCH for `Notification` |
| Booking logic | Deduct seat on create, restore seat on CANCELLED/REFUNDED |
| Points logic | On COMPLETED → add `finalPrice` (after voucher) to `rewardPoints` + `earnedPoints` |
| Admin API | `PATCH /bookings/:id/status` — admin only, with duplicate status check |
| Notifications | Triggered on: password change, booking created, booking status updated |
| User model | Ensure `rewardPoints`, `earnedPoints`, `notifications` relation exist |
