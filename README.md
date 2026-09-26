# TATOE Optical (แว่นตาตาโต)

ร้านแว่นตาออนไลน์ — เดิมชื่อ "แว่นตาตาโต - Big Eye Optical" เปลี่ยนชื่อแบรนด์เป็น **TATOE Optical**
และเชื่อมต่อระบบสมาชิก (เข้าสู่ระบบ / สมัครสมาชิก / ลืมรหัสผ่าน) เข้ากับฐานข้อมูล MySQL จริง
โดยนำระบบ login + ลืมรหัสผ่าน (OTP ทางอีเมล) มาจากโปรเจกต์ `login-app` มาปรับให้ใช้กับหน้าเว็บนี้
(Vite + React) และต่อกับตาราง `group` ตามสคีมาที่ให้มา (`group.sql`)

โครงสร้างโปรเจกต์:

```
tatoe-optical/
├── src/                      # เว็บแอป React (หน้าร้าน + login/register/forgot-password)
├── backend/                  # Express API สำหรับระบบสมาชิก (ต่อ MySQL)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── database/
│   ├── group.sql             # สคีมาต้นฉบับที่ให้มา (ตาราง `group`)
│   └── tatoe_schema.sql      # migration เพิ่มคอลัมน์ password/role + ตาราง password_resets
└── .env.example               # ตั้งค่า VITE_API_URL ให้ frontend รู้จัก backend
```

## 1) เตรียมฐานข้อมูล MySQL

1. สร้างฐานข้อมูลแล้ว import `database/group.sql` (ตารางเดิมตามที่ให้มา)
2. รันต่อด้วย `database/tatoe_schema.sql` เพื่อเพิ่มคอลัมน์ `password`, `role` และตาราง
   `password_resets` ที่ระบบ login ต้องใช้ (หรือปล่อยให้ backend สร้างให้อัตโนมัติตอนเริ่มรันก็ได้
   — ดูข้อ 2)

## 2) รัน backend (ระบบ login / สมัครสมาชิก / ลืมรหัสผ่าน)

```bash
cd backend
npm install
cp .env.example .env   # แก้ DB_HOST / DB_USER / DB_PASSWORD / DB_NAME ให้ตรงกับเครื่องจริง
npm run dev
```

ต้องเห็นข้อความ `TATOE Optical auth backend running at http://localhost:3113`

- ถ้ายังไม่ได้ตั้งค่า `RESEND_API_KEY` ระบบลืมรหัสผ่านจะยัง**ทำงานได้ปกติ** แต่จะพิมพ์รหัส OTP
  ออกทาง console ของ backend แทนการส่งอีเมลจริง (สะดวกตอนทดสอบ)
- สมัครฟรีที่ https://resend.com เพื่อให้ส่งอีเมล OTP จริงได้ (100 อีเมล/วันฟรี)

### Endpoints

| Method | Path                      | คำอธิบาย                              |
|--------|---------------------------|----------------------------------------|
| POST   | `/api/register`           | สมัครสมาชิกใหม่                        |
| POST   | `/api/login`               | เข้าสู่ระบบ (อีเมล/เบอร์โทร + รหัสผ่าน) |
| POST   | `/api/forgot-password`     | ขอรหัส OTP ไปทางอีเมล                  |
| POST   | `/api/verify-otp`          | ยืนยันรหัส OTP → ได้ resetToken        |
| POST   | `/api/reset-password`      | ตั้งรหัสผ่านใหม่ด้วย resetToken        |

## 3) รันเว็บแอป (frontend)

```bash
npm install
cp .env.example .env.local   # ตรวจว่า VITE_API_URL ชี้ไปที่ backend (ค่าเริ่มต้น http://localhost:3113)
npm run dev
```

เปิดแอป แล้วไปที่หน้า "เข้าสู่ระบบ" (`login`) — สมัครสมาชิกใหม่ได้จากลิงก์ "สมัครสมาชิก"
หรือกด "ลืมรหัสผ่าน?" เพื่อทดสอบขั้นตอนขอ OTP → ยืนยัน OTP → ตั้งรหัสผ่านใหม่

> หน้าอื่น ๆ ของร้าน (หน้าแรก, ตะกร้า, ออเดอร์ ฯลฯ) ยังใช้ข้อมูลตัวอย่าง (mock data) เหมือนเดิม
> เพื่อไม่ให้กระทบฟีเจอร์ที่มีอยู่แล้ว — ส่วนที่เชื่อมฐานข้อมูลจริงในรอบนี้คือระบบสมาชิกเท่านั้น
> (login / register / forgot-password) ตามที่ร้องขอ

## หมายเหตุเรื่องสคีมา `group`

ตาราง `group` ที่ให้มาเป็นตารางเดียวที่รวมข้อมูลสมาชิก + สินค้า + ตะกร้า + ออเดอร์ไว้ในแถวเดียวกัน
(ไม่ได้แยกเป็นหลายตารางแบบปกติ) ระบบ login ที่เพิ่มเข้ามาจึงใช้ `group_id` เป็นรหัสสมาชิก และ
ใช้เฉพาะคอลัมน์ `user_name`, `email`, `phone`, `password`, `role` และคอลัมน์โปรไฟล์อื่น ๆ
(avatar_url, member_tier, member_points, shipping_address, prescription_*) สำหรับผู้ใช้แต่ละคน
โดยไม่แตะคอลัมน์ฝั่งสินค้า/ตะกร้า/ออเดอร์ในตารางเดียวกัน — หากจะขยายระบบต่อ (เช่นเชื่อมตะกร้า/ออเดอร์จริง)
แนะนำให้แยกเป็นตาราง `orders`, `cart_items` ต่างหากในอนาคตเพื่อไม่ให้ข้อมูลซ้ำซ้อน

## 3D Virtual Try-On update

The Virtual Try-On screen now uses a transparent real-time 3D rendering layer on top of the live camera. MediaPipe continues to provide face landmarks, while the 3D glasses renderer follows eye position, face scale, head yaw and roll.

- Live camera uses a parametric 3D glasses frame, so it works without a local GLB asset.
- Each product can optionally define `model3d` and per-model fit values in the `Product` type for future GLB/GLTF integration.
- The 3D renderer is loaded from the official Babylon.js CDN at runtime.
- Upload/captured-photo mode keeps the existing 2D image overlay path.
