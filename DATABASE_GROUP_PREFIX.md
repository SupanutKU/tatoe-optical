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


## Product catalog API

`group_products` is the single source of truth forสินค้าในหน้าร้านและ Virtual Try-On.

- `GET /api/products` → อ่านสินค้า
- `POST /api/products` → เพิ่มสินค้า (admin JWT)
- `PUT /api/products/:id` → แก้ไขสินค้า (admin JWT)
- `DELETE /api/products/:id` → ลบสินค้า (admin JWT)

โครงสร้างเริ่มต้นอยู่ที่ `database/group_products.sql` และ backend จะตรวจ/สร้างตารางให้เมื่อเริ่มทำงาน
