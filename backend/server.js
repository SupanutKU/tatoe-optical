const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3113;
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// MySQL connection pool
// ระบบสมาชิก (login/register/forgot-password) ของ TATOE Optical ใช้ตาราง `group`
// ตามไฟล์ group.sql ที่มีอยู่แล้ว (เพิ่มคอลัมน์ password/role ให้ผ่าน migration,
// ดู database/tatoe_schema.sql) แทนที่จะสร้างตาราง users แยกใหม่
// =====================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ip_std6730251514",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// =====================================================
// เตรียมตารางที่จำเป็นให้ครบตอน backend เริ่มทำงาน (ไม่ต้องรัน migration แยก)
// - `group`.password / `group`.role : เผื่อยังไม่ได้รัน database/tatoe_schema.sql
// - password_resets : เก็บ OTP สำหรับขั้นตอนลืมรหัสผ่าน
// =====================================================

async function ensurePasswordResetsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expiresAt DATETIME NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 0,
      used TINYINT(1) NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function bootstrap() {
  try {
    await ensurePasswordResetsTable();
    console.log("Database ready: `group_users` + `password_resets`");
  } catch (err) {
    console.error("DB BOOTSTRAP ERROR:", err);
  }
}
bootstrap();

// =====================================================
// ตัวส่งอีเมล OTP — ใช้ Resend ถ้ามี RESEND_API_KEY ตั้งค่าไว้ (ดู backend/.env.example)
// ถ้ายังไม่ได้ตั้งค่า ระบบจะพิมพ์ OTP ออกทาง console แทน เพื่อให้ทดสอบตอน dev ได้ทันที
// =====================================================
let resend = null;
if (process.env.RESEND_API_KEY) {
  const { Resend } = require("resend");
  resend = new Resend(process.env.RESEND_API_KEY);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, otp) {
  if (!resend) {
    console.log(`[DEV] OTP สำหรับ ${toEmail}: ${otp} (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที)`);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "TATOE Optical <onboarding@resend.dev>",
    to: toEmail,
    subject: "รหัส OTP สำหรับตั้งรหัสผ่านใหม่ - TATOE Optical",
    text: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที) หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color:#3b82f6; margin: 0 0 12px;">TATOE Optical</h2>
        <p style="margin: 0 0 16px;">รหัส OTP สำหรับตั้งรหัสผ่านใหม่ของคุณคือ</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 0 0 16px;">${otp}</p>
        <p style="margin: 0 0 16px;">รหัสนี้จะหมดอายุใน ${OTP_EXPIRES_MINUTES} นาที</p>
        <p style="color:#888; font-size: 12px; margin: 0;">หากคุณไม่ได้ร้องขอเปลี่ยนรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
    `,
  });

  if (error) throw error;
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "TATOE Optical auth API is running" });
});

// =====================================================
// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "TATOE Optical API", port: PORT });
});

// POST /api/register
// สร้างสมาชิกใหม่ -> เพิ่มแถวใหม่ในตาราง `group` (group_id = user id)
// รหัสผ่านถูก hash ด้วย bcrypt ก่อนเก็บลงคอลัมน์ password เสมอ
// =====================================================
app.post("/api/register", async (req, res) => {
  try {
    const { user_name, email, phone, password } = req.body || {};

    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน",
      });
    }

    const cleanUserName = String(user_name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;

    if (cleanUserName.length < 2) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร" });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const [existing] = await pool.query(
      "SELECT user_id FROM `group_users` WHERE email = ? LIMIT 1",
      [cleanEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await pool.query(
      `INSERT INTO \`group_users\`
        (user_name, email, phone, password, role, member_tier, member_points)
      VALUES (?, ?, ?, ?, 'customer', 'Member', 0)`,
      [cleanUserName, cleanEmail, cleanPhone, passwordHash]
    );

    return res.status(201).json({ success: true, message: "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/login
// ตรวจสอบด้วยอีเมลหรือเบอร์โทร + รหัสผ่าน (เทียบกับ bcrypt hash ในคอลัมน์ password)
// ถ้าถูกต้อง จะออก JWT อายุ 7 วัน
// =====================================================
app.post("/api/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body || {};

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอกอีเมล/เบอร์โทร และรหัสผ่าน" });
    }

    const identifier = String(emailOrPhone).trim();

    const [rows] = await pool.query(
      "SELECT * FROM `group_users` WHERE email = ? OR phone = ? ORDER BY user_id DESC LIMIT 1",
      [identifier.toLowerCase(), identifier]
    );

    if (rows.length === 0 || !rows[0].password) {
      return res.status(401).json({ success: false, message: "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const account = rows[0];
    const passwordMatches = await bcrypt.compare(String(password), account.password);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      {
        id: account.user_id,
        email: account.email,
        role: account.role || "customer"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: account.user_id,
        user_name: account.user_name,
        email: account.email,
        phone: account.phone,
        role: account.role || "customer",
        avatar_url: account.avatar_url,
        member_tier: account.member_tier,
        member_points: account.member_points,
        shipping_address: account.shipping_address
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/forgot-password
// รับ email -> ถ้ามีสมาชิกอยู่จริงจะสร้าง OTP 6 หลักและส่งอีเมล
// ตอบข้อความเดียวกันเสมอไม่ว่าจะเจออีเมลในระบบหรือไม่ (กันการไล่เดาอีเมล)
// =====================================================
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    const genericMessage = `ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP ไปให้ทางอีเมลแล้ว (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที) กรุณาตรวจสอบกล่องจดหมาย รวมถึง Junk/Spam ด้วย`;

    const [users] = await pool.query(
      "SELECT user_id FROM `group_users` WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.json({ success: true, message: genericMessage });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await pool.query(
      "UPDATE `group_users` SET password = ?, updated_at = NOW() WHERE email = ?",
      [passwordHash, payload.email]
    );

    try {
      await sendOtpEmail(cleanEmail, otp);
    } catch (mailErr) {
      console.error("SEND OTP EMAIL ERROR:", mailErr);
      return res.status(500).json({
        success: false,
        message: "ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า RESEND_API_KEY ใน backend/.env",
      });
    }

    return res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/verify-otp
// ตรวจ OTP -> ถ้าถูกต้อง ยังไม่หมดอายุ ยังไม่เคยถูกใช้ จะออก resetToken (JWT อายุ 10 นาที)
// =====================================================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: "กรุณากรอกอีเมลและรหัส OTP" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "รหัส OTP ไม่ถูกต้อง" });
    }

    const resetRow = rows[0];

    if (new Date(resetRow.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่" });
    }

    await pool.query("UPDATE password_resets SET verified = 1 WHERE id = ?", [resetRow.id]);

    const resetToken = jwt.sign(
      { email: cleanEmail, resetId: resetRow.id, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/reset-password
// ใช้ resetToken จาก /api/verify-otp ยืนยันตัวตน แล้วอัปเดตรหัสผ่านใหม่ (hash ด้วย bcrypt)
// =====================================================
app.post("/api/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: "เซสชันสำหรับตั้งรหัสผ่านใหม่หมดอายุแล้ว กรุณาขอ OTP ใหม่",
      });
    }

    if (payload.purpose !== "password_reset") {
      return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
    }

    const [resetRows] = await pool.query(
      "SELECT * FROM password_resets WHERE id = ? AND email = ? LIMIT 1",
      [payload.resetId, payload.email]
    );

    if (resetRows.length === 0 || !resetRows[0].verified || resetRows[0].used) {
      return res.status(401).json({
        success: false,
        message: "คำขอนี้ถูกใช้ไปแล้วหรือไม่ถูกต้อง กรุณาขอ OTP ใหม่",
      });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await pool.query(
      "UPDATE `group` SET password = ?, updated_at = NOW() WHERE email = ?",
      [passwordHash, payload.email]
    );

    await pool.query("UPDATE password_resets SET used = 1 WHERE id = ?", [payload.resetId]);

    return res.json({
      success: true,
      message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`TATOE Optical auth backend running at http://localhost:${PORT}`);
});
