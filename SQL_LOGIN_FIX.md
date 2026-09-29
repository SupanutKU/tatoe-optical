# SQL Login Fix

ระบบ Login ถูกตั้งให้เรียก SQL backend โดยตรงผ่าน `VITE_API_URL` และไม่ fallback ไปยัง mock authentication ของ `server.ts` เมื่อมี URL backend กำหนดไว้

## Frontend
`.env` ต้องมี:

```env
VITE_API_URL=http://YOUR-SQL-BACKEND-IP:3113
```

## Backend
รันจากโฟลเดอร์ `backend`:

```bash
npm install
npm start
```

Backend ใช้ MySQL จาก `backend/.env` และตารางสมาชิก `group_users`.

## Login request

`POST /api/login`

```json
{
  "emailOrPhone": "customer@example.com",
  "password": "your-password"
}
```

Backend ตรวจ password ด้วย bcrypt และส่ง JWT กลับมาเมื่อถูกต้อง

## สำคัญ
ห้ามใช้ `npm run dev` ของ root เป็นตัว auth backend หากต้องการ SQL authentication เพราะ `server.ts` มี mock/in-memory authentication สำหรับ local fallback อยู่เดิม ให้รัน `backend/server.js` สำหรับ authentication SQL.
