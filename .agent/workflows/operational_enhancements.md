---
description: Implementation Plan for Operational Enhancements (Crews & Manifest)
---

# Operational Enhancements (Crews & Manifest)

This plan covers the implementation of "Crucial for Business" operational features: Crew Management and Digital Passenger Manifest/QR Check-in.

## 1. Database Updates (`server/database.cjs`)
- [ ] Create `crews` table:
    - `id` (PK)
    - `name` (TEXT)
    - `role` (TEXT) - 'Driver', 'Conductor'
    - `phone` (TEXT)
    - `status` (TEXT) - 'Active', 'Off-duty'
    - `assigned_bus_id` (FK to armadas, optional)
- [ ] Update `bookings` table:
    - Add `check_in_status` (TEXT) - 'pending', 'checked_in', 'no_show'.
    - Add `qr_code` (TEXT) - Unique token for QR.

## 2. Backend API (`server/server.cjs`)
- [ ] **Crew API:**
    - `GET /api/admin/crews` - List all crews.
    - `POST /api/admin/crews` - Create new crew.
    - `DELETE /api/admin/crews/:id` - Delete crew.
- [ ] **Booking Check-in API:**
    - `POST /api/admin/bookings/checkin/:id` - Update status to 'checked_in'.
    - `POST /api/admin/bookings/noshow/:id` - Update status to 'no_show'.

## 3. Frontend - Crew Management (`resources/js/Pages/Admin/Crews.jsx`)
- [ ] Create new page `Crews.jsx`.
- [ ] List Crews with status badges.
- [ ] Form to add new crew member.
- [ ] Add link in `AdminLayout`.

## 4. Frontend - Digital Manifest Upgrade (`resources/js/Pages/Admin/Bookings.jsx`)
- [ ] Add "Check-in Status" column.
- [ ] Add "Scan QR" button (Simulated Modal).
    - Modal shows a mock camera view.
    - Input field to manually enter Booking ID (simulating QR scan).
    - Success animation "Passenger Boarded".
- [ ] Add toggles for visual status (Boarded/No Show).

## 5. Frontend - Ticket View (`resources/js/Pages/Booking/Ticket.jsx`) - Optional/Next
- [ ] If time permits, create a client-side view to see the QR code.
