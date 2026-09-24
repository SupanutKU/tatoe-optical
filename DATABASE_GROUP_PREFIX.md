# Database ที่ใช้กับโปรเจกต์

โปรเจกต์นี้ถูกปรับให้ backend อ้างอิง schema ใน `database/group.sql`

ตารางหลักที่ใช้ชื่อขึ้นต้นด้วย `group_`:
- `group_users`
- `group_products`
- `group_cart`
- `group_orders`
- `group_order_items`
- `group_prescriptions`
- `group_wishlist`
- `group_coupons`

Backend login/register/reset password:
- สมาชิก: `group_users`
- OTP reset: `password_resets`

ให้ import `database/group.sql` เข้า database `ip_std6730251514` ก่อนรัน backend
